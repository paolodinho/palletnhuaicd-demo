/* Bộ công cụ tính toán pallet. Mỗi công cụ khai báo calc(v) trả về { html, text } | { empty } | { errs: { ô: thông báo } }. */
(function () {
  'use strict';
  var D = window.ICD_TOOLS || {};
  var root = document.querySelector('[data-tool]');
  if (!root) return;
  var form = root.querySelector('form');
  var out = root.querySelector('[data-res]');
  var btnCopy = root.querySelector('[data-copy]');
  var btnShare = root.querySelector('[data-share]');
  var msgEl = root.querySelector('[data-msg]');
  var slug = root.getAttribute('data-tool');
  var emptyDefault = out.textContent.trim();
  var lastText = '';

  /* ---------- Số ---------- */
  function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/\s+/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? parseFloat(s) : NaN;
  }
  var fmtCache = {};
  function nf(n, d) {
    if (n == null || !isFinite(n)) return '-';
    d = d == null ? 0 : d;
    if (!fmtCache[d]) fmtCache[d] = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: d });
    return fmtCache[d].format(Math.abs(n) < 1e-9 ? 0 : n);
  }
  function pct(x) { return nf(x * 100, 1) + '%'; }
  function fl(x) { return Math.floor(x + 1e-9); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mm(n) { return nf(n, 1) + ' mm'; }
  function kgs(n) { return nf(n, 1) + ' kg'; }
  function dim(a, b) { return nf(a, 1) + ' × ' + nf(b, 1) + ' mm'; }

  /* ---------- Xếp hình chữ nhật: lưới 2 vùng ----------
   * Thử: cùng hướng (2 hướng), chia theo chiều dài 2 vùng 2 hướng, chia theo chiều rộng 2 vùng 2 hướng.
   * g: khe hở giữa 2 vật (không có khe hở sát vách). Trả { best, pure, mixed, pureN:[hướng 1, hướng 2] }. */
  function pack(L, W, a, b, g) {
    g = g || 0;
    var LL = L + g, WW = W + g, O = [[a, b], [b, a]];
    var res = { best: null, pure: null, mixed: null, pureN: [0, 0] };
    function blk(x0, y0, o, c, r) { return { x0: x0, y0: y0, p: o[0], q: o[1], c: Math.max(0, c), r: Math.max(0, r) }; }
    function add(blocks) {
      var n = 0, oa = 0, ob = 0;
      blocks.forEach(function (k) { var m = k.c * k.r; n += m; if (k.p === a) oa += m; else ob += m; });
      var cand = { n: n, blocks: blocks, na: oa, nb: ob };
      if (!res.best || n > res.best.n) res.best = cand;
      if (oa && ob && (!res.mixed || n > res.mixed.n)) res.mixed = cand;
      return cand;
    }
    O.forEach(function (o, i) {
      var c = add([blk(0, 0, o, fl(LL / (o[0] + g)), fl(WW / (o[1] + g)))]);
      res.pureN[i] = c.n;
      if (!res.pure || c.n > res.pure.n) res.pure = c;
    });
    if (a !== b) {
      for (var i = 0; i < 2; i++) {
        var o1 = O[i], o2 = O[1 - i], P1 = o1[0] + g, Q1 = o1[1] + g, P2 = o2[0] + g, Q2 = o2[1] + g;
        var N = fl(LL / P1), M = fl(WW / Q1), n1, rem;
        for (n1 = 1; n1 <= N; n1++) {
          rem = LL - n1 * P1;
          add([blk(0, 0, o1, n1, fl(WW / Q1)), blk(n1 * P1, 0, o2, fl(rem / P2), fl(WW / Q2))]);
        }
        for (n1 = 1; n1 <= M; n1++) {
          rem = WW - n1 * Q1;
          add([blk(0, 0, o1, fl(LL / P1), n1), blk(0, n1 * Q1, o2, fl(LL / P2), fl(rem / Q2))]);
        }
      }
    }
    return res;
  }
  function rects(plan, g) {
    var list = [];
    if (!plan) return list;
    plan.blocks.forEach(function (k) {
      for (var c = 0; c < k.c; c++) for (var r = 0; r < k.r; r++) {
        list.push({ x: k.x0 + c * (k.p + g), y: k.y0 + r * (k.q + g), w: k.p, h: k.q, rot: k.p !== k.q && k.q > k.p });
      }
    });
    return list;
  }
  /* Sơ đồ nhìn từ trên. o: { base: {x,y,w,h} (mặt pallet, vẽ đứt), mirror, label, side } */
  function svgLayout(L, W, list, o) {
    o = o || {};
    var pad = Math.max(L, W) * 0.015;
    var s = '<svg class="lay" viewBox="' + [-pad, -pad, L + 2 * pad, W + 2 * pad].map(function (x) { return +x.toFixed(1); }).join(' ') +
      '" role="img" aria-label="' + esc(o.label || 'Sơ đồ xếp') + '" preserveAspectRatio="xMidYMid meet">';
    s += '<rect class="lay__box" x="0" y="0" width="' + L + '" height="' + W + '" vector-effect="non-scaling-stroke"/>';
    if (o.base) s += '<rect class="lay__base" x="' + o.base.x + '" y="' + o.base.y + '" width="' + o.base.w + '" height="' + o.base.h + '" vector-effect="non-scaling-stroke"/>';
    if (o.door) s += '<line class="lay__door" x1="' + L + '" y1="0" x2="' + L + '" y2="' + W + '" vector-effect="non-scaling-stroke"/>';
    if (list.length > 1500) return s + '</svg>';
    var label = list.length <= 120;
    list.forEach(function (r, i) {
      var x = o.mirror ? L - r.x - r.w : r.x, y = o.mirror ? W - r.y - r.h : r.y;
      s += '<rect class="' + (r.rot ? 'lay__b' : 'lay__a') + '" x="' + x + '" y="' + y + '" width="' + r.w + '" height="' + r.h + '" vector-effect="non-scaling-stroke"/>';
      if (label) {
        var fs = Math.min(r.w, r.h) * 0.34;
        s += '<text class="lay__t" x="' + (x + r.w / 2) + '" y="' + (y + r.h / 2) + '" font-size="' + fs.toFixed(1) + '" dominant-baseline="central" text-anchor="middle">' + (i + 1) + '</text>';
      }
    });
    return s + '</svg>';
  }
  function legend(aTxt, bTxt) {
    return '<ul class="rleg"><li><i class="rleg__a"></i>' + esc(aTxt) + '</li>' + (bTxt ? '<li><i class="rleg__b"></i>' + esc(bTxt) + '</li>' : '') + '</ul>';
  }
  function layoutName(plan, a, b, alongL) {
    if (a === b) return 'Một hướng (pallet vuông)';
    if (!plan.nb) return 'Cùng hướng, cạnh ' + nf(a) + ' mm dọc theo ' + alongL;
    if (!plan.na) return 'Cùng hướng, cạnh ' + nf(a) + ' mm ngang ' + alongL;
    return 'Trộn hướng: ' + plan.na + ' chiếc cạnh ' + nf(a) + ' mm dọc, ' + plan.nb + ' chiếc xoay ngang';
  }

  /* ---------- Khối HTML kết quả ---------- */
  function big(n, unit, sub) {
    return '<div class="rbig"><span class="rbig__n num">' + n + '</span><span class="rbig__u">' + esc(unit) + '</span></div>' + (sub ? '<p class="rsub">' + sub + '</p>' : '');
  }
  function list(rows) {
    return '<dl class="rlist">' + rows.filter(Boolean).map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
  }
  function notes(arr, cls) {
    return arr.length ? '<div class="' + (cls || 'rwarn') + '">' + arr.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>' : '';
  }
  function fig(svg, cap, leg) { return '<figure class="rfig">' + svg + (leg || '') + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>'; }
  function table(head, rows) {
    return '<div class="rtab-wrap"><table class="rtab"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr' + (r.hl ? ' class="is-best"' : '') + '>' + r.c.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function strip(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }

  /* ---------- Từng công cụ ---------- */
  var T = {};

  T['xep-pallet-container'] = {
    calc: function (v) {
      var t = +v.t || 1, g = v.g || 0;
      if (t === 2 && !v.h) return { errs: { h: 'Nhập chiều cao mỗi kiện để kiểm tra xếp 2 tầng.' } };
      var a = Math.max(v.pL, v.pW), b = Math.min(v.pL, v.pW);
      var pk2 = pack(v.cL, v.cW, a, b, g), best = pk2.best;
      if (!best.n) return { empty: 'Pallet lớn hơn lòng container, không xếp được.' };
      var ct = (D.containers || {})[v.ct], warn = [], tiers = t;
      if (v.h) {
        var fit = fl(v.cH / v.h);
        if (fit < 1) return { empty: 'Kiện cao ' + mm(v.h) + ', vượt chiều cao được phép xếp ' + mm(v.cH) + '.' };
        if (fit < t) { tiers = fit; warn.push('Không xếp được 2 tầng: 2 × ' + mm(v.h) + ' = ' + mm(2 * v.h) + ', vượt chiều cao được phép ' + mm(v.cH) + '. Kết quả tính theo 1 tầng.'); }
        if (ct && v.h > ct.dh) warn.push('Kiện cao ' + mm(v.h) + ', cao hơn cửa container (' + mm(ct.dh) + ' theo bảng của hãng tàu), không đưa vào qua cửa được.');
      }
      var perTier = best.n, byArea = perTier * tiers, total = byArea, byW = null, tot = null;
      if (v.kg) {
        byW = fl(v.cP / v.kg);
        if (byW < byArea) { total = byW; warn.push('Bị giới hạn bởi khối lượng: ' + nf(byArea) + ' kiện × ' + kgs(v.kg) + ' = ' + kgs(byArea * v.kg) + ', vượt khối lượng hàng tối đa ' + kgs(v.cP) + '. Chỉ chở được ' + nf(byW) + ' kiện.'); }
        tot = total * v.kg;
      }
      var area = pk2.best.n * a * b / (v.cL * v.cW);
      var name = layoutName(pk2.best, a, b, 'container');
      var ctName = ct ? ct.label : 'Container tự nhập';
      var sub = tiers > 1 ? nf(perTier) + ' pallet mỗi tầng × ' + tiers + ' tầng' : '1 tầng, ' + esc(ctName);
      if (total < byArea) sub = 'Giới hạn bởi khối lượng hàng tối đa. Mặt sàn xếp được ' + nf(byArea) + ' pallet' + (tiers > 1 ? ' (' + nf(perTier) + ' × ' + tiers + ' tầng)' : '') + '.';
      var html = big(nf(total), 'pallet', sub);
      html += list([
        ['Kiểu xếp', esc(name)],
        ['Diện tích sàn đã dùng', pct(area)],
        v.kg ? ['Khối lượng hàng', kgs(tot) + ' / ' + kgs(v.cP) + ' (' + pct(tot / v.cP) + ')'] : null,
        byW !== null ? ['Theo khối lượng tối đa', nf(byW) + ' kiện'] : null
      ]);
      html += notes(warn);
      html += fig(svgLayout(v.cL, v.cW, rects(pk2.best, g), { door: true, label: 'Sơ đồ ' + pk2.best.n + ' pallet trên sàn container' }),
        'Nhìn từ trên xuống, cửa container ở bên phải (vạch cam). Lòng ' + dim(v.cL, v.cW) + '.',
        a !== b ? legend('Cạnh ' + nf(a) + ' mm dọc container', pk2.best.nb ? 'Xoay ngang' : '') : '');
      html += table(['Cách xếp', 'Mỗi tầng'], [
        { c: ['Cạnh ' + nf(a) + ' mm dọc container', nf(pk2.pureN[0])], hl: pk2.best.n === pk2.pureN[0] && !pk2.best.nb },
        a !== b ? { c: ['Cạnh ' + nf(a) + ' mm ngang container', nf(pk2.pureN[1])], hl: pk2.best.n === pk2.pureN[1] && !pk2.best.na } : null,
        a !== b ? { c: ['Trộn hai hướng (tốt nhất)', pk2.mixed ? nf(pk2.mixed.n) : '-'], hl: !!(pk2.best.na && pk2.best.nb) } : null
      ].filter(Boolean));
      var text = 'Xếp pallet vào container (ICD Việt Nam)\n' + ctName + ', lòng ' + dim(v.cL, v.cW) + ', chiều cao xếp ' + mm(v.cH) +
        '\nPallet ' + dim(v.pL, v.pW) + (g ? ', khe hở ' + mm(g) : '') + '\nSố pallet: ' + nf(total) + (tiers > 1 ? ' (' + nf(perTier) + ' mỗi tầng × ' + tiers + ' tầng)' : '') +
        '\nKiểu xếp: ' + name + '\nDiện tích sàn đã dùng: ' + pct(area) + (v.kg ? '\nKhối lượng hàng: ' + kgs(tot) + ' / ' + kgs(v.cP) : '') +
        (warn.length ? '\nLưu ý: ' + warn.map(strip).join(' ') : '');
      return { html: html, text: text };
    }
  };

  T['xep-thung-len-pallet'] = {
    init: function () {
      var sel = form.elements.pm, key = '';
      this.refresh = function () {
        var L = parseNum(form.elements.pL.value), W = parseNum(form.elements.pW.value), k = L + 'x' + W;
        if (k === key) return;
        key = k;
        var cur = sel.value;
        while (sel.options.length > 1) sel.remove(1);
        (D.pallets || []).forEach(function (p, i) {
          if ((p.L === L && p.W === W) || (p.L === W && p.W === L)) {
            var o = document.createElement('option');
            o.value = String(i);
            o.textContent = p.t + ' - cao ' + nf(p.H) + ' mm' + (p.d ? ', tải động ' + nf(p.d) + ' kg' : '');
            sel.appendChild(o);
          }
        });
        sel.value = cur;
        if (sel.value !== cur) sel.value = '';
        sel.disabled = sel.options.length < 2;
        sel.options[0].textContent = sel.options.length < 2 ? 'Chưa có mẫu ICD Việt Nam cùng kích thước' : 'Không chọn, tự nhập bên dưới';
      };
      sel.addEventListener('change', function () {
        var p = (D.pallets || [])[+sel.value];
        if (sel.value === '' || !p) return;
        form.elements.pH.value = nf(p.H);
        form.elements.pD.value = p.d ? nf(p.d) : '';
      });
    },
    calc: function (v) {
      var oh = v.oh || 0, A = v.pL + 2 * oh, B = v.pW + 2 * oh;
      if (v.Hm <= v.pH) return { errs: { Hm: 'Phải lớn hơn chiều cao pallet (' + mm(v.pH) + ').' } };
      var layers = fl((v.Hm - v.pH) / v.bH);
      if (layers < 1) return { empty: 'Thùng cao ' + mm(v.bH) + ', không vừa khoảng trống ' + mm(v.Hm - v.pH) + ' phía trên pallet.' };
      var pk = pack(A, B, v.bL, v.bW, 0);
      if (!pk.best.n) return { empty: 'Thùng lớn hơn mặt pallet, không xếp được.' };
      var colN = pk.pure.n, mixN = pk.mixed ? pk.mixed.n : 0;
      var useMix = mixN >= colN && mixN > 0;
      var plan = useMix ? pk.mixed : pk.pure, per = plan.n, total = per * layers;
      var eff = per * v.bL * v.bW / (v.pL * v.pW);
      var warn = [], info = [];
      var height = v.pH + layers * v.bH;
      var weight = v.bKg ? total * v.bKg : null;
      if (weight && v.pD && weight > v.pD) {
        var maxL = fl(v.pD / (per * v.bKg));
        warn.push('Tổng khối lượng hàng ' + kgs(weight) + ' vượt tải trọng động ' + kgs(v.pD) + ' của pallet. ' +
          (maxL >= 1 ? 'Giảm xuống tối đa ' + maxL + ' lớp (' + nf(maxL * per) + ' thùng) hoặc chọn pallet tải trọng cao hơn.' : 'Một lớp đã vượt tải, cần pallet tải trọng cao hơn.'));
      }
      if (!v.bKg) info.push('Nhập khối lượng mỗi thùng để tính tổng khối lượng kiện.');
      else if (!v.pD) info.push('Nhập tải trọng động của pallet (hoặc chọn mẫu ICD Việt Nam) để kiểm tra quá tải.');
      if (!useMix && mixN) info.push('Xếp đan cho ' + nf(mixN) + ' thùng mỗi lớp, ít hơn xếp thẳng hàng ' + nf(colN - mixN) + ' thùng.');
      var model = (D.pallets || [])[+form.elements.pm.value];
      if (form.elements.pm.value === '') model = null;
      var html = big(nf(total), 'thùng', nf(per) + ' thùng mỗi lớp × ' + layers + ' lớp, ' + (useMix ? 'xếp đan' : 'xếp thẳng hàng'));
      html += list([
        ['Chiều cao kiện', mm(height) + ' (tối đa ' + mm(v.Hm) + ')'],
        ['Hiệu suất diện tích', pct(eff) + ' mặt pallet'],
        weight !== null ? ['Khối lượng hàng', kgs(weight) + (v.pD ? ' / tải động ' + kgs(v.pD) + ' (' + pct(weight / v.pD) + ')' : '')] : null,
        model ? ['Mẫu pallet', '<a href="' + esc(model.u) + '">' + esc(model.t) + '</a>'] : null
      ]);
      html += notes(warn);
      html += notes(info, 'rinfo');
      var base = oh ? { x: oh, y: oh, w: v.pL, h: v.pW } : null;
      var rl = rects(plan, 0), leg = v.bL !== v.bW && plan.na && plan.nb ? legend('Thùng cạnh ' + nf(Math.max(v.bL, v.bW)) + ' mm dọc pallet', 'Thùng xoay ngang') : '';
      if (useMix) {
        html += '<div class="rfig2">' + fig(svgLayout(A, B, rl, { base: base, label: 'Lớp lẻ' }), 'Lớp 1, 3, 5...') +
          fig(svgLayout(A, B, rl, { base: base, mirror: true, label: 'Lớp chẵn' }), 'Lớp 2, 4, 6... (xoay 180°)') + '</div>' + leg;
      } else {
        html += fig(svgLayout(A, B, rl, { base: base, label: 'Sơ đồ một lớp' }), 'Một lớp nhìn từ trên xuống, mọi lớp giống nhau.' + (oh ? ' Nét đứt là mép pallet.' : ''), leg);
      }
      html += table(['Cách xếp', 'Mỗi lớp', 'Tổng'], [
        { c: ['Thẳng hàng', nf(colN), nf(colN * layers)], hl: !useMix },
        { c: ['Xếp đan', mixN ? nf(mixN) : '-', mixN ? nf(mixN * layers) : '-'], hl: useMix }
      ]);
      var text = 'Xếp thùng lên pallet (ICD Việt Nam)\nThùng ' + nf(v.bL) + ' × ' + nf(v.bW) + ' × ' + nf(v.bH) + ' mm' + (v.bKg ? ', ' + kgs(v.bKg) : '') +
        '\nPallet ' + dim(v.pL, v.pW) + ', cao ' + mm(v.pH) + (oh ? ', nhô mép ' + mm(oh) : '') + (model ? ' (' + model.t + ')' : '') +
        '\nSố thùng: ' + nf(total) + ' (' + nf(per) + ' mỗi lớp × ' + layers + ' lớp, ' + (useMix ? 'xếp đan' : 'xếp thẳng hàng') + ')' +
        '\nChiều cao kiện: ' + mm(height) + '\nHiệu suất diện tích: ' + pct(eff) + (weight !== null ? '\nKhối lượng hàng: ' + kgs(weight) : '') +
        (warn.length ? '\nLưu ý: ' + warn.map(strip).join(' ') : '');
      return { html: html, text: text };
    }
  };

  T['so-pallet-tren-xe-tai'] = {
    calc: function (v) {
      var t = +v.t || 1, g = v.g || 0, warn = [], tiers = t;
      var a = Math.max(v.pL, v.pW), b = Math.min(v.pL, v.pW);
      var pk = pack(v.tL, v.tW, a, b, g);
      if (!pk.best.n) return { empty: 'Pallet lớn hơn lòng thùng xe, không xếp được.' };
      if (v.tH && v.h) {
        var fit = fl(v.tH / v.h);
        if (fit < 1) return { empty: 'Kiện cao ' + mm(v.h) + ', vượt chiều cao lòng thùng ' + mm(v.tH) + '.' };
        if (fit < t) { tiers = fit; warn.push('Không xếp được 2 tầng trong thùng cao ' + mm(v.tH) + '. Kết quả tính theo 1 tầng.'); }
      } else if (t === 2) warn.push('Chưa kiểm tra chiều cao: nhập chiều cao lòng thùng và chiều cao kiện. Thùng hở phải tuân thủ chiều cao xếp hàng cho phép khi lưu thông.');
      var byArea = pk.best.n * tiers, byW = fl(v.tP / v.kg), total = Math.min(byArea, byW);
      var lim = byW < byArea ? 'Tải trọng' : (byW === byArea ? 'Cả hai bằng nhau' : 'Diện tích sàn');
      var name = layoutName(pk.best, a, b, 'thùng xe');
      var html = big(nf(total), 'pallet', 'Giới hạn bởi: ' + esc(lim.toLowerCase()));
      html += table(['Tính theo', 'Số pallet'], [
        { c: ['Diện tích sàn' + (tiers > 1 ? ' (' + nf(pk.best.n) + ' × ' + tiers + ' tầng)' : ''), nf(byArea)], hl: byArea <= byW },
        { c: ['Tải trọng (' + kgs(v.tP) + ' ÷ ' + kgs(v.kg) + ')', nf(byW)], hl: byW <= byArea }
      ]);
      html += list([
        ['Kiểu xếp', esc(name)],
        ['Khối lượng hàng', kgs(total * v.kg) + ' / ' + kgs(v.tP) + ' (' + pct(total * v.kg / v.tP) + ')'],
        byArea > total ? ['Chỗ trống còn lại', nf(byArea - total) + ' vị trí pallet'] : null
      ]);
      html += notes(warn);
      html += fig(svgLayout(v.tL, v.tW, rects(pk.best, g), { door: true, label: 'Sơ đồ pallet trên sàn thùng xe' }),
        'Nhìn từ trên xuống, cửa sau thùng xe ở bên phải (vạch cam). Lòng thùng ' + dim(v.tL, v.tW) + '.' + (total < byArea ? ' Sơ đồ thể hiện mọi vị trí xếp được.' : ''),
        a !== b ? legend('Cạnh ' + nf(a) + ' mm dọc thùng', pk.best.nb ? 'Xoay ngang' : '') : '');
      var text = 'Số pallet trên xe tải (ICD Việt Nam)\nLòng thùng ' + dim(v.tL, v.tW) + ', được chở ' + kgs(v.tP) +
        '\nPallet ' + dim(v.pL, v.pW) + ', mỗi kiện ' + kgs(v.kg) + ', ' + tiers + ' tầng' +
        '\nTheo diện tích: ' + nf(byArea) + '\nTheo tải trọng: ' + nf(byW) + '\nChở được: ' + nf(total) + ' pallet\nKiểu xếp: ' + name +
        (warn.length ? '\nLưu ý: ' + warn.map(strip).join(' ') : '');
      return { html: html, text: text };
    }
  };

  T['chi-phi-moi-luot-dung-pallet'] = {
    calc: function (v) {
      var sides = ['a', 'b'].map(function (k) {
        return { k: k, n: v[k + 'n'] || (k === 'a' ? 'Phương án A' : 'Phương án B'), P: v[k + 'p'], U: v[k + 'u'],
          r: (v[k + 'r'] || 0) / 100, C: v[k + 'c'] || 0, S: v[k + 's'] || 0, F: v[k + 'f'] || 0 };
      });
      var errs = {};
      sides.forEach(function (s) { if (s.r > 0 && s.C > 0 && !v.ny) errs.ny = 'Nhập số lượt mỗi năm để tính chi phí sửa chữa theo tỷ lệ hư hỏng mỗi năm.'; });
      if (errs.ny) return { errs: errs };
      sides.forEach(function (s) {
        s.T = v.ny ? s.U / v.ny : null;
        s.rep = v.ny ? s.r * s.T * s.C : 0;
        s.total = s.P + s.rep + s.U * s.F - s.S;
        s.per = s.total / s.U;
        s.run = s.F + (v.ny ? s.r * s.C / v.ny : 0);
      });
      var A = sides[0], B = sides[1];
      var cheap = A.per <= B.per ? A : B, other = cheap === A ? B : A;
      function cum(s, n) { return s.P * Math.ceil(n / s.U) - s.S * Math.floor(n / s.U) + n * s.run; }
      var be = null, diff = other.per - cheap.per;
      if (diff > 1e-9) {
        var H = Math.min(Math.max(A.U, B.U) * 3, 200000), last = 0;
        for (var n = 1; n <= H; n++) if (cum(cheap, n) > cum(other, n) + 1e-6) last = n;
        be = last + 1;
      }
      var maxPer = Math.max(A.per, B.per, 1);
      var svg = '<svg class="rbar" viewBox="0 0 360 230" role="img" aria-label="Biểu đồ chi phí mỗi lượt">' +
        '<line class="rbar__axis" x1="20" y1="190" x2="340" y2="190"/>';
      sides.forEach(function (s, i) {
        var h = Math.max(0, s.per) / maxPer * 150, x = 55 + i * 160;
        svg += '<rect class="' + (s === cheap && diff > 1e-9 ? 'rbar__best' : 'rbar__col') + '" x="' + x + '" y="' + (190 - h) + '" width="90" height="' + h + '"/>' +
          '<text class="rbar__v" x="' + (x + 45) + '" y="' + (182 - h) + '" text-anchor="middle">' + esc(nf(s.per)) + ' đ</text>' +
          '<text class="rbar__l" x="' + (x + 45) + '" y="212" text-anchor="middle">' + esc(s.n.length > 22 ? s.n.slice(0, 21) + '…' : s.n) + '</text>';
      });
      svg += '</svg>';
      var html = big(nf(diff), 'đ / lượt', diff > 1e-9 ? '<strong>' + esc(cheap.n) + '</strong> rẻ hơn ' + esc(other.n) + ' trên mỗi lượt sử dụng' : 'Hai phương án có chi phí mỗi lượt bằng nhau');
      html += list([
        [A.n, nf(A.per) + ' đ / lượt'],
        [B.n, nf(B.per) + ' đ / lượt'],
        be ? ['Điểm hoà vốn', 'từ lượt thứ ' + nf(be) + (v.ny ? ' (khoảng ' + nf(be / v.ny, 1) + ' năm)' : '')] : null,
        diff > 1e-9 && v.ny ? ['Chênh lệch mỗi năm', nf(diff * v.ny) + ' đ / pallet'] : null
      ]);
      var warn = [];
      sides.forEach(function (s) { if (s.total < 0) warn.push(esc(s.n) + ': giá trị thu hồi lớn hơn tổng chi phí, kiểm tra lại số liệu.'); });
      if (!v.ny && sides.some(function (s) { return s.r > 0; })) warn.push('Chưa tính chi phí sửa chữa vì thiếu số lượt mỗi năm.');
      html += notes(warn);
      html += fig(svg, 'Chi phí trên mỗi lượt sử dụng, đã gồm sửa chữa, xử lý và trừ giá trị thu hồi.');
      html += table(['Đ / lượt', A.n, B.n], [
        { c: ['Giá mua', nf(A.P / A.U), nf(B.P / B.U)] },
        { c: ['Sửa chữa', nf(A.rep / A.U), nf(B.rep / B.U)] },
        { c: ['Xử lý mỗi lượt', nf(A.F), nf(B.F)] },
        { c: ['Trừ thu hồi', nf(-A.S / A.U), nf(-B.S / B.U)] },
        { c: ['<strong>Tổng</strong>', '<strong>' + nf(A.per) + '</strong>', '<strong>' + nf(B.per) + '</strong>'], hl: true }
      ]);
      var text = 'Chi phí mỗi lượt dùng pallet (ICD Việt Nam)\n' + sides.map(function (s) {
        return s.n + ': giá ' + nf(s.P) + ' đ, ' + nf(s.U) + ' lượt' + (s.F ? ', xử lý ' + nf(s.F) + ' đ/lượt' : '') + ' => ' + nf(s.per) + ' đ/lượt';
      }).join('\n') + (diff > 1e-9 ? '\n' + cheap.n + ' rẻ hơn ' + nf(diff) + ' đ/lượt' + (be ? ', hoà vốn từ lượt thứ ' + nf(be) : '') : '');
      return { html: html, text: text };
    }
  };

  T['tai-trong-pallet-can-chon'] = {
    calc: function (v) {
      var k = v.k || 1, sf = v.sf, info = [];
      var useS = v.us || k > 1;
      if (!v.ud && !useS && !v.ur) return { empty: 'Chọn ít nhất một cách sử dụng.' };
      if (k > 1 && !v.us) info.push('Xếp chồng là lúc pallet đặt yên trên sàn nên đã tính thêm tải trọng tĩnh.');
      var need = { d: v.ud ? v.m * sf : null, s: useS ? v.m * k * sf : null, r: v.ur ? v.m * sf : null };
      var size = v.kt ? v.kt.split('x').map(Number) : null;
      var key = need.r ? 'r' : need.d ? 'd' : 's';
      var hits = (D.pallets || []).filter(function (p) {
        if (size && !((p.L === size[0] && p.W === size[1]) || (p.L === size[1] && p.W === size[0]))) return false;
        return ['d', 's', 'r'].every(function (x) { return need[x] == null || (p[x] && p[x] >= need[x] - 1e-6); });
      }).sort(function (p, q) { return p[key] - q[key] || (p.s || 0) - (q.s || 0); });
      var html = list([
        need.d != null ? ['Tải trọng động tối thiểu', '<strong>' + kgs(need.d) + '</strong>'] : null,
        need.s != null ? ['Tải trọng tĩnh tối thiểu', '<strong>' + kgs(need.s) + '</strong>'] : null,
        need.r != null ? ['Tải trọng trên kệ tối thiểu', '<strong>' + kgs(need.r) + '</strong>'] : null
      ]);
      html = big(nf(hits.length), 'mẫu phù hợp', v.kt ? 'Kích thước ' + esc(v.kt.replace('x', ' × ')) + ' mm' : 'Mọi kích thước pallet nhựa mới') + html;
      html += notes(info, 'rinfo');
      if (hits.length) {
        html += '<ol class="rmodels">' + hits.slice(0, 10).map(function (p) {
          return '<li><a href="' + esc(p.u) + '">' + esc(p.t) + '</a><span>' + nf(p.L) + ' × ' + nf(p.W) + ' × ' + nf(p.H) + ' mm · động ' + (p.d ? nf(p.d) : '-') +
            ' · tĩnh ' + (p.s ? nf(p.s) : '-') + ' · kệ ' + (p.r ? nf(p.r) : '-') + ' kg</span></li>';
        }).join('') + '</ol>';
        if (hits.length > 10) html += '<p class="rsmall">Hiển thị 10 mẫu có tải trọng gần nhất với nhu cầu, xếp tăng dần.</p>';
      } else {
        html += notes(['Chưa có mẫu đáp ứng đủ các điều kiện. Thử bỏ lọc kích thước, giảm hệ số an toàn hoặc liên hệ ICD Việt Nam qua số <a href="tel:0983797186">0983 797 186</a> để được tư vấn mẫu tải nặng, có lõi thép.']);
      }
      var q = [], th;
      if (v.kt) q.push('kt=' + encodeURIComponent(v.kt));
      if (need.d != null) { th = [500, 1000, 1500, 2000].filter(function (x) { return x >= need.d; })[0]; if (th) q.push('dong=' + th); }
      if (need.s != null) { th = [2000, 4000, 6000].filter(function (x) { return x >= need.s; })[0]; if (th) q.push('tinh=' + th); }
      if (need.r != null) q.push('dung=pallet-nhua-ke-kho');
      if (D.finder) html += '<p class="rlink"><a class="btn btn--sm" href="' + esc(D.finder + (q.length ? '?' + q.join('&') : '') + '#ket-qua') + '">Mở bộ tìm pallet với bộ lọc gần nhất</a></p>';
      var text = 'Tải trọng pallet cần chọn (ICD Việt Nam)\nHàng ' + kgs(v.m) + '/pallet, xếp chồng ' + k + ' tầng, hệ số an toàn ' + nf(sf, 2) +
        (need.d != null ? '\nTải trọng động tối thiểu: ' + kgs(need.d) : '') + (need.s != null ? '\nTải trọng tĩnh tối thiểu: ' + kgs(need.s) : '') +
        (need.r != null ? '\nTải trọng trên kệ tối thiểu: ' + kgs(need.r) : '') + '\nSố mẫu phù hợp: ' + hits.length +
        hits.slice(0, 5).map(function (p) { return '\n- ' + p.t + ': ' + p.u; }).join('');
      return { html: html, text: text };
    }
  };

  T['quy-doi-don-vi'] = {
    calc: function (v) {
      var LEN = { mm: [1, 'mm'], cm: [10, 'cm'], m: [1000, 'm'], 'in': [25.4, 'inch'], ft: [304.8, 'feet'] };
      var MASS = { kg: [1, 'kg'], lb: [0.45359237, 'lb'], t: [1000, 'tấn'] };
      var VOL = { m3: [1, 'm³'], ft3: [0.028316846592, 'ft³'], l: [0.001, 'lít'] };
      var parts = [], text = ['Quy đổi đơn vị (ICD Việt Nam)'];
      function block(title, val, unit, map) {
        if (val == null) return;
        var base = val * map[unit][0];
        var rows = Object.keys(map).map(function (k) { return { c: [map[k][1], nf(base / map[k][0], 4)], hl: k === unit }; });
        parts.push('<h3 class="rh">' + esc(title) + ': ' + nf(val, 4) + ' ' + esc(map[unit][1]) + '</h3>' + table(['Đơn vị', 'Giá trị'], rows));
        text.push(title + ': ' + nf(val, 4) + ' ' + map[unit][1] + ' = ' + Object.keys(map).filter(function (k) { return k !== unit; }).map(function (k) { return nf(base / map[k][0], 4) + ' ' + map[k][1]; }).join(' = '));
      }
      block('Chiều dài', v.lv, v.lu, LEN);
      block('Khối lượng', v.mv, v.mu, MASS);
      block('Thể tích', v.vv, v.vu, VOL);
      if (v.pa != null && v.pb != null) {
        var toMm = v.pu === 'in', f = toMm ? 25.4 : 1 / 25.4, u1 = toMm ? 'inch' : 'mm', u2 = toMm ? 'mm' : 'inch';
        var r = nf(v.pa * f, toMm ? 1 : 2) + ' × ' + nf(v.pb * f, toMm ? 1 : 2) + ' ' + u2;
        parts.unshift('<h3 class="rh">Kích thước pallet</h3><div class="rbig rbig--sm"><span class="rbig__n num">' + esc(r) + '</span></div><p class="rsub">' +
          nf(v.pa, 4) + ' × ' + nf(v.pb, 4) + ' ' + u1 + (toMm ? ' (làm tròn ' + nf(Math.round(v.pa * 25.4)) + ' × ' + nf(Math.round(v.pb * 25.4)) + ' mm)' : '') + '</p>');
        text.splice(1, 0, 'Kích thước pallet: ' + nf(v.pa, 4) + ' × ' + nf(v.pb, 4) + ' ' + u1 + ' = ' + r);
      }
      if (!parts.length) return { empty: 'Nhập giá trị cần quy đổi.' };
      return { html: parts.join(''), text: text.join('\n') };
    }
  };

  var tool = T[slug];
  if (!tool) return;

  /* ---------- Ô nhập ---------- */
  function els() { return Array.prototype.filter.call(form.elements, function (el) { return el.name; }); }
  function isNum(el) { return el.tagName === 'INPUT' && el.getAttribute('data-num') === '1'; }
  function isText(el) { return el.tagName === 'INPUT' && el.type === 'text' && !isNum(el); }

  function readAll() {
    var v = {}, errs = {}, missing = false;
    els().forEach(function (el) {
      var n = el.name;
      if (el.type === 'radio') { if (el.checked) v[n] = el.value; return; }
      if (el.type === 'checkbox') { v[n] = el.checked; return; }
      if (el.tagName === 'SELECT') { v[n] = el.value; return; }
      var raw = el.value.trim(), req = el.getAttribute('data-req') === '1';
      if (isText(el)) { v[n] = raw; if (!raw && req) { missing = true; if (el.getAttribute('data-touched')) errs[n] = 'Ô này bắt buộc.'; } return; }
      if (!raw) { v[n] = null; if (req) { missing = true; if (el.getAttribute('data-touched')) errs[n] = 'Ô này bắt buộc.'; } return; }
      var x = parseNum(raw), mn = el.getAttribute('data-min'), mx = el.getAttribute('data-max');
      if (isNaN(x)) errs[n] = 'Nhập một số, ví dụ 1.200 hoặc 12,5.';
      else if ((mn !== null && x < +mn) || (mx !== null && x > +mx)) errs[n] = 'Nhập giá trị từ ' + nf(+mn, 3) + ' đến ' + nf(+mx, 3) + '.';
      else if (el.getAttribute('data-int') && x % 1) errs[n] = 'Nhập số nguyên.';
      v[n] = errs[n] ? null : x;
    });
    return { v: v, errs: errs, missing: missing };
  }
  function showErrs(errs) {
    els().forEach(function (el) {
      if (!isNum(el) && !isText(el)) return;
      var box = document.getElementById('e-' + el.name), m = errs[el.name];
      if (m) { el.setAttribute('aria-invalid', 'true'); if (box) { box.textContent = m; box.hidden = false; } }
      else { el.removeAttribute('aria-invalid'); if (box) { box.textContent = ''; box.hidden = true; } }
    });
  }

  /* Ô chọn điền nhanh (data-preset-for + option data-v) */
  function presetSelects() { return Array.prototype.slice.call(form.querySelectorAll('select[data-preset-for]')); }
  function applyPreset(sel) {
    var opt = sel.options[sel.selectedIndex], dv = opt && opt.getAttribute('data-v');
    if (!dv) return;
    var names = sel.getAttribute('data-preset-for').split(','), vals = dv.split(',');
    names.forEach(function (n, i) { var el = form.elements[n]; if (el && vals[i] != null) el.value = nf(+vals[i], 4); });
  }
  function syncPreset(sel) {
    var names = sel.getAttribute('data-preset-for').split(','), cur = names.map(function (n) { return parseNum(form.elements[n].value); });
    for (var i = 0; i < sel.options.length; i++) {
      var dv = sel.options[i].getAttribute('data-v');
      if (dv && dv.split(',').every(function (x, j) { return +x === cur[j]; })) { sel.selectedIndex = i; return; }
    }
    if (sel.querySelector('option[value="custom"]')) sel.value = 'custom';
  }

  /* ---------- URL ---------- */
  var urlTimer;
  function syncUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(function () {
      var p = new URLSearchParams();
      els().forEach(function (el) {
        var def = el.getAttribute('data-def') || '';
        if (el.type === 'radio') { if (el.checked && el.value !== def) p.set(el.name, el.value); return; }
        if (el.type === 'checkbox') { if (el.checked !== (def === '1')) p.set(el.name, el.checked ? '1' : '0'); return; }
        if (el.tagName === 'SELECT') { if (el.value !== def) p.set(el.name, el.value); return; }
        var raw = el.value.trim();
        if (isNum(el)) {
          var x = parseNum(raw), d = def === '' ? NaN : parseFloat(def);
          if (raw === '' && def === '') return;
          if (raw === '') { p.set(el.name, ''); return; }
          if (!isNaN(x) && x !== d) p.set(el.name, String(x));
          return;
        }
        if (raw !== def) p.set(el.name, raw);
      });
      var qs = p.toString();
      try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {}
    }, 250);
  }
  function loadUrl() {
    var p = new URLSearchParams(location.search);
    if (!p.toString()) return;
    presetSelects().forEach(function (sel) {
      if (p.has(sel.name)) { sel.value = p.get(sel.name); applyPreset(sel); }
    });
    els().forEach(function (el) {
      if (!p.has(el.name) || el.tagName === 'SELECT') return;
      var val = p.get(el.name);
      if (el.type === 'radio') el.checked = el.value === val;
      else if (el.type === 'checkbox') el.checked = val === '1';
      else if (isNum(el)) { var x = parseNum(val); el.value = val === '' ? '' : (isNaN(x) ? val : nf(x, 4)); }
      else el.value = val.slice(0, 60);
    });
    if (tool.refresh) tool.refresh();
    els().forEach(function (el) {
      if (el.tagName === 'SELECT' && !el.hasAttribute('data-preset-for') && p.has(el.name)) {
        el.value = p.get(el.name);
        if (el.selectedIndex < 0) el.value = el.getAttribute('data-def') || '';
      }
    });
    presetSelects().forEach(syncPreset);
  }

  /* ---------- Chạy ---------- */
  function setEmpty(t) {
    out.innerHTML = '<p class="tool__empty">' + esc(t) + '</p>';
    lastText = '';
    btnCopy.disabled = true;
  }
  function run() {
    if (tool.refresh) tool.refresh();
    var r = readAll(), res = null, hasErr = Object.keys(r.errs).length > 0;
    if (!hasErr && !r.missing) {
      try { res = tool.calc(r.v); } catch (e) { res = { empty: 'Chưa tính được với số liệu này, kiểm tra lại các ô đã nhập.' }; if (window.console) console.warn(e); }
      if (res && res.errs) { Object.keys(res.errs).forEach(function (k) { r.errs[k] = res.errs[k]; }); hasErr = true; res = null; }
    }
    showErrs(r.errs);
    if (res && res.html) { out.innerHTML = res.html; lastText = res.text || ''; btnCopy.disabled = !lastText; }
    else setEmpty(hasErr ? 'Kiểm tra lại các ô đang báo lỗi.' : (res && res.empty) || emptyDefault);
    syncUrl();
  }

  form.addEventListener('input', function (e) {
    var el = e.target;
    if (isNum(el)) presetSelects().forEach(function (sel) { if (sel.getAttribute('data-preset-for').split(',').indexOf(el.name) >= 0) syncPreset(sel); });
    if (el.tagName !== 'SELECT') run();
  });
  form.addEventListener('change', function (e) {
    var el = e.target;
    if (el.tagName === 'SELECT' && el.hasAttribute('data-preset-for')) applyPreset(el);
    if (el.tagName === 'SELECT' || el.type === 'radio' || el.type === 'checkbox') run();
  });
  form.addEventListener('focusout', function (e) {
    var el = e.target;
    if (!isNum(el) && !isText(el)) return;
    el.setAttribute('data-touched', '1');
    if (isNum(el)) { var x = parseNum(el.value); if (!isNaN(x)) el.value = nf(x, 4); }
    run();
  });
  form.addEventListener('reset', function (e) {
    e.preventDefault();
    els().forEach(function (el) {
      var def = el.getAttribute('data-def') || '';
      el.removeAttribute('data-touched');
      if (el.type === 'radio') el.checked = el.value === def;
      else if (el.type === 'checkbox') el.checked = def === '1';
      else if (el.tagName === 'SELECT') el.value = def;
      else el.value = isNum(el) && def !== '' ? nf(parseFloat(def), 4) : def;
    });
    run();
    var first = form.querySelector('input,select');
    if (first) first.focus();
  });

  function flash(t) {
    msgEl.textContent = t;
    clearTimeout(flash.t);
    flash.t = setTimeout(function () { msgEl.textContent = ''; }, 2600);
  }
  function copy(text, ok) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      flash(done ? ok : 'Trình duyệt chặn sao chép. Hãy chọn và sao chép thủ công.');
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { flash(ok); }, fallback);
    else fallback();
  }
  btnCopy.addEventListener('click', function () { if (lastText) copy(lastText + '\nXem lại: ' + location.href, 'Đã sao chép kết quả.'); });
  btnShare.addEventListener('click', function () { copy(location.href, 'Đã sao chép liên kết kèm số liệu.'); });

  if (tool.init) tool.init();
  loadUrl();
  run();
})();

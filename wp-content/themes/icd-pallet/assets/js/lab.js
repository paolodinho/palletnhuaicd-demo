/* ICD Pallet - phòng mô phỏng v7: mỗi loại pallet một bộ cảnh, vẽ khối 3D có bóng. Cần lab-kit.js. */
(function () {
  var root = document.querySelector('.lab'), K = window.LabKit;
  if (!root || !K) return;
  var D;
  try { D = JSON.parse(root.getAttribute('data-lab')); } catch (e) { return; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var nf = function (n) { return Math.round(n).toLocaleString('vi-VN'); };
  var C = { ink: '#1E2433', orange: '#FB7703', navy: '#12285E', red: '#C0392B', green: '#1E8A55', steel: '#5B6475' };
  var P = K.plastic(D.col), KIND = D.kind, VW = 780, VH = 340, FY = 262;
  var label = K.label, tag = K.tag;
  function verdict(el, level, text) { el.className = 'lab__verdict is-' + level; el.textContent = text; }
  function svgOpen(h) { return '<svg viewBox="0 0 ' + VW + ' ' + (h || VH) + '" role="img" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'; }
  function rangeH(id, lab, min, max, step, val) { return '<label class="lab__range"><span>' + lab + '</span><output id="' + id + 'Out"></output><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>'; }
  function modesH(attr, list, on) { return '<div class="lab__modes" role="group">' + list.map(function (m) { return '<button type="button" class="lab__mode' + (m[0] === on ? ' is-on' : '') + '" data-' + attr + '="' + m[0] + '">' + m[1].replace(/ (\S+)$/, '&nbsp;$1') + '</button>'; }).join('') + '</div>'; }
  function wireModes(pane, attr, fn) { $$('.lab__mode[data-' + attr + ']', pane).forEach(function (b) { b.addEventListener('click', function () { $$('.lab__mode[data-' + attr + ']', pane).forEach(function (x) { x.classList.toggle('is-on', x === b); }); fn(b.getAttribute('data-' + attr)); }); }); }
  function paneShell(pane, modes, sceneId, side, h) { pane.innerHTML = (modes || '') + '<div class="lab__cols"><div class="lab__scene" id="' + sceneId + '"></div><div class="lab__side">' + side + '</div></div>'; return $('#' + sceneId, pane); }
  function put(el, inner, h) { el.innerHTML = svgOpen(h) + inner + '</svg>'; }

  /* ---------- hình dựng chung ---------- */
  var BASE = FY + 40;               // y chân vật trong cảnh nhìn xiên
  function pal3(x, y, w, o) { o = o || {}; var kindFace = D.f || 'ho'; return K.pallet(x, y, w, { h: o.h || 36, d: o.d || 150, col: D.col, face: kindFace === 'kin' ? 'kin' : 'ho', feet: D.lg === '3-chan' ? 3 : 4, steel: o.steel == null ? (KIND === 'rack') : o.steel }); }
  function cargo(x, ty, w, hgt, o) {
    o = o || {}; var layers = Math.max(1, Math.round(hgt / 26));
    if (KIND === 'print') return K.load(x, ty, w, hgt, { d: 150, cols: 1, layers: Math.max(1, Math.round(hgt / 22)), paper: true, tint: o.tint, wrap: false });
    return K.load(x, ty, w, hgt, { d: 150, cols: 5, layers: layers, tint: o.tint, wrap: o.wrap });
  }
  function palSide(x, y, w, o) {   // mặt cắt dọc theo hướng luồn càng
    o = o || {}; var h = o.h || 44, th = o.th || 14, out = '';
    out += K.shadow(x + w / 2, y + 2, w * .55, 5, .4);
    out += '<rect x="' + x + '" y="' + (y - h + th) + '" width="' + w + '" height="' + (h - th) + '" fill="#10141C"/>';
    if (D.lg === '3-chan') out += '<rect x="' + x + '" y="' + (y - h + th) + '" width="' + w + '" height="' + (h - th) + '" fill="' + P.S + '" opacity=".55"/><rect x="' + x + '" y="' + (y - 5) + '" width="' + w + '" height="5" fill="#000" opacity=".3"/>';
    else [.12, .5, .88].forEach(function (k) { var fw = w * .13; out += '<rect x="' + (x + w * k - fw / 2) + '" y="' + (y - h + th) + '" width="' + fw + '" height="' + (h - th) + '" fill="' + P.S + '" opacity=".6"/>'; });
    out += '<rect x="' + x + '" y="' + (y - h) + '" width="' + w + '" height="' + th + '" fill="' + P.F + '"/><rect x="' + x + '" y="' + (y - h) + '" width="' + w + '" height="2" fill="#fff" opacity=".45"/><rect x="' + x + '" y="' + (y - h + th - 2) + '" width="' + w + '" height="2" fill="#000" opacity=".28"/>';
    if (D.f !== 'kin') for (var g = 1; g < 16; g++) out += '<rect x="' + (x + g * w / 16) + '" y="' + (y - h + 2) + '" width="1.4" height="' + (th - 4) + '" fill="#000" opacity=".12"/>';
    [0, 1].forEach(function (k) { out += '<rect x="' + (k ? x + w - 12 : x) + '" y="' + (y - h + th) + '" width="12" height="' + (h - th) + '" fill="' + P.F + '"/><rect x="' + (k ? x + w - 12 : x) + '" y="' + (y - h + th) + '" width="12" height="' + (h - th) + '" fill="#000" opacity=".1"/>'; });
    return out;
  }
  function loadSide(x, y, w, hh, o) {
    o = o || {}; var out = '', cols = 5, rows = Math.max(1, Math.round(hh / 26));
    if (KIND === 'print') { out += '<rect x="' + x + '" y="' + (y - hh) + '" width="' + w + '" height="' + hh + '" fill="#EDE9DF"/>'; for (var i = 1; i < rows * 3; i++) out += '<line x1="' + x + '" y1="' + (y - hh + i * hh / (rows * 3)) + '" x2="' + (x + w) + '" y2="' + (y - hh + i * hh / (rows * 3)) + '" stroke="#8C8676" stroke-opacity=".5"/>'; return out + '<rect x="' + x + '" y="' + (y - hh) + '" width="' + w + '" height="' + hh + '" fill="url(#gWrap)"/>'; }
    out += '<rect x="' + x + '" y="' + (y - hh) + '" width="' + w + '" height="' + hh + '" fill="url(#gCardF)"/><rect x="' + x + '" y="' + (y - hh) + '" width="' + w + '" height="' + hh + '" fill="#000" filter="url(#kGrain)" opacity=".28"/>';
    for (var r = 1; r < rows; r++) out += '<line x1="' + x + '" y1="' + (y - hh + r * hh / rows) + '" x2="' + (x + w) + '" y2="' + (y - hh + r * hh / rows) + '" stroke="#7A5B2E" stroke-opacity=".6" stroke-width="1.4"/>';
    for (var c = 1; c < cols; c++) out += '<line x1="' + (x + c * w / cols) + '" y1="' + (y - hh) + '" x2="' + (x + c * w / cols) + '" y2="' + y + '" stroke="#7A5B2E" stroke-opacity=".5"/>';
    for (var t = 0; t < cols; t++) out += '<rect x="' + (x + (t + .5) * w / cols - 3) + '" y="' + (y - hh) + '" width="6" height="' + hh + '" fill="#F1E2BE" opacity=".7"/>';
    out += '<rect x="' + x + '" y="' + (y - hh) + '" width="' + w + '" height="' + hh + '" fill="url(#gWrap)" opacity=".8"/>';
    return out;
  }
  function boxPal(x, y, w, hgt, o) {   // pallet container: đế + thành bao quanh, miệng hở
    o = o || {}; var d = 150, ox = d * .62 * .96, oy = d * .3 * .96, th = 12, wallT = 8, out = '', fill = o.fill == null ? .6 : o.fill;
    out += pal3(x, y, w, { h: 34 });
    var by = y - 34 + 4, wh = hgt;                 // chân thành
    out += K.para((x + w) + ' ' + by, (x + w + ox) + ' ' + (by - oy), (x + w + ox) + ' ' + (by - oy - wh), (x + w) + ' ' + (by - wh), P.S);
    out += '<path d="M' + x + ' ' + (by - wh) + ' L' + (x + ox) + ' ' + (by - wh - oy) + ' L' + (x + w + ox) + ' ' + (by - wh - oy) + ' L' + (x + w) + ' ' + (by - wh) + ' Z" fill="#0D1016"/>';
    var fy = by - wh * fill; // mặt hàng lấp trong thùng nhìn từ trên
    out += '<path d="M' + (x + 8) + ' ' + (fy - 2) + ' L' + (x + ox + 6) + ' ' + (fy - oy) + ' L' + (x + w + ox - 8) + ' ' + (fy - oy) + ' L' + (x + w - 6) + ' ' + (fy - 2) + ' Z" fill="url(#gCardT)"/>';
    out += '<rect x="' + x + '" y="' + (by - wh) + '" width="' + w + '" height="' + wh + '" fill="' + P.F + '"/>';
    for (var r = 1; r < 4; r++) out += '<rect x="' + x + '" y="' + (by - wh + r * wh / 4) + '" width="' + w + '" height="2" fill="#000" opacity=".16"/>';
    for (var c = 1; c < 6; c++) out += '<rect x="' + (x + c * w / 6) + '" y="' + (by - wh) + '" width="2" height="' + wh + '" fill="#000" opacity=".1"/>';
    out += '<rect x="' + x + '" y="' + (by - wh) + '" width="' + w + '" height="4" fill="#fff" opacity=".4"/>';
    return out;
  }
  function slabPal(x, y, w, hh) { return K.slab(x, y, w, { h: hh, d: 150, col: D.col, grid: true }); }
  function arrowDown(x, y1, y2, col) { return '<path d="M' + x + ' ' + y1 + ' L' + x + ' ' + y2 + '" stroke="' + col + '" stroke-width="5" stroke-linecap="round"/><path d="M' + (x - 9) + ' ' + (y2 - 10) + ' L' + x + ' ' + y2 + ' L' + (x + 9) + ' ' + (y2 - 10) + '" stroke="' + col + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function ease(a) { return a < .5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2; }
  function lerp(a, b, k) { return a + (b - a) * k; }

  /* ===== 01 Tải trọng ===== */
  function sceneLoad(pane) {
    var rates = [['d', 'Tải trọng động', D.d], ['s', 'Tải trọng tĩnh', D.s], ['r', 'Tải trên kệ', D.r]].filter(function (r) { return r[2]; });
    if (KIND === 'rack') rates.sort(function (a, b) { return a[0] === 'r' ? -1 : b[0] === 'r' ? 1 : 0; });
    var mode = rates[0][0];
    var what = {
      d: 'Tải trọng động là khối lượng tối đa pallet chịu được khi đang nằm trên càng xe nâng và di chuyển. Xe phanh, đổi hướng, sàn gồ ghề đều tạo thêm lực nên mức này thấp hơn tải tĩnh.',
      s: 'Tải trọng tĩnh là khối lượng tối đa pallet chịu được khi đặt yên trên sàn phẳng, chân pallet tỳ đều xuống nền. Hàng xếp chồng trong kho thuộc trường hợp này.',
      r: 'Tải trên kệ là khối lượng tối đa khi pallet gác hai đầu lên hai thanh dầm kệ, phần giữa lơ lửng nên võng nhiều nhất. Đây là điều kiện khắt khe nhất.'
    };
    var note = (KIND === 'rack' && !D.r) ? ' Mẫu này chưa công bố tải trên kệ. Hãy liên hệ ICD Việt Nam trước khi dùng cho kệ chọn lọc.' : '';
    var side = '<p class="lab__what" id="lWhat"></p>' + rangeH('lRange', 'Khối lượng hàng đặt lên', 0, 100, 1, 40) +
      '<div class="lab__meter"><i id="lBar"></i></div><p class="lab__verdict" id="lVerd" aria-live="polite"></p>' +
      '<p class="lab__foot">Số liệu theo thông số công bố của mẫu. Trong vận hành thực tế, tải phải phân bố đều trên mặt pallet và dưới mức tải danh định.' + note + '</p>';
    var sc = paneShell(pane, rates.length > 1 ? modesH('mode', rates.map(function (r) { return [r[0], r[1]]; }), mode) : '', 'lScene', side);
    var rg = $('#lRange', pane);
    function draw() {
      var rate = D[mode], v = +rg.value / 100, load = rate * 1.5 * v, frac = load / rate, over = frac > 1.0001, warn = frac > .7 && !over, tint = over;
      var hgt = Math.round(18 + v * 150), px = 170, pw = 280, out = K.stage(VW, VH, { floorY: FY });
      var palH = KIND === 'floor' || KIND === 'frame' ? 14 : 36;
      if (mode === 'r') {
        var by = 232, sag = Math.min(frac, 1.8) * 16 + (over ? (frac - 1) * 26 : 0), N = 12, content = function () {
          var s = '';
          if (KIND === 'spill') s += '';
          s += (palH < 20 ? slabPal(px, by, pw, palH) : pal3(px, by, pw, { h: palH })) + cargo(px, by - palH, pw, hgt, { tint: tint, wrap: true });
          return s;
        };
        // dầm kệ + cột
        [px - 18, px + pw - 22].forEach(function (bx) {
          out += K.para(bx + ' ' + by, (bx + 36 + 40) + ' ' + (by - 18), (bx + 36 + 40) + ' ' + (by - 8), (bx + 36) + ' ' + (by + 10), '#B54F06');
          out += '<path d="M' + bx + ' ' + (by) + ' L' + (bx + 36) + ' ' + (by) + ' L' + (bx + 76) + ' ' + (by - 18) + ' L' + (bx + 40) + ' ' + (by - 18) + ' Z" fill="url(#gOrange)"/>';
          out += '<rect x="' + bx + '" y="' + by + '" width="36" height="12" fill="url(#gOrange)"/><rect x="' + bx + '" y="' + by + '" width="36" height="2" fill="#fff" opacity=".4"/>';
          out += '<rect x="' + (bx + 8) + '" y="' + (by + 12) + '" width="14" height="' + (BASE - by - 12) + '" fill="#2F6FD6"/><rect x="' + (bx + 8) + '" y="' + (by + 12) + '" width="4" height="' + (BASE - by - 12) + '" fill="#fff" opacity=".3"/>';
          for (var k = 0; k < (BASE - by) / 20; k++) out += '<rect x="' + (bx + 12) + '" y="' + (by + 20 + k * 20) + '" width="6" height="8" rx="3" fill="#0F2D5E"/>';
        });
        out += K.shadow(px + pw / 2 + 20, BASE + 2, pw * .6, 6, .3);
        for (var i = 0; i < N; i++) {
          var xa = i === 0 ? -9999 : px + 18 + (pw - 36) * i / N, xb = i === N - 1 ? 9999 : px + 18 + (pw - 36) * (i + 1) / N, mid = (px + 18 + (pw - 36) * (i + .5) / N - (px + pw / 2)) / ((pw - 36) / 2);
          var off = sag * Math.max(0, 1 - mid * mid);
          out += '<clipPath id="lcs' + i + '"><rect x="' + xa + '" y="0" width="' + (xb - xa) + '" height="' + VH + '"/></clipPath><g clip-path="url(#lcs' + i + ')"><g transform="translate(0,' + off.toFixed(1) + ')">' + content() + '</g></g>';
        }
        out += '<path d="M' + (px + 20) + ' ' + (by + 1) + ' Q ' + (px + pw / 2) + ' ' + (by + 1 + sag * 2) + ' ' + (px + pw - 20) + ' ' + (by + 1) + '" fill="none" stroke="#0B0E14" stroke-opacity=".55" stroke-width="3" stroke-dasharray="6 5"/>';
        if (over) out += '<path d="M' + (px + pw / 2 - 10) + ' ' + (by - 2 + sag) + ' l 10 12 l -7 7 l 14 14" fill="none" stroke="' + C.red + '" stroke-width="3.5"/>';
        out += tag(px + pw / 2 + 50, 38, 'DẦM KỆ ĐỠ HAI ĐẦU', C.steel, 15);
      } else if (mode === 'd') {
        var lift = 24, pyy = BASE - lift, cw = '';
        out += '<g class="' + (reduce ? '' : 'lab-sway') + '">';
        out += (palH < 20 ? slabPal(px, pyy, pw, palH) : pal3(px, pyy, pw, { h: palH })) + cargo(px, pyy - palH, pw, hgt, { tint: tint, wrap: true });
        // hai càng nâng ở phía trước, ngay dưới sàn pallet
        [px + pw * .28, px + pw * .64].forEach(function (tx) { out += '<rect x="' + (tx - 22) + '" y="' + (pyy - 10) + '" width="44" height="9" fill="url(#gSteelV)"/><rect x="' + (tx - 22) + '" y="' + (pyy - 10) + '" width="44" height="2" fill="#fff" opacity=".6"/>'; });
        out += '</g>';
        out += '<path d="M40 ' + (VH - 22) + ' h 150 M600 ' + (VH - 22) + ' h 140" stroke="' + C.steel + '" stroke-width="3" stroke-dasharray="14 10" stroke-linecap="round" class="' + (reduce ? '' : 'lab-dash') + '" opacity=".7"/>' + label(115, VH - 32, 'ĐANG DI CHUYỂN', 'middle', C.steel, 13);
      } else {
        var squash = Math.min(frac, 1.6) * 2.4;
        out += (palH < 20 ? slabPal(px, BASE, pw, palH - squash * .4) : pal3(px, BASE, pw, { h: palH - squash })) + cargo(px, BASE - palH + squash, pw, hgt, { tint: tint, wrap: true });
        var topY = BASE - palH - 45 - hgt - 6;
        for (var a = 0; a < 4; a++) out += '<g class="' + (reduce ? '' : 'lab-press') + '">' + arrowDown(px + 60 + a * 70, Math.max(topY - 36, 8), Math.max(topY - 6, 38), C.orange) + '</g>';
        out += tag(px + pw + 140, BASE - 6, 'ĐẶT TRÊN SÀN PHẲNG', C.steel, 14);
      }
      out += '<text x="' + (VW - 22) + '" y="44" text-anchor="end" font-family="Barlow Semi Condensed, Montserrat, sans-serif" font-size="40" font-weight="800" fill="' + (over ? C.red : C.navy) + '" stroke="#fff" stroke-width="6" paint-order="stroke">' + nf(load) + ' kg</text>';
      put(sc, out);
      $('#lRangeOut', pane).textContent = nf(load) + ' kg / mức danh định ' + nf(rate) + ' kg';
      $('#lWhat', pane).textContent = what[mode];
      var bar = $('#lBar', pane); bar.style.width = (Math.min(frac, 1.5) / 1.5 * 100) + '%'; bar.className = over ? 'bad' : warn ? 'warn' : 'ok';
      var vd = $('#lVerd', pane);
      if (over) verdict(vd, 'bad', 'Vượt mức danh định ' + Math.round((frac - 1) * 100) + '%. Pallet có nguy cơ nứt, võng vĩnh viễn hoặc gãy. Không nên dùng ở mức này.');
      else if (warn) verdict(vd, 'warn', 'Đã dùng ' + Math.round(frac * 100) + '% mức danh định. Còn an toàn, nhưng cần xếp đều và tránh va đập mạnh.');
      else verdict(vd, 'ok', 'Đã dùng ' + Math.round(frac * 100) + '% mức danh định. Trong ngưỡng làm việc an toàn.');
    }
    rg.addEventListener('input', draw);
    wireModes(pane, 'mode', function (m) { mode = m; rg.value = 40; draw(); });
    return { show: draw };
  }

  /* ===== 02 Xe nâng ===== */
  function sceneFork(pane) {
    var vehs = [['hand', 'Xe nâng tay'], ['fork', 'Xe nâng đối trọng']];
    if (D.r && KIND !== 'export' && KIND !== 'print' && KIND !== 'box') vehs.push(['stack', 'Xe nâng điện lên kệ']);
    if (KIND === 'rack' && D.r) vehs.reverse();
    if (KIND === 'heavy' || KIND === 'spill' || KIND === 'box') vehs = vehs.filter(function (v) { return v[0] !== 'hand' || D.d < 1500; });
    if (KIND === 'print') vehs = [['hand', 'Xe nâng tay']];
    var veh = vehs[0][0], ways = D.lg === '3-chan' ? 2 : 0;
    var txt = {
      hand: ['Xe nâng tay luồn càng từ hai phía, người đẩy kéo trực tiếp. Hợp kho nhỏ, quãng ngắn, nâng cao chỉ vài cm để nhấc pallet khỏi sàn.', 'Chiều cao ô luồn càng của pallet phải lớn hơn chiều cao càng khi hạ thấp hết cỡ của xe.'],
      fork: ['Xe nâng đối trọng nhấc pallet lên cao và chạy quãng dài. Hợp bốc xếp lên xe tải, container và vận chuyển trong nhà máy.', 'Mở khoảng cách hai càng cho vừa bề rộng pallet và luồn càng vào ít nhất 3/4 chiều sâu, tải đặt giữa pallet.'],
      stack: ['Xe nâng điện đưa pallet lên tầng kệ cao. Pallet gác hai đầu lên dầm kệ nên phải kiểm tra tải trên kệ trước khi xếp.', '']
    };
    var cfg = { hand: { p0: 330, lift: 46, carry: 150, tipOff: 270, gap: 19 }, fork: { p0: 340, lift: 80, carry: 150, tipOff: 402, gap: 11 }, stack: { p0: 250, lift: 205, carry: 300, tipOff: 402, gap: 11 } };
    var side = '<p class="lab__what" id="fWhat"></p><div class="lab__top"><svg id="fEntry" viewBox="0 0 220 170" role="img" aria-label="Các phía luồn càng nhìn từ trên"></svg></div><p class="lab__foot" id="fFoot"></p>';
    var sc = paneShell(pane, vehs.length > 1 ? modesH('veh', vehs, veh) : '', 'fScene', side);
    function entries() {
      var n4 = veh !== 'hand' && ways !== 2, e = '<defs><marker id="fo" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="' + C.orange + '"/></marker><marker id="fg" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#C9C1AE"/></marker></defs>';
      e += '<rect x="62" y="42" width="100" height="84" rx="3" fill="' + D.col + '" stroke="' + C.ink + '" stroke-width="2"/>';
      for (var i = 0; i < 3; i++) e += '<rect x="' + (72 + i * 34) + '" y="42" width="18" height="84" fill="#000" opacity=".25"/>';
      e += '<rect x="62" y="42" width="100" height="6" fill="#fff" opacity=".3"/>';
      var arr = function (x1, y1, x2, y2, on) { return '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="' + (on ? C.orange : '#C9C1AE') + '" stroke-width="5" fill="none" marker-end="url(#f' + (on ? 'o' : 'g') + ')"/>'; };
      e += arr(8, 84, 56, 84, true) + arr(214, 84, 168, 84, true) + arr(112, 6, 112, 36, n4) + arr(112, 162, 112, 132, n4);
      e += label(112, 90, 'PALLET', 'middle', '#fff', 13);
      $('#fEntry', pane).innerHTML = e;
    }
    function text() {
      $('#fWhat', pane).textContent = txt[veh][0] + (ways === 2 ? ' Pallet 3 chân chỉ luồn càng được theo hướng dọc chân.' : '');
      var foot = txt[veh][1];
      if (veh === 'stack') foot = D.r ? 'Mẫu này có tải trên kệ ' + nf(D.r) + ' kg. Khối lượng hàng không được vượt mức đó. Đưa càng thẳng góc với kệ, không kéo lê pallet trên dầm.' : 'Mẫu này chưa công bố tải trên kệ. Hãy liên hệ ICD Việt Nam trước khi dùng cho kệ chọn lọc.';
      $('#fFoot', pane).textContent = foot;
    }
    function frame(t) {
      var c = cfg[veh], pw = 210, ph = 44, th = 14, gy = FY + 52, hand = veh === 'hand', out = K.stage(VW, VH, { floorY: FY + 6, racks: veh !== 'stack' });
      var tip = hand ? 270 : 402, vStart = -450, entryX = c.p0 - 12, fullX = c.p0 + pw * .86, fh = 0, dx = 0, tipX, placed = null;
      var lowTo = veh === 'stack' ? c.lift - 16 : 0;
      if (t < .16) tipX = lerp(vStart + tip, entryX, ease(t / .16));
      else if (t < .3) tipX = lerp(entryX, fullX, ease((t - .16) / .14));
      else if (t < .46) { tipX = fullX; fh = lerp(0, c.lift, ease((t - .3) / .16)); }
      else if (t < .76) { var k = ease((t - .46) / .3); dx = c.carry * k; tipX = fullX + dx; fh = c.lift; }
      else if (t < .86) { dx = c.carry; tipX = fullX + dx; fh = lerp(c.lift, lowTo, ease((t - .76) / .1)); }
      else { dx = c.carry; fh = lowTo; tipX = lerp(fullX + dx, vStart + tip + c.carry, ease((t - .86) / .14)); if (veh === 'stack') fh = lerp(lowTo, lowTo - 40, (t - .86) / .14); else fh = lerp(lowTo, 0, 1); }
      var vx = tipX - tip, rise = Math.max(0, fh - c.gap), pxx = c.p0 + dx;
      if (t >= .86 && veh === 'stack') rise = Math.max(0, lowTo - c.gap);
      if (t >= .86 && veh !== 'stack') rise = 0;
      if (veh === 'stack') {
        var bx0 = 545, beamY = gy - (c.lift - 16 - c.gap) - 0;
        out += '<rect x="' + bx0 + '" y="20" width="14" height="' + (gy - 20 + 6) + '" fill="#2F6FD6"/><rect x="' + bx0 + '" y="20" width="4" height="' + (gy - 14) + '" fill="#fff" opacity=".3"/><rect x="' + (bx0 + 226) + '" y="20" width="14" height="' + (gy - 14) + '" fill="#2F6FD6"/>';
        for (var kk = 0; kk < (gy - 20) / 20; kk++) out += '<rect x="' + (bx0 + 4) + '" y="' + (30 + kk * 20) + '" width="6" height="8" rx="3" fill="#0F2D5E"/><rect x="' + (bx0 + 230) + '" y="' + (30 + kk * 20) + '" width="6" height="8" rx="3" fill="#0F2D5E"/>';
        out += '<rect x="' + bx0 + '" y="' + (gy - 14 + 0) + '" width="240" height="10" fill="url(#gOrange)"/><rect x="' + bx0 + '" y="' + (beamY) + '" width="240" height="10" fill="url(#gOrange)"/><rect x="' + bx0 + '" y="' + (beamY) + '" width="240" height="2" fill="#fff" opacity=".4"/>';
        out += palSide(bx0 + 12, gy - 14, 216, { h: 44, th: 14 }) + loadSide(bx0 + 14, gy - 14 - 44, 212, 70);
      }
      // pallet đang xử lý
      out += palSide(pxx, gy - rise, pw, { h: ph, th: th }) + loadSide(pxx + 3, gy - rise - ph, pw - 6, KIND === 'print' ? 80 : 78);
      if (t > .76 && t < .86 && veh !== 'stack') out += '';
      var V = hand ? K.handTruck(vx, gy, fh, { forkLen: 210 }) : K.forklift(vx, gy, fh, { mastH: veh === 'stack' ? 318 : 236, forkLen: 190 });
      out += V.svg;
      // cột đích
      if (veh !== 'stack' && !reduce) out += '<rect x="' + (c.p0 + c.carry) + '" y="' + (gy - 2) + '" width="' + pw + '" height="5" fill="none" stroke="' + C.orange + '" stroke-width="2.5" stroke-dasharray="10 7" opacity="' + (t < .5 ? .85 : .0) + '"/>';
      return out;
    }
    var raf = null, t0 = 0, on = false;
    function start() {
      if (on) return; on = true; entries(); text();
      if (reduce) { put(sc, frame(.5)); return; }
      t0 = performance.now();
      (function loop(now) { if (!on) return; put(sc, frame(((now - t0) / 10000) % 1)); raf = requestAnimationFrame(loop); })(t0);
    }
    function stop() { on = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    wireModes(pane, 'veh', function (m) { veh = m; entries(); text(); if (reduce) put(sc, frame(.5)); else t0 = performance.now(); });
    return { show: start, hide: stop };
  }

  /* ===== 03 Vận chuyển ===== */
  var BOX = { '20': { n: 'Container 20 feet', L: 5898, W: 2352, H: 2393 }, '40': { n: 'Container 40 feet', L: 12032, W: 2352, H: 2393 }, '40hc': { n: 'Container 40 feet cao', L: 12032, W: 2352, H: 2698 }, 'xe': { n: 'Xe tải thùng', L: 6200, W: 2300, H: 2300 } };
  function bestFit(CL, CW, L, W) {
    var best = { n: 0, a: 0, b: 0 };
    for (var a = 0; a * L <= CL; a++) { var b = Math.floor((CL - a * L) / W), n = a * Math.floor(CW / W) + b * Math.floor(CW / L); if (n > best.n) best = { n: n, a: a, b: b }; }
    return best;
  }
  function sceneShip(pane) {
    var box = '40';
    var side = '<div class="lab__big"><span id="sN">0</span><em>pallet mỗi tầng</em></div>' + rangeH('sH', 'Chiều cao hàng trên pallet', 400, 2000, 50, KIND === 'frame' ? 800 : 1000) +
      '<ul class="lab__facts" id="sFacts"></ul>' + '<div id="sXeWrap" hidden>' + rangeH('sXe', 'Chiều dài thùng xe', 3000, 9500, 100, 6200) + '</div>' +
      '<p class="lab__foot">Tính xếp phẳng theo kích thước lọt lòng, chưa trừ khe hở. Cách xếp xoay vòng của tài xế có thể thêm vài pallet. Xếp nhiều tầng chỉ khi tải tĩnh của mẫu cho phép.</p>';
    var sc = paneShell(pane, modesH('box', [['20', 'Container 20 feet'], ['40', 'Container 40 feet'], ['40hc', 'Container 40 feet cao'], ['xe', 'Xe tải thùng']], box), 'sScene', side);
    function draw() {
      var B = Object.assign({}, BOX[box]), xe = box === 'xe';
      if (xe) B.L = +$('#sXe', pane).value;
      $('#sXeWrap', pane).hidden = !xe; $('#sXeOut', pane).textContent = nf(B.L) + ' mm';
      var hh = +$('#sH', pane).value; $('#sHOut', pane).textContent = nf(hh) + ' mm';
      var fit = bestFit(B.L, B.W, D.L, D.W), s = Math.min(740 / B.L, 170 / B.W), cw = B.L * s, ch = B.W * s, ox = (VW - cw) / 2, oy = 22, out = '';
      out += '<rect width="' + VW + '" height="' + (VH + 30) + '" fill="#E9E4D7"/>';
      out += '<rect x="' + (ox - 10) + '" y="' + (oy - 10) + '" width="' + (cw + 20) + '" height="' + (ch + 20) + '" rx="3" fill="url(#gSteel)"/>' + '<rect x="' + (ox - 10) + '" y="' + (oy - 10) + '" width="' + (cw + 20) + '" height="' + (ch + 20) + '" fill="none" stroke="#2B3039" stroke-width="2"/>';
      for (var rb = 0; rb < cw / 18; rb++) out += '<rect x="' + (ox - 10 + rb * 18) + '" y="' + (oy - 10) + '" width="3" height="4" fill="#2B3039" opacity=".5"/>';
      out += '<rect x="' + ox + '" y="' + oy + '" width="' + cw + '" height="' + ch + '" fill="#C9A677"/><rect x="' + ox + '" y="' + oy + '" width="' + cw + '" height="' + ch + '" fill="#000" filter="url(#kGrain)" opacity=".25"/>';
      for (var pl = 1; pl < ch / 14; pl++) out += '<line x1="' + ox + '" y1="' + (oy + pl * 14) + '" x2="' + (ox + cw) + '" y2="' + (oy + pl * 14) + '" stroke="#7A5B2E" stroke-opacity=".28"/>';
      var i = 0, x = 0, perA = Math.floor(B.W / D.W), perB = Math.floor(B.W / D.L);
      var rect = function (px, py, w, h, idx) {
        var x0 = ox + px * s + .8, y0 = oy + py * s + .8, ww = Math.max(w * s - 1.6, 1), hh2 = Math.max(h * s - 1.6, 1);
        return '<g class="lab-drop" style="animation-delay:' + (idx * 28) + 'ms"><rect x="' + (x0 + 2) + '" y="' + (y0 + 3) + '" width="' + ww + '" height="' + hh2 + '" fill="#000" opacity=".28"/><rect x="' + x0 + '" y="' + y0 + '" width="' + ww + '" height="' + hh2 + '" fill="' + P.T + '"/><rect x="' + x0 + '" y="' + y0 + '" width="' + ww + '" height="' + hh2 + '" fill="' + P.G + '" opacity=".55"/><rect x="' + x0 + '" y="' + y0 + '" width="' + ww + '" height="' + hh2 + '" fill="none" stroke="' + P.hi + '" stroke-width="1.3"/></g>';
      };
      for (var a = 0; a < fit.a; a++) { for (var r = 0; r < perA; r++) out += rect(x, r * D.W, D.L, D.W, i++); x += D.L; }
      for (var b = 0; b < fit.b; b++) { for (var r2 = 0; r2 < perB; r2++) out += rect(x, r2 * D.L, D.W, D.L, i++); x += D.W; }
      out += '<rect x="' + (ox + cw + 10) + '" y="' + (oy - 10) + '" width="12" height="' + (ch + 20) + '" fill="url(#gSteelV)"/>' + label(ox, oy - 14, 'ĐẦU THÙNG', 'start', C.steel, 12) + label(ox + cw + 16, oy + ch + 30, 'CỬA', 'start', C.steel, 12);
      // mặt cắt dọc
      var layers = Math.max(1, Math.floor(B.H / (D.H + hh))), cols = fit.a + fit.b, sy = Math.min(s, 80 / B.H), y1 = 236, hB = B.H * sy;
      out += '<rect x="' + (ox - 6) + '" y="' + (y1 - hB - 6) + '" width="' + (cw + 12) + '" height="' + (hB + 12) + '" fill="#8D95A1" opacity=".5"/><rect x="' + ox + '" y="' + (y1 - hB) + '" width="' + cw + '" height="' + hB + '" fill="#F4F1E8"/><rect x="' + ox + '" y="' + y1 + '" width="' + cw + '" height="3" fill="#6F6A5E"/>';
      var cx0 = 0;
      for (var cc = 0; cc < cols; cc++) {
        var wL = cc < fit.a ? D.L : D.W;
        for (var ly = 0; ly < layers; ly++) {
          var yb = y1 - ly * (D.H + hh) * sy, ph2 = Math.max(D.H * sy, 2), chh = hh * sy;
          out += '<rect x="' + (ox + cx0 * s + .6) + '" y="' + (yb - ph2) + '" width="' + Math.max(wL * s - 1.2, 1) + '" height="' + ph2 + '" fill="' + D.col + '"/>';
          out += '<rect x="' + (ox + cx0 * s + .6) + '" y="' + (yb - ph2 - chh) + '" width="' + Math.max(wL * s - 1.2, 1) + '" height="' + chh + '" fill="#D5AE74" stroke="#9C7440" stroke-width=".8"/>';
        }
        cx0 += wL;
      }
      out += label(ox, y1 + 22, 'MẶT CẮT DỌC: ' + layers + ' tầng', 'start', C.navy, 13);
      sc.innerHTML = '<svg viewBox="0 0 ' + VW + ' ' + (VH + 6) + '" role="img" xmlns="http://www.w3.org/2000/svg">' + out + '</svg>';
      $('#sN', pane).textContent = fit.n;
      var kgp = D.kg ? ' (' + nf(fit.n * layers * D.kg) + ' kg riêng pallet)' : '';
      $('#sFacts', pane).innerHTML =
        '<li><span>Lọt lòng</span><b>' + nf(B.L) + ' × ' + nf(B.W) + ' × ' + nf(B.H) + ' mm</b></li>' +
        '<li><span>Cách xếp</span><b>' + fit.a + ' hàng dọc theo chiều dài pallet' + (fit.b ? ', ' + fit.b + ' hàng quay ngang' : '') + '</b></li>' +
        '<li><span>Số tầng theo chiều cao</span><b>' + layers + ' tầng</b></li>' +
        '<li><span>Tổng số pallet</span><b>' + fit.n * layers + kgp + '</b></li>' +
        (layers > 1 ? '<li><span>Lưu ý</span><b>Xếp ' + layers + ' tầng cần kiểm tra tải tĩnh' + (D.s ? ' (' + nf(D.s) + ' kg)' : '') + '</b></li>' : '') +
        (xe ? '<li><span>Giả định</span><b>Rộng lọt lòng ' + nf(B.W) + ' mm, cao ' + nf(B.H) + ' mm</b></li>' : '');
    }
    wireModes(pane, 'box', function (m) { box = m; draw(); });
    $$('input[type=range]', pane).forEach(function (e) { e.addEventListener('input', draw); });
    return { show: draw };
  }

  /* ===== 04 Chất liệu ===== */
  function sceneMat(pane) {
    var side = '<p class="lab__what">Mẫu này làm từ <strong>' + (D.m === 'PP' ? 'nhựa PP' : 'nhựa HDPE') + '</strong>. Kéo nhiệt độ để xem hai loại nhựa phản ứng khác nhau.</p>' + rangeH('mT', 'Nhiệt độ môi trường', -30, 60, 1, 25) +
      '<p class="lab__verdict" id="mVerd" aria-live="polite"></p><p class="lab__foot">Đặc tính chung của vật liệu theo tài liệu ngành. Một số nhà sản xuất nước ngoài nêu PP giòn dưới khoảng -5 đến -10 độ C và HDPE nguyên sinh dùng được tới khoảng -40 độ C. Hãy đối chiếu dải nhiệt độ sử dụng do nhà sản xuất công bố cho từng mẫu.</p>';
    var sc = paneShell(pane, '', 'mScene', side);
    function draw() {
      var T = +$('#mT', pane).value; $('#mTOut', pane).textContent = T + ' °C';
      var cold = T < 0, hot = T > 40, sagH = 6 + Math.max(0, T - 25) * .6 - (T < 0 ? 2 : 0), sagP = 3 + Math.max(0, T - 25) * .3, crack = T <= -5;
      var out = '<rect width="' + VW + '" height="' + VH + '" fill="' + (cold ? '#DCE8F4' : hot ? '#F6E3D0' : '#EEEBE2') + '"/>';
      var beam = function (y, name, sag, col, cr, mine, kol) {
        var o = '', x0 = 90, x1 = 640;
        o += '<rect x="' + (x0 - 24) + '" y="' + (y + 26) + '" width="34" height="56" fill="url(#gSteelV)"/><rect x="' + (x1 - 10) + '" y="' + (y + 26) + '" width="34" height="56" fill="url(#gSteelV)"/>';
        o += '<rect x="' + (x0 - 24) + '" y="' + (y + 26) + '" width="34" height="5" fill="#2B3039" opacity=".5"/><rect x="' + (x1 - 10) + '" y="' + (y + 26) + '" width="34" height="5" fill="#2B3039" opacity=".5"/>';
        o += '<g transform="translate(0,0)"><path d="M' + x0 + ' ' + (y + 22) + ' Q ' + ((x0 + x1) / 2) + ' ' + (y + 22 + sag * 2) + ' ' + x1 + ' ' + (y + 22) + '" fill="none" stroke="' + K.shade(col, -.35) + '" stroke-width="24" stroke-linecap="butt"/>';
        o += '<path d="M' + x0 + ' ' + (y + 18) + ' Q ' + ((x0 + x1) / 2) + ' ' + (y + 18 + sag * 2) + ' ' + x1 + ' ' + (y + 18) + '" fill="none" stroke="' + col + '" stroke-width="14"/><path d="M' + x0 + ' ' + (y + 14) + ' Q ' + ((x0 + x1) / 2) + ' ' + (y + 14 + sag * 2) + ' ' + x1 + ' ' + (y + 14) + '" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3"/></g>';
        o += '<g transform="translate(0,' + sag + ')">';
        for (var i = 0; i < 6; i++) o += '<rect x="' + (250 + i * 44) + '" y="' + (y - 34) + '" width="42" height="34" fill="url(#gCardF)" stroke="#7A5B2E" stroke-width="1"/><rect x="' + (250 + i * 44 + 18) + '" y="' + (y - 34) + '" width="6" height="34" fill="#F1E2BE" opacity=".7"/>';
        o += '</g>';
        if (cr) o += '<path d="M ' + ((x0 + x1) / 2 - 8) + ' ' + (y + 12 + sag * 2) + ' l 10 8 l -8 6 l 12 10 M ' + ((x0 + x1) / 2 + 30) + ' ' + (y + 14 + sag * 2) + ' l -8 10 l 10 6" stroke="' + C.red + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
        o += label(x0 - 24, y - 54, name + (mine ? '  (mẫu này)' : ''), 'start', mine ? '#C2410C' : C.navy, 18);
        return o;
      };
      out += beam(78, 'HDPE', sagH, '#1E56C8', false, D.m !== 'PP') + beam(222, 'PP đồng nhất', sagP, '#D9731A', crack, D.m === 'PP');
      if (cold) for (var f = 0; f < 22; f++) out += '<circle cx="' + (30 + (f * 37) % 700) + '" cy="' + (20 + (f * 53) % 290) + '" r="' + (1.5 + f % 3) + '" fill="#fff" opacity=".8"/>';
      if (hot) for (var h = 0; h < 5; h++) out += '<path d="M' + (140 + h * 120) + ' 320 q 8 -14 0 -28 t 0 -28" stroke="#E8730C" stroke-opacity=".35" stroke-width="3" fill="none"/>';
      var ty0 = 40, th = 250, fill = (T + 30) / 90;
      out += '<rect x="708" y="' + ty0 + '" width="22" height="' + th + '" rx="11" fill="#fff" stroke="' + C.ink + '" stroke-width="2.5"/><rect x="713" y="' + (ty0 + th - 14 - fill * (th - 28)) + '" width="12" height="' + (fill * (th - 28) + 12) + '" rx="6" fill="' + (cold ? '#2F7BD9' : hot ? C.red : C.green) + '"/><circle cx="719" cy="' + (ty0 + th + 6) + '" r="16" fill="' + (cold ? '#2F7BD9' : hot ? C.red : C.green) + '" stroke="' + C.ink + '" stroke-width="2.5"/>';
      put(sc, out);
      var v = $('#mVerd', pane);
      if (crack) verdict(v, 'warn', 'Lạnh sâu: HDPE vẫn dẻo, chịu va đập tốt. PP đồng nhất trở nên giòn, dễ nứt khi va chạm. Kho lạnh cần HDPE hoặc PP copolymer.');
      else if (cold) verdict(v, 'warn', 'Dưới 0 độ C: vật liệu bắt đầu cứng và giòn dần. HDPE giữ độ dẻo tốt hơn PP đồng nhất.');
      else if (hot) verdict(v, 'warn', 'Nhiệt độ cao: nhựa mềm dần và võng nhiều hơn khi chịu tải, HDPE nhiều hơn PP. PP nóng chảy khoảng 160 đến 166 độ C, HDPE thấp hơn.');
      else verdict(v, 'ok', 'Nhiệt độ phòng: PP cứng hơn nên võng ít hơn khi đặt lên kệ. HDPE kém cứng hơn nhưng bền va đập và dẻo hơn khi trời lạnh.');
    }
    $('#mT', pane).addEventListener('input', draw);
    return { show: draw };
  }

  /* ===== Chống tràn ===== */
  function spillDraw(leak, capK, still) {
    var out = K.stage(VW, VH, { floorY: FY, racks: false }), x0 = 130, x1 = 650, wy = 230, depth = 82, cap = capK, fillRaw = cap ? leak / cap : 0, fill = Math.min(fillRaw, 1), over = fillRaw > 1.001;
    var yTop = wy, yBot = wy + depth, ly = yBot - fill * (depth - 8);
    out += K.shadow((x0 + x1) / 2, yBot + 18, 290, 9, .4);
    out += '<rect x="' + x0 + '" y="' + yTop + '" width="' + (x1 - x0) + '" height="' + depth + '" fill="#0D1016"/>';
    out += '<rect x="' + (x0 + 14) + '" y="' + ly + '" width="' + (x1 - x0 - 28) + '" height="' + (yBot - ly - 6) + '" fill="#3A2C10"/><rect x="' + (x0 + 14) + '" y="' + ly + '" width="' + (x1 - x0 - 28) + '" height="4" fill="#8D6A28" opacity=".8"/>';
    out += '<rect x="' + x0 + '" y="' + yTop + '" width="' + (x1 - x0) + '" height="' + depth + '" fill="url(#gGlass)"/>';
    out += '<rect x="' + x0 + '" y="' + yBot + '" width="' + (x1 - x0) + '" height="8" fill="' + P.S + '"/><rect x="' + x0 + '" y="' + yTop + '" width="16" height="' + depth + '" fill="' + P.F + '"/><rect x="' + (x1 - 16) + '" y="' + yTop + '" width="16" height="' + depth + '" fill="' + P.F + '"/><rect x="' + x0 + '" y="' + (yTop - 6) + '" width="' + (x1 - x0) + '" height="10" fill="' + P.F + '"/><rect x="' + x0 + '" y="' + (yTop - 6) + '" width="' + (x1 - x0) + '" height="2" fill="#fff" opacity=".45"/>';
    // sàn lưới đỡ phuy
    out += '<rect x="' + (x0 + 16) + '" y="' + (yTop - 18) + '" width="' + (x1 - x0 - 32) + '" height="14" fill="url(#gSteelV)"/>';
    for (var g = 0; g < 40; g++) out += '<rect x="' + (x0 + 22 + g * 12.6) + '" y="' + (yTop - 18) + '" width="3" height="14" fill="#2B3039" opacity=".7"/>';
    // phuy
    var nd = Math.min(4, Math.max(2, Math.floor(D.L / 600) * Math.floor(D.W / 600) || 2)); nd = Math.min(nd, 3);
    var dx = (x1 - x0 - 80) / nd, r = 40;
    for (var d = 0; d < nd; d++) out += K.drum(x0 + 40 + dx * (d + .5) + (d ? 0 : 0), yTop - 18, r, 118, d % 2 ? '#1F5FA8' : '#B84A2A');
    // rò rỉ từ phuy đầu tiên
    if (leak > 0.01) {
      var dxx = x0 + 40 + dx * .5;
      out += '<path d="M' + (dxx - 8) + ' ' + (yTop - 22) + ' q -2 ' + (4 + leak * 24) + ' 0 ' + (10 + leak * 20) + '" stroke="#3A2C10" stroke-width="6" fill="none" stroke-linecap="round" opacity=".95"/>';
      if (!still && !reduce) out += '<circle class="lab-drip" cx="' + (dxx - 8) + '" cy="' + (yTop - 10) + '" r="4" fill="#3A2C10"/>';
    }
    if (over) {
      var sp = Math.min((fillRaw - 1) * 120, 200);
      out += '<ellipse cx="' + (x0 - 6) + '" cy="' + (yBot + 18) + '" rx="' + (30 + sp * .5) + '" ry="10" fill="#3A2C10" opacity=".85"/><ellipse cx="' + (x1 + 6) + '" cy="' + (yBot + 18) + '" rx="' + (30 + sp * .5) + '" ry="10" fill="#3A2C10" opacity=".85"/>';
      out += tag((x0 + x1) / 2, 44, 'TRÀN RA NGOÀI', C.red, 20);
    } else out += tag((x0 + x1) / 2, 44, 'HỐ THU GIỮ LẠI', C.green, 20);
    out += label(x0 + 22, yBot + 34, 'HỐ THU', 'start', C.steel, 13);
    return { svg: out, over: over, fill: fillRaw };
  }
  function sceneSpill(pane) {
    var size = '110';
    var side = '<p class="lab__what">Theo QCVN 05A:2020/BCT (sửa đổi 2024), hệ thống thu gom của kho hóa chất ăn mòn và hóa chất độc dạng lỏng phải có dung tích tối thiểu bằng 110% phương tiện chứa lớn nhất. Pallet chống tràn đóng vai trò khay hứng cho phuy đặt trên sàn lưới.</p>' + rangeH('pLeak', 'Lượng rò rỉ (phần trăm phuy lớn nhất)', 0, 100, 1, 60) +
      '<p class="lab__verdict" id="pVerd" aria-live="polite"></p><p class="lab__foot">Hình minh họa nguyên lý. Dung tích hố thu cụ thể của mẫu này lấy theo thông số ICD công bố. Quy tắc 110% là của Việt Nam, không phải 10% tổng thể tích như một số tài liệu nước ngoài.</p>';
    var sc = paneShell(pane, modesH('cap', [['110', 'Hố thu đủ 110%'], ['60', 'Hố thu nhỏ hơn quy định']], size), 'pScene', side);
    function draw() {
      var leak = +$('#pLeak', pane).value / 100, cap = size === '110' ? 1.1 : .6; $('#pLeakOut', pane).textContent = Math.round(leak * 100) + '% của phuy lớn nhất';
      var R = spillDraw(leak, cap, false); put(sc, R.svg);
      var v = $('#pVerd', pane);
      if (R.over) verdict(v, 'bad', 'Hố thu không chứa hết: chất lỏng tràn ra sàn kho. Đây là lý do hố thu phải đạt tối thiểu 110% phương tiện chứa lớn nhất.');
      else verdict(v, 'ok', 'Hố thu giữ được toàn bộ lượng rò. Còn dư ' + Math.round((1 - R.fill) * 100) + '% dung tích.');
    }
    $('#pLeak', pane).addEventListener('input', draw);
    wireModes(pane, 'cap', function (m) { size = m; draw(); });
    return { show: draw };
  }

  /* ===== Xếp lồng ===== */
  function nestDraw(n) {
    var out = K.stage(VW, VH, { floorY: FY + 6, racks: false }), kk = Math.min(.3, 250 / (D.H * n), 260 / D.L), pw = D.L * kk, hp = Math.max(D.H * kk, 14), pitch = hp / 2.25, th = Math.max(hp * .3, 7), gy = FY + 56;
    var stack = function (x, nested) {
      var o = '';
      for (var i = 0; i < n; i++) {
        var by = gy - (nested ? i * pitch : i * hp);
        if (!nested || i === 0) o += '<rect x="' + x + '" y="' + (by - hp) + '" width="' + pw + '" height="' + hp + '" fill="#10141C"/>';
        if (!nested || i === 0) [.14, .5, .86].forEach(function (k) { o += '<rect x="' + (x + pw * k - pw * .06) + '" y="' + (by - hp + th) + '" width="' + pw * .12 + '" height="' + (hp - th) + '" fill="' + P.S + '"/>'; });
        o += '<rect x="' + x + '" y="' + (by - hp) + '" width="' + pw + '" height="' + th + '" fill="' + P.F + '" stroke="#000" stroke-opacity=".25"/><rect x="' + x + '" y="' + (by - hp) + '" width="' + pw + '" height="1.6" fill="#fff" opacity=".45"/>';
      }
      return o;
    };
    var x1 = 90, x2 = 430, hs = n * hp, hn = hp + (n - 1) * pitch;
    out += K.shadow(x1 + pw / 2, gy + 3, pw * .6, 6, .4) + K.shadow(x2 + pw / 2, gy + 3, pw * .6, 6, .4);
    out += stack(x1, false) + stack(x2, true);
    out += label(x1 + pw / 2, 36, 'XẾP RỜI', 'middle', C.navy, 18) + label(x2 + pw / 2, 36, 'XẾP LỒNG', 'middle', C.navy, 18);
    out += '<path d="M' + (x1 + pw + 14) + ' ' + (gy - hs) + ' V ' + gy + '" stroke="' + C.ink + '" stroke-width="2"/><path d="M' + (x2 + pw + 14) + ' ' + (gy - hn) + ' V ' + gy + '" stroke="' + C.ink + '" stroke-width="2"/>';
    return { svg: out, hs: n * D.H, hn: D.H + (n - 1) * D.H / 2.25 };
  }
  function sceneNest(pane) {
    var side = '<p class="lab__what">Pallet xuất khẩu loại lồng có gầm rỗng, chân hình cốc hoặc nón cụt. Khi rỗng, pallet này chui vào pallet kia nên chồng cao hơn rất ít so với xếp rời, tiết kiệm chỗ khi hồi pallet hoặc lưu kho.</p>' + rangeH('nN', 'Số pallet rỗng', 2, 14, 1, 8) +
      '<ul class="lab__facts" id="nFacts"></ul><p class="lab__foot">Ước tính minh họa theo tỷ lệ lồng khoảng 2,25 pallet vào một chiều cao pallet, lấy từ tài liệu nhà sản xuất quốc tế. Tỷ lệ lồng thật của mẫu này cần ICD xác nhận. Pallet lồng chân cốc không dùng cho kệ.</p>';
    var sc = paneShell(pane, '', 'nScene', side);
    function draw() {
      var n = +$('#nN', pane).value; $('#nNOut', pane).textContent = n + ' pallet';
      var R = nestDraw(n); put(sc, R.svg);
      $('#nFacts', pane).innerHTML = '<li><span>Xếp rời</span><b>khoảng ' + nf(R.hs) + ' mm</b></li><li><span>Xếp lồng</span><b>khoảng ' + nf(R.hn) + ' mm</b></li><li><span>Tiết kiệm chiều cao</span><b>khoảng ' + Math.round((1 - R.hn / R.hs) * 100) + '%</b></li>';
    }
    $('#nN', pane).addEventListener('input', draw);
    return { show: draw };
  }

  /* ===== 05 Cách dùng ===== */
  var STEPS = {
    inspect: ['Kiểm tra pallet trước khi dùng', 'Soi mặt trên và chân xem có nứt, mẻ, cong vênh không. Pallet nứt hoặc biến dạng thì loại ra, không dùng chịu tải.'],
    load: ['Xếp hàng đều, không tràn mép', 'Đặt hàng vào giữa, trọng tâm thấp, mép hàng nằm trong mép pallet. Hàng chồng chênh lệch dễ làm pallet võng và đổ.'],
    wrap: ['Quấn màng cố định kiện hàng', 'Quấn màng PE từ chân pallet lên trên, chồng mép để hàng và pallet thành một khối, không xê dịch khi vận chuyển.'],
    fork: ['Luồn càng hết chiều sâu', 'Đưa hai càng vào ít nhất 3/4 chiều sâu pallet, nâng nhẹ rồi mới chạy. Không kéo lê pallet trên sàn và không nâng bằng một bên càng.'],
    store: ['Xếp kho đúng mức tải', 'Đặt trên nền phẳng. Xếp chồng thì không vượt tải tĩnh, lên kệ thì không vượt tải trên kệ của mẫu.'],
    rackchk: ['Đối chiếu tải trên kệ', 'Chỉ đưa lên kệ khi mẫu có tải trên kệ công bố. Khối lượng hàng không vượt mức đó và hai đầu pallet gác chắc lên dầm.'],
    rackput: ['Đặt lên dầm kệ', 'Đưa pallet thẳng góc với kệ, hạ nhẹ cho hai đầu gác đều lên dầm, rồi mới rút càng. Không kéo lê pallet trên dầm.'],
    spPlace: ['Đặt pallet ở nơi dễ kiểm soát', 'Đặt trên nền phẳng, tránh lối thoát hiểm, kiểm tra hố thu sạch và không nứt trước khi xếp phuy.'],
    spDrum: ['Xếp phuy lên sàn lưới', 'Đặt phuy đứng, chắc trên sàn lưới, nắp đậy kín. Không xếp quá số phuy và tải cho phép của mẫu.'],
    spLeak: ['Khi phuy rò rỉ', 'Chất lỏng rò qua sàn lưới xuống hố thu bên dưới, không chảy ra sàn kho nên có thời gian xử lý.'],
    spClean: ['Xử lý và vệ sinh hố thu', 'Hút chất lỏng trong hố thu, xử lý theo quy định của loại hóa chất, vệ sinh hố trước khi dùng lại.'],
    flat: ['Làm phẳng nền trước khi trải', 'Quét sạch vật cứng, kiểm tra nền phẳng. Nền gồ ghề làm tấm cong và hàng xếp bị nghiêng.'],
    lay: ['Trải tấm, xếp hàng lên trên', 'Trải tấm sát nhau, xếp hàng đều lên mặt tấm để tải đè phân bố đều xuống nền.'],
    notlift: ['Không dùng như pallet nâng', 'Tấm phẳng không có khoảng hở cho càng nâng nên không dùng xe nâng nhấc trực tiếp tấm này.'],
    prGroove: ['Kiểm tra rãnh khay', 'Rãnh trên mặt khay phải sạch, không nứt, để khớp với thanh cấp giấy của máy in.'],
    prStack: ['Xếp giấy đều trên khay', 'Xếp chồng giấy ngay ngắn trên mặt khay, mép giấy không tràn khỏi khay.'],
    prFeed: ['Đưa khay tới máy in', 'Dùng xe nâng tay đưa cả khay và chồng giấy tới bàn cấp giấy, hạ đúng vị trí.'],
    prSwap: ['Cấp giấy liên tục', 'Thanh cấp giấy của máy ăn vào rãnh trên khay, nâng chồng giấy dần. Hết khay thì thay khay mới.'],
    exCont: ['Xếp vào container', 'Đẩy pallet và hàng vào container, xếp sát nhau theo hàng, đóng cửa. Pallet nhựa không thuộc diện ISPM 15.'],
    exNest: ['Hồi pallet rỗng', 'Pallet rỗng loại lồng chồng vào nhau cho gọn khi vận chuyển hoặc lưu kho.']
  };
  function stepIds() {
    switch (KIND) {
      case 'rack': return ['inspect', 'load', 'rackchk', 'fork', 'rackput'];
      case 'spill': return ['spPlace', 'spDrum', 'spLeak', 'spClean'];
      case 'floor': return D.H <= 60 ? ['flat', 'lay', 'notlift'] : ['flat', 'lay', 'store'];
      case 'print': return ['prGroove', 'prStack', 'prFeed', 'prSwap'];
      case 'export': return ['inspect', 'load', 'wrap', 'exCont', D.lg === 'coc' ? 'exNest' : 'store'].filter(Boolean);
      case 'frame': return ['inspect', 'load', 'wrap', 'exCont', 'store'];
      default: return ['inspect', 'load', 'wrap', 'fork', 'store'];
    }
  }
  function useScene(id) {
    var o = K.stage(VW, VH, { floorY: FY }), px = 200, pw = 280, ph = KIND === 'floor' || KIND === 'frame' ? 14 : 36;
    var pallet = function (x, y) { return ph < 20 ? slabPal(x, y, pw, ph) : pal3(x, y, pw, { h: ph }); };
    switch (id) {
      case 'inspect':
        o += pallet(px, BASE) + '<rect x="' + (px + 6) + '" y="' + (BASE - ph - 40) + '" width="10" height="46" fill="' + C.orange + '" opacity=".75" class="' + (reduce ? '' : 'lab-scan') + '"/>';
        o += '<g transform="translate(520 150)"><circle cx="0" cy="0" r="50" fill="url(#gGlass)" stroke="#2B3039" stroke-width="9"/><path d="M36 36 L84 84" stroke="#2B3039" stroke-width="12" stroke-linecap="round"/><path d="M-20 10 l 12 -14 l 8 8 l 14 -16" stroke="' + C.red + '" stroke-width="4" fill="none"/></g>' + tag(400, 50, 'NỨT? MẺ? CONG?', C.navy, 22); break;
      case 'load':
        o += pallet(px, BASE) + '<g class="lab-drop">' + cargo(px, BASE - ph, pw, 105) + '</g><path d="M' + px + ' 100 v-14 M' + (px + pw) + ' 100 v-14 M' + px + ' 92 H' + (px + pw) + '" stroke="' + C.green + '" stroke-width="3.5" fill="none"/>' + tag(px + pw / 2, 64, 'TRONG MÉP PALLET', C.green, 20); break;
      case 'wrap':
        o += pallet(px, BASE) + cargo(px, BASE - ph, pw, 130, { wrap: true });
        for (var k = 0; k < 9; k++) o += '<path class="' + (reduce ? '' : 'lab-wrap') + '" style="animation-delay:' + (k * 200) + 'ms" d="M' + (px - 4) + ' ' + (BASE - ph - 20 - k * 14) + ' L' + (px + pw + 6) + ' ' + (BASE - ph - 26 - k * 14) + '" stroke="#CFE8F8" stroke-width="5" opacity=".7"/>';
        o += tag(px + pw / 2 + 40, 44, 'MÀNG PE QUẤN CHỒNG MÉP', C.navy, 20); break;
      case 'fork': {
        var cfg = { pw: 210 }, gy = FY + 52, fx = 210 - 402 + 178 + 28;
        o += palSide(300, gy - 22, 210, { h: 44 }) + loadSide(303, gy - 22 - 44, 204, 70);
        o += K.forklift(40, gy, 22, { mastH: 236, forkLen: 190 }).svg + tag(450, 44, 'LUỒN HẾT CHIỀU SÂU', C.navy, 20); break; }
      case 'store':
        o += rackBay(); break;
      case 'rackchk':
        o += rackFrontPair() + tag(400, 42, D.r ? 'TỐI ĐA ' + nf(D.r) + ' KG TRÊN KỆ' : 'KIỂM TRA TẢI TRÊN KỆ', C.navy, 22); break;
      case 'rackput':
        o += rackBay(true) + tag(400, 42, 'HẠ NHẸ, HAI ĐẦU GÁC ĐỀU', C.navy, 20); break;
      case 'spPlace': o += spillDraw(0, 1.1, true).svg + tag(400, 80, 'NỀN PHẲNG, HỐ THU SẠCH', C.navy, 20); break;
      case 'spDrum': o += spillDraw(0, 1.1, true).svg; break;
      case 'spLeak': o += spillDraw(.5, 1.1, false).svg; break;
      case 'spClean': o += spillDraw(.25, 1.1, true).svg + tag(400, 80, 'HÚT, XỬ LÝ, VỆ SINH', C.navy, 20); break;
      case 'flat':
        o += '<rect x="80" y="' + (BASE - 18) + '" width="620" height="3" fill="#E8730C" opacity=".8"/><circle cx="390" cy="' + (BASE - 36) + '" r="22" fill="#F4E27A" stroke="#2B3039" stroke-width="4"/><circle cx="390" cy="' + (BASE - 36) + '" r="6" fill="#7FBF3F"/>' + tag(390, 70, 'NỀN PHẲNG, SẠCH', C.navy, 22); break;
      case 'lay':
        o += slabPal(px, BASE, pw, ph) + '<g class="lab-drop">' + cargo(px, BASE - ph, pw, 110, { wrap: true }) + '</g>'; break;
      case 'notlift':
        o += slabPal(px, BASE, pw, ph) + '<g transform="translate(-30 0)">' + K.forklift(-170, FY + 52, 0, { mastH: 236, forkLen: 190 }).svg + '</g><g transform="translate(560 100)"><circle r="46" fill="#fff" stroke="' + C.red + '" stroke-width="10"/><path d="M-26 -26 L26 26 M26 -26 L-26 26" stroke="' + C.red + '" stroke-width="10" stroke-linecap="round"/></g>'; break;
      case 'prGroove':
        o += K.pallet(px - 30, BASE, 340, { h: 34, d: 150, col: D.col, face: 'ho', feet: 3 });
        for (var g = 0; g < 6; g++) o += '<path d="M' + (px - 6 + g * 56) + ' ' + (BASE - 58) + ' l 66 -32" stroke="#0B0E14" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/>';
        o += tag(420, 52, 'RÃNH KHỚP THANH CẤP GIẤY', C.navy, 20); break;
      case 'prStack': o += pallet(px, BASE) + cargo(px, BASE - ph, pw, 130); break;
      case 'prFeed': {
        var gy3 = FY + 52; o += palSide(330, gy3 - 18, 210, { h: 44 }) + loadSide(333, gy3 - 18 - 44, 204, 100) + K.handTruck(30, gy3, 18, { forkLen: 210 }).svg;
        o += '<rect x="620" y="80" width="130" height="' + (gy3 - 80) + '" rx="4" fill="url(#gDark)"/>' + label(685, 70, 'MÁY IN', 'middle', C.navy, 18); break; }
      case 'prSwap':
        o += '<rect x="170" y="' + (BASE - 80) + '" width="400" height="12" fill="url(#gSteelV)"/>';
        o += pallet(px, BASE) + cargo(px, BASE - ph, pw, 130);
        [0, 1].forEach(function (b) { o += '<rect x="' + (px + 60 + b * 120) + '" y="' + (BASE - 70) + '" width="18" height="46" fill="url(#gSteelV)" class="' + (reduce ? '' : 'lab-press') + '"/>'; });
        o += tag(430, 50, 'THANH CẤP GIẤY ĂN VÀO RÃNH', C.navy, 20); break;
      case 'exCont':
        o += containerSide(); break;
      case 'exNest': o += nestDraw(6).svg; break;
    }
    return o;
  }
  function rackBay(placing) {
    var gy = FY + 52, o = '', bx = 160, beamTop = gy - 130;
    [bx, bx + 480].forEach(function (cx) { o += '<rect x="' + cx + '" y="20" width="16" height="' + (gy - 14) + '" fill="#2F6FD6"/><rect x="' + cx + '" y="20" width="4" height="' + (gy - 14) + '" fill="#fff" opacity=".3"/>'; for (var k = 0; k < (gy - 20) / 20; k++) o += '<rect x="' + (cx + 5) + '" y="' + (30 + k * 20) + '" width="6" height="8" rx="3" fill="#0F2D5E"/>'; });
    o += '<rect x="' + bx + '" y="' + (gy - 14) + '" width="496" height="10" fill="url(#gOrange)"/><rect x="' + bx + '" y="' + beamTop + '" width="496" height="10" fill="url(#gOrange)"/><rect x="' + bx + '" y="' + (beamTop - 124) + '" width="496" height="10" fill="url(#gOrange)"/>';
    o += palSide(bx + 24, gy - 14, 210, { h: 44 }) + loadSide(bx + 27, gy - 58, 204, 66) + palSide(bx + 250, gy - 14, 210, { h: 44 }) + loadSide(bx + 253, gy - 58, 204, 66);
    o += palSide(bx + 24, beamTop, 210, { h: 44 }) + loadSide(bx + 27, beamTop - 44, 204, 60);
    if (placing) o += palSide(bx + 250, beamTop - 22, 210, { h: 44 }) + loadSide(bx + 253, beamTop - 22 - 44, 204, 60); else o += palSide(bx + 250, beamTop, 210, { h: 44 }) + loadSide(bx + 253, beamTop - 44, 204, 60);
    return o;
  }
  function rackFrontPair() {
    var by = 232, px = 200, pw = 280, o = '';
    [px - 18, px + pw - 22].forEach(function (bx) {
      o += '<path d="M' + bx + ' ' + by + ' L' + (bx + 36) + ' ' + by + ' L' + (bx + 76) + ' ' + (by - 18) + ' L' + (bx + 40) + ' ' + (by - 18) + ' Z" fill="url(#gOrange)"/><rect x="' + bx + '" y="' + by + '" width="36" height="12" fill="url(#gOrange)"/>';
      o += '<rect x="' + (bx + 8) + '" y="' + (by + 12) + '" width="14" height="' + (BASE - by - 12) + '" fill="#2F6FD6"/>';
    });
    o += pal3(px, by, pw, { h: 36 }) + cargo(px, by - 36, pw, 110, { wrap: true });
    return o;
  }
  function containerSide() {
    var x0 = 70, y0 = 150, w = 640, h = 120, o = '<rect x="' + (x0 - 8) + '" y="' + (y0 - 8) + '" width="' + (w + 16) + '" height="' + (h + 16) + '" rx="4" fill="url(#gSteel)"/><rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#F4F1E8"/>';
    for (var i = 0; i < 10; i++) { var bx = x0 + 10 + i * 62; o += '<rect x="' + bx + '" y="' + (y0 + h - 14) + '" width="56" height="14" fill="' + D.col + '"/><rect x="' + bx + '" y="' + (y0 + h - 14 - 60) + '" width="56" height="60" fill="#D5AE74" stroke="#9C7440"/>'; }
    return o + '<rect x="' + (x0 + w + 8) + '" y="' + (y0 - 8) + '" width="14" height="' + (h + 16) + '" fill="url(#gSteelV)"/>';
  }
  function sceneUse(pane) {
    var ids = stepIds(), cur = 0, timer = null, play = true;
    var side = '<ol class="lab__steps" id="uSteps"></ol><div class="lab__play"><button type="button" class="btn btn--ghost" id="uPlay">Tạm dừng</button></div>';
    var sc = paneShell(pane, '', 'uScene', side), ol = $('#uSteps', pane);
    ids.forEach(function (id, i) { var li = document.createElement('li'); li.innerHTML = '<b>' + STEPS[id][0] + '</b><span>' + STEPS[id][1] + '</span>'; li.addEventListener('click', function () { cur = i; draw(); }); ol.appendChild(li); });
    function draw() { put(sc, useScene(ids[cur])); $$('li', ol).forEach(function (li, i) { li.classList.toggle('is-on', i === cur); }); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function start() { draw(); stop(); if (!reduce && play) timer = setInterval(function () { cur = (cur + 1) % ids.length; draw(); }, 4600); }
    $('#uPlay', pane).addEventListener('click', function () { play = !play; $('#uPlay', pane).textContent = play ? 'Tạm dừng' : 'Tự chạy tiếp'; if (play) start(); else stop(); });
    return { show: start, hide: stop };
  }

  /* ---------- khởi động ---------- */
  var SC = { load: sceneLoad, fork: sceneFork, ship: sceneShip, mat: sceneMat, use: sceneUse, spill: sceneSpill, nest: sceneNest }, made = {}, active = null;
  function show(tab) {
    if (active && made[active] && made[active].hide) made[active].hide();
    active = tab;
    $$('.lab__tab').forEach(function (b) { var on = b.dataset.tab === tab; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    $$('.lab__pane').forEach(function (p) { p.classList.toggle('is-on', p.dataset.pane === tab); });
    var pane = $('.lab__pane[data-pane="' + tab + '"]');
    if (!made[tab]) made[tab] = SC[tab](pane);
    made[tab].show();
  }
  $$('.lab__tab').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.tab); }); });
  var first = $('.lab__tab.is-on'); show(first ? first.dataset.tab : D.tabs[0][0]);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      var m = made[active]; if (!m) return;
      if (!e[0].isIntersecting) { if (m.hide) m.hide(); } else m.show();
    }, { threshold: .1 }).observe(root);
  }
})();

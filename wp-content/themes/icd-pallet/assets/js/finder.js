/* Bộ tìm pallet nhựa: lọc nhiều tiêu chí (trong 1 nhóm = HOẶC, giữa các nhóm = VÀ), đếm số mẫu từng lựa chọn. */
(function () {
  var DATA = window.ICD_PALLETS || [];
  var root = document.querySelector('[data-finder]');
  if (!root || !DATA.length) return;

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }
  function kg(n) { return n ? n.toLocaleString('vi-VN') + ' kg' : 'Liên hệ'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var freq = {};
  DATA.forEach(function (p) {
    p._k = p.L + 'x' + p.W; freq[p._k] = (freq[p._k] || 0) + 1;
    p._txt = norm([p.t, p.sku, p.L + 'x' + p.W + 'x' + p.H, p.W + 'x' + p.L, p.m].join(' '));
  });
  var sizeOpts = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a] || (+a.split('x')[0]) - (+b.split('x')[0]); })
    .map(function (k) { return { v: k, l: k.replace('x', ' × ') }; });

  /* type: multi (checkbox, OR) | one (radio). test(p, v) -> bool */
  var GROUPS = [
    { k: 'kt', l: 'Kích thước (dài × rộng, mm)', type: 'multi', more: 8, opts: sizeOpts, test: function (p, v) { return p._k === v; } },
    { k: 'cao', l: 'Chiều cao', type: 'multi', opts: [
      { v: '100', l: 'Đến 100 mm (tấm lót, pallet mỏng)' }, { v: '140', l: '101 - 140 mm' },
      { v: '160', l: '141 - 160 mm' }, { v: '999', l: 'Trên 160 mm' }],
      test: function (p, v) { var lo = { 100: 0, 140: 101, 160: 141, 999: 161 }[v]; return p.H >= lo && p.H <= +v; } },
    { k: 'dong', l: 'Tải trọng động tối thiểu', type: 'one', opts: [
      { v: '500', l: 'Từ 500 kg' }, { v: '1000', l: 'Từ 1.000 kg' }, { v: '1500', l: 'Từ 1.500 kg' }, { v: '2000', l: 'Từ 2.000 kg' }],
      test: function (p, v) { return p.d && p.d >= +v; } },
    { k: 'tinh', l: 'Tải trọng tĩnh tối thiểu', type: 'one', opts: [
      { v: '2000', l: 'Từ 2.000 kg' }, { v: '4000', l: 'Từ 4.000 kg' }, { v: '6000', l: 'Từ 6.000 kg' }],
      test: function (p, v) { return p.s && p.s >= +v; } },
    { k: 'dung', l: 'Nhu cầu sử dụng', type: 'multi', opts: [
      { v: 'pallet-nhua-ke-kho', l: 'Đặt lên kệ (racking)' }, { v: 'tam-pallet-nhua-xuat-khau', l: 'Đóng hàng xuất khẩu' },
      { v: 'lot-san', l: 'Lót sàn, kê hàng chống ẩm' }, { v: 'pallet-nhua-nganh-in', l: 'Ngành in, giấy' },
      { v: 'pallet-nhua-chong-tran-dau', l: 'Chống tràn hoá chất, dầu' }, { v: 'pallet-container', l: 'Thùng pallet đựng hàng' }],
      test: function (p, v) { return p.uses.indexOf(v) >= 0; } },
    { k: 'mat', l: 'Mặt pallet', type: 'multi', opts: [{ v: 'kin', l: 'Mặt kín' }, { v: 'ho', l: 'Mặt hở (lưới)' }],
      test: function (p, v) { return p.f === v; } },
    { k: 'chan', l: 'Kiểu chân', type: 'multi', opts: [
      { v: '9-chan', l: '9 chân' }, { v: '3-chan', l: '3 chân (3 thanh)' }, { v: 'chu-thap', l: 'Chữ thập' },
      { v: 'coc', l: 'Chân cốc' }, { v: '6-chan', l: '6 chân' }],
      test: function (p, v) { return p.lg === v; } },
    { k: 'mau', l: 'Màu sắc', type: 'multi', swatch: true, opts: [
      { v: 'xanh-duong', l: 'Xanh dương', c: '#1F5FAE' }, { v: 'den', l: 'Đen', c: '#1E1E1E' }, { v: 'xanh-la', l: 'Xanh lá', c: '#2E8B4E' },
      { v: 'xam', l: 'Xám', c: '#8C9399' }, { v: 'do', l: 'Đỏ', c: '#C0392B' }, { v: 'vang', l: 'Vàng', c: '#E6B820' },
      { v: 'cam', l: 'Cam', c: '#F07F1A' }, { v: 'trang', l: 'Trắng', c: '#FFFFFF' }],
      test: function (p, v) { return p.c.indexOf(v) >= 0; } },
    { k: 'tt', l: 'Tình trạng', type: 'multi', opts: [{ v: 'moi', l: 'Hàng mới' }, { v: 'cu', l: 'Đã qua sử dụng (giá tốt)' }],
      test: function (p, v) { return v === 'cu' ? !!p.used : !p.used; } },
    { k: 'cl', l: 'Chất liệu', type: 'multi', closed: true, opts: [{ v: 'HDPE', l: 'Nhựa HDPE' }, { v: 'PP', l: 'Nhựa PP' }],
      test: function (p, v) { return p.m === v; } },
    { k: 'sm', l: 'Số mặt sử dụng', type: 'multi', closed: true, opts: [{ v: '1', l: '1 mặt' }, { v: '2', l: '2 mặt (đảo mặt được)' }],
      test: function (p, v) { return p.sd === +v; } },
    { k: 'kg', l: 'Trọng lượng pallet', type: 'multi', closed: true, opts: [
      { v: '10', l: 'Đến 10 kg' }, { v: '20', l: '10 - 20 kg' }, { v: '99', l: 'Trên 20 kg' }],
      test: function (p, v) { if (!p.kg) return false; return v === '10' ? p.kg <= 10 : v === '20' ? p.kg > 10 && p.kg <= 20 : p.kg > 20; } },
    { k: 'dd', l: 'Đặc điểm khác', type: 'multi', closed: true, opts: [
      { v: 'thep', l: 'Có lõi thép gia cường' }, { v: 'my', l: 'Nhập khẩu Malaysia' }, { v: 'ts', l: 'Nhựa tái sinh' }],
      test: function (p, v) { return v === 'thep' ? !!p.st : v === 'my' ? p.uses.indexOf('pallet-nhua-nhap-khau-malaysia') >= 0 : !!p.rec; } }
  ];

  var el = {
    q: root.querySelector('[data-q]'), aside: root.querySelector('[data-facets]'), grid: root.querySelector('[data-grid]'),
    count: root.querySelector('[data-count]'), active: root.querySelector('[data-active]'), more: root.querySelector('[data-more]'),
    empty: root.querySelector('[data-empty]'), sort: root.querySelector('[data-sort]'), note: root.querySelector('[data-note]'),
    open: root.querySelector('[data-open-filters]'), close: root.querySelectorAll('[data-close-filters]'), see: root.querySelector('[data-see]')
  };
  var PAGE = 12, shown = PAGE, sel = {}, list = [];
  GROUPS.forEach(function (g) { sel[g.k] = []; });

  /* Dựng cột bộ lọc */
  el.aside.innerHTML = GROUPS.map(function (g) {
    return '<details class="fg" data-g="' + g.k + '"' + (g.closed ? '' : ' open') + '><summary>' + g.l + '</summary><div class="fg__opts' + (g.swatch ? ' fg__opts--sw' : '') + '">' +
      g.opts.map(function (o, i) {
        var hide = g.more && i >= g.more ? ' data-extra hidden' : '';
        return '<label class="opt"' + hide + '><input type="' + (g.type === 'one' ? 'radio' : 'checkbox') + '" name="' + g.k + '" value="' + esc(o.v) + '">' +
          (g.swatch ? '<i class="sw" style="background:' + o.c + '"></i>' : '') + '<span>' + esc(o.l) + '</span><em data-n></em></label>';
      }).join('') +
      (g.more && g.opts.length > g.more ? '<button type="button" class="link-btn fg__more" data-more-opts>Thêm ' + (g.opts.length - g.more) + ' kích thước</button>' : '') +
      (g.type === 'one' ? '<button type="button" class="link-btn fg__clear" data-clear="' + g.k + '" hidden>Bỏ chọn</button>' : '') +
      '</div></details>';
  }).join('');

  function tokens() {
    var q = norm(el.q.value.trim()), m = q.match(/(\d{3,4})\s*[x×*]\s*(\d{3,4})/), size = null;
    if (m) { size = { L: Math.max(+m[1], +m[2]), W: Math.min(+m[1], +m[2]) }; q = q.replace(m[0], ' '); }
    return { size: size, words: q.split(/\s+/).filter(Boolean) };
  }
  function matchText(p, tk) {
    if (tk.size && !(p.L === tk.size.L && p.W === tk.size.W)) return false;
    for (var i = 0; i < tk.words.length; i++) if (p._txt.indexOf(tk.words[i]) < 0) return false;
    return true;
  }
  function passGroup(p, g) {
    var vals = sel[g.k]; if (!vals.length) return true;
    for (var i = 0; i < vals.length; i++) if (g.test(p, vals[i])) return true;
    return false;
  }
  function passAll(p, tk, skip) {
    if (!matchText(p, tk)) return false;
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i] !== skip && !passGroup(p, GROUPS[i])) return false;
    return true;
  }

  function run(resetPage) {
    var tk = tokens(), note = '';
    list = DATA.filter(function (p) { return passAll(p, tk, null); });
    if (!list.length && tk.size) {   // không có đúng kích thước gõ vào -> gợi ý 3 kích thước gần nhất
      var near = DATA.filter(function (p) { return passAll(p, { size: null, words: tk.words }, null); })
        .map(function (p) { return { p: p, d: Math.abs(p.L - tk.size.L) + Math.abs(p.W - tk.size.W) }; })
        .filter(function (x) { return x.d <= 300; }).sort(function (a, b) { return a.d - b.d; });
      var keep = []; near.forEach(function (x) { if (keep.indexOf(x.p._k) < 0 && keep.length < 3) keep.push(x.p._k); });
      list = near.filter(function (x) { return keep.indexOf(x.p._k) >= 0; }).map(function (x) { return x.p; });
      if (list.length) note = 'Không có mẫu đúng ' + tk.size.L + ' × ' + tk.size.W + ' mm. Đang hiển thị các kích thước gần nhất.';
    } else sortList();
    if (resetPage) shown = PAGE;
    counts(tk); render(note); sync();
  }
  function sortList() {
    var s = el.sort.value;
    if (s === 'dong-asc' || (!s && sel.dong.length)) list.sort(function (a, b) { return (a.d || 1e9) - (b.d || 1e9); });
    else if (s === 'dong-desc') list.sort(function (a, b) { return (b.d || 0) - (a.d || 0); });
    else if (s === 'nhe') list.sort(function (a, b) { return (a.kg || 1e9) - (b.kg || 1e9); });
    else list.sort(function (a, b) { return (freq[b._k] - freq[a._k]) || ((b.d || 0) - (a.d || 0)); });
  }
  function counts(tk) {
    GROUPS.forEach(function (g) {
      var base = DATA.filter(function (p) { return passAll(p, tk, g); });
      el.aside.querySelectorAll('[data-g="' + g.k + '"] .opt').forEach(function (lab, i) {
        var o = g.opts[i], n = base.filter(function (p) { return g.test(p, o.v); }).length, inp = lab.querySelector('input');
        inp.checked = sel[g.k].indexOf(o.v) >= 0;
        lab.querySelector('[data-n]').textContent = n;
        lab.classList.toggle('is-zero', !n && !inp.checked);
        inp.disabled = !n && !inp.checked;
      });
      var clr = el.aside.querySelector('[data-clear="' + g.k + '"]'); if (clr) clr.hidden = !sel[g.k].length;
    });
  }

  function card(p) {
    return '<a class="pcard" href="' + esc(p.u) + '"><span class="pcard__img">' +
      (p.i ? '<img src="' + esc(p.i) + '" alt="' + esc(p.t) + '" loading="lazy" width="600" height="400">' : '<span class="pcard__noimg">Ảnh đang cập nhật</span>') +
      '</span><span class="pcard__body"><span class="pcard__title">' + esc(p.t) + '</span><span class="pcard__specs">' +
      '<span><em>Kích thước</em>' + p.L + '×' + p.W + '×' + p.H + '</span>' +
      '<span><em>Tải động</em>' + kg(p.d) + '</span><span><em>Tải tĩnh</em>' + kg(p.s) + '</span></span></span></a>';
  }
  function label(g, v) { for (var i = 0; i < g.opts.length; i++) if (g.opts[i].v === v) return g.opts[i].l; return v; }

  function render(note) {
    var chips = [];
    if (el.q.value.trim()) chips.push('<button type="button" class="tag" data-rm="q">"' + esc(el.q.value.trim()) + '"</button>');
    GROUPS.forEach(function (g) { sel[g.k].forEach(function (v) { chips.push('<button type="button" class="tag" data-rm="' + g.k + '" data-v="' + esc(v) + '">' + esc(label(g, v)) + '</button>'); }); });
    if (chips.length) chips.push('<button type="button" class="link-btn" data-rm="all">Xoá tất cả</button>');
    el.active.innerHTML = chips.join(''); el.active.hidden = !chips.length;
    el.count.innerHTML = chips.length ? '<strong>' + list.length + '</strong> / ' + DATA.length + ' mẫu phù hợp' : '<strong>' + DATA.length + '</strong> mẫu pallet nhựa';
    el.see.textContent = 'Xem ' + list.length + ' mẫu';
    var nf = 0; GROUPS.forEach(function (g) { nf += sel[g.k].length; });
    el.open.textContent = 'Bộ lọc' + (nf ? ' (' + nf + ')' : '');
    el.note.hidden = !note; el.note.textContent = note;
    el.grid.innerHTML = list.slice(0, shown).map(card).join('');
    el.more.hidden = list.length <= shown;
    el.more.textContent = 'Xem thêm ' + Math.min(PAGE, list.length - shown) + ' mẫu';
    el.empty.hidden = list.length > 0;
  }

  function sync() {
    var u = new URLSearchParams();
    if (el.q.value.trim()) u.set('q', el.q.value.trim());
    GROUPS.forEach(function (g) { if (sel[g.k].length) u.set(g.k, sel[g.k].join(',')); });
    if (el.sort.value) u.set('sort', el.sort.value);
    var qs = u.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  /* Khởi tạo từ URL */
  var u = new URLSearchParams(location.search);
  if (u.get('q')) el.q.value = u.get('q');
  if (u.get('sort')) el.sort.value = u.get('sort');
  GROUPS.forEach(function (g) {
    var v = u.get(g.k); if (!v) return;
    sel[g.k] = v.split(',').filter(function (x) { return g.opts.some(function (o) { return o.v === x; }); });
    if (g.type === 'one') sel[g.k] = sel[g.k].slice(0, 1);
  });
  // Mở rộng danh sách kích thước nếu kích thước được chọn đang ẩn
  if (sel.kt.some(function (v) { var o = el.aside.querySelector('[data-g="kt"] input[value="' + v + '"]'); return o && o.closest('[hidden]'); })) showAllSizes();

  function showAllSizes() {
    el.aside.querySelectorAll('[data-extra]').forEach(function (x) { x.hidden = false; });
    var b = el.aside.querySelector('[data-more-opts]'); if (b) b.remove();
  }

  /* Sự kiện */
  el.aside.addEventListener('change', function (e) {
    var inp = e.target; if (!inp.name || !sel[inp.name]) return;
    var g = GROUPS.filter(function (x) { return x.k === inp.name; })[0];
    if (g.type === 'one') sel[g.k] = inp.checked ? [inp.value] : [];
    else if (inp.checked) sel[g.k].push(inp.value);
    else sel[g.k] = sel[g.k].filter(function (v) { return v !== inp.value; });
    run(true);
  });
  el.aside.addEventListener('click', function (e) {
    if (e.target.matches('[data-more-opts]')) showAllSizes();
    if (e.target.matches('[data-clear]')) { sel[e.target.dataset.clear] = []; run(true); }
  });
  el.active.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var k = b.dataset.rm;
    if (k === 'all') { el.q.value = ''; GROUPS.forEach(function (g) { sel[g.k] = []; }); }
    else if (k === 'q') el.q.value = '';
    else sel[k] = sel[k].filter(function (v) { return v !== b.dataset.v; });
    run(true);
  });
  var timer;
  el.q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { run(true); }, 180); });
  root.querySelector('[data-search]').addEventListener('submit', function (e) {
    e.preventDefault(); run(true); document.getElementById('ket-qua').scrollIntoView({ behavior: 'smooth' });
  });
  root.querySelectorAll('[data-size]').forEach(function (c) {
    c.addEventListener('click', function () {
      var v = c.dataset.size; sel.kt = sel.kt.indexOf(v) >= 0 ? sel.kt.filter(function (x) { return x !== v; }) : sel.kt.concat(v);
      run(true); document.getElementById('ket-qua').scrollIntoView({ behavior: 'smooth' });
    });
  });
  el.sort.addEventListener('change', function () { sortList(); shown = PAGE; render(el.note.textContent); sync(); });
  el.more.addEventListener('click', function () { shown += PAGE; render(el.note.textContent); });
  el.open.addEventListener('click', function () { root.classList.add('is-filtering'); document.body.style.overflow = 'hidden'; });
  el.close.forEach(function (b) { b.addEventListener('click', function () { root.classList.remove('is-filtering'); document.body.style.overflow = ''; }); });

  run(true);
})();

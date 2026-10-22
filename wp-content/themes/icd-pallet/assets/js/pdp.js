(function () {
  var root = document.querySelector('.pdp'); if (!root) return;
  var D = {}; try { D = JSON.parse(root.getAttribute('data-pdp')); } catch (e) {}
  var fmt = function (n) { return Math.round(n).toLocaleString('vi-VN'); };

  var pb = root.querySelector('[data-print]'); if (pb) pb.addEventListener('click', function () { window.print(); });

  /* kiểm tra tải */
  var cargo = document.getElementById('pdp-cargo'), out = document.getElementById('pdp-load-out');
  if (cargo && out) {
    var rows = [['Đang di chuyển (tải động)', D.d], ['Đặt nền, xếp chồng (tải tĩnh)', D.s], ['Gác trên kệ (tải trên kệ)', D.r]].filter(function (x) { return x[1] > 0; });
    var run = function () {
      var v = parseFloat(cargo.value);
      if (!(v > 0)) { out.textContent = 'Nhập khối lượng hàng để xem kết quả theo từng điều kiện sử dụng.'; return; }
      out.innerHTML = '';
      rows.forEach(function (r) {
        var ok = v <= r[1], el = document.createElement('div');
        el.className = 'pdp-res ' + (ok ? 'ok' : 'no');
        el.innerHTML = '<span><b>' + r[0] + ':</b> ' + (ok ? 'đạt, còn dư ' + fmt(r[1] - v) + ' kg' : 'vượt ' + fmt(v - r[1]) + ' kg so với mức ' + fmt(r[1]) + ' kg') + '</span>';
        out.appendChild(el);
      });
    };
    cargo.addEventListener('input', run);
  }

  /* ước tính số pallet trong thùng */
  var ct = document.getElementById('pdp-ct'), hh = document.getElementById('pdp-hh'), co = document.getElementById('pdp-co');
  if (ct && hh && co && D.L) {
    var fit = function (cl, cw, L, W) { return Math.floor(cl / L) * Math.floor(cw / W); };
    var calc = function () {
      var c = ct.value.split(',').map(Number), cl = c[0], cw = c[1], chh = c[2];
      var a = fit(cl, cw, D.L, D.W), b = fit(cl, cw, D.W, D.L), per = Math.max(a, b);
      var h = Math.max(0, parseFloat(hh.value) || 0), unit = D.H + h, layers = unit > 0 ? Math.floor(chh / unit) : 0;
      var empty = D.H > 0 ? Math.floor(chh / D.H) : 0;
      var cell = function (t, v, s) { return '<div class="pdp-fig"><span>' + t + '</span><b>' + v + '</b><small>' + s + '</small></div>'; };
      var h1 = per === a ? 'dài pallet dọc thùng' : 'rộng pallet dọc thùng';
      co.innerHTML = cell('Pallet mỗi lớp', per, 'đặt ' + h1) +
        cell('Số lớp xếp được', layers, 'cao ' + fmt(unit) + ' mm mỗi lớp, thùng cao ' + fmt(chh) + ' mm') +
        cell('Tổng pallet có hàng', per * layers, layers > 1 ? 'khi xếp chồng ' + layers + ' lớp' : 'một lớp, không chồng được') +
        cell('Pallet rỗng xếp chồng thẳng', per * empty, 'ước tính thô, chưa tính xếp lồng');
    };
    ['input', 'change'].forEach(function (e) { ct.addEventListener(e, calc); hh.addEventListener(e, calc); });
    calc();
  }

  /* mục đang xem trên thanh neo */
  var links = [].slice.call(document.querySelectorAll('.pdp-nav a'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var spy = function () {
    var y = window.scrollY + 120, cur = -1;
    secs.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-on', i === cur); });
  };
  window.addEventListener('scroll', spy, { passive: true }); spy();
})();

(function () {
  var g = document.querySelector('[data-gal]'); if (!g) return;
  var main = g.querySelector('.pdp-gal__main'), mimg = main && main.querySelector('img');
  var th = [].slice.call(g.querySelectorAll('.pdp-gal__t a'));
  var items = th.length ? th : (main ? [main] : []); if (!items.length) return;
  var cur = 0, last = null;
  var lb = document.createElement('div');
  lb.className = 'pdp-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Xem ảnh lớn');
  lb.innerHTML = '<button type="button" class="pdp-lb__x" aria-label="Đóng">&times;</button><button type="button" class="pdp-lb__p" aria-label="Ảnh trước">&#8249;</button><img alt=""><button type="button" class="pdp-lb__n" aria-label="Ảnh sau">&#8250;</button><div class="pdp-lb__cap"></div>';
  document.body.appendChild(lb);
  var im = lb.querySelector('img'), cap = lb.querySelector('.pdp-lb__cap');
  function mark(i) { th.forEach(function (a, k) { a.classList.toggle('is-on', k === i); }); if (th.length && mimg) { mimg.src = th[i].href; main.href = th[i].href; } }
  function show(i) {
    cur = (i + items.length) % items.length;
    var a = items[cur]; im.src = a.href; im.alt = a.getAttribute('data-cap') || '';
    cap.innerHTML = ''; var t = document.createElement('span'); t.textContent = a.getAttribute('data-cap') || ''; cap.appendChild(t);
    if (items.length > 1) { var s = document.createElement('small'); s.textContent = (cur + 1) + ' / ' + items.length; cap.appendChild(s); }
    mark(cur);
  }
  function open(i) { last = document.activeElement; show(i); lb.classList.add('is-on'); document.body.style.overflow = 'hidden'; lb.querySelector('.pdp-lb__x').focus(); }
  function close() { lb.classList.remove('is-on'); document.body.style.overflow = ''; if (last) last.focus(); }
  th.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); mark(i); cur = i; }); });
  if (main) main.addEventListener('click', function (e) { e.preventDefault(); open(cur); });
  lb.querySelector('.pdp-lb__x').addEventListener('click', close);
  lb.querySelector('.pdp-lb__p').addEventListener('click', function () { show(cur - 1); });
  lb.querySelector('.pdp-lb__n').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) { if (!lb.classList.contains('is-on')) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1); });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); x0 = null; }, { passive: true });
})();

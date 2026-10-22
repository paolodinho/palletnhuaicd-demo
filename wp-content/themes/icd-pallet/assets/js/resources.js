/* Tra cứu: lọc theo nhóm + tìm không dấu trong trang, tìm chung ở trang tổng /tra-cuu/ */
(function () {
  'use strict';
  var norm = function (s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
  };

  /* Trang thư viện */
  var bar = document.querySelector('[data-res-bar]');
  if (bar) {
    var q = bar.querySelector('[data-res-q]'), chips = bar.querySelectorAll('[data-res-chip]'), out = bar.querySelector('[data-res-count]');
    var groups = document.querySelectorAll('[data-res-group]'), empty = document.querySelector('[data-res-empty]');
    var items = [].map.call(document.querySelectorAll('[data-res-item]'), function (el) { return { el: el, t: norm(el.textContent) }; });
    var active = '';
    var run = function () {
      var words = norm(q.value).split(' ').filter(Boolean), shown = 0;
      groups.forEach(function (g) {
        var okGroup = !active || g.getAttribute('data-res-group') === active, n = 0;
        g.querySelectorAll('[data-res-item]').forEach(function (el) {
          var it = items.find(function (x) { return x.el === el; });
          var hit = okGroup && words.every(function (w) { return it.t.indexOf(w) > -1; });
          el.hidden = !hit; if (hit) n++;
        });
        g.hidden = !n; shown += n;
      });
      out.textContent = (words.length || active) ? 'Hiển thị ' + shown + '/' + items.length + ' mục' : '';
      if (empty) empty.hidden = shown > 0;
    };
    var t;
    q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        active = c.getAttribute('data-res-chip');
        chips.forEach(function (x) { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        run();
      });
    });
    /* Mở đúng mục khi vào từ link #anchor */
    var open = function () {
      var id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
      var el = document.getElementById(id); if (!el) return;
      if (el.hidden || (el.closest('[data-res-group]') || {}).hidden) { q.value = ''; active = ''; chips.forEach(function (x, i) { x.classList.toggle('is-on', i === 0); }); run(); }
      document.querySelectorAll('.is-target').forEach(function (x) { x.classList.remove('is-target'); });
      el.classList.add('is-target');
    };
    window.addEventListener('hashchange', open); open();
  }

  /* Trang tổng */
  var hub = document.querySelector('[data-res-hub]');
  if (hub && window.ICD_RES_INDEX) {
    var list = document.querySelector('[data-res-hub-out]');
    var idx = window.ICD_RES_INDEX.map(function (x) { return { x: x, t: norm(x.t), s: norm(x.s) }; });
    var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    var render = function () {
      var words = norm(hub.value).split(' ').filter(Boolean);
      if (!words.length) { list.hidden = true; list.innerHTML = ''; return; }
      var res = idx.map(function (r) {
        var all = r.t + ' ' + r.s;
        if (!words.every(function (w) { return all.indexOf(w) > -1; })) return null;
        var score = words.reduce(function (a, w) { return a + (r.t.indexOf(w) > -1 ? 3 : 1); }, 0) + (r.t.indexOf(words.join(' ')) === 0 ? 4 : 0);
        return { r: r.x, score: score };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
      list.innerHTML = res.length ? res.map(function (o) {
        return '<li><a href="' + esc(o.r.u) + '"><span class="res-k">' + esc(o.r.k) + '</span><b>' + esc(o.r.t) + '</b><em>' + esc(o.r.s.slice(0, 140)) + (o.r.s.length > 140 ? '...' : '') + '</em></a></li>';
      }).join('') : '<li class="res-none">Chưa có mục khớp. Thử từ khóa khác, ví dụ "ISO 8611" hoặc "kho lạnh".</li>';
      list.hidden = false;
    };
    var th;
    hub.addEventListener('input', function () { clearTimeout(th); th = setTimeout(render, 100); });
  }
})();

/* Hiệu ứng: hero vào trang, hiện dần khi cuộn, parallax, số đếm chạy, thanh tiến độ cuộn.
   Tôn trọng prefers-reduced-motion; không có JS thì nội dung hiện bình thường. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || !root.classList.contains('motion')) return;
  var loaded = function () { requestAnimationFrame(function () { root.classList.add('is-loaded'); }); };
  /* script nằm cuối trang: DOM đã sẵn, chạy hero ngay, không chờ toàn bộ ảnh tải xong */
  requestAnimationFrame(loaded);

  /* 1. Gắn lớp hiện dần cho các khối nội dung (không cần sửa từng template) */
  var groups = [
    ['.sec-title, .section-lede, main .kicker:not(.hx), .news__head, .finder__head, .lookup__btns', ''],
    ['.cap__item, .steps__list > li, .sizes__list > *, .team__people > li, .post-card, .lookup__links > li, .res-card, .res-guides > li, .grid > *, .team__box, .res-org, .tool-card, .cards > *', 'rv--zoom'],
    ['.expo__grid figure, .gallery figure, .article__img, .prose figure', 'rv--img'],
    ['.timeline > li', ''],
    ['.res-std, .res-term, .res-faq details', '']
  ];
  var targets = [];
  groups.forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (el) {
      if (el.closest('.bhero') || el.classList.contains('rv')) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; /* đã nằm trong màn hình đầu: không ẩn */
      el.classList.add('rv'); if (g[1]) el.classList.add(g[1]);
      targets.push(el);
    });
  });
  /* so le trong cùng một nhóm anh em */
  targets.forEach(function (el) {
    var sib = [].filter.call(el.parentNode.children, function (x) { return x.classList.contains('rv'); });
    el.style.setProperty('--i', Math.min(sib.indexOf(el), 6));
  });
  var tl = document.querySelector('.timeline'); if (tl) { tl.classList.add('rv-line'); targets.push(tl); }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  targets.forEach(function (el) { io.observe(el); });

  /* 2. Số đếm chạy */
  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  var counters = document.querySelectorAll('[data-count-to]');
  var runCount = function (el) {
    var to = parseInt(el.getAttribute('data-count-to'), 10), from = parseInt(el.getAttribute('data-count-from') || '0', 10);
    if (isNaN(to)) return;
    var year = to > 1900 && to < 2100, t0 = null, dur = 1400;
    if (reduce) { el.textContent = year ? to : fmt(to); return; }
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      el.textContent = year ? v : fmt(v);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { runCount(e.target); }, 500); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { cio.observe(el); });

  /* 3. Parallax + mờ dần nội dung hero + thanh tiến độ + header đổ bóng */
  var hero = document.querySelector('[data-hero]'), copy = document.querySelector('[data-hero-copy]');
  var par = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var top = document.querySelector('.top');
  var bar = document.createElement('div'); bar.className = 'scrollbar'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var wide = window.matchMedia('(min-width: 1101px)');
  var ticking = false;
  var frame = function () {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, docH = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (docH > 0 ? Math.min(y / docH, 1) : 0) + ')';
    if (top) top.classList.toggle('is-scrolled', y > 8);
    if (reduce || !hero) return;
    var h = hero.offsetHeight;
    if (y > h + 200) return;
    par.forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-parallax')) || 0;
      if (!wide.matches && !el.classList.contains('bhero__slash')) { el.style.translate = ''; return; }
      el.style.translate = '0 ' + (y * k).toFixed(1) + 'px';
    });
    if (copy && wide.matches) {
      var p = Math.min(y / (h * 0.9), 1);
      copy.style.opacity = (1 - p * 0.55).toFixed(3);
      copy.style.translate = '0 ' + (y * 0.12).toFixed(1) + 'px';
    }
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', frame);
  frame();
})();

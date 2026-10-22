/* Hành trình 1 pallet: màn lớn dựng khung ảnh dính bên trái, đổi ảnh theo chặng đang đọc, thanh tiến độ 4 đoạn.
   Số liệu chạy lên một lần khi chặng hiện ra. Không JS hoặc màn nhỏ: thẻ xếp dọc như HTML gốc. */
(function () {
  'use strict';
  var root = document.querySelector('[data-journey]');
  if (!root || !('IntersectionObserver' in window)) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 1024px)');
  var stage = root.querySelector('[data-jr-stage]');
  var steps = [].slice.call(root.querySelectorAll('[data-jr-step]'));
  var slides = [], ticks = [], built = false;

  function build() {
    if (built || !wide.matches) return;
    var html = '';
    steps.forEach(function (s) {
      var f = s.querySelector('.jr__fig');
      var img = f.querySelector('img').outerHTML, cap = f.querySelector('figcaption').outerHTML;
      html += '<figure class="jr__slide"><span>' + img + '</span>' + cap + '</figure>';
    });
    html += '<div class="jr__rail">' + steps.map(function () { return '<i><b></b></i>'; }).join('') + '</div>';
    stage.innerHTML = html;
    slides = [].slice.call(stage.querySelectorAll('.jr__slide'));
    ticks = [].slice.call(stage.querySelectorAll('.jr__rail i'));
    root.classList.add('is-js');
    built = true;
    show(0);
  }

  function show(i) {
    steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    ticks.forEach(function (t, k) { t.classList.toggle('is-done', k <= i); });
  }

  /* chạy số: chỉ với số nguyên dạng 1.234 */
  function count(step) {
    if (step.dataset.counted) return;
    step.dataset.counted = '1';
    if (reduce) return;
    step.querySelectorAll('.jr__figs .jr__v').forEach(function (dd) {
      var raw = dd.textContent.trim();
      if (!/^\d{1,3}(\.\d{3})*$/.test(raw)) return;
      var end = parseInt(raw.replace(/\./g, ''), 10), t0 = null, dur = 900;
      if (end < 10) return;
      dd.style.minWidth = dd.offsetWidth + 'px';
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        dd.textContent = v.toLocaleString('vi-VN');
        if (p < 1) requestAnimationFrame(tick); else dd.textContent = raw;
      }
      requestAnimationFrame(tick);
    });
  }

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var i = steps.indexOf(e.target);
      if (built) show(i);
      count(e.target);
    });
  }, { rootMargin: '-40% 0px -40% 0px' });
  steps.forEach(function (s) { io.observe(s); });

  build();
  wide.addEventListener ? wide.addEventListener('change', build) : wide.addListener(build);
})();

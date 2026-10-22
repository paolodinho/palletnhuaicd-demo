/* Ẩn dụ "xếp pallet": cuộn xuống thì cột pallet bên mép phải được xếp thêm từng tầng, cuộn lên thì dỡ bớt.
   Thêm: gạch cam dưới nhãn mục tự kẻ khi vào màn hình, ảnh lớn trôi nhẹ ngược chiều cuộn. Tôn trọng prefers-reduced-motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = 10, root = document.documentElement;
  var el = document.createElement('div');
  el.className = 'stackmeter'; el.setAttribute('aria-hidden', 'true');
  var h = '';
  for (var i = 0; i < N; i++) h += '<i></i>';
  el.innerHTML = '<span class="stackmeter__n">0%</span><div class="stackmeter__col">' + h + '</div><span class="stackmeter__f"></span>';
  document.body.appendChild(el);
  var tiers = el.querySelectorAll('i'), num = el.querySelector('.stackmeter__n'), last = -1, tick = false;

  function update() {
    tick = false;
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    var on = Math.round(p * N);
    if (on !== last) {
      for (var i = 0; i < N; i++) tiers[i].classList.toggle('is-on', i < on);
      last = on;
    }
    num.textContent = Math.round(p * 100) + '%';
    el.classList.toggle('is-show', window.scrollY > 240);
    if (!reduce) {
      var y = window.scrollY, vh = window.innerHeight;
      document.querySelectorAll('[data-drift]').forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        e.style.transform = 'translate3d(0,' + (((r.top + r.height / 2) - vh / 2) * -0.06).toFixed(1) + 'px,0)';
      });
    }
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* gạch cam tự kẻ */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-drawn'); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('main .kicker').forEach(function (k) { k.classList.add('draw'); io.observe(k); });
  }
  document.querySelectorAll('.hx2__photo img, .pdp-gal__main img, .anat__fig, .expo__grid img').forEach(function (e) { e.setAttribute('data-drift', ''); });
  update();
})();

/* ICD Pallet v6 - lớp "nghệ thuật": sơ đồ cấu tạo tách lớp theo cuộn trang, đường vẽ kỹ thuật */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anat = document.querySelector('[data-anat]');
  var items = anat ? anat.querySelectorAll('.anat__list li') : [];
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function update() {
    if (!anat) return;
    var r = anat.getBoundingClientRect(), vh = window.innerHeight || 800;
    /* 0 khi mép trên khối ở 85% màn hình, 1 khi khối đã lên giữa màn hình */
    var e = reduce ? 1 : clamp((vh * 0.85 - r.top) / (vh * 0.55));
    anat.style.setProperty('--e', e.toFixed(3));
    anat.classList.toggle('is-open', e > 0.55);
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-on', e > 0.35 + i * 0.2);
  }
  var tick = false;
  function onScroll() { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false; update(); }); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
  /* bản vẽ ở hero chạy khi tải xong */
  var hero = document.querySelector('.hx2__art');
  if (hero) requestAnimationFrame(function () { hero.classList.add('is-draw'); });
})();

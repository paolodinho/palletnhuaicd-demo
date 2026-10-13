/* ICD Pallet v6.1 - lớp chiều sâu 3D khi cuộn:
   1. Cảnh "sức chịu tải": chất hàng lên pallet 3D, xe nâng nhấc, xếp chồng (ẩn dụ: pallet là nền móng lô hàng)
   2. Tuyến hành trình 4 bước: kiện hàng chạy dọc tuyến theo cuộn
   3. Ảnh hero và các thẻ nghiêng 3D theo con trỏ / theo cuộn
   4. Số mục lớn trôi chậm hơn nội dung (chiều sâu)
   Tôn trọng prefers-reduced-motion: hiện trạng thái tĩnh, không chuyển động. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };

  /* Hộp 3D: khung đặt trên mặt sàn (x, y), cao h, 5 mặt (bỏ đáy) */
  function box(cls, w, d, h, x, y, z) {
    var b = document.createElement('div');
    b.className = 'cu ' + cls;
    b.style.width = w + 'px'; b.style.height = d + 'px';
    b.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)';
    var faces = [
      ['f-top', w, d, 'translateZ(' + h + 'px)', '0 0'],
      ['f-fr', w, h, 'translateY(' + d + 'px) rotateX(90deg)', '0 0'],
      ['f-bk', w, h, 'rotateX(90deg)', '0 0'],
      ['f-rt', h, d, 'translateX(' + w + 'px) rotateY(-90deg)', '0 0'],
      ['f-lt', h, d, 'rotateY(-90deg)', '0 0']
    ];
    faces.forEach(function (f) {
      var e = document.createElement('i');
      e.className = 'fc ' + f[0];
      e.style.width = f[1] + 'px'; e.style.height = f[2] + 'px';
      e.style.transform = f[3]; e.style.transformOrigin = f[4];
      b.appendChild(e);
    });
    return b;
  }
  function group(cls) { var g = document.createElement('div'); g.className = 'l3-g ' + cls; return g; }

  /* ---------- 1. Cảnh sức chịu tải ---------- */
  var sec = document.querySelector('[data-load]');
  var world = sec && sec.querySelector('[data-load-world]');
  if (sec && world) {
    var PW = 240, PD = 200, RUN = 22, DECK = 10;           /* 1200 × 1000 mm thu nhỏ 1:5, cao 150 mm = 32 px */
    var unit = group('l3-unit'), load = group('l3-load'), forks = group('l3-forks'), ghosts = group('l3-ghosts');
    /* pallet: 3 chân chạy dọc trục x + mặt pallet */
    var pal = group('l3-pal');
    [0, (PD - 24) / 2, PD - 24].forEach(function (y) { pal.appendChild(box('pal-run', PW, 24, RUN, 0, y, 0)); });
    pal.appendChild(box('pal-deck', PW, PD, DECK, 0, 0, RUN));
    unit.appendChild(pal);
    /* hàng: 3 tầng × 4 kiện */
    var BW = 116, BD = 96, BH = 44, boxes = [];
    for (var l = 0; l < 3; l++) for (var r = 0; r < 2; r++) for (var c = 0; c < 2; c++) {
      var bx = box('crate' + ((l + r + c) % 2 ? ' crate--b' : ''), BW, BD, BH, 3 + c * (BW + 2), 3 + r * (BD + 2), 0);
      bx.dataset.x = 3 + c * (BW + 2); bx.dataset.y = 3 + r * (BD + 2); bx.dataset.z = RUN + DECK + l * (BH + 1);
      load.appendChild(bx); boxes.push(bx);
    }
    unit.appendChild(load);
    /* càng xe nâng luồn vào giữa các chân */
    [44, PD - 44 - 26].forEach(function (y) { forks.appendChild(box('fork', 300, 26, 7, 0, y, 6)); });
    /* giá nâng phía sau càng (gợi hình xe nâng) */
    forks.appendChild(box('mast', 12, PD + 16, 170, -12, -8, 0));
    forks.appendChild(box('mast mast--bar', 14, PD + 24, 10, -14, -12, 150));
    /* 3 lô hàng xếp chồng phía trên (minh họa tải tĩnh) */
    var UH = RUN + DECK + 3 * (BH + 1), gh = [];
    for (var k = 0; k < 3; k++) {
      var g = group('l3-ghost');
      g.appendChild(box('gpal', PW, PD, RUN + DECK, 0, 0, 0));
      g.appendChild(box('gload', PW - 6, PD - 6, UH - RUN - DECK, 3, 3, RUN + DECK));
      ghosts.appendChild(g); gh.push(g);
    }
    world.appendChild(box('floor', PW + 220, PD + 220, 0, -110, -110, -1));
    world.appendChild(unit); world.appendChild(forks); world.appendChild(ghosts);

    var kg = sec.querySelector('[data-load-kg]'), bar = sec.querySelector('[data-load-bar]'), mx = sec.querySelector('[data-load-max]');
    var steps = sec.querySelectorAll('.load3d__steps li');
    var cam = sec.querySelector('.l3-cam');
    var render = function (p) {
      /* 0-.42 chất hàng | .42-.5 càng vào | .5-.6 nâng | .6-.68 hạ | .68-.95 xếp chồng */
      var placed = 0;
      boxes.forEach(function (b, i) {
        var t = ease(seg(p, 0.03 + i * 0.03, 0.09 + i * 0.03));
        placed += t;
        b.style.transform = 'translate3d(' + b.dataset.x + 'px,' + b.dataset.y + 'px,' + (+b.dataset.z + (1 - t) * 320).toFixed(1) + 'px)';
        b.style.opacity = t > 0 ? 1 : 0;
      });
      var fin = ease(seg(p, 0.42, 0.5)) - ease(seg(p, 0.62, 0.7));
      var lift = ease(seg(p, 0.5, 0.58)) - ease(seg(p, 0.6, 0.68));
      forks.style.transform = 'translate3d(' + (-320 + fin * 300) + 'px,0,' + lift * 46 + 'px)';
      forks.style.opacity = fin > 0.01 ? 1 : 0;
      unit.style.transform = 'translateZ(' + (lift * 46).toFixed(1) + 'px)';
      var st = 0;
      gh.forEach(function (g, i) {
        var t = ease(seg(p, 0.7 + i * 0.07, 0.79 + i * 0.07));
        st += t;
        g.style.transform = 'translateZ(' + ((i + 1) * (UH + 2) + (1 - t) * 380).toFixed(1) + 'px)';
        g.style.opacity = t > 0 ? 1 : 0;
      });
      var zoom = 1 - 0.42 * ease(seg(p, 0.68, 0.95));
      var spin = -38 + p * 30;
      cam.style.transform = 'scale(' + zoom.toFixed(3) + ') rotateX(58deg) rotateZ(' + spin.toFixed(2) + 'deg) translateZ(' + (-ease(seg(p, 0.68, 0.95)) * 260).toFixed(1) + 'px)';
      var stat = st > 0.02;
      var v = stat ? 1000 + st * 1000 : placed / boxes.length * 1000;
      kg.textContent = fmt(v);
      bar.style.transform = 'scaleX(' + (v / (stat ? 4000 : 1000)).toFixed(3) + ')';
      mx.textContent = stat ? 'Tải tĩnh tối đa 4.000 kg' : 'Tải động tối đa 1.000 kg';
      sec.classList.toggle('is-static', stat);
      var ph = p < 0.42 ? 0 : (p < 0.68 ? 1 : 2);
      for (var j = 0; j < steps.length; j++) steps[j].classList.toggle('is-on', j === ph);
    };
    if (reduce) {
      render(0.45);
      for (var q = 0; q < steps.length; q++) steps[q].classList.add('is-on');
      kg.textContent = '1.000'; mx.textContent = 'Tải động 1.000 kg, tải tĩnh 4.000 kg';
    } else {
      sec.classList.add('is-live');
      var upd = function () {
        var r = sec.getBoundingClientRect(), vh = window.innerHeight;
        var span = r.height - vh;
        render(span > 0 ? clamp(-r.top / span) : 1);
      };
      var tk = false;
      window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; upd(); }); } }, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    }
  }

  /* ---------- 2. Tuyến hành trình 4 bước ---------- */
  var route = document.querySelector('[data-route]');
  if (route) {
    var rsec = route.closest('section'), rsteps = rsec.querySelectorAll('.steps__list > li');
    var cart = route.querySelector('.route__cart');
    if (cart) {
      cart.innerHTML = '';
      var mini = group('rc-world');
      mini.appendChild(box('pal-deck', 52, 44, 5, 0, 0, 5));
      [0, 18, 36].forEach(function (y) { mini.appendChild(box('pal-run', 52, 8, 5, 0, y, 0)); });
      mini.appendChild(box('crate', 44, 36, 26, 4, 4, 10));
      cart.appendChild(mini);
    }
    var rupd = function () {
      var r = rsec.getBoundingClientRect(), vh = window.innerHeight;
      var p = reduce ? 1 : clamp((vh * 0.55 - r.top) / (vh * 0.6));
      route.style.setProperty('--p', p.toFixed(3));
      for (var i = 0; i < rsteps.length; i++) rsteps[i].classList.toggle('is-on', p >= i / (rsteps.length - 1) - 0.02);
    };
    var rt = false;
    window.addEventListener('scroll', function () { if (!rt) { rt = true; requestAnimationFrame(function () { rt = false; rupd(); }); } }, { passive: true });
    window.addEventListener('resize', rupd);
    rupd();
  }

  if (reduce) return;

  /* ---------- 3. Nghiêng 3D: ảnh hero theo cuộn + con trỏ, thẻ theo con trỏ ---------- */
  var ph = document.querySelector('.hx2__photo');
  var mxp = 0, myp = 0;
  var heroFrame = function () {
    if (!ph) return;
    var y = window.scrollY, h = window.innerHeight;
    var s = clamp(y / (h * 0.9));
    ph.style.transform = 'perspective(1300px) rotateX(' + (s * 16 - myp * 6).toFixed(2) + 'deg) rotateY(' + (mxp * 8 - s * 6).toFixed(2) + 'deg) translateZ(' + (-s * 80).toFixed(1) + 'px)';
  };
  if (ph) {
    /* hiệu ứng vào trang (animation fill both) giữ transform; gỡ khi chạy xong để nhận góc nghiêng */
    ph.addEventListener('animationend', function () { ph.style.animation = 'none'; heroFrame(); });
    setTimeout(function () { ph.style.animation = 'none'; heroFrame(); }, 2600);
    var ht = false;
    window.addEventListener('scroll', function () { if (!ht) { ht = true; requestAnimationFrame(function () { ht = false; heroFrame(); }); } }, { passive: true });
    if (fine) {
      var hs = document.querySelector('.hx2');
      hs.addEventListener('pointermove', function (e) {
        mxp = e.clientX / window.innerWidth - 0.5; myp = e.clientY / window.innerHeight - 0.5;
        requestAnimationFrame(heroFrame);
      });
      hs.addEventListener('pointerleave', function () { mxp = myp = 0; requestAnimationFrame(heroFrame); });
    }
    heroFrame();
  }
  if (fine) {
    document.querySelectorAll('.cap__item, .post-card, .team__box, .lookup__links > li > a, .sizes__list a, .res-card, .tool-card').forEach(function (el) {
      el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .12s ease-out';
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) translateZ(6px)';
        el.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)';
        el.style.transform = '';
      });
    });
  }

  /* ---------- 4. Số mục lớn trôi chậm (chiều sâu) ---------- */
  var secs = [].slice.call(document.querySelectorAll('main > section:not(.hx2):not(.cat-band)'));
  var nt = false;
  var nupd = function () {
    nt = false;
    var vh = window.innerHeight;
    secs.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      s.style.setProperty('--py', clamp((vh * 0.5 - r.top) * 0.22, -120, 180).toFixed(1) + 'px');
    });
  };
  window.addEventListener('scroll', function () { if (!nt) { nt = true; requestAnimationFrame(nupd); } }, { passive: true });
  nupd();
})();

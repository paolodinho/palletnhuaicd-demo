/* JS chung: menu mobile, form báo giá */
(function () {
  var burger = document.querySelector('.top__burger'), mnav = document.getElementById('mnav');
  if (burger && mnav) burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', open ? 'false' : 'true');
    mnav.hidden = open;
  });

  document.querySelectorAll('form[data-quote]').forEach(function (form) {
    var msg = form.querySelector('[data-msg]'), btn = form.querySelector('[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var fd = new FormData(form);
      fd.append('action', 'icd_contact');
      fd.append('nonce', (window.icdData || {}).nonce || '');
      btn.disabled = true; btn.textContent = 'Đang gửi...';
      fetch((window.icdData || {}).ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          msg.hidden = false;
          msg.className = 'form-msg ' + (r.success ? 'is-ok' : 'is-err');
          msg.textContent = (r.data && r.data.message) || 'Đã gửi.';
          if (r.success) form.reset();
        })
        .catch(function () {
          msg.hidden = false; msg.className = 'form-msg is-err';
          msg.textContent = 'Chưa gửi được. Vui lòng gọi 0983 797 186 hoặc nhắn Zalo.';
        })
        .finally(function () { btn.disabled = false; btn.textContent = 'Gửi yêu cầu'; });
    });
  });
})();

/* Chống chữ mồ côi (1 từ trên 1 dòng) - dán vào JS của mọi site.
   Nối bằng NBSP từ cuối cùng với từ liền trước trong mọi tiêu đề, đoạn, mục danh sách, nút, chú thích.
   Đi kèm CSS: h1..h6,.title{text-wrap:balance} p,li,figcaption{text-wrap:pretty} */
(function () {
  var SEL = 'h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,dd,dt,td,th,.btn,.kicker,[data-nowrap-tail]';
  function glue(root) {
    (root || document).querySelectorAll(SEL).forEach(function (el) {
      if (el.dataset.orphanDone) return;
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: function (t) { return t.parentNode.closest('script,style,noscript,template') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } }), nodes = [], n;
      while ((n = w.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
      if (!nodes.length) return;
      var last = nodes[nodes.length - 1];
      /* gạch nối trong mã số cuối (ISO 8611-3) không được ngắt dòng */
      last.nodeValue = last.nodeValue.replace(/(\S+)\s*$/, function (x) { return x.replace(/([0-9A-Za-z])-([0-9A-Za-z])/g, '$1\u2011$2'); });
      var t = last.nodeValue.replace(/\s+$/, ''), m = t.match(/^([\s\S]*\S)\s+(\S+)$/);
      if (m) last.nodeValue = m[1] + '\u00A0' + m[2] + last.nodeValue.slice(t.length);
      else { /* từ cuối nằm riêng trong thẻ con: lùi về đoạn chữ trước, đổi khoảng trắng cuối cùng thành NBSP */
        for (var i = nodes.length - 2; i >= 0; i--) {
          if (/\s/.test(nodes[i].nodeValue)) { nodes[i].nodeValue = nodes[i].nodeValue.replace(/\s+(\S*)$/, '\u00A0$1'); break; }
        }
      }
      el.dataset.orphanDone = '1';
    });
  }
  if (document.readyState !== 'loading') glue(); else document.addEventListener('DOMContentLoaded', function () { glue(); });
  window.icdGlueOrphans = glue;
})();

/* Hàng ảnh canh đều chiều cao theo đúng tỷ lệ gốc: ảnh hiện trọn, không cắt cúp */
(function () {
  document.querySelectorAll('.jg').forEach(function (g) {
    g.querySelectorAll(':scope > figure').forEach(function (f) {
      var img = f.querySelector('img'); if (!img) return;
      var set = function () {
        var w = img.naturalWidth || +img.getAttribute('width'), h = img.naturalHeight || +img.getAttribute('height');
        if (w && h) { var r = w / h; f.style.flex = r.toFixed(3) + ' 1 ' + Math.round(r * 230) + 'px'; }
      };
      set(); img.addEventListener('load', set);
    });
  });
})();

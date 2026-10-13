/* Form nhận email để tải catalog PDF (icd_catalog_cta). */
(function () {
  'use strict';
  var cfg = window.icdCatalog || {};
  var msg = cfg.msg || {};
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setStatus(form, text, type) {
    var st = form.querySelector('.icd-cat__status');
    if (!st) return;
    st.textContent = text || '';
    st.className = 'icd-cat__status' + (type ? ' is-' + type : '');
  }

  function startDownload(url) {
    var a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function onSubmit(e) {
    var form = e.target;
    if (!form.matches || !form.matches('[data-icd-catalog] form')) return;
    e.preventDefault();

    var btn = form.querySelector('.icd-cat__btn');
    var email = form.querySelector('input[name="email"]');
    if (btn && btn.disabled) return;

    if (!email || !emailRe.test(email.value.trim())) {
      email && email.setAttribute('aria-invalid', 'true');
      setStatus(form, msg.email || 'Email không hợp lệ.', 'error');
      email && email.focus();
      return;
    }
    email.removeAttribute('aria-invalid');

    var data = new FormData(form);
    data.set('email', email.value.trim());
    data.set('page', window.location.href);
    if (cfg.nonce && !data.get('nonce')) data.set('nonce', cfg.nonce);

    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = msg.sending || 'Đang gửi...'; }
    setStatus(form, '', '');

    fetch(cfg.ajaxUrl || form.action, { method: 'POST', body: data, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (!res || !res.ok || !res.url) {
          setStatus(form, (res && res.msg) || msg.error, 'error');
          return;
        }
        setStatus(form, msg.done || 'Cảm ơn bạn.', 'success');
        var done = form.querySelector('.icd-cat__done');
        var link = form.querySelector('.icd-cat__dl');
        if (link) link.href = res.url;
        if (done) done.hidden = false;
        form.classList.add('is-done');
        startDownload(res.url);
        if (link) link.focus();
      })
      .catch(function () { setStatus(form, msg.error, 'error'); })
      .then(function () {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = label; }
      });
  }

  document.addEventListener('submit', onSubmit);
})();

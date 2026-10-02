/* PallettAI — page forms. Native validation and standard POST remain the
   no-JavaScript fallback. No speculative enquiry-growth calculator. */
(function () {
  'use strict';
  var doc = document;
  function ping(name) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count({ path: name, title: name, event: true });
      }
    } catch (e) {}
  }
  function postForm(form, sendingLabel, okMessage) {
    var btn = form.querySelector('button[type=submit]');
    var status = form.querySelector('.status');
    var originalLabel = btn ? btn.innerHTML : '';
    if (btn && btn.disabled) return;
    if (btn) { btn.disabled = true; btn.textContent = sendingLabel; }
    if (status) { status.className = 'status'; status.textContent = 'Sending…'; }
    fetch(form.action, {
      method: 'POST', body: new FormData(form),
      headers: { Accept: 'application/json' }, mode: 'cors'
    }).then(function (r) {
      if (!r.ok) throw new Error('Request failed');
      if (status) { status.className = 'status ok'; status.textContent = okMessage; }
      form.reset();
      ping(form.id === 'win-waitlist' ? '/event/waitlist' : '/event/contact');
    }).catch(function () {
      if (status) {
        status.className = 'status err';
        status.textContent = 'Something went wrong. Your message is still here — please retry or email support@pallettai.org.';
      }
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }
    });
  }
  function boot() {
    var contact = doc.getElementById('contact-form');
    if (contact) contact.addEventListener('submit', function (event) {
      event.preventDefault();
      postForm(contact, 'Sending…', 'Thanks — your enquiry is with us. Our reply target is within 24 hours.');
    });
    var waitlist = doc.getElementById('win-waitlist');
    if (waitlist) waitlist.addEventListener('submit', function (event) {
      event.preventDefault();
      postForm(waitlist, 'Joining…', 'You’re on the list — one email when the Windows build is ready, nothing else.');
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

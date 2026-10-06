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
  function bootPlanner() {
    var planner = doc.getElementById('project-planner');
    if (!planner) return;
    var start = doc.getElementById('plan-start');
    var scope = doc.getElementById('plan-scope');
    var goal = doc.getElementById('plan-goal');
    var packages = {
      new: { title: 'A new website', price: '£249', deposit: '£99 deposit · £150 base balance before launch', reason: 'A focused first home for your business, with a clear route to an enquiry.' },
      refresh: { title: 'Website redesign', price: '£149', deposit: '£49 deposit · £100 base balance before launch', reason: 'Keep your identity and rethink the layout, copy and mobile experience.' },
      custom: { title: 'Something custom', price: '£349', deposit: '£149 deposit · £200 base balance; final quote may vary', reason: 'Extra pages or connected workflows need an agreed scope and a tailored quote.' }
    };
    var focuses = { enquiries: 'make it easier to enquire', brand: 'give the brand a distinctive presence', clarity: 'make the offer clearer on mobile' };
    var current;
    var lastInserted = '';
    function render() {
      current = packages[start.value === 'custom' || scope.value !== 'one' ? 'custom' : start.value];
      doc.getElementById('plan-package').textContent = current.title;
      doc.getElementById('plan-reason').textContent = current.reason;
      doc.getElementById('plan-price').textContent = current.price;
      doc.getElementById('plan-deposit').textContent = current.deposit;
      doc.getElementById('plan-focus').textContent = 'Design focus: ' + focuses[goal.value] + '.';
      var nodes = start.value === 'custom' ? ['Entry point', 'Workflow', 'Outcome'] : scope.value === 'booking' ? ['Introduction', 'Your offer', 'Booking / workflow'] : scope.value === 'pages' ? ['Home', 'Services / content', 'Contact'] : ['Introduction', 'Your offer', 'Enquiry'];
      var map = doc.getElementById('plan-map');
      map.replaceChildren();
      nodes.forEach(function (label) { var node = doc.createElement('span'); node.textContent = label; map.appendChild(node); });
    }
    [start, scope, goal].forEach(function (input) { input.addEventListener('change', render); });
    doc.getElementById('plan-handoff').addEventListener('click', function () {
      var details = doc.getElementById('cf-details');
      if (!details) return;
      var outline = 'Project planner outline\nStarting point: ' + start.options[start.selectedIndex].text + '\nScope: ' + scope.options[scope.selectedIndex].text + '\nPriority: ' + goal.options[goal.selectedIndex].text + '\nSuggested package: ' + current.title + ' — from ' + current.price + ' (scope and final price to be agreed).';
      // Replace only our previous outline; never discard a visitor's own words.
      var existing = details.value;
      if (lastInserted && existing.includes(lastInserted)) existing = existing.replace(lastInserted, '').trim();
      details.value = existing ? existing.trimEnd() + '\n\n' + outline : outline;
      lastInserted = outline;
      details.dispatchEvent(new Event('input', { bubbles: true }));
      details.focus();
      details.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    render();
    planner.hidden = false;
  }
  function boot() {
    bootPlanner();
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

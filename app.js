/* ============================================================
   PallettAi — page widgets
   Extracted from terminal.js: the ROI calculator and the
   Formspree form handling. Same behaviour, no nav/footer bundle.

   Markup contract:
     ROI:    #roi-enq #roi-close #roi-value
             #roi-enq-v #roi-close-v #roi-value-v
             #roi-extra #roi-sub #roi-cta #cf-roi #cf-details
     Forms:  #contact-form (action = Formspree), #win-waitlist,
             each with a .status element inside
   ============================================================ */

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

  /* ---------- ROI sliders ----------
     The 56% figure is the site's own headline claim about missed enquiries. */
  function initRoi() {
    var enq = doc.getElementById('roi-enq');
    if (!enq) return;
    var close = doc.getElementById('roi-close');
    var value = doc.getElementById('roi-value');
    var outExtra = doc.getElementById('roi-extra');
    var sub = doc.getElementById('roi-sub');

    function money(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }

    function paint() {
      var e = +enq.value, c = +close.value, v = +value.value;
      doc.getElementById('roi-enq-v').textContent = e;
      doc.getElementById('roi-close-v').innerHTML = c + '<small>%</small>';
      doc.getElementById('roi-value-v').textContent = money(v);
      var missed = e * 0.56 * 12 * (c / 100) * v;
      outExtra.textContent = money(missed);
      sub.textContent = 'a year, sitting in the gap between people who visited and people who actually got in touch.';
    }
    [enq, close, value].forEach(function (el) { el.addEventListener('input', paint); });
    paint();

    var cta = doc.getElementById('roi-cta');
    if (cta) {
      cta.addEventListener('click', function () {
        var note = 'ROI calculator: ' + enq.value + ' enquiries/mo, ' + close.value + '% close rate, avg project £' +
          value.value + ' → 56% more enquiries ≈ ' + outExtra.textContent;
        var hid = doc.getElementById('cf-roi');
        if (hid) hid.value = note;
        var ta = doc.getElementById('cf-details');
        if (ta && !ta.value.trim()) {
          ta.value = 'I used the calculator and it looks like I could be missing ' + outExtra.textContent +
            ' of work a year. Can you tell me how you capture more of those enquiries?';
        }
      });
    }
  }

  /* ---------- ROI: the cumulative-revenue chart ----------
     Drawn from the same three sliders, and deliberately not inventing a
     curve: cumulative revenue at a constant run rate is a straight line, so
     straight lines are what it draws. Two things tie it back to the figure
     above rather than contradicting it — the shaded gap at month 12 is
     monthly * 0.56 * 12, which is exactly the #roi-extra calculation, and
     the top-right total is the full 12-month run rate.

     The chart is aria-hidden; #roi-extra and #roi-sub already state the
     same maths as text, so nothing here needs to reach a screen reader. */
  function initRoiChart() {
    var host = doc.getElementById('roi-graph');
    var enq = doc.getElementById('roi-enq');
    if (!host || !enq) return;
    var close = doc.getElementById('roi-close');
    var value = doc.getElementById('roi-value');
    var svg = host.querySelector('svg.rc');
    var tot = doc.getElementById('rc-tot');
    if (!svg) return;

    var NS = 'http://www.w3.org/2000/svg';
    function el(n, c) {
      var e = doc.createElementNS(NS, n);
      if (c) e.setAttribute('class', c);
      return e;
    }

    /* these four match viewBox="0 0 720 208" in index.html */
    var W = 720, H = 208, PL = 62, PR = 18, PT = 16, PB = 34;
    var plotW = W - PL - PR, plotH = H - PT - PB;

    var grid = el('g', 'rc-grid'), dyn = el('g', 'rc-dyn');
    svg.appendChild(grid);
    svg.appendChild(dyn);

    /* static frame: four rules, plus a tick every quarter */
    var r, gy, gx;
    for (r = 0; r <= 4; r++) {
      gy = PT + plotH * (r / 4);
      var rule = el('line', 'rc-rule');
      rule.setAttribute('x1', PL); rule.setAttribute('x2', W - PR);
      rule.setAttribute('y1', gy.toFixed(1)); rule.setAttribute('y2', gy.toFixed(1));
      grid.appendChild(rule);
    }
    for (r = 0; r <= 12; r += 3) {
      gx = PL + plotW * (r / 12);
      var tick = el('line', 'rc-tick');
      tick.setAttribute('x1', gx.toFixed(1)); tick.setAttribute('x2', gx.toFixed(1));
      tick.setAttribute('y1', (H - PB).toFixed(1)); tick.setAttribute('y2', (H - PB + 6).toFixed(1));
      grid.appendChild(tick);
    }

    var gap = el('path', 'rc-gap');
    var nowLine = el('path', 'rc-now');
    var maxLine = el('path', 'rc-max');
    dyn.appendChild(gap); dyn.appendChild(nowLine); dyn.appendChild(maxLine);

    function money(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }

    function paint() {
      var e = +enq.value, c = +close.value, v = +value.value;
      var monthly = e * (c / 100) * v;
      var top = Math.max(monthly * 1.56 * 12, 1);

      function X(m) { return PL + plotW * (m / 12); }
      function Y(val) { return (H - PB) - plotH * (val / top); }

      var nowPts = [], maxPts = [], m;
      for (m = 0; m <= 12; m++) {
        nowPts.push(X(m).toFixed(1) + ',' + Y(monthly * m).toFixed(1));
        maxPts.push(X(m).toFixed(1) + ',' + Y(monthly * 1.56 * m).toFixed(1));
      }
      var nowD = 'M' + nowPts.join('L');
      var maxD = 'M' + maxPts.join('L');
      nowLine.setAttribute('d', nowD);
      maxLine.setAttribute('d', maxD);
      /* forward along today's line, back along the potential one */
      gap.setAttribute('d', nowD + 'L' + maxPts.slice().reverse().join('L') + 'Z');

      if (tot) tot.innerHTML = money(monthly * 1.56 * 12) + '<small>over 12 months</small>';
    }

    [enq, close, value].forEach(function (input) { input.addEventListener('input', paint); });
    paint();
  }

  /* ---------- forms ---------- */

  function postForm(form, status, sendingLabel, idleLabel, okMessage) {
    var btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = sendingLabel; }
    if (status) { status.className = 'status'; status.textContent = '> sending…'; }
    return fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
      mode: 'cors'
    }).then(function (r) {
      if (!r.ok) throw new Error('bad');
      if (status) { status.className = 'status ok'; status.textContent = okMessage; }
      form.reset();
      ping(form.id === 'win-waitlist' ? '/event/waitlist' : '/event/contact');
    }).catch(function () {
      if (status) {
        status.className = 'status err';
        status.textContent = '> something went wrong — email support@pallettai.org and we will pick it up';
      }
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = idleLabel; }
    });
  }

  function initContactForm() {
    var form = doc.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      postForm(form, form.querySelector('.status'), 'Sending…', 'Send enquiry ↗',
        "> thanks — it's with us. We'll reply within 48 hours.");
    });
  }

  function initWaitlist() {
    var form = doc.getElementById('win-waitlist');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      postForm(form, form.querySelector('.status'), 'Joining…', 'Join the waitlist',
        "> you're on the list — one email when the Windows build is ready, nothing else.");
    });
  }

  function boot() {
    initRoi();
    initRoiChart();
    initContactForm();
    initWaitlist();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

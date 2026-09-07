/* ============================================================
   PallettAi — shared nav, footer, forms and grader.
   ============================================================ */
(function () {
  'use strict';

  var GRADER = 'https://pallettai-grader.coreypallett20.workers.dev';
  var PORTAL = 'https://billing.stripe.com/p/login/5kQ5kwaW94S15oqcKz2B200';
  var FORMS = 'https://formspree.io/f/xgaeoapw';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Same link set and labels as the live site. On the homepage the first two
     point at in-page anchors; everywhere else they reach back to index.html. */
  var LINKS = [
    ['#features', 'index.html#features', 'Product'],
    ['#grader', 'index.html#grader', 'Features'],
    ['portfolio.html', 'portfolio.html', 'Showcase'],
    ['telegram.html', 'telegram.html', 'Telegram'],
    ['live.html', 'live.html', 'Live'],
    ['downloads.html', 'downloads.html', 'Download'],
    ['changelog.html', 'changelog.html', 'Changelog'],
    ['pricing.html', 'pricing.html', 'Pricing']
  ];

  var HERE = {
    home: null,
    showcase: 'portfolio.html',
    telegram: 'telegram.html',
    live: 'live.html',
    downloads: 'downloads.html',
    changelog: 'changelog.html',
    pricing: 'pricing.html',
    privacy: null,
    terms: null,
    lost: null
  };

  function injectNav() {
    var host = document.getElementById('nav');
    if (!host) return;
    var page = host.getAttribute('data-page') || 'home';
    var home = page === 'home';
    var here = HERE[page] || null;

    var bar = document.createElement('div');
    bar.className = 'wrap inner';

    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = home ? '#top' : 'index.html';
    brand.setAttribute('aria-label', 'PallettAi home');
    brand.innerHTML = '<span class="glyph" aria-hidden="true">P/</span><span class="word">Pallett<i>Ai</i></span>';
    bar.appendChild(brand);

    var tabs = document.createElement('nav');
    tabs.className = 'tabs';
    tabs.setAttribute('aria-label', 'Sections');
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = home ? l[0] : l[1];
      a.textContent = l[2];
      if (here && l[1] === here) {
        a.className = 'on';
        a.setAttribute('aria-current', 'page');
      }
      tabs.appendChild(a);
    });
    bar.appendChild(tabs);

    var cta = document.createElement('a');
    cta.className = 'nav-cta';
    cta.href = home ? '#contact' : 'index.html#contact';
    cta.textContent = "LET'S TALK";
    bar.appendChild(cta);

    host.className = 'topbar';
    host.appendChild(bar);
  }

  function injectFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    host.className = 'site-foot';
    var year = new Date().getFullYear();
    host.innerHTML =
      '<div class="wrap inner">' +
      '<span>&copy; ' + year + ' PALLETTAI — MADE WITH CURIOSITY ✦</span>' +
      '<a href="privacy.html">PRIVACY POLICY</a>' +
      '<a href="terms.html">TERMS OF SERVICE</a>' +
      '<a href="' + PORTAL + '" target="_blank" rel="noopener noreferrer">MANAGE SUBSCRIPTION ↗</a>' +
      '<a href="https://github.com/PallettAi" target="_blank" rel="noopener noreferrer">GITHUB</a>' +
      '<a href="https://x.com/1PallettAi" target="_blank" rel="noopener noreferrer">X</a>' +
      '</div>';
  }

  function initReveal() {
    var els = document.querySelectorAll('.up');
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- hero terminal: type out the studio's own result ---------- */
  function initHeroTerm() {
    var term = document.getElementById('term');
    if (!term) return;
    var script = [
      { t: 400, html: '<span class="p">$</span> <span class="cmd">pallett check pallettai.org</span>' },
      { t: 620, html: '<span class="soft">fetching · measuring · scoring…</span>' },
      { t: 520, html: '<span class="ok">✓</span> speed <span class="dots">·······</span> <span class="num">36/36</span>' },
      { t: 300, html: '<span class="ok">✓</span> mobile <span class="dots">······</span> <span class="num">20/20</span>' },
      { t: 300, html: '<span class="ok">✓</span> seo <span class="dots">·········</span> <span class="num">30/30</span>' },
      { t: 300, html: '<span class="ok">✓</span> security <span class="dots">····</span> <span class="num">14/14</span>' },
      { t: 460, html: '&nbsp;' },
      { t: 0, html: '<span class="done">RATED 100/100 — no faults found.</span>' },
      { t: 500, html: '<span class="soft">your turn ↓ paste any address in the checker</span>' }
    ];
    function line(html) {
      var el = document.createElement('span');
      el.className = 'ln';
      el.innerHTML = html;
      term.appendChild(el);
      return el;
    }
    if (reduce) {
      script.forEach(function (s) { line(s.html); });
      line('<span class="p">$</span> <span class="caret"></span>');
      return;
    }
    function run(i) {
      if (i >= script.length) { line('<span class="p">$</span> <span class="caret"></span>'); return; }
      line(script[i].html);
      setTimeout(function () { run(i + 1); }, script[i].t);
    }
    setTimeout(function () { run(0); }, 300);
  }

  /* ---------- the checker ---------- */
  function normalize(raw) {
    var v = (raw || '').trim();
    if (!v) return null;
    var u;
    try { u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : 'https://' + v); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname || u.hostname.indexOf('.') === -1) return null;
    return u;
  }

  function rank(got, max) { var p = max ? got / max : 1; return p >= 0.85 ? '' : p >= 0.5 ? 'warn' : 'fail'; }

  function grade(href) {
    return fetch(GRADER + '/grade?url=' + encodeURIComponent(href)).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok || !j) throw new Error((j && j.error) || 'that address could not be read');
        return j;
      });
    });
  }

  function renderBars(host, cats) {
    host.innerHTML = '';
    Object.keys(cats || {}).forEach(function (name) {
      var c = cats[name];
      var el = document.createElement('div');
      el.className = 'bar ' + rank(c.got, c.max);
      el.innerHTML = '<div class="t"><span></span><span></span></div><div class="track"><div class="fill"></div></div>';
      el.querySelector('.t span:first-child').textContent = name;
      el.querySelector('.t span:last-child').textContent = c.got + '/' + c.max;
      host.appendChild(el);
      var pct = c.max ? Math.round((c.got / c.max) * 100) : 0;
      requestAnimationFrame(function () { el.querySelector('.fill').style.width = pct + '%'; });
    });
  }

  function renderFinds(host, checks) {
    host.innerHTML = '';
    (checks || []).forEach(function (c) {
      var li = document.createElement('li');
      li.className = c.status === 'pass' ? '' : c.status;
      var mark = document.createElement('span');
      mark.className = 'm';
      mark.textContent = c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✕';
      var body = document.createElement('div');
      var label = document.createElement('b');
      label.textContent = c.label;
      body.appendChild(label);
      body.appendChild(document.createTextNode(c.detail || ''));
      if (c.fix) {
        var fix = document.createElement('span');
        fix.className = 'fix';
        fix.textContent = 'Our fix: ' + c.fix;
        body.appendChild(fix);
      }
      li.appendChild(mark);
      li.appendChild(body);
      host.appendChild(li);
    });
  }

  function initChecker() {
    var form = document.getElementById('check-form');
    if (!form) return;

    var input = document.getElementById('check-url');
    var rival = document.getElementById('check-rival');
    var status = document.getElementById('check-status');
    var out = document.getElementById('check-out');
    var compare = document.getElementById('check-compare');
    var tools = document.getElementById('check-tools');
    var vsToggle = document.getElementById('vs-toggle');
    var vsField = document.getElementById('vs-field');
    var last = { a: null, b: null };

    if (vsToggle) {
      vsToggle.addEventListener('click', function () {
        var open = vsToggle.getAttribute('aria-expanded') === 'true';
        vsToggle.setAttribute('aria-expanded', String(!open));
        vsField.hidden = open;
        if (!open && rival) rival.focus();
      });
    }

    function showOwn(host, j) {
      document.getElementById('g-host').textContent = host;
      document.getElementById('g-score').textContent = j.score;
      document.getElementById('g-band').textContent = j.band || '';
      renderBars(document.getElementById('g-bars'), j.categories);
      renderFinds(document.getElementById('g-finds'), j.checks);
      out.hidden = false;
      if (tools) tools.hidden = false;
    }

    function showCompare(a, ja, b, jb) {
      document.getElementById('vs-host-a').textContent = a;
      document.getElementById('vs-host-b').textContent = b;
      document.getElementById('vs-score-a').textContent = ja.score;
      document.getElementById('vs-score-b').textContent = jb.score;
      document.getElementById('vs-col-a').className = 'vs-col' + (ja.score >= jb.score ? ' win' : '');
      document.getElementById('vs-col-b').className = 'vs-col' + (jb.score > ja.score ? ' win' : '');

      var verdict = document.getElementById('vs-verdict');
      var d = ja.score - jb.score;
      if (d > 0) verdict.textContent = a + ' is ahead by ' + d + ' points. Worth protecting that lead.';
      else if (d < 0) verdict.textContent = b + ' is ahead by ' + Math.abs(d) + ' points. Here is exactly where you are losing ground.';
      else verdict.textContent = 'Dead level at ' + ja.score + '/100. The next fix decides it.';

      /* only list categories where the rival genuinely does better */
      var gaps = [];
      Object.keys(ja.categories || {}).forEach(function (name) {
        var mine = ja.categories[name], theirs = (jb.categories || {})[name];
        if (theirs && theirs.got > mine.got) {
          gaps.push(name + ' — they score ' + theirs.got + '/' + theirs.max + ', you score ' + mine.got + '/' + mine.max);
        }
      });
      var gapHost = document.getElementById('vs-gaps');
      if (gaps.length) {
        gapHost.innerHTML = '<h4>Where they beat you</h4><ul></ul>';
        var ul = gapHost.querySelector('ul');
        gaps.forEach(function (g) {
          var li = document.createElement('li');
          li.textContent = g;
          ul.appendChild(li);
        });
      } else {
        gapHost.innerHTML = '<h4>Where they beat you</h4><p class="status ok">Nowhere — you match or beat them in every category.</p>';
      }
      compare.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var target = normalize(input.value);
      if (!target) { status.className = 'status err'; status.textContent = '> that does not look like a web address — try yourbusiness.co.uk'; return; }
      var other = (rival && !vsField.hidden) ? normalize(rival.value) : null;

      out.hidden = true;
      compare.hidden = true;
      if (tools) tools.hidden = true;
      status.className = 'status';
      status.textContent = other
        ? '> measuring ' + target.hostname + ' against ' + other.hostname + '…'
        : '> measuring ' + target.hostname + '…';

      var btn = form.querySelector('button[type=submit]');
      if (btn) btn.disabled = true;
      var jobs = other ? [grade(target.href), grade(other.href)] : [grade(target.href)];
      Promise.all(jobs).then(function (res) {
        last.a = { host: target.hostname, data: res[0] };
        showOwn(target.hostname, res[0]);
        if (other && res[1]) {
          last.b = { host: other.hostname, data: res[1] };
          showCompare(target.hostname, res[0], other.hostname, res[1]);
          status.textContent = '> ' + target.hostname + ' ' + res[0].score + '/100 · ' + other.hostname + ' ' + res[1].score + '/100';
        } else {
          status.textContent = '> ' + target.hostname + ' rated ' + res[0].score + '/100';
        }
      }).catch(function (err) {
        status.className = 'status err';
        status.textContent = '> ' + (err.message || 'the checker is busy — try again shortly');
      }).finally(function () {
        if (btn) btn.disabled = false;
      });
    });

    var copy = document.getElementById('tool-copy');
    if (copy) {
      copy.addEventListener('click', function () {
        if (!last.a) return;
        var url = location.origin + location.pathname + '?check=' + encodeURIComponent(last.a.host) + (last.b ? '&vs=' + encodeURIComponent(last.b.host) : '') + '#check';
        var done = function (ok) {
          copy.textContent = ok ? 'Link copied' : 'Copy failed — select the address bar';
          setTimeout(function () { copy.textContent = 'Copy report link'; }, 1800);
        };
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = url;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;left:-9999px;top:0';
          document.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
          document.body.removeChild(ta);
          done(ok);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { done(true); }, fallback);
        } else fallback();
      });
    }

    var print = document.getElementById('tool-print');
    if (print) {
      print.addEventListener('click', function () {
        var host = document.getElementById('ps-host');
        var score = document.getElementById('ps-score');
        var date = document.getElementById('ps-date');
        if (host) host.textContent = (last.a && last.a.host) || input.value || '—';
        if (score) {
          score.textContent = last.a
            ? last.a.data.score + '/100' + (last.b ? '  vs  ' + last.b.host + ' ' + last.b.data.score + '/100' : '')
            : '—';
        }
        if (date) {
          date.textContent = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
        }
        document.body.classList.add('printing-report');
        var done = function () { document.body.classList.remove('printing-report'); };
        if ('onafterprint' in window) window.addEventListener('afterprint', done, { once: true });
        else setTimeout(done, 800);
        window.print();
      });
    }

    /* deep link: ?check=host&vs=host runs the report on arrival */
    var q = new URLSearchParams(location.search);
    if (q.get('check')) {
      input.value = q.get('check');
      if (q.get('vs') && rival) {
        rival.value = q.get('vs');
        vsField.hidden = false;
        if (vsToggle) vsToggle.setAttribute('aria-expanded', 'true');
      }
      form.dispatchEvent(new Event('submit'));
    }
  }

  /* ---------- ROI sliders ---------- */
  function initRoi() {
    var enq = document.getElementById('roi-enq');
    if (!enq) return;
    var close = document.getElementById('roi-close');
    var value = document.getElementById('roi-value');
    var outExtra = document.getElementById('roi-extra');
    var sub = document.getElementById('roi-sub');

    function money(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }

    function paint() {
      var e = +enq.value, c = +close.value, v = +value.value;
      document.getElementById('roi-enq-v').textContent = e;
      document.getElementById('roi-close-v').innerHTML = c + '<small>%</small>';
      document.getElementById('roi-value-v').textContent = money(v);
      /* the 56% figure is the site's own headline claim about missed enquiries */
      var missed = e * 0.56 * 12 * (c / 100) * v;
      outExtra.textContent = money(missed);
      sub.textContent = 'a year, sitting in the gap between people who visited and people who actually got in touch.';
    }
    [enq, close, value].forEach(function (el) { el.addEventListener('input', paint); });
    paint();

    var cta = document.getElementById('roi-cta');
    if (cta) {
      cta.addEventListener('click', function () {
        var note = 'ROI calculator: ' + enq.value + ' enquiries/mo, ' + close.value + '% close rate, avg project £' + value.value + ' → 56% more enquiries ≈ ' + outExtra.textContent;
        var hid = document.getElementById('cf-roi');
        if (hid) hid.value = note;
        var ta = document.getElementById('cf-details');
        if (ta && !ta.value.trim()) {
          ta.value = 'I used the calculator and it looks like I could be missing ' + outExtra.textContent + ' of work a year. Can you tell me how you capture more of those enquiries?';
        }
      });
    }
  }

  /* ---------- pricing: monthly / annual ---------- */
  function initBilling() {
    var sw = document.getElementById('billing-switch');
    if (!sw) return;
    var lblM = document.getElementById('lbl-monthly');
    var lblA = document.getElementById('lbl-annual');
    var heading = document.getElementById('aftercare-heading');
    var annual = false;

    sw.addEventListener('click', function () {
      annual = !annual;
      sw.setAttribute('aria-checked', String(annual));
      lblM.classList.toggle('active', !annual);
      lblA.classList.toggle('active', annual);
      document.querySelectorAll('.tier .amount').forEach(function (el) {
        el.textContent = annual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
      });
      document.querySelectorAll('.tier .annual-note').forEach(function (el) {
        el.textContent = annual ? '· billed yearly' : '';
      });
      document.querySelectorAll('.tier .btn[data-monthly]').forEach(function (el) {
        el.href = annual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
        var label = annual ? el.getAttribute('data-label-annual') : el.getAttribute('data-label-monthly');
        if (label) el.textContent = label;
      });
      if (heading) {
        heading.innerHTML = annual
          ? 'Aftercare, <span class="g">billed yearly.</span>'
          : 'Aftercare that <span class="g">never sleeps.</span>';
      }
    });
  }

  function postForm(form, status, sendingLabel, idleLabel, okMessage) {
    var btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = sendingLabel; }
    if (status) { status.className = 'status'; status.textContent = '> sending…'; }
    return fetch(form.action || FORMS, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
      mode: 'cors'
    }).then(function (r) {
      if (!r.ok) throw new Error('bad');
      if (status) { status.className = 'status ok'; status.textContent = okMessage; }
      form.reset();
    }).catch(function () {
      if (status) {
        status.className = 'status err';
        status.textContent = '> something went wrong — email pallettai@proton.me and we will pick it up';
      }
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = idleLabel; }
    });
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      postForm(form, form.querySelector('.status'), 'Sending…', 'Send enquiry ↗', "> thanks — it's with us. We'll reply within 48 hours.");
    });
  }

  function initWaitlist() {
    var form = document.getElementById('win-waitlist');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      postForm(form, form.querySelector('.status'), 'Joining…', 'Join the waitlist', "> you're on the list — one email when the Windows build is ready, nothing else.");
    });
  }

  function initReels() {
    document.querySelectorAll('[data-reel]').forEach(function (reel) {
      var slides = reel.querySelectorAll('figure');
      if (!slides.length) return;
      var count = reel.querySelector('[data-reel-count]');
      var prev = reel.querySelector('[data-reel-prev]');
      var next = reel.querySelector('[data-reel-next]');
      var i = 0;

      function show(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (s, idx) { s.classList.toggle('on', idx === i); });
        if (count) count.textContent = (i + 1) + ' / ' + slides.length;
        if (prev) prev.disabled = slides.length < 2;
        if (next) next.disabled = slides.length < 2;
      }

      if (prev) prev.addEventListener('click', function () { show(i - 1); });
      if (next) next.addEventListener('click', function () { show(i + 1); });

      reel.setAttribute('tabindex', '0');
      reel.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
      });

      var startX = null;
      reel.addEventListener('touchstart', function (e) {
        startX = e.changedTouches[0].clientX;
      }, { passive: true });
      reel.addEventListener('touchend', function (e) {
        if (startX == null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
        startX = null;
      });

      reel.querySelectorAll('img').forEach(function (img) {
        img.addEventListener('error', function () {
          img.hidden = true;
          var empty = img.parentElement.querySelector('.reel-empty');
          if (empty) empty.hidden = false;
        });
      });

      show(0);
    });
  }

  function boot() {
    injectNav();
    injectFooter();
    initReveal();
    initHeroTerm();
    initChecker();
    initRoi();
    initBilling();
    initContactForm();
    initWaitlist();
    initReels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

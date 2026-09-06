/* ============================================================
   PallettAi — shared site behaviour
   Single source of truth for the nav, footer, reveal/glass/
   transition effects, button shimmer and a11y extras.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- shared nav (injected) ---------------- */
  var NAV = {
    home: {
      brand: '#top',
      here: null,
      cta: ['#contact', 'Let\'s talk'],
      links: [
        ['#features', 'Product'],
        ['#grader', 'Features'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    },
    pricing: {
      brand: 'index.html',
      here: 'pricing.html',
      cta: ['index.html#contact', 'Let\'s talk', 'page'],
      links: [
        ['index.html#features', 'Product', 'page'],
        ['index.html#grader', 'Features', 'page'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    },
    showcase: {
      brand: 'index.html',
      here: 'portfolio.html',
      cta: ['index.html#contact', 'Let\'s talk', 'page'],
      links: [
        ['index.html#features', 'Product', 'page'],
        ['index.html#grader', 'Features', 'page'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    },
    live: {
      brand: 'index.html',
      here: 'live.html',
      cta: ['index.html#contact', 'Let\'s talk', 'page'],
      links: [
        ['index.html#features', 'Product', 'page'],
        ['index.html#grader', 'Features', 'page'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    },
    downloads: {
      brand: 'index.html',
      here: 'downloads.html',
      cta: ['index.html#contact', 'Let\'s talk', 'page'],
      links: [
        ['index.html#features', 'Product', 'page'],
        ['index.html#grader', 'Features', 'page'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    },
    privacy: {
      brand: 'index.html',
      here: 'privacy.html',
      cta: ['index.html#contact', 'Let\'s talk', 'page'],
      links: [
        ['index.html#features', 'Product', 'page'],
        ['index.html#grader', 'Features', 'page'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    },
    terms: {
      brand: 'index.html',
      here: 'terms.html',
      cta: ['index.html#contact', 'Let\'s talk', 'page'],
      links: [
        ['index.html#features', 'Product', 'page'],
        ['index.html#grader', 'Features', 'page'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    },
    changelog: {
      brand: 'index.html',
      here: 'changelog.html',
      cta: ['index.html#contact', 'Let\'s talk', 'page'],
      links: [
        ['index.html#features', 'Product', 'page'],
        ['index.html#grader', 'Features', 'page'],
        ['portfolio.html', 'Showcase', 'page'],
        ['live.html', 'Live', 'page'],
        ['downloads.html', 'Download', 'page'],
        ['changelog.html', 'Changelog', 'page'],
        ['pricing.html', 'Pricing', 'page']
      ]
    }
  };

  function injectNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var key = nav.getAttribute('data-page');
    var cfg = NAV[key] || NAV.home;
    if (!cfg) return;

    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = cfg.brand;
    brand.setAttribute('aria-label', 'PallettAi home');
    brand.innerHTML =
      '<img src="signal-favicon.svg" width="26" height="26" alt="" aria-hidden="true" />' +
      '<span class="wordmark" aria-hidden="true"><span class="pallett">Pallett</span><span class="ai">Ai</span></span>';
    nav.appendChild(brand);

    var links = document.createElement('div');
    links.className = 'nav-links';
    links.id = 'nav-links';
    cfg.links.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l[0];
      a.textContent = l[1];
      if (l[2] === 'page') a.className = 'pagelink';
      if (cfg.here && l[0] === cfg.here) {
        a.className += ' here';
        a.setAttribute('aria-current', 'page');
      }
      links.appendChild(a);
    });
    nav.appendChild(links);

    var end = document.createElement('div');
    end.className = 'nav-end';

    var cta = document.createElement('a');
    cta.href = cfg.cta[0];
    cta.textContent = cfg.cta[1];
    cta.className = 'nav-cta' + (cfg.cta[2] === 'page' ? ' pagelink' : '');
    end.appendChild(cta);

    var toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Menu');
    toggle.setAttribute('aria-controls', 'nav-links');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    end.appendChild(toggle);

    nav.appendChild(end);
    initNavMenu(nav, toggle);
  }

  /* ---------------- collapsible nav on small screens ---------------- */
  function initNavMenu(nav, toggle) {
    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    // Any nav link closes the panel — including same-page anchors, which don't
    // trigger a page load and would otherwise leave the menu hanging open.
    nav.querySelectorAll('.nav-links a, .nav-cta').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    // Rotating a phone to landscape can cross the breakpoint while the panel is
    // open, which would leave `.open` styling on a nav that is no longer collapsed.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 700) setOpen(false);
    });
  }

  /* ---------------- shared footer (injected) ---------------- */
  var FOOTER_HTML =
    '<span>&copy; <span id="year">' + new Date().getFullYear() + '</span> PallettAi &mdash; Made with curiosity <span style="color:#c296ff">&#10022;</span></span>' +
    '<span class="legal"><a href="privacy.html">Privacy policy</a> · <a href="terms.html">Terms of service</a></span>' +
    '<span class="portal"><a href="https://billing.stripe.com/p/login/5kQ5kwaW94S15oqcKz2B200" target="_blank" rel="noopener">Manage subscription <span aria-hidden="true">↗</span></a></span>' +
    '<span class="socials">' +
    '<a href="https://github.com/PallettAi" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>GitHub</a>' +
    '<a href="https://x.com/1PallettAi" target="_blank" rel="noopener" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>X</a>' +
    '</span>';

  function injectFooter() {
    var f = document.getElementById('site-footer');
    if (!f) return;
    f.innerHTML = FOOTER_HTML;
  }

  /* ---------------- fade-up on scroll ---------------- */
  function initReveal() {
    var els = document.querySelectorAll('.fade-up');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    // threshold 0 (any part visible) rather than a percentage: a single
    // tall fade-up block (e.g. the full terms/privacy document) can never
    // reach e.g. 12%% visibility inside a phone viewport, which left it
    // permanently at opacity 0 on mobile. Reveal as soon as it enters.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- nav glass on scroll ---------------- */
  function initNavGlass() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle('scrolled', window.scrollY > 24);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- smooth transition to other pages ---------------- */
  function initPageTransitions() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a.pagelink');
      if (!a) return;
      var sameFile = a.getAttribute('href');
      if (sameFile && (location.pathname.endsWith(sameFile.split('#')[0]) || location.pathname === '/' + sameFile.split('#')[0])) {
        // same-file anchor jump — allow native smooth scroll
        return;
      }
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { window.location.href = a.href; }, 280);
    });
    window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
  }

  /* ---------------- primary button shimmer ---------------- */
  function initShimmer() {
    document.querySelectorAll('.button.primary').forEach(function (b) {
      var r = null;
      b.addEventListener('pointerenter', function () { r = b.getBoundingClientRect(); });
      b.addEventListener('pointermove', function (e) {
        if (!r) r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        b.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      b.addEventListener('pointerleave', function () { r = null; });
    });
  }

  /* ---------------- FAQ details → aria-expanded ---------------- */
  function initFaqA11y() {
    document.querySelectorAll('.faq details').forEach(function (d) {
      var s = d.querySelector('summary');
      if (!s) return;
      var sync = function () { s.setAttribute('aria-expanded', d.open ? 'true' : 'false'); };
      d.addEventListener('toggle', sync);
      sync();
    });
  }

  /* ---------------- conversion events (GoatCounter) ---------------- */
  function gcEvent(name) {
    if (!window.goatcounter || !window.goatcounter.count) return;
    window.goatcounter.count({ path: name, event: true, title: name });
  }
  function initConversionEvents() {
    // Download buttons on downloads.html (delegated — works regardless of layout)
    document.addEventListener('click', function (e) {
      var dl = e.target.closest('.dl-download');
      if (dl) gcEvent(dl.classList.contains('primary') ? 'download-apple-silicon' : 'download-intel');
    });
    // Health-grader submissions on index.html
    var gf = document.getElementById('grader-form');
    if (gf) gf.addEventListener('submit', function () { gcEvent('grader-submit'); });
  }

  injectNav();
  injectFooter();
  initReveal();
  initNavGlass();
  initPageTransitions();
  initShimmer();
  initFaqA11y();
  initConversionEvents();
})();

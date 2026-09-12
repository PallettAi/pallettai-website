/* ============================================================
   PallettAi — shared theme script
   Injects the shared chrome (background, watermark sprite, nav,
   footer) and runs the page behaviours, mirroring the pattern
   terminal.js established: nav and footer are built in JS.

   Loaded with defer and holds no inline script, so the site's
   script-src 'self' policy still applies. Every effect here is an
   enhancement: with no JS, or with motion reduced, the page renders
   complete and static.
   ============================================================ */

(function () {
  'use strict';

  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer:fine)').matches;
  var doc = document;

  /* ---------- shared chrome ---------- */

  /* keys match each page's data-page attribute, so the current item highlights */
  var LINKS = [
    ['portfolio', 'Work', 'portfolio.html'],
    ['downloads', 'Studio', 'downloads.html'],
    ['pricing', 'Pricing', 'pricing.html'],
    ['support', 'Support', 'support.html']
  ];

  var SKY =
    '<i class="b1"></i><i class="b2"></i><i class="b3"></i>' +
    '<span class="sweep"></span>' +
    '<svg class="currents" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs>' +
        '<pattern id="cur" width="200" height="120" patternUnits="userSpaceOnUse">' +
          '<path d="M0 92 C50 44 92 138 140 92 C176 56 190 122 200 90" fill="none" stroke="rgba(159,212,255,.42)" stroke-width="1"/>' +
          '<path d="M0 30 C46 -8 96 74 142 30 C178 -2 190 54 200 28" fill="none" stroke="rgba(159,212,255,.2)" stroke-width="1"/>' +
        '</pattern>' +
        '<pattern id="cur2" width="140" height="90" patternUnits="userSpaceOnUse">' +
          '<path d="M0 70 C36 34 68 104 104 70 C128 46 136 84 140 68" fill="none" stroke="rgba(234,245,255,.24)" stroke-width="1"/>' +
        '</pattern>' +
      '</defs>' +
      '<rect width="1200" height="800" fill="url(#cur)"/>' +
    '</svg>' +
    '<svg class="currents b" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect width="1200" height="800" fill="url(#cur2)"/>' +
    '</svg>';

  /* watermark symbol: tick ring + compass rose, drawn once */
  var SPRITE =
    '<svg class="sprite" aria-hidden="true">' +
      '<symbol id="wm" viewBox="0 0 1000 1000">' +
        '<g fill="none" stroke="rgba(159,212,255,.15)" stroke-width="1.3">' +
          '<circle cx="500" cy="500" r="450"/><circle cx="500" cy="500" r="408"/>' +
          '<circle cx="500" cy="500" r="368"/><circle cx="500" cy="500" r="330"/>' +
          '<circle cx="500" cy="500" r="294"/><circle cx="500" cy="500" r="260"/>' +
          '<circle cx="500" cy="500" r="228"/><circle cx="500" cy="500" r="198"/>' +
          '<circle cx="500" cy="500" r="170"/><circle cx="500" cy="500" r="144"/>' +
          '<circle cx="500" cy="500" r="120"/>' +
        '</g>' +
        '<circle cx="500" cy="500" r="428" fill="none" stroke="rgba(159,212,255,.34)" stroke-width="17" stroke-dasharray="2 32"/>' +
        '<circle cx="500" cy="500" r="88" fill="none" stroke="rgba(234,245,255,.22)" stroke-width="1.3" stroke-dasharray="5 9"/>' +
        '<g stroke="rgba(234,245,255,.5)" stroke-width="1.4">' +
          '<line x1="500" y1="52" x2="500" y2="924"/><line x1="52" y1="500" x2="924" y2="500"/>' +
        '</g>' +
        '<circle cx="500" cy="500" r="4" fill="rgba(234,245,255,.7)"/>' +
      '</symbol>' +
    '</svg>';

  function brand(href) {
    return      '<a class="brand" href="' + href + '"><img src="signal-logo.svg" alt="" width="27" height="27" />' +
      '<b>Pallett<i>Ai</i></b></a>';
  }

  function chrome() {
    var page = doc.body.getAttribute('data-page') || 'home';

    var nav = doc.getElementById('nav');
    if (nav) {
      var links = LINKS.map(function (l) {
        var on = l[0] === page;
        return '<a href="' + l[2] + '"' + (on ? ' class="active" aria-current="page"' : '') + '>' + l[1] + '</a>';
      }).join('');
      nav.innerHTML =
        '<div class="nav-in">' +
          brand('index.html') +
          '<button class="burger" id="burger" aria-expanded="false" aria-controls="navlinks" aria-label="Menu">☰</button>' +
          '<nav class="nav-links" id="navlinks" aria-label="Primary">' + links +
            '<a class="nav-cta" href="index.html#contact">Start a project</a>' +
          '</nav>' +
          '<span class="prog" aria-hidden="true"><i id="prog"></i></span>' +
        '</div>';
    }

    /* accepts either id, so a page can run the old or the new chrome */
    var foot = doc.getElementById('sitefooter') || doc.getElementById('site-footer');
    if (foot) {
      foot.innerHTML =
        '<div class="wrap-l">' +
          '<div class="fg">' +
            '<div>' + brand('index.html') +
              '<p class="fnote">Websites, tools and Telegram bots. Built and checked in the United Kingdom.</p>' +
            '</div>' +
            '<div><p class="k">Work</p>' +
              '<a href="portfolio.html">Case studies</a>' +
              '<a href="telegram.html">Ghost Arb Bot</a>' +
              '<a href="live.html">Live board</a>' +
              '<a href="index.html#grader">Free website check</a>' +
            '</div>' +
            '<div><p class="k">Studio</p>' +
              '<a href="downloads.html">PallettAi Studio</a>' +
              '<a href="downloads.html#studio-plans">Plans</a>' +
              '<a href="downloads.html#download">Download for Mac</a>' +
              '<a href="changelog.html">Release notes</a>' +
            '</div>' +
            '<div><p class="k">Company</p>' +
              '<a href="pricing.html">Pricing</a>' +
              '<a href="support.html">Support</a>' +
              '<a href="index.html#contact">Start a project</a>' +
            '</div>' +
          '</div>' +
          '<div class="fbase">' +
            '<p class="fine">© 2026 PallettAi · Registered in the United Kingdom · ' +
              '<a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></p>' +
            '<div class="socials">' +
              '<a href="https://github.com/PallettAi" target="_blank" rel="noopener" aria-label="PallettAi on GitHub">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>' +
              '</a>' +
              '<a href="https://x.com/1PallettAi" target="_blank" rel="noopener" aria-label="PallettAi on X">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.53 3h3.02l-6.6 7.53L21.75 21h-5.9l-4.62-6.04L5.94 21H2.92l7.06-8.07L2.25 3h6.05l4.18 5.52L17.53 3Zm-1.06 16.2h1.67L7.6 4.72H5.8l10.67 14.48Z"/></svg>' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    var sky = doc.getElementById('sky');
    if (sky) sky.innerHTML = SKY;

    doc.body.insertAdjacentHTML('beforeend', SPRITE);
  }

  chrome();

  /* ---------- nav, scroll progress, scroll-linked hero depth ---------- */

  var nav = doc.getElementById('nav');
  var prog = doc.getElementById('prog');
  var hero = doc.querySelector('.hero');
  var ticking = false;

  /* Page metrics are measured on resize and on any change to the body's size,
     never read inside the scroll handler. Reading scrollHeight or offsetHeight
     on every scroll frame forces a layout flush mid-scroll, which is the
     classic source of stutter on a long page. */
  var maxScroll = 0, heroH = 0, orbDirty = true;
  function measure() {
    maxScroll = Math.max(0, doc.documentElement.scrollHeight - window.innerHeight);
    heroH = hero ? hero.offsetHeight : 0;
    orbDirty = true;
  }

  var spyLinks = [].slice.call(doc.querySelectorAll('#navlinks a[href^="#"]'));
  var spySections = spyLinks.map(function (a) { return doc.querySelector(a.getAttribute('href')); });

  /* highlight the section you are actually in (only applies to # anchors) */
  function spy() {
    if (!spyLinks.length) return;
    var y = (window.scrollY || 0) + 150, cur = null;
    spySections.forEach(function (s) {
      if (s && s.getBoundingClientRect().top + (window.scrollY || 0) <= y) cur = s;
    });
    spyLinks.forEach(function (a) {
      var on = !!cur && a.getAttribute('href') === '#' + cur.id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY || 0;
    orbDirty = true;
    if (nav) nav.classList.toggle('stuck', y > 10);
    if (prog) {
      prog.style.transform = 'scaleX(' + (maxScroll > 0 ? Math.min(1, y / maxScroll) : 0).toFixed(4) + ')';
    }
    if (hero && !rm) {
      hero.style.setProperty('--sy', Math.max(0, Math.min(1, y / (heroH || 1))).toFixed(3));
    }
    spy();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  var rt2 = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt2);
    rt2 = setTimeout(function () {
      measure();
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, 120);
  }, { passive: true });
  /* fonts, images and the grader report all change the page height after load */
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(doc.body);
  window.addEventListener('load', measure);
  measure();
  onScroll();

  var burger = doc.getElementById('burger');
  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.textContent = '☰';
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? '✕' : '☰';
    });
    var links = doc.getElementById('navlinks');
    if (links) {
      links.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    }
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); burger.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target)) closeNav();
    });
  }

  /* ---------- twinkling drift field across the whole background ---------- */
  var sky = doc.querySelector('.sky');
  if (sky && !rm) {
    var seed = 20260912, frag = doc.createDocumentFragment();
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var n = 0; n < 32; n++) {
      var st = doc.createElement('i');
      st.className = 'st';
      var sz = (1 + rnd() * 1.7).toFixed(1);
      st.style.cssText = 'left:' + (rnd() * 100).toFixed(2) + '%;top:' + (rnd() * 100).toFixed(2) +
        '%;width:' + sz + 'px;height:' + sz + 'px;animation-duration:' + (3.5 + rnd() * 5).toFixed(1) +
        's;animation-delay:-' + (rnd() * 9).toFixed(1) + 's';
      frag.appendChild(st);
    }
    sky.appendChild(frag);
  }

  /* ---------- the instrument rose — procedural hero artwork ----------
     Built before the parallax block below reads its .depth layers, so the
     new layers take part in the pointer reaction too. Nothing here is
     hand-placed: a phyllotaxis bloom, a constellation lattice and a score
     arc, all generated from one seed so the page looks the same on every
     load and in every screenshot.                                 */
  (function instrumentRose() {
    var svg = doc.querySelector('.orb svg.art');
    if (!svg) return;

    var NS = 'http://www.w3.org/2000/svg';
    var CX = 320, CY = 300;
    var seed = 8119107;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    function el(name, cls) {
      var n = doc.createElementNS(NS, name);
      if (cls) n.setAttribute('class', cls);
      return n;
    }
    var layers = svg.querySelectorAll('g.depth');

    /* (a) phyllotaxis bloom — seeds on the golden angle, so the spacing
       never repeats. Each dot's animation phase follows its index, which
       turns a plain twinkle into a shimmer that travels outward.       */
    var bloomWrap = el('g', 'depth');
    bloomWrap.setAttribute('data-depth', '6');
    var bloom = el('g', 'phyllo');
    var N = 190, MAXR = 250, GA = Math.PI * (3 - Math.sqrt(5));
    /* The dots sit in radial bands and the band is what animates. The phase
       still runs outward from the core, but the page ticks 12 animations
       instead of 190 — the single biggest cost on the page before this. */
    var BANDS = 12, band = [];
    for (var b = 0; b < BANDS; b++) {
      var bg = el('g', 'pb');
      bg.style.animationDelay = (-(b * (4.2 / BANDS))).toFixed(2) + 's';
      band.push(bg);
      bloom.appendChild(bg);
    }
    for (var i = 1; i <= N; i++) {
      var ang = i * GA, rad = MAXR * Math.sqrt(i / N), t = rad / MAXR;
      var dot = el('circle');
      dot.setAttribute('cx', (CX + Math.cos(ang) * rad).toFixed(1));
      dot.setAttribute('cy', (CY + Math.sin(ang) * rad).toFixed(1));
      dot.setAttribute('r', (0.65 + t * 1.15).toFixed(2));
      dot.style.opacity = (0.8 - t * 0.38).toFixed(2); /* the static value */
      band[Math.min(BANDS - 1, Math.floor(t * BANDS))].appendChild(dot);
    }
    bloomWrap.appendChild(bloom);
    if (layers[1]) svg.insertBefore(bloomWrap, layers[1]); else svg.appendChild(bloomWrap);

    /* (b) constellation — nodes spread through the outer band, linked only
       to neighbours close enough to feel deliberate rather than random.  */
    var conWrap = el('g', 'depth');
    conWrap.setAttribute('data-depth', '-9');
    var con = el('g', 'conste');
    var pts = [], k;
    for (k = 0; k < 22; k++) {
      var a2 = rnd() * Math.PI * 2, r2 = 118 + rnd() * 132;
      pts.push([CX + Math.cos(a2) * r2, CY + Math.sin(a2) * r2]);
    }
    /* Same banding as the bloom: the links and nodes are grouped, so 57
       animations became 9. Each band marches at its own speed, which keeps
       the lattice reading as many separate threads. */
    var LK = 5, lk = [];
    for (k = 0; k < LK; k++) {
      var lg = el('g', 'lk');
      lg.style.animationDuration = (26 + k * 4) + 's';
      lg.style.animationDelay = (-(k * 3.4)).toFixed(2) + 's';
      lk.push(lg);
      con.appendChild(lg);
    }
    var NG = 4, ng = [];
    for (k = 0; k < NG; k++) {
      var ngg = el('g', 'ndg');
      ngg.style.animationDuration = (5.6 + k * 0.8) + 's';
      ngg.style.animationDelay = (-(k * 1.3)).toFixed(2) + 's';
      ng.push(ngg);
      con.appendChild(ngg);
    }
    var REACH = 104;
    for (var x = 0; x < pts.length; x++) {
      for (var y = x + 1; y < pts.length; y++) {
        var dx = pts[x][0] - pts[y][0], dy = pts[x][1] - pts[y][1];
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > REACH) continue;
        var ln = el('line', 'lnk');
        ln.setAttribute('x1', pts[x][0].toFixed(1)); ln.setAttribute('y1', pts[x][1].toFixed(1));
        ln.setAttribute('x2', pts[y][0].toFixed(1)); ln.setAttribute('y2', pts[y][1].toFixed(1));
        lk[(x * 7 + y) % LK].appendChild(ln);
      }
    }
    for (k = 0; k < pts.length; k++) {
      var nd = el('circle', 'nd');
      nd.setAttribute('cx', pts[k][0].toFixed(1));
      nd.setAttribute('cy', pts[k][1].toFixed(1));
      nd.setAttribute('r', (1.6 + rnd() * 1.5).toFixed(2));
      ng[k % NG].appendChild(nd);
    }
    conWrap.appendChild(con);
    if (layers[3]) svg.insertBefore(conWrap, layers[3]); else svg.appendChild(conWrap);

    /* (c) score arc — one full turn, drawn once the hero comes into view.
       It stops just short of closed so it still reads as a gauge.      */
    var defs = svg.querySelector('defs');
    if (defs && !svg.querySelector('#arcGrad')) {
      var lg = el('linearGradient');
      lg.setAttribute('id', 'arcGrad');
      lg.setAttribute('x1', '0'); lg.setAttribute('y1', '1');
      lg.setAttribute('x2', '1'); lg.setAttribute('y2', '0');
      [['0%', 'rgba(159,212,255,0)'], ['30%', 'rgba(159,212,255,.45)'], ['100%', '#eaf5ff']]
        .forEach(function (s) {
          var st = el('stop');
          st.setAttribute('offset', s[0]);
          st.setAttribute('stop-color', s[1]);
          lg.appendChild(st);
        });
      defs.appendChild(lg);
    }
    var arcWrap = el('g', 'depth');
    arcWrap.setAttribute('data-depth', '3');
    var AR = 236, CIRC = 2 * Math.PI * AR;
    var arc = el('circle', 'arc');
    arc.setAttribute('cx', CX); arc.setAttribute('cy', CY);
    arc.setAttribute('r', AR);
    arc.setAttribute('transform', 'rotate(-90 ' + CX + ' ' + CY + ')');
    arc.setAttribute('stroke-dasharray', CIRC.toFixed(1));
    arc.setAttribute('stroke-dashoffset', CIRC.toFixed(1));
    arc.setAttribute('stroke', 'url(#arcGrad)');
    arc.style.setProperty('--end', (CIRC * 0.035).toFixed(1));
    arcWrap.appendChild(arc);
    svg.appendChild(arcWrap);
  })();

  /* ---------- hero artwork depth reaction (hero pages only) ---------- */
  if (fine && !rm) {
    var orb = doc.querySelector('.orb');
    var grid = doc.querySelector('.hero-grid');
    if (orb) {
      var layers = [].slice.call(orb.querySelectorAll('.depth'));
      var fig = orb.querySelector('.orb-fig');
      var raf = null, tx = 0, ty = 0, orbRect = null;
      var apply = function () {
        raf = null;
        layers.forEach(function (el) {
          var d = parseFloat(el.getAttribute('data-depth')) || 0;
          el.style.transform = 'translate3d(' + (tx * d).toFixed(2) + 'px,' + (ty * d).toFixed(2) + 'px,0)';
        });
        if (fig) fig.style.transform = 'translate3d(' + (tx * -8).toFixed(2) + 'px,' + (ty * -8).toFixed(2) + 'px,0)';
      };
      (grid || orb).addEventListener('pointermove', function (e) {
        /* the rect is cached and only re-read after a scroll or resize, so a
           pointer sweep never forces a layout read per event */
        if (!orbRect || orbDirty) { orbRect = orb.getBoundingClientRect(); orbDirty = false; }
        var r = orbRect;
        tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2));
        ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - .5) * 2));
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      (grid || orb).addEventListener('pointerleave', function () {
        tx = 0; ty = 0; orbRect = null;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    }
  }

  /* ---------- reveals ---------- */
  var items = doc.querySelectorAll('.rv');
  if (rm || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- figure count-ups ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (rm || isNaN(target)) { el.textContent = target; return; }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / 1500);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var nums = [].slice.call(doc.querySelectorAll('[data-count]'));
  if (rm || !('IntersectionObserver' in window)) {
    nums.forEach(countUp);
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.55 });
    nums.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- pricing: monthly / annual ----------
     Ported from terminal.js so a themed page needs no second script. */
  (function initBilling() {
    var sw = doc.getElementById('billing-switch');
    if (!sw) return;
    var lblM = doc.getElementById('lbl-monthly');
    var lblA = doc.getElementById('lbl-annual');
    var heading = doc.getElementById('aftercare-heading');
    var annual = false;

    sw.addEventListener('click', function () {
      annual = !annual;
      sw.setAttribute('aria-checked', String(annual));
      if (lblM) lblM.classList.toggle('active', !annual);
      if (lblA) lblA.classList.toggle('active', annual);
      doc.querySelectorAll('.tier .amt, thead .val[data-monthly]').forEach(function (el) {
        var next = annual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
        if (next) el.textContent = next;
      });
      doc.querySelectorAll('.tier .annual-note').forEach(function (el) {
        el.textContent = annual ? '· billed yearly' : '';
      });
      doc.querySelectorAll('.tier .btn[data-monthly]').forEach(function (el) {
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
  })();

  /* ---------- pause the ambience while the tab is hidden ---------- */
  doc.addEventListener('visibilitychange', function () {
    doc.documentElement.classList.toggle('paused', doc.hidden);
  });

  /* ============================================================
     WOW PASS
     1. the signal field   — a canvas network behind the blooms
     2. the score dial     — 100 ticks, one per point, on the report
     3. the typing field   — the check input invites you in
     4. hover depth        — tilt, specular light, magnetic buttons
     5. section hairlines  — the rule draws in as you reach it
     Every one of these renders statically when motion is reduced.
     ============================================================ */

  /* ---------- 1. the signal field ----------
     Faint filaments with light running along them. One canvas, no
     shadows, no filters; it pauses itself when the tab is hidden and
     draws a single still frame when motion is reduced. */
  (function signalField() {
    var sky = doc.querySelector('.sky');
    if (!sky) return;
    var cv = doc.createElement('canvas');
    cv.className = 'field';
    cv.setAttribute('aria-hidden', 'true');
    sky.insertBefore(cv, sky.firstChild);
    var ctx = cv.getContext('2d');
    if (!ctx) { cv.parentNode.removeChild(cv); return; }

    var W = 0, H = 0, nodes = [], pulses = [], LINK = 132, last = 0, raf = null;
    var px = null, py = null;
    var level = 0;   /* 0 full · 1 thinner web · 2 no links · 3 frozen */
    var now = (window.performance && performance.now)
      ? function () { return performance.now(); }
      : function () { return Date.now(); };

    /* Colours are built once per quantised alpha level, and each frame's lines
       are batched into one path per level. That replaces up to a thousand
       strokeStyle strings and stroke() calls per frame with six of each. */
    var LNK_L = 6, NODE_L = 4, linkC = [], nodeC = [], linkB = [], nodeB = [], q;
    for (q = 0; q < LNK_L; q++) {
      linkC.push('rgba(159,212,255,' + (((q + 1) / LNK_L) * .17).toFixed(3) + ')');
      linkB.push([]);
    }
    for (q = 0; q < NODE_L; q++) {
      nodeC.push('rgba(220,238,255,' + (.09 + ((q + 1) / NODE_L) * .2).toFixed(3) + ')');
      nodeB.push([]);
    }

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = sky.clientWidth || window.innerWidth;
      H = sky.clientHeight || window.innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      var n = Math.max(20, Math.min(56, Math.round((W * H) / 34000)));
      if (W < 760) n = Math.round(n * .6);
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * 11, vy: (Math.random() - .5) * 11,
          d: .34 + Math.random() * .66,
          r: .7 + Math.random() * 1.1
        });
      }
      /* fixed-size buffers, written in place — no per-frame array churn */
      px = new Float32Array(n);
      py = new Float32Array(n);
      pulses = [];
      for (var p = 0; p < 6; p++) {
        pulses.push({ a: (Math.random() * n) | 0, b: -1, t: 0, sp: .2 + Math.random() * .34 });
      }
    }

    function wrap(v, m) { return v - Math.floor(v / m) * m; }

    function step(dt) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }
      /* light hops from node to nearest neighbour, then keeps going */
      for (var p = 0; p < pulses.length; p++) {
        var pu = pulses[p];
        pu.t += pu.sp * dt;
        if (pu.t >= 1) {
          if (pu.b >= 0) pu.a = pu.b;
          pu.b = -1; pu.t = 0; pu.sp = .2 + Math.random() * .34;
        }
        if (pu.b < 0) {
          var from = nodes[pu.a];
          if (!from) { pu.a = 0; continue; }
          var best = -1, bestD = LINK;
          for (var j = 0; j < nodes.length; j++) {
            if (j === pu.a) continue;
            var dx = nodes[j].x - from.x, dy = nodes[j].y - from.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestD) { bestD = d; best = j; }
          }
          pu.b = best;
          pu.t = 0;
        }
      }
    }

    function draw() {
      if (!W || !H || !nodes.length) return;
      ctx.clearRect(0, 0, W, H);
      var y0 = window.scrollY || window.pageYOffset || 0;
      var i, j, dx, dy, d, a, q = 0, n = nodes.length, nd;

      /* screen position carries a little of the scroll, so the field has depth */
      for (i = 0; i < n; i++) {
        nd = nodes[i];
        px[i] = nd.x + y0 * .014 * nd.d;
        py[i] = wrap(nd.y - y0 * .075 * nd.d, H + 40) - 20;
      }

      if (level < 2) {
        ctx.lineWidth = 1;
        for (i = 0; i < LNK_L; i++) linkB[i].length = 0;
        for (i = 0; i < n; i++) {
          for (j = i + 1; j < n; j++) {
            dx = px[i] - px[j]; dy = py[i] - py[j];
            if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
            d = Math.sqrt(dx * dx + dy * dy);
            if (d > LINK) continue;
            a = (1 - d / LINK) * nodes[i].d;
            q = (a * LNK_L / .17) | 0;
            if (q < 0) q = 0; else if (q > LNK_L - 1) q = LNK_L - 1;
            linkB[q].push(px[i], py[i], px[j], py[j]);
          }
        }
        for (i = 0; i < LNK_L; i++) {
          var A = linkB[i];
          if (!A.length) continue;
          ctx.strokeStyle = linkC[i];
          ctx.beginPath();
          for (j = 0; j < A.length; j += 4) {
            ctx.moveTo(A[j], A[j + 1]);
            ctx.lineTo(A[j + 2], A[j + 3]);
          }
          ctx.stroke();
        }
      }

      for (i = 0; i < NODE_L; i++) nodeB[i].length = 0;
      for (i = 0; i < n; i++) {
        q = (nodes[i].d * NODE_L) | 0;
        if (q < 0) q = 0; else if (q > NODE_L - 1) q = NODE_L - 1;
        nodeB[q].push(px[i], py[i], nodes[i].r);
      }
      for (i = 0; i < NODE_L; i++) {
        var B = nodeB[i];
        if (!B.length) continue;
        ctx.fillStyle = nodeC[i];
        ctx.beginPath();
        for (j = 0; j < B.length; j += 3) {
          /* moveTo first, so each dot is its own subpath rather than being
             joined to the previous one by a stray line */
          ctx.moveTo(B[j] + B[j + 2], B[j + 1]);
          ctx.arc(B[j], B[j + 1], B[j + 2], 0, 6.2832);
        }
        ctx.fill();
      }

      for (i = 0; i < pulses.length; i++) {
        var pu = pulses[i];
        if (pu.b < 0 || !nodes[pu.b]) continue;
        var ax = px[pu.a], ay = py[pu.a], bx = px[pu.b], by = py[pu.b];
        ctx.strokeStyle = 'rgba(234,245,255,.26)';
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        for (var k = 0; k < 4; k++) {
          var tt = pu.t - k * .05;
          if (tt < 0) break;
          ctx.fillStyle = 'rgba(234,245,255,' + (.8 - k * .2).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(ax + (bx - ax) * tt, ay + (by - ay) * tt, 1.9 - k * .42, 0, 6.2832);
          ctx.fill();
        }
      }
    }

    var slow = 0;
    function frame(ts) {
      raf = null;
      if (!doc.hidden) {
        if (ts - last >= 30) {                /* 33fps is plenty for filaments */
          var dt = Math.min(.05, (ts - last) / 1000 || .016);
          last = ts;
          var t0 = now();
          step(dt);
          draw();
          var cost = now() - t0;

          /* Self-defence: this field is decoration and must never be the
             reason a fan spins up. If the work stops fitting comfortably in a
             frame it sheds detail — a thinner web, then no web, then it freezes
             on a complete still frame — instead of dragging the page down. */
          if (cost > 7) slow++;
          else if (slow > 0) slow--;
          if (slow > 20) {
            slow = 0;
            level++;
            if (level === 1) LINK = 100;
            else if (level >= 3) { level = 0; draw(); return; }
          }
        }
      } else {
        last = ts;
      }
      raf = requestAnimationFrame(frame);
    }

    size(); seed(); draw();
    if (!rm) {
      last = now();
      raf = requestAnimationFrame(frame);
    }

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        size(); seed(); draw();
        /* a new viewport is a fair chance to try full detail again */
        if (!raf && !rm) {
          level = 0; LINK = 132; slow = 0; last = now();
          raf = requestAnimationFrame(frame);
        }
      }, 220);
    }, { passive: true });
  })();

  /* ---------- 2. the score dial ----------
     Rings the report score with 100 tick marks — one per point — and
     lights them as the figure climbs. It watches #g-score, so grader.js
     is untouched, and it works for the deep-link path too. */
  (function scoreDial() {
    var gauge = doc.querySelector('.gauge');
    var fig = gauge && gauge.querySelector('.fig');
    var scoreEl = doc.getElementById('g-score');
    if (!gauge || !fig || !scoreEl) return;

    var NS = 'http://www.w3.org/2000/svg';
    var wrapEl = doc.createElement('div');
    wrapEl.className = 'dialwrap';
    wrapEl.setAttribute('aria-hidden', 'true');
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 240 240');
    svg.setAttribute('class', 'dial');

    var ticks = [], i, a, rad, major, r1;
    for (i = 0; i < 100; i++) {
      a = (i / 100) * 360 - 90;
      rad = a * Math.PI / 180;
      major = i % 10 === 0;
      r1 = major ? 95 : 100;
      var ln = doc.createElementNS(NS, 'line');
      ln.setAttribute('x1', (120 + Math.cos(rad) * r1).toFixed(2));
      ln.setAttribute('y1', (120 + Math.sin(rad) * r1).toFixed(2));
      ln.setAttribute('x2', (120 + Math.cos(rad) * 110).toFixed(2));
      ln.setAttribute('y2', (120 + Math.sin(rad) * 110).toFixed(2));
      ln.setAttribute('class', major ? 'tk maj' : 'tk');
      svg.appendChild(ln);
      ticks.push(ln);
    }
    wrapEl.appendChild(svg);
    fig.parentNode.insertBefore(wrapEl, fig);
    wrapEl.appendChild(fig);

    function base(idx) { return idx % 10 === 0 ? 'tk maj' : 'tk'; }

    /* `writing` holds the exact string of the frame we just drew, and is
       cleared one microtask later. Without it the observer reads our own
       count-up frames back as new scores and re-enters animate() on every
       frame. `climbing` stops a second run starting mid-animation. */
    var writing = null;
    var climbing = false;

    function put(v) {
      writing = String(v);
      scoreEl.textContent = writing;
      if (window.Promise) Promise.resolve().then(function () { writing = null; });
    }

    function lightTo(target) {
      for (var k = 0; k < 100; k++) ticks[k].setAttribute('class', base(k));
      for (var m = 0; m < target; m++) {
        ticks[m].setAttribute('class', base(m) + ' on');
      }
      if (target > 0) ticks[target - 1].setAttribute('class', base(target - 1) + ' on hot');
    }

    function animate(target) {
      wrapEl.className = 'dialwrap ' + (target >= 85 ? 'good' : target >= 50 ? 'warn' : 'fail');
      if (rm) { put(target); lightTo(target); return; }
      if (climbing) return;
      climbing = true;

      /* failsafe: never stay locked out if a frame never arrives */
      var unlock = setTimeout(function () { climbing = false; }, 4000);

      lightTo(0);
      var t0 = null, lit = 0;
      function climb(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1150);
        var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        put(v);
        var wasHot = lit - 1;
        while (lit < v) { ticks[lit].setAttribute('class', base(lit) + ' on'); lit++; }
        if (lit > 0) {
          ticks[lit - 1].setAttribute('class', base(lit - 1) + ' on hot');
          if (wasHot >= 0 && wasHot !== lit - 1) ticks[wasHot].setAttribute('class', base(wasHot) + ' on');
        }
        if (p < 1) requestAnimationFrame(climb);
        else { clearTimeout(unlock); climbing = false; put(target); lightTo(target); }
      }
      requestAnimationFrame(climb);
    }

    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        var txt = scoreEl.textContent;
        if (writing !== null && txt === writing) return;
        if (climbing) return;
        var v = parseInt(txt, 10);
        if (!isNaN(v)) animate(Math.max(0, Math.min(100, v)));
      }).observe(scoreEl, { childList: true, characterData: true, subtree: true });
    }
  })();

  /* ---------- 3. the typing field ----------
     The check input types addresses at you until you take it over,
     then it stops for good and stays stopped while you are typing. */
  (function typingField() {
    var input = doc.getElementById('check-url');
    if (!input || rm) return;
    var words = ['yourbusiness.co.uk', 'newclients.co.uk', 'yourstudio.co.uk', 'mybuilders.co.uk', 'yourcompany.com'];
    var n = 0, c = 0, deleting = false, onScreen = true;

    /* only types while the field is actually in view and the tab is visible */
    if ('IntersectionObserver' in window) {
      onScreen = false;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { onScreen = e.isIntersecting; });
      }, { threshold: 0 }).observe(input);
    }

    function tick() {
      if (doc.hidden || !onScreen || doc.activeElement === input || input.value.length) {
        setTimeout(tick, 900);
        return;
      }
      var w = words[n];
      c += deleting ? -1 : 1;
      input.placeholder = w.slice(0, c);
      var wait = deleting ? 38 : 74;
      if (!deleting && c >= w.length) { deleting = true; wait = 2300; }
      else if (deleting && c <= 0) { deleting = false; n = (n + 1) % words.length; wait = 420; }
      setTimeout(tick, wait);
    }
    setTimeout(tick, 1600);
  })();

  /* ---------- 4. hover depth ----------
     Tilt, a specular highlight that follows the pointer, and buttons
     that lean toward it. Pointer-only, motion-permitting only. */
  if (fine && !rm) {
    [].forEach.call(doc.querySelectorAll('.card,.tier,.panel,.step,.tile,.dl a'), function (el) {
      var raf = null, tx = 0, ty = 0, mx = 50, my = 50, rect = null;
      function apply() {
        raf = null;
        el.style.transform = 'perspective(1100px) rotateY(' + (tx * 4.5).toFixed(2) +
          'deg) rotateX(' + (-ty * 4.5).toFixed(2) + 'deg) translate3d(0,-5px,0)';
        el.style.setProperty('--mx', mx.toFixed(1) + '%');
        el.style.setProperty('--my', my.toFixed(1) + '%');
      }
      /* measured once on enter. The tilt itself moves the element, so reading
         the rect per move would feed the transform back into its own maths. */
      el.addEventListener('pointerenter', function () {
        el.classList.add('tilting');
        rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) rect = null;
      });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var r = rect;
        if (!r || !r.width || !r.height) return;
        tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2));
        ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - .5) * 2));
        mx = ((e.clientX - r.left) / r.width) * 100;
        my = ((e.clientY - r.top) / r.height) * 100;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        rect = null;
        el.style.transform = '';
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
        el.classList.remove('tilting');
      });
    });

    [].forEach.call(doc.querySelectorAll('.btn,.nav-cta'), function (el) {
      var raf = null, dx = 0, dy = 0, rect = null;
      function apply() {
        raf = null;
        el.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
      }
      el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var r = rect;
        if (!r || !r.width) return;
        dx = Math.max(-5, Math.min(5, (e.clientX - (r.left + r.width / 2)) * .16));
        dy = Math.max(-4, Math.min(4, (e.clientY - (r.top + r.height / 2)) * .2));
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        rect = null; dx = 0; dy = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    });
  }

  /* ---------- 5. section hairlines ---------- */
  var splits = [].slice.call(doc.querySelectorAll('.sec-split'));
  if (splits.length) {
    if (rm || !('IntersectionObserver' in window)) {
      splits.forEach(function (s) { s.classList.add('seen'); });
    } else {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('seen'); sio.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      splits.forEach(function (s) { sio.observe(s); });
    }
  }

  /* ---------- 6. park off-screen motion ----------
     CSS animations keep running whether or not you can see them, and this
     page is several screens tall with artwork in nearly every section. Each
     section that leaves the viewport gets .offstage, which pauses every
     descendant animation; coming back resumes exactly where it left off.
     One class toggle per section, no per-frame work. */
  (function offstage() {
    if (rm || !('IntersectionObserver' in window)) return;
    var secs = doc.querySelectorAll('main > section');
    if (!secs.length) return;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.classList.toggle('offstage', !entries[i].isIntersecting);
      }
    }, { rootMargin: '280px 0px 280px 0px' });
    [].forEach.call(secs, function (s) { io.observe(s); });
  })();
})();

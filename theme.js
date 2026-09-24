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

  /* ---------- what this machine can afford ----------

     Everything this script builds is decoration, and all of it is allocated
     for as long as the visit lasts: a canvas backing store, thirty-two
     twinkling layers, a meteor each in three places. On a small machine that
     is the difference between a quiet page and one that swaps, so the budget
     is read once, here, from the three hints the platform offers:

       navigator.deviceMemory        GB, capped at 8 — Chromium only, absent elsewhere
       navigator.hardwareConcurrency logical cores
       connection.saveData           the visitor asked for less data, and a
                                     canvas is the least essential byte we send

     Unknown is treated as capable. Safari and Firefox report neither hint,
     and guessing "weak" for every iPhone would trade the design away for a
     saving that cannot be measured. The lean path only ever subtracts
     decoration — no content, no navigation and no reveal depends on it — and
     the class goes on <html> so the stylesheet can hold the ambience still in
     the same breath. */
  var mem = navigator.deviceMemory || 0;
  var cores = navigator.hardwareConcurrency || 0;
  var lean = !!((navigator.connection && navigator.connection.saveData) ||
    (mem && mem <= 4) || (cores && cores <= 2));
  if (lean) doc.documentElement.classList.add('lean');

  /* The stylesheet gates every reveal-y, rise-y hidden state on html.js, so
     that a visitor without script gets the finished page rather than a
     blank heading or a missing hairline. This line is that gate. It has to
     happen before the chrome is built, because the chrome is what carries
     the current-page state into the nav. */
  doc.documentElement.classList.add('js');

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
          '<path d="M0 92 C50 44 92 138 140 92 C176 56 190 122 200 90" fill="none" stroke="rgba(65,104,237,.16)" stroke-width="1"/>' +
          '<path d="M0 30 C46 -8 96 74 142 30 C178 -2 190 54 200 28" fill="none" stroke="rgba(65,104,237,.09)" stroke-width="1"/>' +
        '</pattern>' +
        '<pattern id="cur2" width="140" height="90" patternUnits="userSpaceOnUse">' +
          '<path d="M0 70 C36 34 68 104 104 70 C128 46 136 84 140 68" fill="none" stroke="rgba(65,104,237,.1)" stroke-width="1"/>' +
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
        '<g fill="none" stroke="rgba(65,104,237,.15)" stroke-width="1.3">'+
          '<circle cx="500" cy="500" r="450"/><circle cx="500" cy="500" r="408"/>' +
          '<circle cx="500" cy="500" r="368"/><circle cx="500" cy="500" r="330"/>' +
          '<circle cx="500" cy="500" r="294"/><circle cx="500" cy="500" r="260"/>' +
          '<circle cx="500" cy="500" r="228"/><circle cx="500" cy="500" r="198"/>' +
          '<circle cx="500" cy="500" r="170"/><circle cx="500" cy="500" r="144"/>' +
          '<circle cx="500" cy="500" r="120"/>' +
        '</g>' +
        '<circle cx="500" cy="500" r="428" fill="none" stroke="rgba(65,104,237,.2)" stroke-width="17" stroke-dasharray="2 32"/>' +
        '<circle cx="500" cy="500" r="88" fill="none" stroke="rgba(65,104,237,.14)" stroke-width="1.3" stroke-dasharray="5 9"/>' +
        '<g stroke="rgba(65,104,237,.22)" stroke-width="1.4">' +
          '<line x1="500" y1="52" x2="500" y2="924"/><line x1="52" y1="500" x2="924" y2="500"/>' +
        '</g>' +
        '<circle cx="500" cy="500" r="4" fill="rgba(234,245,255,.7)"/>' +
      '</symbol>' +
    '</svg>';

  function brand(href) {
    /* the square mark, not the wide wordmark — the wordmark is 720x220 and
       the nav box is square, so it squashed into an unreadable smear */
    return      '<a class="brand" href="' + href + '"><img src="signal-mark.svg" alt="" width="30" height="30" />' +
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
              '<a href="downloads.html#download">Download for Mac & Windows</a>' +
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

  /* ---------- section headings rise out of their own mask ----------
     theme.css animates a .rh span inside each .head h2 and .phero h1, and
     hides it until the surrounding .rv is revealed. Nothing in the markup
     creates that span, so this does — and only where a .rv ancestor exists,
     because .rv is what adds .in. Wrapping a heading whose reveal can never
     fire would park it permanently below its own overflow:hidden mask. */
  (function headRise() {
    var heads = doc.querySelectorAll('.head h2, .phero h1');
    [].forEach.call(heads, function (h) {
      if (h.querySelector('.rh') || !h.closest('.rv')) return;
      var wrap = doc.createElement('span');
      wrap.className = 'rh';
      while (h.firstChild) wrap.appendChild(h.firstChild);
      h.appendChild(wrap);
    });
  })();

  /* ---------- nav, scroll progress, scroll-linked hero depth ---------- */

  var nav = doc.getElementById('nav');
  var prog = doc.getElementById('prog');
  var hero = doc.querySelector('.hero');
  var heroArt = hero ? hero.querySelector('.art') : null;
  var heroCopy = hero ? hero.querySelector('.hero-grid>div:first-child') : null;
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
    measureSpy();
  }

  var spyLinks = [].slice.call(doc.querySelectorAll('#navlinks a[href^="#"]'));
  var spySections = spyLinks.map(function (a) { return doc.querySelector(a.getAttribute('href')); });
  var spyTops = [];

  /* Where each anchored section begins, in page coordinates, measured with
     the rest of the page metrics. The old version read a bounding rect per
     section inside the scroll handler, and a rect read is a forced layout:
     on a page this tall that was the most expensive thing the handler did,
     every frame, to answer a question whose answer only changes when the page
     does. Images, fonts and the grader report all move these numbers, which
     is exactly what measure() is already wired to notice. */
  function measureSpy() {
    var y = window.scrollY || 0;
    spyTops = spySections.map(function (s) {
      return s ? s.getBoundingClientRect().top + y : null;
    });
  }

  /* highlight the section you are actually in (only applies to # anchors) */
  function spy() {
    if (!spyLinks.length) return;
    var y = (window.scrollY || 0) + 150, cur = null;
    for (var n = 0; n < spyTops.length; n++) {
      if (spyTops[n] !== null && spyTops[n] <= y) cur = spySections[n];
    }
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
      /* Written straight onto the two elements rather than as a custom
         property on .hero. A --sy write invalidates style for the whole
         hero subtree — and the hero holds the rose, which is a couple of
         hundred SVG nodes — on every scroll frame. Two plain transforms
         touch two elements and nothing else. */
      var sy = Math.max(0, Math.min(1, y / (heroH || 1)));
      if (heroArt) heroArt.style.transform =
        'translate3d(0,' + (sy * 26).toFixed(2) + 'px,0) scale(' + (1 - sy * 0.04).toFixed(4) + ')';
      if (heroCopy) heroCopy.style.transform = 'translate3d(0,' + (sy * -16).toFixed(2) + 'px,0)';
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
    /* Eight on a lean machine rather than thirty-two: each star is an
       element with an infinite transform/opacity animation, which is a
       compositor layer per star. Thirty-two of them are only justifiable
       when the machine has not asked us not to. */
    var STAR_N = lean ? 8 : 32;
    for (var n = 0; n < STAR_N; n++) {
      var st = doc.createElement('i');
      st.className = 'st';
      var sz = (1 + rnd() * 1.7).toFixed(1);
      st.style.cssText = 'left:' + (rnd() * 100).toFixed(2) + '%;top:' + (rnd() * 100).toFixed(2) +        '%;width:' + sz + 'px;height:' + sz + 'px;animation-duration:' + (9 + rnd() * 9).toFixed(1) +
        's;animation-delay:-' + (rnd() * 18).toFixed(1) + 's';
      frag.appendChild(st);
    }
    sky.appendChild(frag);
    /* The meteors are the one part of the sky that is read as an event rather
       than as texture, so they are the first thing to go when the machine is
       short of room. */
    if (!lean) ['m1', 'm2', 'm3'].forEach(function (name) {
      var meteor = doc.createElement('i');
      meteor.className = 'meteor ' + name;
      meteor.setAttribute('aria-hidden', 'true');
      sky.appendChild(meteor);
    });
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
      [['0%', 'rgba(65,104,237,0)'], ['30%', 'rgba(65,104,237,.3)'], ['100%', '#3153d1']]
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

  /* ---------- reveals ----------
     .rv is the new vocabulary; .up is the legacy one, which the
     unrebuilt pages still use. Both are revealed, otherwise the
     legacy half of the site would sit at opacity 0 forever. */
  var items = doc.querySelectorAll('.rv, .up');
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
      /* The annual aftercare products are one-time payments, not yearly
         subscriptions, so the note states the amount actually charged rather
         than implying a bill that will arrive again next year. Per tier,
         because the figure differs by tier. */
      doc.querySelectorAll('.tier .annual-note').forEach(function (el) {
        el.textContent = annual ? (el.getAttribute('data-annual-note') || '') : '';
      });
      doc.querySelectorAll('.tier .btn[data-monthly]').forEach(function (el) {
        el.href = annual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
        var label = annual ? el.getAttribute('data-label-annual') : el.getAttribute('data-label-monthly');
        if (label) el.textContent = label;
      });
      if (heading) {
        heading.innerHTML = annual
          ? 'Aftercare, <span class="g">a year paid up front.</span>'
          : 'Aftercare that <span class="g">never sleeps.</span>';
      }
    });
  })();

  /* ---------- downloads: choose the least surprising installer ----------
     The static Apple Silicon link remains the safe no-JS fallback. When the
     browser exposes a platform hint, move the primary emphasis to the
     matching native installer without hiding any alternative or trusting a
     user-agent value for security decisions. */
  (function initDownloadChoice() {
    var rows = [].slice.call(doc.querySelectorAll('[data-os]'));
    if (!rows.length) return;
    var ua = String(navigator.userAgent || '').toLowerCase();
    var uaData = navigator.userAgentData || {};
    var platform = String(uaData.platform || navigator.platform || '').toLowerCase();
    var architecture = String(uaData.architecture || navigator.cpuClass || '').toLowerCase();
    var key = '';
    if (/win/.test(platform) || /windows/.test(ua)) key = 'win-x64';
    else if (/mac/.test(platform) || /macintosh|mac os/.test(ua)) key = /arm|apple silicon|aarch/.test(platform + ' ' + architecture + ' ' + ua) ? 'mac-arm64' : 'mac-x64';
    if (!key) return;
    var chosen = doc.querySelector('[data-os="' + key + '"]');
    if (!chosen) return;
    rows.forEach(function (row) {
      var active = row === chosen;
      row.classList.toggle('detected', active);
      row.classList.toggle('primary', active);
      row.removeAttribute('aria-current');
    });
    chosen.setAttribute('aria-current', 'true');
    var platformLabel = doc.getElementById('detected-platform');
    if (platformLabel) {
      platformLabel.hidden = false;
      platformLabel.textContent = key === 'win-x64' ? 'Detected: Windows x64' : key === 'mac-arm64' ? 'Detected: Apple Silicon' : 'Detected: Intel Mac';
    }
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
    /* Not built at all on a lean machine. This is the largest single thing
       the site allocates and the least necessary: the sky still carries the
       blooms, the currents, the watermark and the vignette, all of which are
       CSS and cost no scripted memory. Skipping it here means the budget
       below is never spent rather than being spent carefully. */
    if (lean) return;
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
      linkC.push('rgba(65,104,237,' + (((q + 1) / LNK_L) * .12).toFixed(3) + ')');
      linkB.push([]);
    }
    for (q = 0; q < NODE_L; q++) {
      nodeC.push('rgba(65,104,237,' + (.045 + ((q + 1) / NODE_L) * .1).toFixed(3) + ')');
      nodeB.push([]);
    }

    /* The backing store is the largest thing this page allocates, and it is
       held for as long as the tab is open: a full-screen canvas at a 2x
       device ratio is ~24 MB on a laptop display and over 100 MB on a 4K
       one. Nothing drawn on it is wider than a pixel and most of it is half
       transparent, so it does not need that. BUDGET caps the whole surface
       in device pixels and spends it on a ratio of at most 2, and never
       below 1, which keeps every stroke a real pixel wide. */
    var BUDGET = 2600000;
    function size() {
      W = sky.clientWidth || window.innerWidth;
      H = sky.clientHeight || window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var fit = Math.sqrt(BUDGET / Math.max(1, W * H));
      if (fit < dpr) dpr = Math.max(1, fit);
      var bw = Math.round(W * dpr), bh = Math.round(H * dpr);
      /* Assigning width or height clears the canvas, so only do it when the
         numbers actually moved — a resize that leaves the size alone should
         not blank the field for a frame. */
      if (bw !== cv.width || bh !== cv.height) {
        cv.width = bw;
        cv.height = bh;
      }
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
        var ax = px[pu.a], ay = py[pu.a], bx = px[pu.b], by = py[pu.b];          ctx.strokeStyle = 'rgba(65,104,237,.16)';
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        for (var k = 0; k < 4; k++) {
          var tt = pu.t - k * .05;
          if (tt < 0) break;
          ctx.fillStyle = 'rgba(65,104,237,' + (.55 - k * .12).toFixed(3) + ')';
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

    /* ---------- give the backing store back while nobody is looking ----------

       A canvas holds its memory for exactly as long as its width and height
       say so, and a tab in the background is the one state in which this page
       is guaranteed not to be read. The store is ~10 MB on a laptop screen and
       rather more on a 4K one, so after the tab has been out of sight long
       enough that it is clearly parked rather than just behind something —
       forty-five seconds — it is handed back by resizing the canvas to
       nothing, and rebuilt on return.

       Coming back re-seeds rather than restores, which is not a compromise:
       the field is already re-seeded on every resize, from Math.random(), so
       nobody has ever seen the same layout twice. The frame loop is left
       alone — the browser suspends requestAnimationFrame for a hidden tab, so
       the chain resumes on its own and the `raf` guard below is the same one
       the resize handler uses. */
    var idle = null, released = false;
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) {
        if (idle === null && !rm) idle = setTimeout(function () {
          idle = null;
          if (!doc.hidden) return;
          /* width alone is enough to drop the store, and the style width is
             untouched so the layout does not move by a pixel. */
          cv.width = 0; cv.height = 0;
          released = true;
        }, 45000);
        return;
      }
      if (idle !== null) { clearTimeout(idle); idle = null; }
      if (!released) return;
      released = false;
      size(); seed(); draw();
      if (!raf && !rm) {
        level = 0; LINK = 132; slow = 0; last = now();
        raf = requestAnimationFrame(frame);
      }
    });
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
    /* The footer is in here as well as the sections: it sits outside <main>
       and used to keep animating for the whole visit while it was thousands of
       pixels below the fold. It carries no animation of its own any more, so
       this is now belt and braces — but the next thing added down there will
       get parked along with everything else instead of quietly running on. */
    var secs = doc.querySelectorAll('main > section, footer');
    if (!secs.length) return;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.classList.toggle('offstage', !entries[i].isIntersecting);
      }
    }, { rootMargin: '280px 0px 280px 0px' });
    [].forEach.call(secs, function (s) { io.observe(s); });
  })();

  /* ---------- 7. legacy page behaviours ----------
     Two behaviours still live on the unrebuilt pages and used to come
     from terminal.js, which those pages no longer load. Both are ported
     here so nothing quietly stopped working:
       [data-reel]    — the Ghost Arb Bot screenshot reel (telegram.html)
       #win-waitlist  — the Windows waitlist form (downloads.html) */

  function pingEvent(path) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count({ path: path, title: path, event: true });
      }
    } catch (e) {}
  }

  (function reels() {
    var reels = doc.querySelectorAll('[data-reel]');
    if (!reels.length) return;
    [].forEach.call(reels, function (reel) {
      var slides = reel.querySelectorAll('figure');
      if (!slides.length) return;
      var count = reel.querySelector('[data-reel-count]');
      var prev = reel.querySelector('[data-reel-prev]');
      var next = reel.querySelector('[data-reel-next]');
      var i = 0;

      /* ---------- only the slide on screen holds a decoded picture ----------

         The reel fades between slides with opacity, which needs every figure
         present but does not need every figure decoded — and an <img> with a
         src is a decoded bitmap whether or not you can see it. Measured on
         telegram.html, six screenshots were 14.3 MB of decoded image data,
         12.1 MB of it for the five slides sitting at opacity 0.

         So each source is moved to data-reel-src and taken off the element
         entirely, except for the slide being shown. An <img> with no src has
         no bitmap to hold, and the bitmap is what costs: the file comes back
         out of the HTTP cache the moment the slide is actually looked at.

         Measured on telegram.html, holding one slide per reel instead of all
         three took the decoded total from 14.3 MB to 4.2 MB, and it came back
         to 4.2 MB after clicking all the way round — the bitmap is released
         when the slide is unloaded, not parked in case it is wanted again.
         A neighbour inside the browser's own lazy-loading margin may still be
         fetched while the markup is parsed, which is fine: what this fixes is
         what is held, and the fetch would have happened anyway. */
      var SRC = 'data-reel-src';
      [].forEach.call(slides, function (s) {
        var im = s.querySelector('img');
        if (im && im.getAttribute('src')) im.setAttribute(SRC, im.getAttribute('src'));
      });

      function show(n) {
        i = (n + slides.length) % slides.length;
        var want = slides[i].querySelector('img');
        var pending = (want && !want.getAttribute('src')) ? want.getAttribute(SRC) : '';
        if (pending) want.setAttribute('src', pending);

        function paint() {
          [].forEach.call(slides, function (s, idx) {
            s.classList.toggle('on', idx === i);
            var im = s.querySelector('img');
            if (!im) return;
            var src = im.getAttribute(SRC);
            if (idx === i) {
              if (src && !im.getAttribute('src')) im.setAttribute('src', src);
            } else if (im.getAttribute('src')) {
              im.removeAttribute('src');
            }
          });
        }

        /* Decode before the fade starts, so the swap never shows the panel
           through a half-decoded screenshot. decode() rejects on a miss, and
           the miss is still worth painting — an empty frame is a worse
           failure than a late one. */
        if (pending && want.decode) want.decode().then(paint, paint);
        else paint();

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
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
        startX = null;
      });

      /* a missing screenshot falls back to the placeholder the markup
         provides, rather than leaving an empty frame */
      [].forEach.call(reel.querySelectorAll('img'), function (img) {
        img.addEventListener('error', function () {
          /* No src means this is a slide we deliberately unloaded, not a
             broken screenshot. */
          if (!img.getAttribute('src')) return;
          img.hidden = true;
          var empty = img.parentElement.querySelector('.reel-empty');
          if (empty) empty.hidden = false;
        });
      });

      show(0);
    });
  })();

  /* ---------- 8. the free check → Studio handoff ----------

     Two behaviours, one funnel.

     (a) A download is the only outcome that matters on this site, and
         until now nothing counted one. GoatCounter sees a page view of
         /downloads; it cannot see whether anybody took the file. The
         DMG rows are the last click we own, so they are counted here,
         tagged with whether the visitor arrived from the free check.

     (b) When somebody does arrive from the check, the address they
         graded is in the query string (see grader.js). This puts it on
         the page, offers a copy button, and links back to the report.
         It is read from the URL rather than stored, so it works across
         devices and leaves nothing behind afterwards. */

  (function downloads() {
    var rows = doc.querySelectorAll('[data-rel-dl]');
    var fromCheck = /[?&]rebuild=/.test(location.search) && /[?&]utm_source=grader/.test(location.search);
    var kind = '';

    /* Hostnames only. Anything with a slash, a space, a quote or a
       scheme is not an address we put on the page — the parameter is
       visitor-supplied and the page reflects it back. */
    function hostOnly(raw) {
      var v = String(raw || '').trim();
      if (!v || v.length > 253) return '';
      if (!/^[a-z0-9.-]+(:\d+)?$/i.test(v)) return '';
      if (v.indexOf('.') === -1) return '';
      if (/(^|\.)\.|\.$/.test(v)) return '';
      return v;
    }

    if (fromCheck) {
      var params = new URLSearchParams(location.search);
      var host = hostOnly(params.get('rebuild'));
      var box = doc.getElementById('from-checker');
      var copy = doc.getElementById('fc-copy');
      var label = doc.getElementById('fc-copy-host');
      var head = doc.getElementById('fc-host');
      var back = doc.getElementById('fc-report');
      var skip = doc.getElementById('fc-dismiss');

      if (host && box) {
        if (head) head.textContent = host;
        if (label) label.textContent = host;
        if (copy) copy.setAttribute('data-host', host);
        if (back) back.setAttribute('href', 'index.html?check=' + encodeURIComponent(host) + '#check');
        box.hidden = false;
        kind = '-from-check';
        pingEvent('/event/check-to-downloads');

        /* The link carries #from-checker, so honour it — but only now,
           because a hidden element cannot be scrolled to, and jumping
           on arrival is exactly what the visitor asked for. */
        if (location.hash === '#from-checker' && box.scrollIntoView) {
          box.scrollIntoView({ block: 'center', behavior: rm ? 'auto' : 'smooth' });
        }

        /* Dismissed for the session only — no cookie, nothing stored
           beyond this tab, and a shared link still shows it to the
           next person. */
        if (skip) {
          skip.addEventListener('click', function () { box.hidden = true; });
        }

        if (copy) {
          copy.addEventListener('click', function () {
            var value = copy.getAttribute('data-host') || '';
            if (!value) return;
            function done(ok) {
              copy.textContent = ok ? 'Copied — paste it into Studio' : 'Select the address above';
              setTimeout(function () {
                copy.textContent = '';
                copy.appendChild(doc.createTextNode('Copy '));
                var b = doc.createElement('span');
                b.textContent = value;
                copy.appendChild(b);
              }, 2200);
            }
            function fallback() {
              var ta = doc.createElement('textarea');
              ta.value = value;
              ta.setAttribute('readonly', '');
              ta.style.cssText = 'position:fixed;left:-9999px;top:0';
              doc.body.appendChild(ta);
              ta.select();
              var ok = false;
              try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
              doc.body.removeChild(ta);
              done(ok);
            }
            pingEvent('/event/check-copy-address');
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(value).then(function () { done(true); }, fallback);
            } else fallback();
          });
        }
      }
    }

    /* The click that actually sends a file. Counted separately from the
       page view, because a page view is not a download and the whole
       point of the exercise is to tell those two apart. */
    [].forEach.call(rows, function (row) {
      row.addEventListener('click', function () {
        var arch = row.getAttribute('data-rel-dl') || 'unknown';
        pingEvent('/event/download/' + arch + kind);
      });
    });
  })();

  (function waitlist() {
    var form = doc.getElementById('win-waitlist');
    if (!form) return;
    var btn = form.querySelector('button[type=submit]');
    var status = form.querySelector('.status');
    var idle = btn ? btn.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn) { btn.disabled = true; btn.textContent = 'Joining…'; }
      if (status) { status.className = 'status'; status.textContent = '> sending…'; }
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        mode: 'cors'
      }).then(function (r) {
        if (!r.ok) throw new Error('bad');
        if (status) {
          status.className = 'status ok';
          status.textContent = "> you're on the list — one email when the Windows build is ready, nothing else.";
        }
        form.reset();
        pingEvent('/event/waitlist');
      }).catch(function () {
        if (status) {
          status.className = 'status err';
          status.textContent = '> something went wrong — email support@pallettai.org and we will pick it up';
        }
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = idle; }
      });
    });
  })();
})();

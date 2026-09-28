/* ============================================================
   PallettAi — motion & craft layer

   Paired with motion.css. Loaded after theme.js, and adds only
   things theme.js does not already do: an ambient grain/aurora
   layer, per-word display reveals, true cascading staggers across
   a grid, magnetic buttons, and a pointer-driven glare on cards.

   The same rule as everywhere else on this site applies — every
   effect here is decoration. With no script, with reduced motion
   preferred, or on a machine theme.js marked as lean, the page
   renders complete and static. Nothing below is allowed to be the
   reason a visitor cannot read the page or use the checker.
   ============================================================ */

(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* theme.js owns the .js gate, but this file must not depend on
     that having run: if theme.js is blocked or fails, the reveal
     states below would leave headings stuck at opacity 0. */
  root.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var lean = root.classList.contains('lean');

  /* Below this, "motion" means the page still appears, just without
     the moving parts. Reveals still have to be resolved. */
  var quiet = reduced || lean;

  function each(list, fn) {
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  function make(tag, cls) {
    var el = doc.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  /* ---------- ambient layers ---------- */

  /* A single fixed grain sheet. It is inserted once, behind content,
     and never touched again — no scroll listener, no repaint. */
  function grain() {
    if (quiet) return;
    var g = make('div', 'grain');
    g.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(g);
  }

  /* The aurora and the cursor light only belong behind a hero. If the
     page has no hero, neither is created, so the legal and changelog
     pages pay nothing for them. */
  function ambience() {
    var hero = doc.querySelector('.hero') || doc.querySelector('.machine-hero') || doc.querySelector('.phero');
    if (!hero) return;

    if (!quiet) {
      var a = make('div', 'aurora');
      a.setAttribute('aria-hidden', 'true');
      hero.appendChild(a);
    }

    if (quiet || !fine) return;

    /* One fixed-size element moved with transform only. Kept inside
       the hero so it scrolls away with it rather than floating over
       the whole document for the length of the visit. */
    var light = make('div', 'cursor-light');
    light.setAttribute('aria-hidden', 'true');
    hero.style.position = hero.style.position || 'relative';
    hero.appendChild(light);

    var x = 0, y = 0, cx = 0, cy = 0, raf = 0, on = false;

    function place() {
      cx += (x - cx) * .12;
      cy += (y - cy) * .12;
      light.style.opacity = on ? '1' : '0';
      light.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      /* Settle fully, then stop asking for frames. */
      if (Math.abs(x - cx) > .4 || Math.abs(y - cy) > .4 || on) {
        raf = requestAnimationFrame(place);
      } else {
        raf = 0;
      }
    }

    function kick() { if (!raf) raf = requestAnimationFrame(place); }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      on = true;
      kick();
    }, { passive: true });

    hero.addEventListener('pointerleave', function () { on = false; kick(); });
  }

  /* ---------- per-word display reveal ---------- */

  /* Only headings that are pure text are split. A heading holding a
     link or a button keeps its real children, because hiding those
     behind an aria-label would take them out of the tab order and
     out of the accessibility tree entirely. */
  var SPLIT = 'h2.big, .head h2, .page-hero h1, .closing h2, .band h2';

  /* Where the words go.

     theme.js runs first and wraps the contents of every .head h2 and
     .phero h1 in a .rh span, which theme.css animates as a single line
     rising out of a mask. That wrapper is not an obstacle to be avoided
     — it is the slot to be used. The word mask is strictly finer, so the
     split happens *inside* .rh and motion.css silences the line
     animation, rather than the two masks fighting over one heading.

     A .ln mask is different: the hero writes those into the markup by
     hand, one per line of a fixed three-line headline, and that reveal
     is the signature of the hero. It is left exactly as it is. */
  function splitTarget(el) {
    var rh = el.querySelector('.rh');
    if (rh) return rh;
    if (el.querySelector('.ln')) return null;
    return el;
  }

  function splittable(el) {
    /* A heading holding a link or button keeps its real children:
       hiding those behind an aria-label would take them out of the tab
       order and out of the accessibility tree. */
    if (el.querySelector('a, button, input, select, textarea')) return false;
    if (!splitTarget(el)) return false;
    if ((el.textContent || '').trim().length > 96) return false;
    return true;
  }

  function splitNode(node) {
    var kids = Array.prototype.slice.call(node.childNodes);
    each(kids, function (kid) {
      if (kid.nodeType === 3) {
        /* Keep the whitespace as real text nodes between the words,
           so the line still breaks exactly where it used to. */
        var parts = kid.nodeValue.split(/(\s+)/);
        var frag = doc.createDocumentFragment();
        each(parts, function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
          var wrap = make('span', 'w');
          var inner = make('i');
          inner.appendChild(doc.createTextNode(p));
          wrap.appendChild(inner);
          frag.appendChild(wrap);
        });
        node.replaceChild(frag, kid);
      } else if (kid.nodeType === 1 && kid.tagName !== 'BR') {
        /* Recurse so a <span class="grad"> keeps its colour and
           gradient while still animating word by word. */
        splitNode(kid);
      }
    });
  }

  function splitHeadings() {
    each(doc.querySelectorAll(SPLIT), function (el) {
      if (el.classList.contains('split')) return;
      if (!splittable(el)) return;

      /* The accessible name has to be built from a copy, not from the
         live element: textContent runs a <br> together with the word
         before it, so a two-line headline would be announced as one
         run-on word. Each break becomes a space first. */
      var flat = el.cloneNode(true);
      each(flat.querySelectorAll('br'), function (br) {
        br.parentNode.replaceChild(doc.createTextNode(' '), br);
      });
      var label = (flat.textContent || '').replace(/\s+/g, ' ').trim();
      if (!label) return;

      splitNode(splitTarget(el));
      el.classList.add('split');
      /* The visual words are decorative duplicates of the name the
         heading already had, so the name is stated once, up front. */
      el.setAttribute('aria-label', label);
      each(el.querySelectorAll('.w'), function (w) {
        w.setAttribute('aria-hidden', 'true');
      });
      each(el.querySelectorAll('.w'), function (w, i) { w.style.setProperty('--i', i); });
    });
  }

  /* ---------- reveal surfaces and staggers ---------- */

  /* Blocks that carry weight but were previously static on arrival.
     Each gets the same reveal the .rv elements already use, so the
     page now arrives as one piece rather than half-animated. */
  var REVEAL = '.band, .closing .wrap-l, .machine, .roi, .current, .win-wait, ' +
               '.studio-card, .console, .cmp-wrap, .concept-window';

  /* Grids whose children cascade. A .card with data-d already has a
     hand-set delay, so those are skipped and left exactly as tuned. */
  var GRIDS = '.cards, .grid2, .grid3, .steps, .stats, .tiles, .price-cards, ' +
              '.tiers, .cases, .feat-list, .req, .dl, .vs-grid, .rail, .faq, ' +
              '.rel-list, .concept-footer';

  function prepare() {
    each(doc.querySelectorAll(REVEAL), function (el) {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
    });

    each(doc.querySelectorAll(GRIDS), function (grid) {
      each(grid.children, function (child, i) {
        if (child.hasAttribute('data-d')) return;
        if (i > 11) return;
        child.style.setProperty('--i', i);
      });
    });
  }

  function showAll() {
    each(doc.querySelectorAll('[data-reveal], .split'), function (el) {
      el.classList.add('in');
    });
  }

  function observe() {
    var targets = doc.querySelectorAll('[data-reveal], .rv, .up, .split, .sec-split');

    /* No observer, or a visitor who asked for stillness: resolve
       everything now. This is the path that guarantees no heading is
       ever left invisible. */
    if (quiet || !('IntersectionObserver' in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      each(entries, function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    each(targets, function (el) { io.observe(el); });
  }

  /* ---------- pointer interaction ---------- */

  /* Buttons lean a few pixels towards the pointer. `translate` is used
     rather than `transform` because it composes with the transform
     theme.css already applies on hover, so the two never overwrite
     each other. The value is released with a spring. */
  function magnetic() {
    if (quiet || !fine) return;

    each(doc.querySelectorAll('.btn, .nav-links a.nav-cta'), function (btn) {
      if (btn.closest('footer')) return;

      var raf = 0;

      function move(e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transition = btn.style.transition || '';
        btn.style.transitionProperty = 'translate';
        btn.style.transitionDuration = '0s';
        btn.style.translate = (dx * 5).toFixed(2) + 'px ' + (dy * 3.5).toFixed(2) + 'px';
      }

      function reset() {
        /* Restore the stylesheet transition, then animate home. */
        btn.style.transitionProperty = '';
        btn.style.transitionDuration = '';
        btn.style.translate = '0px 0px';
      }

      btn.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; move(e); });
      }, { passive: true });

      btn.addEventListener('pointerleave', reset);
      btn.addEventListener('blur', reset);
    });
  }

  /* Cards tip towards the pointer and carry a highlight with them.
     `rotate` and `scale` are separate properties from `transform` for
     the same reason as above: the hover lift survives. */
  function tilt() {
    if (quiet || !fine) return;

    each(doc.querySelectorAll('.card, .tier, .case, .studio-card'), function (card) {
      var raf = 0;

      function move(e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        card.style.rotate = ((py - .5) * -3.2).toFixed(2) + 'deg ' + ((px - .5) * 3.6).toFixed(2) + 'deg';
        card.style.scale = '1.012';
      }

      function reset() {
        card.style.rotate = '0deg 0deg';
        card.style.scale = '1';
      }

      card.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; move(e); });
      }, { passive: true });

      card.addEventListener('pointerleave', reset);
    });
  }

  /* The same highlight coordinates for buttons, whose ::before in
     motion.css reads --mx/--my. Cheap enough to share one handler
     shape with the cards above, so it stays separate only because
     the effect is a wash rather than a tilt. */
  function buttonLight() {
    if (quiet || !fine) return;

    each(doc.querySelectorAll('.btn, .nav-links a.nav-cta'), function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
  }

  /* ---------- go ---------- */

  function start() {
    prepare();
    splitHeadings();
    observe();
    grain();
    ambience();
    magnetic();
    tilt();
    buttonLight();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

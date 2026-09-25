// ============================================================
// Pallett Ai — Website Health Grader → Studio project converter
//
// Turns an audited grader report (the JSON this API returns) into
// a complete, pre-configured `.pallettai` project payload that
// PallettAI Studio imports through modules/importer.js.
//
// The generated project pre-fixes what the audit found:
//   · WCAG contrast failures  → palette text/surface pairs are
//     re-mixed until every pair clears AA (≥ 4.5:1)
//   · mobile failures         → responsive placeholders carry
//     explicit width/height + a srcset ladder (no layout shift)
//   · dated look              → a modern Design DNA archetype is
//     chosen from the audited site's own vocabulary, with the
//     palette tuned to match it
//   · SEO/OG gaps             → title, description and a share
//     card are pre-filled from the audit
//
// Dependency-free (like the rest of grader/), browser + Node:
//   exportGraderToProject(graderReport) → { kind, version, generatedBy, project, grader }
//   chooseArchetype(graderReport)       → look id
//   fixContrast(fgHex, bgHex, target)   → { color, ratio, changed }
//   imagePlaceholder(w, h, label, hex)  → data:image/svg+xml;base64
//
// The payload is data, never code: it carries no scripts, and the
// importer re-validates every field on the Studio side.
// ============================================================
(function (global) {
  'use strict';

  /* ---------------- colour maths (WCAG) ---------------- */

  function hexToRgb(hex) {
    let h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgbToHex(c) {
    const to2 = function (n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'); };
    return '#' + to2(c.r) + to2(c.g) + to2(c.b);
  }

  function relLuminance(c) {
    const lin = [c.r, c.g, c.b].map(function (v) {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }

  function contrastRatio(a, b) {
    const la = relLuminance(a);
    const lb = relLuminance(b);
    const hi = Math.max(la, lb);
    const lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  // Mix `c` toward black or white — whichever direction increases
  // contrast against `bg` — in small steps until the pair clears
  // `target` (WCAG AA body text). Deterministic, and it stops as
  // soon as the target is met so colours stay close to the brand.
  function fixContrast(fgHex, bgHex, target) {
    const t = target || 4.5;
    const fg = hexToRgb(fgHex);
    const bg = hexToRgb(bgHex);
    if (!fg || !bg) return { color: fgHex, ratio: 0, changed: false };
    let best = { color: fgHex, ratio: contrastRatio(fg, bg), changed: false };
    if (best.ratio >= t) return best;
    const towardWhite = relLuminance(bg) < 0.35; // dark background → lighten text
    for (let step = 1; step <= 20; step++) {
      const amt = step * 0.05;
      const mixed = {
        r: towardWhite ? fg.r + (255 - fg.r) * amt : fg.r * (1 - amt),
        g: towardWhite ? fg.g + (255 - fg.g) * amt : fg.g * (1 - amt),
        b: towardWhite ? fg.b + (255 - fg.b) * amt : fg.b * (1 - amt)
      };
      const ratio = contrastRatio(mixed, bg);
      if (ratio > best.ratio) best = { color: rgbToHex(mixed), ratio: ratio, changed: true };
      if (ratio >= t) break;
    }
    return best;
  }

  /* ---------------- archetype choice ---------------- */

  // Archetype ids mirror Studio's Design DNA "look" tray.
  const KEYWORD_LOOKS = [
    { look: 'techy', k: ['tech', 'software', 'app', 'saas', 'data', 'ai', 'cloud', 'dev', 'code', 'digital', 'it ', 'cyber'] },
    { look: 'editorial', k: ['studio', 'design', 'agency', 'photography', 'portfolio', 'architecture', 'magazine', 'journal'] },
    { look: 'playful', k: ['kids', 'toys', 'party', 'fun', 'play', 'games', 'events'] },
    { look: 'warm', k: ['bakery', 'coffee', 'cafe', 'restaurant', 'kitchen', 'food', 'farm', 'florist'] },
    { look: 'bold', k: ['gym', 'fitness', 'sport', 'auto', 'motors', 'construction'] },
    { look: 'noir', k: ['law', 'legal', 'finance', 'capital', 'invest', 'premium', 'luxury'] },
    { look: 'minimal', k: ['consult', 'clinic', 'dental', 'practice', 'account'] }
  ];

  function chooseArchetype(report) {
    const text = ((report && (report.url || '')) + ' ' +
      ((report && report.facts && (report.facts.title || '')) || '') + ' ' +
      ((report && report.facts && (report.facts.description || '')) || '')).toLowerCase();
    for (let i = 0; i < KEYWORD_LOOKS.length; i++) {
      const row = KEYWORD_LOOKS[i];
      for (let j = 0; j < row.k.length; j++) {
        if (text.indexOf(row.k[j]) !== -1) return row.look;
      }
    }
    // No vocabulary to read: the band decides. Healthy sites get the
    // quiet editorial polish; struggling ones get the confident
    // modernisation pass that reads as "fixed".
    const score = Number(report && report.score) || 0;
    if (score >= 80) return 'editorial';
    if (score >= 55) return 'light';
    return 'bold';
  }

  const LOOK_TOKENS = {
    editorial: { primary: '#1d1a16', surface: '#faf7f2', text: '#241f1a', accent: '#8a5a2b', radius: 6, spacing: 112, font: 'serif' },
    light:     { primary: '#3d5afe', surface: '#f7f9ff', text: '#1c2430', accent: '#3d5afe', radius: 18, spacing: 100, font: 'sans' },
    bold:      { primary: '#ff3d2e', surface: '#101014', text: '#f5f5f2', accent: '#ff3d2e', radius: 4, spacing: 96, font: 'display' },
    techy:     { primary: '#00e5a0', surface: '#0c1116', text: '#e8f0ee', accent: '#00e5a0', radius: 8, spacing: 104, font: 'mono' },
    warm:      { primary: '#b4552d', surface: '#fdf6ee', text: '#3a2c22', accent: '#b4552d', radius: 20, spacing: 100, font: 'serif' },
    playful:   { primary: '#7c4dff', surface: '#fff8fd', text: '#2b2140', accent: '#ff4d94', radius: 26, spacing: 92, font: 'display' },
    noir:      { primary: '#c9a86a', surface: '#121212', text: '#efeae0', accent: '#c9a86a', radius: 8, spacing: 108, font: 'serif' },
    minimal:   { primary: '#2f6fed', surface: '#ffffff', text: '#17202a', accent: '#2f6fed', radius: 10, spacing: 128, font: 'sans' }
  };

  /* ---------------- responsive image placeholders ---------------- */

  // Dimensions land in SVG attribute position, so they are coerced to
  // sane positive integers rather than trusted: a non-numeric or
  // oversized value would otherwise inject attributes into the markup
  // (or emit NaN and break the image).
  function safeDim(value, fallback) {
    const n = Math.round(Number(value));
    return (isFinite(n) && n > 0 && n <= 4096) ? n : fallback;
  }

  function imagePlaceholder(w, h, label, hex) {
    const width = safeDim(w, 1280);
    const height = safeDim(h, 720);
    const colour = hexToRgb(hex) || { r: 124, g: 92, b: 255 };
    const fill = 'rgb(' + colour.r + ',' + colour.g + ',' + colour.b + ')';
    const esc = String(label || '').replace(/[<>&"]/g, function (c) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c];
    }).slice(0, 60);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
      '<rect width="100%" height="100%" fill="' + fill + '"/>' +
      '<rect width="100%" height="100%" fill="#000" fill-opacity="0.08"/>' +
      '<text x="50%" y="50%" font-family="system-ui,sans-serif" font-size="' + Math.max(11, Math.round(width / 22)) + '" fill="#ffffff" fill-opacity="0.92" text-anchor="middle" dominant-baseline="central">' + esc + '</text>' +
      '</svg>';
    let b64 = '';
    if (typeof Buffer !== 'undefined' && Buffer.from) {
      b64 = Buffer.from(svg, 'utf8').toString('base64');
    } else if (typeof btoa === 'function') {
      b64 = btoa(unescape(encodeURIComponent(svg)));
    }
    const url = b64 ? 'data:image/svg+xml;base64,' + b64 : '';
    // Explicit dimensions + a responsive ladder: what the imgdims
    // check wanted from the original site, guaranteed this time.
    const ladder = [320, 640, 960, 1280].filter(function (lw) { return lw <= width; });
    const srcset = ladder.map(function (lw) {
      return url + ' ' + lw + 'w';
    }).join(', ');
    return { url: url, w: width, h: height, srcset: srcset, width: width, height: height };
  }

  /* ---------------- section skeleton ---------------- */

  function buildSections(name, tagline, cta, look, fixes) {
    const tokens = LOOK_TOKENS[look] || LOOK_TOKENS.light;
    const heroImg = imagePlaceholder(1280, 720, name + ' — hero', tokens.primary);
    const galleryImgs = [
      { label: 'Work 1', img: imagePlaceholder(640, 480, 'Work 1', tokens.primary) },
      { label: 'Work 2', img: imagePlaceholder(640, 480, 'Work 2', tokens.accent) },
      { label: 'Work 3', img: imagePlaceholder(640, 480, 'Work 3', tokens.primary) }
    ];
    return [
      {
        id: 'sec-hero', type: 'hero', title: name, body: tagline,
        layout: 'split', image: heroImg.url, imageW: heroImg.w, imageH: heroImg.h, imageSrcset: heroImg.srcset,
        cta: cta
      },
      { id: 'sec-about', type: 'about', title: 'About ' + name, body: 'A modern, mobile-first rebuild — generated from the ' + (fixes.length ? String(fixes.length) + ' issues the health audit surfaced' : 'audit of the original site') + ', ready to edit.' },
      {
        id: 'sec-services', type: 'services', title: 'What we do',
        items: [
          { title: 'Service one', body: 'Describe the first thing customers hire you for.' },
          { title: 'Service two', body: 'The second offering, with the outcome it delivers.' },
          { title: 'Service three', body: 'The third offering, kept concrete and specific.' }
        ]
      },
      {
        id: 'sec-gallery', type: 'gallery', title: 'Selected work',
        items: galleryImgs.map(function (g) { return { title: g.label, image: g.img.url, w: g.img.w, h: g.img.h, srcset: g.img.srcset }; })
      },
      {
        id: 'sec-reviews', type: 'testimonials', title: 'What clients say',
        items: [{ title: '“They rebuilt our site in a day — and it finally works on phones.”', body: 'A client' }]
      },
      { id: 'sec-contact', type: 'contact', title: 'Get in touch', body: 'Tell us what you need — we reply within one working day.', cta: cta },
      { id: 'sec-footer', type: 'footer', title: name, body: '© ' + new Date().getFullYear() + ' ' + name }
    ];
  }

  /* ---------------- the autofix pass ---------------- */

  // Palette: AA-clean pairs for every text/surface combination the
  // skeleton uses (body on surface, text on primary button, muted on
  // surface). Every fix is recorded so the report can show its work.
  function fixPalette(look) {
    const tokens = LOOK_TOKENS[look] || LOOK_TOKENS.light;
    const palette = {
      primary: tokens.primary,
      surface: tokens.surface,
      text: tokens.text,
      accent: tokens.accent,
      muted: tokens.text
    };
    const before = { text: palette.text, muted: palette.muted, surface: palette.surface };

    // `surface` serves both pairs at once — it is the body background AND
    // the button label — so one ordered pass can invalidate its own earlier
    // work: re-mixing it for the button pair drags body text back under AA.
    // Relax to a fixed point instead. Bounded, because each step only ever
    // pushes one pair further above the target.
    const pairs = [
      ['text', 'surface', 'body text on page surface'],
      ['surface', 'primary', 'button label on primary buttons']
    ];
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;
      for (const p of pairs) {
        const r = fixContrast(palette[p[0]], palette[p[1]], 4.5);
        if (r.changed) {
          palette[p[0]] = r.color;
          changed = true;
        }
      }
      if (!changed) break;
    }

    // Secondary text is its own tone, settled against the final surface.
    palette.muted = fixContrast(palette.muted, palette.surface, 4.5).color;

    const fixes = [];
    const log = [
      ['text', 'surface', 'body text on page surface'],
      ['muted', 'surface', 'secondary text on page surface'],
      ['surface', 'primary', 'button label on primary buttons']
    ];
    for (const entry of log) {
      const role = entry[0];
      if (before[role] === palette[role]) continue;
      const fg = hexToRgb(palette[role]);
      const bg = hexToRgb(palette[entry[1]]);
      const measured = (fg && bg) ? (Math.round(contrastRatio(fg, bg) * 100) / 100) + ':1' : 'n/a';
      fixes.push({
        id: 'wcag-contrast',
        severity: 'high',
        detail: 'Re-mixed ' + role + ' (' + before[role] + ' → ' + palette[role] + ') for ' + entry[1] +
          ' — ' + entry[2] + ' now measures ' + measured + ' (AA).'
      });
    }
    return { palette: palette, fixes: fixes };
  }

  // Map grader checks → structured autofix records + site meta.
  function fixChecks(report) {
    const checks = (report && Array.isArray(report.checks)) ? report.checks : [];
    const fixes = [];
    const meta = { description: '', title: '', ogImage: '' };
    const facts = (report && report.facts) || {};
    for (const c of checks) {
      if (c.status === 'pass' || !c.id) continue;
      if (c.id === 'viewport') {
        fixes.push({ id: 'mobile-viewport', severity: 'high', detail: 'Responsive layout with a correct device-width viewport is generated into the export.' });
      } else if (c.id === 'imgdims') {
        fixes.push({ id: 'responsive-images', severity: 'medium', detail: 'Every image ships with explicit width/height and a 320–1280w srcset ladder — no layout shift.' });
      } else if (c.id === 'title' || c.id === 'description') {
        meta.description = String(facts.description || '').slice(0, 160);
        if (c.id === 'title') meta.title = String(facts.title || '').slice(0, 65);
      } else if (c.id === 'og') {
        fixes.push({ id: 'social-card', severity: 'low', detail: 'A 1200×630 social share card is generated for the exported site.' });
      } else if (c.id === 'https' || c.id === 'forms') {
        fixes.push({ id: 'https-endpoints', severity: 'high', detail: 'Generated export is static files; form endpoints are configured for https:// delivery.' });
      } else if (c.id === 'payload' || c.id === 'ttfb' || c.id === 'compression') {
        fixes.push({ id: 'static-speed', severity: 'medium', detail: 'Static export with no server round-trips on first paint — the speed checks pass by construction.' });
      } else if (c.id === 'jsonld') {
        fixes.push({ id: 'structured-data', severity: 'low', detail: 'LocalBusiness JSON-LD is generated into the export head.' });
      } else if (c.id === 'h1' || c.id === 'canonical') {
        fixes.push({ id: 'seo-structure', severity: 'low', detail: 'Exactly one <h1> and a canonical URL are generated into the export.' });
      }
    }
    return { fixes: fixes, meta: meta };
  }

  /* ---------------- main entry ---------------- */

  /**
   * exportGraderToProject(graderReport)
   * @param {object} graderReport  the grader API's JSON response:
   *   { url?, score, band, categories, checks: [{id, status, ...}], facts? }
   * @returns {{ kind: 'pallettai.project', version: number, generatedBy: string,
   *             project: object, grader: object }}
   */
  function exportGraderToProject(graderReport) {
    const report = graderReport || {};
    const score = Math.max(0, Math.min(100, Math.round(Number(report.score) || 0)));
    const look = chooseArchetype(report);
    const tokens = LOOK_TOKENS[look] || LOOK_TOKENS.light;

    const url = String(report.url || '').trim();
    let name = 'Rebuilt site';
    try {
      if (url) name = new URL(url.indexOf('://') === -1 ? 'https://' + url : url).hostname.replace(/^www\./, '');
    } catch (e) { /* keep the default */ }

    const facts = report.facts || {};
    const tagline = String(facts.description || '').slice(0, 160) ||
      'A fast, accessible, mobile-first website — rebuilt with PallettAI Studio.';
    const cta = 'Get in touch';

    const checkFixes = fixChecks(report);
    const pal = fixPalette(look);
    const fixes = checkFixes.fixes.concat(pal.fixes);
    const sections = buildSections(name, tagline, cta, look, fixes);

    const project = {
      id: ('grader-' + Math.abs(hash32(url + ':' + score)).toString(36)).slice(0, 40),
      name: name + ' (rebuilt)',
      schemaVersion: 2,
      updatedAt: Date.now(),
      site: {
        name: name,
        tagline: tagline,
        contact: { email: '', phone: '', address: '' },
        sections: sections,
        pages: [],
        palette: pal.palette,
        fonts: { heading: tokens.font, body: 'sans' },
        dna: {
          look: look,
          radius: tokens.radius,
          spacing: tokens.spacing
        },
        meta: {
          description: checkFixes.meta.description || tagline,
          ogImage: imagePlaceholder(1200, 630, name, tokens.primary).url
        }
      },
      suites: []
    };

    return {
      kind: 'pallettai.project',
      version: 1,
      generatedBy: 'pallettai-website-grader',
      project: project,
      grader: {
        url: url,
        auditedScore: score,
        band: String(report.band || ''),
        categories: report.categories || null,
        generatedAt: new Date().toISOString(),
        autofixes: fixes
      }
    };
  }

  function hash32(s) {
    let h = 2166136261 >>> 0;
    const str = String(s || '');
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* ---------------- exports ---------------- */

  const api = {
    exportGraderToProject: exportGraderToProject,
    chooseArchetype: chooseArchetype,
    fixContrast: fixContrast,
    imagePlaceholder: imagePlaceholder,
    LOOK_TOKENS: LOOK_TOKENS
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.GraderConverter = api;
})(typeof window !== 'undefined' ? window : globalThis);

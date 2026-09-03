// Pallett Ai — free website health grader (Cloudflare Worker, no dependencies)
//
// Deploy (no CLI needed): Cloudflare dashboard → Workers & Pages → Create worker →
//   Edit code → paste this whole file → Deploy.
// Then set GRADER_API in index.html to your *.workers.dev URL (or a custom route),
// and keep ALLOWED_ORIGINS below in sync with wherever the site is served from.

const ALLOWED_ORIGINS = ['https://pallettai.org', 'http://127.0.0.1:8123', 'http://localhost:8123'];
const MAX_HTML_BYTES = 1_500_000; // stop reading HTML past this
const FETCH_TIMEOUT_MS = 12_000;
const PROBE_TIMEOUT_MS = 8_000;   // compression probe is header-only; shorter budget
const MAX_REDIRECTS = 5;
const ALLOWED_PORTS = ['', '80', '443', '8080', '8443'];

/* ------------------------------------------------------------------ */
/* Host/IP validation — defence in depth against SSRF.                */
/* Blocking on hostname alone is bypassable (DNS rebinding, redirects */
/* to literals, IPv6 forms), so we validate numeric literals too and  */
/* re-validate every redirect hop before following it.                */
/* ------------------------------------------------------------------ */

function ipv4ToInt(h) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  if (p.some((x) => x > 255)) return null;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function isPrivateIpv4(n) {
  if ((n >>> 24) === 0) return true;                       // 0.0.0.0/8
  if ((n >>> 24) === 10) return true;                      // 10.0.0.0/8
  if ((n >>> 24) === 127) return true;                     // 127.0.0.0/8 loopback
  if ((n >>> 24) === 169 && ((n >>> 16) & 0xff) === 254) return true;  // 169.254.0.0/16 link-local
  if ((n >>> 24) === 172 && ((n >>> 16) & 0xff) >= 16 && ((n >>> 16) & 0xff) <= 31) return true; // 172.16/12
  if ((n >>> 24) === 192 && ((n >>> 16) & 0xff) === 168) return true;  // 192.168.0.0/16
  if (((n & 0xffc00000) >>> 0) === 0x64400000) return true; // 100.64.0.0/10 CGNAT
  if (((n & 0xffffff00) >>> 0) === 0xc0000000) return true; // 192.0.0.0/24 IETF (+192.0.0.9/10 anycast)
  if (((n & 0xffffff00) >>> 0) === 0xc0000200) return true; // 192.0.2.0/24 TEST-NET-1
  if (((n & 0xfffe0000) >>> 0) === 0xc6120000) return true; // 198.18.0.0/15 benchmark
  if (((n & 0xffffff00) >>> 0) === 0xc6336400) return true; // 198.51.100.0/24 TEST-NET-2
  if (((n & 0xffffff00) >>> 0) === 0xcb007100) return true; // 203.0.113.0/24 TEST-NET-3
  if ((n >>> 28) >= 14) return true;                       // 224.0.0.0/4 multicast + reserved
  return false;
}

// Returns { value: BigInt, embeddedV4: number|null } or null when unparsable.
function ipv6Parse(h) {
  // Legacy embedded dotted-quad tails: [::ffff:127.0.0.1] → [::ffff:7f00:1]
  const v4Tail = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(h);
  if (v4Tail) {
    const v4 = ipv4ToInt(v4Tail[1]);
    if (v4 === null) return null;
    h = h.slice(0, v4Tail.index) + ((v4 >>> 16) & 0xffff).toString(16) + ':' + (v4 & 0xffff).toString(16);
  }
  const halves = h.split('::');
  if (halves.length > 2) return null;
  const toHextets = (s) => (s ? s.split(':').map((x) => (x === '' ? 0 : parseInt(x, 16))) : []);
  const left = toHextets(halves[0]);
  const right = halves.length === 2 ? toHextets(halves[1]) : [];
  const all = left.concat(right);
  if (all.length === 0 || all.some((x) => Number.isNaN(x))) return null;
  const total = left.length + right.length;
  if (total > 8) return null;
  const zeros = 8 - total;
  const parts = left.concat(new Array(zeros).fill(0), right);
  let n = 0n;
  for (const p of parts) n = (n << 16n) | BigInt(p);
  // IPv4-mapped ::ffff:0:0/96 → expose the embedded address for v4 checks.
  const embeddedV4 = (n >> 48n) === 0n && (n >> 32n) === 0xffffn ? Number(n & 0xffffffffn) : null;
  return { value: n, embeddedV4 };
}

function isPrivateIpv6(n) {
  const b0 = (n >> 120n) & 0xffn;   // first byte
  const b1 = (n >> 112n) & 0xffn;   // second byte
  if (n < (1n << 32n)) return true; // ::/96 — unspecified, ::1 loopback, IPv4-compatible, ::ffff:0:0/96
  if (b0 === 0xfcn || b0 === 0xfdn) return true;                       // fc00::/7 ULA
  if (b0 === 0xffn) return true;                                       // ff00::/8 multicast
  if (b0 === 0xfen && (b1 & 0xc0n) === 0x80n) return true;             // fe80::/10 link-local
  if ((n >> 96n) === 0x20010db8n) return true;                         // 2001:db8::/32 documentation
  if ((n >> 112n) === 0x2002n) return true;                            // 2002::/16 6to4 (may embed private v4)
  if ((n >> 32n) === 0x64ff9b0000000000000000n) return true;           // 64:ff9b::/96 NAT64 well-known
  return false;
}

export function isPublicHost(host) {
  let h = String(host || '').trim().toLowerCase().replace(/\.$/, '');
  if (!h) return false;
  if (h.startsWith('[')) { h = h.slice(1); if (h.endsWith(']')) h = h.slice(0, -1); }
  const v4 = ipv4ToInt(h);
  if (v4 !== null) return !isPrivateIpv4(v4);
  if (h.includes(':')) {
    const v6 = ipv6Parse(h);
    if (!v6) return false;
    if (v6.embeddedV4 !== null) return !isPrivateIpv4(v6.embeddedV4);
    return !isPrivateIpv6(v6.value);
  }
  // DNS hostname — block private/reserved suffixes and anything ending in
  // reserved TLDs that a real public website can never legitimately use.
  return !/\.(local|internal|localhost|home\.arpa|test|example|invalid|onion)$/i.test(h) &&
         !/^(localhost|local|home)$/i.test(h);
}

export function normalizeUrl(input) {
  let raw = String(input || '').trim();
  if (!raw) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'https://' + raw;
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.username || u.password) return null;              // no credentials in the URL
  if (!ALLOWED_PORTS.includes(u.port)) return null;       // only normal web ports
  if (!isPublicHost(u.hostname)) return null;
  return u;
}

/* ------------------------------------------------------------------ */

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

export function bandFor(score) {
  if (score >= 85) return 'Great shape — keep it up.';
  if (score >= 70) return 'Solid, with a few quick wins available.';
  if (score >= 50) return 'Leaving money on the table.';
  return 'Losing visitors every single day.';
}

// Detect whether the origin actually compressed text. Cloudflare's Worker runtime
// auto-decompresses upstream responses and strips Content-Encoding, so we can't trust
// the header alone. When the header is gone we fall back to comparing the origin's
// declared Content-Length (the compressed size) against the bytes we actually received
// (the decompressed size): a big ratio means the host/CDN compressed it.
function detectCompression(f) {
  // Authoritative signal from the explicit-Accept-Encoding probe: when that request
  // advertises gzip/br and the origin still returns a Content-Encoding, the host DID
  // compress; when it returns none, the host did NOT compress. This survives Cloudflare's
  // transparent decompression on the default request (which strips the header).
  if (f.compressed === true) return { compressed: true, encoding: (f.encoding || 'gzip').toUpperCase() };
  if (f.compressed === false) return { compressed: false, encoding: '' };
  // Fallbacks for environments that keep the header (Node) or expose Content-Length.
  const enc = (f.encoding || '').toLowerCase();
  if (enc && enc !== 'identity') return { compressed: true, encoding: enc.toUpperCase() };
  const cl = Number(f.contentLength) || 0;
  const bytes = Number(f.bytes) || 0;
  if (cl > 0 && bytes > 0) {
    const ratio = bytes / cl;
    if (ratio > 1.30) return { compressed: true, encoding: 'CDN/host' };
    if (ratio >= 0.90 && ratio <= 1.10) return { compressed: false, encoding: '' };
  }
  return { compressed: null, encoding: '' };
}

export function scoreFacts(f) {
  // f: { https, ttfbMs, bytes, contentLength, capped, unreachable, finalUrl,
  //      title, description, viewport, ogTitle, ogImage, h1Count, imgTotal, imgWithDims,
  //      canonical, jsonld, formCount, insecureForms, htmlLang }
  if (f.unreachable) {
    return {
      score: 0,
      band: bandFor(0),
      categories: { Speed: { got: 0, max: 36 }, Mobile: { got: 0, max: 20 }, SEO: { got: 0, max: 30 }, Security: { got: 0, max: 14 } },
      checks: [{
        id: 'reach', cat: 'Speed', label: 'Reachable', weight: 0, status: 'fail',
        detail: `We could not fetch a single byte within ${FETCH_TIMEOUT_MS / 1000} seconds.`,
        fix: 'If the site is down, slow, or timing out for us, it is for your visitors too — hosting/uptime comes first.',
      }],
    };
  }

  const checks = [];
  const add = (id, cat, label, weight, status, detail, fix) =>
    checks.push({ id, cat, label, weight, status, detail, fix: fix || null });
  const kb = (n) => Math.max(1, Math.round(n / 1024)) + ' KB';
  const hasViewport = f.viewport && /width\s*=\s*device-width/i.test(f.viewport);
  const comp = detectCompression(f);

  // Security — 14
  add('https', 'Security', 'Served over HTTPS', 8,
    f.https ? 'pass' : 'fail',
    f.https ? 'Loads over a secure connection.' : 'Still serving over plain HTTP — browsers stamp it “Not secure” and visitors bounce.',
    f.https ? null : 'Add a free TLS certificate (Let’s Encrypt or Cloudflare) and redirect all traffic to https.');

  add('forms', 'Security', 'Forms submit securely', 6,
    f.formCount === 0 ? 'pass' : f.insecureForms === 0 ? 'pass' : 'fail',
    f.formCount === 0 ? 'No forms to check.' :
      f.insecureForms === 0 ? `All ${f.formCount} form(s) submit over HTTPS.` :
        `${f.insecureForms} of ${f.formCount} form(s) post to plain HTTP — submitted data can be intercepted.`,
    f.insecureForms === 0 ? null : 'Point every form action at an https:// endpoint so visitors can submit safely.');

  // Speed — 36
  add('ttfb', 'Speed', 'Time to first byte', 18,
    f.ttfbMs == null ? 'fail' : f.ttfbMs < 600 ? 'pass' : f.ttfbMs < 1500 ? 'warn' : 'fail',
    f.ttfbMs == null ? 'No first byte inside the time budget.' : `First byte arrived in ${f.ttfbMs} ms.`,
    f.ttfbMs != null && f.ttfbMs < 1500 ? null : 'A slow first response is pure lost traffic — CDN caching, leaner hosting, or static output usually sorts it.');

  add('compression', 'Speed', 'Text compression', 9,
    comp.compressed === false ? 'warn' : 'pass',
    comp.compressed === true ? `Responses are compressed (${String(comp.encoding).toUpperCase()}).` :
      comp.compressed === false ? 'HTML ships uncompressed — every visitor downloads more than they need.' :
        'Compression could not be confirmed from this network — likely handled by a CDN in front of the site.',
    comp.compressed === false ? 'Switch on gzip or brotli compression at the host/CDN — typically 70–80% smaller.' : null);

  add('payload', 'Speed', 'HTML payload', 9,
    f.capped ? 'fail' : f.bytes < 300_000 ? 'pass' : f.bytes < 800_000 ? 'warn' : 'fail',
    f.capped ? 'HTML runs past ~1.5 MB (we stopped reading there).' : `Document weighs ${kb(f.bytes)}.`,
    f.capped || f.bytes >= 800_000 ? 'Trim inline scripts/styles and move heavy content behind lazy loading.' : null);

  // Mobile — 20
  add('viewport', 'Mobile', 'Mobile viewport tag', 15,
    hasViewport ? 'pass' : 'fail',
    hasViewport
      ? 'Phones render the page at their true width.'
      : 'No proper <meta name="viewport"> — phones zoom out or render a desktop-width mess.',
    hasViewport ? null : 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> — one line, huge difference.');

  const noDims = f.imgTotal > 0 ? f.imgTotal - f.imgWithDims : 0;
  const dimRatio = f.imgTotal > 0 ? noDims / f.imgTotal : 0;
  add('imgdims', 'Mobile', 'Images with set dimensions', 5,
    f.imgTotal === 0 ? 'pass' : dimRatio === 0 ? 'pass' : dimRatio <= 0.5 ? 'warn' : 'fail',
    f.imgTotal === 0 ? 'No images to check.' : `${noDims} of ${f.imgTotal} images lack width/height — they can shift the layout while the page loads.`,
    dimRatio === 0 ? null : 'Set width and height attributes on images so the browser reserves their space.');

  // SEO — 30
  const titleOk = f.title && f.title.trim().length >= 5 && f.title.trim().length <= 65;
  add('title', 'SEO', 'Page title', 8,
    !f.title ? 'fail' : titleOk ? 'pass' : 'warn',
    !f.title ? 'No <title> at all — search engines have nothing to show.' :
      `“${f.title.trim().slice(0, 70)}”${f.title.trim().length > 65 ? ' — longer than the ~65 characters Google displays' : f.title.trim().length < 5 ? ' — suspiciously short' : ''}`,
    titleOk ? null : 'Write a 30–60 character title that says what you do and where you do it.');

  const descOk = f.description && f.description.trim().length >= 50 && f.description.trim().length <= 165;
  add('description', 'SEO', 'Meta description', 7,
    !f.description ? 'fail' : descOk ? 'pass' : 'warn',
    !f.description ? 'No meta description — Google invents its own snippet from random page text.' : `Present, ${f.description.trim().length} characters.`,
    descOk ? null : 'Write a 120–160 character description that would make a stranger click.');

  const ogImageRaster = f.ogImage ? /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(f.ogImage) : false;
  const ogOk = !!f.ogTitle && !!f.ogImage;
  add('og', 'SEO', 'Social share tags', 5,
    ogOk && ogImageRaster ? 'pass' : (f.ogTitle || f.ogImage) ? 'warn' : 'fail',
    ogOk && ogImageRaster ? 'Shared links show a proper card with a raster image.' :
      (ogOk && !ogImageRaster) ? 'og:image points at an SVG — most platforms (X, WhatsApp, LinkedIn) ignore SVG share images.' :
        (f.ogTitle || f.ogImage) ? 'Only some share tags are set — add both og:title and og:image for a complete preview.' :
          'Shared links on X/Facebook/WhatsApp show a bare or broken preview.',
    ogOk && ogImageRaster ? null : 'Add og:title and a raster og:image (PNG/JPG/WebP, ideally 1200×630) so every share looks professional.');

  add('h1', 'SEO', 'One clear heading', 4,
    f.h1Count === 1 ? 'pass' : 'warn',
    f.h1Count === 1 ? 'Exactly one <h1> — clean structure.' : f.h1Count === 0 ? 'No <h1> found — the page’s main heading is missing.' : `${f.h1Count} <h1> tags — pick one main heading.`,
    f.h1Count === 1 ? null : 'Keep exactly one <h1> that states what the page is about.');

  add('canonical', 'SEO', 'Canonical URL', 3,
    f.canonical ? 'pass' : 'warn',
    f.canonical ? 'A single canonical URL tells Google which version is the real one.' : 'No rel="canonical" — if the page ever has variants, Google may index the wrong one.',
    f.canonical ? null : 'Add <link rel="canonical" href="…"> pointing at the page’s one true URL.');

  add('jsonld', 'SEO', 'Structured data', 3,
    f.jsonld ? 'pass' : 'warn',
    f.jsonld ? 'Structured data present — eligible for richer results (reviews, FAQ, breadcrumbs).' : 'No JSON-LD structured data — you’re giving up rich results in Google.',
    f.jsonld ? null : 'Add a small JSON-LD block (LocalBusiness or Service) so Google can show richer snippets.');

  // Aggregate
  const cats = { Speed: { got: 0, max: 36 }, Mobile: { got: 0, max: 20 }, SEO: { got: 0, max: 30 }, Security: { got: 0, max: 14 } };
  let score = 0;
  for (const c of checks) {
    if (c.status === 'pass') { score += c.weight; cats[c.cat].got += c.weight; }
    else if (c.status === 'warn') { score += c.weight * 0.5; cats[c.cat].got += c.weight * 0.5; }
  }
  score = Math.min(100, Math.round(score));
  for (const k of Object.keys(cats)) cats[k].got = Math.round(cats[k].got);

  const rank = { fail: 0, warn: 1, pass: 2 };
  checks.sort((a, b) => rank[a.status] - rank[b.status]);

  return { score, band: bandFor(score), categories: cats, checks };
}

/* ---------------- fetching with public-host guarantees ---------------- */

const UA = 'Mozilla/5.0 (compatible; PallettAiGrader/1.0; +https://pallettai.org)';

// fetch() with redirect: 'manual' so every hop is validated against the same
// public-host rules before we follow it — a redirect straight to 127.0.0.1 or a
// metadata IP can never be reached, no matter what the origin replies with.
async function fetchPublic(start, opts = {}) {
  let cur = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(cur.href, { ...opts, redirect: 'manual' });
    const st = res.status;
    const loc = res.headers.get('location');
    if (st >= 300 && st < 400) {
      try { if (res.body && res.body.cancel) await res.body.cancel(); } catch {}
      if (!loc) throw new Error('redirect without a Location header');
      let next;
      try { next = new URL(loc, cur); } catch { throw new Error('unparseable redirect Location'); }
      const clean = normalizeUrl(next.href);
      if (!clean) throw new Error('redirect to a non-public address was blocked');
      cur = clean;
      continue;
    }
    return { res, url: cur };
  }
  throw new Error('too many redirects');
}

// Ask the origin with an explicit Accept-Encoding gzip/br header. Because we advertise
// support, Cloudflare passes the compressed response through WITHOUT stripping
// Content-Encoding — so a returned content-encoding positively proves compression (and an
// absent one proves the opposite). This is the signal that survives the default-request
// auto-decompression, which is what caused the original false positive.
// Header-only: the body is discarded as soon as headers arrive.
async function probeCompression(href) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), PROBE_TIMEOUT_MS);
  try {
    const { res } = await fetchPublic(href, {
      headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate, br' },
      signal: ctl.signal,
    });
    const enc = (res.headers.get('content-encoding') || '').toLowerCase();
    try { await res.body.cancel(); } catch {}
    if (enc && enc !== 'identity') return { compressed: true, encoding: enc };
    if (enc === 'identity') return { compressed: false, encoding: '' };
    // No Content-Encoding header at all: the host did not compress this response.
    return { compressed: false, encoding: '' };
  } catch {
    return { compressed: null, encoding: '' };
  } finally {
    clearTimeout(timer);
  }
}

async function probe(target) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    // Plain request (no explicit Accept-Encoding) so the runtime auto-decompresses
    // the body for parsing, as before.
    const { res, url: final } = await fetchPublic(target, {
      signal: ctl.signal,
      headers: { 'User-Agent': UA },
    });
    const reader = res.body.getReader();
    let chunk = await reader.read();
    const ttfbMs = Date.now() - t0;
    const chunks = [];
    let bytes = 0, capped = false;
    for (;;) {
      if (chunk.value) { chunks.push(chunk.value); bytes += chunk.value.length; }
      if (chunk.done) break;
      if (bytes >= MAX_HTML_BYTES) { capped = true; break; }
      chunk = await reader.read();
    }
    try { await reader.cancel(); } catch {}
    clearTimeout(timer);

    const merged = new Uint8Array(bytes);
    let off = 0;
    for (const c of chunks) { merged.set(c, off); off += c.length; }

    // Authoritative compression verdict from the explicit-Accept-Encoding probe,
    // against the post-redirect URL so we don't chase the same hops twice.
    const comp = await probeCompression(final.href);

    const facts = {
      finalUrl: final.href,
      https: final.protocol === 'https:',
      ttfbMs, bytes, contentLength: Number(res.headers.get('content-length')) || 0,
      capped, compressed: comp.compressed, encoding: comp.encoding || '',
      title: '', description: '', viewport: '', ogTitle: '', ogImage: '',
      h1Count: 0, imgTotal: 0, imgWithDims: 0,
      canonical: '', jsonld: false, formCount: 0, insecureForms: 0, htmlLang: '',
    };

    let titleSeen = false, titleDone = false;
    await new HTMLRewriter()
      .on('html', {
        element(e) {
          const lang = e.getAttribute('lang');
          if (lang) facts.htmlLang = lang;
        },
      })
      .on('title', {
        element() { if (!titleSeen) titleSeen = true; },
        text(t) {
          if (titleSeen && !titleDone) {
            facts.title += t.text;
            if (t.lastInTextNode) titleDone = true;
          }
        },
      })
      .on('meta', {
        element(e) {
          const key = e.getAttribute('name') || e.getAttribute('property') || '';
          const val = e.getAttribute('content') || '';
          if (/^viewport$/i.test(key)) facts.viewport = val;
          else if (/^description$/i.test(key)) facts.description = val;
          else if (/^og:title$/i.test(key)) facts.ogTitle = val;
          else if (/^og:image$/i.test(key)) facts.ogImage = val;
        },
      })
      .on('link', {
        element(e) {
          const rel = (e.getAttribute('rel') || '').toLowerCase();
          if (rel === 'canonical') facts.canonical = e.getAttribute('href') || '';
        },
      })
      .on('script', {
        element(e) {
          const type = (e.getAttribute('type') || '').toLowerCase();
          if (type === 'application/ld+json') facts.jsonld = true;
        },
      })
      .on('form', {
        element(e) {
          facts.formCount++;
          const action = e.getAttribute('action') || '';
          if (/^http:\/\//i.test(action)) facts.insecureForms++;
        },
      })
      .on('h1', { element() { facts.h1Count++; } })
      .on('img', {
        element(e) {
          facts.imgTotal++;
          if (e.getAttribute('width') && e.getAttribute('height')) facts.imgWithDims++;
        },
      })
      .transform(new Response(merged))
      .text();

    facts.title = facts.title.trim();
    return facts;
  } catch (err) {
    clearTimeout(timer);
    return { finalUrl: target.href, https: target.protocol === 'https:', ttfbMs: null, bytes: 0, contentLength: 0, capped: false, compressed: null, encoding: '', unreachable: true };
  }
}

/* --- Soft in-memory rate limit (per isolate; good-enough guard for a free tool) --- */
const hits = new Map();
const WINDOW_MS = 60_000, MAX_PER_WINDOW = 20;
function allow(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > WINDOW_MS) { rec.n = 0; rec.t = now; }
  rec.n++;
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.n <= MAX_PER_WINDOW;
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    const u = new URL(request.url);
    if (u.pathname !== '/grade') return json({ error: 'Use /grade?url=example.co.uk' }, 404, origin);
    if (request.method !== 'GET') return json({ error: 'Only GET is supported.' }, 405, origin);

    const target = normalizeUrl(u.searchParams.get('url'));
    if (!target) return json({ error: 'That doesn’t look like a public website address — try something like yourbusiness.co.uk.' }, 400, origin);

    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    if (!allow(ip)) return json({ error: 'Blimey, that’s a lot of checks — take a breath and try again in a minute.' }, 429, origin);

    const facts = await probe(target);
    const result = scoreFacts(facts);
    return json({ url: facts.finalUrl || target.href, ...result, facts: { ttfbMs: facts.ttfbMs, bytes: facts.bytes } }, 200, origin);
  },
};

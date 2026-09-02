// Pallett Ai — free website health grader (Cloudflare Worker, no dependencies)
//
// Deploy (no CLI needed): Cloudflare dashboard → Workers & Pages → Create worker →
//   Edit code → paste this whole file → Deploy.
// Then set GRADER_API in index.html to your *.workers.dev URL (or a custom route),
// and keep ALLOWED_ORIGINS below in sync with wherever the site is served from.

const ALLOWED_ORIGINS = ['https://pallettai.org', 'http://127.0.0.1:8123', 'http://localhost:8123'];
const MAX_HTML_BYTES = 1_500_000; // stop reading HTML past this
const FETCH_TIMEOUT_MS = 12_000;

const PRIVATE_HOST_RE = /^(localhost|0\.0\.0\.0|\[::1\]|\[::\])$|^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\.|.*\.local$|.*\.internal$/i;

export function normalizeUrl(input) {
  let raw = String(input || '').trim();
  if (!raw) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'https://' + raw;
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (PRIVATE_HOST_RE.test(u.hostname)) return null;
  return u;
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
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

export function scoreFacts(f) {
  // f: { https, ttfbMs, compressed, encoding, bytes, capped, unreachable, finalUrl,
  //      title, description, viewport, ogTitle, ogImage, h1Count, imgTotal, imgWithDims }
  if (f.unreachable) {
    return {
      score: 0,
      band: bandFor(0),
      categories: { Speed: { got: 0, max: 40 }, Mobile: { got: 0, max: 20 }, SEO: { got: 0, max: 30 }, Security: { got: 0, max: 10 } },
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

  // Security — 10
  add('https', 'Security', 'Served over HTTPS', 10,
    f.https ? 'pass' : 'fail',
    f.https ? 'Loads over a secure connection.' : 'Still serving over plain HTTP — browsers stamp it “Not secure” and visitors bounce.',
    f.https ? null : 'Add a free TLS certificate (Let’s Encrypt or Cloudflare) and redirect all traffic to https.');

  // Speed — 40
  add('ttfb', 'Speed', 'Time to first byte', 20,
    f.ttfbMs == null ? 'fail' : f.ttfbMs < 600 ? 'pass' : f.ttfbMs < 1500 ? 'warn' : 'fail',
    f.ttfbMs == null ? 'No first byte inside the time budget.' : `First byte arrived in ${f.ttfbMs} ms.`,
    f.ttfbMs != null && f.ttfbMs < 1500 ? null : 'A slow first response is pure lost traffic — CDN caching, leaner hosting, or static output usually sorts it.');

  add('compression', 'Speed', 'Text compression', 10,
    f.compressed ? 'pass' : 'warn',
    f.compressed ? `Responses are compressed (${String(f.encoding).toUpperCase()}).` : 'HTML ships uncompressed — every visitor downloads more than they need.',
    f.compressed ? null : 'Switch on gzip or brotli compression at the host/CDN — typically 70–80% smaller.');

  add('payload', 'Speed', 'HTML payload', 10,
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
  add('title', 'SEO', 'Page title', 10,
    !f.title ? 'fail' : titleOk ? 'pass' : 'warn',
    !f.title ? 'No <title> at all — search engines have nothing to show.' :
      `“${f.title.trim().slice(0, 70)}”${f.title.trim().length > 65 ? ' — longer than the ~65 characters Google displays' : f.title.trim().length < 5 ? ' — suspiciously short' : ''}`,
    titleOk ? null : 'Write a 30–60 character title that says what you do and where you do it.');

  const descOk = f.description && f.description.trim().length >= 50 && f.description.trim().length <= 165;
  add('description', 'SEO', 'Meta description', 10,
    !f.description ? 'fail' : descOk ? 'pass' : 'warn',
    !f.description ? 'No meta description — Google invents its own snippet from random page text.' : `Present, ${f.description.trim().length} characters.`,
    descOk ? null : 'Write a 120–160 character description that would make a stranger click.');

  add('og', 'SEO', 'Social share tags', 5,
    f.ogTitle && f.ogImage ? 'pass' : (f.ogTitle || f.ogImage) ? 'warn' : 'fail',
    f.ogTitle && f.ogImage ? 'Links shared to socials show a proper card.' : 'Shared links on X/Facebook/WhatsApp show a bare or broken preview.',
    f.ogTitle && f.ogImage ? null : 'Add og:title and og:image meta tags — and use a PNG image, most platforms ignore SVG share images.');

  add('h1', 'SEO', 'One clear heading', 5,
    f.h1Count === 1 ? 'pass' : 'warn',
    f.h1Count === 1 ? 'Exactly one <h1> — clean structure.' : f.h1Count === 0 ? 'No <h1> found — the page’s main heading is missing.' : `${f.h1Count} <h1> tags — pick one main heading.`,
    f.h1Count === 1 ? null : 'Keep exactly one <h1> that states what the page is about.');

  // Aggregate
  const cats = { Speed: { got: 0, max: 0 }, Mobile: { got: 0, max: 0 }, SEO: { got: 0, max: 0 }, Security: { got: 0, max: 0 } };
  let score = 0;
  for (const c of checks) {
    cats[c.cat].max += c.weight;
    if (c.status === 'pass') { score += c.weight; cats[c.cat].got += c.weight; }
    else if (c.status === 'warn') { score += c.weight * 0.5; cats[c.cat].got += c.weight * 0.5; }
  }
  score = Math.round(score);
  for (const k of Object.keys(cats)) cats[k].got = Math.round(cats[k].got);

  const rank = { fail: 0, warn: 1, pass: 2 };
  checks.sort((a, b) => rank[a.status] - rank[b.status]);

  return { score, band: bandFor(score), categories: cats, checks };
}

// --- Workers-specific probe (HTMLRewriter) ---

async function probe(target) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(target.href, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PallettAiGrader/1.0; +https://pallettai.org)' },
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

    const facts = {
      finalUrl: res.url,
      https: new URL(res.url).protocol === 'https:',
      ttfbMs, bytes, capped, compressed: false, encoding: '',
      title: '', description: '', viewport: '', ogTitle: '', ogImage: '',
      h1Count: 0, imgTotal: 0, imgWithDims: 0,
    };
    const enc = (res.headers.get('content-encoding') || '').toLowerCase();
    if (enc && enc !== 'identity') { facts.compressed = true; facts.encoding = enc; }

    let titleSeen = false, titleDone = false;
    await new HTMLRewriter()
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
    return { finalUrl: target.href, https: target.protocol === 'https:', ttfbMs: null, bytes: 0, capped: false, compressed: false, encoding: '', unreachable: true };
  }
}

// --- Soft in-memory rate limit (per isolate; good-enough guard for a free tool) ---
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

    const target = normalizeUrl(u.searchParams.get('url'));
    if (!target) return json({ error: 'That doesn’t look like a public website address — try something like yourbusiness.co.uk.' }, 400, origin);

    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    if (!allow(ip)) return json({ error: 'Blimey, that’s a lot of checks — take a breath and try again in a minute.' }, 429, origin);

    const facts = await probe(target);
    const result = scoreFacts(facts);
    return json({ url: facts.finalUrl || target.href, ...result, facts: { ttfbMs: facts.ttfbMs, bytes: facts.bytes } }, 200, origin);
  },
};

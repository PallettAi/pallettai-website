// Pallett Ai — local dev harness for the website health grader.
// Mirrors grader/worker.js semantics on plain Node (regex parsing instead of HTMLRewriter)
// so you can try the on-site widget before deploying the Worker.
//
// Run:  node grader/server.mjs      → http://127.0.0.1:8787/grade?url=example.co.uk

import http from 'node:http';
import { normalizeUrl, scoreFacts } from './worker.js';

const PORT = 8787;
const ALLOWED_ORIGINS = ['https://pallettai.org', 'http://127.0.0.1:8123', 'http://localhost:8123'];
const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 12_000;

function corsHeaders(origin) {
  // dev harness: allow any localhost/127.0.0.1 origin (preview ports change per session),
  // plus the production site.
  let allow = origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? origin
    : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  };
}

function json(res, obj, status, origin) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) });
  res.end(JSON.stringify(obj));
}

async function probeCompression(href) {
  // Explicit Accept-Encoding gzip/br so any transparent auto-decompression leaves the
  // Content-Encoding header intact — a returned header positively proves compression.
  try {
    const res = await fetch(href, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PallettAiGrader/1.0; +https://pallettai.org)',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    const enc = (res.headers.get('content-encoding') || '').toLowerCase();
    try { await res.body.cancel(); } catch {}
    if (enc && enc !== 'identity') return { compressed: true, encoding: enc };
    return { compressed: enc === 'identity' ? false : false, encoding: '' };
  } catch {
    return { compressed: null, encoding: '' };
  }
}

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
    const parts = [];
    let bytes = 0, capped = false;
    for (;;) {
      if (chunk.value) { parts.push(Buffer.from(chunk.value)); bytes += chunk.value.length; }
      if (chunk.done) break;
      if (bytes >= MAX_HTML_BYTES) { capped = true; break; }
      chunk = await reader.read();
    }
    try { await reader.cancel(); } catch {}
    clearTimeout(timer);

    const html = Buffer.concat(parts).toString('utf8');
    const facts = {
      finalUrl: res.url,
      https: new URL(res.url).protocol === 'https:',
      ttfbMs, bytes, contentLength: Number(res.headers.get('content-length')) || 0,
      capped, compressed: false, encoding: '',
      title: '', description: '', viewport: '', ogTitle: '', ogImage: '',
      h1Count: 0, imgTotal: 0, imgWithDims: 0,
      canonical: '', jsonld: false, formCount: 0, insecureForms: 0, htmlLang: '',
    };
    // Authoritative verdict from the explicit-Accept-Encoding probe (survives Cloudflare).
    const comp = await probeCompression(target.href);
    facts.compressed = comp.compressed;
    if (comp.encoding) facts.encoding = comp.encoding;
    else if (!facts.encoding) facts.encoding = (res.headers.get('content-encoding') || '').toLowerCase();

    const langM = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i);
    if (langM) facts.htmlLang = langM[1];

    const tm = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (tm) facts.title = tm[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = m[0];
      const key = (tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
      const val = (tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
      if (/^viewport$/i.test(key)) facts.viewport = val;
      else if (/^description$/i.test(key)) facts.description = val;
      else if (/^og:title$/i.test(key)) facts.ogTitle = val;
      else if (/^og:image$/i.test(key)) facts.ogImage = val;
    }
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      if (/\brel\s*=\s*["']canonical["']/i.test(tag)) {
        const h = (tag.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1];
        if (h) facts.canonical = h;
      }
    }
    if (/application\/ld\+json/i.test(html)) facts.jsonld = true;
    facts.formCount = (html.match(/<form\b/gi) || []).length;
    facts.insecureForms = (html.match(/<form\b[^>]*\baction\s*=\s*["']http:\/\//gi) || []).length;
    facts.h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      facts.imgTotal++;
      if (/\bwidth\s*=\s*["']?\d/i.test(m[0]) && /\bheight\s*=\s*["']?\d/i.test(m[0])) facts.imgWithDims++;
    }
    return facts;
  } catch (err) {
    clearTimeout(timer);
    return { finalUrl: target.href, https: target.protocol === 'https:', ttfbMs: null, bytes: 0, contentLength: 0, capped: false, compressed: null, encoding: '', unreachable: true };
  }
}

const hits = new Map();
const WINDOW_MS = 60_000, MAX_PER_WINDOW = 20;
function allow(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > WINDOW_MS) { rec.n = 0; rec.t = now; }
  rec.n++;
  hits.set(ip, rec);
  return rec.n <= MAX_PER_WINDOW;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') { res.writeHead(204, corsHeaders(origin)); return res.end(); }
  const u = new URL(req.url, 'http://127.0.0.1');
  if (u.pathname !== '/grade') return json(res, { error: 'Use /grade?url=example.co.uk' }, 404, origin);

  const target = normalizeUrl(u.searchParams.get('url'));
  if (!target) return json(res, { error: 'That doesn’t look like a public website address — try something like yourbusiness.co.uk.' }, 400, origin);

  const ip = (req.socket.remoteAddress || 'anon').replace(/^::ffff:/, '');
  if (!allow(ip)) return json(res, { error: 'Too many checks — try again in a minute.' }, 429, origin);

  const facts = await probe(target);
  const result = scoreFacts(facts);
  json(res, { url: facts.finalUrl || target.href, ...result, facts: { ttfbMs: facts.ttfbMs, bytes: facts.bytes } }, 200, origin);
});

server.listen(PORT, '127.0.0.1', () => console.log(`grader dev harness on http://127.0.0.1:${PORT}/grade?url=example.co.uk`));

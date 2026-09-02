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
      ttfbMs, bytes, capped, compressed: false, encoding: '',
      title: '', description: '', viewport: '', ogTitle: '', ogImage: '',
      h1Count: 0, imgTotal: 0, imgWithDims: 0,
    };
    const enc = (res.headers.get('content-encoding') || '').toLowerCase();
    if (enc && enc !== 'identity') { facts.compressed = true; facts.encoding = enc; }

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
    facts.h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      facts.imgTotal++;
      if (/\bwidth\s*=\s*["']?\d/i.test(m[0]) && /\bheight\s*=\s*["']?\d/i.test(m[0])) facts.imgWithDims++;
    }
    return facts;
  } catch (err) {
    clearTimeout(timer);
    return { finalUrl: target.href, https: target.protocol === 'https:', ttfbMs: null, bytes: 0, capped: false, compressed: false, encoding: '', unreachable: true };
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

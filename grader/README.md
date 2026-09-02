# Website Health Grader — Pallett Ai's live showcase tool

A free "paste your URL, get a health score" tool embedded on pallettai.org.
It proves to visitors that we build and wire up real, working systems — and
every report ends with a "Let us fix it" call-to-action that pre-fills the
site's contact form.

## What it checks (score out of 100)

| Category | Weight | Checks |
|---|---|---|
| Speed | 36 | time-to-first-byte (18), compression (9), HTML payload size (9) |
| Mobile | 20 | `<meta viewport>` (15), images with width/height (5) |
| SEO | 30 | title (8), meta description (7), og:title + og:image (5), `<h1>` (4), canonical URL (3), JSON-LD structured data (3) |
| Security | 14 | served over HTTPS (8), form actions over HTTPS (6) |

**Compression note:** Cloudflare's Worker runtime auto-decompresses upstream
responses and strips `Content-Encoding` on a plain request, so reading that header
alone falsely flags every compressed site as "uncompressed". The checker therefore
makes a second request with an explicit `Accept-Encoding: gzip, deflate, br`. Because
it advertises support, Cloudflare passes the compressed response through without
stripping the header — so a returned `Content-Encoding` positively confirms compression,
and an absent one confirms the opposite. A `Content-Length`-vs-bytes fallback covers
the case where the probe itself fails, and it stays neutral (never a false alarm) when
truly impossible to tell.

Each check reports `pass` / `warn` (half credit) / `fail` (0), with a plain-English
detail and an "Our fix:" line for anything not passing. Finds are sorted worst-first.

## Files

- `worker.js` — the real backend: a dependency-free Cloudflare Worker.
  Pure scoring logic (`scoreFacts`, `normalizeUrl`, `bandFor`) is exported so
  the local harness can reuse it.
- `server.mjs` — local dev harness: same API contract on plain Node
  (regex parsing instead of HTMLRewriter). Runs on `http://127.0.0.1:8787`.
- Front-end widget lives inside `index.html` (`#grader` section + the second
  `<script>` block). It picks its API automatically:
  - on `127.0.0.1` / `localhost` → `http://127.0.0.1:8787` (the dev harness)
  - anywhere else → the `GRADER_API` constant at the top of that script block
    (**update this after deploying the Worker**).

## Run locally

```bash
node grader/server.mjs
# then open the site and use the widget, or:
curl "http://127.0.0.1:8787/grade?url=example.co.uk"
```

The server binds to `127.0.0.1` only — nothing is exposed to your network.
Logs: `.freebuff/grader-dev.log` / `.freebuff/grader-dev.log.err` when started detached.

## Deploy to production (Cloudflare, free tier)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → pick the "Hello world" starter → **Edit code**.
2. Paste the entire contents of `worker.js` → **Deploy**.
3. Note the `*.workers.dev` URL (or attach a custom route, e.g. `grader.pallettai.org`).
4. In `index.html`, set `GRADER_API` to that URL and keep `ALLOWED_ORIGINS` in
   `worker.js` in sync with the site's origin(s). Redeploy the Worker after any change.
5. Commit + push — GitHub Pages serves the front-end, Cloudflare serves the API.

## Built-in guards

- SSRF: private/loopback hostnames (`localhost`, `127.*`, `10.*`, `192.168.*`,
  `172.16–31.*`, `169.254.*`, `.local`, `.internal`) are rejected.
- 12-second fetch timeout; HTML parsing capped at ~1.5 MB.
- Soft rate limit: 20 checks per IP per minute.
- CORS restricted to the origins in `ALLOWED_ORIGINS`; GET only.

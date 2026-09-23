/* ============================================================
   PallettAi — release links
   Keeps pallettai.org/downloads pointed at the newest published
   build without a site commit for every release.

   Everything here is an enhancement. The page ships with working
   links that point at GitHub's unversioned `latest/download` alias,
   so the downloads are correct with no JavaScript at all — this
   script only ever upgrades them. If the API is unreachable,
   rate-limited, or blocked by the page's CSP, the shipped links stand
   exactly as they are.

   Nothing here is required for the page to be correct. It fills the
   version labels (which ship empty, so they can never read a stale
   version to a visitor without JavaScript) and swaps in the exact
   per-release asset URL. The script never invents a URL: it only ever
   copies a download URL that GitHub reports on a release, and only       when the release carries both Mac builds and a Windows installer, so
   the page can never end up mixed across two versions or advertise a missing
   Windows build.

   Loaded with defer and holds no inline script, so script-src
   'self' still applies.
   ============================================================ */

(function () {
  'use strict';

  var REPO = 'PallettAi/pallettai-website';
  var API = 'https://api.github.com/repos/' + REPO + '/releases?per_page=10';
  var CACHE_KEY = 'pal.releases.v1';
  var TTL = 6 * 60 * 60 * 1000;
  /* Never let a stale GitHub release API response downgrade the version the
     page already advertises. The static links remain usable while a newer
     release is being published. */
  var MIN_VERSION = '0.4.11';

  /* ---------- cache ----------
     The GitHub API allows 60 unauthenticated calls an hour per IP, and
     every visitor of the page would otherwise spend one. A short
     session cache keeps repeat views free in the same tab. */

  function readCache() {
    try {
      var raw = window.sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var hit = JSON.parse(raw);
      if (!hit || !hit.at || Date.now() - hit.at > TTL) return null;
      return hit.release || null;
    } catch (e) { return null; }
  }

  function writeCache(release) {
    try {
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), release: release }));
    } catch (e) { /* private mode or full quota — the fallback is fine */ }
  }

  /* ---------- reading a release ---------- */

  function assetInfo(assets, pattern) {
    for (var i = 0; i < assets.length; i++) {
      var a = assets[i];
      if (a && a.name && a.browser_download_url && pattern.test(a.name)) {
        return { url: a.browser_download_url, digest: typeof a.digest === 'string' ? a.digest : '' };
      }
    }
    return { url: '', digest: '' };
  }

  function firstAsset(assets, patterns) {
    for (var i = 0; i < patterns.length; i++) {
      var hit = assetInfo(assets, patterns[i]);
      if (hit.url) return hit;
    }
    return { url: '', digest: '' };
  }

  function normalise(rel) {
    var tag = rel.tag_name || '';
    var assets = rel.assets || [];
    /* Releases carry both a version-pinned name and a stable alias
       (PallettAI-Studio-mac-arm64.dmg). The pinned name is matched
       first because it is the one that always exists. */
    var arm = firstAsset(assets, [/-mac-arm64\.dmg$/, /(^|\/)PallettAI-Studio-mac-arm64\.dmg$/]);
    var intel = firstAsset(assets, [/-mac-x64\.dmg$/, /(^|\/)PallettAI-Studio-mac-x64\.dmg$/]);
    var win = firstAsset(assets, [/-setup\.exe$/, /PallettAI-Studio-setup\.exe$/]);
    return {
      tag: tag,
      version: tag.replace(/^v/, ''),
      macArm: arm.url, macArmDigest: arm.digest,
      macX64: intel.url, macX64Digest: intel.digest,
      winX64: win.url, winX64Digest: win.digest
    };
  }

  /* ---------- writing it into the page ---------- */

  function compareVersions(a, b) {
    var aa = String(a).split('.').map(Number), bb = String(b).split('.').map(Number);
    for (var i = 0; i < Math.max(aa.length, bb.length); i++) {
      var x = aa[i] || 0, y = bb[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  function setText(selector, value) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = value;
  }

  function setHref(selector, value) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) nodes[i].setAttribute('href', value);
  }

  function setDownloadLabels(version) {
    var nodes = document.querySelectorAll('[data-default-aria-label]');
    for (var i = 0; i < nodes.length; i++) {
      var label = nodes[i].getAttribute('data-default-aria-label') || '';
      nodes[i].setAttribute('aria-label', label.replace(/v[0-9]+(?:\.[0-9]+)*/i, 'v' + version));
    }
  }

  function apply(rel) {
    if (!rel || !rel.version) return;
    /* A version is only ever digits and dots. Anything else means the
       tag is not a release we understand, so leave the page alone. */
    if (!/^\d+(\.\d+)*$/.test(rel.version)) return;
    if (compareVersions(rel.version, MIN_VERSION) < 0) return;
    /* Both Mac builds and Windows or nothing — a half-updated page would
       show one version in the label and another in a download button. */
    if (!rel.macArm || !rel.macX64 || !rel.winX64) return;

    setText('[data-rel-version]', 'v' + rel.version);
    setText('[data-rel-version-plain]', rel.version);

    setHref('[data-rel-dl="mac-arm64"]', rel.macArm);
    setHref('[data-rel-dl="mac-x64"]', rel.macX64);
    setHref('[data-rel-dl="win-x64"]', rel.winX64);
    setDownloadLabels(rel.version);

    var hashes = { 'mac-arm64': rel.macArmDigest, 'mac-x64': rel.macX64Digest, 'win-x64': rel.winX64Digest };
    Object.keys(hashes).forEach(function (key) {
      var row = document.querySelector('[data-checksum-for="' + key + '"]');
      if (!row) return;
      var code = row.querySelector('[data-checksum]');
      if (!code) return;
      var digest = hashes[key] || '';
      code.textContent = digest ? digest.replace(/^sha256:/i, '') : 'Published release hash unavailable';
      code.setAttribute('data-hash-state', digest ? 'published' : 'unavailable');
    });

    /* A hook for anything that wants to know the resolved release. */
    document.documentElement.setAttribute('data-release', rel.version);
  }

  /* ---------- go ---------- */

  function latest(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] && !list[i].draft && !list[i].prerelease) return list[i];
    }
    return null;
  }

  function start() {
    var cached = readCache();
    if (cached) { apply(cached); return; }

    if (!window.fetch || !window.Promise) return;

    window.fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (list) {
        if (!list || !list.length) return;
        var rel = latest(list);
        if (!rel) return;
        var normalised = normalise(rel);
        writeCache(normalised);
        apply(normalised);
      })
      .catch(function () { /* offline or blocked — the shipped links stand */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

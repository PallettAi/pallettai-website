#!/usr/bin/env node
/* ============================================================
   node check-payments.js

   Two jobs, both about the same risk — that a Pay button on the
   live site does the wrong thing:

     1. Resolver test: loads payments.js against a stub DOM and
        proves what it does to a button when a product id IS set
        and when it ISN'T. The "isn't" case is the one worth
        pinning, because the failure it guards against is silent:
        theme.js sets el.href from data-monthly, and an empty
        data-monthly means href='' — the current page. That looks
        like a working button and charges nobody.

     2. Readiness report: cross-checks every data-pay key in the
        markup against the config, so a typo in either place is
        caught here rather than by a customer.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
let failed = 0;
function pass(msg) { console.log('  \u2713 ' + msg); }
function fail(msg) { failed++; console.error('  \u2717 ' + msg); }
function assert(cond, msg) { cond ? pass(msg) : fail(msg); }

/* ---------- a DOM just big enough for payments.js ---------- */

function makeEl(attrs) {
  const a = Object.assign({}, attrs);
  return {
    href: a.href || '',
    textContent: a.textContent || '',
    getAttribute: (k) => (Object.prototype.hasOwnProperty.call(a, k) ? a[k] : null),
    setAttribute: (k, v) => { a[k] = String(v); },
    removeAttribute: (k) => { delete a[k]; },
    _attrs: a
  };
}

/* payments.js is an IIFE over a hard-coded config, so the only honest way to
   test it with values filled in is to fill them in — rewriting the pairs in the
   real source before it runs. A test that passed overrides in from the outside
   would be testing a different object than the one the site uses.

   The match is on the key and whatever quoted value currently sits there, so an
   override works whether that entry is still '' or already carries a real id.
   (Matching only the empty form made this harness throw the moment the first
   product id was pasted in — which is the moment it starts mattering.) */
function withProducts(src, overrides) {
  Object.keys(overrides || {}).forEach(function (key) {
    /* Two shapes are staged: the PRODUCTS map (`key: 'value'`) and the
       top-level settings (`var KEY = 'value'`). The portal business id is the
       second shape, and missing it is what let the portal's unconfigured
       branch stop being tested the moment a real business id went in — the
       same way the product map did, one shape further out. */
    const re = new RegExp('(\\b' + key + '\\s*[:=]\\s*)\'[^\']*\'');
    if (!re.test(src)) throw new Error('no config entry for ' + key);
    src = src.replace(re, '$1\'' + overrides[key] + '\'');
  });
  return src;
}

function loadPayments(els, overrides) {
  const src = withProducts(fs.readFileSync(path.join(DIR, 'payments.js'), 'utf8'), overrides);
  const selectors = {};
  const doc = {
    readyState: 'complete',
    documentElement: { setAttribute: () => {} },
    addEventListener: () => {},
    querySelectorAll: (sel) => (selectors[sel] || [])
  };
  const sandbox = {
    document: doc,
    window: {},
    console: { warn: () => {}, log: () => {} },
    encodeURIComponent: encodeURIComponent
  };
  /* The stub answers only the two selectors payments.js actually uses, so the
     test cannot silently pass by returning an empty list for a new one. */
  selectors['[data-pay]'] = els.filter((e) => e.getAttribute('data-pay') !== null);
  selectors['[data-portal]'] = els.filter((e) => e.getAttribute('data-portal') !== null);
  vm.runInNewContext(src, sandbox, { filename: 'payments.js' });
  return sandbox.window.PALLETTAI_PAYMENTS;
}

const UNRESOLVED = loadPayments([]);
const KEYS = Object.keys(UNRESOLVED.products);

console.log('== The config is readable ==');
assert(typeof UNRESOLVED === 'object' && UNRESOLVED !== null, 'payments.js exposes window.PALLETTAI_PAYMENTS');
assert(KEYS.length > 0, 'it declares ' + KEYS.length + ' products');
assert(typeof UNRESOLVED.buyUrl === 'function', 'buyUrl is exposed so a link can be checked without a browser');

console.log('\n== A missing product id becomes an honest fallback ==');
{
  const btn = makeEl({
    'data-pay': 'depositCreate',
    'data-pay-annual': 'careAnnual',
    'data-label-monthly': 'Subscribe — £19/mo',
    'data-label-annual': 'Subscribe — £15/mo',
    href: 'support.html',
    textContent: 'Subscribe — £19/mo'
  });
  /* The empty case is staged by emptying these two keys in the real source,
     rather than waiting for a config that happens to be all-empty. Relying on
     that made this block skip itself as soon as ids started going in — so the
     test would have quietly retired at exactly the moment the buttons went
     live, which is when it needs to be watching. */
  const api = loadPayments([btn], { depositCreate: '', careAnnual: '' });
  assert(api.missing().indexOf('depositCreate') !== -1, 'an emptied key is reported as missing');
  assert(api.missing().indexOf('careAnnual') !== -1, 'so is an emptied annual key');
  assert(btn.getAttribute('data-pay-state') === 'unavailable', 'the button is marked unavailable');
  assert(btn.href === 'support.html', 'it points at the support page, so it still leads somewhere real');
  assert(btn.textContent === 'Order by email \u2197', 'and it says what it actually does');
  assert(btn.getAttribute('data-monthly') === null, 'data-monthly is REMOVED, not left empty');
  assert(btn.getAttribute('data-annual') === null, 'so is data-annual');
  assert(btn.getAttribute('data-label-monthly') === null, 'and the toggle labels go with them');
}

console.log('\n== A set product id builds the real link ==');
{
  const btn = makeEl({
    'data-pay': 'studioPro',
    'data-pay-annual': 'studioProPlus',
    'data-label-monthly': 'Subscribe — £19/mo',
    'data-label-annual': 'Subscribe — £15/mo',
    href: 'support.html',
    textContent: 'Subscribe — £19/mo'
  });
  const api = loadPayments([btn], { studioPro: 'pdt_livepro123', studioProPlus: 'pdt_liveproplus456' });
  const monthly = api.buyUrl('pdt_livepro123');
  const annual = api.buyUrl('pdt_liveproplus456');
  assert(monthly === 'https://checkout.dodopayments.com/buy/pdt_livepro123?redirect_url=' +
    encodeURIComponent(api.redirect), 'a filled id builds a Dodo checkout link with the return url attached');
  assert(monthly.indexOf('https://') === 0, 'over https');
  assert(annual.indexOf('pdt_liveproplus456') !== -1, 'the annual id builds its own link');
  assert(btn.getAttribute('data-pay-state') === 'ready', 'the button is marked ready');
  assert(btn.getAttribute('data-monthly') === monthly, 'data-monthly is set from the config, which is what theme.js\'s toggle reads');
  assert(btn.getAttribute('data-annual') === annual, 'data-annual too');
  assert(btn.href === monthly, 'and the initial href is the monthly link');
  assert(btn.getAttribute('data-label-monthly') === 'Subscribe — £19/mo', 'the label the toggle restores is preserved');
  /* Phrased relatively: the property is that setting an id removes that key
     from the missing list. An absolute count here would break as soon as any
     other id was pasted into payments.js. */
  assert(api.missing().indexOf('studioPro') === -1, 'the filled key drops off the missing list');
  assert(api.missing().indexOf('studioProPlus') === -1, 'and so does the annual one');
}

console.log('\n== A junk product id is refused rather than linked ==');
{
  const api = loadPayments([]);
  assert(api.buyUrl('') === '', 'an empty id builds nothing');
  assert(api.buyUrl(' ') === '', 'a whitespace id builds nothing');
  assert(api.buyUrl('pdt_ok-123') !== '', 'a normal id builds a link');
  assert(api.buyUrl('../../evil') === '', 'a traversal-looking id is refused');
  assert(api.buyUrl('has space') === '', 'a spaced id is refused');
  assert(api.buyUrl('https://evil.example/pdt') === '', 'a pasted URL is refused — it wants the id only');
}

console.log('\n== The portal needs a business id ==');
{
  /* Staged, not read. This block asserted against the shipped value and passed
     only while PORTAL_BUSINESS_ID was a placeholder, so it would have gone red
     the moment the real business id was pasted in — which is the moment the
     fallback below starts being the thing a customer might actually hit. */
  const api = loadPayments([], { PORTAL_BUSINESS_ID: '' });
  assert(api.portalUrl() === '', 'with no business id there is no portal link');
  const link = makeEl({ 'data-portal': '', href: 'support.html', textContent: 'customer portal' });
  loadPayments([link], { PORTAL_BUSINESS_ID: '' });
  assert(link.getAttribute('data-pay-state') === 'unavailable', 'the portal link is marked unavailable');
  assert(link.textContent === 'Email us about your plan \u2197', 'and offers email instead of a dead link');
}

console.log('\n== A configured business id builds the real portal link ==');
{
  const api = loadPayments([]);
  const url = api.portalUrl();
  assert(/^https:\/\/customer\.dodopayments\.com\/login\/[A-Za-z0-9_-]{6,}$/.test(url),
    'the shipped business id builds a customer-portal link (' + url.replace(/\/login\/.*/, '/login/\u2026') + ')');
  const link = makeEl({ 'data-portal': '', href: 'support.html', textContent: 'customer portal' });
  loadPayments([link]);
  assert(link.getAttribute('data-pay-state') === 'ready', 'the live link is marked ready');
  assert(link.href === url, 'and points at the portal rather than the support page');
}

/* ---------- readiness report ---------- */

console.log('\n== Every key used in the markup exists in the config ==');
{
  const pages = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
  const used = new Map();
  const unknown = [];
  pages.forEach((file) => {
    const html = fs.readFileSync(path.join(DIR, file), 'utf8');
    const re = /data-pay(?:-annual)?="([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const key = m[1];
      if (!used.has(key)) used.set(key, []);
      if (used.get(key).indexOf(file) === -1) used.get(key).push(file);
      if (KEYS.indexOf(key) === -1 && unknown.indexOf(key) === -1) unknown.push(key);
    }
  });
  assert(unknown.length === 0, 'no page references a key the config does not define' +
    (unknown.length ? ' \u2014 unknown: ' + unknown.join(', ') : ''));
  assert(used.size > 0, used.size + ' distinct payment keys are wired into the markup');
  const unused = KEYS.filter((k) => !used.has(k));
  if (unused.length) {
    console.log('  \u2139 defined but not used by any page: ' + unused.join(', '));
  }
}

console.log('\n== An annual button states what it actually charges ==');
{
  /* Annual aftercare is a ONE-TIME payment, so two properties have to hold on
     the pricing page and nothing else enforces either:

       1. the button must not say "Subscribe" — that promises a charge that
          recurs every year, and this one does not recur at all;
       2. the amount on the button must equal the amount in the tier's annual
          note, so the figure a customer reads and the figure they are charged
          cannot drift apart.

     If the annual products ever become yearly subscriptions again, the
     "Subscribe" assertion is the one to revisit — the label should say so. */
  const html = fs.readFileSync(path.join(DIR, 'pricing.html'), 'utf8');

  const buttons = Array.from(html.matchAll(/data-pay-annual="([^"]+)"[^>]*data-label-annual="([^"]*)"/g));
  const notes = Array.from(html.matchAll(/data-annual-note="([^"]*)"/g));
  const money = (s) => ((String(s).match(/\u00a3([\d,]+)/) || [])[1] || '');

  assert(buttons.length > 0, buttons.length + ' annual buttons found on the pricing page');
  assert(buttons.length === notes.length,
    'every annual button has a matching tier note (' + buttons.length + ' buttons, ' + notes.length + ' notes)');

  buttons.forEach((b, i) => {
    const key = b[1];
    const label = b[2];
    const note = notes[i] ? notes[i][1] : '';
    assert(label.trim().length > 0, key + ': the annual button has a label');
    assert(!/subscribe/i.test(label),
      key + ': the label does not promise a recurring charge — "' + label + '" should state the one-off amount');
    assert(money(label) !== '', key + ': the label states an amount');
    assert(money(label) === money(note),
      key + ': button and tier note state the same amount (\u00a3' + money(label) + ' vs \u00a3' + money(note) + ')');
  });
}

console.log('\n== Readiness ==');
{
  const missing = UNRESOLVED.missing();
  if (!missing.length) {
    console.log('  \u2713 every product id is set \u2014 the buttons go straight to Dodo.');
  } else {
    console.log('  \u2139 ' + missing.length + ' of ' + KEYS.length + ' product ids still to paste into payments.js:');
    missing.forEach((k) => console.log('      \u00b7 ' + k));
  }
}

if (failed) {
  console.error('\ncheck-payments FAILED \u2014 ' + failed + ' failure(s)');
  process.exit(1);
}
console.log('\ncheck-payments PASSED');

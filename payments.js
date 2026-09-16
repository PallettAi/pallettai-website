/* ============================================================
   PallettAi — where money goes.

   THIS IS THE ONLY FILE TO EDIT when a price or a payment link
   changes. Every Pay / Subscribe button on the site reads from
   here, so there is no way for two pages to disagree about what
   something costs or where it is bought.

   ── TO GO LIVE ───────────────────────────────────────────────
   1. In Dodo Payments, create one product per row in PRODUCTS
      below. Each product's page shows its id — it starts with
      `pdt_`. Copy that id into the matching '' pair of quotes.
   2. Put your Business id in PORTAL_BUSINESS_ID (Dodo dashboard
      → Settings). That is what "Manage billing" opens.
   3. Set PORTAL_MODE to 'test' while you are testing, then 'live'.

   Nothing here is secret. The API key and webhook signing secret
   belong in Supabase Edge Function secrets, never in the site.

   ── WHAT HAPPENS WHEN A LINK IS MISSING ──────────────────────
   Any product id still empty renders an honest "Order by email"
   button pointing at the support page, and the page tells the
   console which keys are unset. So an unfinished key is visible
   to you and never a dead end for a customer — which matters,
   because a button that silently does nothing is worse than no
   button at all.

   Loaded before theme.js (both are deferred, so document order
   is execution order) because pricing.html's monthly/annual
   switch reads the data-monthly / data-annual attributes this
   file resolves from the config.
   ============================================================ */

(function () {
  'use strict';

  var doc = document;

  /* ── CONFIG ─────────────────────────────────────────────── */

  var PRODUCTS = {
    /* Studio — these two must be the same products the app's
       dodo-checkout Edge Function bills, or a customer would be
       charged for one thing and granted another. */
    studioPro: 'pdt_0NnhvttRQJjMfRsz1XJpp',
    studioProPlus: 'pdt_0NnhwIuJVsrTxCux2IsBO',

    /* Project deposits (the amount that starts a build) */
    depositCreate: 'pdt_0Nni3nZlegM6DmCdGtQWI',    /* Create Website — £99 */
    depositRefresh: 'pdt_0Nni3zkfLKlANXObil6M5',   /* Refresh & Upgrade — £49 */
    depositCustom: 'pdt_0Nni4C8Nm84SOAbTCGeX9',    /* Custom Builds & Bots — £149 */

    /* Remaining balance, paid before launch */
    balanceCreate: 'pdt_0Nni4lmAgKV75H2rq5LEJ',    /* £150 */
    balanceRefresh: 'pdt_0Nni4zHGkUDTdruxi9RKs',   /* £100 */
    balanceCustom: 'pdt_0Nni5FejRmjJE2Rev9mOK',    /* £200 */

    /* Aftercare — monthly and annual are separate products in Dodo */
    careLiteMonthly: 'pdt_0Nnhyn0I4OvBgyeN9sHAS',  /* Care Lite — £19/mo */
    careLiteAnnual: 'pdt_0Nnhz8djqfGAfZQ9rHBw1',   /* Care Lite — £180 for a year, one-time */
    careMonthly: 'pdt_0Nni1YcuidQ4N1CtYMG9J',      /* Care — £49/mo */
    careAnnual: 'pdt_0Nni1ssg3gxKV6ZicXiPH',       /* Care — £468 for a year, one-time */
    carePlusMonthly: 'pdt_0Nni2lS9QLbMRkY89P9Kn',  /* Care Plus — £99/mo */
    carePlusAnnual: 'pdt_0Nni36MFLGSbSHikmWHv1'    /* Care Plus — £948 for a year, one-time */
  };

  /* Dodo dashboard → Settings → Business details → Business id. */
  var PORTAL_BUSINESS_ID = 'bus_0NnEtKuHuT45ZvVKlok21';

  /* 'test' until your live products are wired, then 'live'. */
  var PORTAL_MODE = 'live';

  /* Where Dodo returns the customer after a successful payment. */
  var REDIRECT = 'https://pallettai.org/thanks.html';

  /* Shown for any product id that is still empty. Sending someone to the
     support desk is a real route to buying; a broken button is not. */
  var FALLBACK_HREF = 'support.html';
  var FALLBACK_LABEL = 'Order by email ↗';

  /* ── derived ─────────────────────────────────────────────── */

  /* Static Dodo payment links. The product id is the whole integration —
     quantity and currency come from the product itself. */
  var BUY_BASE = 'https://checkout.dodopayments.com/buy/';

  function buyUrl(productId) {
    if (!productId) return '';
    /* A product id is a short opaque token; anything else in here is a typo
       that would 404 the customer, so refuse it rather than build a bad link. */
    if (!/^[A-Za-z0-9_-]{3,}$/.test(productId)) return '';
    return BUY_BASE + productId + '?redirect_url=' + encodeURIComponent(REDIRECT);
  }

  function portalUrl() {
    var id = String(PORTAL_BUSINESS_ID || '');
    if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return '';
    var host = PORTAL_MODE === 'test'
      ? 'https://test.customer.dodopayments.com'
      : 'https://customer.dodopayments.com';
    return host + '/login/' + encodeURIComponent(id);
  }

  function missingKeys() {
    return Object.keys(PRODUCTS).filter(function (k) { return !buyUrl(PRODUCTS[k]); });
  }

  /* ── render ──────────────────────────────────────────────── */

  /* The monthly/annual switch in theme.js drives its buttons off these
     attributes. If a link is missing we must take the attributes OFF, not
     leave them empty — the switch sets el.href from them, and href='' means
     the current page, which would look like the button worked. */
  function markUnavailable(el) {
    el.removeAttribute('data-monthly');
    el.removeAttribute('data-annual');
    el.removeAttribute('data-label-monthly');
    el.removeAttribute('data-label-annual');
    el.href = FALLBACK_HREF;
    el.textContent = FALLBACK_LABEL;
    el.setAttribute('data-pay-state', 'unavailable');
  }

  function markAvailable(el, monthly, annual, labelMonthly, labelAnnual) {
    if (monthly) el.setAttribute('data-monthly', monthly);
    if (annual) el.setAttribute('data-annual', annual);
    if (labelMonthly) el.setAttribute('data-label-monthly', labelMonthly);
    if (labelAnnual) el.setAttribute('data-label-annual', labelAnnual);
    el.href = monthly || annual || FALLBACK_HREF;
    el.setAttribute('data-pay-state', 'ready');
  }

  function apply() {
    var portal = portalUrl();

    doc.querySelectorAll('[data-portal]').forEach(function (el) {
      if (portal) {
        el.href = portal;
        el.setAttribute('data-pay-state', 'ready');
      } else {
        el.href = FALLBACK_HREF;
        el.textContent = 'Email us about your plan ↗';
        el.setAttribute('data-pay-state', 'unavailable');
      }
    });

    doc.querySelectorAll('[data-pay]').forEach(function (el) {
      var monthly = buyUrl(PRODUCTS[el.getAttribute('data-pay')]);
      var annualKey = el.getAttribute('data-pay-annual');
      var annual = annualKey ? buyUrl(PRODUCTS[annualKey]) : '';

      /* The tier buttons already carry their two labels in the markup, which
         theme.js rewrites on every toggle — so read them before overwriting. */
      var labelMonthly = el.getAttribute('data-label-monthly');
      var labelAnnual = el.getAttribute('data-label-annual');

      if (!monthly && !annual) { markUnavailable(el); return; }
      markAvailable(el, monthly, annual, labelMonthly, labelAnnual);
    });

    var missing = missingKeys();
    doc.documentElement.setAttribute('data-payments', missing.length ? 'pending' : 'ready');
    if (missing.length) {
      /* Deliberately a grouped warning, not a per-button silent failure: the
         person who needs this message is the one pasting the ids in. */
      console.warn(
        '[payments] ' + missing.length + ' product id(s) not set yet, so those buttons offer email instead:\n  ' +
        missing.join('\n  ') +
        '\nAdd them in payments.js.'
      );
    }
    if (!portal) {
      console.warn('[payments] PORTAL_BUSINESS_ID is not set, so "Manage billing" falls back to email.');
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  /* Exposed so a page (or a check) can ask what is wired up without
     duplicating any of this logic. */
  window.PALLETTAI_PAYMENTS = {
    products: PRODUCTS,
    buyUrl: buyUrl,
    portalUrl: portalUrl,
    missing: missingKeys,
    redirect: REDIRECT
  };
})();

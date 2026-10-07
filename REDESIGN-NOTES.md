# PallettAI — Open form redesign

## Delivery status

Implemented in the production website source, not a standalone demo. **Published to the live domain** - committed to `main` and pushed, so GitHub Pages serves pallettai.org. The grader's missing local-harness fallback was fixed in the same pass (see below).

Local preview: http://127.0.0.1:8201/

## Identity and purchase journey

- Warm parchment, espresso and apricot with copper highlights; locally hosted Inter Tight and Instrument Serif.
- Original geometric open-P logo, SVG favicon and regenerated raster logo, favicon, touch icon and social card.
- Original AI-authored SVG copper artwork in `ribbon-art.svg`; no image-generation API, stock photo or diffusion model was used. Homepage concept-study illustrations are original HTML/CSS artwork.
- Fictional coffee and architecture design studies are explicitly labelled—not testimonials or claimed client work.
- Rebuilt homepage and website-package pricing layout; shared navigation, footer, controls and styling extend the identity across the other public pages. Referral styling was updated without changing its authentication/payment contracts.
- Clear package totals, deposits, balances, agreed-scope caveats and direct Dodo checkout links. Existing product IDs, prices and checkout return URL are unchanged.
- Free website checker, report comparison, print/share/export tools, Studio links, downloads, contact endpoint and customer portal are retained.
- Removed the unsupported 56% enquiry-growth calculator and overlapping ambient/pointer animations.
- Annual aftercare is clearly a one-time twelve-month purchase with no automatic renewal; monthly plans retain 30 days’ cancellation notice.

## Verification

Run with Node 22 and the existing sibling Studio checkout's installed Electron, axe-core and sharp. No website framework or runtime dependency was added.

```bash
cd pallettai-website
python3 -m http.server 8201 --bind 127.0.0.1
# In another terminal:
node check-payments.js
node check-site.js
# To regenerate raster brand assets:
node build-brand.js
```

Final browser suite: **223 checks, zero failures**, covering 13 public pages at 320, 360, 768 and 1440px, automated WCAG A/AA checks at 360/1440px, local image loading, navigation, local assets/anchors, structured-data parsing, mobile-menu focus, billing toggle, reduced motion, checker comparison/project handoff, and enquiry success/failure states.

Also passed: the existing payment-resolver suite, JavaScript syntax checks and `git diff --check`. Manually inspected desktop/mobile homepage, concept studies, package cards, pricing and contact layout in the local Browser preview.

`test-results/redesign-checks.json` and `test-results/latest-run.log` contain local results and are ignored by Git.

### Test boundaries

The browser regression suite blocks external network access. Checker and enquiry responses are fixtures; no actual enquiry, checkout purchase, referral redemption or production write occurred. It verifies wiring and UI behaviour, not live payment settlement, inbox delivery, the grader worker's availability, or signed-in referral flows. Automated accessibility checks do not replace manual assistive-technology testing. Browser coverage here is Chromium/Electron, not Safari/Firefox.

This static website has no TypeScript project or typecheck command; syntax, integration and browser checks were used instead. Configured file-change hooks are unavailable in this client.

## Grader

The free website checker's backend and the live-site widget already worked; the failure was local only. `grader.js` always called the production Cloudflare Worker, whose CORS allowlist is the live origin, so a page served from loopback (the local preview on 8201) got "Failed to fetch". `grader.js` now picks the local dev harness (`grader/server.mjs`, which already accepts any loopback origin) when the page is served from loopback, and `index.html`'s CSP allows that one harness origin. Verified locally: example.com returns 68/100 with the report and project handoff rendering. The README's stale `GRADER_API` reference was corrected to the real `GRADER` constant.

## Warm refinement and Studio creative ideas

The warm refinement coordinates shared surfaces, buttons, links, referral styling, SVG artwork, raster brand assets and browser theme metadata. Rechecked after the final palette changes: **223 website browser checks, zero failures**, plus the payment-resolver suite. Desktop and 360px homepage layouts were inspected again.

The sibling Studio source now has a **Creative ideas** button: three brief-relevant suggestions from ten offline visual recipes. Exploration is free; selection stages actual supported section layouts and artwork direction for normal generation. Facts and copy are preserved; brand locks, explicit blueprints and Classic layouts take priority. Changed briefs invalidate old suggestions, including autofill changes. No extra runtime dependency was introduced.

Studio verification: **52 Director checks**, **18 actual Electron UI checks**, and the **full release gate passed** (including the 121-check real-app WCAG suite). The new panel also passed a targeted browser axe scan (11 passing rules, no WCAG A/AA violations). The first full run hit a concurrent mock-registry port collision and an outdated source assertion; the assertion was updated and the full rerun used a separate loopback mock port with a test-only preload under the ignored `.preview` directory. No production registry or enquiry writes were part of these tests.

Studio preview: http://127.0.0.1:4173/ — **AI Studio → write a brief → Creative ideas → Use this idea → Generate site**. These are source changes only: existing downloadable installers have **not** been rebuilt. Concurrent edits from other work in the shared Studio checkout were preserved and are not claimed as part of this feature.

## Coordinated Studio refresh and material lighting

The Studio source now uses this website's Open form identity throughout the dashboard, navigation, AI panels, controls, dialogs, onboarding, favicon and native startup screen. Shared fonts are self-hosted in desktop packaging with their redistribution license. Fresh workspaces default to paper; existing explicit themes and custom accents are retained. Generated client palettes remain independent. Desktop installers and OS app icons have not been rebuilt.

Website refinements add radial material lighting, an understated sculpture grid/orbit and copper headline rule, layered coffee-packaging and architecture studies, warmer Studio artwork and restrained entry/hover motion. Reduced-motion and print rules remain intact; no runtime library or external asset request was added. Checkout products, prices, enquiries and download aliases are unchanged.

Verification for this pass: **223 website browser checks, zero failures**, plus the payment suite. Studio's full release gate passed, including **18 real Electron generation checks**, **65 widget checks**, **121 WCAG engine checks**, and **99 performance/delivery-gate checks**. After the final responsive repair, the brand, chrome, polish and real Electron generation suites passed again. Manually inspected desktop/light/dark Studio, 390px Studio/creative ideas, and desktop/360px website artwork. Targeted AI-panel WCAG scans reported zero violations in light/mobile and dark/desktop. Local font loading and hidden result panels were checked in the actual browser.

Reviewed and included the previously approved offline creative ideas, configurable performance target/strict delivery gate, and missing native-module packaging fix. Restored the existing quality-warning step for open-project exports and pinned that regression with an executable test. Clarified that a transfer target produces warnings, with strict blocking above twice the target, rather than claiming that every warning blocks.

## Interactive project planner

The homepage now includes a three-choice project planner after the package cards, linked from the pricing introduction. Starting point, scope and priority produce an immediate recommendation using the existing £149/£249/£349 starting prices and £49/£99/£149 deposits. Multiple pages, connected workflows and custom tools route to an agreed custom quote rather than implying inclusion in a one-page package.

A warm drafting-board illustration changes with scope; paper panels, copper connectors and responsive controls extend the Open form visual identity without dependencies or external assets. Native labelled selects, a polite result announcement, reduced-motion compatibility and a no-JavaScript pricing/contact alternative keep the feature accessible.

“Bring this brief to us” inserts a readable outline into the existing enquiry textarea, preserves visitor notes, replaces only an unchanged previous planner outline, avoids duplicate outlines on repeated clicks, and focuses the enquiry. Choices are not persisted or transmitted by the planner; the existing enquiry submission remains the only way to send the brief. Pricing, checkout configuration and the Formspree endpoint are unchanged.

Verification: **227 browser checks, zero failures**, including all 27 planner combinations, workflow diagrams, preserved notes/repeated handoff, 320/360/768/1440px layout and automated WCAG A/AA checks. The payment suite and JavaScript syntax checks passed. Manually inspected 1440px and 360px planner views and clicked the handoff in the actual browser. No production enquiry or purchase was submitted. No TypeScript project/typecheck command exists; the existing syntax and browser checks apply. Safari/Firefox and manual screen-reader coverage remain outside this verification.

## Sculptural atelier / public website artwork

Added four original vector-only form studies across all 13 public pages: layered paper and a curved copper ribbon, a creative canvas with a colour fan, machined connections, and an architectural arch with copper steps. Metallic reflections, fine contour lines and drafting marks add detail without raster assets, filters, new runtime dependencies or extra animation. The complete collection is **13,050 bytes**. Hero stages, quiet legal treatments, warmer shared cards and responsive homepage exploration links retain the Open form identity. Illustrations are labelled original/conceptual, not client evidence or app screenshots.

A native pricing guide connects visitor needs to each priced build option and visibly highlights the destination. Existing prices, product IDs, deposit/balance terms, optional aftercare, checkout wiring, forms, authentication and download aliases are unchanged. Ask-before-paying guidance remains visible. Shared CSS and SVG URLs are versioned so already-open/cached pages receive the refined artwork.

Verification on the final source: **281 browser checks, zero failures**, including all 13 pages at 320/360/768/1440px, artwork decoding/intrinsic dimensions/alt attributes, automated WCAG A/AA at 360/1440px, guide destinations, billing, planner, mocked checker/enquiry paths, reduced motion, assets and anchors. Payment-resolver, JavaScript syntax and `git diff --check` passed. SVG XML parses and dependency/size checks pass. Visually inspected desktop pricing/guide, mobile downloads/support/live artwork, homepage exploration links and mobile pricing guide; clicked the native guide without entering checkout.

The interrupted check was a test setup issue: a hidden Electron window did not initiate offscreen lazy images, so unbounded `decode()` waited indefinitely. The test now explicitly loads artwork and reports a bounded timeout; production lazy loading is preserved. Electron emitted host GPU/task-policy diagnostics, but the completed test report has no failures or unexpected page JavaScript errors. No real purchase, enquiry, auth mutation or Studio edit was made. Safari/Firefox, manual screen-reader testing and a real payment remain unverified; no TypeScript project/typecheck command exists.

## Published

Authorized and published: the front end is committed to `main`, so GitHub Pages serves pallettai.org. Preserve the production checkout IDs, Formspree action and existing download aliases on future changes. A controlled live service smoke test and Safari/Firefox check remain sensible release checks. Removed as orphaned: `legacy.css`, `terminal.css` (no page links them) and the superseded `website-design-demo.html` concept page. The previous unrelated Studio packaging edits remain outside this website redesign.

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

## Published

Authorized and published: the front end is committed to `main`, so GitHub Pages serves pallettai.org. Preserve the production checkout IDs, Formspree action and existing download aliases on future changes. A controlled live service smoke test and Safari/Firefox check remain sensible release checks. Removed as orphaned: `legacy.css`, `terminal.css` (no page links them) and the superseded `website-design-demo.html` concept page. The previous unrelated Studio packaging edits remain outside this website redesign.

# Tasks: Date El Gusto showcase

> Ordered by dependency. Plan: [`plan.md`](plan.md). **No task starts before the plan is approved.**
> **No automated tests.** "Check" means a build check (`npm run typecheck`, `saito validate`) plus the manual step named. People do the end-to-end validation at the checkpoints.

## Wave 1

### `noindex-header` ([spec](specs/SPEC-noindex-header.md))
- [x] **T1** Send `X-Robots-Tag: noindex` when `seo.noindex` is true, in every environment
  - Acceptance: the spec's three cases; other sites' `_headers` unchanged
  - Check: typecheck; build one site three ways and read `_headers`
  - Files: `packages/cli/src/build.ts`, `README.md`, `docs/CONFIGURATION.md` · Owner: `backend-engineer`

### `ui-strings` ([spec](specs/SPEC-ui-strings.md))
- [x] **T2** Create `strings.ts` (`en`, `es`) and use it in the Astro components
  - Acceptance: every inventory string in the Astro files comes from `strings(site.locale)`; English text unchanged
  - Check: typecheck; open an `es-GT` site and an `en` site
  - Files: `packages/components/src/strings.ts`, `layout/SiteLayout.astro`, `layout/Header.astro`, `sections/Contact.astro`, `sections/Products.astro`, `ui/AddToCart.astro` · Owner: `frontend-engineer`
- [x] **T3** Localize the web components and the three schema defaults
  - Acceptance: contact-form and countdown copy arrives through `data-*` attributes; `submitLabel`, `successMessage`, `expiredText` fall back to the locale
  - Check: typecheck; `saito validate --all`; `saito seed <site> --dry-run`
  - Files: `web/contact-form.ts`, `web/countdown.ts`, `sections/Contact.astro`, `sections/Countdown.astro`, `packages/core/src/schema/sections.ts` · Owner: `frontend-engineer` · After: T2
- [x] **T4** Close-out: docs; remove the `localized-ui-labels` flags from `family-kitchen`; registry `supported`, `x-patterns` `implemented`
  - Files: `docs/CONFIGURATION.md`, `packages/templates/src/family-kitchen/v1.ts`, `packages/templates/src/template.example.ts`, `sites/example.config.yaml` · Owner: primary · After: T3

### `theme-tokens` ([spec](specs/SPEC-theme-tokens.md))
- [x] **T5** Schema fields (`accent2`, `accent3`, `scrim`, `radii`, extended radius scale) and `themeToCss()` emitting only what is set
  - Check: typecheck; `saito validate --all`; a bad `scrim` value is reported
  - Files: `packages/core/src/schema/theme.ts`, `packages/core/src/theme.ts` · Owner: `fullstack-engineer`
- [x] **T6** Map the tokens in Tailwind and give buttons, cards, images and the hero overlay their roles
  - Acceptance: existing sites look the same (fallbacks to today's values)
  - Check: typecheck; compare two existing sites side by side
  - Files: `apps/renderer/src/styles/global.css`, `sections/Gallery.astro`, `sections/Hero.astro` · Owner: `frontend-engineer` · After: T5
- [x] **T7** Close-out: docs; `family-kitchen` minor release with the tokens; remove the tokens that became real from `templateExtensions.tokens`
  - Files: `docs/CONFIGURATION.md`, `packages/templates/src/family-kitchen/v1.ts` · Owner: primary · After: T6

**▶ Checkpoint A (person):** see [plan](plan.md#checkpoints-manual-by-a-person).

## Wave 2 (in parallel), with wave 2′

### `section-variants` ([spec](specs/SPEC-section-variants.md))
- [x] **T8** Shared icon set, and features `iconStyle: badge` plus `dividers`
  - Files: `ui/icons.ts`, `packages/core/src/schema/sections.ts`, `sections/Features.astro`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer`
- [x] **T9** New section type `specials` with price badge: schema, component, registration
  - Files: `packages/core/src/schema/sections.ts`, `sections/Specials.astro`, `packages/components/src/index.ts`, `global.css` · Owner: `fullstack-engineer`
- [x] **T10** `specials` in the Studio and both reference files
  - Check: typecheck; `saito validate --all` (`example.config.yaml` still resolves); `specials` is editable in the Studio
  - Files: `apps/studio/schemaTypes/index.ts`, `sites/example.config.yaml`, `packages/templates/src/template.example.ts`, `docs/CONFIGURATION.md` · Owner: `fullstack-engineer` · After: T9
- [x] **T11** Gallery `layout: marquee | masonry`, image `span`, `action`
  - Files: `sections.ts`, `sections/Gallery.astro`, `web/marquee.ts`, `global.css`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer`
- [x] **T12** `richText` and `contact`: `image`, `imagePosition`, `action`, `slab`
  - Files: `sections.ts`, `sections/RichText.astro`, `sections/Contact.astro`, `global.css`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer`
- [x] **T13** `cta` `layout: photo-band` with `image`
  - Files: `sections.ts`, `sections/Cta.astro`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer`
- [x] **T14** Close-out: docs; `family-kitchen` minor release adopting T8–T13; remove 9 flags; registry and `x-patterns` · Owner: primary · After: T8–T13

### `site-chrome` ([spec](specs/SPEC-site-chrome.md))
- [x] **T15** `navigation.transparent` and `navigation.iconLinks`; header web component
  - Files: `packages/core/src/schema/site.ts`, `layout/Header.astro`, `web/header.ts`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer` · After: T8 (icons)
- [x] **T16** `hero.headingSize: display` and `theme.headingDecoration: bar`
  - Files: `sections.ts`, `schema/theme.ts`, `sections/Hero.astro`, `ui/SectionHeader.astro`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer`
- [x] **T17** `richText.doodle` and the doodle set
  - Files: `sections.ts`, `sections/RichText.astro`, `ui/doodles.ts`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer` · After: T12 (same component)
- [x] **T18** `theme.motion.reveal` with the reveal script
  - Files: `schema/theme.ts`, `layout/SiteLayout.astro`, `web/reveal.ts`, `global.css` · Owner: `frontend-engineer`
- [x] **T19** Close-out: docs; `family-kitchen` minor release adopting T15–T18; remove 6 flags; registry and `x-patterns` · Owner: primary · After: T15–T18

### `whatsapp-commerce` ([spec](specs/SPEC-whatsapp-commerce.md))
- [x] **T20** `whatsapp` provider schema; menu item `image` and `ingredients`; `menu.layout: cards`
  - Files: `packages/core/src/schema/site.ts`, `sections.ts`, `sections/Menu.astro`, `apps/studio/schemaTypes/index.ts` · Owner: `fullstack-engineer`
- [x] **T21** Port the storefront into `web/whatsapp-cart.ts`, with its strings and styles
  - Acceptance: message format and order id identical to the prototype's
  - Files: `web/whatsapp-cart.ts`, `strings.ts`, `global.css` · Owner: `frontend-engineer` · After: T2, T20
- [x] **T22** Mount the cart in `SiteLayout`; `geolocation=(self)` only when location is enabled
  - Files: `layout/SiteLayout.astro`, `packages/cli/src/build.ts` · Owner: `fullstack-engineer` · After: T21
- [x] **T23** Close-out: docs; `family-kitchen` minor release (cards, item images, ingredients); remove 4 flags; registry and `x-patterns` · Owner: primary · After: T22

### `date-el-gusto-site`, wave 2′ ([spec](specs/SPEC-date-el-gusto-site.md); runbook phases)
- [x] **T24** Rewrite `site.config.yaml` as a thin site on `family-kitchen@1` (runbook Phase 1); drop `x-extraction`
  - Check: `saito validate date-el-gusto --env production` · Owner: primary · After: Checkpoint A
- [x] **T25** Download and optimize the assets into `public/`: images as WebP, logo, favicon (Phase 2 §2.2) · Owner: primary
- [ ] **T26** Sanity: Studio schema deploy, seed staging, then promote to production (Phases 3–4) · Owner: primary, with the person for logins · After: T10, T20 (Studio fields exist)
- [ ] **T27** Cloudflare Pages project, env files, webhooks, first staging deploy (Phases 5–6) · Owner: `devops-engineer`, with the person for accounts
- [x] **T28** Add `integrations.commerce` (`whatsapp`) to the site config · Owner: primary · After: T23

**▶ Checkpoint B (person):** see [plan](plan.md#checkpoints-manual-by-a-person).

## Wave 3, first to cut

### `pwa` ([spec](specs/SPEC-pwa.md))
- [ ] **T29** `brand.pwa` schema and `Head.astro` tags
  - Files: `packages/core/src/schema/site.ts`, `layout/Head.astro` · Owner: `fullstack-engineer`
- [ ] **T30** `web/pwa.ts` (install button, offline notice, service-worker registration), mounts, strings
  - Files: `web/pwa.ts`, `layout/Header.astro`, `layout/SiteLayout.astro`, `strings.ts` · Owner: `frontend-engineer` · After: T29
- [ ] **T31** `/sw.js` revalidation header (checked against the Cloudflare `_headers` docs); docs; `family-kitchen` close-out (2 flags) · Files: `packages/cli/src/build.ts`, `docs/CONFIGURATION.md`, `family-kitchen/v1.ts`, `template.example.ts`, `sites/example.config.yaml` · Owner: `backend-engineer`, then primary · After: T30
- [ ] **T32** Site PWA files in `public/` (manifest renamed "Date El Gusto", `sw.js`, `offline.html`, icons, splash screens) and `brand.pwa` in the site config · Owner: primary · After: T31

**▶ Checkpoint C (person):** the PWA checks on Android and iPhone, then the runbook Phase 7 demo rehearsal.

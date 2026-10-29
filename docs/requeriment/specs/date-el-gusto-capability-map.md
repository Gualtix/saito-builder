# Capability Map: Date El Gusto showcase (platform work)

> **Status:** approved v2 (2026-10-29). Intent: [`intent/date-el-gusto-showcase.md`](../intent/date-el-gusto-showcase.md). Runbook: [`step-by-step.md`](../step-by-step.md).
> Approved 2026-10-29. Module specs, in build order: [`noindex-header`](SPEC-noindex-header.md), [`ui-strings`](SPEC-ui-strings.md), [`theme-tokens`](SPEC-theme-tokens.md) (approved); [`section-variants`](SPEC-section-variants.md), [`site-chrome`](SPEC-site-chrome.md), [`whatsapp-commerce`](SPEC-whatsapp-commerce.md), [`pwa`](SPEC-pwa.md), [`date-el-gusto-site`](SPEC-date-el-gusto-site.md) (drafts). Plan: [`../plan.md`](../plan.md), tasks: [`../todo.md`](../todo.md). No automated tests: validation is manual end-to-end testing by a person.

**Where things stand:** `family-kitchen@1` is extracted and registered. It renders today with honest fallbacks and flags 26 unsupported capabilities. No platform module has started, and no site pins the template yet.

**Requirements source:** each module owns a set of capability keys. Its spec takes purpose, expected behaviour and requirements from `templateExtensions.unsupportedCapabilities` in `packages/templates/src/family-kitchen/v1.ts`, and `grep -rn "UNSUPPORTED <key>" packages/templates/src` shows where each one falls back. A module is done when its keys are `support: 'supported'` in the `template.example.ts` registry and the template's flags for them are gone.

Every module is site-agnostic: it adds schema fields, component features, tokens or web components that any site can use. Only `date-el-gusto-site` touches site files.

| Module id | Responsibility | Capability keys | Depends on | Main files |
|---|---|---|---|---|
| `noindex-header` | `X-Robots-Tag: noindex` is also sent when `seo.noindex` is true, production included | (not a template gap) | — | `packages/cli/src/build.ts` (`writeEdgeArtifacts`), a test |
| `ui-strings` | Component copy chosen by `site.locale` (`en` default, `es` added): the mobile menu button, Contact labels, and the strings the cart and the PWA need | `localized-ui-labels` | — | `packages/components/src/` (one strings module), the components that hard-code copy |
| `theme-tokens` | Optional theme fields the renderer applies: extra accent colours, per-role radius (button, card, image, panel), photo scrim. Emitted as `--saito-*` variables; defaults reproduce today's output | (enables the two modules below) | — | `schema/theme.ts`, `themeToCss()`, `apps/renderer/src/styles/global.css`, `docs/CONFIGURATION.md` |
| `section-variants` | Opt-in fields on existing section types: daily-specials panel with price badge, gallery marquee and masonry, features SVG icon badges, media split with offset slab on `richText` and `contact`, `cta` photo band, section header action | `daily-specials`, `promo-badge`, `image-marquee`, `masonry-gallery`, `svg-icon-badges`, `media-text-split`, `offset-color-slab`, `photo-band-card`, `section-header-action` | `theme-tokens` | `schema/sections.ts`, `packages/components/src/sections/`, Studio schema, `sanity-seed.ts`, `docs/CONFIGURATION.md` |
| `site-chrome` | Site-wide presentation: transparent header over the hero, header icon links, display-size hero wordmark, heading accent bar, line-doodle slots, scroll reveal (with its motion setting) | `transparent-header`, `header-icon-links`, `hero-wordmark`, `heading-accent-bar`, `line-doodles`, `scroll-reveal` | `theme-tokens` | `schema/site.ts` (navigation), `schema/theme.ts`, `layout/Header.astro`, `SiteLayout.astro`, `Hero.astro`, a shared section-heading component |
| `whatsapp-commerce` | `commerce.provider: whatsapp`; menu item `image` and `ingredients`; menu card layout; the cart web component (store, product dialog, cart bar and sheet, map pin, message, `wa.me` URL, order id); `geolocation=(self)` only when location is enabled | `menu-item-photos`, `product-options-dialog`, `messaging-app-checkout`, `delivery-location-pin` | `ui-strings` | `schema/site.ts`, `schema/sections.ts`, `web/whatsapp-cart.ts`, `Menu.astro`, `build.ts`, Studio schema, `sanity-seed.ts`, tests, `docs/CONFIGURATION.md` |
| `pwa` | Optional `brand.pwa` (manifest, theme colour, apple-touch icon, splash screens); `Head.astro` tags; install and offline web components; service-worker registration; `/sw.js` revalidation header | `installable-app`, `offline-page` | `ui-strings` | `schema/site.ts`, `layout/Head.astro`, `web/`, `build.ts` |
| `family-kitchen-template` | **v1 done.** Remaining: adopt each new field as its module lands (minor releases: 1.1.0, 1.2.0…) and remove the matching flags | — | the modules above, one at a time | `packages/templates/src/family-kitchen/v1.ts` |
| `date-el-gusto-site` | Thin site config on `family-kitchen@1`, with `reserve`, `reviews` and `catering` off; self-hosted assets; PWA files; Sanity content; deploys | — | `family-kitchen-template`, `noindex-header`, `pwa` (optional) | `sites/date-el-gusto/`, `environments/date-el-gusto/` (not in git) |

**Deferred (no module in this map):** `table-reservation`, `carousel`, `review-rating` and `category-tiles`. They belong to the optional `reserve`, `reviews` and `catering` sections, which the demo site turns off (D7), so they don't affect the side-by-side comparison. They stay flagged in the template until another site needs them.

**Coverage:** the 26 flagged keys are 22 owned by modules plus 4 deferred. Nothing is unowned.

**Build order:**
1. `noindex-header`, `ui-strings` and `theme-tokens`, in parallel. All are small and unblock the rest.
2. `section-variants`, `site-chrome` and `whatsapp-commerce`, in parallel. After each lands, `family-kitchen-template` adopts it in a minor release.
3. `date-el-gusto-site`. It can start as soon as step 1 is done, because the site is thin and picks up template releases on its next build.
4. `pwa`. It is first to cut, and the site adds `brand.pwa` when it lands.

Dependencies only point one way, and there are no cycles. `ui-strings` and `theme-tokens` are separate because several modules need the same mechanism; building one per feature would give diverging versions.

## Acceptance per module (summary; each module spec makes these exact)

| Module id | Done when |
|---|---|
| `noindex-header` | A production build with `seo.noindex: true` writes `X-Robots-Tag: noindex` in `_headers`; without it, production writes none. Covered by a test |
| `ui-strings` | `locale: es-*` renders Spanish labels in every component the showcase uses (mobile menu button and Contact included); `en` sites render exactly as today |
| `theme-tokens` | Each new token is optional, reaches the page as a CSS variable, and leaves existing sites' `dist/` unchanged when unset |
| `section-variants` | Each feature turns on with one field; existing sites' output is unchanged; the marquee is static under reduced motion; every field is in the Studio schema, the seed round trip and `docs/CONFIGURATION.md` |
| `site-chrome` | Same as above, plus the transparent header stays readable when scrolled and with the mobile menu open, and the reveal shows content immediately under reduced motion |
| `whatsapp-commerce` | For the same cart, the message and `wa.me` URL match the prototype's; order id format `<PREFIX>-YYMMDD-XXXXX`; the prototype's `?sf-selftest` assertions pass in vitest; `seed.test.ts` still round-trips; "use my location" works on a deployed build |
| `pwa` | Lighthouse marks the site installable; the offline page is served offline; `/sw.js` is revalidated on every load; no PWA tags appear without `brand.pwa` |
| `family-kitchen-template` | Each adoption is a minor release with its flags removed; `saito create <test-site> --template family-kitchen --tenant <t>` still validates and builds |
| `date-el-gusto-site` | Indistinguishable from the prototype side by side at 390 px and 1280 px; the runbook's Phase 5–7 acceptance criteria pass |

For every module, its capability keys are `support: 'supported'` in the `template.example.ts` registry and `status: implemented` in `x-patterns`, and `npm test` stays green.

## Assumptions (correct these at review)

1. **The template id `family-kitchen` is final.** It is registered, and renaming it is free only until `date-el-gusto-site` pins it.
2. **Theme tokens go into `themeSchema`** as optional fields (the `theme-tokens` module), not template-only `templateExtensions.tokens`, which the renderer never reads.
3. **`ui-strings` uses one built-in dictionary per locale** inside `packages/components`, chosen by `site.locale`, with no per-site overrides until a site needs them.
4. **Visual features are fields on existing section types** (for example a new `gallery.layout`). The exception is `daily-specials`, which may need its own section type; the `section-variants` spec decides.
5. **Marquee, masonry, slabs and reveal are CSS-first.** JavaScript is used only where the prototype needs it: duplicating the marquee track, the reveal observer, the header scroll state.
6. **The cart stores state in `localStorage` per site** (`saito:<site-id>:cart`). Nothing is sent to a server.
7. **Leaflet stays on unpkg with SRI.** There is no CSP today. If one is added later, the unpkg and OSM tile hosts must be allowed.
8. **The `/sw.js` header rule must not stack with the `/*` `Cache-Control` rule.** Cloudflare applies every matching rule, so the `pwa` spec settles the order.

## Open questions

- Is deferring the four capabilities of the optional sections acceptable for the demo? *Recommendation:* yes; they are off on the demo site.
- ~~Should `daily-specials` be a new section type or a `menu` variant?~~ Decided in `SPEC-section-variants.md`: a new section type `specials`.

# Capability Map: Date El Gusto showcase (platform work)

> **Status:** draft, awaiting review. Intent: [`docs/intent/date-el-gusto-showcase.md`](../intent/date-el-gusto-showcase.md). Runbook: [`step-by-step.md`](../../step-by-step.md).
> Once this map is approved, each module gets its own spec next to it (`SPEC-<module-id>.md`), written in build order.

The showcase bundles several capabilities that can be tested and shipped on their own, so they are split into modules here. Every module is site-agnostic: it adds schema fields, component features or web components that any site can use. Only `date-el-gusto-site` touches site files.

| Module id | Responsibility | Depends on | Main files |
|---|---|---|---|
| `noindex-header` | `X-Robots-Tag: noindex` is also sent when `seo.noindex` is true, production included | — | `packages/cli/src/build.ts` (`writeEdgeArtifacts`), a test |
| `ui-strings` | Component copy chosen by `site.locale` (`en` default, `es` added): Contact labels and any other hard-coded English strings, plus the strings the cart and the PWA need | — | `packages/components/src/` (one strings module), the components that hard-code copy |
| `visual-variants` | Opt-in presentation features: `gallery` marquee and masonry, media colour slab, heading accent and doodle decorations, price badge, `cta` image background, `testimonials` carousel, scroll reveal, per-role radius tokens. Defaults leave existing sites unchanged | — | `schema/sections.ts`, `schema/theme.ts`, `themeToCss()`, `packages/components/src/sections/`, `ui/`, `global.css`, Studio schema, `docs/CONFIGURATION.md` |
| `whatsapp-commerce` | `commerce.provider: whatsapp`; menu item `image` and `ingredients`; the `whatsapp-cart` web component (store, product dialog, cart bar and dialog, map pin, message, `wa.me` URL, order id); `geolocation=(self)` when location is enabled | `ui-strings` | `schema/site.ts`, `schema/sections.ts`, `web/whatsapp-cart.ts`, `Menu.astro`, `build.ts`, Studio schema, `sanity-seed.ts`, tests, `docs/CONFIGURATION.md` |
| `pwa` | Optional `brand.pwa` (manifest, theme colour, apple-touch icon, splash screens); `Head.astro` tags; `app-install` and `offline-notice` web components; service-worker registration; `/sw.js` revalidation header | `ui-strings` | `schema/site.ts`, `layout/Head.astro`, `web/`, `build.ts` |
| `family-kitchen-template` | Template `family-kitchen@1` extracted from the Tangerine prototype: sections and order, theme preset, `templateExtensions`, optional Reservas / Testimonios / Catering, new `x-patterns` entries | `visual-variants`, `whatsapp-commerce` | `packages/templates/src/family-kitchen/v1.ts`, `themes.ts`, `src/index.ts`, `sites/example.config.yaml` |
| `date-el-gusto-site` | Thin site config on the template, self-hosted assets, PWA files, Sanity content, deploys | `family-kitchen-template`, `noindex-header`, `pwa` (optional) | `sites/date-el-gusto/`, `environments/date-el-gusto/` (not in git) |

**Build order:** `noindex-header`, `ui-strings` and `visual-variants` (in parallel) → `whatsapp-commerce` → `family-kitchen-template` → `date-el-gusto-site` → `pwa` (first to cut; the site adds `brand.pwa` when it lands).

`family-kitchen-template` can be drafted from day one with the fields that already exist. It picks up the new variant and commerce fields as those modules land. No migration is needed because no site pins it until `date-el-gusto-site`.

Dependencies only point one way, and there are no cycles. `ui-strings` is separate because three modules need the same strings mechanism, and building one per feature would give three diverging versions.

## Acceptance per module (summary; each module spec makes these exact)

| Module id | Done when |
|---|---|
| `noindex-header` | A production build with `seo.noindex: true` writes `X-Robots-Tag: noindex` in `_headers`; without it, production writes none. Covered by a test |
| `ui-strings` | `locale: es-*` renders Spanish labels in Contact and every component the showcase uses; `en` sites render exactly as today |
| `visual-variants` | Each feature can be turned on with one field; screenshots of existing sites are unchanged; reduced motion disables the marquee and the scroll reveal; every field is in the Studio schema and `docs/CONFIGURATION.md` |
| `whatsapp-commerce` | For the same cart, the message and `wa.me` URL match the prototype's; order id format `DG-YYMMDD-XXXXX`; the prototype's `?sf-selftest` assertions pass in vitest; `seed.test.ts` still round-trips; the map pin's "use my location" works on a deployed build |
| `pwa` | Lighthouse marks the site installable; the offline page is served offline; `/sw.js` is revalidated on every load; no PWA tags appear without `brand.pwa` |
| `family-kitchen-template` | `saito create <test-site> --template family-kitchen --tenant <t>` validates and builds with placeholder content |
| `date-el-gusto-site` | Indistinguishable from the prototype side by side at 390 px and 1280 px; the runbook's Phase 5–7 acceptance criteria pass |

## Assumptions (correct these at review)

1. **Template id `family-kitchen`**, kept for good once chosen (module ids and the site's `template:` pin depend on it).
2. **`ui-strings` uses one built-in dictionary per locale** inside `packages/components`, chosen by `site.locale`. There are no per-site overrides until a site needs them.
3. **Visual features are fields on existing section types** (for example a new `gallery.layout`), not new section types, unless a pattern has no section to belong to.
4. **Marquee, masonry, slabs and reveal are CSS-first.** JavaScript is used only where the prototype needs it (pausing the marquee, the reveal observer).
5. **The cart stores state in `localStorage` per site** (`saito:<site-id>:cart`), as the prototype does with `date-el-gusto:storefront`. Nothing is sent to a server.
6. **Leaflet stays on unpkg with SRI.** There is no CSP today, so it needs no header change. If a CSP is added later, the unpkg and OSM tile hosts must be allowed.
7. **The `/sw.js` header rule must not stack with the `/*` `Cache-Control` rule.** Cloudflare applies every matching rule, so the `pwa` spec has to settle the order and the detach syntax.

## Open questions

- Is `family-kitchen` the final template id?
- Should the per-role radius and motion tokens go into `themeSchema`, which every site can then set, or stay as template-only tokens in `templateExtensions`? The second option means the renderer cannot use them. *Recommendation:* `themeSchema`, as optional fields.

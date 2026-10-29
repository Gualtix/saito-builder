# Date El Gusto (Tangerine) → Saito → Cloudflare Pages: step-by-step

**Source:** `live-sketching/eatery-cafe/tangerine/tangerine-web-site/` (zero-build landing page, WhatsApp storefront and installable PWA)
**Target:** a new reusable template extracted from the prototype (working name `family-kitchen@1`) and the site `date-el-gusto` (tenant `date-el-gusto`) built on it. Rendered by `apps/renderer` (Astro 5), content in Sanity (`apps/studio`), deployed with `./deploy.sh` (code and YAML changes) and Cloudflare Pages deploy hooks (Sanity publishes), served at `saito-date-el-gusto.pages.dev`.
**Environments:** `development` (local) · `staging` (the "preview" environment) · `production`.
**Intent:** [`intent/date-el-gusto-showcase.md`](intent/date-el-gusto-showcase.md) (confirmed 2026-10-29). **Platform work:** [`specs/date-el-gusto-capability-map.md`](specs/date-el-gusto-capability-map.md).

> **What v1 is.** A showcase for internal stakeholders that proves Saito as a website factory. A real restaurant client may follow, and v1 must not block that. Everything that only a real client needs is in [Before a real client](#before-a-real-client).
>
> **Fidelity bar.** Indistinguishable from the prototype side by side at 390 px and 1280 px: same look, same interactions, and the same WhatsApp message for the same cart. Not pixel-perfect.
>
> **Platform rule.** No site-specific code. The prototype is reproduced with reusable parts only: the template, shared section components and their variants, theme tokens and web components. A template holds no markup or CSS (`packages/templates/src/template.example.ts`), so every visual pattern becomes a shared component feature.
>
> There is no CI. GitHub only hosts the repository: checks run by hand, `./deploy.sh` uploads from a developer machine, and Cloudflare Pages clones the repo only for deploy-hook builds. See README §4 "Build and deployment".

---

## 0. Where things stand today

Already built, so the guide reuses these and does not recreate them:

| Piece | State | Location |
|---|---|---|
| Prototype | Split from one monolithic HTML into modules (`js/app.js`, `ui.js`, `utils.js`, `store.js`, `services.js`, `components/site.js`, `menu.js`, `order.js`, `pwa.js`); storefront and PWA included | `live-sketching/eatery-cafe/tangerine/tangerine-web-site/` |
| Site config | Exists and validates on `restaurant@1` (`✔ date-el-gusto restaurant@1.0.0 · 1 pages · 14 sections`), but it predates the storefront and PWA. It will be rewritten as a thin site on the new template (Phase 1). No `sites/date-el-gusto/public/` yet | `sites/date-el-gusto/site.config.yaml` |
| Templates | `restaurant@1`, and `casual-eatery@1` (extracted from the *organic* prototype, not Tangerine). Neither carries the Tangerine design | `packages/templates/src/` |
| Template tooling | The `web-directory-to-template` skill inventories a whole web project directory and generates `packages/templates/src/<id>/v1.ts`, a theme preset and `templateExtensions` | `.claude/skills/web-directory-to-template/` |
| Renderer | Astro, one project for every site; generates sitemap, robots, JSON-LD and `_headers` | `apps/renderer`, `packages/cli/src/build.ts` |
| Components | 16 section components and 2 web components (`contact-form`, `countdown`). Few variants: `hero.layout`, `gallery.columns` | `packages/components/src/` |
| Theme | Colours, heading and body fonts, one `radius`. No per-role radius, motion or decoration tokens | `packages/core/src/schema/theme.ts` |
| CMS | The existing Saito Sanity project and Studio (`saito-builder.sanity.studio`), with `page` and `siteSettings` documents and one workspace per dataset | `apps/studio` |
| Content sync | `saito seed` (local → Sanity) and `sanityToOverlay` (Sanity → build) | `packages/core/src/content/` |
| Manual deploy | `./deploy.sh local\|staging\|production <site>` loads `environments/<site>/.<local\|staging\|prod>.env`, builds, then previews (local) or uploads; production needs a typed confirmation | `deploy.sh` |
| Hosting adapter | `scripts/deploy.sh cloudflare-pages` → `wrangler pages deploy --project-name saito-<site> --branch main\|staging` (called by `./deploy.sh`) | `scripts/deploy.sh` |
| CMS-triggered deploy | Sanity webhook → Cloudflare deploy hook → Pages build runs `scripts/pages-build.sh <site>` → `dist/pages` | `scripts/pages-build.sh` |
| Env files | `environments/date-el-gusto/.staging.env` and `.prod.env` exist but are **empty**, so `./deploy.sh staging\|production` refuses to run | `environments/date-el-gusto/` |
| `staging` git branch | Exists on `origin`; staging hook builds use the code on it | GitHub |
| `seo.noindex` | Exists: it sets meta robots and `robots.txt` to noindex, but `_headers` sends `X-Robots-Tag: noindex` only outside production | `packages/core/src/schema/site.ts`, `packages/cli/src/build.ts:46` |
| Live visual editing | Proposal only, not implemented | `docs/live-visual-editing/sanity-live-visual-editing.md` |

### Decisions (confirmed 2026-10-29)

| # | Decision | Answer |
|---|---|---|
| D1 | Template | A **new reusable template** extracted from the Tangerine prototype with `web-directory-to-template` (working name `family-kitchen@1`). `date-el-gusto` becomes a thin site on it. Not `restaurant@1` overrides, not `casual-eatery@1`. |
| D2 | Ordering | **Port the full WhatsApp storefront** (product dialog, ingredient removal, cart, map pin, order id, `wa.me` hand-off) as a platform commerce provider. Never cut. |
| D3 | PWA | **In v1** (Instalar App, offline page, service worker). First to cut if time runs short. |
| D4 | Domain | **None for the demo.** Production is `https://saito-date-el-gusto.pages.dev`. A domain belongs to the real-client checklist. |
| D5 | Staging access | **Public** and `noindex`. No Cloudflare Access. |
| D6 | Publish to production | **Immediate.** The developer is the only editor; both webhooks are enabled. Publish → live in minutes is the demo moment. |
| D7 | Reservas, Testimonios, Catering | The **template ships them as optional sections** (Reservas as a WhatsApp `cta`, since there is no booking backend). `date-el-gusto` turns them off to match the prototype. |
| D8 | Live visual editing | **Later.** Not in v1. |
| — | Content | **Fictional content stays** (`.example` email, made-up reviews, the "Prototipo con contenido ficticio" footer). Unsplash images are downloaded and self-hosted. Order number `+502 4539 3659` (controlled by the team). |
| — | Indexing | **`noindex` everywhere**, production included (`seo.noindex: true` plus the `X-Robots-Tag` fix). |
| — | Accounts | The **existing** Saito Sanity project and Studio (the hard-coded `appId` stays) and the **existing** Cloudflare account. |
| — | Deadline | No hard date. Cut order if needed: PWA first; the cart and visual fidelity never. |

---

## Phase 1 · Template extraction and site mapping

**Goals:** a reusable template that carries the Tangerine structure and look, a thin `date-el-gusto` site on it, and a list of every pattern the platform cannot render yet (feeds Phase 2).

**Inputs:** `tangerine-web-site/index.html`, `data.js`, `styles.css`, `manifest.webmanifest`, `js/`, `DESIGN.md` and `references/` (one level up), the existing `sites/date-el-gusto/site.config.yaml`, and the `web-directory-to-template` skill.

**Outputs:** `packages/templates/src/family-kitchen/v1.ts` registered in `src/index.ts`, a theme preset in `themes.ts`, `templateExtensions` (source, taxonomy, patterns, tokens, assets, `requiredContent`), new patterns added to `sites/example.config.yaml` → `x-patterns`, a rewritten site config pinned to `family-kitchen@1`, and a fidelity map.

### Drift between the prototype and the existing config

The rewrite onto the new template must resolve all of these:

| Prototype now | Config today | Action |
|---|---|---|
| "Almuerzos del día" sits directly under the hero | Near the end of `order` | Template order puts it second |
| `<menu-catalog>`: 9 products with id, price, image, description and removable ingredients, rendered from `data.js` | `categorias` gallery (4 photo tiles); `menu` page disabled "because no per-dish prices" | A `menu` section with orderable items (needs §2.3 fields) |
| Storefront: product dialog, cart bar, cart dialog with "Seguir Comprando", map pin (Leaflet), order id, `wa.me` hand-off | None | Platform feature (§2.3) |
| Header "Instalar App" (`<app-install>`), `<offline-notice>`, `sw.js`, `offline.html`, manifest, icons, iOS splash screens | None | Platform feature (§2.4) |
| Reservas, Testimonios and Catering are `hidden` | Rendered | Template keeps them; the site sets `sections.<id>: false` (D7) |
| "Pedir en línea" band links to the menu | `href: "#"` placeholder | `#menu` |
| Manifest name "Date Gusto" | Site name "Date El Gusto" | Use "Date El Gusto" everywhere in the demo |

### Tasks

- [ ] Run `web-directory-to-template` on the `tangerine-web-site/` directory. Give the template a generic id (not the business name): `family-kitchen` is the working name. Replace business identity with placeholders; keep structure, variants, palette and fonts.
- [ ] Add the Tangerine theme preset to `packages/templates/src/themes.ts` (tangerine `#e99b3f`, sage `#99bd76`, ink `#1c1a17`, Dancing Script and Figtree), and the tokens the theme schema cannot hold yet in `templateExtensions.tokens` (per-role radius, slab offsets, motion).
- [ ] Template sections, in order: hero (image background), almuerzos (menu), platillos destacados (marquee), highlights (features), nosotros and sabores (rich text with media), menú (orderable menu), reservas (WhatsApp `cta`, optional), galería (masonry), testimonios (carousel, optional), pedir (`cta`), catering (optional), visítanos (contact).
- [ ] Rewrite `sites/date-el-gusto/site.config.yaml` with `template: family-kitchen@1`, the business data, the fictional content, and `reservas`, `testimonios` and `catering` set to `false`. Drop the old `x-extraction` block: the mapping now lives in the template's `templateExtensions` and the fidelity map below.
- [ ] Build the **fidelity map**: one row per visible prototype element with a rating (`exact`, `lossy`, `unmapped` or `decorative`). Every `lossy` or `unmapped` row needs a Phase 2 task. "Stays lossy in v1" is no longer allowed.
- [ ] Copy the business data from `data.js` into the site config: name, WhatsApp `+502 4539 3659`, currency `GTQ`, locale `es-GT`, map centre `[14.523, -90.759]`, zoom 16, order-id prefix `DG` (5 random characters), max quantity 20 per line, and all 9 products.
- [ ] Run `npm run saito -- validate date-el-gusto` after every config edit.

### Acceptance criteria

- `family-kitchen@1` is registered, and `npm run saito -- create <test-site> --template family-kitchen --tenant <t>` scaffolds a site that validates (proves it is reusable).
- Every visible prototype element has a fidelity-map row, and every `lossy` or `unmapped` row has a Phase 2 task.
- `validate date-el-gusto --env production` passes.

---

## Phase 2 · Platform work and site build (fidelity, storefront, PWA, SEO)

**Goals:** `saito build date-el-gusto` produces a static site that is indistinguishable from the prototype, built only from reusable platform parts.

**Inputs:** the Phase 1 template, site config and fidelity map, `packages/components`, `packages/core/src/schema`, and the prototype's JS modules (`js/store.js`, `services.js`, `utils.js`, `ui.js`, `app.js`, and `components/menu.js`, `order.js`, `pwa.js`, `site.js`).

**Outputs:** new platform code (schema fields, component variants, web components, theme tokens and tests), local assets under `sites/date-el-gusto/public/`, and a passing build. Module boundaries and build order: see the capability map.

> The renderer is one Astro project for all sites. Do **not** fork it or add site-specific Astro pages. Missing behaviour goes into the platform: a schema field, a component variant, the Studio schema and `docs/CONFIGURATION.md`, so every site can use it.

### 2.1 Visual fidelity (component variants and theme tokens)

Each prototype pattern becomes an opt-in, reusable feature. The fields below are candidates; the `visual-variants` module spec fixes the names.

| Pattern in the prototype | Candidate platform feature | Where |
|---|---|---|
| Dish marquee (auto-scroll, pauses on hover, respects reduced motion) | `gallery` layout `marquee` | `sections.ts`, `Gallery.astro` |
| Masonry photo grid | `gallery` layout `masonry` | `sections.ts`, `Gallery.astro` |
| Offset colour slab behind images (sage, tangerine) | A media decoration option on `richText`/media sections, colour from theme | `sections.ts`, `RichText.astro` |
| Heading accent bars and line doodles | Section heading decoration option | shared heading component in `packages/components/src/ui/` |
| Price burst badge (rotated star) | Badge option on `menu`/`cta` items | `Menu.astro`, `Cta.astro` |
| Scroll reveal (`.rv`) | Site-wide opt-in motion token, disabled under `prefers-reduced-motion` | theme schema, `global.css`, `SiteLayout.astro` |
| Review carousel (3 / 2 / 88% per view, scroll snap) | `testimonials` layout `carousel` | `Testimonials.astro` (optional section, D7) |
| Image-background bands with scrim (pedir, reservas) | `cta` layout `image-background` | `Cta.astro` |
| Pill buttons with soft cards | Per-role radius tokens (button vs card) | theme schema, `themeToCss()` |
| Script display font for headings and logo | Existing `fonts.heading` (Dancing Script) | — |

- [ ] Implement each row as a schema field plus component support, with defaults that leave existing sites unchanged.
- [ ] Mirror every new field in `apps/studio/schemaTypes/index.ts` and keep `seed.test.ts` round-tripping.
- [ ] Document every new field in `docs/CONFIGURATION.md`.
- [ ] Use the new fields from the `family-kitchen@1` template, not from the site config.

### 2.2 Pages and assets (site)

- [ ] Keep a single page (`pages.index`); the template's order already matches the prototype.
- [ ] Header CTA and nav links as in the prototype (Nosotros, Menú, Contacto, Pedir por WhatsApp → `#menu`).
- [ ] Set `brand.logo` (the prototype's `icons/mark.svg`, copied to `public/images/logo.svg`) and `brand.favicon: /favicon.svg`.
- [ ] Download the hotlinked Unsplash images (27 in `index.html`, 9 in `data.js`, some shared) into `sites/date-el-gusto/public/images/` and rewrite every `src` to `/images/<file>`.
- [ ] Move `icons/*` (except `generate.sh`) into `sites/date-el-gusto/public/icons/` and `icons/favicon.svg` into `public/`.
- [ ] Commit `public/`: deploy-hook builds clone the repo, so assets that exist only locally are missing from CMS-triggered deploys.
- [ ] Keep explicit `width` and `height` on every image, to avoid layout shift.
- [ ] Check total image weight. Hero under 250 KB and cards under 80 KB (WebP or AVIF).

### 2.3 WhatsApp storefront (platform commerce provider, D2)

Saito's `commerce` integration only supports `snipcart`, `shopify` and `commerce-layer`. Adding `whatsapp` touches these places:

- [ ] **Schema** (`packages/core/src/schema/site.ts`): add `{ provider: 'whatsapp', phone, currency, orderIdPrefix, maxQty, location: { enabled, center, zoom } }` to the `commerce` discriminated union. The phone number is public because it goes into the `wa.me` link.
- [ ] **Menu items** (`packages/core/src/schema/sections.ts`): add optional `image` and `ingredients: string[]` (removable ingredients).
- [ ] **Component** (`packages/components/src/web/whatsapp-cart.ts`, modelled on `contact-form.ts`): port the cart store (`store.js`), product dialog, cart bar and cart dialog with "Seguir Comprando" (`components/order.js`), location picker, `buildMessage`, `waUrl` and `orderId`. Keep Leaflet 1.9.4 lazy-loaded with SRI exactly as in `services.js`.
- [ ] **Menu.astro**: `canOrder` is `provider === 'snipcart'` today; make it true for `whatsapp` too, render item images, and emit the product data with `jsonForScript`.
- [ ] **UI copy:** the prototype's ~60 Spanish strings (`data.text`) need a home. Add `es` locale strings to the component, or a site-level `ui` override. Section components also hard-code English labels (for example Contact's "Address" and "Opening hours"), so solve both together.
- [ ] **Security header:** `writeEdgeArtifacts` sends `Permissions-Policy: geolocation=()`, which **blocks the map pin's "use my location"**. Allow `geolocation=(self)` when `commerce.location.enabled` is true.
- [ ] **Tests:** move the prototype's `?sf-selftest` assertions (in `js/app.js`: message format, `wa.me` URL, order-id format, line merge) into vitest.
- [ ] **Studio and seed:** add the new fields to `apps/studio/schemaTypes/index.ts` and keep `seed.test.ts` round-tripping.
- [ ] **Docs:** add the integration and the new menu fields to `docs/CONFIGURATION.md`.

### 2.4 PWA (platform feature, D3; first to cut)

`Head.astro` emits no manifest, `theme-color`, apple-touch-icon or splash links, and nothing registers a service worker.

- [ ] Copy `manifest.webmanifest` (renamed to "Date El Gusto"), `sw.js` and `offline.html` into `sites/date-el-gusto/public/`. Paths stay root-relative, so scope is `/`.
- [ ] Add an optional `brand.pwa` block to the schema (`manifest`, `themeColor`, `appleTouchIcon`, `splash[]`) and render the tags in `Head.astro`.
- [ ] Port `<app-install>` and `<offline-notice>` (`components/pwa.js`) into `packages/components/src/web/` and register `sw.js` only when `brand.pwa` is set.
- [ ] Bump `CACHE` in `sw.js` (currently `date-gusto-offline-v2`) whenever `offline.html` changes.
- [ ] Add a `_headers` rule so browsers always revalidate `/sw.js` (`Cache-Control: no-cache`).

### 2.5 SEO and indexing

- [ ] Set `environments.staging.url: https://staging.saito-date-el-gusto.pages.dev` and `environments.production.url: https://saito-date-el-gusto.pages.dev`. Canonical links, `og:url`, the sitemap and robots all use them.
- [ ] Set `seo.noindex: true`: the demo must not be discoverable, production included.
- [ ] **Platform fix:** in `writeEdgeArtifacts` (`packages/cli/src/build.ts:46`), also send `X-Robots-Tag: noindex` when `seo.noindex` is true, with a test.
- [ ] Keep `seo.titleTemplate`, the page `title` and `description`, and `seo.schemaType: Restaurant`.
- [ ] Set `seo.defaultImage` (a 1200×630 share image under `public/images/`) so shared demo links preview well.
- [ ] Check that the Restaurant JSON-LD includes the address, telephone, opening hours and `servesCuisine`. Extend `Head.astro` if it does not.
- [ ] Set `lang="es"` (from `locale: es-GT`) and use real alt text on every image.

### Tasks to verify

- [ ] `npm test`, `npm run typecheck` and `npm run saito -- validate --all` are green (there is no CI, so run them by hand). Existing sites still validate and build unchanged.
- [ ] `npm run saito -- dev date-el-gusto` renders at `http://localhost:4321`.
- [ ] `./deploy.sh local date-el-gusto` builds `dist/development/date-el-gusto/` (with `_headers` and `saito-manifest.json`) and serves it with `astro preview` on `:4321`.
- [ ] **Side-by-side check** (chrome-devtools MCP): screenshots of the prototype and the Saito build at 390 px and 1280 px, section by section, reviewed together.
- [ ] Interaction check at both widths: add to cart, remove an ingredient, "Seguir Comprando", map pin with "use my location", open WhatsApp, marquee pause on hover, scroll reveal, reduced motion, install button on mobile emulation, and offline page.
- [ ] Lighthouse mobile score of 90 or more for Performance, Accessibility and Best Practices. (SEO is expected to flag `noindex`; that is intended.)

### Acceptance criteria

- A stakeholder cannot tell the prototype and the Saito build apart side by side at 390 px and 1280 px, and every interaction behaves the same.
- No section is site-specific Astro code, and every new behaviour is a documented, reusable schema field or web component.
- An order placed on staging opens `https://wa.me/50245393659?text=…`, and the text is identical to the prototype's for the same cart.
- No hotlinked images remain (`grep -r unsplash sites/date-el-gusto` is empty).
- Tests cover the order message, the order id, the schema additions and the `noindex` header.

---

## Phase 3 · Studio setup and content models

**Goals:** every field the demo shows can be edited in the existing Studio, and publishing rebuilds the site.

**Inputs:** the existing Saito Sanity project and Studio, `apps/studio`, and the schema changes from Phase 2.

**Outputs:** `staging` and `production` datasets ready, the Studio schema updated and redeployed.

### Content model (what the editor can change)

| Document | Scoped by | Holds | Notes |
|---|---|---|---|
| `page` | `site` = `date-el-gusto`, `slug` | Page `title`, `description`, `enabled`, and `sections[]`, each with a `sectionId` | A `sectionId` that matches a template section overrides it; a new one adds a section |
| `siteSettings` | `site` | `navigation`, `footer` and `seo` | `theme`, `integrations` and `environments` stay in YAML on purpose (developer-owned) |
| Section objects | — | hero, features, richText, gallery, menu, contact, cta and others, plus the Phase 2 variant fields | Must mirror the zod schemas in `packages/core/src/schema/sections.ts` |

### Tasks

- [ ] Confirm the existing project has public `staging` and `production` datasets (`npx sanity dataset list`), and create any that are missing. Without a `development` dataset, set `SANITY_DATASET=staging` for local Sanity builds.
- [ ] `cd apps/studio && npm install` (the Studio is deliberately not an npm workspace).
- [ ] Keep `deployment.appId` in `apps/studio/sanity.cli.ts`: the demo deploys into the existing Studio.
- [ ] Set `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASETS=staging,production` and `SANITY_STUDIO_HOSTNAME` in `apps/studio/.env` (the Sanity CLI reads only that file).
- [ ] Add the Phase 2 fields to the Studio schema: menu item `image` and `ingredients` (plus the existing `orderable` and `id`), and every new variant field from §2.1.
- [ ] Optional: in `structure.ts`, add a "Date El Gusto" desk filtered to `site == "date-el-gusto"` so the demo shows only this site's documents.
- [ ] Have an **Editor** token for `saito seed` in the root `.env` (developer only).
- [ ] Redeploy the Studio: `cd apps/studio && npx sanity deploy`.

### Acceptance criteria

- The Studio loads at `https://saito-builder.sanity.studio`, with `staging` and `production` workspaces.
- Every field the demo edits (a price, a dish, a photo, the daily lunch, a section's visibility) is editable, with validation (required fields, kebab-case `sectionId`, price ≥ 0).
- `npx vitest run packages/core/test/seed.test.ts` passes, confirming the Studio shape still round-trips with the site config.

---

## Phase 4 · Content migration

**Goals:** the site's content lives in Sanity (staging first, then production), and the Sanity-sourced build matches the local build.

**Inputs:** the finished Phase 2 site config and the Phase 3 datasets and token. Content is the prototype's fictional content.

**Outputs:** seeded `staging` and `production` datasets, images in Sanity's asset CDN, and a diff showing both builds match.

### Tasks

- [ ] Dry run: `npx tsx --env-file=.env packages/cli/src/index.ts seed date-el-gusto --env staging --dry-run`.
- [ ] Seed staging: the same command without `--dry-run`. It needs `SANITY_WRITE_TOKEN` in the root `.env` only, never in `environments/date-el-gusto/*.env` or the Pages project variables (both feed builds). Add `--overwrite` only when you intend to replace edited documents.
- [ ] Build from Sanity: `SAITO_CONTENT_SOURCE=sanity SANITY_PROJECT_ID=<id> npm run saito -- build date-el-gusto --env staging`.
- [ ] Diff it against the local build: `diff -r` of the two `dist/staging/date-el-gusto` outputs, ignoring `/_astro/` hashes. Only image URLs should differ.
- [ ] Promote: `npx sanity dataset copy staging production`, or seed with `--env production`.
- [ ] After migration, follow the golden rule (README, "Content publishing"): Sanity owns editable content, YAML owns structure, theme and integrations. Record that in the site config header, and never run `seed --overwrite` from a build.

### Acceptance criteria

- The staging site built with `SAITO_CONTENT_SOURCE=sanity` matches the local build section by section.
- No Unsplash URLs remain in either dataset.

---

## Phase 5 · Cloudflare Pages project

**Goals:** a Git-connected Pages project in the existing Cloudflare account serves staging and production with Saito's `_headers`, and exposes the two deploy hooks Sanity will call.

**Inputs:** the existing Cloudflare account and repository access for the Cloudflare GitHub app. README "Cloudflare Pages setup (per site)" is the reference.

**Outputs:** the Pages project `saito-date-el-gusto`, two deploy hooks, an API token, and a rollback procedure.

### Tasks

- [ ] Create the project **connected to the GitHub repo** (Workers & Pages → Create → Pages → Connect to Git), named `saito-date-el-gusto`. Do **not** create it with `wrangler pages project create`: that makes a Direct Upload project, which has no deploy hooks and cannot be converted.
- [ ] Build settings: build command `./scripts/pages-build.sh date-el-gusto`, output directory `dist/pages`, root directory `/`.
- [ ] Variables: Production `SAITO_ENV=production`; Preview `SAITO_ENV=staging`; both `SAITO_CONTENT_SOURCE=sanity`, `SANITY_PROJECT_ID=<id>`, `NODE_VERSION=22`.
- [ ] Turn automatic deployments off (Settings → Builds → Branch control): uncheck automatic production deployments and set preview branches to None, so a `git push` deploys nothing.
- [ ] Create two deploy hooks: one on branch `main` (production), one on branch `staging` (preview). Store the URLs in the password manager; they are secrets.
- [ ] Create or reuse the API token for `./deploy.sh` (My Profile → API Tokens): **Account · Cloudflare Pages · Edit**, scoped to this account only. Wrangler Direct Upload works against the Git-connected project.
- [ ] Branch mapping: production → branch `main` → `https://saito-date-el-gusto.pages.dev`; staging → branch `staging` → `https://staging.saito-date-el-gusto.pages.dev`. Both `./deploy.sh` and the hooks use it.
- [ ] Document rollback: Pages → Deployments → *Rollback to this deployment* (instant), or check out the older commit and run `./deploy.sh production date-el-gusto`.

### Acceptance criteria

- Both URLs serve over TLS and are publicly reachable without a login.
- `curl -I` on **both** URLs shows the security headers and `X-Robots-Tag: noindex`; `robots.txt` disallows all on both.
- `/_astro/*` is served with `Cache-Control: public, max-age=31536000, immutable`; HTML uses `max-age=0, s-maxage=3600`.
- On production, the "use my location" map pin works (the geolocation policy is allowed), the service worker registers, and the install prompt appears on Android.
- A rollback has been rehearsed once.

---

## Phase 6 · Deploy workflow (`./deploy.sh`, env files and Sanity webhooks)

**Goals:** code and YAML changes reach staging and production with `./deploy.sh`; a Studio publish rebuilds just this site through its deploy hook, immediately (D6).

**Inputs:** `deploy.sh`, `scripts/deploy.sh`, `scripts/pages-build.sh` (no changes needed), the Phase 5 project, hooks and API token.

**Outputs:** filled env files, a first staging and production deploy, and two enabled Sanity webhooks.

### Tasks

- [ ] Fill `environments/date-el-gusto/.staging.env` and `.prod.env` (git-ignored; copy the layout from `.env.example`): `DEPLOY_PROVIDER=cloudflare-pages`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `SAITO_CONTENT_SOURCE=sanity` and `SANITY_PROJECT_ID`. `./deploy.sh` sets `SAITO_ENV` from its target. Optional `.local.env` for `./deploy.sh local`.
- [ ] Run the checks by hand before every deploy: `npm test && npm run typecheck && npm run saito -- validate --all`.
- [ ] Check `saito affected`: a change under `sites/date-el-gusto/**` must list `date-el-gusto`, and a change under `packages/templates/src/family-kitchen/**` must list every site on that template (`git diff --name-only main | npm run saito -- affected`). Platform changes list every site.
- [ ] First staging deploy: `./deploy.sh staging date-el-gusto`.
- [ ] Production deploy: `./deploy.sh production date-el-gusto` (type `production` to confirm, or pass `--yes` when not in a terminal).
- [ ] Push the code before relying on hooks: hook builds clone GitHub, using `main` for production and `staging` for preview. After merging, run `git push origin main:staging` so staging content builds pick up the new code. A publish on an outdated branch replaces a newer `./deploy.sh` deployment with older code.
- [ ] Create **two Sanity webhooks** (sanity.io/manage → API → Webhooks), one per dataset, **both enabled**:
  - URL: the matching deploy hook (`staging` dataset → `staging` hook, `production` dataset → `main` hook), method `POST`
  - Dataset: `staging` (or `production`). Trigger on create, update and delete. Leave drafts unchecked.
  - Filter: `_type in ["page","siteSettings"] && site == "date-el-gusto"`
  - No projection and no extra headers

### Acceptance criteria

- `./deploy.sh staging date-el-gusto` finishes with a Cloudflare deployment URL, and `./deploy.sh production date-el-gusto` stops without the typed confirmation.
- A publish in the Studio's `staging` workspace starts a Pages build for `date-el-gusto` within a minute, and no other site's project builds.
- A publish in the `production` workspace is live on `saito-date-el-gusto.pages.dev` in about 2–3 minutes, with no approval step.
- A publish to another site's documents does not trigger this site's hook.
- No secret appears in git, the build logs or `dist/` (`git status` shows no env file; `grep -r` for the token prefixes finds nothing).

---

## Phase 7 · Stakeholder demo

**Goals:** stakeholders see Saito take a prototype to a live, editable, orderable site, and see the next site come from YAML alone.

**Inputs:** the deployed staging and production sites, the Studio, the prototype (local or via `npm run live-template`), and a phone with WhatsApp.

**Outputs:** a rehearsed demo script and a go/no-go on pitching the restaurant.

### Demo script

1. **Side by side:** the prototype next to `saito-date-el-gusto.pages.dev` at phone and desktop width.
2. **The factory:** open `sites/date-el-gusto/site.config.yaml` and show that the whole site is one thin YAML on `family-kitchen@1`; scaffold a second site with `saito create … --template family-kitchen` and validate it.
3. **Order:** on a phone, add a dish, remove an ingredient, set the map pin, and send. The message `Pedido: DG-YYMMDD-XXXXX` arrives on `+502 4539 3659`.
4. **Edit and publish:** change a price or the daily lunch in the Studio's **Production** workspace, click **Publish**, and reload the live site about 2–3 minutes later. Only this site rebuilds.
5. **PWA** (if shipped): install the app on Android and open it offline.

### Tasks

- [ ] Rehearse the script once end to end on production, and time the publish → live step.
- [ ] Prepare a fallback for step 4 (a pre-recorded run) in case the Pages build queue is slow.
- [ ] After the demo, reset any demo edits in Sanity, or reseed staging and production.

### Acceptance criteria

- The rehearsal ran every step without a manual fix.
- The publish → live time is measured and stated in the demo.

---

## Before a real client

Out of scope for the showcase. Do these only when the restaurant signs.

- [ ] **Content:** real photos, email, reviews, hours, prices and products; remove the "Prototipo con contenido ficticio" footer; confirm the brand name and the WhatsApp Business number with the client.
- [ ] **Domain (D4):** register the domain (client-owned registrar recommended), put it on Cloudflare DNS, add the apex and/or `www` as Pages custom domains, add a `www` ↔ apex Redirect Rule (Saito does not generate redirects), and optionally `staging.<domain>`.
- [ ] **URLs and indexing:** set `environments.*.url` to the domain, remove `seo.noindex` so production becomes indexable, and redeploy.
- [ ] **Email:** forward `hola@<domain>` with Cloudflare Email Routing.
- [ ] **Publishing control (D6):** decide whether the client publishes straight to production or edits only `staging` while the agency promotes.
- [ ] **Studio:** invite the client with the **Editor** role, not Administrator; decide whether a dedicated Sanity project and Studio is needed (then remove the hard-coded `appId`).
- [ ] **Handoff:** a Spanish editing guide (changing a price, adding or removing a dish, marking a dish unavailable, replacing a photo with alt text, changing hours, editing the daily lunch, hiding or showing a section), a list of what only the developer changes (theme, fonts, WhatsApp number, domain, integrations), and a 30-minute walkthrough on staging.
- [ ] **Ownership and credentials:** registrar, Cloudflare (or the client as a member), Sanity, WhatsApp Business; record the deploy hook URLs, the Cloudflare token and the Sanity tokens in the password manager, plus which machines hold `environments/date-el-gusto/*.env`. Agree the support SLA and who rotates tokens and hooks.
- [ ] **Optional:** analytics (Cloudflare Web Analytics, Plausible or GA4), the contact form (`integrations.forms` plus hosting `apps/api`), uptime monitoring, a commercial map tile provider instead of OSM, a real booking flow for Reservas, and live visual editing (D8).

---

## Environment variables

Nothing loads the root `.env` automatically. Use exported variables, or `npx tsx --env-file=.env packages/cli/src/index.ts …`. `./deploy.sh` loads `environments/date-el-gusto/.<local|staging|prod>.env` itself. Pages hook builds have no env files; they use the project variables.

| Variable | Local (`development`) | Preview (`staging`) | Production | Used by | Stored in | Public? |
|---|---|---|---|---|---|---|
| `SAITO_ENV` | `development` (default) | `staging` | `production` | CLI and renderer: picks the env URL, `noindex`, the dataset default | Set by `./deploy.sh` from its target; Pages variables (Preview / Production) | Public |
| `SAITO_CONTENT_SOURCE` | `local`, or `sanity` to test the CMS | `sanity` | `sanity` | `contentSourceFromEnv` (`packages/core/src/content/index.ts`) | `.env`, env files, Pages variables | Public |
| `SANITY_PROJECT_ID` | project id | same | same | Content source and `saito seed` | `.env`, env files, Pages variables | Public (it appears in API URLs) |
| `SANITY_DATASET` | unset, or `staging` if there is no `development` dataset | unset (defaults to `staging`) | unset (defaults to `production`) | Content source and seed | `.env` only | Public |
| `SANITY_API_VERSION` | `2025-01-01` | default | default | Content source and seed | `.env` | Public |
| `SANITY_READ_TOKEN` | not needed (public datasets) | not needed | not needed | Content source (private datasets / drafts) | — | **Private** |
| `SANITY_WRITE_TOKEN` | Editor token, only while seeding | — never in builds | — never in builds | `saito seed` (`packages/cli/src/seed.ts`) | Root `.env` + password manager | **Private** |
| `NODE_VERSION` | — | `22` | `22` | Cloudflare Pages build image | Pages variables | Public |
| `SAITO_SITE`, `SAITO_ROOT`, `SAITO_OUT_DIR` | set by the CLI | set by the CLI | set by the CLI | `apps/renderer/astro.config.ts` | — (internal, do not set) | Public |
| `DEPLOY_PROVIDER` | — | `cloudflare-pages` | `cloudflare-pages` | `./deploy.sh` → `scripts/deploy.sh` (unset or `none` fails) | `.staging.env`, `.prod.env` | Public |
| `CLOUDFLARE_ACCOUNT_ID` | — | account id | account id | wrangler (`scripts/deploy.sh`) | `.staging.env`, `.prod.env` | Public (not a credential) |
| `CLOUDFLARE_API_TOKEN` | — | Pages:Edit token | same | wrangler (`scripts/deploy.sh`) | `.staging.env`, `.prod.env` | **Private** |
| `SANITY_STUDIO_PROJECT_ID` | project id | — | project id | `apps/studio/sanity.config.ts` and `sanity.cli.ts` | `apps/studio/.env` | Public (bundled into the Studio) |
| `SANITY_STUDIO_DATASETS` | `staging,production` | — | same | Studio workspaces (baked in at deploy) | `apps/studio/.env` | Public |
| `SANITY_STUDIO_HOSTNAME` | — | — | `saito-builder` | `sanity deploy` | `apps/studio/.env` | Public |
| `NO_COLOR` | optional | — | — | CLI output | Shell | Public |

**Not environment variables, but secrets to keep:**

| Value | Where it lives | Public? |
|---|---|---|
| Deploy hook URLs (`main`, `staging`) | Cloudflare Pages project, the two Sanity webhooks, and the password manager | **Private** (anyone with the URL can trigger builds) |
| Cloudflare account login | Password manager | **Private** |
| WhatsApp number, map centre, site URLs | `site.config.yaml` (rendered into the page) | Public by design |

Unused by the demo: `API_PORT`, `API_HOST`, `API_DATA_DIR` (no contact form), `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID_*`, `AWS_*`, `S3_BUCKET_PREFIX` and `CLOUDFRONT_DISTRIBUTIONS`. Leave them unset.

---

## Third-party services, keys, webhooks and deployment dependencies

| Service | Purpose | Account | Keys / config | Cost at this scale |
|---|---|---|---|---|
| GitHub | Repository; Pages clones it for hook builds (no Actions) | Existing | Cloudflare GitHub app access; `main` and `staging` branches | Free |
| Cloudflare Pages | Hosting and CDN (`saito-date-el-gusto`, Git-connected) | Existing (hosts `saito-acme-corp`) | Account id, API token (Pages:Edit), 2 deploy hooks, project variables | Free (500 builds/month) |
| Sanity | CMS, image CDN, Studio hosting | Existing Saito project | Project id, Editor token (seed only), 2 webhooks | Free plan (see `FIN-V2.MD` for seat limits) |
| WhatsApp | Order hand-off via `wa.me` | Team-controlled number | Phone `+502 4539 3659` | Free |
| OpenStreetMap tiles + Leaflet (unpkg, SRI-pinned 1.9.4) | Delivery map pin | — | None; attribution required. Fine at demo traffic | Free |
| Google Fonts | Dancing Script, Figtree | — | None | Free |
| npm registry | `npm ci` in Pages builds, `npx wrangler@3` | — | None | Free |

**Webhooks:** Sanity `staging` → Pages `staging` deploy hook, and Sanity `production` → Pages `main` deploy hook (Phase 6).
**URLs:** `https://saito-date-el-gusto.pages.dev` (production), `https://staging.saito-date-el-gusto.pages.dev` (staging), `https://saito-builder.sanity.studio` (Studio).
**Runtime and versions:** Node 22 in Pages builds (`NODE_VERSION`), Node 20.11 or later locally, wrangler 3 (pinned in `scripts/deploy.sh`), and Astro 5, Vitest 3, Zod 3 and TypeScript 5 (pinned in the repo).

---

## Missing components, integrations, automation, infrastructure and development work

Ordered by impact on the demo. Real-client gaps are in [Before a real client](#before-a-real-client).

| # | Gap | Type | Blocks the demo? | Where |
|---|---|---|---|---|
| 1 | No template carries the Tangerine design | Template | **Yes** | `packages/templates/src/family-kitchen/` |
| 2 | Visual patterns not renderable: marquee, masonry, colour slabs, heading accents and doodles, price burst, scroll reveal, image-background CTA bands, per-role radius | Development (components, theme) | **Yes** (fidelity is never cut) | `sections.ts`, `theme.ts`, `packages/components` |
| 3 | No WhatsApp ordering integration (cart, product dialog, ingredient removal, order id, `wa.me` message) | Development | **Yes** | `schema/site.ts`, `components/web/`, `Menu.astro` |
| 4 | Menu items lack `image` and `ingredients` in the schema, the Studio and seed | Development / CMS | **Yes**, with #3 | `sections.ts`, `apps/studio/schemaTypes`, `sanity-seed.ts` |
| 5 | `Permissions-Policy: geolocation=()` blocks the map pin's location lookup | Infrastructure (headers) | **Yes** | `packages/cli/src/build.ts` (`writeEdgeArtifacts`) |
| 6 | No UI-string localization: storefront copy is Spanish in `data.text`, and Contact labels are hard-coded in English | Development | **Yes** (Spanish site) | `packages/components` |
| 7 | `X-Robots-Tag` ignores `seo.noindex` on production | Infrastructure (headers) | **Yes** (demo must not be indexed) | `packages/cli/src/build.ts:46` |
| 8 | Site config is on `restaurant@1` and drifted from the prototype | Config | **Yes** | `sites/date-el-gusto/site.config.yaml` |
| 9 | No `staging` or `production` URLs in `environments` | Config | **Yes** | site config |
| 10 | Pages project `saito-date-el-gusto` does not exist (Git-connected, build settings, variables, auto deploys off, 2 hooks) | Infrastructure | **Yes** | Cloudflare |
| 11 | `environments/date-el-gusto/.staging.env` and `.prod.env` are empty, so `./deploy.sh` refuses staging and production | Automation | **Yes** | developer machine |
| 12 | Hotlinked Unsplash images; no `sites/date-el-gusto/public/` | Content | **Yes** | site `public/` |
| 13 | Sanity → deploy hook webhooks not created | Automation | **Yes** (the publish demo) | Sanity manage |
| 14 | No PWA support in `Head.astro` (manifest, theme-color, icons, splash, SW registration, install and offline components) | Development | No (first to cut) | `layout/Head.astro`, `components/web/` |
| 15 | Review carousel for the optional Testimonios section | Development | No (section off for this site) | `Testimonials.astro` |
| 16 | Hook builds use the code on GitHub (`main`, `staging`), not what `./deploy.sh` last uploaded; an unsynced branch rolls code back on the next publish | Process | No, but easy to get wrong | `git push origin main:staging` after merges |
| 17 | No CI: tests, typecheck and validation run only by hand; no PR previews | Automation | No (proof of concept) | — |
| 18 | Restaurant JSON-LD may lack hours and `servesCuisine` | SEO | No (`noindex` demo) | `Head.astro` |

### Suggested order of work

1. Phase 1: extract `family-kitchen@1` and rewrite the site config (#1, #8, #9).
2. Platform work, following the capability map: the noindex header fix (#7), visual variants (#2), storefront with menu fields, geolocation header and UI strings (#3–#6), each with vitest coverage and side-by-side checks.
3. Phase 3 (Studio schema for the new fields) alongside Phase 5 (Pages project, #10) and assets (#12).
4. Phase 6 (#11, #13, #16) → first staging deploy with `./deploy.sh staging date-el-gusto`.
5. Phase 4 migration → `./deploy.sh production date-el-gusto` → PWA (#14) if time allows → Phase 7 demo rehearsal.

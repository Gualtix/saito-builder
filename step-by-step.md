# Date El Gusto (Tangerine) → Saito → Cloudflare Pages: step-by-step

**Source:** `live-sketching/eatery-cafe/tangerine/tangerine-web-site/` (zero-build landing page, WhatsApp storefront and installable PWA)
**Target:** site `date-el-gusto` (tenant `date-el-gusto`) rendered by `apps/renderer` (Astro 5), content in Sanity (`apps/studio`), built by GitHub Actions, served by Cloudflare Pages.
**Environments:** `development` (local) · `staging` (the "preview" environment) · `production`.

---

## 0. Where things stand today

Already built, so the guide reuses these and does not recreate them:

| Piece | State | Location |
|---|---|---|
| Site config | Exists and validates (`✔ date-el-gusto restaurant@1.0.0 · 1 pages · 14 sections`), but it was extracted **before** the prototype got its storefront and PWA (see §1) | `sites/date-el-gusto/site.config.yaml` |
| Templates | `restaurant@1` (in use) and `casual-eatery@1` (Spanish, GTQ, orderable menu) | `packages/templates/src/` |
| Renderer | Astro, one project for every site; generates sitemap, robots, JSON-LD and `_headers` | `apps/renderer`, `packages/cli/src/build.ts` |
| CMS | Sanity Studio with `page` and `siteSettings` documents and one workspace per dataset | `apps/studio` |
| Content sync | `saito seed` (local → Sanity) and `sanityToOverlay` (Sanity → build) | `packages/core/src/content/` |
| CI | `ci.yml` runs tests, typecheck and validation, then builds the affected sites | `.github/workflows/ci.yml` |
| CD | `deploy.yml` deploys staging on push to `main`, production by manual dispatch, and content on `repository_dispatch` | `.github/workflows/deploy.yml` |
| Hosting adapter | `scripts/deploy.sh cloudflare-pages` → `wrangler pages deploy --project-name saito-<site>` | `scripts/deploy.sh` |

Decisions to make before Phase 2. Each one changes the work that follows:

- [ ] **D1 · Template:** stay on `restaurant@1` (the config already exists) or move to `casual-eatery@1`, which is closer in sections and language. *Recommendation:* stay on `restaurant@1` for v1, because changing template now means re-mapping every section.
- [ ] **D2 · Ordering:** port the WhatsApp storefront into Saito (§2.3, roughly the largest single task) or launch v1 with a "Pedir por WhatsApp" link and the static menu. *Recommendation:* port it; it is the site's primary conversion.
- [ ] **D3 · PWA:** keep "Instalar App", the service worker and the offline page in v1, or defer them.
- [ ] **D4 · Production domain** (for example `dateelgusto.com`) and who owns the registrar account (client or agency).
- [ ] **D5 · Staging access:** public but `noindex` (the default), or locked behind Cloudflare Access.
- [ ] **D6 · Content publish to production:** automatic on publish, or gated by the GitHub `production` environment reviewers (the gate also applies to CMS-triggered deploys, see §5).
- [ ] **D7 · Reservations, testimonials and catering:** they are hidden in the prototype. Remove them from v1 or launch them with real content.

---

## Phase 1 · Site analysis and template mapping

**Goals:** a section-by-section map from the *current* prototype onto Saito section types, and a list of what Saito cannot express yet.

**Inputs:** `tangerine-web-site/index.html`, `data.js`, `styles.css`, `manifest.webmanifest`, `js/`, the existing `sites/date-el-gusto/site.config.yaml` (its `x-extraction` block), and the `html-to-site-config` skill.

**Outputs:** an updated `x-extraction.mapping` and `x-extraction.gaps` in the site config, decisions D1–D7 recorded, and a list of missing platform features (feeds Phase 2).

### Drift between the prototype and the existing config

| Prototype now | Config today | Action |
|---|---|---|
| "Almuerzos del día" sits directly under the hero | Near the end of `order` | Move it to second in `pages.index.order` |
| `<menu-catalog>`: 9 products with id, price, image, description and removable ingredients, rendered from `data.js` | `categorias` gallery (4 photo tiles); `menu` page disabled "because no per-dish prices" | Replace with a `menu` section built from `data.js` products (prices now exist) |
| Storefront: product dialog, cart bar, cart dialog, map pin (Leaflet), order id, `wa.me` hand-off | None | New platform feature (§2.3) |
| Header "Instalar App" (`<app-install>`), `<offline-notice>`, `sw.js`, `offline.html`, manifest, icons, iOS splash screens | None | New platform feature (§2.4) |
| Reservas, Testimonios and Catering are `hidden` | Rendered | `sections.<id>: false` unless D7 says otherwise |
| "Pedir en línea" band links to the menu | `href: "#"` placeholder | Point it at `#menu` |
| Manifest name "Date Gusto" | Site name "Date El Gusto" | Confirm the brand name with the client |

### Tasks

- [ ] Re-run the `html-to-site-config` skill against the current `index.html`, or hand-edit the config using the drift table above.
- [ ] Record D1 in `x-extraction.template.reason`.
- [ ] Map each visible section to a type: hero → `hero (image-background)`; almuerzos → `menu`; marquee → `gallery`; value strip → `features`; nosotros and sabores → `richText`; menú → `menu` with `orderable: true` items; galería → `gallery`; pedir → `cta`; visítanos → `contact`.
- [ ] Mark the lossy patterns that stay lossy in v1: marquee animation, masonry layout, offset colour slabs, heading accent bars, line doodles, scroll reveal.
- [ ] Extract the theme tokens from `styles.css` `:root` (the current config already has tangerine `#e99b3f`, sage `#99bd76`, ink `#1c1a17`, Dancing Script and Figtree).
- [ ] Copy the business data from `data.js` into a review list for the client: name, WhatsApp number, currency `GTQ`, locale `es-GT`, map centre `[14.523, -90.759]`, order-id prefix `DG`, and all products.
- [ ] List the fictional content the client must replace: `hola@dateelgusto.example`, the reviews, the stock photos, and the "Prototipo con contenido ficticio" footer line.
- [ ] Run `npm run saito -- validate date-el-gusto` after every config edit.

### Acceptance criteria

- Every visible prototype section has a mapping row with a fidelity rating (`exact`, `lossy`, `unmapped` or `decorative`).
- Every `unmapped` row has either a Phase 2 task or a decision that drops it.
- `validate date-el-gusto --env production` passes.

---

## Phase 2 · Astro implementation (pages, layouts, components, assets, SEO)

**Goals:** `saito build date-el-gusto` produces a static site that matches the prototype's content and conversion paths, with production-grade SEO.

**Inputs:** the Phase 1 config and gap list, `packages/components`, `packages/core/src/schema`, and the prototype's JS modules (`store.js`, `services.js`, `components/menu.js`, `components/order.js` and `components/pwa.js`).

**Outputs:** the updated site config, new platform code (schema, components and tests), local assets under `sites/date-el-gusto/public/`, and a passing build.

> The renderer is one Astro project for all sites. Do **not** fork it or add site-specific Astro pages. Missing behaviour goes into the platform (schema, a component and the Studio schema) so every site can use it.

### 2.1 Pages and layout

- [ ] Keep a single page (`pages.index`) and set `order` to: hero, almuerzos, platillos-destacados, highlights, story, sabores, menu, galeria, pedir, visit.
- [ ] Remove the hidden sections (`reservas: false`, `testimonios: false`, `catering: false`, `catering-eventos: false`), or keep them per D7.
- [ ] Replace `categorias` (gallery) with a `menu` section (`anchor: menu`) whose items carry `id` and `orderable: true`.
- [ ] Decide what happens to the template's separate `menu` page. Keep `enabled: false` (single scroll, as in the prototype).
- [ ] Add the header CTA and nav links as in the prototype (Nosotros, Menú, Contacto, Pedir en línea → `#menu`).
- [ ] Set `brand.logo` (export the inline SVG mark to `public/images/logo.svg`) and `brand.favicon: /favicon.svg`.

### 2.2 Assets

- [ ] Download the 31 hotlinked Unsplash images into `sites/date-el-gusto/public/images/` and rewrite every `src` to `/images/<file>`. Better still, use the client's real photos.
- [ ] Move `icons/*` into `sites/date-el-gusto/public/icons/` and `favicon.svg` into `public/`.
- [ ] Keep explicit `width` and `height` on every image, to avoid layout shift.
- [ ] Check total image weight. Hero under 250 KB and cards under 80 KB (WebP or AVIF).

### 2.3 WhatsApp storefront (missing platform feature, D2)

Saito's `commerce` integration only supports `snipcart`, `shopify` and `commerce-layer`. Adding `whatsapp` touches these places:

- [ ] **Schema** (`packages/core/src/schema/site.ts`): add `{ provider: 'whatsapp', phone, currency, orderIdPrefix, maxQty, location: { enabled, center, zoom } }` to the `commerce` discriminated union. The phone number is public because it goes into the `wa.me` link.
- [ ] **Menu items** (`packages/core/src/schema/sections.ts`): add optional `image` and `ingredients: string[]` (removable ingredients).
- [ ] **Component** (`packages/components/src/web/whatsapp-cart.ts`, modelled on `contact-form.ts`): port the cart store, product dialog, cart bar and cart dialog, location picker, `buildMessage`, `waUrl` and `orderId`. Keep Leaflet 1.9.4 lazy-loaded with SRI exactly as in `services.js`.
- [ ] **Menu.astro**: make `canOrder` true for `whatsapp` too, render item images, and emit the product data with `jsonForScript`.
- [ ] **UI copy:** the prototype's ~60 Spanish strings (`data.text`) need a home. Add locale strings for `es` to the component, or a site-level `ui` override. Section components already hard-code English labels (for example Contact's "Address" and "Opening hours"), so solve both together.
- [ ] **Security header:** `writeEdgeArtifacts` sends `Permissions-Policy: geolocation=()`, which **blocks the map pin's "use my location"**. Allow `geolocation=(self)` when `commerce.location.enabled` is true.
- [ ] **Tests:** move the prototype's `?sf-selftest` assertions (message format, `wa.me` URL, order-id format, line merge) into vitest.
- [ ] **Studio and seed:** add the new fields to `apps/studio/schemaTypes/index.ts` and keep `seed.test.ts` round-tripping (§3).
- [ ] **Docs:** add the integration and the new menu fields to `docs/CONFIGURATION.md`.

### 2.4 PWA (missing platform feature, D3)

`Head.astro` emits no manifest, `theme-color`, apple-touch-icon or splash links, and nothing registers a service worker.

- [ ] Copy `manifest.webmanifest`, `sw.js` and `offline.html` into `sites/date-el-gusto/public/`. Paths stay root-relative, so scope is `/`.
- [ ] Add an optional `brand.pwa` block to the schema (`manifest`, `themeColor`, `appleTouchIcon`, `splash[]`) and render the tags in `Head.astro`.
- [ ] Port `<app-install>` and `<offline-notice>` into `packages/components/src/web/` and register `sw.js` only when `brand.pwa` is set.
- [ ] Bump `CACHE` in `sw.js` whenever `offline.html` changes.
- [ ] Add a `_headers` rule so browsers always revalidate `/sw.js` (`Cache-Control: no-cache`).

### 2.5 SEO

- [ ] Set `environments.staging.url` and `environments.production.url`. Canonical links, `og:url`, the sitemap and robots all use them.
- [ ] Keep `seo.titleTemplate`, the page `title` and `description`, and `seo.schemaType: Restaurant`.
- [ ] Set `seo.defaultImage` (a 1200×630 share image under `public/images/`).
- [ ] Check that the Restaurant JSON-LD includes the address, telephone, opening hours and `servesCuisine`. Extend `Head.astro` if it does not.
- [ ] Set `lang="es"` (from `locale: es-GT`) and use real alt text on every image.
- [ ] Confirm non-production builds are `noindex` (meta robots, `robots.txt` and `X-Robots-Tag`). This is built in, so verify only.
- [ ] Optional: add `integrations.analytics` (Plausible or GA4), or enable Cloudflare Web Analytics in the dashboard (needs no code).

### Tasks to verify

- [ ] `npm test` and `npm run typecheck` are green.
- [ ] `npm run saito -- dev date-el-gusto` renders at `http://localhost:4321`.
- [ ] `npm run saito -- build date-el-gusto --env staging` writes `dist/staging/date-el-gusto/` containing `_headers` and `saito-manifest.json`.
- [ ] Browser check (chrome-devtools MCP) at 390 px and 1280 px: add to cart, remove an ingredient, open WhatsApp with the correct message, map pin, install button on mobile emulation, and offline page.
- [ ] Lighthouse mobile score of 90 or more for Performance, Accessibility, Best Practices and SEO.

### Acceptance criteria

- All visible prototype sections render with the agreed fidelity, and no section is site-specific Astro code.
- An order placed on staging opens `https://wa.me/50245393659?text=…`, and the text is identical to the prototype's for the same cart.
- No hotlinked images remain (`grep -r unsplash sites/date-el-gusto` is empty, or the client has signed off on them).
- Tests cover the order message, the order id and the schema additions.

---

## Phase 3 · CMS/Studio setup and content models

**Goals:** the client edits copy, menu, prices, photos and hours in Sanity without touching YAML. Publishing rebuilds the site.

**Inputs:** a Sanity account, `apps/studio`, and the schema changes from §2.3 and §2.4.

**Outputs:** a Sanity project with `development`, `staging` and `production` datasets, a deployed Studio, tokens, CORS origins, and an editor account for the client.

### Content model (what the client can edit)

| Document | Scoped by | Holds | Notes |
|---|---|---|---|
| `page` | `site` = `date-el-gusto`, `slug` | Page `title`, `description`, `enabled`, and `sections[]`, each with a `sectionId` | A `sectionId` that matches a template section overrides it; a new one adds a section |
| `siteSettings` | `site` | `navigation`, `footer` and `seo` | `theme`, `integrations` and `environments` stay in YAML on purpose (developer-owned) |
| Section objects | — | hero, features, richText, gallery, menu, contact, cta and others | Must mirror the zod schemas in `packages/core/src/schema/sections.ts` |

### Tasks

- [ ] Create the Sanity project at sanity.io/manage and note its **project id**.
- [ ] Create the datasets: `npx sanity dataset create development`, then `staging`, then `production`. Choose the visibility: public needs no read token; private needs `SANITY_READ_TOKEN`.
- [ ] `cd apps/studio && npm install` (the Studio is deliberately not an npm workspace).
- [ ] **Fix `apps/studio/sanity.cli.ts`:** `deployment.appId` is hard-coded to an existing Studio (`saito-builder.sanity.studio`). Keep it if you deploy into that project, or remove it so `sanity deploy` creates a new app.
- [ ] Add the §2.3 fields to the Studio schema: menu item `image` and `ingredients`, plus `orderable` and `id`, which already exist.
- [ ] Decide whether menu prices are client-editable. Prices are read at render time and never stored in the cart, so edits take effect on the next build.
- [ ] Optional: in `structure.ts`, add a "Date El Gusto" desk filtered to `site == "date-el-gusto"` so the client only sees their own documents.
- [ ] Add CORS origins: `http://localhost:3333` (Studio dev) and the deployed Studio host. Allow credentials only for the Studio host.
- [ ] Create the tokens: **Viewer** (CI read, only needed if datasets are private) and **Editor** (developer-only, used by `saito seed`).
- [ ] Deploy the Studio: `SANITY_STUDIO_PROJECT_ID=<id> SANITY_STUDIO_HOSTNAME=<host> npx sanity deploy`.
- [ ] Invite the client with the **Editor** role, not Administrator.

### Acceptance criteria

- The Studio loads at `https://<host>.sanity.studio`, with a workspace for each dataset.
- Every field the client needs (Phase 7 list) is editable, with validation (required fields, kebab-case `sectionId`, price ≥ 0).
- `npx vitest run packages/core/test/seed.test.ts` passes, confirming the Studio shape still round-trips with the site config.

---

## Phase 4 · Content migration

**Goals:** the content in `site.config.yaml` and `data.js` lives in Sanity (staging first, then production), and the Sanity-sourced build matches the local build.

**Inputs:** the finished Phase 2 config, the Phase 3 project and tokens, and the client's real content (photos, reviews, email, hours, prices).

**Outputs:** seeded `staging` and `production` datasets, images in Sanity's asset CDN, and a sign-off diff.

### Tasks

- [ ] Replace the fictional content in YAML first: email, reviews (or drop them), footer legal line, real photos and the confirmed brand name.
- [ ] Move every product in `data.js` into the `menu` section (id, name, category, description, price, image, ingredients).
- [ ] Dry run: `SANITY_PROJECT_ID=<id> npm run saito -- seed date-el-gusto --env staging --dry-run`.
- [ ] Seed staging: `npx tsx --env-file=.env packages/cli/src/index.ts seed date-el-gusto --env staging`. This needs `SANITY_WRITE_TOKEN` in `.env`, never in CI. Add `--overwrite` only when you intend to replace edited documents.
- [ ] Build from Sanity: `SAITO_CONTENT_SOURCE=sanity SANITY_PROJECT_ID=<id> npm run saito -- build date-el-gusto --env staging`.
- [ ] Diff it against the local build: `diff -r` of the two `dist/staging/date-el-gusto` outputs, ignoring `/_astro/` hashes. Only image URLs should differ.
- [ ] Client reviews staging in the Studio and on the staging URL.
- [ ] Promote: `npx sanity dataset copy staging production`, or seed with `--env production`.
- [ ] After migration, treat Sanity as the source of truth for editable content. Record in the site config header that YAML holds only structure, theme and integrations for this site.

### Acceptance criteria

- The staging site built with `SAITO_CONTENT_SOURCE=sanity` matches the local build section by section.
- No Unsplash or placeholder URLs remain in either dataset.
- The client has signed off on the staging content.

---

## Phase 5 · GitHub Actions and CI/CD configuration

**Goals:** a PR runs the checks and builds the affected sites; merging to `main` deploys staging; production deploys by manual approval; a CMS publish redeploys just this site.

**Inputs:** `.github/workflows/ci.yml` and `deploy.yml` (no changes needed for the basic flow), plus the repository admin role.

**Outputs:** GitHub environments `staging` and `production` with their variables and secrets, and a working `repository_dispatch` from Sanity.

### Tasks

- [ ] Create the GitHub environments **`staging`** and **`production`**. Add required reviewers to `production`, and restrict it to the `main` branch.
- [ ] Add the repository **variables**: `DEPLOY_PROVIDER=cloudflare-pages`, `CLOUDFLARE_ACCOUNT_ID`, `SAITO_CONTENT_SOURCE=sanity` and `SANITY_PROJECT_ID`.
- [ ] Add the **secrets**, per environment: `CLOUDFLARE_API_TOKEN`, and `SANITY_READ_TOKEN` (only for private datasets).
- [ ] Create a **fine-grained GitHub PAT** for the Sanity webhook: this repository only, permission *Contents: Read and write* (which `repository_dispatch` requires), with an expiry date and a calendar reminder to rotate it.
- [ ] Create **two Sanity webhooks** (sanity.io/manage → API → Webhooks), one per dataset:
  - URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`, method `POST`
  - Dataset: `staging` (or `production`). Trigger on create, update and delete. Leave drafts unchecked.
  - Filter: `_type in ["page", "siteSettings"]`
  - Projection: `{"event_type": "content-published", "client_payload": {"site": site, "environment": "staging"}}` (use `"production"` on the production webhook)
  - Headers: `Authorization: Bearer <PAT>`, `Accept: application/vnd.github+json`
- [ ] Apply D6. The production `environment:` gate also pauses CMS-triggered production deploys until a reviewer approves. If the client should publish without waiting, either use a separate environment without reviewers for `repository_dispatch` runs, or accept the delay.
- [ ] Optional, not built yet: PR preview deploys. `ci.yml` uploads a staging build as an artifact but does not deploy it. To get per-PR URLs, add a step that runs `scripts/deploy.sh` with `--branch pr-<n>`.
- [ ] Check `saito affected`: a change under `sites/date-el-gusto/**` must list `date-el-gusto` (`git diff --name-only main | npm run saito -- affected --json`).

### Acceptance criteria

- A PR that touches the site shows green **Test, typecheck and validate** and **Build date-el-gusto** checks.
- A merge to `main` produces a `date-el-gusto → staging` job that finishes with a Cloudflare deployment URL.
- A publish in the Studio's `staging` workspace starts a `repository_dispatch` run for `date-el-gusto` within a minute.
- A production deploy waits for an approved reviewer, then deploys.
- No secret appears in logs or in `dist/` (`grep -r` for the token prefixes finds nothing).

---

## Phase 6 · Cloudflare Pages deployment

**Goals:** staging and production are served by Cloudflare Pages over HTTPS on the agreed domains, with Saito's `_headers` applied.

**Inputs:** a Cloudflare account, the domain (D4), and the GitHub configuration from Phase 5.

**Outputs:** the Pages project `saito-date-el-gusto`, a custom production domain, a staging URL, DNS, and a rollback procedure.

### Tasks

- [ ] Create the API token (My Profile → API Tokens): permission **Account · Cloudflare Pages · Edit**, scoped to this account only.
- [ ] Create the project. It must exist before CI runs, because wrangler cannot create it non-interactively:
  `npx wrangler@3 pages project create saito-date-el-gusto --production-branch main`
- [ ] Do **not** connect the Pages project to Git. GitHub Actions uploads pre-built output (Direct Upload), so Cloudflare must not build.
- [ ] Note the branch mapping in `deploy.sh`: production → branch `main` (production URL); staging → branch `staging`, an alias at `https://staging.saito-date-el-gusto.pages.dev`.
- [ ] Put the domain on Cloudflare DNS (registrar transfer, or nameserver change), or use a CNAME at the external DNS host for `www` only.
- [ ] Add the custom domains in Pages → Custom domains: apex `dateelgusto.com` (requires the zone on Cloudflare) and/or `www`.
- [ ] Add a redirect from `www` to the apex, or the reverse, with a Cloudflare Redirect Rule. Saito does not generate redirects.
- [ ] Optional staging domain: `staging.dateelgusto.com` as a CNAME to `staging.saito-date-el-gusto.pages.dev`.
- [ ] D5: if staging should be private, add a Cloudflare Access application for the staging hostname and `*.saito-date-el-gusto.pages.dev`.
- [ ] Set the matching URLs in `environments.staging.url` and `environments.production.url`, then redeploy.
- [ ] Optional: email forwarding for `hola@<domain>` via Cloudflare Email Routing (replaces the fictional address).
- [ ] Optional: enable Cloudflare Web Analytics for the project.
- [ ] Check the headers: `curl -I https://<domain>/` shows the security headers and no `X-Robots-Tag`; staging shows `X-Robots-Tag: noindex`.
- [ ] Document rollback: Pages → Deployments → *Rollback to this deployment* (instant), or re-run `deploy.yml` on an older commit.

### Acceptance criteria

- `https://<domain>` serves the production build over valid TLS, and `www` redirects.
- Staging is reachable at its URL and is `noindex`.
- `/_astro/*` is served with `Cache-Control: public, max-age=31536000, immutable`; HTML uses `max-age=0, s-maxage=3600`.
- On production, the "use my location" map pin works (the geolocation policy is allowed), the service worker registers, and the install prompt appears on Android.
- A rollback has been rehearsed once.

---

## Phase 7 · Client handoff and content editing workflow

**Goals:** the client can update the menu, prices, photos, hours and copy on their own, and knows what happens after each publish.

**Inputs:** the deployed Studio, the staging and production sites, and the client contact.

**Outputs:** the client's Editor account, a one-page editing guide (in Spanish), an ownership and credentials register, and a support agreement.

### Editing workflow to hand over

1. Edit in the Studio's **Staging** workspace → **Publish** → staging rebuilds in about 2–3 minutes → check `staging.<domain>`.
2. Repeat the change in the **Production** workspace, or ask the agency to promote it with a dataset copy → production rebuilds (after approval if D6 kept the gate).
3. Drafts are never published. Only **Publish** triggers a rebuild.

### Tasks

- [ ] Write a Spanish editing guide (screenshots, one page per task) covering changing a price, adding or removing a dish, marking a dish unavailable (`orderable: false`), replacing a photo with alt text, changing hours, editing the daily lunch, and hiding or showing a section (`page.sections` / `enabled`).
- [ ] List what the client *cannot* change in the Studio and who to ask: theme colours, fonts, the WhatsApp number, the domain, and integrations. These live in YAML and are developer-owned.
- [ ] Hand over ownership: the domain registrar, the Cloudflare account (or the client as a member), the Sanity project (the client as Administrator or the agency as Administrator, per contract), and the WhatsApp Business number.
- [ ] Record every credential in the shared password manager: PAT expiry, Cloudflare token, Sanity tokens.
- [ ] Train the client in a 30-minute walkthrough on staging, where they make one real edit end to end.
- [ ] Explain how WhatsApp orders work: an order arrives as a message headed `Pedido: DG-YYMMDD-XXXXX`. Payment and delivery are arranged in the chat; nothing is stored on the website.
- [ ] Agree the support SLA, and who rotates the PAT and tokens.

### Acceptance criteria

- The client made and published one change on their own and saw it on staging, then on production.
- The ownership and credentials register is complete and stored in the agency's password manager.
- The client confirms they received the editing guide and know their support contact.

---

## Environment variables

Nothing loads `.env` automatically. Use exported variables, or `npx tsx --env-file=.env packages/cli/src/index.ts …`.

| Variable | Local (`development`) | Preview (`staging`) | Production | Used by | Stored in | Public? |
|---|---|---|---|---|---|---|
| `SAITO_ENV` | `development` (default) | `staging` | `production` | CLI and renderer: picks the env URL, `noindex`, the dataset default | Shell / set by `deploy.yml` | Public |
| `SAITO_CONTENT_SOURCE` | `local`, or `sanity` to test the CMS | `sanity` | `sanity` | `contentSourceFromEnv` (`packages/core/src/content/index.ts`) | `.env` / GitHub variable | Public |
| `SANITY_PROJECT_ID` | project id | same | same | Renderer content source and `saito seed` | `.env` / GitHub variable | Public (it appears in API URLs) |
| `SANITY_DATASET` | `development` | unset (defaults to `staging`) | unset (defaults to `production`) | Content source and seed | `.env` only | Public |
| `SANITY_API_VERSION` | `2025-01-01` | default | default | Content source and seed | `.env` | Public |
| `SANITY_READ_TOKEN` | only if datasets are private | same | same | Content source (private datasets / drafts) | `.env` / GitHub **secret** (per environment) | **Private** |
| `SANITY_WRITE_TOKEN` | Editor token, only while seeding | — never in CI | — never in CI | `saito seed` (`packages/cli/src/seed.ts`) | Developer `.env` + password manager | **Private** |
| `SAITO_SITE`, `SAITO_ROOT`, `SAITO_OUT_DIR` | set by the CLI | set by the CLI | set by the CLI | `apps/renderer/astro.config.ts` | — (internal, do not set) | Public |
| `DEPLOY_PROVIDER` | — | `cloudflare-pages` | `cloudflare-pages` | `scripts/deploy.sh` | GitHub variable | Public |
| `CLOUDFLARE_ACCOUNT_ID` | only for a manual `wrangler` deploy | account id | account id | wrangler (`deploy.sh`) | GitHub variable | Public (not a credential) |
| `CLOUDFLARE_API_TOKEN` | only for a manual deploy | Pages:Edit token | same, or a separate token | wrangler (`deploy.sh`) | GitHub **secret** (per environment) | **Private** |
| `SANITY_STUDIO_PROJECT_ID` | project id | — | project id | `apps/studio/sanity.config.ts` and `sanity.cli.ts` | Shell when running `sanity dev` / `sanity deploy` | Public (bundled into the Studio) |
| `SANITY_STUDIO_DATASETS` | `development,staging,production` | — | same | Studio workspaces | Shell / `apps/studio/.env` | Public |
| `SANITY_STUDIO_HOSTNAME` | — | — | `<host>` for `<host>.sanity.studio` | `sanity deploy` | Shell | Public |
| `API_PORT`, `API_HOST`, `API_DATA_DIR` | `8787`, `0.0.0.0`, `apps/api/data` | — | — | `apps/api` (forms only) | `.env` | Public |
| `NO_COLOR` | optional | — | — | CLI output | Shell | Public |

**Not environment variables, but secrets to keep:**

| Value | Where it lives | Public? |
|---|---|---|
| GitHub fine-grained PAT (Contents: write) | Sanity webhook `Authorization` header and the password manager | **Private** |
| Cloudflare account login, registrar login | Password manager | **Private** |
| WhatsApp number, analytics id, map centre, site URLs | `site.config.yaml` (rendered into the page) | Public by design |

Unused by this site: `NETLIFY_AUTH_TOKEN`, `AWS_*`, `S3_BUCKET_PREFIX` and `CLOUDFRONT_DISTRIBUTIONS`. Leave them unset. The forms `webhookUrl` and `notifyEmail` are only needed if the contact form is enabled (see the gaps below).

---

## Third-party services, keys, domains, webhooks and deployment dependencies

| Service | Purpose | Account owner | Keys / config | Cost at this scale |
|---|---|---|---|---|
| GitHub | Repo, Actions, environments | Agency | Variables, secrets, PAT for the webhook | Free |
| Cloudflare Pages | Hosting and CDN (`saito-date-el-gusto`) | Agency or client (D4) | Account id, API token (Pages:Edit) | Free |
| Cloudflare DNS / Registrar | Domain, TLS, redirects | Client (recommended) | Zone for `<domain>` | ≈ $10/yr for a `.com` |
| Cloudflare Access *(optional)* | Private staging | Agency | Access app and policy | Free up to 50 users |
| Cloudflare Email Routing *(optional)* | `hola@<domain>` forwarding | Client | MX records | Free |
| Sanity | CMS, image CDN, Studio hosting | Agency or client | Project id, Viewer/Editor tokens, CORS, 2 webhooks | Free plan (see `FIN-V2.MD` for seat limits) |
| WhatsApp (Business app) | Order hand-off via `wa.me` | Client | Phone `+502 4539 3659` (to confirm) | Free |
| OpenStreetMap tiles + Leaflet (unpkg, SRI-pinned 1.9.4) | Delivery map pin | — | None; attribution required. The OSM tile policy forbids heavy commercial use, so move to a tile provider if traffic grows | Free |
| Google Fonts | Dancing Script, Figtree | — | None | Free |
| Analytics *(optional)* | Cloudflare Web Analytics, Plausible or GA4 | Client | `integrations.analytics.id` | Free / $9 per month |
| npm registry | `npm ci`, `npx wrangler@3` | — | None | Free |

**Webhooks:** Sanity `staging` → GitHub `repository_dispatch`, and Sanity `production` → GitHub `repository_dispatch` (Phase 5).
**Domains:** `<domain>` (production), `www.<domain>` (redirect), `staging.<domain>` or `staging.saito-date-el-gusto.pages.dev` (staging), `<host>.sanity.studio` (Studio).
**Runtime and versions:** Node 22 in CI (Node 20.11 or later locally), wrangler 3 (pinned in `deploy.sh`), and Astro 5, Vitest 3, Zod 3 and TypeScript 5 (pinned in the repo).

---

## Missing components, integrations, automation, infrastructure and development work

Ordered by impact on launch.

| # | Gap | Type | Blocks launch? | Where |
|---|---|---|---|---|
| 1 | No WhatsApp ordering integration (cart, product dialog, ingredient removal, order id, `wa.me` message) | Development | **Yes**, if D2 = port | `schema/site.ts`, `schema/sections.ts`, `components/web/`, `Menu.astro` |
| 2 | Menu items lack `image` and `ingredients` in the schema, the Studio and seed | Development / CMS | **Yes**, with #1 | `sections.ts`, `apps/studio/schemaTypes`, `sanity-seed.ts` |
| 3 | `Permissions-Policy: geolocation=()` blocks the map pin's location lookup | Infrastructure (headers) | **Yes**, for the map pin | `packages/cli/src/build.ts` (`writeEdgeArtifacts`) |
| 4 | No UI-string localization: storefront copy is Spanish in `data.text`, and Contact labels are hard-coded in English | Development | **Yes** (Spanish site) | `packages/components` |
| 5 | `site.config.yaml` drifted from the prototype (order, menu, hidden sections, CTA `#`) | Content / config | **Yes** | `sites/date-el-gusto/site.config.yaml` |
| 6 | No `staging` or `production` URLs in `environments` (wrong canonical and sitemap) | Config | **Yes** | site config |
| 7 | Pages project `saito-date-el-gusto` does not exist; wrangler fails without it | Infrastructure | **Yes** | Cloudflare |
| 8 | GitHub environments, variables and secrets not configured; `DEPLOY_PROVIDER` defaults to `none` (builds but uploads nothing) | Automation | **Yes** | GitHub settings |
| 9 | Hotlinked Unsplash images and fictional content (email, reviews, footer note) | Content | **Yes** | site config, Sanity |
| 10 | No PWA support in `Head.astro` (manifest, theme-color, icons, splash, SW registration, install and offline components) | Development | Only if D3 = keep | `layout/Head.astro`, `components/web/` |
| 11 | `sanity.cli.ts` hard-codes `deployment.appId` from another Studio | CMS config | For a new Sanity project | `apps/studio/sanity.cli.ts` |
| 12 | Sanity → GitHub webhooks and the PAT not created | Automation | For CMS-driven deploys | Sanity manage |
| 13 | Production `environment:` reviewers also gate CMS publishes (D6) | Automation design | No, but it delays client edits | `deploy.yml` |
| 14 | No PR preview deployments (CI keeps only an artifact) | Automation | No | `ci.yml` |
| 15 | No redirects support (`www` ↔ apex, old URLs) in Saito | Infrastructure | No (use a Cloudflare Redirect Rule) | Cloudflare |
| 16 | Reservation widget has no booking backend; testimonials and catering hidden | Product decision | No (hidden) | D7 |
| 17 | Contact form disabled: no `integrations.forms` endpoint, and the `apps/api` hosting (for example Cloud Run, per `FIN-V2.MD`) is not provisioned | Infrastructure | No (WhatsApp and phone cover contact) | `apps/api` |
| 18 | Restaurant JSON-LD may lack hours and `servesCuisine` | SEO | No | `Head.astro` |
| 19 | No uptime monitoring or error tracking | Observability | No | UptimeRobot / Sentry (see `FIN-V2.MD`) |
| 20 | Interactive patterns lost: marquee, masonry, review carousel, colour slabs, doodles, scroll reveal | Development (design fidelity) | No | `packages/components` (new `variant`s) |
| 21 | OSM public tiles are not meant for commercial production traffic | Infrastructure | No, at launch traffic | Tile provider (MapTiler, Stadia) if traffic grows |
| 22 | Brand name mismatch: "Date Gusto" in the manifest vs "Date El Gusto" | Content | No | `manifest.webmanifest` |

### Suggested order of work

1. D1–D7 → Phase 1 (config drift, #5 and #6).
2. Platform work in parallel: #1–#4 (storefront, schema, headers, i18n) and #10 (PWA), with vitest coverage.
3. Phase 3 (Sanity project, Studio schema, #11) alongside Phase 6 infrastructure (#7, DNS).
4. Phase 5 (#8, #12, #13) → first staging deploy.
5. Phase 4 migration → client review on staging → production deploy → Phase 7 handoff.

# Spec: `pwa`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: draft, awaiting review (2026-10-29). Depends on: `ui-strings`. **First to cut** if time runs short.
> **No automated tests** (decision 2026-10-29): validation is manual end-to-end testing by a person, using the checks under *Manual verification*.

## Objective

Let a site be installed on phones and show a branded page offline, as the Tangerine prototype does. This is opt-in per site through `brand.pwa`, and a site without it renders no PWA tags or scripts.

| Capability key | What the platform adds |
|---|---|
| `installable-app` | `brand.pwa` schema; manifest, theme-colour, apple-touch-icon and iOS splash tags in `Head.astro`; the install button web component |
| `offline-page` | Service-worker registration; the in-page offline notice; a `/sw.js` revalidation header. The site supplies `sw.js` and `offline.html` in `public/` |

Behaviour and numbers are in `templateExtensions.unsupportedCapabilities` of `family-kitchen/v1.ts`. The reference implementation is the prototype's `js/components/pwa.js`, `sw.js`, `offline.html` and `manifest.webmanifest`.

### Schema

```ts
// brand.pwa in packages/core/src/schema/site.ts
pwa: z.object({
  manifest: z.string().startsWith('/').default('/manifest.webmanifest'),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  appleTouchIcon: z.string().startsWith('/').optional(),
  splash: z.array(z.object({ href: z.string().startsWith('/'), media: z.string().max(200) })).default([]),
  serviceWorker: z.string().startsWith('/').default('/sw.js'),
}).optional()
```

Paths are site-root-relative and point into `sites/<id>/public/`. `media` strings are written into an attribute, so they are escaped like every attribute.

## Tech stack

Astro 5 head tags, one web-component module (`web/pwa.ts`) ported from the prototype, and the Cloudflare `_headers` file. No dependencies.

## Commands

```bash
npm run typecheck
npm run saito -- validate --all
./deploy.sh staging <site>          # install and offline checks need HTTPS
```

## Project structure

| File | Change |
|---|---|
| `packages/core/src/schema/site.ts` | `brand.pwa` |
| `packages/components/src/layout/Head.astro` | When `brand.pwa` is set: `<link rel="manifest">`, `theme-color`, `apple-touch-icon`, `apple-mobile-web-app-*` metas (title from `site.name`), splash links |
| `packages/components/src/web/pwa.ts` | **New**: `<saito-app-install>` (Chromium `beforeinstallprompt`, iOS instructions sheet, 30-day snooze, phones and tablets only) and `<saito-offline-notice>`, ported from `pwa.js`; registers the service worker |
| `packages/components/src/layout/Header.astro`, `SiteLayout.astro` | Mount the install button in the navigation and the offline notice at the end of `<body>`, only with `brand.pwa` |
| `packages/components/src/strings.ts` | Install, iOS and offline strings in `en` and `es` |
| `packages/cli/src/build.ts` | With `brand.pwa`: a `_headers` rule for the service-worker path with `Cache-Control: no-cache`, detaching the inherited `/*` `Cache-Control` (Cloudflare `! Cache-Control` syntax; confirm against the Cloudflare Pages `_headers` docs during implementation) |
| `docs/CONFIGURATION.md` | `brand.pwa`, and what the site must put in `public/` |
| `packages/templates/src/family-kitchen/v1.ts` | Release 1.5.0: remove the 2 flags; list the PWA files under `assets` (templates can't ship files; the site supplies them). Registry keys to `supported`, `x-patterns` to `implemented` |

`brand` is developer-owned YAML, so there are no Studio changes.

## Code style

Port `pwa.js` as it is, keeping `installMode()` (user-agent detection), the snooze and the event names. Copy comes from `strings.ts`. The service worker stays a **site file**, so the platform only registers it and sets its header; caching strategy is the site's.

## Manual verification

On the staging deploy of a site with `brand.pwa`:

1. **Android Chrome:** "Instalar App" appears, opens the native prompt, and the installed app opens standalone with the theme colour.
2. **iPhone Safari:** the button opens the two-step "Agregar a inicio" sheet. Closing it hides the button for 30 days. The splash screen shows on launch from the home screen.
3. **Desktop:** no install button.
4. **Offline:** turn the network off and reload, and the site's `offline.html` appears. An order action shows the offline notice. Turning the network back on recovers the page.
5. `curl -I <url>/sw.js` shows `Cache-Control: no-cache` only, not merged with the HTML cache header.
6. A site without `brand.pwa` has no manifest link, no service worker and no install button.

## Boundaries

- **Always:** opt-in per site; nothing registered without `brand.pwa`; Spanish and English copy from `strings.ts`.
- **Ask first:** generating `sw.js` or the manifest from config instead of shipping them as site files, or adding offline caching of pages.
- **Never:** a service worker on sites that didn't opt in, or caching HTML in a way that would hide new deployments.

## Success criteria

- The 2 keys are `supported` in the registry and `implemented` in `x-patterns`, and `family-kitchen@1.5.0` has no flags for them.
- The 6 manual checks pass on staging.
- `npm run typecheck` and `npm run saito -- validate --all` pass.

## Open questions

- Should the platform generate `manifest.webmanifest` from `site.name` and the theme, so a site can't drift from its brand? *Recommendation:* not in v1. The prototype's file is copied, renamed "Date El Gusto", and the generated version can come later.

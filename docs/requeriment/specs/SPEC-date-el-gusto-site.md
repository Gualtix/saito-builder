# Spec: `date-el-gusto-site`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: draft, awaiting review (2026-10-29). Depends on: `noindex-header`, `family-kitchen-template` (each release), `pwa` (optional).
> **No automated tests** (decision 2026-10-29): validation is manual end-to-end testing by a person, using the checks under *Manual verification*.

## Objective

The showcase site itself: `sites/date-el-gusto/` becomes a **thin** config on `family-kitchen@1`. It holds only Date El Gusto's identity, content, settings and assets, and picks up every platform module through template releases on its next build. It ships through the runbook's Phases 3–7 ([`step-by-step.md`](../step-by-step.md)).

Because the site pins `family-kitchen@1`, it can start as soon as the first build wave lands. Each later template release (1.1.0 to 1.5.0) reaches it on the next build without config changes, except where a module needs a site setting (commerce, PWA).

## Tech stack

The site config (YAML) on `family-kitchen@1`, files in `sites/date-el-gusto/public/`, the existing Saito Sanity project, Cloudflare Pages via `./deploy.sh` and deploy hooks.

## Commands

```bash
npm run saito -- validate date-el-gusto --env production
npm run saito -- dev date-el-gusto
./deploy.sh local date-el-gusto
npx tsx --env-file=.env packages/cli/src/index.ts seed date-el-gusto --env staging --dry-run
./deploy.sh staging date-el-gusto
./deploy.sh production date-el-gusto
```

## Project structure

| File | Content |
|---|---|
| `sites/date-el-gusto/site.config.yaml` | Rewritten. `template: family-kitchen@1`, `locale: es-GT`; `environments.staging.url` / `production.url` on `pages.dev`; `seo.noindex: true`; `brand` (logo, favicon, later `pwa`); `integrations.commerce` (`whatsapp`, `+502 4539 3659`, `GTQ`, `DG`, 20, location centre `[14.523, -90.759]`, zoom 16) once `whatsapp-commerce` lands; page overrides with the prototype's copy (business name, hero, story, hours, products from `data.js`); `reserve`, `reviews` and `catering` set to `false`. The old `x-extraction` block is dropped |
| `sites/date-el-gusto/public/images/` | The prototype's photos, downloaded from Unsplash (hero, specials collage, marquee, story, gallery, visit, 9 dishes), as WebP within the runbook's size limits |
| `sites/date-el-gusto/public/` | `favicon.svg`, `images/logo.svg` (from `icons/mark.svg`), and with `pwa`: `manifest.webmanifest` (renamed "Date El Gusto"), `sw.js`, `offline.html`, `icons/` with the splash screens |
| `environments/date-el-gusto/.staging.env`, `.prod.env` | Filled per runbook Phase 6 (git-ignored) |

The site adds no code. If it needs anything the template can't express, that is a new flag on the template, not a site workaround.

## Code style

Keep the config thin: override only what differs from the template. One comment line per non-obvious choice, as in the other site configs.

## Manual verification

- **Side by side** with the prototype at 390 px and 1280 px, section by section, after each template release: the look and interactions match once all modules have landed.
- **Order:** an order placed on staging produces the same WhatsApp message as the prototype for the same cart, and it reaches `+502 4539 3659`.
- **Indexing:** both URLs are public, and `curl -I` shows `X-Robots-Tag: noindex` on production too. `robots.txt` disallows everything.
- **Publishing:** a Studio publish in `production` is live in about 2–3 minutes, and only this site rebuilds.
- **Links:** no hotlinked Unsplash URLs remain (`grep -r unsplash sites/date-el-gusto` is empty).
- Runbook Phases 5–7 acceptance criteria.

## Boundaries

- **Always:** identity and content in the site; structure and look from the template; `noindex` everywhere; fictional content kept, as the intent says.
- **Ask first:** anything the runbook's "Before a real client" list covers (domain, real content, client access).
- **Never:** site-specific Astro code, `seed --overwrite` from a build, or secrets in git.

## Success criteria

- `validate date-el-gusto --env production` passes, the config is thin, and no flag of the template is worked around in the site.
- All manual checks pass on staging and production, and the Phase 7 demo rehearsal runs end to end.

## Open questions

None. Decisions D1–D8 in the runbook cover this module.

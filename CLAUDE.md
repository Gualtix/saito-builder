# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Saito Builder is a configuration-driven, multi-tenant static website factory. Sites are YAML files that override versioned templates; one Astro renderer turns each site into static HTML for a CDN.

## Commands

```bash
npm install                                    # npm workspaces; Node >= 20.11
npm test                                       # vitest: packages/*/test + apps/api/test
npx vitest run packages/core/test/core.test.ts # single file
npx vitest run -t "landing v1 → v2"            # single test by name
npm run typecheck                              # tsc (TS packages + API) and astro check (renderer + components)

npm run saito -- validate --all                # resolve + schema-check every site (fast; no Astro)
npm run saito -- build <site>|--all|--tenant <t> [--env staging|production]   # → dist/<env>/<site>/
npm run saito -- dev <site>                    # Astro dev server on :4321
npm run saito -- create <site> --template <t> --tenant <t>
npm run saito -- outdated | upgrade <site> [--dry-run]
git diff --name-only main | npm run saito -- affected --json   # sites a change must rebuild
npm run saito -- seed <site>|--all [--dry-run] [--overwrite]   # local content + images → Sanity (SANITY_WRITE_TOKEN)
./deploy.sh local|staging|production <site...>|--all [--yes]   # build + preview (local) or upload; env from environments/<site>/.<local|staging|prod>.env
npm run api                                    # Fastify form API on :8787
npm run live-template -- <folder>              # publish a static folder (needs index.html) as a public GitHub Pages repo via gh
```

There is no linter configured. TypeScript runs directly through `tsx`/Vite — package `exports` point at `src/*.ts`, there is no compile step.

## Architecture

**Resolution pipeline (the core idea).** `loadResolvedSite()` (`packages/core/src/pipeline.ts`) produces the `ResolvedSite` everything renders from:
1. load `sites/<id>/site.config.yaml` (validated by `siteConfigSchema`),
2. deep-merge a content overlay from a `ContentSource` (`content/`: local `sites/<id>/content/pages/*.yaml`, plus Sanity when `SAITO_CONTENT_SOURCE=sanity`),
3. resolve the pinned template (`"landing@1"`) from the `TemplateRegistry`,
4. `resolveSite()` (`resolve.ts`) applies per-page overrides onto template pages and validates every section, collecting all issues into one `SiteConfigError`.

Precedence: template < site config < content overlay. `deepMerge` (`merge.ts`): objects merge, arrays replace, `null` deletes.

**Override semantics are keyed by section id**, not array position: `sections.<id>: {...}` merges into the template section; `sections.<id>: false` removes it; an unknown id *with* `type` adds a new section; `order: [...]` puts listed ids first. Pages absent from the template need `title` + typed sections. Sanity documents are converted into this same shape (`sanityToOverlay`), so all sources compose identically. The reverse direction, `siteToSanityDocuments` (`content/sanity-seed.ts`, used by `saito seed`), must stay its exact inverse — `packages/core/test/seed.test.ts` round-trips every site to enforce this. Sanity document ids must not contain `.` (dotted ids are private). **Golden rule (README, "Content publishing"):** every field has one owner; builds never write to Sanity (no `seed --overwrite` in builds or CI).

`.env` is never loaded automatically; use exported vars or `npx tsx --env-file=.env packages/cli/src/index.ts …`.

**Templates** (`packages/templates/src/<id>/vN.ts`) are `defineTemplate(manifest, migrations)` modules registered in `src/index.ts`. Multiple majors coexist. Sites pin a major, so minor/patch template changes propagate on next build; breaking changes ship a `TemplateMigration` that rewrites site overrides, applied by `saito upgrade` (which validates before writing; YAML comments are lost when overrides change).

**Renderer** (`apps/renderer`) is a single Astro project parameterised by env vars: `SAITO_SITE` selects the site (required except for `astro check`), `SAITO_ENV` the environment. `astro.config.ts` sets per-site `publicDir` (`sites/<id>/public`), `outDir`, and cache dir. `src/pages/[...slug].astro` renders every page by mapping `section.type` → component via `sectionComponents` in `packages/components/src/index.ts`. Always build through the CLI: it resolves first (clear config errors), then spawns `astro build`, then writes `_headers` and `saito-manifest.json`.

**Theming**: `themeToCss()` emits `--saito-*` CSS variables per site; `apps/renderer/src/styles/global.css` maps Tailwind v4 tokens onto them (`bg-primary`, `text-ink`, `text-muted`, `border-line`, `rounded-theme`) and defines `.saito-*` component classes that adapt to a section's `data-bg`. Tailwind scans `packages/components/src` via `@source`.

**Security boundaries to preserve**: `ResolvedSite.integrations` strips server-only fields (`forms.webhookUrl`, `notifyEmail`) — never render raw `SiteConfig`. User links go through `safeHref`, rich text through `renderRichText` (escapes first), inline JSON through `jsonForScript`. Theme font names are regex-restricted because they are written into CSS. Non-production builds are always noindex.

**API** (`apps/api`): builds its site registry from the same site configs; only sites with `integrations.forms` are served. Per-site origin allow-list, honeypot field `company_website`, redirects only to the site's own domain, submissions stored per tenant via a `SubmissionSink`.

## Adding a section type

Touch all of: the zod schema in `packages/core/src/schema/sections.ts` (add to the discriminated union), a component in `packages/components/src/sections/` registered in `sectionComponents` (typed `Record<SectionType, …>`, so a missing entry is a compile error), the Sanity schema in `apps/studio/schemaTypes/index.ts`, and the table in `docs/CONFIGURATION.md`.

## Gotchas

- `apps/studio` (Sanity) is deliberately **not** an npm workspace; install it separately with `cd apps/studio && npm install`.
- Root `package.json` `overrides` pins Vite 6 so Astro 5 and Vitest share one Vite (otherwise `astro check` fails on plugin types). Versions are intentionally pinned to Astro 5 / Vitest 3 / Zod 3 / TypeScript 5.
- `packages/components` is excluded from the root `tsconfig.json` (it imports `.astro`); it is type-checked by `astro check` via the renderer's tsconfig.
- Site `id` must equal its directory name; ids, tenants and section ids are kebab-case.
- There is no CI (proof of concept): run tests by hand and deploy code/YAML changes with `./deploy.sh`. Sanity publishes call a Cloudflare Pages deploy hook per site, which runs `scripts/pages-build.sh <site>` (output `dist/pages`). `saito affected` lists the sites a change touches; keep its path rules in `packages/cli/src/commands.ts` in sync if you move directories.

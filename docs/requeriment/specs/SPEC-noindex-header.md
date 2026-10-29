# Spec: `noindex-header`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: implemented (2026-10-29), awaiting Checkpoint A. Depends on: nothing.
> **No automated tests** (decision 2026-10-29): no tests are written or run for this module. Validation is manual end-to-end testing by a person, using the checks under *Manual verification*.

## Objective

A site with `seo.noindex: true` must not be indexable in **any** environment, production included. Today the flag reaches two of the three output channels:

| Channel | Where | Honours `seo.noindex` today |
|---|---|---|
| `<meta name="robots">` | `packages/components/src/layout/Head.astro:15` | yes |
| `robots.txt` | `apps/renderer/src/pages/robots.txt.ts:6` | yes |
| `X-Robots-Tag` header | `packages/cli/src/build.ts:46` (`writeEdgeArtifacts`) | **no**: sent only when `env !== 'production'` |

**Who needs it:** the Date El Gusto showcase is public but must stay out of search (intent: "noindex everywhere"). It applies to any demo or pre-launch site.

**Platform rule this enforces:** one config value controls every output channel the same way (`docs/EXTENDING-THE-PLATFORM.md`, "One flag, every channel").

## Tech stack

TypeScript run through `tsx`/Vite with no compile step. No new dependencies.

## Commands

```bash
npm run typecheck                                # build check (compile), not a test
npm run saito -- build <site> --env production   # then: grep X-Robots-Tag dist/production/<site>/_headers
```

## Project structure

| File | Change |
|---|---|
| `packages/cli/src/build.ts` | `writeEdgeArtifacts`: send the header when `site.env !== 'production' \|\| site.seo.noindex` |
| `README.md` | The `_headers` row (line ~653) and the "Indexing" row (~909): add "or when `seo.noindex` is true" |
| `docs/CONFIGURATION.md` | `seo.noindex` row: say it covers meta, `robots.txt` and the header in every environment |

## Code style

Keep the existing one-expression style of the header list:

```ts
const indexable = site.env === 'production' && !site.seo.noindex;
// …
...(indexable ? [] : ['  X-Robots-Tag: noindex']),
```

Use the same `indexable` name as `robots.txt.ts`, so a reader sees that the channels share one rule.

## Manual verification

Build one site three ways and read `dist/<env>/<site>/_headers`:

1. production with no flag → no `X-Robots-Tag`
2. production with `seo.noindex: true` → `X-Robots-Tag: noindex`
3. staging with no flag → `X-Robots-Tag: noindex` (no regression)

After deploying, run `curl -I` on the production URL of a `noindex` site: it must show the header.

## Boundaries

- **Always:** keep the security headers and cache rules byte-identical, and run `npm run typecheck`.
- **Ask first:** any change to the meta or `robots.txt` logic (they already work).
- **Never:** make production noindex by default, or read `SAITO_ENV` directly in `build.ts` (use `site.env`).

## Success criteria

- The three manual cases behave as described, and `npm run typecheck` passes.
- For every existing site, `_headers` is unchanged in every environment (none sets `seo.noindex` today): `diff` of `dist/*/<site>/_headers` before and after shows nothing.
- `README.md` and `docs/CONFIGURATION.md` describe the new rule.

## Open questions

None.

# Saito Builder

A configuration-driven, multi-tenant website factory (see [STORY.md](STORY.md)). Sites are YAML files that override versioned templates, and one Astro renderer turns each of them into a static site ready for a CDN.

```
template (versioned, reusable)  +  site.config.yaml (overrides)  +  content (files or Sanity)
                                   │
                            saito validate / build
                                   │
                    Astro SSG → dist/<env>/<site>/  → CDN / edge
```

## Quick start

```bash
npm install
npm test                                   # unit + API tests
npm run saito -- sites                     # list sites
npm run saito -- templates                 # browse the template marketplace
npm run saito -- validate --all            # check every site against its template
npm run saito -- dev acme-corp             # live preview at http://localhost:4321
npm run saito -- build --all               # static output in dist/development/<site>
npm run saito -- build bella-trattoria --env production
```

Create a site from a template:

```bash
npm run saito -- create globex --template corporate --tenant globex --name "Globex" --url https://globex.example
npm run saito -- dev globex
```

Upgrade a site to a new major version of its template (customisations are migrated):

```bash
npm run saito -- outdated
npm run saito -- upgrade acme-launch --dry-run
npm run saito -- upgrade acme-launch
```

Run the optional backend that handles contact forms:

```bash
npm run api                                # http://localhost:8787
```

## Repository layout

| Path | What it is |
|------|------------|
| `packages/core` | Schemas (zod), template → site resolver, theme tokens, semver ranges, content sources (local files, Sanity) |
| `packages/templates` | The template marketplace: `landing` (v1, v2), `corporate`, `restaurant`, `event` |
| `packages/components` | Astro section components, layout, and framework-independent Web Components (`<saito-contact-form>`, `<saito-countdown>`) |
| `packages/cli` | `saito` CLI: create, validate, build, dev, outdated, upgrade, affected |
| `apps/renderer` | The Astro + Tailwind static site generator (renders whichever site `SAITO_SITE` selects) |
| `apps/api` | Optional Node.js + Fastify backend for tenant-aware form handling |
| `apps/studio` | Sanity Studio schemas for editors (installed separately: `cd apps/studio && npm install`) |
| `sites/<id>/` | One directory per website: `site.config.yaml`, `content/pages/*.yaml`, `public/` |
| `.github/workflows` | CI (test, validate, build affected sites) and multi-environment deploys |
| `scripts/deploy.sh` | Hosting-agnostic deploy: Cloudflare Pages, Netlify, S3 + CloudFront |

## Example sites

| Site | Tenant | Template | Shows |
|------|--------|----------|-------|
| `acme-corp` | acme | corporate@1 | Theme overrides, removed section, extra page, content in separate files, contact form |
| `acme-launch` | acme | landing@1 | Dark theme; pinned to an old major to demo `outdated` / `upgrade` |
| `bella-trattoria` | bella | restaurant@1 | Added gallery section, re-ordered sections, Snipcart online ordering |
| `devconf-2027` | devconf | event@1 | Countdown Web Component, schedule, external ticket links |

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the platform answers each architecture question in STORY.md
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md): site configuration reference

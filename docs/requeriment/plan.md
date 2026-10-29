# Implementation plan: Date El Gusto showcase

> **Status:** wave 1 done (Checkpoint A passed, 2026-10-29). Wave 2 and 2′ approved and in progress. Each later wave starts only after the person confirms it. Wave 3's spec (`pwa`) is still a draft.
> Inputs: [capability map](specs/date-el-gusto-capability-map.md) and its module specs in [`specs/`](specs/). Task list: [`todo.md`](todo.md). Runbook for accounts, content and deploys: [`step-by-step.md`](step-by-step.md).

## Constraint: no automated testing

No tests are written, updated or run for this initiative. Validation is **manual end-to-end testing by a person** at the checkpoints below, using each spec's *Manual verification* list.

These remain part of the build, because they compile or resolve and test nothing: `npm run typecheck`, `npm run saito -- validate`, and `saito build`/`dev`. Without them, broken code would only show up in the browser.

**Risk accepted with this constraint:** the existing suites won't run. That includes the Sanity round trip in `seed.test.ts`, the reference-file checks, and the capability-registry guard in `template-example.test.ts`. A drift they would catch shows up only if the human checks happen to cover it. The checkpoints include the manual equivalents that matter most: `saito seed --dry-run`, both reference files showing the new section type, and the registry matching the template flags.

## Waves

| Wave | Modules | Runs | Gate |
|---|---|---|---|
| 1 | `noindex-header`, `ui-strings`, `theme-tokens` | in parallel | **Checkpoint A** |
| 2 | `section-variants`, `site-chrome`, `whatsapp-commerce` | in parallel; `site-chrome`'s header task waits for the shared icon set (T8) | **Checkpoint B** |
| 2′ | `date-el-gusto-site` (config, assets, Sanity, Cloudflare) | in parallel with wave 2, starting after Checkpoint A | part of Checkpoint B |
| 3 | `pwa`, then the site's PWA files | after Checkpoint B; first to cut | **Checkpoint C** (demo rehearsal) |

Each module ends with a **close-out task**:
- `docs/CONFIGURATION.md` is updated.
- `family-kitchen` adopts the new fields in a minor release and drops the module's `// UNSUPPORTED` flags and `unsupportedCapabilities` entries.
- The registry in `template.example.ts` sets the keys to `supported`, and `x-patterns` sets them to `implemented`.

Template versions follow landing order. The specs' 1.1.0–1.5.0 numbers are indicative. A close-out that only removes flags (`ui-strings`) changes no manifest, so it needs no version bump.

## Ownership (routing from `~/.claude/CLAUDE.md`)

| Work | Agent |
|---|---|
| Schema plus component plus Studio slices (most tasks) | `fullstack-engineer` |
| Components, CSS and web components only | `frontend-engineer` |
| `build.ts` headers | `backend-engineer` |
| Cloudflare, env files and deploys (runbook Phases 5–6) | `devops-engineer` |
| Site config, assets and the template close-outs | primary agent |

Subagents can't spawn agents, so the primary agent integrates every result, runs the build checks, and hands each checkpoint to the person.

## Checkpoints (manual, by a person)

| Checkpoint | After | What the person checks | Human time |
|---|---|---|---|
| **A** | Wave 1 | `SPEC-noindex-header`, `SPEC-ui-strings` and `SPEC-theme-tokens` *Manual verification*; existing sites look unchanged (side by side with the deployed versions); `saito seed date-el-gusto --dry-run` still works | ~30 min |
| **B** | Waves 2 and 2′ | The `section-variants`, `site-chrome` and `whatsapp-commerce` checks; `date-el-gusto` side by side with the prototype at 390 and 1280 px; a full WhatsApp order on staging; a Studio publish rebuilds only this site; the registry matches the template flags | ~1.5 h |
| **C** | Wave 3 | The `SPEC-pwa` checks on Android and iPhone; the runbook Phase 7 demo script end to end | ~45 min |

A failed check goes back to the owning task as a fix before the next wave starts.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| No automated tests | Regressions on existing sites, or a broken seed round trip, go unnoticed | Checkpoint A compares the existing sites side by side; `seed --dry-run` at A and B |
| The WhatsApp port changes the message format | Orders read differently from the prototype | Port the functions unchanged; Checkpoint B compares one cart's text character by character |
| Several wave-2 modules edit `sections.ts`, `global.css` and the Studio schema in parallel | Merge conflicts | One task at a time per file family; additive edits only (new fields, new blocks) |
| The Cloudflare `_headers` detach syntax (`! Cache-Control`) behaves differently than expected | `/sw.js` stays cached | The PWA task checks it against the Cloudflare docs, and Checkpoint C verifies with `curl -I` |
| Hook builds use code on GitHub, not local builds | A Studio publish rolls code back | Push `main` and `git push origin main:staging` before every checkpoint that includes a publish (runbook Phase 6) |
| Unsplash downloads are licensed stock | Fine for the demo | Real photos are on the runbook's "Before a real client" list |

## Out of scope

Everything in the intent's out-of-scope list (custom domain, real content, client handoff, contact form, analytics, live visual editing), and the four deferred capabilities in the map (`table-reservation`, `carousel`, `review-rating`, `category-tiles`).

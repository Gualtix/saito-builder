# Enriching the template ecosystem

What the design teaches goes back into the shared references, so the next template starts from a richer foundation. Every enrichment must be **generic** (no business names, copy or URLs) and **backward-compatible** (nothing existing changes meaning).

## Where each kind of finding goes

| Finding | Goes to | How |
|---|---|---|
| A color scheme no preset covers | `packages/templates/src/themes.ts` | New named preset (below) |
| A design token the theme cannot hold (per-role radii, shadows, gradients, spacing rhythm) | `template.example.ts` → `templateExtensions.tokens` | New generic DTCG token group or token |
| A section, component, interaction, layout or decoration the schema cannot express | `sites/example.config.yaml` → `x-patterns` (the shared catalog) | Add or update an entry; reference its key in the new template's `templateExtensions.patterns` |
| A new taxonomy value (industry, style, tone, conversion goal) | `sites/example.config.yaml` → `x-vocabulary` | Append, kebab-case, reuse first |
| A template-authoring convention worth repeating (an abstraction, a naming rule, a placeholder policy) | `template.example.ts` → header comments or `templateExtensions` (`assets`, `extensibility`) | Short, generic rule with its reason |

Never change the manifest of `template.example.ts` to carry a site-specific idea, and never add manifest fields the schema lacks: TypeScript rejects them and zod would drop them.

## New theme preset (`themes.ts`)

- Add only when no existing preset is close (see `template-guide.md` section 4). Name it after the look, not the business or the prototype folder: `citrus`, `garden`, `terracotta`, `harbor`.
- Complete: `mode`, all 9 colors (hex), both fonts (letters, digits, spaces), `googleFonts`, `radius`. The object must satisfy `Theme`; the file's `satisfies Record<string, Theme>` checks it.
- Contrast: `primaryContrast` on `primary` and `text`/`muted` on `background` should reach WCAG AA (4.5:1). On light oranges and yellows that means dark text on primary.
- Append at the end of the object; never rename, reorder-dependent-edit or change an existing preset (templates and live sites read them).

## `x-patterns` (shared catalog)

Follow the entry shape and merge rules in `.claude/skills/html-to-site-config/references/enrichment.md` section 2: one entry per capability, keyed by what it is; increment `occurrences` once per extraction (a template extraction counts like a site extraction); add `seenIn` values; never duplicate an existing entry under a new name. Quote any value containing `: `.

## `template.example.ts` tokens and conventions

- Tokens: add to `templateExtensions.tokens` with generic names (`radius.button`, `shadow.card`), DTCG `$type`/`$value`. Keep the existing groups' style.
- Conventions: one concise rule plus its reason, in the header comment block it belongs to or the matching `templateExtensions` key.
- Keep the file passing `packages/templates/test/template-example.test.ts`: it must still cover every section type, resolve for a site with no overrides, and stay unregistered.

## Editing the YAML catalogs

Edit `sites/example.config.yaml` as text (Edit tool), not by loading and re-dumping it with a YAML library: that would drop every comment, and the comments are most of the file's value.

## After enriching

- `sites/example.config.yaml`: if you changed it, bump `x-meta.referenceVersion` (minor) and set `lastReviewed` to today (leave it if it already is). A template extraction updates `x-vocabulary` just like a site extraction.
- Run `npx vitest run packages/templates/test packages/core/test/example-config.test.ts` and `npx tsc -p tsconfig.json --noEmit`.

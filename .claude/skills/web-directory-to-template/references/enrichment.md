# Enriching the template ecosystem

What the project teaches goes back into the shared references, so the next template starts from a richer foundation. Every enrichment must be **generic** (no business names, copy or URLs) and **backward-compatible** (nothing existing changes meaning).

## Where each kind of finding goes

| Finding | Goes to | How |
|---|---|---|
| A colour scheme no preset covers | `packages/templates/src/themes.ts` | New named preset (below) |
| A design token the theme cannot hold (per-role radii, shadows, gradients, spacing rhythm, breakpoints, motion) | `template.example.ts` → `templateExtensions.tokens` | New generic DTCG token group or token |
| A section, component, interaction, layout, decoration or app-shell feature the schema cannot express | `sites/example.config.yaml` → `x-patterns` (the shared catalog) | Add or update an entry (below); reference its key in the new template's `templateExtensions.patterns` |
| A new taxonomy value (industry, style, tone, conversion goal) | `sites/example.config.yaml` → `x-vocabulary` | Append, kebab-case, reuse first |
| A template-authoring convention worth repeating (an abstraction, a naming rule, a placeholder policy) | `template.example.ts` → header comments or `templateExtensions` (`assets`, `extensibility`) | Short, generic rule with its reason |

Never change the manifest of `template.example.ts` to carry a site-specific idea, and never add manifest fields the schema lacks: TypeScript rejects them and zod would drop them.

## New theme preset (`themes.ts`)

- Add only when no existing preset is close (see `template-guide.md` section 4). Name it after the look, not the business or the project folder: `citrus`, `garden`, `terracotta`, `harbor`.
- Complete: `mode`, all 9 colours (hex), both fonts (letters, digits, spaces), `googleFonts`, `radius`. The object must satisfy `Theme`; the file's `satisfies Record<string, Theme>` checks it.
- Contrast: `primaryContrast` on `primary` and `text`/`muted` on `background` should reach WCAG AA (4.5:1). On light oranges and yellows that means dark text on primary.
- Append at the end of the object; never rename or change an existing preset (templates and live sites read them).

## `x-patterns` (shared catalog)

A generic catalog of capabilities seen in real projects but not (or only partly) expressible in the schema: the backlog of candidate platform extensions.

```yaml
x-patterns:
  before-after-slider:
    kind: component           # section | component | decoration | interaction | layout
    status: proposed          # proposed | planned | implemented
    description: Two images of the same subject overlaid, with a handle the visitor drags to compare.
    fields:
      heading: string
      pairs: "{ before: image, after: image, caption?: string }[]"
    nearestType: gallery      # closest current section type
    fallback: gallery with captioned before and after images
    seenIn: [service-business]   # website types / industries, never business names
    occurrences: 1            # how many extractions have found it, not repeats within one project
```

Merge rules:

- One entry per capability, keyed in kebab-case by what it **is**, not where it was seen (`appointment-booking`, not `smile-studio-booking`).
- Look for an existing entry that means the same thing before adding one. If you find one, increment `occurrences` once per extraction, add new `seenIn` values, and add any new `fields`. Do not create near-duplicates (`booking-form` next to `appointment-booking`).
- A behaviour spread over several components (a cart bar, a cart dialog and a location picker forming one ordering flow) is **one** pattern when visitors experience it as one capability, and you list its parts in `description`. A part that other designs reuse on its own (a location picker) can also get its own entry.
- Note the browser capabilities and third-party services a pattern depends on (geolocation, service worker, a map library) in `description`. The platform must allow or load them when it builds the pattern.
- Quote any value containing `: ` (common in `fallback` and `description`), or the example stops parsing.
- Keep entries generic: no business names, copy, prices or URLs. Fields describe shape, not content.

## `template.example.ts` tokens and conventions

- Tokens: add to `templateExtensions.tokens` with generic names (`radius.button`, `shadow.card`), DTCG `$type`/`$value`. Keep the existing groups' style.
- Conventions: one concise rule plus its reason, in the header comment block it belongs to or the matching `templateExtensions` key.
- Keep the file passing `packages/templates/test/template-example.test.ts`: it must still cover every section type, resolve for a site with no overrides, and stay unregistered.

## Editing the YAML catalogs

Edit `sites/example.config.yaml` as text (Edit tool), not by loading and re-dumping it with a YAML library: that would drop every comment, and the comments are most of the file's value.

## After enriching

- `sites/example.config.yaml`: if you changed it, bump `x-meta.referenceVersion` (minor) and set `lastReviewed` to today (leave it if it already is).
- Run `npx vitest run packages/templates/test packages/core/test/example-config.test.ts` and `npx tsc -p tsconfig.json --noEmit`.

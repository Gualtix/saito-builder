# Spec: `theme-tokens`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: implemented (2026-10-29), awaiting Checkpoint A. Depends on: nothing. Needed by: `section-variants`, `site-chrome`.
> **No automated tests** (decision 2026-10-29): no tests are written or run for this module. Validation is manual end-to-end testing by a person, using the checks under *Manual verification*.

## Objective

Add the design values the renderer must apply but the theme cannot hold yet. Today the theme has nine colours, two fonts and **one** radius. Designs like Tangerine need three more things:

| Need | Seen in Tangerine | Used by (later modules) |
|---|---|---|
| Extra accent colours | burnt orange `#e3793f`, mustard `#f1c964` besides sage | offset colour slabs, icon badges (`section-variants`) |
| Per-role radius | pill buttons (9999px), 20px cards, 30px photos, 40px panels | buttons, cards and images now; slabs and panels later |
| Photo scrim | `rgba(20,15,10,.62)` over full-bleed photos | hero image background now; photo bands later |

**Who needs it:** any template with more than one accent, mixed corner styles or photo overlays. All fields are optional. A site that sets none of them renders exactly as today.

**Change from the map:** motion is no longer in this module. Its only consumer is `scroll-reveal`, so it moves to `site-chrome`.

## Tech stack

Zod 3 schema, `themeToCss()` in `packages/core`, Tailwind v4 tokens in `apps/renderer/src/styles/global.css`. No new dependencies. The theme is YAML-only (developer-owned), so there are no Studio or seed changes.

## Commands

```bash
npm run typecheck                             # build check (compile), not a test
npm run saito -- validate --all               # config check: every site still resolves
npm run saito -- build --all                  # compare the sites in a browser before and after
```

## Project structure

| File | Change |
|---|---|
| `packages/core/src/schema/theme.ts` | Optional `colors.accent2`, `colors.accent3` (hex, same regex); optional `colors.scrim` (hex with alpha: `#rrggbbaa`); optional `radii: { button?, card?, image?, panel? }` using the radius scale. The scale gains `xl` (1.25rem / 20px), `2xl` (1.875rem / 30px), `3xl` (2.5rem / 40px) |
| `packages/core/src/theme.ts` | `themeToCss()` emits `--saito-color-accent-2`, `--saito-color-accent-3`, `--saito-color-scrim`, `--saito-radius-<role>`, **only for fields that are set** |
| `apps/renderer/src/styles/global.css` | `@theme inline` maps `--color-accent-2`, `--color-accent-3`, `--color-scrim` and `--radius-button`, `--radius-card`, `--radius-image`, `--radius-panel`, each falling back to today's value: `var(--saito-radius-card, var(--saito-radius))`, scrim to `rgb(0 0 0 / .55)` |
| `global.css` `.saito-btn`, `.saito-card` | `rounded-theme` → `rounded-button` / `rounded-card` |
| `sections/Gallery.astro`, `Hero.astro` (image box) | `rounded-theme` → `rounded-image`; `Hero.astro` overlay `bg-black/55` → `bg-scrim` |
| `docs/CONFIGURATION.md` | Theme table: the new fields and the extended radius scale |
| `packages/templates/src/family-kitchen/v1.ts` | Release 1.1.0: theme sets `accent2`, `accent3`, `scrim` and `radii: { button: full, card: xl, image: 2xl, panel: 3xl }`; remove the matching entries from `templateExtensions.tokens` |

Header, schedule, contact and input elements keep `rounded-theme`: they have no role yet, and changing them is out of scope.

## Code style

```ts
// theme.ts: emit only what the theme sets, so existing sites' inline CSS is unchanged.
const optional: Record<string, string | undefined> = {
  '--saito-color-accent-2': theme.colors.accent2,
  '--saito-color-scrim': theme.colors.scrim,
  '--saito-radius-card': theme.radii?.card && radius[theme.radii.card],
  // …
};
```

The `scrim` regex is the only new colour format (`^#[0-9a-fA-F]{8}$`). Values still come only from validated hex and enums, so the generated CSS stays injection-safe, as the existing comment on `themeToCss` requires.

## Manual verification

- **No regressions:** open one existing site per template (acme-corp, bella-trattoria, devconf-2027…) side by side with the deployed version at 1280 px and 390 px. Buttons, cards, images and the hero must look the same.
- **New tokens:** on a `family-kitchen` site, buttons are pills, cards have 20px corners, gallery images 30px, and an image hero shows the scrim colour.
- **Validation:** `scrim: '#00000'` or `radii.card: huge` in a site config makes `saito validate` report a `theme.…` error.

## Boundaries

- **Always:** every field optional, defaults reproducing today's rendering, values validated before they reach CSS.
- **Ask first:** renaming or removing anything in the existing theme (it is the template override contract), or giving header, inputs or schedule a role.
- **Never:** accept free-form CSS strings, change an existing radius step's value, or edit an existing theme preset (`themes.ts` presets are read by live sites).

## Success criteria

- The new fields validate, emit CSS variables only when set, and are documented.
- Every existing site looks the same as before when compared side by side in a browser.
- `family-kitchen@1.1.0` uses the tokens, and a site on it shows the per-role radii and the scrim on an image hero.
- `npm run typecheck` and `npm run saito -- validate --all` pass.

## Open questions

- **Accent naming:** numbered (`accent2`, `accent3`) is generic and matches the existing `x-tokens` example. Named roles (`slab`, `badge`) would be more self-explanatory but tie colours to features. *Recommendation:* numbered; features choose which accent they use.

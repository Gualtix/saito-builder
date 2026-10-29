# Spec: `section-variants`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: draft, awaiting review (2026-10-29). Depends on: `theme-tokens`.
> **No automated tests** (decision 2026-10-29): validation is manual end-to-end testing by a person, using the checks under *Manual verification*.

## Objective

Opt-in presentation fields on existing section types, plus one new section type, so templates can reproduce designs like Tangerine instead of falling back. Every field is optional and defaults to today's rendering.

The requirements per capability (purpose, expected behaviour, numbers) are in `templateExtensions.unsupportedCapabilities` of `packages/templates/src/family-kitchen/v1.ts`. This spec fixes the field names.

| Capability key | Field (schema) | Section type | Component |
|---|---|---|---|
| `daily-specials` | **New section type `specials`**: `heading`, `intro?`, `price` (display string, e.g. "Q65"), `priceNote?` ("por plato"), `items: string[]`, `images?: image[]` (up to 3), `action?: link` | `specials` | `sections/Specials.astro` (new) |
| `promo-badge` | `specials.badge?: boolean` (default `true` when `price` is set): renders `price` + `priceNote` as the rotated star badge | `specials` | `Specials.astro` |
| `image-marquee` | `gallery.layout: 'grid' \| 'marquee' \| 'masonry'` (default `grid`) | `gallery` | `Gallery.astro` + `web/marquee.ts` |
| `masonry-gallery` | `gallery.layout: 'masonry'`; image `span?: 'tall'` | `gallery` | `Gallery.astro` |
| `section-header-action` | `gallery.action?: link`, rendered beside the heading | `gallery` | `Gallery.astro` (via `ui/SectionHeader.astro`) |
| `svg-icon-badges` | `features.iconStyle: 'emoji' \| 'badge'` (default `emoji`); with `badge`, item `icon` is a name from the shared icon set; badge colours cycle `accent`, `accent2`, `accent3` (falling back to `accent`); `features.dividers?: boolean` | `features` | `Features.astro` |
| `media-text-split` | `richText.image?`, `richText.imagePosition: 'start' \| 'end'` (default `end`), `richText.action?: link`; the same three on `contact` | `richText`, `contact` | `RichText.astro`, `Contact.astro` |
| `offset-color-slab` | `richText.slab?` and `contact.slab?`: `'accent' \| 'accent2' \| 'accent3' \| 'primary'`, drawn behind `image` with the `panel` radius | `richText`, `contact` | same |
| `photo-band-card` | `cta.layout: 'band' \| 'photo-band'` (default `band`), `cta.image?` (required for `photo-band`); photo under the scrim with a centred card | `cta` | `Cta.astro` |

**Answers the map's open question:** `daily-specials` becomes a **new section type**, not a `menu` variant. Its items are dish names under one shared price, while menu items require their own prices, so a variant would mean fake prices and a confusing Studio form.

**Shared icon set:** `packages/components/src/ui/icons.ts` holds a small set of inline SVG paths by name (for example `pot`, `home`, `family`, `leaf`, `mail`, plus social platforms). This module creates it, and `site-chrome` reuses it.

## Tech stack

Zod 3, Astro 5 components, Tailwind v4 tokens from `theme-tokens`, CSS-first motion. One small web component (`web/marquee.ts`) duplicates the marquee track, as the prototype's `<dish-marquee>` does. No new dependencies.

## Commands

```bash
npm run typecheck                         # build check (compile)
npm run saito -- validate --all
npm run saito -- dev <site>               # look at the variants on :4321
cd apps/studio && npm run dev             # check the Studio forms on :3333
```

## Project structure

| File | Change |
|---|---|
| `packages/core/src/schema/sections.ts` | New fields above; new `specialsSection` added to the discriminated union |
| `packages/components/src/sections/Specials.astro` | **New**, registered in `sectionComponents` (`packages/components/src/index.ts`) |
| `Gallery.astro`, `Features.astro`, `RichText.astro`, `Contact.astro`, `Cta.astro` | Render the new fields; unchanged output when unset |
| `packages/components/src/ui/icons.ts` | **New** shared icon set |
| `packages/components/src/web/marquee.ts` | **New**: duplicates the track, pauses on hover; does nothing under `prefers-reduced-motion` |
| `apps/renderer/src/styles/global.css` | Marquee keyframes, masonry grid, slab, star badge (`clip-path`) |
| `apps/studio/schemaTypes/index.ts` | Every new field and the `specials` type |
| `docs/CONFIGURATION.md` | Section table: `specials`, and the new fields |
| `sites/example.config.yaml` (section catalog page) and `packages/templates/src/template.example.ts` (`reference/section-catalog`) | Add a `specials` example: both reference files must show every section type |
| `packages/templates/src/family-kitchen/v1.ts` | Release 1.2.0: `specials` replaces the `menu` fallback; marquee, masonry and action on the galleries; badges on `highlights`; split, slab and action on `about`, `flavors`, `visit`; `photo-band` on `reserve` and `order`; remove the 9 flags. In the `template.example.ts` registry set these keys to `supported`, and in `x-patterns` to `implemented` |

The seed needs no change: new image fields are named `image` or `images`, which `collectImageSources` already handles.

## Code style

Follow the existing components: variants as class lists keyed by the enum, no runtime branching on strings scattered through markup.

```astro
---
const layouts = { grid: 'grid gap-4', masonry: 'columns-2 gap-4 md:columns-3', marquee: '' } as const;
---
```

User links go through `safeHref`, and `cta.image` / `richText.image` render with their `alt`, `width` and `height`.

## Manual verification

On a `family-kitchen` site (`npm run saito -- dev`), side by side with the prototype at 1280 px and 390 px:

- **Specials:** grey panel, bullet list, rotated price badge, three-photo collage, button.
- **Gallery:** the marquee loops, pauses on hover and is static with reduced motion enabled (macOS: Accessibility → Display → Reduce motion). Masonry has tall tiles in 3 and then 2 columns. The "Ver Instagram" button sits beside the heading.
- **Features:** SVG icons in coloured circles, with dividers on desktop.
- **Story sections:** about has text then photo, flavors and visit have photo then text, with offset slabs; they stack below 821 px.
- **CTA bands:** photo under the scrim with a white card.
- **Studio:** each new field is editable, and a `specials` section can be added, published and rebuilt.
- **No regressions:** the existing sites look the same as before.

## Boundaries

- **Always:** optional fields with defaults matching today's output, `safeHref` for links, alt text on images, reduced-motion support.
- **Ask first:** extending a variant to other section types than listed, or adding fields not in this table.
- **Never:** site-specific markup, free-form CSS or class names in the schema, or editing an existing theme preset.

## Success criteria

- The 9 capability keys are `supported` in the registry and `implemented` in `x-patterns`, and `family-kitchen@1.2.0` has no flags for them.
- All new fields are in the Studio and in `docs/CONFIGURATION.md`, and `specials` is in both reference files.
- Existing sites look unchanged; `npm run typecheck` and `npm run saito -- validate --all` pass.

## Open questions

- Should `features.dividers` be its own field, or implied by `iconStyle: badge`? *Recommendation:* its own field, because other designs use dividers without badges.

# Spec: `site-chrome`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: draft, awaiting review (2026-10-29). Depends on: `theme-tokens`; reuses the icon set from `section-variants`.
> **No automated tests** (decision 2026-10-29): validation is manual end-to-end testing by a person, using the checks under *Manual verification*.

## Objective

Site-wide presentation that isn't tied to one section: the header, the hero heading, section headings and page motion. Requirements per capability are in `templateExtensions.unsupportedCapabilities` of `family-kitchen/v1.ts`. This spec fixes the field names.

| Capability key | Field | Where it lives | Component |
|---|---|---|---|
| `transparent-header` | `navigation.transparent?: boolean` (default `false`). It only takes effect when the page's first section is a `hero` with `layout: image-background` and an image | `navigation` (YAML and the Studio's `siteSettings`) | `layout/Header.astro` + `web/header.ts` |
| `header-icon-links` | `navigation.iconLinks?: { icon: <social platform> \| 'email', href }[]`, rendered after the links on wide screens | `navigation` | `Header.astro` |
| `hero-wordmark` | `hero.headingSize: 'default' \| 'display'` (default `default`): heading font at a fluid display size (`clamp(4rem, 14vw, 14rem)`) | `hero` section | `sections/Hero.astro` |
| `heading-accent-bar` | `theme.headingDecoration: 'none' \| 'bar'` (default `none`): a short bar in `accent` under every section heading | `theme` (YAML only) | `ui/SectionHeader.astro` |
| `line-doodles` | `richText.doodle?: <name>` from a shared doodle set (`leaf`, `citrus`, `pod`), low-contrast beside the heading, hidden below 821 px | `richText` section | `RichText.astro` + `ui/doodles.ts` |
| `scroll-reveal` | `theme.motion?: { reveal: boolean }` (default `false`): blocks fade in and rise 24px over 700ms on entering the viewport; immediate under reduced motion | `theme` (YAML only) | `SiteLayout.astro` + `web/reveal.ts` |

`motion` sits here rather than in `theme-tokens` because scroll reveal is its only consumer (see `SPEC-theme-tokens.md`).

## Tech stack

Zod 3, Astro 5, Tailwind v4, two small web components (`header.ts`, `reveal.ts`) with no dependencies. The icon set comes from `packages/components/src/ui/icons.ts`, created by `section-variants`.

## Commands

```bash
npm run typecheck
npm run saito -- validate --all
npm run saito -- dev <site>
cd apps/studio && npm run dev
```

## Project structure

| File | Change |
|---|---|
| `packages/core/src/schema/site.ts` | `navigationSchema`: `transparent`, `iconLinks` |
| `packages/core/src/schema/theme.ts` | `headingDecoration`, `motion.reveal` |
| `packages/core/src/schema/sections.ts` | `hero.headingSize`, `richText.doodle` |
| `layout/Header.astro`, `web/header.ts` (new) | Transparent state with white text over the hero; `[data-solid]` after 60px of scroll or while the mobile menu is open; icon links |
| `sections/Hero.astro` | `display` heading size |
| `ui/SectionHeader.astro` | Accent bar when the theme asks for it |
| `sections/RichText.astro`, `ui/doodles.ts` (new) | Doodle slot |
| `layout/SiteLayout.astro`, `web/reveal.ts` (new), `global.css` | Reveal class plus an IntersectionObserver, loaded only when `theme.motion.reveal` is true |
| `apps/studio/schemaTypes/index.ts` | `navigation.transparent`, `navigation.iconLinks` (in `siteSettings`), `hero.headingSize`, `richText.doodle` |
| `docs/CONFIGURATION.md` | All six fields |
| `packages/templates/src/family-kitchen/v1.ts` | Release 1.3.0: transparent nav with icon links, display hero, bar headings, doodles on `about`/`flavors`, reveal on; remove the 6 flags. Registry keys to `supported`, `x-patterns` to `implemented` |

## Code style

Web components follow `web/contact-form.ts`: progressive enhancement, framework-independent, no work before `connectedCallback`. Without JavaScript the header is solid and every block is visible.

```ts
export class SaitoHeader extends HTMLElement {
  connectedCallback(): void {
    const bar = this.querySelector('header');
    const sync = () => bar?.toggleAttribute('data-solid', scrollY > 60 || this.hasAttribute('data-menu-open'));
    addEventListener('scroll', sync, { passive: true });
    sync();
  }
}
```

## Manual verification

On a `family-kitchen` site, side by side with the prototype:

- **Header:** transparent with white links over the hero, solid after scrolling and while the mobile menu is open. The icon links appear on desktop.
- **Hero:** the heading is the large script wordmark, and it scales down on a phone without overflowing.
- **Headings and doodles:** every section heading has the accent bar. Doodles appear beside the about and flavors headings on desktop only.
- **Reveal:** blocks fade in on scroll. With reduced motion enabled, everything is visible at once. With JavaScript disabled, nothing stays hidden.
- **Studio:** the navigation fields are editable in `siteSettings`, and the hero and doodle fields in their sections.
- **No regressions:** existing sites (none sets these fields) look unchanged.

## Boundaries

- **Always:** defaults leave existing sites unchanged; content stays visible without JavaScript; reduced motion is respected; the transparent header keeps AA contrast over the scrim.
- **Ask first:** applying the transparent header to non-hero first sections, or adding doodles to section types other than `richText`.
- **Never:** hide content that only JavaScript can reveal, or ship SVGs from third-party URLs.

## Success criteria

- The 6 keys are `supported` in the registry and `implemented` in `x-patterns`, and `family-kitchen@1.3.0` has no flags for them.
- Fields are in the Studio where they are content (navigation, hero, richText), and documented.
- `npm run typecheck` and `npm run saito -- validate --all` pass.

## Open questions

- The doodle set: use the prototype's three drawings, or draw a more general set (food, coffee, tools)? *Recommendation:* the prototype's three now; the set grows when another template needs it.

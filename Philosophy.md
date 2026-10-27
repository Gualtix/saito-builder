# Solution Philosophy

The platform follows a **shared-core, data-driven architecture**. Every site is rendered by the same engine (`apps/renderer`) from the same section components (`packages/components`) and versioned templates (`packages/templates`). This keeps the ecosystem consistent, maintainable and scalable.

## A site is data, not code

A website is configuration and content, not custom code. Each site is defined by:

- **Configuration:** `sites/<id>/site.config.yaml`, which pins a template major (e.g. `restaurant@1`) and overrides its sections, navigation, theme and SEO.
- **Content:** optional overlays from `sites/<id>/content/pages/*.yaml` or Sanity.
- **Assets:** images, logo and favicon in `sites/<id>/public/`.

Presentation logic stays in the shared components. Templates are data too: they provide each site's default pages, sections, copy and theme.

## Separation of concerns

| Layer | Defines | Lives in |
|---|---|---|
| Shared code | Behavior and presentation | `apps/renderer`, `packages/components` |
| Templates | Default structure, copy and theme | `packages/templates/src/<id>/vN.ts` |
| Site configuration | Composition, content, theme overrides | `sites/<id>/site.config.yaml` |
| Content sources | Editable copy layered on top | `sites/<id>/content/`, Sanity |
| Assets | Media and brand files | `sites/<id>/public/` |

Precedence: **template < site config < content overlay**.

## Where a change belongs

| Scope of the change | Where to make it |
|---|---|
| Every site | Shared components or the renderer |
| Every site on one template | That template: minor or patch versions propagate on the next build; breaking changes ship as a new major with a migration (`saito upgrade`) |
| One site | Its configuration, content or assets |
| Something no existing capability can express | Extend the platform: a new component variant or field, a new section type, or a new template |

A new section type touches the zod schema, the component and its registration, the Sanity schema, and `docs/CONFIGURATION.md`.

## No site-specific code

The architecture intentionally avoids site-specific code and framework-level overrides. There are no per-site Astro files. Every enhancement is designed to be reusable, composable and available to the entire platform, preserving a single source of truth and preventing long-term maintenance divergence.

---
name: html-to-site-config
description: Extract a Saito site configuration from a standalone HTML website. Reads an index.html (for example a live-sketching prototype), classifies its template taxonomy, maps its sections, theme, navigation, SEO and contact details onto the Saito schema, writes a validated sites/<id>/site.config.yaml, and enriches sites/example.config.yaml with any new template patterns it finds. Use this whenever the user wants to turn an HTML page, prototype, mockup or existing website into a Saito site, convert or import HTML into site.config.yaml, extract a template from a design, or grow the example config's taxonomy from real sites, even if they don't say "site.config.yaml".
---

# HTML → site.config.yaml

Turn a standalone HTML page into a real Saito site configuration, and feed what you learn back into the master reference.

**Outputs, every time:**
1. `sites/<id>/site.config.yaml`: a valid site that `saito validate` accepts and `saito dev` can preview.
2. `sites/example.config.yaml`, enriched only in its `x-` blocks with any template capabilities the example did not already describe.

The platform's schema is fixed for this skill. When the HTML has something the schema cannot express, document it (in `x-` blocks), never add fields the schema does not have: unknown fields inside schema objects are silently dropped, so they would vanish without an error. Implementing a new section type is a separate development task; list candidates in your report instead.

## Inputs

- **The HTML**: a file, or a folder containing `index.html`.
- **Design notes, if present**: in the live-sketching layout the HTML sits in `<template>/<template>-web-site/`, and `<template>/` may hold `DESIGN.md` and `references/tax.md`. Use them for style and classification only. They often describe the reference site the prototype was modeled on (a different business, city, prices and providers), so take every fact (name, address, phone, prices, links) from the HTML itself.
- **Site id and tenant**: use what the user gave. Otherwise derive the id from the business name in kebab-case, and use the same value for the tenant. If `sites/<id>/` already exists, stop and ask rather than overwrite a real site.
- **URLs, forms endpoint, analytics**: only if the user provides them. Never invent them; list what is missing under `x-extraction.gaps`.

## Workflow

### 1. Load the references

Read these before looking at the HTML. Together they define everything you can map to.

- `sites/example.config.yaml`: the field legend, naming conventions, every site field, and the section catalog (one example of each section type with all of its fields).
- `references/mapping.md` (in this skill): pattern → section type, theme and link rules.
- `references/enrichment.md` (in this skill): the exact structure of `x-extraction`, `x-patterns` and `x-vocabulary`.
- Templates: `npm run -s saito -- templates --json` lists them with their website types. Read the candidate template's `packages/templates/src/<id>/vN.ts` for its pages and section ids.

### 2. Outline the HTML

```bash
python3 .claude/skills/html-to-site-config/scripts/html_outline.py <file-or-folder>
```

The outline gives the page language, title and meta, Google Fonts, CSS variables and colors, border radii, the block structure with headings and element counts, links grouped by kind (anchor, phone, email, WhatsApp, social, map, external), images and forms. Treat it as a map, not a complete inventory: link lists are samples, and unusual markup can hide a block. Read the whole HTML body to collect the actual copy and confirm nothing was missed.

### 3. Classify

Fill `x-taxonomy` with the same keys as the example: industry, subIndustry, websiteTypes (only from the platform list), visualStyle, tone, audience, conversion, positioning, maturity. Prefer values already in the example's `x-vocabulary`; add new ones there only when nothing fits.

### 4. Choose a template and plan the mapping

Pick the template whose website types and page and section structure fit best. Then write the mapping before any other YAML, directly as the `x-extraction.mapping` list (`references/enrichment.md`): every visible HTML block → page and section id → section type → fidelity (`exact`, `lossy`, `unmapped`, `decorative`). Planning first catches the two most common mistakes:

- **Leftover template content.** Template sections you did not map still render with the template's placeholder copy. Set them to `false`. Disable template pages you do not use with `enabled: false`.
- **Forced mappings.** Something that has no honest equivalent (a booking widget, a drag slider) is `unmapped`, with the nearest honest fallback, usually a `cta` linking to the real thing.

Merge into an existing template section when the type matches (same id). Add new sections with a new kebab-case id and a `type`. Use `order` to reproduce the HTML's sequence.

A single-page source usually stays single-page: keep everything on `index`, disable the template's other pages, and set each section's `anchor` to the original HTML id so in-page links keep working.

Sometimes an honest fallback needs copy the HTML does not have (a button label for a booking fallback, for example). Write it in the site's language, keep it minimal, mark the mapping entry with `authored: true`, and list it under `gaps` so a human reviews it.

### 5. Write `sites/<id>/site.config.yaml`

Follow the example's field order and comment style, without its reference-only material. Use a short header comment naming the source HTML.

- `id`, `tenant`, `name`, `description`, `locale`, `template`
- `environments`: `development: { url: http://localhost:4321 }`, plus staging and production only if known
- `brand`, `theme` (the full palette mapped per `references/mapping.md`), `navigation`, `footer`, `seo` (`schemaType` such as `Restaurant` or `LocalBusiness`), `integrations` (only real values)
- `pages` with the planned overrides
- `x-taxonomy` and `x-extraction` near the top, per `references/enrichment.md`

Keep the site's own language and copy. Use YAML anchors for values repeated across the file (phone, primary call to action), as the example does; an `x-components` block for them is fine in a site config too, since `x-` keys are dropped. Quote hex colors, times, and any text containing `: `.

### 6. Enrich `sites/example.config.yaml`

For every `lossy`, `unmapped` and `decorative` entry, check `x-patterns` and either add a generic entry or update the existing one (`occurrences`, `seenIn`, `fields`). Add any new taxonomy values to `x-vocabulary`, and distinctive new token categories to `x-tokens`. Then bump `x-meta.referenceVersion` (minor) and `lastReviewed`. Keep the example generic: no business names, copy or URLs. Its validated fields and section catalog mirror the schema, so leave them alone. The quoting rule applies here too: a `fallback:` or `description:` containing `: ` must be quoted, and only the vitest run below catches it (`saito validate` does not read the example).

### 7. Validate

```bash
npm run -s saito -- validate <id>
npx vitest run packages/core/test/example-config.test.ts
```

Fix and re-run until both pass. Validation reports every issue with its path (e.g. `pages.index.sections.hero.heading`), so fix them all in one pass.

Then build once and check the output without a server:

```bash
npm run -s saito -- build <id>
python3 .claude/skills/html-to-site-config/scripts/html_outline.py dist/development/<id>/index.html
```

Compare that outline with the source's: the in-page anchors you kept exist, there is no unexpected `href="#"` (a dropped or placeholder link), and the section order matches. On a non-English site, expect the renderer's English labels (see Pitfalls) and report them. If browser tools are available and a dev server is allowed, also preview with `npm run saito -- dev <id>`.

### 8. Report

Tell the user, briefly:

- the template chosen and why, and where the file is
- the mapping summary: how many blocks are exact, lossy, unmapped and decorative, naming the lossy and unmapped ones
- what was added to the example (`x-patterns` entries, vocabulary values)
- gaps needing a human (missing URLs, forms endpoint, hotlinked images to license and download, English UI labels on a non-English site)
- candidates for real development (patterns seen in more than one extraction are the strongest)

A committed `sites/<id>/` joins CI builds and deploys, so mention that before the user commits it.

## Pitfalls

- `id` must equal the directory name; ids, tenants and section ids are kebab-case.
- Arrays replace the template's list; objects merge. `null` deletes a key.
- `menu` and `products` prices are numbers; `pricing` prices are display strings.
- `countdown.target` needs a timezone offset (`2027-03-11T09:00:00-06:00`).
- `footer.social` only accepts x, facebook, instagram, linkedin, youtube, github and tiktok.
- Links: only `http(s):`, `mailto:`, `tel:`, `/…` and `#…` survive. Anything else renders as `#`.
- Font names allow letters, digits and spaces only.
- The contact form only appears when `integrations.forms` is set.

Renderer facts (radius, dark bands, card borders, English labels, price formatting and more) are listed in `references/mapping.md` section 6; read it before writing the theme and sections.

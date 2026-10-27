---
name: html-to-template
description: Generate a reusable Saito template (packages/templates/src/<id>/v1.ts) from a standalone HTML website. Analyzes an index.html (for example a live-sketching prototype), keeps its structure and look (sections, variants, palette, fonts), replaces the business's identity with generic placeholders, adds a theme preset to themes.ts when the palette is new, registers the template in the marketplace, and enriches template.example.ts and the shared pattern catalog with what the design teaches. Use this whenever the user wants to create, scaffold, extract or derive a template, theme or marketplace starter from an HTML page, prototype, mockup or existing site, or says things like "make this design a template" or "add this as a new template", even if they don't name packages/templates. For turning HTML into one specific site's config instead, use html-to-site-config.
---

# HTML → template

Turn a standalone HTML design into a published, reusable template that any site can pin (`saito create <site> --template <id>`), and feed what the design teaches back into the template references.

**Outputs, every time:**
1. `packages/templates/src/<id>/v1.ts`: a valid template module, registered in `packages/templates/src/index.ts`.
2. `packages/templates/src/themes.ts`: a new preset only if no existing one fits.
3. Enrichment of the shared references (`template.example.ts`, and the `x-patterns` / `x-vocabulary` catalogs in `sites/example.config.yaml`) with anything new the design shows.

**Not the same as `html-to-site-config`.** That skill makes one business's site from its HTML; this one makes a template many businesses can use. The difference matters for content: a template keeps the design's structure and look, but replaces the business's identity (name, phone, address, prices, reviewers, URLs) with generic placeholders in the source language. After finishing, offer to run `html-to-site-config` on the same HTML with this new template, which turns the original business into the first site built on it.

The platform schema is fixed for this skill: no new section types, fields or component changes. What the schema cannot express is recorded (in `templateExtensions` and the pattern catalog), never forced into fields that would be silently dropped.

## Inputs

- **The HTML**: a file, or a folder containing `index.html`. In the live-sketching layout, `DESIGN.md` and `references/tax.md` next to the HTML's folder describe the design intent: use them for style and classification, but take facts from the HTML (they may describe the site the prototype was modeled on).
- **Template id**: use the user's choice; otherwise derive one by the naming rules in `references/template-guide.md` section 2. Stop and ask if `packages/templates/src/<id>/` exists or the id is already registered.

## Workflow

### 1. Load the references

- `packages/templates/src/template.example.ts`: the annotated manifest, naming conventions, versioning rules, override contract, and `templateExtensions` shape.
- `packages/templates/src/themes.ts`: the existing presets.
- One real template for tone and size, e.g. `packages/templates/src/restaurant/v1.ts`.
- `.claude/skills/html-to-site-config/references/mapping.md`: HTML patterns → section types, theme slots, link rules (shared with the sibling skill).
- `references/template-guide.md` (this skill): writing the module, placeholders, images, registration, smoke test.
- `references/enrichment.md` (this skill): what goes where when the design teaches something new.
- `npm run -s saito -- templates` lists the registered ids and their website types.

### 2. Outline the HTML

```bash
python3 .claude/skills/html-to-site-config/scripts/html_outline.py <file-or-folder>
```

A map of the page (language, fonts, CSS variables, colors, radii, blocks with headings, links by kind, images, forms). Then read the whole HTML body: the outline is not a complete inventory.

### 3. Classify and plan

- Classify (industry, website types, visual style, tone, conversion, positioning) with values from `x-vocabulary`; this becomes `templateExtensions.taxonomy`.
- Choose the id and decide single-page vs multi-page.
- Plan every visible block → section id → type → fidelity (`exact`, `lossy`, `unmapped`, `decorative`) before writing code. Lossy, unmapped and decorative blocks map to `x-patterns` keys.
- Decide the theme: an existing preset, a preset with overrides, or a new preset (`references/template-guide.md` section 4).

### 4. Write the template

Create `packages/templates/src/<id>/v1.ts` following `references/template-guide.md` sections 3–6: the existing templates' shape, generic placeholder copy in the source language, no local image paths, required-image sections with working absolute placeholder URLs, and an exported `templateExtensions` (source, taxonomy, patterns, assets, requiredContent).

### 5. Theme preset (only if needed)

Append a complete, contrast-checked preset to `themes.ts`, named after its look (`references/enrichment.md`). Never modify an existing preset: other templates and live sites use it.

### 6. Register

Add the module to the registry in `packages/templates/src/index.ts`.

### 7. Enrich the references

Apply `references/enrichment.md`: pattern entries in `x-patterns`, vocabulary values in `x-vocabulary`, theme capabilities beyond the schema in `template.example.ts` tokens, reusable authoring conventions in `template.example.ts`. Generic and backward-compatible only.

### 8. Validate

```bash
npx tsc -p tsconfig.json --noEmit
npm test
npm run -s saito -- templates <id>
```

Then the throwaway-site smoke test in `references/template-guide.md` section 8 (create, build, outline the output, remove). Fix and re-run until everything passes. `npm test` covers the reference files (`template.example.ts`, `sites/example.config.yaml`) and the Sanity round trip for every site.

### 9. Report

Tell the user briefly:

- the template id, name and file, which preset it uses (and whether it is new), its pages and section ids (the override contract)
- the mapping summary: exact, lossy, unmapped and decorative counts, naming the lossy and unmapped blocks
- the enrichment: new preset, pattern entries, vocabulary values, tokens or conventions added
- what a site must supply (`requiredContent`, placeholder images to replace)
- that the registry edit makes CI rebuild every site on that commit
- the offer to run `html-to-site-config` for the original business on this template

## Pitfalls

- Section ids and page slugs are the template's public API: name them by role, because renaming later needs a new major and a migration.
- No business identity in the template; keep generic industry nouns.
- `defineTemplate` rejects unknown manifest fields at compile time, and zod drops unknown fields inside sections: keep extras in `templateExtensions`.
- Links: only `http(s):`, `mailto:`, `tel:`, `/…` and `#…` survive rendering.
- `theme.radius` is one value for every rounded element; `full` turns cards into pills.
- `footer.legal` is printed after `© <year> <site name>.`.
- `menu`/`products` prices are numbers, `pricing` prices are strings, `countdown.target` needs a timezone offset.
- The contact form only renders when a site sets `integrations.forms`, and its labels are hardcoded in English.
- More renderer facts (dark bands, card borders, icon badges, the English "Buy" button, price formatting) are in `.claude/skills/html-to-site-config/references/mapping.md` section 6.

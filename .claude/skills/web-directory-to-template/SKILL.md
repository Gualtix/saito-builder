---
name: web-directory-to-template
description: Generate a reusable Saito template (packages/templates/src/<id>/v1.ts) from a whole web project directory. Recursively inspects every file (HTML pages, stylesheets and design tokens, scripts and custom elements, data and content modules, manifest and service worker, assets, configuration and docs), treats the directory as the source of truth, keeps the design's structure and look (sections, variants, palette, fonts), replaces the business's identity with generic placeholders, adds a theme preset to themes.ts when the palette is new, registers the template in the marketplace, and enriches template.example.ts and the shared pattern catalog with what the project teaches. Use this whenever the user wants to create, scaffold, extract or derive a template, theme or marketplace starter from a website folder, prototype, live-sketching project, mockup or existing site, or says things like "make this design a template" or "add this as a new template", even if they don't name packages/templates or the input is a single index.html.
---

# Web directory → template

Turn a web project directory into a published, reusable template that any site can pin (`saito create <site> --template <id>`), and feed what the project teaches back into the template references.

**The directory is the source of truth.** A modern prototype spreads one design across files by responsibility: markup in pages, tokens in stylesheets, content in data modules, behaviour in components, the app shell in a manifest and a service worker. No single file describes the site. Map every layer, and account for every file.

**Outputs, every time:**
1. `packages/templates/src/<id>/v1.ts`: a valid template module, registered in `packages/templates/src/index.ts`.
2. `packages/templates/src/themes.ts`: a new preset only if no existing one fits.
3. Enrichment of the shared references (`template.example.ts`, and the `x-patterns` / `x-vocabulary` catalogs in `sites/example.config.yaml`) with anything new the project shows.
4. A report that accounts for every file in the directory.

**A template, not a site.** A template keeps the design's structure and look but replaces the business's identity (name, phone, address, prices, reviewers, URLs, app name) with generic placeholders in the source language. The original business becomes the first site built on the template, in a separate step.

The platform schema is fixed for this skill: no new section types, fields or component changes. **Don't force the design to fit what the platform renders today.** Keep an honest fallback so the template builds, and flag every component, feature or piece of infrastructure the Astro renderer lacks as an **unsupported capability**: why the design has it, how it behaves, and what the platform must add (`references/template-guide.md` section 9). Never force it into fields that would be silently dropped. The flags are the requirements backlog for full-fidelity templates; building them is platform work (`docs/EXTENDING-THE-PLATFORM.md`).

## Inputs

- **The web directory**, for example `live-sketching/eatery-cafe/tangerine/tangerine-web-site`. A single `index.html` is a directory with one page: pass its folder. In the live-sketching layout, `DESIGN.md` and `references/` next to the directory describe the design intent. Use them for style and classification, but take facts from the files that render, because they may describe the site the prototype was modelled on.
- **Template id**: use the user's choice; otherwise derive one by the naming rules in `references/template-guide.md` section 2. Stop and ask if `packages/templates/src/<id>/` exists or the id is already registered.
- **Fidelity target**: content-equivalent by default, or indistinguishable if the user asks for it (`docs/EXTENDING-THE-PLATFORM.md`, Step 3). It changes what the report asks the platform to build, not the template you write.

## Workflow

### 1. Load the references

- `packages/templates/src/template.example.ts`: the annotated manifest, naming conventions, versioning rules, override contract, and `templateExtensions` shape.
- `packages/templates/src/themes.ts`: the existing presets.
- One real template for tone and size, e.g. `packages/templates/src/restaurant/v1.ts` or `casual-eatery/v1.ts`.
- `references/mapping.md`: project layers → platform artifacts, section patterns → section types, theme slots, link rules, renderer facts.
- `references/template-guide.md`: writing the module, placeholders, images, registration, smoke test.
- `references/enrichment.md`: what goes where when the project teaches something new.
- `npm run -s saito -- templates` lists the registered ids and their website types.

### 2. Inventory the directory

```bash
python3 .claude/skills/web-directory-to-template/scripts/project_inventory.py <web-directory>
```

It walks the directory recursively without running any of its code, and gives every file a role: page, stylesheet, script, data, manifest, service-worker, image, font, doc, config, tooling or other. It reports:

- each page's outline, with its local stylesheets merged in, so `styles.css` tokens appear in `cssVariables`, along with blocks (`hidden` ones flagged), links, images, entry scripts and the custom elements it uses
- the module graph from those entry scripts (`reached`, and `unreached` files that are dead)
- each custom element, the file that defines it and where it is used
- browser APIs per script (geolocation, storage, service worker, dialog…), external URLs, self-tests
- data modules' top-level keys and array sizes, the manifest, service-worker caches, image sizes, remote image hosts
- git-ignored files, skipped directories and the design context next to the directory

`html_outline.py <page.html>` outlines one page on its own.

### 3. Read the project

The inventory is a map, not a complete inventory. Read, in this order:

1. **Every page** that is part of the site, whole (the body, and the head for meta, fonts, manifest and icons).
2. **Stylesheets**: the token block (`:root`, `@theme`) and every rule the markup opts into (keyframes, state classes).
3. **Data and content modules**, whole: products, settings, UI strings.
4. **Every module the entry scripts reach**, starting with the entry: what each custom element renders, which data it reads, which strings it shows, which services it calls.
5. **The app shell**: manifest, service worker, offline page.
6. **Docs and design context**: for intent and classification only.

Skim tooling and assets; don't map them.

### 4. Model, classify and plan

- Map each layer with `references/mapping.md` section 1, and reconcile them: what renders wins over comments, docs and design briefs. Unreached code is dead: report it, don't map it.
- Classify (industry, website types, visual style, tone, conversion, positioning) with values from `x-vocabulary`; this becomes `templateExtensions.taxonomy`.
- Choose the id and decide single-page or multi-page (one template page per HTML page that is part of the site).
- Plan every visible block **and every behaviour** → section id → type → fidelity (`exact`, `lossy`, `unmapped`, `decorative`) before writing code. Cite the source files for each row. Every lossy, unmapped and reusable decorative row is an unsupported capability with an `x-patterns` key.
- Hidden blocks become optional sections when they belong to the use case (`mapping.md` section 6).
- Decide the theme: an existing preset, a preset with overrides, or a new preset (`references/template-guide.md` section 4).

### 5. Write the template

Create `packages/templates/src/<id>/v1.ts` following `references/template-guide.md` sections 3–6. Follow the existing templates' shape, write generic placeholder copy in the source language, use no local image paths, and give sections that require images working absolute placeholder URLs. Export a `templateExtensions` with source (the directory), taxonomy, unsupportedCapabilities, tokens, assets, integrationSettings, requiredContent and optionalSections.

Flag each unsupported capability in two places (`references/template-guide.md` section 9): a `// UNSUPPORTED <key> → <fallback>` comment where the fallback renders, and an entry in `templateExtensions.unsupportedCapabilities` with `affects`, `purpose`, `expectedBehavior`, `requirements` and `fallback`.

### 6. Theme preset (only if needed)

Append a complete, contrast-checked preset to `themes.ts`, named after its look (`references/enrichment.md`). Never modify an existing preset: other templates and live sites use it.

### 7. Register

Add the module to the registry in `packages/templates/src/index.ts`.

### 8. Enrich the references

Apply `references/enrichment.md`: pattern entries in `x-patterns` (behaviours and app-shell features included), newly discovered capabilities in the `template.example.ts` registry (`templateExtensions.capabilities`, marked `support: 'unsupported'`), vocabulary values in `x-vocabulary`, theme capabilities beyond the schema in `template.example.ts` tokens, and reusable authoring conventions in `template.example.ts`. Generic and backward-compatible only.

### 9. Validate

```bash
npx tsc -p tsconfig.json --noEmit
npm test
npm run -s saito -- templates <id>
```

Then run the throwaway-site smoke test in `references/template-guide.md` section 8 (create, build, outline the output, remove). Fix and re-run until everything passes. `npm test` covers the reference files (`template.example.ts`, `sites/example.config.yaml`) and the Sanity round trip for every site.

### 10. Report

Tell the user briefly:

- the template id, name and file, which preset it uses (and whether it is new), its pages and section ids (the override contract), and its optional sections
- the mapping summary: exact, lossy, unmapped and decorative counts, naming the lossy and unmapped blocks and behaviours
- **file coverage**: every file in the inventory is either mapped (to a section, theme, navigation or footer), recorded (a pattern, an asset a site must supply), used as context (docs, design brief), or skipped with a reason (tooling, dead code, git-ignored). Group the files by role; don't list each image.
- the enrichment: new preset, pattern entries, vocabulary values, tokens or conventions added
- what a site must supply (`requiredContent`, placeholder images to replace, local assets, the settings an integration needs)
- the unsupported capabilities: how many, which are new to the registry, and the ones that block the primary conversion or the fidelity target. They are the platform requirements this template creates
- that the registry edit puts every site in `saito affected`, so they all need redeploying
- the offer to create the original business as the first site on this template

## Pitfalls

- Section ids and page slugs are the template's public API: name them by role, because renaming later needs a new major and a migration.
- No business identity in the template, wherever it hides: data files, meta tags, manifest, cache names, storage keys, alt text. Generic industry nouns and the market (currency, country format) are fine.
- Don't trust a single file. Comments, docs and briefs can be stale; the markup, data and CSS that load are the truth.
- A component that renders content (a catalogue fed by a data file) is still content: map the data to the section it fills, and flag the behaviour separately as an unsupported capability.
- Don't drop a feature because the platform can't render it, and don't approximate it silently: every fallback has a flag.
- `defineTemplate` rejects unknown manifest fields at compile time, and zod drops unknown fields inside sections: keep extras in `templateExtensions`.
- Links: only `http(s):`, `mailto:`, `tel:`, `/…` and `#…` survive rendering.
- `theme.radius` is one value for every rounded element; `full` turns cards into pills.
- `footer.legal` is printed after `© <year> <site name>.`.
- `menu`/`products` prices are numbers, `pricing` prices are strings, `countdown.target` needs a timezone offset.
- The contact form only renders when a site sets `integrations.forms`, and its labels are hardcoded in English.
- More renderer facts (dark bands, card borders, icon badges, the English "Buy" button, price formatting) are in `references/mapping.md` section 7.

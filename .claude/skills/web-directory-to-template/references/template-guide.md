# Writing the template module

How to turn the planned mapping into `packages/templates/src/<id>/v1.ts`. The annotated reference for every field is `packages/templates/src/template.example.ts`; this guide covers what is specific to generating a **published** template from a web project.

## Contents
1. A template is not a site
2. Naming
3. File skeleton
4. Theme
5. Pages and sections
6. Placeholder content and images
7. Registration
8. Smoke test
9. Unsupported capabilities

## 1. A template is not a site

A template is reused by many businesses. Keep the design's **structure** (which sections, in which order, which variants, which calls to action) and its **look** (palette, fonts, radius), but replace the business's **identity** with generic placeholder copy:

| Keep (structure and look) | Replace with placeholders |
|---|---|
| Section sequence, types, layouts, backgrounds, column counts | Business name, logo text, tagline that names the business |
| Navigation shape (which links, which CTA) | Phone numbers, email, street address, map URLs |
| Kinds of content (menu categories, plan tiers, FAQ topics) | Prices tied to that business, named reviewers, social profile URLs |
| Palette, fonts, radius, dark/light | Third-party IDs (booking, delivery, analytics) |

Generic industry nouns are fine ("Desayunos", "Plato del día", "Consulta inicial"); anything that identifies one business is not. Write placeholders in the project's language, realistic enough that a fresh site looks finished.

**Identity is spread across the project**, not only in the visible copy. Check every place the inventory points to: data files (business name, phone, products), `<title>` and meta tags (`apple-mobile-web-app-title`, `og:*`), JSON-LD, the web manifest (`name`, `short_name`), service-worker cache names, browser-storage keys, order-id prefixes, image `alt` text, file comments and docs. None of it goes into the template.

**Identity vs market.** The design's market is part of the template, not identity: keep its currency (`GTQ`), phone country format (`+502`), and regional product names ("shuco", "rellenitos") when they define who the template is for, and mention the market in `description` and `tags`. Identity is what points to one business. Reviews may use fictional first name + initial ("María L."), listed in `requiredContent` so sites replace them.

## 2. Naming

- **Template id**: kebab-case, named after the use case, not the business or the prototype folder. If the use case is already taken (run `npm run -s saito -- templates`), add the distinguishing trait: `family-restaurant`, `fresh-cafe`, `bakery-classic`. The id is permanent: sites pin it.
- **name**: Title Case for the marketplace, in the template's language is fine ("Cocina Familiar").
- **Section ids**: kebab-case, by role (`hero`, `story`, `menu`, `visit`, `reviews`), never by look (`orange-band`). They are the template's API: renaming one later is a breaking change.
- **File**: `packages/templates/src/<id>/v1.ts`; version `1.0.0`.

## 3. File skeleton

Follow the shape of the existing templates (`restaurant/v1.ts`, `landing/v2.ts`), not the reference-only parts of `template.example.ts` (no section catalog page, no `exampleMigration`, no long field-by-field comments).

```ts
import { defineTemplate, type Link, type SectionInput } from '@saito/core';
import { themes } from '../themes.ts';

/**
 * <Name>: <one sentence: who it is for>.
 * Extracted from <source path> on <date>. Sections: <page: ids>.
 */

// Reusable fragments: only for values used more than once.
const actionPrimary = { label: '…', href: '#…' } satisfies Link;

const template = defineTemplate({
  id: '<id>',
  name: '<Name>',
  version: '1.0.0',
  description: '<one sentence>',
  websiteTypes: [/* from schema/template.ts */],
  tags: [/* kebab-case */],
  theme: themes.<preset>,               // or { ...themes.<preset>, colors: { ...themes.<preset>.colors, primary: '#…' } }
  navigation: { links: [/* … */], cta: actionPrimary },
  footer: { /* tagline, columns, legal without © */ },
  seo: { schemaType: '<Organization | LocalBusiness | Restaurant | Event | Person>' },
  pages: [/* … */],
  changelog: [{ version: '1.0.0', notes: 'Initial release.' }],
});

export default template;

// Not read by the renderer; used by generators and the extraction skills.
export const templateExtensions = {
  source: '<path to the web directory>',
  taxonomy: { /* same keys as templateExtensions.taxonomy in template.example.ts */ },
  unsupportedCapabilities: { /* one flag per capability the platform cannot render yet: section 9 */ },
  assets: { required: [/* … */], placeholderImages: [/* absolute URLs used as placeholders */] },
  requiredContent: [/* override paths a site must replace before launch */],
  optionalSections: [/* section ids the source hid; sites turn them off with sections.<id>: false */],
} as const;
```

`defineTemplate` validates on import, so a broken manifest fails the first command that loads the registry.

## 4. Theme

1. Map the project's design tokens to the 9 slots, fonts and radius using `mapping.md` section 4 (radius comes from cards, never `full` for pill buttons).
2. Compare with the presets in `packages/templates/src/themes.ts`:
   - **Close to a preset** (same mode and fonts, colors differ only in a slot or two): spread it and override those slots.
   - **Distinct**: add a new preset to `themes.ts` (see `enrichment.md`) and use it.
3. Never edit an existing preset: live templates and every site built on them read those values.

## 5. Pages and sections

- Plan every visible block and behaviour → section id → type → fidelity first (`exact`, `lossy`, `unmapped`, `decorative`), using `mapping.md` sections 1–3. Lossy and unmapped capabilities become `templateExtensions.patterns` keys (see `enrichment.md`). Decorations get a pattern only when they are a reusable design device another template could want (organic blobs, line doodles); one-off ornaments are just listed. Report decorations as one list, not a count.
- Before writing the theme and sections, read the renderer facts in `mapping.md` section 7: several design choices (dark bands, card borders, icon badges, English buttons) depend on them.
- A single-page project stays single-page: one `index` page, sections in the markup's order, navigation links as `#section-id`. A multi-page project keeps its pages (one per HTML page that is part of the site, not error or offline pages), with slugs by role (`menu`, `about`, `contact`); shared header and footer markup becomes `navigation` and `footer`.
- Every section needs `id` + `type` and all of the type's required fields (the section catalog in `template.example.ts` and `sites/example.config.yaml` shows each type with every field).
- Use the variants that reproduce the design: hero `layout`, `columns`, per-section `background` (`default | surface | primary | dark`) to rebuild the band rhythm.
- Unmapped interactions get the honest fallback (usually a `cta` to the real thing), never a misleading section.
- Every block that falls back is flagged as an unsupported capability (section 9).
- Blocks the source hides become optional sections (`mapping.md` section 6), listed in `templateExtensions.optionalSections`.

## 6. Placeholder content and images

- Copy: generic, in the source language, realistic (see section 1).
- Images (the convention in `templateExtensions.assets.placeholderImages` of `template.example.ts`):
  - Optional image fields (`hero.image`, team `photo`, testimonial `avatar`, product `image`): leave unset. A new site's `public/` folder is empty, so a local path would render as a broken image.
  - Sections that require images (`gallery.images`): use absolute placeholder URLs that work out of the box (the design's licensed stock URLs are fine), and list them in `templateExtensions.assets.placeholderImages` and `requiredContent`.
  - The project's own local files (photos, icons, splash screens, fonts) can't ship with a template. List what a site must supply in `templateExtensions.assets.required` and `optional`, with the sizes the inventory reports (for example `app icons 192×192 and 512×512, maskable`).
- Contact details: obviously fake but well-formed values (`hola@ejemplo.com`, `+502 0000 0000`), so validation passes and nobody mistakes them for real ones.
- `footer.legal` is printed after `© <year> <site name>.`: never repeat the © or a name.
- Prices in `menu`/`products` are numbers; `pricing` prices are display strings.

## 7. Registration

Add the import and the module to the registry in `packages/templates/src/index.ts`, keeping the existing order style:

```ts
import familyRestaurantV1 from './family-restaurant/v1.ts';
export const registry = new TemplateRegistry([/* existing… */, familyRestaurantV1]);
```

A registry edit counts as platform code: `saito affected` then lists every site, and they all need redeploying (`./deploy.sh <env> --all`; there is no CI). Mention it in the report.

## 8. Smoke test

The registry loading proves the manifest is valid; a throwaway site proves it renders.

```bash
npm run -s saito -- templates <id>
npm run -s saito -- create tmp-<id>-smoke --template <id> --tenant tmp
npm run -s saito -- build tmp-<id>-smoke
python3 .claude/skills/web-directory-to-template/scripts/html_outline.py dist/development/tmp-<id>-smoke/index.html
```

Before building, edit the throwaway site: `saito create` writes `locale: en` and an English hero-heading override, so set `locale` to the template's language (e.g. `es-GT`) and delete its `pages:` block. Then the build shows the template exactly as a new site gets it, with correctly formatted prices.

Check in the outline: every section is present in order, in-page anchors exist, no unexpected `href="#"`. If a browser is available and a static server or dev server is allowed, also look at the page (contrast, card borders, empty image slots); otherwise say it was not viewed.

Clean up all three generated folders: `sites/tmp-<id>-smoke/`, `dist/development/tmp-<id>-smoke/` and the Astro cache `apps/renderer/node_modules/.astro/tmp-<id>-smoke/`. Say in the report if you could not.

## 9. Unsupported capabilities

**Don't force the design to fit the platform.** When the renderer lacks the component, field, token or infrastructure a source feature needs, keep the nearest honest fallback in the manifest, so the template still builds, and **flag the gap**. Flags are the requirements the platform must meet before the template can render the source at full fidelity. Write them for the engineer who will build the feature without opening the source project.

A capability is unsupported when the shared renderer can't produce it from schema fields. That covers missing section types or fields, component variants, visual decorations, interactive behaviour (web components), site-wide tokens, build output (head tags, headers, service workers), integrations, and component copy the platform hard-codes. It includes everything rated `lossy`, `unmapped` or reusable `decorative`. It does not include business content a site supplies (photos, copy), or a placeholder convention such as leaving `hero.image` unset.

**1. Inline flag** on every section, `navigation`, `footer` or `pages` entry that renders a fallback, one line per capability, directly above its `id` (or the key):

```ts
          // UNSUPPORTED image-marquee → static 4-column gallery
          id: 'featured-dishes',
```

The format is fixed (`UNSUPPORTED <x-patterns key> → <what renders instead>`), so `grep -rn "UNSUPPORTED" packages/templates/src` lists every gap.

**2. Entry** in `templateExtensions.unsupportedCapabilities`, keyed by the same `x-patterns` key:

```ts
  unsupportedCapabilities: {
    'image-marquee': {
      affects: ['featured-dishes'],         // section ids, or 'header' | 'footer' | 'site'
      purpose: 'Show many dishes in little space and add motion to the page.',
      expectedBehavior: 'One row of captioned rounded photos scrolling left in a seamless loop; pauses on hover; static under prefers-reduced-motion.',
      requirements: ['gallery layout: marquee (schema, Gallery.astro, Studio)', 'CSS keyframes; script only to duplicate the track'],
      fallback: 'static 4-column gallery',
    },
  },
```

- **purpose**: the visitor or business goal it serves, not what it looks like.
- **expectedBehavior**: what the source does, with the numbers needed to rebuild it: sizes, counts, breakpoints, states, timing, accessibility (reduced motion, labels, keyboard). Take them from the CSS and scripts, not from memory.
- **requirements**: each platform change, naming the layer: schema field or section type, component or variant, web component, theme token, build output, Studio and seed, docs, third-party dependency (pinned, with SRI), browser permission. Include which settings a site would supply (and list them in `integrationSettings`).
- **fallback**: what the template renders today. It matches the inline flag.
- One entry per capability, even when it affects several sections; list them all in `affects`.

**3. Registry**: every key must exist in `template.example.ts` → `templateExtensions.capabilities`, with `support: 'unsupported'`, and in `x-patterns`. Add newly discovered capabilities to both (`enrichment.md`). `packages/templates/test/template-example.test.ts` checks that templates, the registry and the catalog agree, that every flag is complete, and that every `affects` id exists.

Templates extracted before this convention list keys in `templateExtensions.patterns` only. When you re-extract one, replace `patterns` with `unsupportedCapabilities`.

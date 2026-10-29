# Spec: `ui-strings`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: implemented (2026-10-29), awaiting Checkpoint A. Depends on: nothing. Needed by: `whatsapp-commerce`, `pwa`. Capability key: `localized-ui-labels`.
> **No automated tests** (decision 2026-10-29): no tests are written or run for this module. Validation is manual end-to-end testing by a person, using the checks under *Manual verification*.

## Objective

Component chrome (labels the renderer writes itself, not content from the site config) is in the site's language. Today it is hard-coded in English, so a Spanish site shows "Menu", "Address" or "Opening hours" in the middle of Spanish content.

**Who needs it:** every non-English site. The Date El Gusto showcase must be indistinguishable from a fully Spanish prototype.

**What it is:** one shared strings module in `packages/components`, keyed by language and chosen from `site.locale`, which every component reads. It is the mechanism `whatsapp-commerce` and `pwa` add their copy to later (one mechanism per concern).

### Inventory of hard-coded copy (complete as of 2026-10-29)

| File | Strings |
|---|---|
| `layout/SiteLayout.astro` | "Skip to content" |
| `layout/Header.astro` | "Menu" (mobile button), "Cart" (Snipcart button), `aria-label` "Main", "Mobile" |
| `sections/Contact.astro` | "Address", "Contact", "Opening hours", form labels "Name", "Email", "Message" |
| `web/contact-form.ts` | "Sending…", "Thanks! Your message has been sent.", "Sorry, something went wrong. Please try again later." |
| `web/countdown.ts` | "Days", "Hours", "Minutes", "Seconds" |
| `sections/Products.astro` | "Buy" |
| `ui/AddToCart.astro` | "Add to order" |
| `packages/core/src/schema/sections.ts` | defaults `contact.form.submitLabel` "Send message", `successMessage` "Thanks! We will get back to you shortly.", `countdown.expiredText` "It has started!" |

Platform names in `layout/Footer.astro` (Facebook, Instagram…) are brand names, not chrome: they stay.

## Tech stack

TypeScript and Astro 5 components. No i18n library: two locales and about 25 strings don't justify a dependency.

## Commands

```bash
npm run typecheck                             # build check: astro check type-checks packages/components
npm run saito -- build date-el-gusto          # es-GT; inspect the HTML
npm run saito -- build acme-corp              # en; must be unchanged
```

## Project structure

| File | Change |
|---|---|
| `packages/components/src/strings.ts` | **New.** The `en` dictionary, `es` typed to have exactly the same keys, and `strings(locale)` |
| The 7 component files in the inventory | Read labels from `strings(site.locale)` instead of literals |
| `web/contact-form.ts`, `web/countdown.ts` | Take their copy from `data-*` attributes set by the Astro component (they stay framework-independent, as `success-message` already does) |
| `packages/core/src/schema/sections.ts` | Make `submitLabel`, `successMessage` and `expiredText` optional with no default. The component falls back to the locale string, and an explicit site value still wins |
| `docs/CONFIGURATION.md` | One line: component labels follow `locale` (`en`, `es`); other languages fall back to English |
| `packages/templates/src/family-kitchen/v1.ts` | After release: remove the `localized-ui-labels` flags, and set `support: 'supported'` in the `template.example.ts` registry and `status: implemented` in `x-patterns` |

## Code style

```ts
// packages/components/src/strings.ts
const en = {
  skipToContent: 'Skip to content',
  menu: 'Menu',
  navMain: 'Main',
  navMobile: 'Mobile',
  address: 'Address',
  // …
};

const es: Record<keyof typeof en, string> = {
  skipToContent: 'Saltar al contenido',
  menu: 'Menú',
  navMain: 'Principal',
  navMobile: 'Móvil',
  address: 'Dirección',
  // …
};

const byLanguage = { en, es };

/** UI copy for a BCP 47 locale ("es-GT" → es); unknown languages fall back to English. */
export function strings(locale: string) {
  return byLanguage[locale.split('-')[0].toLowerCase() as keyof typeof byLanguage] ?? en;
}
```

In a component: `const t = strings(site.locale);`, then `{t.address}`. Keys are camelCase and named by meaning (`openingHours`), not by component. A missing Spanish key is a type error, so a new component can't ship English-only by accident.

## Manual verification

- **Spanish site:** open an `es-GT` site in the browser. Every label in the inventory is in Spanish: the mobile menu button, contact labels, form labels and messages (submit the form), countdown units, `aria-label`s (check with the browser's accessibility panel).
- **English site:** open an `en` site and compare it with the deployed version. It must look and read the same.
- **Fallback:** a site with `locale: fr` shows the English labels.

## Boundaries

- **Always:** keep the exact current English text, so English sites don't change. Keep `aria-label`s translated too.
- **Ask first:** adding a third language, or per-site string overrides (assumption 3 of the map: not until a site needs them).
- **Never:** add an i18n dependency, put strings in the site config schema, or translate content fields.

## Success criteria

- An `es-*` site renders none of the inventory's English strings, `aria-label`s included.
- An `en` site's HTML is identical before and after, apart from asset hashes.
- `npm run typecheck` passes, and `saito seed <site> --dry-run` still works for a site with a contact form.
- The `localized-ui-labels` capability is `supported`, and its flags are gone from `family-kitchen`.

## Decisions made during the build (2026-10-29)

- **Attribute names:** the web components take their copy through plain kebab-case attributes (`sending-message`, `error-message`, `days-label`…), not `data-*`, to match the existing `success-message` and `expired-text`.
- **Extra key:** `map`, for the map iframe's accessible `title`. The honeypot label stays English (hidden and `aria-hidden`).
- **Menu.astro** also passes the add-to-cart label; `AddToCart`'s `label` prop is required, so a missed caller is a type error.
- **Open question resolved:** the seed builds documents from the resolved site (not the YAML), but `siteToSanityDocuments` skips `undefined`, so the optional fields are simply left out of the documents. The schema has no defaults. The `seed --dry-run` itself was not run: it needs `SANITY_PROJECT_ID`.

## Open questions (resolved, see above)

- Changing three schema defaults to "optional, falls back to the locale" changes what a resolved site contains: `undefined` instead of the English string. The seed should be unaffected, because it starts from site YAML. The implementer checks it with `saito seed <site> --dry-run`. If it is affected, the fallback stays in the component and the schema keeps its defaults, but only for `en`.

# Mapping a web project to the platform

How to turn what the inventory and the project's files show into template fields. The exact fields of every section type are in the section catalog of `sites/example.config.yaml` (`pages.reference/section-catalog`); this file covers the judgment calls.

## Contents
1. Project layers → platform artifacts
2. Fidelity levels
3. Section patterns → section types
4. Theme
5. Links and navigation
6. Content rules
7. Renderer facts

## 1. Project layers → platform artifacts

A web project spreads one design across files by responsibility. Map each layer, then reconcile them. Every row says where the evidence is and where it lands.

| Layer in the project | Typical files | Lands in | Notes |
|---|---|---|---|
| **Page structure** | `*.html` (and partials or includes) | `pages` and their `sections` | One HTML page → one template page (slug by role). Sections follow the markup order; blocks marked `hidden` are optional sections (section 6) |
| **Shared chrome** | the header, nav and footer repeated across pages, or a `site-header`-style component | `navigation`, `footer` | Take the links from the rendered markup, not from comments |
| **Design tokens** | `:root` custom properties in CSS; Tailwind `@theme` blocks (in CSS or a `<style type="text/tailwindcss">`); `tailwind.config.*` | `theme` (preset or overrides), and `templateExtensions.tokens` for what `theme` cannot hold | Tokens are the source of truth for colours, fonts and radii. Utility classes in the markup show which token each element uses |
| **Component styles** | the remaining CSS: keyframes, layered rules, state classes | Patterns (`x-patterns`): marquee, reveal, slabs and similar | Styling has no field of its own; a look the components cannot produce is a pattern |
| **Content data** | `data.js`, `*.json`, `*.yaml` content modules | Section content (menu items, products, reviews) and `requiredContent` | Read it fully. Keep its **shape** and the **kinds** of content, and replace the business's values with placeholders (template-guide section 1) |
| **Business settings** | the same data files: phone, currency, locale, ids, map centre, order prefixes | Template `description`/`tags` (the market: currency, country), `requiredContent`, and patterns for any integration they configure | Settings that configure behaviour (a WhatsApp number, an order-id prefix) belong to an integration the site sets, not to the template |
| **UI copy** | string tables in data or scripts (`text: {…}`), labels inside components | Section copy where a field exists; otherwise recorded as a gap | Component labels the platform hard-codes in English are a renderer limit (section 7) |
| **Behaviour** | custom elements (`customElements.define`), modules reached from the entry script | Existing section types when the platform renders it; otherwise patterns (`kind: interaction` or `component`) | Use the inventory's `customElements` and `moduleGraph`. Note the browser APIs each needs (`browserApis`): geolocation, storage, service worker |
| **Third-party services** | CDN scripts, map tiles, `wa.me` links, analytics snippets | `integrations` patterns and `templateExtensions.assets` | Record pinned versions and integrity hashes; they matter when the platform builds the feature |
| **App shell** | `manifest.webmanifest`, `sw.js`, offline page, icons, splash screens | Patterns (for example `installable-app`, `offline-page`) and `templateExtensions.assets` | The schema has no PWA fields yet; the brand name inside the manifest and the cache names is identity |
| **Static assets** | images, icons, fonts in the project | `templateExtensions.assets` (what a site must supply, with sizes) | A template cannot ship local files (template-guide section 6) |
| **Documentation and design context** | `README`, `docs/`, `DESIGN.md` and `references/` next to the project | `templateExtensions.taxonomy`, the description, and the reasons behind your choices | Intent, not fact (section 6). Git-ignored working docs are context only |
| **Tooling** | build scripts, icon generators, `package.json` | Nothing; mention them in the report | They show how assets are produced, not what the site is |

**Reconciling layers.** When files disagree, trust what actually renders: the markup, the data it loads and the CSS it links. Then trust comments in those files, then project docs, then the design context. Code the entry script never reaches (`moduleGraph.unreached`) is dead: report it, don't map it.

## 2. Fidelity levels

Record one of these for every visible block and every behaviour, in the plan and the report:

| Fidelity | Meaning | Example |
|---|---|---|
| `exact` | All meaningful content fits the target fields | FAQ accordion → `faq` |
| `lossy` | Content fits, but a visual or behavioural feature is lost | Masonry photo grid → `gallery` (layout lost) |
| `unmapped` | No section type can carry it without distorting its meaning | Reservation widget with date, time and party size; a client-side cart |
| `decorative` | Pure decoration, no content | Doodles, blobs, background textures |

Prefer `lossy` over `unmapped` when the visitor still gets the same information and action. Prefer `unmapped` over a misleading mapping: a reservation widget forced into `contact` would promise a booking flow that does not exist. Every `lossy`, `unmapped` and reusable `decorative` entry is an unsupported capability: flag it (`template-guide.md` section 9) and catalog it in `x-patterns`. The platform's fidelity targets and what happens to these rows are in `docs/EXTENDING-THE-PLATFORM.md`.

## 3. Section patterns → section types

| Pattern in the project | Section type | Typical fidelity and notes |
|---|---|---|
| Top banner with h1, tagline, buttons | `hero` | `layout: image-background` for a full-bleed photo with overlay text, `split` for text beside an image, `centered` otherwise. Only one image fits. |
| Story / about block (paragraphs) | `richText` | No image field: the photo is lost (`lossy`). If the image is essential, use `hero` with `layout: split` instead. |
| Grid of icon + title + text cards | `features` | `icon` is printed as text: use an emoji or omit it; SVG icons are lost. `columns` 2–4. |
| Big numbers strip | `stats` | Quote values: `"120+"`. |
| Partner / press / client logos | `logoCloud` | |
| Reviews, quotes, review carousel component | `testimonials` | Star ratings, source badges and carousel motion are lost unless folded into `role` (e.g. `role: Google review`). |
| Plan / package cards with prices | `pricing` | `price` is a display string. |
| Accordion Q&A | `faq` | |
| Band with heading + button (order online, book now) | `cta` | `primaryAction` is required. |
| Photo grid, masonry, carousel, image marquee component | `gallery` | Layout or motion is lost (`lossy`). Captions go in `caption`. |
| People cards | `team` | |
| Dishes or drinks with prices (markup, or a catalogue component fed by a data file) | `menu` | `price` must be a number; `currency` is ISO 4217 (GTQ, MXN, USD…). Group into `categories`. Product dialogs, item images and removable ingredients are lost (`lossy`) |
| Products with buy links | `products` | `id` required; `url` for the external checkout. |
| Client-side cart and checkout (cart bar, cart dialog, order hand-off) | none | `unmapped`; fall back to a `cta` to the real ordering channel (WhatsApp, delivery app) |
| Address, phone, email, hours, map, form | `contact` | `hours` items `{ days, hours }`. The form only renders when `integrations.forms` is set. |
| Event agenda | `schedule` | |
| Countdown timer | `countdown` | `target` needs a timezone offset. |
| Category link tiles (Appetizers, Mains…) | `features` or `gallery` | Usually `lossy`: tiles lose their links. |
| Price badge / starburst on a promo | none | `decorative` or fold the price into the heading text. |
| Booking / reservation widget | none | `unmapped`; offer a `cta` that links to the booking page as the fallback. |
| Floating cards over photos, parallax bands | none | `decorative`; keep the content in the nearest type. |
| Install prompt, offline notice, service worker | none | `unmapped` (app shell); record the patterns |

## 4. Theme

Map the design tokens into the nine required colour slots. CSS custom properties (`cssVariables` in each page of the inventory, which already includes the page's local stylesheets) usually name them already.

| Slot | Pick |
|---|---|
| `primary` | The main button / brand colour |
| `primaryContrast` | Text colour on primary buttons (check 4.5:1 contrast; dark text on light oranges and yellows) |
| `secondary` | The darkest brand colour, used for "dark" section backgrounds |
| `accent` | A second highlight colour |
| `background` | Page background |
| `surface` | Cards, alternate section bands, footer |
| `text` | Body text |
| `muted` | Secondary text (keep AA contrast against background) |
| `border` | Dividers and input borders |

- Colours must be hex: convert `rgb()`/`hsl()`; drop alpha.
- Tailwind aliases (`--color-tangerine: var(--tangerine)`) point at the real token: follow them to the value.
- `fonts.heading` / `fonts.body`: the Google Fonts family names (letters, digits, spaces only). The renderer has one heading and one body font: a third font is lost.
- `radius` is one value for every rounded element (cards, inputs, images, buttons), so take it from the **cards**, not the buttons: 0 → `none`, up to ~4px → `sm`, ~6–12px → `md`, ~14–40px → `lg`. Pill buttons do not mean `full`: `full` would turn cards and inputs into pills. Per-role radii go to `templateExtensions.tokens`.
- `mode: dark` only when the page background is dark.
- Spacing scales, breakpoints, shadows and motion go to `templateExtensions.tokens` if they are distinctive; the renderer does not use them.

## 5. Links and navigation

The renderer keeps only `http(s):`, `mailto:`, `tel:`, `/…` and `#…` links; anything else (a relative `menu.html`, `whatsapp:`) is replaced by `#`.

- Single-page designs: keep in-page links as `#id`, matching the section ids or `anchor`s you chose. Sections render on `/`, so `#id` works from the homepage.
- Multi-page projects: a link to another page (`menu.html`, `./about/`) becomes `/<slug>/` for the template page it maps to.
- WhatsApp: use `https://wa.me/<digits>`. It is not a `footer.social` platform (x, facebook, instagram, linkedin, youtube, github, tiktok), so put it in a footer column, the navigation, or a `cta`.
- `navigation.links`: 3–6 items, labels in the design's language; `navigation.cta` is the primary conversion.
- `footer.legal` is printed after `© <year> <name>.`: keep only the remainder ("Todos los derechos reservados.").

## 6. Content rules

- Keep the design's language; the template's placeholder copy is written in it.
- Facts come from the files that render, never from docs alone. A design brief may describe the site the prototype was modelled on.
- Do not invent facts: no made-up endpoints or third-party ids. Placeholders are obviously fake (template-guide section 6).
- **Hidden blocks** (`hidden` in the inventory's blocks) are kept by the source for later. Include them as sections when they belong to the use case, list their ids in `templateExtensions.optionalSections`, and say in the report that a site turns them off with `sections.<id>: false`. Give a hidden block with no backend (a booking form) its honest fallback.
- `alt` text: reuse the project's alt text in generic form; write one if it is missing.

## 7. Renderer facts

How the shared components render, so you don't have to read their source.

| Fact | Consequence |
|---|---|
| `theme.radius` is one value for cards, inputs, images and buttons | Take it from the cards; `full` turns cards into pills |
| `dark` sections are `bg-secondary` with `background`-coloured text; `primary` sections use `primaryContrast` text | `secondary` must be dark and `background` light, or dark bands become unreadable |
| Cards (`.saito-card`) are `background`-coloured with a `border`-coloured outline | On a `default` section a card is background-on-background, so `border` is what outlines it: use a soft divider colour, not a dark input border |
| `hero` with `image-background` renders its image with `alt=""`; `split` without an image shows a gradient box | Alt text only matters for `split`; a photo-led design without an image gets the gradient |
| `features` `icon` sits in a small 48px square and is `aria-hidden` | Use one emoji or symbol; badge text like "2x1" or "-30%" belongs in `title` |
| `products` items with `url` get a hardcoded English "Buy" button | In a non-English template, omit `url` and lose the button, or accept it and report it |
| `contact` labels ("Address", "Contact", "Opening hours", "Email") and form labels are hardcoded in English; the form renders only with `integrations.forms` | Report as a gap for non-English templates |
| `menu`/`products` prices go through the site's `locale` | `locale: en` shows "GTQ 30.00"; `es-GT` shows "Q30.00". Templates cannot fix this; sites set `locale` |
| `footer` renders `© <year> <site name>. <legal>` | `legal` must not repeat the © or the name |
| Unknown fields inside sections are silently dropped | The section catalog in `sites/example.config.yaml` lists every field each type accepts; it is complete, so there is no need to read `sections.ts` |

# Mapping HTML to the site config

How to turn what the outline and the HTML show into schema fields. The exact fields of every section type are in the section catalog of `sites/example.config.yaml` (`pages.reference/section-catalog`); this file covers the judgment calls.

## Contents
1. Fidelity levels
2. Section patterns → section types
3. Theme
4. Links and navigation
5. Content rules
6. Renderer facts

## 1. Fidelity levels

Record one of these for every visible block of the HTML, in `x-extraction.mapping`:

| Fidelity | Meaning | Example |
|---|---|---|
| `exact` | All meaningful content fits the target fields | FAQ accordion → `faq` |
| `lossy` | Content fits, but a visual or behavioral feature is lost | Masonry photo grid → `gallery` (layout lost) |
| `unmapped` | No section type can carry it without distorting its meaning | Reservation widget with date, time and party size |
| `decorative` | Pure decoration, no content | Doodles, blobs, background textures |

Prefer `lossy` over `unmapped` when the visitor still gets the same information and action. Prefer `unmapped` over a misleading mapping: a reservation widget forced into `contact` would promise a booking flow that does not exist. Every `lossy`, `unmapped` and `decorative` entry is a candidate for `x-patterns` in the example.

## 2. Section patterns → section types

| HTML pattern | Section type | Typical fidelity and notes |
|---|---|---|
| Top banner with h1, tagline, buttons | `hero` | `layout: image-background` for a full-bleed photo with overlay text, `split` for text beside an image, `centered` otherwise. Only one image fits. |
| Story / about block (paragraphs) | `richText` | No image field: the photo is lost (`lossy`). If the image is essential, use `hero` with `layout: split` instead. |
| Grid of icon + title + text cards | `features` | `icon` is printed as text: use an emoji or omit it; SVG icons are lost. `columns` 2–4. |
| Big numbers strip | `stats` | Quote values: `"120+"`. |
| Partner / press / client logos | `logoCloud` | |
| Reviews, quotes | `testimonials` | Star ratings and review source badges are lost unless folded into `role` (e.g. `role: Google review`). |
| Plan / package cards with prices | `pricing` | `price` is a display string. |
| Accordion Q&A | `faq` | |
| Band with heading + button (order online, book now) | `cta` | `primaryAction` is required. |
| Photo grid, masonry, carousel, image marquee | `gallery` | Layout or motion is lost (`lossy`). Captions go in `caption`. |
| People cards | `team` | |
| Dishes or drinks with prices | `menu` | `price` must be a number; `currency` is ISO 4217 (GTQ, MXN, USD…). Group into `categories`. |
| Products with buy links | `products` | `id` required; `url` for the external checkout. |
| Address, phone, email, hours, map, form | `contact` | `hours` items `{ days, hours }`. The form only renders when `integrations.forms` is set. |
| Event agenda | `schedule` | |
| Countdown timer | `countdown` | `target` needs a timezone offset. |
| Category link tiles (Appetizers, Mains…) | `features` or `gallery` | Usually `lossy`: tiles lose their links. |
| Price badge / starburst on a promo | none | `decorative` or fold the price into the heading text. |
| Booking / reservation widget | none | `unmapped`; offer a `cta` that links to the booking page as the fallback. |
| Floating cards over photos, parallax bands | none | `decorative`; keep the content in the nearest type. |

When the template already has a section of the right type (check its `vN.ts`), merge into that section id instead of adding a new one.

## 3. Theme

Map the palette into the nine required color slots. CSS custom properties (`cssVariables` in the outline) usually name them already.

| Slot | Pick |
|---|---|
| `primary` | The main button / brand color |
| `primaryContrast` | Text color on primary buttons (check 4.5:1 contrast; dark text on light oranges and yellows) |
| `secondary` | The darkest brand color, used for "dark" section backgrounds |
| `accent` | A second highlight color |
| `background` | Page background |
| `surface` | Cards, alternate section bands, footer |
| `text` | Body text |
| `muted` | Secondary text (keep AA contrast against background) |
| `border` | Dividers and input borders |

- Colors must be hex: convert `rgb()`/`hsl()`; drop alpha.
- `fonts.heading` / `fonts.body`: the Google Fonts family names (letters, digits, spaces only). The renderer has one heading and one body font: a third font is lost.
- `radius` is one value for every rounded element (cards, inputs, images, buttons), so take it from the **cards**, not the buttons: 0 → `none`, up to ~4px → `sm`, ~6–12px → `md`, ~14–40px → `lg`. Pill buttons do not mean `full`: `full` would turn cards and inputs into pills. Per-role radii go to `x-tokens`.
- `mode: dark` only when the page background is dark.
- Spacing scales, shadows and motion go to `x-tokens` if they are distinctive; the renderer does not use them.

## 4. Links and navigation

The renderer keeps only `http(s):`, `mailto:`, `tel:`, `/…` and `#…` links; anything else (a relative `menu.html`, `whatsapp:`) is replaced by `#`.

- Single-page sites: keep in-page links as `#id`, and set each section's `anchor` to the original HTML id when the section id you chose differs. Sections render on `/`, so `#id` works from the homepage.
- When the content moves to a template page (e.g. the menu goes to the restaurant template's `menu` page), link to `/menu/` instead.
- WhatsApp: use `https://wa.me/<digits>`. It is not a `footer.social` platform (x, facebook, instagram, linkedin, youtube, github, tiktok), so put it in a footer column, the navigation, or a `cta`.
- `navigation.links`: 3–6 items, labels in the site's language; `navigation.cta` is the primary conversion.
- `footer.legal` is printed after `© <year> <name>.`: keep only the remainder ("Todos los derechos reservados.").

## 5. Content rules

- Keep the page's language and copy; set `locale` from `<html lang>` (e.g. `es` → `es-GT` when the address is in Guatemala).
- Do not invent facts: no made-up prices, phone numbers, URLs or endpoints. If the HTML has a placeholder, keep it and say so in `x-extraction.gaps`.
- Images: hotlinked URLs (Unsplash etc.) are valid `src` values. Keep them, but note in `x-extraction.assets` that they should be downloaded into `sites/<id>/public/` with the right license before production.
- `alt` text: reuse the HTML's alt; write one if it is missing.
- Template sections you did not map still render with the template's placeholder copy: set them to `false`. Template pages you do not need: `enabled: false`.

## 6. Renderer facts

How the shared components render, so you don't have to read their source. They apply to sites and templates alike.

| Fact | Consequence |
|---|---|
| `theme.radius` is one value for cards, inputs, images and buttons | Take it from the cards; `full` turns cards into pills |
| `dark` sections are `bg-secondary` with `background`-colored text; `primary` sections use `primaryContrast` text | `secondary` must be dark and `background` light, or dark bands become unreadable |
| Cards (`.saito-card`) are `background`-colored with a `border`-colored outline | On a `default` section a card is background-on-background, so `border` is what outlines it: use a soft divider color, not a dark input border |
| `hero` with `image-background` renders its image with `alt=""`; `split` without an image shows a gradient box | Alt text only matters for `split`; a photo-led design without an image gets the gradient |
| `features` `icon` sits in a small 48px square and is `aria-hidden` | Use one emoji or symbol; badge text like "2x1" or "-30%" belongs in `title` |
| `products` items with `url` get a hardcoded English "Buy" button | On a non-English site, either accept it (report it) or omit `url` and lose the button |
| `contact` labels ("Address", "Contact", "Opening hours", "Email") and form labels are hardcoded in English; the form renders only with `integrations.forms` | Report as a gap on non-English sites |
| `menu`/`products` prices go through the site's `locale` | `locale: en` shows "GTQ 30.00"; `es-GT` shows "Q30.00". Templates cannot fix this; sites set `locale` |
| `footer` renders `© <year> <site name>. <legal>` | `legal` must not repeat the © or the name |
| Unknown fields inside sections are silently dropped | The section catalog in `sites/example.config.yaml` lists every field each type accepts; it is complete, so there is no need to read `sections.ts` |

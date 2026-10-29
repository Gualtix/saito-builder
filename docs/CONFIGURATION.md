# Site configuration reference

Each site lives in `sites/<id>/`:

```
sites/<id>/
  site.config.yaml        # settings + overrides (required)
  content/pages/*.yaml    # optional page content, same format as `pages.<slug>`
  public/                 # static assets served at the site root (/favicon.svg, /images/…)
```

The schema source of truth is [`packages/core/src/schema/site.ts`](../packages/core/src/schema/site.ts). Run `npm run saito -- validate <id>` after every change.

## Top-level fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✔ | kebab-case; must equal the directory name |
| `tenant` | ✔ | kebab-case customer id; groups sites for builds, the CMS and form storage |
| `name` | ✔ | Site name (logo text fallback, `<title>`, JSON-LD) |
| `template` | ✔ | `<template>@<range>`: `corporate@1` (recommended), `landing@^2.1.0`, `event@latest` |
| `description` | | Default meta description |
| `locale` | | BCP-47 language tag, default `en`; also used for price and date formatting, and for the labels the components write themselves (`en`, `es`; other languages fall back to English) |
| `environments` | | `{ development, staging, production }` → `{ url }`. Sets canonical URLs and sitemaps |
| `brand` | | `logo: { src, alt, width?, height? }`, `logoText`, `favicon`, `pwa` (installable app, see below) |
| `theme` | | Partial theme, merged over the template's (see below) |
| `navigation` | | `links: [{ label, href }]`, `cta: { label, href }`, `transparent` (default false), `iconLinks: [{ icon, href }]`. Replaces the template navigation as a whole. `transparent` puts the header over the hero with white text, turning solid after 60px of scroll or while the mobile menu is open; it applies only on pages whose first section is a `hero` with `layout: image-background` and an `image` (that hero then fills the first screen), and the header stays solid without JavaScript. `iconLinks` are round icon buttons after the links from 981px; `icon` is `email` or a `footer.social` platform |
| `footer` | | `tagline`, `columns: [{ title, links }]`, `social: [{ platform, href }]`, `legal` |
| `seo` | | `titleTemplate` (`%s` = page title), `defaultImage`, `twitterHandle`, `noindex` (meta robots, `robots.txt` and the `X-Robots-Tag` header, in every environment, production included), `schemaType` |
| `integrations` | | `analytics`, `commerce`, `forms` (see below) |
| `pages` | | Page overrides keyed by slug (see below) |

## Theme

```yaml
theme:
  mode: light            # light | dark
  colors:                # hex only
    primary: "#c2410c"
    primaryContrast: "#ffffff"   # text on primary
    secondary: "#1e293b"         # used for "dark" section backgrounds
    accent: "#0ea5e9"
    background: "#ffffff"
    surface: "#f8fafc"           # used for "surface" section backgrounds and the footer
    text: "#111827"
    muted: "#4b5563"
    border: "#e5e7eb"
    accent2: "#10b981"           # optional extra accents; unset → accent
    accent3: "#f43f5e"
    scrim: "#140f0a9e"           # optional #rrggbbaa overlay on full-bleed photos; unset → black at 55%
  fonts:
    heading: Poppins     # letters, digits, spaces; loaded from Google Fonts
    body: Inter
    googleFonts: true    # false for system or self-hosted fonts
  radius: md             # none | sm | md | lg | xl | 2xl | 3xl | full
  radii:                 # optional per-role radius, same scale; an unset role uses radius
    button: full         # .saito-btn
    card: xl             # .saito-card
    image: 2xl           # gallery images, split-hero image
    panel: 3xl           # reserved for panels and slabs
  headingDecoration: bar # none (default) | bar: a short accent bar under section headings (section headers and richText)
  motion:
    reveal: true         # default false: blocks after the hero fade in and rise 24px over 700ms as they scroll into view;
                         # shown at once under reduced motion, and never hidden without JavaScript
```

## Installable app (`brand.pwa`)

Opt-in per site. Without `brand.pwa` a site renders no manifest link, install button or service worker.

```yaml
brand:
  pwa:
    themeColor: "#E99B3F"                   # required; hex
    manifest: /manifest.webmanifest         # default
    serviceWorker: /sw.js                   # default; served with Cache-Control: no-cache
    appleTouchIcon: /icons/apple-touch-icon.png
    splash:                                 # iOS launch screens, one per device size
      - { href: /icons/splash/splash-390x844@3x.png, media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" }
```

With it, the head gets the manifest, theme colour, apple-touch icon, `apple-mobile-web-app-*` metas (title = `name`) and splash links. The header shows an install button on phones and tablets only: the browser's install prompt on Android, a two-step instructions sheet on iOS, hidden for 30 days once closed. A full-screen notice appears while the device is offline and when an order needs the network.

The site supplies the files in `public/`, because the platform only links and registers them: the manifest and its icons, `sw.js`, and a self-contained `offline.html`. The service worker's caching is the site's choice. It should not cache pages, so that new deploys always show. `sites/date-el-gusto/public/` is a working example: it serves `offline.html` when a page load fails and caches nothing else.

## Pages and sections

```yaml
pages:
  index:                         # "index" is the homepage; nested slugs like "legal/privacy" work
    title: Home                  # optional override
    description: …
    enabled: true                # false hides a template page
    sections:
      hero:                      # template section id → deep-merged
        heading: New heading
      testimonials: false        # remove a template section
      gallery:                   # unknown id + type → new section
        type: gallery
        images: [{ src: /images/a.jpg, alt: … }]
    order: [hero, gallery]       # these first, the rest keep template order

  careers:                       # page not in the template: needs title + typed sections
    title: Careers
    sections:
      intro: { type: hero, heading: Join us }
```

Merging rules: objects merge recursively, arrays are replaced whole, and `null` deletes a key.

### Section types

Every section accepts `background: default | surface | primary | dark` and an optional `anchor`.

| Type | Key fields |
|------|------------|
| `hero` | `layout` (centered, split, image-background), `eyebrow`, `heading`*, `subheading`, `primaryAction`, `secondaryAction`, `image`, `headingSize` (default, display; default default). `display` sets the heading as a fluid wordmark (`clamp(4rem, 14vw, 14rem)` in the heading font) that wraps on phones |
| `features` | `heading`, `intro`, `columns` (2–4), `iconStyle` (emoji, badge; default emoji), `dividers` (default false), `items[]: { icon, title*, description }`. With `badge`, `icon` is a name from the shared icon set (`pot`, `heart`, `home`, `family`, `leaf`, `mail`, `whatsapp`, and the social platforms) in a round badge cycling `accent`, `accent2`, `accent3`; `dividers` drops the cards for centred columns with thin rules between them |
| `stats` | `heading`, `items[]: { value*, label* }` |
| `logoCloud` | `heading`, `logos[]: { name*, src, href }` |
| `testimonials` | `heading`, `items[]: { quote*, author*, role, avatar }` |
| `pricing` | `heading`, `intro`, `plans[]: { name*, price*, period, description, features[], action*, highlighted }` |
| `faq` | `heading`, `items[]: { question*, answer* }` |
| `cta` | `heading`*, `body`, `primaryAction`*, `secondaryAction`, `layout` (band, photo-band; default band), `image` (required for photo-band: full-bleed photo under the theme scrim, content in a centred card) |
| `richText` | `heading`, `body`* (paragraphs, `**bold**`, `*italic*`, `[link](url)`), `width` (narrow, wide), `image`, `imagePosition` (start, end; default end), `action`, `slab` (accent, accent2, accent3, primary), `doodle`. With `image`, text and photo sit side by side from 821px and stack below; `slab` draws a colour block offset behind the photo with the theme's panel radius. `doodle` (leaf, citrus, pod) adds a faint line drawing below the text, from 821px only |
| `gallery` | `heading`, `columns`, `layout` (grid, marquee, masonry; default grid), `action` (button beside the heading), `images[]: { src*, alt, caption, span }`. `marquee`: one looping row that pauses on hover and stays static with reduced motion. `masonry`: 2 columns, `columns` from 821px; `span: tall` takes two rows |
| `team` | `heading`, `intro`, `members[]: { name*, role, photo, bio }` |
| `menu` | `heading`, `intro`, `currency`, `layout` (list, cards; default list), `categories[]: { name*, items[]: { id, name*, description, price*, tags[], orderable, image, ingredients[] } }`. `cards`: photo cards with an order button. `ingredients` are the removable options in the WhatsApp product dialog. With a cart provider, `orderable` items with an `id` get an order button |
| `products` | `heading`, `intro`, `currency`, `items[]: { id*, name*, description, price*, image, url }` |
| `contact` | `heading`, `intro`, `email`, `phone`, `address`, `hours[]: { days, hours }`, `mapEmbedUrl`, `form: { enabled, submitLabel, successMessage }` (both unset → the locale's text), and `image`, `imagePosition`, `action`, `slab` as on `richText` |
| `schedule` | `heading`, `intro`, `days[]: { label*, items[]: { time*, title*, speaker, description } }` |
| `countdown` | `heading`*, `target`* (ISO date-time with offset), `expiredText` (unset → the locale's text), `action` |
| `specials` | `heading`*, `intro`, `price`* (display string, e.g. "Q65"), `priceNote`, `badge` (default true: the price in a rotated star badge on the panel edge; false: as text), `items[]`* (dish names), `images[]` (up to 3, a collage), `action` |

`*` = required. Links are `{ label, href }`; images are `{ src, alt, width?, height? }`.

## Integrations

```yaml
integrations:
  analytics:
    provider: plausible        # plausible | ga4
    id: example.com            # Plausible domain or GA4 measurement id
  commerce:                    # conditional e-commerce: catalogue here, checkout delegated
    provider: snipcart         # snipcart → add-to-cart buttons on menu/products
    publicKey: …               # Snipcart public key (public by design)
    currency: EUR
    # provider: shopify        → storeDomain, storefrontToken; products link to their `url`
    # provider: commerce-layer → organization, clientId; products link to their `url`
    # provider: whatsapp       → cart in the browser; the order is sent as a WhatsApp message (no backend)
    #   phone: "+502 0000 0000"   # any format, reduced to digits for wa.me (public by design)
    #   currency: GTQ
    #   orderIdPrefix: DG         # A–Z/0–9, up to 6; order id <prefix>-YYMMDD-XXXXX
    #   maxQty: 20                # per line, default 20
    #   location: { enabled: true, center: [14.523, -90.759], zoom: 16 }
    #     # optional map pin in checkout (Leaflet + OpenStreetMap, loaded only when opened);
    #     # enabled → Permissions-Policy geolocation=(self), otherwise geolocation=()
  forms:
    endpoint: https://api.example.com   # apps/api base URL; the contact form posts here
    webhookUrl: https://hooks.example/… # server-side only; never rendered into pages
    notifyEmail: team@example.com       # server-side only
```

## Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `SAITO_ENV` | CLI, renderer, API | `development` (default), `staging` or `production` |
| `SAITO_CONTENT_SOURCE` | renderer | `local` (default) or `sanity` |
| `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`, `SANITY_READ_TOKEN` | renderer | Sanity overlay; the dataset defaults to the environment name |
| `SANITY_WRITE_TOKEN` | `saito seed` | Editor token for pushing local content and images into Sanity |

Nothing loads `.env` automatically: export the variables, or run e.g. `npx tsx --env-file=.env packages/cli/src/index.ts <command>`.

## Seeding Sanity from local content

`saito seed [<site>…|--all] [--dry-run] [--overwrite]` pushes each site's effective content (template + site config + `content/pages`) into Sanity as `page` and `siteSettings` documents, uploading images referenced from `sites/<id>/public/` as Sanity assets. Document ids are deterministic (`saito-<site>-page-<slug>`), so re-running is safe. By default only missing documents are created, so edits made in the Studio are kept; `--overwrite` replaces them with local content.
| `API_PORT`, `API_HOST`, `API_DATA_DIR` | API | Server binding and submission storage |
| `SAITO_ROOT` | all | Override project root detection |

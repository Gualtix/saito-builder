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
| `brand` | | `logo: { src, alt, width?, height? }`, `logoText`, `favicon` |
| `theme` | | Partial theme, merged over the template's (see below) |
| `navigation` | | `links: [{ label, href }]`, `cta: { label, href }`. Replaces the template navigation |
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
```

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
| `hero` | `layout` (centered, split, image-background), `eyebrow`, `heading`*, `subheading`, `primaryAction`, `secondaryAction`, `image` |
| `features` | `heading`, `intro`, `columns` (2–4), `items[]: { icon, title*, description }` |
| `stats` | `heading`, `items[]: { value*, label* }` |
| `logoCloud` | `heading`, `logos[]: { name*, src, href }` |
| `testimonials` | `heading`, `items[]: { quote*, author*, role, avatar }` |
| `pricing` | `heading`, `intro`, `plans[]: { name*, price*, period, description, features[], action*, highlighted }` |
| `faq` | `heading`, `items[]: { question*, answer* }` |
| `cta` | `heading`*, `body`, `primaryAction`*, `secondaryAction` |
| `richText` | `heading`, `body`* (paragraphs, `**bold**`, `*italic*`, `[link](url)`), `width` (narrow, wide) |
| `gallery` | `heading`, `columns`, `images[]: { src*, alt, caption }` |
| `team` | `heading`, `intro`, `members[]: { name*, role, photo, bio }` |
| `menu` | `heading`, `intro`, `currency`, `categories[]: { name*, items[]: { id, name*, description, price*, tags[], orderable } }` |
| `products` | `heading`, `intro`, `currency`, `items[]: { id*, name*, description, price*, image, url }` |
| `contact` | `heading`, `intro`, `email`, `phone`, `address`, `hours[]: { days, hours }`, `mapEmbedUrl`, `form: { enabled, submitLabel, successMessage }` (both unset → the locale's text) |
| `schedule` | `heading`, `intro`, `days[]: { label*, items[]: { time*, title*, speaker, description } }` |
| `countdown` | `heading`*, `target`* (ISO date-time with offset), `expiredText` (unset → the locale's text), `action` |

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

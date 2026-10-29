/**
 * =============================================================================
 *  template.example.ts — MASTER REFERENCE for site templates
 * =============================================================================
 *
 *  What this file is
 *    The canonical, fully annotated template. Use it as:
 *      - a reference implementation of every template manifest field
 *      - a blueprint: copy it to <template-id>/v1.ts to start a new template
 *      - a schema example: it is validated by `defineTemplate` on import and by
 *        packages/templates/test/template-example.test.ts, so it cannot drift
 *      - a placeholder model: every value is realistic sample content
 *      - a taxonomy reference for template extraction and generation tools
 *    Its site-side counterpart is sites/example.config.yaml.
 *
 *  What it is NOT
 *    A published template. It is deliberately NOT registered in ./index.ts, so
 *    `saito templates` does not list it and no site can pin it. The test fails
 *    if it is ever registered.
 *
 *  Source of truth
 *    packages/core/src/schema/template.ts   manifest schema + TemplateMigration
 *    packages/core/src/schema/sections.ts   the 16 section types
 *    packages/core/src/schema/theme.ts      theme tokens the renderer uses
 *    packages/core/src/registry.ts          defineTemplate + version resolution
 *    If this file and the schema disagree, the schema wins: fix this file.
 *
 *  Technology note
 *    The manifest is plain data (JSON-serializable, validated by zod), so tools
 *    can read, generate or diff it without knowing Astro. Only migrations are
 *    code. Rendering is done by the shared components in packages/components;
 *    a template never contains markup or CSS.
 *
 * -----------------------------------------------------------------------------
 *  FIELD LEGEND (used in the comments throughout)
 * -----------------------------------------------------------------------------
 *    [REQUIRED]    Validation fails without it.
 *    [OPTIONAL]    May be omitted; the default is given as "default: …".
 *    [COMPUTED]    Derived from this file by the platform or by helpers below.
 *                  Never written by hand.
 *    [REUSABLE]    A constant defined once (in "Reusable fragments") and
 *                  referenced from several places.
 *    [EXTENSION]   Lives in `templateExtensions`. Not read by the renderer;
 *                  used by designers, generators and documentation.
 *    [CONTRACT]    Part of the template's public API towards sites. Changing
 *                  it is a BREAKING change (see "Versioning").
 *
 * -----------------------------------------------------------------------------
 *  NAMING CONVENTIONS
 * -----------------------------------------------------------------------------
 *    File                    packages/templates/src/<template-id>/v<major>.ts
 *    Template id             kebab-case, a noun for the use case: restaurant
 *    Template name           Title Case, human-facing: "Professional Services"
 *    Version                 semver MAJOR.MINOR.PATCH, matching the file's major
 *    Page slugs              kebab-case segments joined by "/"; "index" = home
 *    Section ids             kebab-case, named by role, not looks:
 *                            "services" (good), "three-blue-cards" (bad)
 *    Section type values     camelCase: richText, logoCloud
 *    Tags                    kebab-case keywords: single-page, local-business
 *    Reusable constants      camelCase, prefixed by kind: linkContact, imageHero
 *
 * -----------------------------------------------------------------------------
 *  THE OVERRIDE CONTRACT  [CONTRACT]
 * -----------------------------------------------------------------------------
 *    Sites store only overrides keyed by page slug and section id:
 *      pages.<slug>.sections.<section-id>: { … } | false
 *    So page slugs and section ids ARE the template's API. `overrideContract`
 *    at the bottom of this file lists them [COMPUTED]; `saito templates <id>`
 *    shows the same to site authors.
 *
 * -----------------------------------------------------------------------------
 *  VERSIONING (sites pin a major: "example@1")
 * -----------------------------------------------------------------------------
 *    PATCH  copy fixes, placeholder text, theme tweaks
 *    MINOR  new optional pages or sections, new nav links, changelog notes
 *           → every site on @1 receives it on its next build
 *    MAJOR  renaming or removing a page slug or section id, changing a
 *           section's type, restructuring pages
 *           → new file v2.ts, registered next to v1.ts, shipping a
 *             TemplateMigration (see `exampleMigration`); sites move with
 *             `saito upgrade <site>`
 *
 * -----------------------------------------------------------------------------
 *  COMPUTED AT RESOLVE TIME (from template + site config)
 * -----------------------------------------------------------------------------
 *    theme        template theme, deep-merged with the site's partial theme
 *    footer       template footer, deep-merged with the site's footer
 *    navigation   the site's navigation REPLACES this one entirely when set
 *    seo          merged; titleTemplate defaults to "%s | <site name>", so
 *                 templates should normally leave it unset
 *    page path    "index" → "/", "about/team" → "/about/team/"
 *    page description   falls back to the site's description
 *    section anchor     defaults to the section id
 *    marketplace major  "1.4.2" → sites pin "example@1"
 * =============================================================================
 */

import { defineTemplate, type Image, type Link, type SectionInput, type SiteConfigInput, type TemplateMigration } from '@saito/core';
import { themes } from './themes.ts';

// =============================================================================
//  Reusable fragments  [REUSABLE]
//  Define once, reference everywhere. Shapes follow the real schema:
//    Link   { label [REQUIRED], href [REQUIRED] }  — href: "/path/", "#anchor", https:, mailto:, tel:
//    Image  { src [REQUIRED], alt [OPTIONAL, default ""], width?, height? }
// =============================================================================

const linkServices = { label: 'Services', href: '/services/' } satisfies Link;
const linkAbout = { label: 'About', href: '/about/' } satisfies Link;
const linkContact = { label: 'Contact', href: '/contact/' } satisfies Link;
const actionBook = { label: 'Book a consultation', href: '/contact/' } satisfies Link;

// Placeholder images: sites replace them. Paths resolve against the site's public/ folder.
const imageHero = {
  src: '/images/hero.webp',
  alt: 'Team working together around a table',
  width: 1600,
  height: 1067,
} satisfies Image;

// A whole section reused on several pages. Section ids only need to be unique per page.
const sectionClosingCta = {
  id: 'cta',
  type: 'cta',
  heading: 'Ready to get started?',
  body: 'Tell us what you need. We reply within one business day.',
  primaryAction: actionBook,
  background: 'primary',
} satisfies SectionInput;

// =============================================================================
//  The manifest  (validated by templateManifestSchema)
// =============================================================================

const template = defineTemplate(
  {
    // --- Identity and marketplace metadata -----------------------------------
    id: 'example', //                     [REQUIRED] [CONTRACT] kebab-case; sites reference "<id>@<major>"
    name: 'Professional Services', //     [REQUIRED] shown in `saito templates` and the marketplace
    version: '1.0.0', //                  [REQUIRED] semver; the file name carries the major (v1.ts)
    description:
      //                                  [REQUIRED] one sentence: who it is for and which pages it has
      'Multi-page site for service businesses: home, about, services with pricing, contact, and a section catalog.',
    author: 'Saito', //                   [OPTIONAL] default "Saito"
    // [REQUIRED] at least 1; values from websiteTypes in schema/template.ts:
    // landing-page, homepage, corporate, marketing, product-showcase, service-business,
    // restaurant, real-estate, portfolio, event, microsite, campaign, brand
    websiteTypes: ['service-business', 'corporate', 'marketing'],
    tags: ['multi-page', 'local-business', 'lead-generation'], // [OPTIONAL] default [] — kebab-case search keywords
    preview: '/previews/example.webp', // [OPTIONAL] marketplace screenshot, 1600×1000 recommended

    // --- Theme (design tokens the renderer uses) -----------------------------
    // [REQUIRED] A complete theme: all 9 colors and both fonts. Sites override any part of it.
    // Start from a shared base theme in ./themes.ts and override only what differs. [REUSABLE]
    theme: {
      ...themes.slate,
      mode: 'light', //                   [OPTIONAL] default light — light | dark
      colors: {
        ...themes.slate.colors,
        primary: '#1d4ed8', //            buttons, links, "primary" section backgrounds
        primaryContrast: '#ffffff', //    text on primary; keep WCAG AA (4.5:1) with primary
        accent: '#f59e0b', //             highlights and badges
        accent2: '#10b981', //            [OPTIONAL] extra accents (badges, colour blocks); unset → accent
        accent3: '#f43f5e', //            [OPTIONAL]
        scrim: '#140f0a9e', //            [OPTIONAL] #rrggbbaa overlay on full-bleed photos; unset → black at 55%
        // secondary ("dark" backgrounds), background, surface (cards, footer),
        // text, muted (keep AA with background) and border come from themes.slate.
      },
      fonts: {
        heading: 'Fraunces', //           letters, digits and spaces only (written into CSS)
        body: 'Inter',
        googleFonts: true, //             [OPTIONAL] default true — false for system or self-hosted fonts
      },
      radius: 'md', //                    [OPTIONAL] default md — none | sm | md | lg | xl | 2xl | 3xl | full
      radii: { button: 'full', card: 'xl', image: '2xl', panel: '3xl' }, // [OPTIONAL] per role; unset → radius
    },

    // --- Navigation ------------------------------------------------------------
    // [REQUIRED] Default navigation. A site's `navigation` replaces it entirely (no merge).
    // Keep 3–6 links; `cta` is the primary conversion.
    navigation: {
      links: [linkServices, linkAbout, linkContact], // default []
      cta: actionBook, //                 [OPTIONAL]
    },

    // --- Footer ----------------------------------------------------------------
    // [REQUIRED] (every key inside is optional). Sites deep-merge their footer over it.
    footer: {
      tagline: 'Expert help for growing businesses.', // [OPTIONAL]
      columns: [
        //                                [OPTIONAL] default [] — each { title, links }
        { title: 'Company', links: [linkAbout, linkServices] },
        { title: 'Get in touch', links: [linkContact] },
      ],
      social: [
        //                                [OPTIONAL] default [] — platform: x | facebook | instagram |
        //                                linkedin | youtube | github | tiktok
        { platform: 'linkedin', href: 'https://www.linkedin.com/company/example' },
      ],
      // [OPTIONAL] Rendered after "© <year> <site name>." — never repeat the © or a name here.
      legal: 'All rights reserved.',
    },

    // --- SEO defaults ------------------------------------------------------------
    // [OPTIONAL] default {}. Leave titleTemplate unset: it is computed from the site name.
    seo: {
      schemaType: 'Organization', //      JSON-LD type: Organization | LocalBusiness | Restaurant | Event | Person
      defaultImage: '/images/share-card.png', // share image (Open Graph), 1200×630
    },

    // --- Pages [REQUIRED] at least 1, and one must be "index" ---------------------
    // Each page: slug [REQUIRED] [CONTRACT], title [REQUIRED], description [OPTIONAL],
    // sections [REQUIRED] at least 1. Every section needs id [CONTRACT] + type [REQUIRED];
    // all sections accept anchor? (default: the id) and background? (default | surface | primary | dark).
    pages: [
      {
        slug: 'index',
        title: 'Home',
        description: 'Expert services for growing businesses.',
        sections: [
          {
            id: 'hero',
            type: 'hero',
            layout: 'split', //           centered | split | image-background
            eyebrow: 'Trusted advisors',
            heading: 'Grow with confidence', // [REQUIRED]
            subheading: 'Practical expertise that turns plans into results.',
            primaryAction: actionBook,
            secondaryAction: linkServices,
            image: imageHero,
          },
          {
            id: 'stats',
            type: 'stats',
            items: [
              { value: '200+', label: 'Clients served' }, // quote numeric-looking values in YAML overrides
              { value: '15', label: 'Years of experience' },
              { value: '98%', label: 'Would recommend us' },
            ],
          },
          {
            id: 'services',
            type: 'features',
            heading: 'What we do',
            intro: 'Three ways we help.',
            columns: 3, //                2 | 3 | 4, default 3
            items: [
              // icon is printed as text: use an emoji or a short symbol, or omit it
              { icon: '🧭', title: 'Strategy', description: 'Clear priorities and a plan you can follow.' },
              { icon: '⚙️', title: 'Operations', description: 'Processes that scale with your team.' },
              { icon: '📈', title: 'Growth', description: 'Find and win the right customers.' },
            ],
          },
          {
            id: 'clients',
            type: 'logoCloud',
            heading: 'Trusted by',
            logos: [{ name: 'Northwind' }, { name: 'Contoso' }, { name: 'Globex' }],
          },
          {
            id: 'testimonials',
            type: 'testimonials',
            heading: 'What clients say',
            background: 'surface',
            items: [{ quote: 'They made a complicated year feel simple.', author: 'Jordan Lee', role: 'Founder, Contoso' }],
          },
          sectionClosingCta, //           [REUSABLE]
        ],
      },
      {
        slug: 'about',
        title: 'About',
        sections: [
          {
            id: 'intro',
            type: 'richText',
            heading: 'Our story',
            // Paragraphs separated by blank lines; **bold**, *italic* and [links](/path/). HTML is escaped.
            body: 'We started in 2011 with one belief: **good advice should be practical**.\n\nToday we help businesses across the region grow with confidence.',
          },
          {
            id: 'team',
            type: 'team',
            heading: 'Leadership',
            members: [{ name: 'Alex Rivera', role: 'Managing Partner', bio: 'Twenty years helping companies scale.' }],
          },
          sectionClosingCta,
        ],
      },
      {
        slug: 'services',
        title: 'Services',
        sections: [
          {
            id: 'pricing',
            type: 'pricing',
            heading: 'Packages',
            plans: [
              { name: 'Starter', price: '$1,500', period: 'one-off', features: ['Assessment', 'Action plan'], action: actionBook },
              {
                name: 'Partner',
                price: '$4,000',
                period: '/month',
                features: ['Everything in Starter', 'Monthly reviews', 'Priority support'],
                action: actionBook,
                highlighted: true,
              },
            ],
          },
          {
            id: 'faq',
            type: 'faq',
            heading: 'Questions',
            items: [{ question: 'How quickly can we start?', answer: 'Usually within two weeks.' }],
          },
        ],
      },
      {
        slug: 'contact',
        title: 'Contact',
        sections: [
          {
            id: 'contact',
            type: 'contact',
            heading: 'Contact us',
            intro: 'We reply within one business day.',
            email: 'hello@example.com',
            phone: '+1 (555) 010-0200',
            address: '100 Main Street, Springfield',
            hours: [{ days: 'Monday–Friday', hours: '9:00–17:00' }],
            // The form only renders when the site sets integrations.forms.
            form: { enabled: true, submitLabel: 'Send message' }, // [OPTIONAL] submitLabel, successMessage: unset → locale string
          },
        ],
      },

      // --- REFERENCE ONLY: section catalog --------------------------------------
      // The section types not used above, so the file shows all 17. Delete this
      // page when copying the file into a real template. The test checks that the
      // template as a whole covers every section type in the schema.
      {
        slug: 'reference/section-catalog',
        title: 'Section catalog',
        sections: [
          {
            id: 'gallery',
            type: 'gallery',
            heading: 'Our work',
            columns: 3,
            images: [{ src: '/images/gallery-1.webp', alt: 'Workshop with a client team', caption: 'Discovery workshop' }],
          },
          {
            id: 'cta-band',
            type: 'cta',
            heading: 'Talk to an expert', // [REQUIRED]
            primaryAction: actionBook, //   [REQUIRED]
          },
          {
            id: 'menu',
            type: 'menu',
            heading: 'Menu',
            currency: 'USD', //             ISO 4217, default USD
            categories: [
              {
                name: 'Coffee',
                items: [{ id: 'espresso', name: 'Espresso', price: 3.5, tags: ['hot'] }], // price is a number
              },
            ],
          },
          {
            id: 'products',
            type: 'products',
            heading: 'Guides',
            items: [{ id: 'starter-guide', name: 'Starter guide', price: 29, url: 'https://shop.example.com/starter-guide' }],
          },
          {
            id: 'schedule',
            type: 'schedule',
            heading: 'Workshop agenda',
            days: [{ label: 'Day 1', items: [{ time: '09:00', title: 'Welcome and goals', speaker: 'Alex Rivera' }] }],
          },
          {
            id: 'countdown',
            type: 'countdown',
            heading: 'Next workshop starts in',
            target: '2027-03-11T09:00:00-06:00', // ISO 8601 date-time WITH offset
            expiredText: 'Registration is closed.',
          },
          {
            id: 'specials',
            type: 'specials',
            heading: 'Lunch of the day', //   [REQUIRED]
            intro: 'Weekdays 11:00–15:00, drink included.',
            price: '$14', //                   [REQUIRED] display string
            priceNote: 'per plate',
            // badge: true by default (rotated star badge); false shows the price as text.
            items: ['Roast chicken', 'Vegetable curry', 'Grilled salmon'], // [REQUIRED] dish names
            images: [{ src: '/images/specials-1.webp', alt: 'Lunch table with several dishes' }], // up to 3, a collage
            action: { label: 'See the menu', href: '/menu/' },
          },
        ],
      },
    ],

    // --- Changelog [OPTIONAL] default [] ---------------------------------------
    // One entry per published version, newest last. Shown by `saito templates`.
    changelog: [{ version: '1.0.0', notes: 'Initial release.' }],
  },
  // Migrations [OPTIONAL] default []: those leading INTO this major. A v1 template has none.
  [],
);

export default template;

// =============================================================================
//  Override contract  [COMPUTED] [CONTRACT]
//  Page slugs and section ids sites can override. Renaming or removing any of
//  these is a breaking change and needs a new major with a migration.
// =============================================================================
export const overrideContract: Record<string, string[]> = Object.fromEntries(
  template.manifest.pages.map((page) => [page.slug, page.sections.map((section) => section.id)]),
);

// =============================================================================
//  Migration pattern  (reference for the NEXT major)
//  Ship it in v2.ts as the second argument of defineTemplate: [migrationV1toV2].
//  A migration receives the site's raw config and returns the rewritten one.
//  Rules: never mutate the input (clone it), only touch overrides that refer to
//  what changed, keep everything else as is. `saito upgrade` validates the result
//  against the new major before writing, and `--dry-run` previews it.
// =============================================================================
export const exampleMigration: TemplateMigration = {
  from: 1,
  to: 2,
  notes: 'Renames the home page section "services" to "offerings" and rewrites #services links.',
  migrate: (config: SiteConfigInput) => {
    const next = structuredClone(config);
    const sections = next.pages?.index?.sections;
    if (sections && 'services' in sections) {
      next.pages!.index!.sections = Object.fromEntries(
        Object.entries(sections).map(([id, value]) => [id === 'services' ? 'offerings' : id, value]),
      ) as typeof sections;
    }
    const order = next.pages?.index?.order;
    if (order) next.pages!.index!.order = order.map((id) => (id === 'services' ? 'offerings' : id));
    return JSON.parse(JSON.stringify(next).replaceAll('"#services"', '"#offerings"')) as SiteConfigInput;
  },
};

// =============================================================================
//  templateExtensions  [EXTENSION]
//  Template knowledge the schema does not hold. The renderer ignores it; design
//  tools, generators and the web-directory-to-template skill read it. Vocabulary values
//  should come from x-vocabulary in sites/example.config.yaml.
// =============================================================================
export const templateExtensions = {
  // Classification, same keys as x-taxonomy in sites/example.config.yaml.
  // Values come from x-vocabulary in sites/example.config.yaml (same split into industries and
  // subIndustries); a template may list several of each.
  taxonomy: {
    industries: ['professional-services'],
    subIndustries: ['management-consulting'],
    visualStyle: { primary: 'modern-minimal', secondary: ['trustworthy', 'editorial'], notStyles: ['brutalist', 'dark-moody'] },
    tone: ['confident', 'clear', 'warm'],
    conversion: { primary: 'book-consultation', secondary: ['download-guide'] },
    positioning: 'premium-accessible',
  },

  // Design tokens beyond `theme`, in Design Tokens Community Group format.
  // The renderer uses only `theme`; keep these consistent with it.
  tokens: {
    spacing: { section: { $type: 'dimension', $value: '6rem' }, gutter: { $type: 'dimension', $value: '1.5rem' } },
    fontSize: { h1: { $type: 'dimension', $value: '3.5rem' }, body: { $type: 'dimension', $value: '1rem' } },
    motion: { base: { $type: 'duration', $value: '250ms' } },
    // Shadows (per-role radii, extra accents and the photo scrim are theme fields).
    shadow: {
      photo: { $type: 'shadow', $value: { offsetX: '0', offsetY: '18px', blur: '26px', spread: '-14px', color: '#24151080' } },
    },
  },

  // What a site must supply for this template to look finished.
  assets: {
    required: ['logo (SVG)', 'hero photo 1600×1067', 'share card 1200×630'],
    optional: ['team photos 512×512', 'client logos (SVG)', 'gallery photos 1200×800'],
    rules: ['meaningful alt text on content images', 'width and height on every image', 'only licensed images'],
    // Published templates ship without local image files, and a new site's public/ starts empty.
    // So: leave optional image fields (hero.image, team photos, avatars) unset in a published
    // template, and give sections that REQUIRE images (gallery) absolute placeholder URLs that
    // work out of the box. This reference file uses /images/… paths only because it is never published.
    placeholderImages: 'unset when optional; absolute licensed URLs when required; listed in requiredContent',
  },

  // Component copy the schema does not let a template set. Work around it in non-English templates.
  hardcodedCopy: {
    productsButton: 'products items with a url render a "Buy" button (English): omit url in non-English templates',
    contactForm: 'contact form labels are English and the form only renders with integrations.forms',
    featureIcon: 'features icon renders in a small square: use one emoji, put badge text such as "2x1" in the title',
  },

  // Candidate section types, components and decorations seen in real designs live in ONE
  // shared catalog (x-patterns): kind, fields, fallback and how often they occur.
  patternCatalog: 'sites/example.config.yaml → x-patterns',

  // UNSUPPORTED CAPABILITIES
  // A source design is never forced to fit the platform. When the renderer lacks the component, field,
  // token or infrastructure a design needs, the template renders the nearest honest fallback and flags
  // the gap in two places:
  //   1. a `// UNSUPPORTED <key> → <fallback>` comment on the section, navigation or page that falls back;
  //   2. an entry in templateExtensions.unsupportedCapabilities, keyed by the x-patterns key:
  //        affects          section ids, or 'header' | 'footer' | 'site'
  //        purpose          why the design has it (the visitor or business goal)
  //        expectedBehavior what the source does, with the sizes, states and breakpoints needed to rebuild it
  //        requirements     what the platform must add: schema fields, components, web components, tokens,
  //                         build output (headers, head tags), Studio and seed, docs, third-party dependencies
  //        fallback         what the template renders today
  // These entries are the platform's requirements backlog for full-fidelity templates
  // (docs/EXTENDING-THE-PLATFORM.md, Phase B). Example for this template:
  unsupportedCapabilities: {
    'table-reservation': {
      affects: ['contact'],
      purpose: 'Let visitors book a consultation without leaving the page.',
      expectedBehavior: 'Date and time picker with available slots; confirms by email.',
      requirements: ['booking integration { provider, url } (schema, docs)', 'reservation section type or a cta variant'],
      fallback: 'contact page with a phone number',
    },
  },

  // CAPABILITY REGISTRY: every capability any template has flagged, with its platform support.
  // Add newly discovered ones as 'unsupported' (same key as x-patterns); set 'supported' when the
  // platform ships it, and remove the matching flags from the templates. Checked by template-example.test.ts.
  capabilities: {
    'transparent-header': { support: 'supported', requirement: 'navigation option transparentOverHero; Header.astro variant with a scroll script', firstSeenIn: 'family-kitchen' },
    'header-icon-links': { support: 'supported', requirement: 'navigation.iconLinks; shared SVG icon set', firstSeenIn: 'family-kitchen' },
    'localized-ui-labels': { support: 'supported', requirement: 'packages/components/src/strings.ts (en, es), chosen by site.locale', firstSeenIn: 'family-kitchen' },
    'header-logo-wordmark': { support: 'unsupported', requirement: 'navigation option to render brand.logo and the business name together', firstSeenIn: 'family-kitchen' },
    'home-page-title': { support: 'unsupported', requirement: 'seo.homeTitle or honour pages.index.title in Head.astro', firstSeenIn: 'family-kitchen' },
    'button-variants': { support: 'unsupported', requirement: 'action variant primary | dark', firstSeenIn: 'family-kitchen' },
    'section-spacing': { support: 'unsupported', requirement: 'section spacing default | compact', firstSeenIn: 'family-kitchen' },
    'hero-wordmark': { support: 'supported', requirement: 'hero option headingSize: display; fluid display font-size token', firstSeenIn: 'family-kitchen' },
    'daily-specials': { support: 'supported', requirement: 'section type specials { heading, intro, price, priceNote, items, images, action }', firstSeenIn: 'family-kitchen' },
    'promo-badge': { support: 'supported', requirement: 'badge { text, note } on specials and cta; CSS shape', firstSeenIn: 'family-kitchen' },
    'image-marquee': { support: 'supported', requirement: 'gallery layout marquee; CSS loop, paused on hover, static under reduced motion', firstSeenIn: 'family-kitchen' },
    'svg-icon-badges': { support: 'supported', requirement: 'features icon from a shared SVG set plus badgeColor; accent tokens', firstSeenIn: 'family-kitchen' },
    'media-text-split': { support: 'supported', requirement: 'richText and contact fields image, imagePosition, action', firstSeenIn: 'family-kitchen' },
    'offset-color-slab': { support: 'supported', requirement: 'media decoration slab: <accent token>; slab radius token', firstSeenIn: 'family-kitchen' },
    'heading-accent-bar': { support: 'supported', requirement: 'theme option headingDecoration; shared section-heading component', firstSeenIn: 'family-kitchen' },
    'line-doodles': { support: 'supported', requirement: 'per-section decoration slot for SVG assets', firstSeenIn: 'family-kitchen' },
    'menu-item-photos': { support: 'supported', requirement: 'menu item image; Menu.astro layout cards', firstSeenIn: 'family-kitchen' },
    'product-options-dialog': { support: 'supported', requirement: 'menu item ingredients; dialog web component', firstSeenIn: 'family-kitchen' },
    'messaging-app-checkout': { support: 'supported', requirement: 'commerce provider whatsapp; cart web component; message, wa.me URL and order id with tests', firstSeenIn: 'family-kitchen' },
    'delivery-location-pin': { support: 'supported', requirement: 'commerce.location; lazy Leaflet with SRI; geolocation allowed only when enabled', firstSeenIn: 'family-kitchen' },
    'table-reservation': { support: 'unsupported', requirement: 'booking integration or forms endpoint; reservation section or cta variant', firstSeenIn: 'family-kitchen' },
    'photo-band-card': { support: 'supported', requirement: 'cta backgroundImage and layout image-band; scrim token', firstSeenIn: 'family-kitchen' },
    'masonry-gallery': { support: 'supported', requirement: 'gallery layout masonry with per-image span', firstSeenIn: 'family-kitchen' },
    'section-header-action': { support: 'supported', requirement: 'optional headerAction link on sections without an action', firstSeenIn: 'family-kitchen' },
    'carousel': { support: 'unsupported', requirement: 'testimonials layout carousel; small web component for the controls', firstSeenIn: 'family-kitchen' },
    'review-rating': { support: 'unsupported', requirement: 'testimonial rating 1-5 and source', firstSeenIn: 'family-kitchen' },
    'category-tiles': { support: 'unsupported', requirement: 'section type tiles, or a gallery layout with intro and action', firstSeenIn: 'family-kitchen' },
    'scroll-reveal': { support: 'supported', requirement: 'theme motion option reveal; one IntersectionObserver script', firstSeenIn: 'family-kitchen' },
    'installable-app': { support: 'unsupported', requirement: 'brand.pwa; Head.astro tags; install web component; service-worker registration', firstSeenIn: 'family-kitchen' },
    'offline-page': { support: 'unsupported', requirement: 'per-site service worker and offline page; no-cache header for /sw.js', firstSeenIn: 'family-kitchen' },
  },

  // Placeholder copy every site should replace before launch, by override path.
  requiredContent: [
    'pages.index.sections.hero.heading',
    'pages.index.sections.stats.items',
    'pages.index.sections.testimonials.items',
    'pages.contact.sections.contact',
  ],

  // Sections the source design hid but that belong to the use case. They ship with the template;
  // a site that does not offer them removes them with `sections.<id>: false`.
  optionalSections: ['pricing'],

  // Settings a site supplies to a pattern once the platform builds it, keyed by x-patterns key.
  // They configure behaviour (a phone number, an order prefix), so they never go in sections.
  integrationSettings: { 'table-reservation': ['booking provider', 'booking page URL'] },

  // Templates are not deployed on their own: a version ships when it is merged to
  // main and the sites that pin this template are redeployed (saito affected lists them).
  deployment: {
    publishedBy: 'merge to main',
    rebuilds: 'sites pinning this template, on their next build',
    registration: 'add the module to the registry in packages/templates/src/index.ts',
  },

  // How to grow the template without breaking sites.
  extensibility: {
    addSection: 'Add it with a new id (minor). Existing sites receive it; they can remove it with `<id>: false`.',
    renameOrRemove: 'New major file + TemplateMigration (see exampleMigration).',
    newSectionType:
      'Development task: zod schema, Astro component in sectionComponents, Sanity schema, docs/CONFIGURATION.md.',
    customFields: 'Do not add fields the schema lacks: unknown fields inside sections are silently dropped.',
  },
} as const;

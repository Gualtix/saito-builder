# Extraction records and example enrichment

Two kinds of `x-` blocks carry what the schema cannot. `x-` keys are dropped by the loader, so they never break validation, but they must stay well-structured because later runs merge into them.

## 1. `x-extraction` in the generated site config

Describes this one extraction. Put it after `x-taxonomy`, near the top of `sites/<id>/site.config.yaml`.

```yaml
x-extraction:
  source: live-sketching/health/smile-studio/smile-studio-web-site/index.html
  extractedAt: 2026-10-26
  template:
    chosen: corporate@1
    reason: Multi-section clinic site with services, team and contact; corporate@1 has hero, stats, services, testimonials, cta and about/services/contact pages.
  mapping:                    # one entry per visible HTML block, in page order
    - source: "section#home (hero: Smile Studio)"
      target: pages.index.sections.hero
      type: hero
      fidelity: exact         # exact | lossy | unmapped | decorative
    - source: "section#results (before/after photos)"
      target: pages.index.sections.results
      type: gallery
      fidelity: lossy
      notes: Drag-to-compare slider lost; both photos kept as captioned images.
      patterns: [before-after-slider]
    - source: "div#booking (appointment picker)"
      target: none
      fidelity: unmapped
      patterns: [appointment-booking]   # keys in the example's x-patterns; a block can lose several
    - source: "header (logo, nav, icon links)"
      target: navigation
      type: navigation        # for non-section blocks: header, navigation or footer
      fidelity: lossy
      notes: Social icon buttons dropped from the header; kept in the footer.
  assets:
    images: 18
    hotlinked: images.unsplash.com
    action: Download licensed copies into sites/<id>/public/images/ before production.
  gaps:                       # things a human must decide or the platform cannot do yet
    - No production URL given; environments.production omitted.
    - Contact section labels ("Address", "Contact") are hardcoded in English in the renderer; the site is in Spanish.
```

Every `unmapped`, `lossy` and `decorative` entry lists the capabilities it lost as `x-patterns` keys in `patterns:` (add missing ones). Copy you had to write yourself (e.g. a fallback button label) gets `authored: true` on its entry.

## 2. `x-patterns` in `sites/example.config.yaml`

A generic catalog of template capabilities seen in real designs but not (or only partly) expressible in the schema. It is the backlog of candidate section types and components. Add the block after `x-components` if it does not exist yet.

```yaml
x-patterns:
  # Template capabilities seen in extracted designs that the schema cannot fully express.
  # status: proposed (seen, not built) | planned | implemented (now a real section type)
  before-after-slider:
    kind: component           # section | component | decoration | interaction | layout
    status: proposed
    description: Two images of the same subject overlaid, with a handle the visitor drags to compare.
    fields:
      heading: string
      pairs: "{ before: image, after: image, caption?: string }[]"
    nearestType: gallery      # closest current section type
    fallback: gallery with captioned before and after images
    seenIn: [service-business]   # website types / industries, never business names
    occurrences: 1            # how many extractions (sites) have found it, not repeats within one page
```

Merge rules:

- One entry per capability, keyed in kebab-case by what it **is**, not where it was seen (`appointment-booking`, not `smile-studio-booking`).
- Before adding, look for an existing entry that means the same thing. If found: increment `occurrences` once per extraction, add new `seenIn` values, add any new `fields`. Do not create near-duplicates (`booking-form` next to `appointment-booking`).
- Quote any value containing `: ` (common in `fallback` and `description`), or the example stops parsing.
- Keep it generic: no business names, copy, prices or URLs. Fields describe shape, not content.
- When a pattern becomes a real section type (someone implements it), set `status: implemented` and add its example to the section catalog page.

## 3. `x-vocabulary` in `sites/example.config.yaml`

Controlled lists of taxonomy values, so classifications stay consistent across extractions. Add the block after `x-taxonomy` if it does not exist yet; seed each list with the values already used in the example's `x-taxonomy`.

```yaml
x-vocabulary:
  # Allowed values for x-taxonomy. Extend when an extraction needs a new value; reuse before adding.
  industries: [professional-services]
  subIndustries: [management-consulting]
  visualStyles: [modern-minimal, editorial, trustworthy]
  tones: [confident, clear, warm]
  conversionGoals: [book-consultation, download-guide, newsletter-signup]
  positioning: [budget, mid-market, premium-accessible, luxury]
  maturity: [startup, growing, established-brand]
```

- Values are kebab-case. Reuse an existing value when it fits; add a new one only when none does.
- `visualStyles` is one list for both `visualStyle.primary/secondary` and `visualStyle.notStyles`.
- `maturity` is the business stage (startup, growing, established). A design note's "aesthetic maturity" is about visual polish: a different axis, so don't copy it across.
- `websiteTypes` is not here: it is the platform's fixed list in `packages/core/src/schema/template.ts`.

## 4. Other enrichment

- New design-token categories (e.g. a distinctive `borderWidth` or `opacity` scale) go into `x-tokens` in DTCG format, with generic names.
- New asset conventions (e.g. a `menu` image directory) go into `x-assets`.
- After changing the example: increment the minor part of `x-meta.referenceVersion` (1.0.0 → 1.1.0) and set `x-meta.lastReviewed` to today.
- Do not touch the example's validated fields or the section catalog unless the schema itself changed. They mirror the schema, not any one site.

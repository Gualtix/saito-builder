# Handling Unsupported Capabilities

What happens when an analyzed `index.html` contains components, behaviors or functionality the platform cannot express yet, and how such a capability becomes part of the shared platform.

## Principle

A capability the platform cannot support is **never built as site-specific code**. It is first checked against what already exists. If nothing fits, it is recorded in a shared catalog and later implemented as a **reusable platform extension**: a component variant, a new field, a new section type or a new template. Every site can then use it, not just the one that surfaced it.

The work happens in two separate phases:

| Phase | Who | Changes platform code? |
|---|---|---|
| **A. Identification** during extraction | `html-to-site-config` / `html-to-template` skills | No. The schema is fixed during extraction. |
| **B. Extension** when a pattern is worth building | A developer (or an agent asked to do it) | Yes |

Extraction never forces an unsupported block into fields that don't fit. The schema silently drops unknown fields, so a forced mapping would lose data without any warning.

---

## Phase A: Identification (during extraction)

### Step 1: Inventory the page

Outline the HTML and read its whole body:

```bash
python3 .claude/skills/html-to-site-config/scripts/html_outline.py <file-or-folder>
```

List every visible block: the header, each section, the footer, forms, widgets and decorations.

### Step 2: Try existing capabilities first

For each block, look for a fit in this order:

1. A section type in the current schema (the section catalog in `sites/example.config.yaml`, page `reference/section-catalog`, lists every type and field).
2. A variant of that type, such as hero `layout`, `columns` or section `background`.
3. Configuration: theme, navigation, footer, SEO, integrations.
4. A section the pinned template already has (merge into its id instead of adding a new one).

The mapping rules are in `.claude/skills/html-to-site-config/references/mapping.md`.

### Step 3: Classify the fidelity

Every block gets one fidelity level:

| Fidelity | Meaning | Example |
|---|---|---|
| `exact` | All meaningful content fits | FAQ accordion → `faq` |
| `lossy` | The content fits, but a visual or behavioral feature is lost | Image marquee → static `gallery` |
| `unmapped` | No type can carry it without distorting its meaning | Reservation widget (date, time, party size) |
| `decorative` | Pure decoration, no content | Doodles, blobs, textures |

Prefer `lossy` over `unmapped` when visitors still get the same information and action. Prefer `unmapped` over a misleading mapping: a reservation widget forced into `contact` would promise a booking flow that doesn't exist.

### Step 4: Apply the honest fallback

The site still has to build and work today:

- **Lossy:** use the nearest type and keep the content. For example, captioned photos in a `gallery`.
- **Unmapped:** use a `cta` linking to the real thing, such as a booking page or WhatsApp.
- **Decorative:** drop it and keep its content in the nearest section.

### Step 5: Record it in the extraction

The output records what was lost, so nothing disappears silently:

- **Site extraction:** the `x-extraction` block in `sites/<id>/site.config.yaml`. It holds one `mapping` entry per block with its fidelity, `notes`, and the pattern keys it lost in `patterns: [...]`, plus `gaps` for decisions a human must make.
- **Template extraction:** `templateExtensions.patterns` in `packages/templates/src/<id>/v1.ts`.

`x-` keys and `templateExtensions` are ignored by the loader and renderer, so they never break validation.

### Step 6: Add it to the shared pattern catalog

Every lossy, unmapped or reusable decorative capability gets an entry in `x-patterns` in `sites/example.config.yaml`. That catalog is the platform's **backlog of candidate extensions**:

```yaml
x-patterns:
  image-marquee:
    kind: interaction          # section | component | decoration | interaction | layout
    status: proposed           # proposed | planned | implemented
    description: Horizontally auto-scrolling, looping row of small captioned photos.
    fields:
      images: "{ image, caption?: string }[]"
      speed: "slow | normal"
    nearestType: gallery
    fallback: static gallery with captions, 4 columns
    seenIn: [restaurant]       # website types or industries, never business names
    occurrences: 1             # number of extractions that found it
```

Rules:
- One entry per capability, named by what it **is**.
- An existing entry gets `occurrences + 1` and new `seenIn` values instead of a near-duplicate.
- Entries stay generic: no business names, copy or URLs.

### Step 7: Report it

The extraction report lists the exact, lossy, unmapped and decorative counts. It names each lossy and unmapped block and the gaps a human must decide. Renderer limits found along the way are reported as gaps too, such as contact labels that are hardcoded in English.

---

## Phase B: Extension (making it part of the platform)

### Step 8: Decide whether to build it

Review the `x-patterns` catalog and set an entry's `status` to `planned` when it is worth building. Useful signals:

- `occurrences` above 1 and several `seenIn` values, meaning it is reused across sites or industries
- an `unmapped` fallback that loses a conversion (booking, ordering)
- a client requirement

A pattern seen once on one site can stay `proposed`.

### Step 9: Choose the smallest extension that carries it

| Extension | When | Compatibility |
|---|---|---|
| **New optional field or variant** on an existing section | The pattern is a variation of a type that exists (e.g. `svg-icon-badges` on `features`) | Backward compatible: existing sites are unaffected |
| **New section type** | New content shape or behavior (e.g. `media-text-split`, `category-tiles`) | Additive: existing sites are unaffected |
| **Renderer or component fix** | A limit of every site, e.g. hardcoded English labels | Affects every site's output |
| **New template** (or a new major of one) | A recurring combination of sections, layout and theme for a use case | New templates are additive. A breaking template change needs a new major plus a `TemplateMigration`, applied with `saito upgrade`. |

Prefer extending what exists over adding something new.

### Step 10: Implement it

**For a new section type**, touch all of these:

1. The zod schema in `packages/core/src/schema/sections.ts` (add it to the discriminated union).
2. The component in `packages/components/src/sections/`, registered in `sectionComponents`. A missing entry is a compile error.
3. The Sanity schema in `apps/studio/schemaTypes/index.ts`.
4. The table in `docs/CONFIGURATION.md`.
5. An example of the new type in both reference files. Their tests require every section type to appear:
   - the section catalog page in `sites/example.config.yaml`
   - the `reference/section-catalog` page in `packages/templates/src/template.example.ts`

**For a new field or variant**, update the same schema, component, Sanity schema and docs. Keep the field optional so existing sites still validate.

**For a new template**, use the `html-to-template` skill and register it in `packages/templates/src/index.ts`.

Keep the security boundaries: links go through `safeHref`, rich text through `renderRichText`, inline JSON through `jsonForScript`.

### Step 11: Verify it

```bash
npm run typecheck
npm test                          # includes the reference files and the Sanity seed round trip for every site
npm run saito -- validate --all
npm run saito -- dev <site>       # check in a browser
```

Shared code touches every site: `saito affected` lists them all, so redeploy with `./deploy.sh <env> --all`.

### Step 12: Close the loop

- Set the pattern's `status: implemented` in `x-patterns`.
- Update the sites that used the fallback: replace it with the new section, then remove the matching `x-extraction` gaps or notes.
- Future extractions now map that block as `exact`.

---

## Summary

```
HTML block
  └─ fits an existing type, variant or config? ── yes ─▶ map it (exact)
        │ no
        ▼
  classify (lossy / unmapped / decorative)
  ▶ apply the honest fallback, so the site still builds
  ▶ record it in x-extraction or templateExtensions
  ▶ add it to the x-patterns backlog, or raise its occurrences count
        │ worth building?
        ▼
  extend the platform (field/variant ▸ section type ▸ renderer fix ▸ template)
  ▶ implement, verify, mark implemented, upgrade the sites that used the fallback
```

Every new capability ends up in shared code, available to every site. None is implemented as a one-off customization.

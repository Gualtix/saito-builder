# Handling Unsupported Capabilities

What happens when an analyzed web project contains components, behaviors or functionality the platform cannot express yet, and how such a capability becomes part of the shared platform.

Designs enter the platform as **templates**: a web project is extracted into a template (`web-directory-to-template`), and sites are created from that template (`saito create <site> --template <id>`). Sites are never extracted from HTML themselves, so every finding is recorded once, on the template.

## Principle

A capability the platform cannot support is **never built as site-specific code**. It is first checked against what already exists. If nothing fits, it is recorded in a shared catalog and later implemented as a **reusable platform extension**: a component variant, a new field, a new section type, a theme token, an integration provider or a new template. Every site can then use it, not just the one that surfaced it.

This holds for purely visual patterns too. Templates and site configs are data: they hold no markup or CSS. So a look that the shared components cannot produce becomes a component feature or a theme token, never template or site code.

The work happens in two separate phases:

| Phase | Who | Changes platform code? |
|---|---|---|
| **A. Identification** during template extraction | The `web-directory-to-template` skill | No. The schema is fixed during extraction. |
| **B. Extension** when a pattern is worth building | A developer (or an agent asked to do it) | Yes |

Extraction never forces an unsupported block into fields that don't fit. The schema silently drops unknown fields, so a forced mapping would lose data without any warning.

---

## Phase A: Identification (during template extraction)

### Step 1: Inventory the project

Inventory the whole project directory, then read the files it points to:

```bash
python3 .claude/skills/web-directory-to-template/scripts/project_inventory.py <web-directory>
```

List every visible block (the header, each section, the footer, forms, widgets and decorations) and every behaviour (custom elements, app shell). Account for every file: pages, styles, data, scripts, assets and docs.

### Step 2: Try existing capabilities first

For each block, look for a fit in this order:

1. A section type in the current schema (the section catalog in `sites/example.config.yaml`, page `reference/section-catalog`, lists every type and field).
2. A variant of that type, such as hero `layout`, `columns` or section `background`.
3. Configuration: theme, navigation, footer, SEO, integrations.
4. An existing template that already carries the combination (reuse or extend it instead of adding a near-duplicate).

The mapping rules are in `.claude/skills/web-directory-to-template/references/mapping.md`.

### Step 3: Classify the fidelity

Every block gets one fidelity level:

| Fidelity | Meaning | Example |
|---|---|---|
| `exact` | All meaningful content fits | FAQ accordion → `faq` |
| `lossy` | The content fits, but a visual or behavioral feature is lost | Image marquee → static `gallery` |
| `unmapped` | No type can carry it without distorting its meaning | Reservation widget (date, time, party size) |
| `decorative` | Pure decoration, no content | Doodles, blobs, textures |

Prefer `lossy` over `unmapped` when visitors still get the same information and action. Prefer `unmapped` over a misleading mapping: a reservation widget forced into `contact` would promise a booking flow that doesn't exist.

#### Fidelity target

The classification is always the same; the **fidelity target** decides what happens to the result. Set the target per project and record it in the extraction:

| Target | Meaning | What `lossy`, `unmapped` and `decorative` rows become |
|---|---|---|
| **Content-equivalent** (default) | Visitors get the same information and actions | Accepted losses with an honest fallback (Step 4) |
| **Indistinguishable** | Side by side at phone and desktop widths, the look, interactions and outcomes match. Not pixel-perfect: small rendering differences are fine | Phase B tasks. A row can only stay lossy if a decision drops it. Decorations that carry the brand's look count as content |

Pixel-perfect is not a target the platform offers. It would force shared components to copy one design exactly, which defeats reuse.

### Step 4: Apply the honest fallback

The template, and every site created from it, still has to build and work today:

- **Lossy:** use the nearest type and keep the content. For example, captioned photos in a `gallery`.
- **Unmapped:** use a `cta` linking to the real thing, such as a booking page or WhatsApp.
- **Decorative:** drop it and keep its content in the nearest section.

### Step 5: Record it in the extraction

The template records what was lost, so nothing disappears silently: `templateExtensions.patterns` in `packages/templates/src/<id>/v1.ts` lists the pattern keys it approximates, and the extraction report lists each block with its fidelity and the gaps a human must decide.

`templateExtensions` is ignored by the loader and renderer, so it never breaks validation.

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
- a project with the **indistinguishable** fidelity target (Step 3), where every lossy row must be built

A pattern seen once on one site can stay `proposed`.

### Step 9: Choose the smallest extension that carries it

| Extension | When | Compatibility |
|---|---|---|
| **New optional field or variant** on an existing section | The pattern is a variation of a type that exists (e.g. `svg-icon-badges` on `features`) | Backward compatible: existing sites are unaffected |
| **New section type** | New content shape or behavior (e.g. `media-text-split`, `category-tiles`) | Additive: existing sites are unaffected |
| **New theme token** | A design value the renderer must apply site-wide, such as a per-role radius or a motion setting | Optional with a default that reproduces today's output |
| **New integration provider** | A new way to reach an external service, such as another commerce or forms provider | Additive: a new member of that integration's discriminated union |
| **Renderer or component fix** | A limit of every site, e.g. hardcoded English labels | Affects every site's output |
| **New template** (or a new major of one) | A recurring combination of sections, layout and theme for a use case | New templates are additive. A breaking template change needs a new major plus a `TemplateMigration`, applied with `saito upgrade`. |

Prefer extending what exists over adding something new.

#### Where a capability belongs

| The capability is… | It lives in… | Owned by |
|---|---|---|
| Content an editor changes (text, prices, photos, items) | A section field | Sanity after seeding (mirrored in the Studio schema) |
| A presentation choice per section (layout, decoration, badge) | An optional section field with a default | Template, and a site can override it |
| A design value for the whole site (colour, font, radius, motion) | `theme` | Template preset, and a site can override it |
| Behaviour in the browser (cart, dialogs, install prompt) | A web component in `packages/components/src/web/` | Platform |
| A connection to an external service | `integrations` | Site YAML (developer-owned, never in the Studio) |
| Something the build writes besides pages (headers, manifest, head tags) | The build, derived from config | Platform |

Design knowledge the renderer does not use (DTCG tokens, taxonomy, asset rules) goes in `templateExtensions`. Anything the renderer must apply belongs in the schema; a value that lives only in `templateExtensions` never reaches the page.

#### Template or site overrides?

Keep site configs thin. If a design's identity would otherwise live in one site's overrides (its section order, variants and theme), extract a template from it so the next site gets the look by pinning that template. Overrides are for one site's content and small differences, not for a design.

A template may carry optional sections that its source site hides, such as reviews, catering or booking. The site turns them off with `sections.<id>: false`, and the next site turns them on with one line. A section whose behaviour has no backend ships with its honest fallback (Step 4), for example a booking `cta` that opens WhatsApp.

#### When one pattern needs several extensions

Some patterns need several extensions at once. An ordering flow, for example, needs an integration provider, new item fields, a web component, localized copy and a relaxed browser permission. Before building, split the work into modules:

- Each module can be tested and shipped on its own, and dependencies point one way.
- A mechanism that several modules need (localized copy, for example) becomes its own module and is built once. Building it inside each feature gives diverging copies.
- A template can be drafted with the fields that exist today and adopt new fields as their modules land. It needs no migration while no site pins it.
- Record the module map before writing code, so the order of work and the boundaries are reviewed once.

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

**For a new template**, use the `web-directory-to-template` skill and register it in `packages/templates/src/index.ts`. Give it a generic id named after the use case, never after the business it came from. Add its palette as a preset in `themes.ts`, and add the patterns it uses to `templateExtensions.patterns`.

**For a new theme token**, add it to the theme schema as optional, emit it from `themeToCss()` as a `--saito-*` variable, and map it in the renderer's global styles. Its default must reproduce today's output.

**For interactive behaviour** (a web component):

- Enhance HTML the server already rendered. Without JavaScript, visitors still see the content and a working fallback action.
- Pass data from the page through `jsonForScript`, and never through strings assembled in scripts.
- Load third-party libraries lazily, from a pinned version with Subresource Integrity, and only when the feature is used.
- Keep visitor state in the browser, in storage namespaced by site id so sites on a shared domain never collide. Send nothing to a server unless an integration is configured for it.
- Take user-facing copy from the shared, locale-based strings mechanism, not from literals in the component.
- Respect `prefers-reduced-motion` for anything animated.

**For a new integration provider**, add a member to that integration's discriminated union. Decide for every field whether it is public (it is rendered into pages, like a phone number in a `wa.me` link) or server-only (stripped from `ResolvedSite.integrations`, like a webhook URL). Integrations stay out of the Studio.

**For anything that changes build output** (headers, head tags, generated files):

- Derive it from config, and never edit a site's output by hand.
- Relax security headers only when a site's config asks for the feature, and only as far as it needs (for example, allow geolocation for the same origin only when a map pin is enabled).
- Make one config value control every output channel the same way. A `noindex` flag must reach the meta tags, `robots.txt` and the response headers together; a test catches a channel that disagrees.
- Remember that header rules for a path stack with the catch-all rules. Check the final headers of a special file, such as a service worker, not just the rule you added.

Keep the security boundaries: links go through `safeHref`, rich text through `renderRichText`, inline JSON through `jsonForScript`.

### Step 11: Verify it

```bash
npm run typecheck
npm test                          # includes the reference files and the Sanity seed round trip for every site
npm run saito -- validate --all
npm run saito -- dev <site>       # check in a browser
```

Also check:

- **No regressions:** existing sites build to the same output. A new field's default must not change a site that doesn't use it, and a `diff -r` of `dist/` before and after shows only intended changes.
- **Behaviour parity:** if the pattern came from a working prototype, the prototype is the oracle. Port its self-checks into tests, and check that the same input gives the same output (the same cart gives the same order message).
- **Visual parity:** under the indistinguishable target, compare screenshots of the source and the build side by side at phone and desktop widths, and run through every interaction, including reduced motion.
- **Reuse:** a new template is proven when `saito create <test-site> --template <id>` validates and builds with its placeholder content alone.

Shared code touches every site: `saito affected` lists them all, so redeploy with `./deploy.sh <env> --all`.

### Step 12: Close the loop

- Set the pattern's `status: implemented` in `x-patterns`.
- Update the templates that used the fallback: replace it with the new section or field, and remove the pattern key from their `templateExtensions.patterns`.
- Future extractions now map that block as `exact`.
- Let templates pick the extension up. A template that now uses the new field ships as a minor release, which pinned sites get on their next build. A template change that would break those sites needs a new major and a migration instead.
- Push the code before content publishes rely on it. Builds triggered by the CMS clone the repository, so they only see pushed code and committed assets. A publish built from a stale branch replaces a newer manual deploy with older code.

---

## Platform-wide rules

These came out of real extensions and apply to every new capability:

1. **Defaults preserve output.** Every new field, variant and token is optional, and its default reproduces what sites render today.
2. **One owner per field.** Content belongs to the CMS after seeding; structure, theme and integrations belong to YAML. Any field the Studio shows must round-trip through the seed (`seed.test.ts`).
3. **One mechanism per concern.** Localized copy, browser storage, third-party loading and header rules each have one shared implementation that features reuse.
4. **One flag, every channel.** A config value that affects output controls all of its outputs consistently, and a test covers each one.
5. **Least privilege by config.** A browser permission or relaxed header is enabled only for the sites whose config needs it.
6. **Fallbacks stay honest.** An unbuilt capability never pretends to work; it ships its fallback action and is recorded as a gap.
7. **Data, not code, per site.** If something can only be expressed as code for one site, it is not ready to build. Generalize it first, or leave it as a recorded gap.

---

## Summary

```
HTML block
  └─ fits an existing type, variant or config? ── yes ─▶ map it (exact)
        │ no
        ▼
  classify (lossy / unmapped / decorative), then apply the fidelity target
  ▶ apply the honest fallback, so the template still builds
  ▶ record it in templateExtensions
  ▶ add it to the x-patterns backlog, or raise its occurrences count
        │ worth building?
        ▼
  extend the platform (field/variant ▸ theme token ▸ section type ▸ integration ▸ renderer fix ▸ template)
  ▶ split into modules if it needs several extensions
  ▶ implement, verify (no regressions, parity, reuse), mark implemented
  ▶ templates adopt it (minor release), push it, sites get it on their next build
```

Every new capability ends up in shared code, available to every site. None is implemented as a one-off customization.

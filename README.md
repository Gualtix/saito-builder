# Saito Builder

A configuration-driven, multi-tenant **static website factory**. Each website is a YAML file that overrides a versioned template; one Astro renderer turns every site into static HTML for a CDN. Product brief: [STORY.md](STORY.md).

Read top to bottom: each section zooms in one level.

| Level | Section | Answers |
|---|---|---|
| 1 | [Overview](#1-overview) | What is this, who uses it, what does it talk to? |
| 2 | [Architecture](#2-architecture) | What are the parts, and how does a site get resolved? |
| 3 | [Workflows](#3-workflows) | How do I create sites, add templates and change them? |
| 4 | [Build and deployment](#4-build-and-deployment) | How does a site reach the CDN? |
| 5 | [Operations](#5-operations) | Commands, environments, security, reference |

---

## 1. Overview

### Scope

| In scope | Out of scope |
|---|---|
| Content and marketing sites: landing, corporate, campaign, restaurant, event, microsites | ERP, CRM, SaaS products, dashboards, marketplaces |
| Contact forms through the optional API | User accounts, search, real-time features |
| Light commerce delegated to Snipcart, Shopify or Commerce Layer | Checkout, payments, inventory |
| Any change expressible as section data and theme tokens | Bespoke layouts (need a new section type or template) |

### System context

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  Dev["Developer<br>templates, site YAML"]
  Ed["Editor<br>copy and images"]
  Vis["Visitor"]

  subgraph Build["Build side"]
    direction TB
    Repo["Saito Builder repo<br>templates, sites, CLI, renderer"]
    GHA["GitHub Actions<br>CI + Deploy workflows"]
    Sanity["Sanity<br>Studio + Content Lake"]
  end

  subgraph Run["Run side"]
    direction TB
    CDN["CDN host<br>Cloudflare Pages, Netlify<br>or S3 + CloudFront"]
    API["Forms API<br>apps/api, optional"]
    Third["Third parties<br>analytics, commerce"]
  end

  Dev -->|"PR"| Repo
  Ed -->|"publish"| Sanity
  Repo -->|"push, PR"| GHA
  Sanity -.->|"webhook:<br>content-published"| GHA
  GHA -->|"reads content<br>at build time"| Sanity
  GHA -->|"scripts/deploy.sh"| CDN
  Vis -->|"HTTPS"| CDN
  CDN -.->|"contact form post"| API
  CDN -.->|"scripts"| Third

  class Dev,Ed,Vis gray
  class Repo,GHA,Sanity blue
  class CDN green
  class API,Third gray
  style Build fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style Run fill:#142824,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
```

### Quick start

```bash
npm install                                    # npm workspaces, Node >= 20.11
npm test                                       # unit + API tests
npm run saito -- sites                         # list sites
npm run saito -- templates                     # browse the template marketplace
npm run saito -- validate --all                # check every site against its template
npm run saito -- dev acme-corp                 # live preview at http://localhost:4321
npm run saito -- build --all                   # static output in dist/development/<site>
npm run saito -- create globex --template corporate --tenant globex --name "Globex" --url https://globex.example
npm run saito -- outdated                      # sites that can move to a new template major
npm run saito -- upgrade acme-launch --dry-run # preview a migration
npm run api                                    # optional forms backend on :8787
```

---

## 2. Architecture

### Components

```mermaid
flowchart TB
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  subgraph Packages["packages/ (libraries)"]
    direction LR
    Core["@saito/core<br>schemas, resolver, merge,<br>semver, theme, content sources"]
    Tpl["@saito/templates<br>versioned template registry"]
    Cmp["@saito/components<br>Astro sections, layout,<br>Web Components"]
    Cli["@saito/cli<br>saito command"]
  end

  subgraph Apps["apps/ (runnables)"]
    direction LR
    Ren["@saito/renderer<br>Astro SSG + Tailwind"]
    Api["@saito/api<br>Fastify forms backend"]
    Stu["apps/studio<br>Sanity Studio<br>not a workspace"]
  end

  Sites["sites/&lt;id&gt;/<br>config, content, public"]
  Ext["zod, yaml, @sanity/client,<br>astro, tailwind, fastify"]

  Tpl --> Core
  Cmp --> Core
  Cli --> Core
  Cli --> Tpl
  Cli -->|"spawns astro"| Ren
  Ren --> Core
  Ren --> Tpl
  Ren --> Cmp
  Api --> Core
  Core -->|"reads"| Sites
  Core -.-> Ext
  Stu -.->|"mirrors section schemas"| Core

  class Core,Tpl,Cmp,Cli blue
  class Ren,Api blue
  class Stu,Sites,Ext gray
  style Packages fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style Apps fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
```

| Component | Responsibility |
|---|---|
| `packages/core` | zod schemas, template → site resolver, deep merge, semver ranges, theme → CSS, content sources (local, Sanity) |
| `packages/templates` | Template marketplace: `landing` (v1, v2), `corporate`, `restaurant`, `event` |
| `packages/components` | One Astro component per section type, site layout, `<saito-contact-form>`, `<saito-countdown>` |
| `packages/cli` | `saito` commands: sites, templates, create, validate, build, dev, outdated, upgrade, affected, seed |
| `apps/renderer` | One Astro project that renders whichever site `SAITO_SITE` selects |
| `apps/api` | Tenant-aware contact form handling |
| `apps/studio` | Sanity Studio schemas for editors (`cd apps/studio && npm install`) |

### Folder structure

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  Root["saito-builder/"]
  P["packages/"]
  A["apps/"]
  S["sites/"]
  Sc["scripts/"]
  W[".github/workflows/"]
  D["docs/"]
  LS["live-sketching/<br>standalone POC"]
  Out["dist/&lt;env&gt;/&lt;site&gt;/<br>build output, ignored"]

  P --> P1["core/src<br>schema/, content/, resolve.ts,<br>pipeline.ts, registry.ts"]
  P --> P2["templates/src<br>&lt;id&gt;/vN.ts + index.ts"]
  P --> P3["components/src<br>sections/, layout/, web/"]
  P --> P4["cli/src<br>commands.ts, build.ts"]
  A --> A1["renderer<br>astro.config.ts, src/pages/"]
  A --> A2["api/src"]
  A --> A3["studio<br>schemaTypes/"]
  S --> S1["&lt;id&gt;/site.config.yaml"]
  S --> S2["&lt;id&gt;/content/pages/*.yaml"]
  S --> S3["&lt;id&gt;/public/"]
  Sc --> Sc1["deploy.sh"]
  Sc --> Sc2["live_template.py"]
  W --> W1["ci.yml"]
  W --> W2["deploy.yml"]
  D --> D1["ARCHITECTURE.md<br>CONFIGURATION.md"]

  Root --> P
  Root --> A
  Root --> S
  Root --> Sc
  Root --> W
  Root --> D
  Root --> LS
  Root --> Out

  class Root,P,A,S,Sc,W,D blue
  class P1,P2,P3,P4,A1,A2,A3,Sc1,Sc2,W1,W2,D1 gray
  class S1,S2,S3 blue
  class Out green
  class LS gray
```

### Resolution pipeline (the core idea)

`loadResolvedSite()` in `packages/core/src/pipeline.ts` turns three layers into the one `ResolvedSite` everything renders from. Precedence: **template < site config < content overlay**.

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  subgraph Inputs["Inputs"]
    direction TB
    I1["sites/&lt;id&gt;/site.config.yaml"]
    I2["content/pages/*.yaml"]
    I3["Sanity documents<br>if SAITO_CONTENT_SOURCE=sanity"]
    I4["Template registry<br>landing@1, corporate@1 ..."]
  end

  L1["Step 1: load config<br>siteConfigSchema"]
  L2["Step 2: deep-merge<br>content overlay"]
  L3["Step 3: resolve pinned<br>template version"]
  L4["Step 4: resolveSite()<br>apply overrides,<br>validate every section"]
  Err["SiteConfigError<br>all issues, with paths"]
  RS["ResolvedSite"]
  Astro["Astro<br>[...slug].astro"]
  SC["sectionComponents<br>type → component"]

  I1 --> L1
  I2 --> L2
  I3 --> L2
  L1 --> L2 --> L3
  I4 --> L3
  L3 --> L4
  L4 -->|"invalid"| Err
  L4 -->|"valid"| RS --> Astro --> SC

  class I1,I2,I3,I4 gray
  class L1,L2,L3,L4 blue
  class Err red
  class RS,Astro,SC green
  style Inputs fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
```

### Override semantics

Overrides are keyed by **section id**, never by array position. Merge rules: objects merge, arrays replace, `null` deletes.

```mermaid
flowchart TD
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  O0["pages.&lt;slug&gt;.sections.&lt;id&gt;"] --> O1{"Value is false?"}
  O1 -->|"yes"| R1["Remove the template section"]
  O1 -->|"no"| O2{"id exists<br>in the template?"}
  O2 -->|"yes"| R2["Deep-merge into it"]
  O2 -->|"no"| O3{"Has a type?"}
  O3 -->|"yes"| R3["Add a new section"]
  O3 -->|"no"| R4["Validation error"]
  R1 --> O4["order: [...]<br>listed ids first,<br>the rest keep template order"]
  R2 --> O4
  R3 --> O4

  class O0,O4 blue
  class O1,O2,O3 gray
  class R1,R2,R3 green
  class R4 red
```

Pages absent from the template need a `title` and typed sections. Sanity documents are converted into this same shape (`sanityToOverlay`), so every content source composes identically.

### Key abstractions

```mermaid
classDiagram
  direction LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  class TemplateRegistry {
    +resolve(ref) TemplateModule
    +latest(id) TemplateModule
    +migrationPath(id, from, to)
  }
  class TemplateModule {
    +manifest
    +migrations
  }
  class TemplateManifest {
    +id
    +version semver
    +websiteTypes
    +changelog
  }
  class TemplateMigration {
    +from major
    +to major
    +migrate(config)
  }
  class Page {
    +slug
    +title
  }
  class Section {
    +id
    +type one of 16
    +background
  }
  class Theme {
    +colors
    +fonts
    +radius
    +mode
  }
  class SiteConfig {
    +id
    +tenant
    +template id@range
    +pages overrides
  }
  class ContentSource {
    +getOverlay(config, env)
  }
  class ResolvedSite {
    +pages
    +theme
    +integrations public only
  }

  TemplateRegistry "1" o-- "1..*" TemplateModule : registers
  TemplateModule "1" *-- "1" TemplateManifest : declares
  TemplateModule "1" *-- "0..*" TemplateMigration : ships
  TemplateManifest "1" *-- "1..*" Page : defines
  TemplateManifest "1" *-- "1" Theme : defaults
  Page "1" *-- "0..*" Section : contains
  SiteConfig "0..*" --> "1" TemplateManifest : pins a major
  ContentSource "0..*" ..> "1" SiteConfig : overlays
  ResolvedSite "1" ..> "1" SiteConfig : resolved from
  ResolvedSite "1" ..> "1" TemplateManifest : resolved from

  style TemplateRegistry fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style TemplateModule fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style TemplateManifest fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style TemplateMigration fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style Page fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none
  style Section fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none
  style Theme fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none
  style SiteConfig fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style ContentSource fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none
  style ResolvedSite fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
```

### Configuration and dependency relationships

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  subgraph Files["Repository config"]
    direction TB
    F1["site.config.yaml<br>brand, theme, nav, SEO,<br>integrations, environments"]
    F2["package.json<br>workspaces, overrides: Vite 6"]
    F3["tsconfig.json<br>excludes packages/components"]
  end

  subgraph Env["Environment variables"]
    direction TB
    E1["SAITO_SITE, SAITO_ENV,<br>SAITO_ROOT"]
    E2["SAITO_CONTENT_SOURCE,<br>SANITY_PROJECT_ID, SANITY_DATASET,<br>SANITY_READ_TOKEN"]
    E3["SANITY_WRITE_TOKEN<br>saito seed only"]
    E4["API_PORT, API_HOST,<br>API_DATA_DIR"]
  end

  subgraph GHEnv["GitHub secrets"]
    direction TB
    G1["DEPLOY_PROVIDER"]
    G2["CLOUDFLARE_*, NETLIFY_*,<br>AWS_*, S3_BUCKET_PREFIX,<br>CLOUDFRONT_DISTRIBUTIONS"]
  end

  CLI["saito CLI"]
  REN["renderer"]
  APIx["api"]
  DEP["scripts/deploy.sh"]
  TC["npm run typecheck"]

  F1 --> CLI
  F1 --> REN
  F1 --> APIx
  F2 --> REN
  F3 --> TC
  E1 --> REN
  E2 --> REN
  E3 --> CLI
  E4 --> APIx
  CLI -->|"sets SAITO_SITE,<br>SAITO_ENV"| REN
  G1 --> DEP
  G2 --> DEP

  class F1,F2,F3,E1,E2,E3,E4,G1,G2 gray
  class CLI,REN,APIx,DEP,TC blue
  style Files fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style Env fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style GHEnv fill:#142824,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
```

`.env` is never loaded automatically: export the variables, or run `npx tsx --env-file=.env packages/cli/src/index.ts <command>`. Field-by-field reference: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

---

## 3. Workflows

### Developer journey

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  subgraph J1["Step 1: Set up"]
    A1["npm install"] --> A2["npm test"]
  end
  subgraph J2["Step 2: Explore"]
    B1["saito sites"] --> B2["saito templates"]
  end
  subgraph J3["Step 3: Change"]
    C1["Edit site YAML<br>or a template"] --> C2["saito dev<br>live preview"]
  end
  subgraph J4["Step 4: Verify"]
    D1["saito validate"] --> D2["npm test,<br>npm run typecheck"]
  end
  subgraph J5["Step 5: Ship"]
    E1["PR: CI builds<br>affected sites"] --> E2["Merge: staging"]
    E2 --> E3["Manual run:<br>production"]
  end

  J1 --> J2 --> J3 --> J4 --> J5

  class A1,A2,B1,B2,C1,C2,D1,D2 blue
  class E1,E2,E3 green
  style J1 fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style J2 fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style J3 fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style J4 fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style J5 fill:#142824,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
```

### Creating a new website from a template

```mermaid
flowchart TD
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  W1["saito templates<br>pick one"] --> W2["saito create &lt;id&gt;<br>--template t --tenant t"]
  W2 --> W3["Writes sites/&lt;id&gt;/site.config.yaml<br>pins current major, e.g. corporate@1<br>+ empty public/, content/pages/"]
  W3 --> W4["Customize site.config.yaml<br>brand, theme, nav, page overrides"]
  W4 --> W5["Optional: content/pages/*.yaml<br>or Sanity documents"]
  W5 --> W6["Add assets to public/"]
  W6 --> W7["saito dev &lt;id&gt;"]
  W7 --> W8{"saito validate &lt;id&gt;<br>passes?"}
  W8 -->|"no: fix paths<br>in the error"| W4
  W8 -->|"yes"| W9["PR, merge, deploy"]

  class W1,W2,W4,W5,W6,W7 blue
  class W3 gray
  class W8 gray
  class W9 green
```

Rules: the site `id` must equal its directory name; ids, tenants and section ids are kebab-case.

### Adding a new template

```mermaid
flowchart TD
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  T1["Create packages/templates/src/&lt;id&gt;/v1.ts"] --> T2["export default defineTemplate(manifest)<br>id, version 1.0.0, websiteTypes, tags,<br>theme, navigation, footer, pages, changelog"]
  T2 --> T3{"Needs a section type<br>that does not exist?"}
  T3 -->|"yes"| T4["Add the section type first<br>see diagram below"]
  T3 -->|"no"| T5["Register it in<br>packages/templates/src/index.ts"]
  T4 --> T5
  T5 --> T6{"defineTemplate validates<br>on load"}
  T6 -->|"invalid"| T2
  T6 -->|"valid"| T7["saito templates lists it"]
  T7 --> T8["Create a demo site with it<br>saito create, dev, validate"]
  T8 --> T9["npm test + typecheck, PR"]

  class T1,T2,T4,T5,T8,T9 blue
  class T3,T6 gray
  class T7 green
```

### Adding a section type

Every section type touches four places. The component map is typed `Record<SectionType, …>`, so a missing component is a compile error.

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  N["New section type"] --> S1["Schema<br>core/src/schema/sections.ts<br>add to the discriminated union"]
  N --> S2["Component<br>components/src/sections/<br>register in sectionComponents"]
  N --> S3["CMS schema<br>apps/studio/schemaTypes/index.ts"]
  N --> S4["Docs<br>docs/CONFIGURATION.md"]
  S1 --> V["npm run typecheck<br>+ npm test"]
  S2 --> V
  S3 --> V
  S4 --> V

  class N gray
  class S1,S2,S3,S4 blue
  class V green
```

### Modifying a template

Sites pin a **major** (`landing@1`). Non-breaking changes reach every pinned site on its next build; breaking changes ship as a new major with a migration.

```mermaid
flowchart TD
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  M0["Template change"] --> M1{"Breaks existing<br>site overrides?"}
  M1 -->|"no: copy, style,<br>new optional section"| M2["Edit vN.ts, bump minor or patch,<br>add a changelog entry"]
  M2 --> M3["PR: saito affected rebuilds<br>only sites using this template"]
  M3 --> M4["Every site on @N picks it up<br>on its next build"]
  M1 -->|"yes: renamed or<br>removed section ids"| M5["Add v(N+1).ts with a TemplateMigration<br>from, to, notes, migrate(config)"]
  M5 --> M6["Register both versions<br>in index.ts"]
  M6 --> M7["saito outdated<br>lists sites that can upgrade"]
  M7 --> M8["saito upgrade &lt;site&gt; --dry-run"]
  M8 --> M9{"Migrated config valid<br>against the new major?"}
  M9 -->|"no"| M5
  M9 -->|"yes"| M10["saito upgrade &lt;site&gt;<br>rewrites site.config.yaml"]
  M10 --> M11["Site re-pinned to @N+1<br>YAML comments lost"]

  class M0 gray
  class M1,M9 gray
  class M2,M3,M5,M6,M7,M8,M10 blue
  class M4,M11 green
```

### Content publishing (Sanity)

```mermaid
sequenceDiagram
  autonumber
  actor Ed as Editor
  participant Stu as Sanity Studio
  participant Lake as Sanity Content Lake
  participant GH as GitHub repository_dispatch
  participant Dep as deploy.yml
  participant CLI as saito build
  participant CDN as CDN host

  Ed->>+Stu: edit page or siteSettings for one site
  Stu->>+Lake: publish document
  Lake-->>-Stu: published
  deactivate Stu
  Lake->>+GH: webhook content-published, payload site + environment
  GH->>+Dep: trigger
  deactivate GH
  Dep->>Dep: plan: keep only that site, environment defaults to production
  Dep->>+CLI: build site with SAITO_CONTENT_SOURCE=sanity
  CLI->>+Lake: GROQ query, dataset = environment
  Lake-->>-CLI: documents
  CLI->>CLI: sanityToOverlay, merge over local content, render
  CLI-->>-Dep: dist folder
  Dep->>+CDN: scripts/deploy.sh
  CDN-->>-Dep: deployed
  deactivate Dep
```

`saito seed` runs the opposite direction (local content → Sanity) and must stay the exact inverse of `sanityToOverlay`; `packages/core/test/seed.test.ts` round-trips every site to enforce it. Deploys read Sanity only when the GitHub variable `SAITO_CONTENT_SOURCE` is `sanity`.

---

## 4. Build and deployment

### What `saito build` does

```mermaid
sequenceDiagram
  autonumber
  actor Dev as Developer or CI
  participant CLI as saito build
  participant Core as core pipeline
  participant Astro as Astro renderer
  participant FS as dist/env/site

  Dev->>+CLI: npm run saito -- build site --env staging
  CLI->>+Core: loadResolvedSite(site)
  Core->>Core: load config, merge content, resolve template, validate
  alt config invalid
    Core-->>CLI: SiteConfigError with every issue path
    CLI-->>Dev: site failed, exit 1
  else config valid
    Core-->>-CLI: ResolvedSite
    CLI->>+Astro: spawn astro build, SAITO_SITE + SAITO_ENV + SAITO_ROOT
    Astro->>Astro: per-site publicDir, outDir, cache dir
    Astro->>Astro: [...slug].astro maps section type to component
    Astro->>+FS: HTML, assets, sitemap.xml, robots.txt
    FS-->>-Astro: written
    Astro-->>-CLI: exit code 0
    CLI->>+FS: _headers + saito-manifest.json
    FS-->>-CLI: written
    CLI-->>-Dev: site built
  end
```

| Artifact | Purpose |
|---|---|
| `_headers` | Immutable caching for `/_astro/*`, short edge TTL + `stale-while-revalidate` for HTML, security headers, `X-Robots-Tag: noindex` outside production |
| `saito-manifest.json` | Site, tenant, environment, URL, template version, pages, build time |

### CI on every PR and push

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  subgraph Verify["Job: verify"]
    direction TB
    V1["npm ci"] --> V2["npm test"] --> V3["tsc --noEmit"] --> V4["saito validate --all<br>--env production"] --> V5["git diff | saito affected"]
  end
  subgraph Matrix["Job: build per site"]
    direction TB
    B1["saito build site<br>--env staging"] --> B2["Upload artifact<br>kept 7 days"]
  end
  V5 -->|"sites list"| B1
  V5 -->|"empty list"| Skip["No builds"]

  class V1,V2,V3,V4,V5 blue
  class B1 blue
  class B2 green
  class Skip teal
  style Verify fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style Matrix fill:#142824,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
```

### Which sites a change rebuilds (`saito affected`)

```mermaid
flowchart TD
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  F["Changed file"] --> Q1{"docs/, apps/studio/<br>or *.md?"}
  Q1 -->|"yes"| R0["Nothing"]
  Q1 -->|"no"| Q2{"sites/&lt;id&gt;/..."}
  Q2 -->|"yes"| R1["That site"]
  Q2 -->|"no"| Q3{"packages/templates/<br>src/&lt;t&gt;/..."}
  Q3 -->|"yes"| R2["Sites using template t"]
  Q3 -->|"no"| R3["Every site<br>platform code"]

  class F gray
  class Q1,Q2,Q3 gray
  class R0 teal
  class R1,R2 green
  class R3 red
```

Keep these path rules in sync with `packages/cli/src/commands.ts` if directories move. Anything else counts as platform code, including `scripts/` and `live-sketching/` HTML.

### Deployment flow

```mermaid
flowchart TD
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  subgraph Triggers["Triggers"]
    direction LR
    T1["push to main"]
    T2["workflow_dispatch<br>environment + sites"]
    T3["repository_dispatch<br>content-published"]
  end

  P["Job: plan"]
  T1 -->|"staging,<br>affected sites"| P
  T2 -->|"chosen env,<br>listed or all sites"| P
  T3 -->|"payload env, default production,<br>one site"| P

  P --> Q{"Any sites?"}
  Q -->|"no"| Stop["Nothing to deploy"]
  Q -->|"yes"| G["Job: deploy, matrix per site<br>max 8 in parallel<br>GitHub environment gate"]
  G --> B["saito build site"]
  B --> D{"scripts/deploy.sh<br>DEPLOY_PROVIDER"}
  D -->|"cloudflare-pages"| C1["wrangler pages deploy<br>project saito-site,<br>branch main or env"]
  D -->|"netlify"| C2["netlify deploy<br>--prod or --alias=env"]
  D -->|"s3-cloudfront"| C3["S3 sync: assets immutable,<br>HTML revalidated,<br>CloudFront invalidation"]
  D -->|"none"| C4["Build only, no upload"]
  D -->|"unknown"| C5["Exit 1"]

  class T1,T2,T3 gray
  class P,G,B blue
  class Q,D gray
  class C1,C2,C3 green
  class C4,Stop teal
  class C5 red
  style Triggers fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
```

### Build and deployment lifecycle

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  subgraph Build["Build phase"]
    direction LR
    L1["development<br>saito dev / build,<br>noindex"] --> L2["PR<br>CI: test, validate,<br>build affected"]
  end
  subgraph Prod["Release phase"]
    direction LR
    R1["staging<br>auto on merge,<br>noindex"] --> R2["production<br>manual, reviewers,<br>indexable"]
  end
  L2 -->|"merge to main"| R1
  CMS["Sanity publish"] -.->|"rebuild one site"| R2

  class L1,L2 blue
  class R1 green
  class R2 teal
  class CMS gray
  style Build fill:#1e1e38,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  style Prod fill:#142824,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
```

Each environment has its own URL (`environments` in the site config) and its own Sanity dataset. Non-production builds are always `noindex`: meta robots, `robots.txt` and the `X-Robots-Tag` header.

### Site lifecycle

```mermaid
stateDiagram-v2
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  [*] --> Scaffolded : saito create
  Scaffolded --> Configured : edit YAML, content
  Configured --> Invalid : validation fails
  Invalid --> Configured : fix reported paths
  Configured --> Staging : merge to main
  Staging --> Production : manual deploy
  Production --> Staging : next change merged
  Production --> Outdated : template ships a new major
  Outdated --> Upgraded : saito upgrade
  Upgraded --> Configured : review migrated YAML
  Production --> Production : minor template release, next build

  class Scaffolded,Configured,Upgraded blue
  class Staging green
  class Production teal
  class Invalid red
  class Outdated gray
```

### Prototype previews on GitHub Pages (separate tool)

[`live-sketching/`](live-sketching/README.md) is a standalone proof-of-concept workspace for single-file HTML prototypes. It has no code link to the platform; its only shared piece is the publish script.

```mermaid
flowchart LR
  classDef blue  fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#ffffff,filter:none
  classDef green fill:#14352c,stroke:#10b981,stroke-width:2px,color:#ffffff,filter:none
  classDef red   fill:#3b1a1a,stroke:#ef4444,stroke-width:2px,color:#ffffff,filter:none
  classDef teal  fill:#0f2d2d,stroke:#14b8a6,stroke-width:2px,color:#ffffff,filter:none
  classDef gray  fill:#1f1f1f,stroke:#6b7280,stroke-width:2px,color:#ffffff,filter:none

  H["live-sketching/.../<br>template-web-site/index.html"] --> S["npm run live-template -- folder<br>scripts/live_template.py"]
  S --> A["Account = owner of<br>this repo's git origin"]
  A --> R["Public repo per folder<br>topic live-template"]
  R --> GP["GitHub Pages<br>owner.github.io/folder"]

  class H,S,A blue
  class R,GP green
```

Full workflow, diagrams and caveats: [live-sketching/README.md](live-sketching/README.md).

---

## 5. Operations

### Example sites

| Site | Tenant | Template | Shows |
|------|--------|----------|-------|
| `acme-corp` | acme | corporate@1 | Theme overrides, removed section, extra page, content in separate files, contact form |
| `acme-launch` | acme | landing@1 | Dark theme; pinned to an old major to demo `outdated` / `upgrade` |
| `bella-trattoria` | bella | restaurant@1 | Added gallery section, re-ordered sections, Snipcart online ordering |
| `devconf-2027` | devconf | event@1 | Countdown Web Component, schedule, external ticket links |

### Contact form request

```mermaid
sequenceDiagram
  autonumber
  actor Vis as Visitor
  participant Page as Static page
  participant API as apps/api
  participant Sink as SubmissionSink
  participant Hook as Site webhook

  Vis->>+Page: submit contact form
  Page->>+API: POST /v1/sites/siteId/contact
  alt unknown site or origin not allowed
    API-->>Page: 404 or 403
  else body invalid or over 32 KB, or rate limit hit
    API-->>Page: 400, 413 or 429
  else accepted
    opt honeypot company_website is empty
      API->>+Sink: save to data/tenant/site.jsonl
      Sink-->>-API: saved
      API-)Hook: forward, if forms.webhookUrl is set
    end
    API-->>-Page: 303 redirect to the site's own domain, or 202 JSON
  end
  Page-->>-Vis: thank-you state
```

Only sites with `integrations.forms` are served. Bots that fill the honeypot get a fake success.

### Security boundaries

| Boundary | Rule |
|---|---|
| Rendered data | Render `ResolvedSite`, never raw `SiteConfig`: `integrations` drops server-only `forms.webhookUrl` and `notifyEmail` |
| Links | Every user link goes through `safeHref` (blocks `javascript:` and similar) |
| Rich text | `renderRichText` escapes first, then applies its small markup subset |
| Inline JSON | JSON-LD and analytics snippets use `jsonForScript` |
| CSS | Theme colours are hex only; font names are regex-restricted |
| Indexing | Non-production builds are always `noindex` |
| Secrets | Never in site configs: CI credentials are GitHub environment secrets |
| Sanity ids | Must not contain `.` (dotted ids are private) |

### Gotchas

| Topic | Note |
|---|---|
| Studio | `apps/studio` is deliberately not an npm workspace: `cd apps/studio && npm install` |
| Version pins | Root `overrides` pins Vite 6 so Astro 5 and Vitest share one Vite. Stay on Astro 5, Vitest 3, Zod 3, TypeScript 5 |
| Type checking | `packages/components` is checked by `astro check` through the renderer, not by the root `tsconfig.json` |
| No compile step | Package `exports` point at `src/*.ts`; TypeScript runs through `tsx` and Vite |
| Builds | Always build through the CLI: it resolves first (clear errors), then runs Astro, then writes edge artifacts |
| Linting | No linter is configured |

### Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the platform answers each architecture question in STORY.md
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md): site configuration reference
- [live-sketching/README.md](live-sketching/README.md): prototype workspace and GitHub Pages publishing

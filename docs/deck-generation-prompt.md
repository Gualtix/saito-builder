# Prompt: Zoom-Level Technical Slide Deck as One Offline HTML File

How to use: copy everything below the line into a capable model that has file access and a shell. Replace the four `{{…}}` placeholders first. The prompt is written for this repository's `README.md`, but works for any technical document with a layered structure.

| Placeholder | Example |
|---|---|
| `{{SOURCE_DOC}}` | `README.md` |
| `{{DECK_NAME}}` | `saito-builder-deck` |
| `{{PRODUCT_NAME}}` | `Saito Builder` |
| `{{SECTIONS}}` | `1 Overview · 2 Architecture · 3 Workflows · 4 Build and deployment · 5 Operations` |

---

## 0. Role, goal and deliverables

You are a technical writer, information designer and front-end engineer. Turn `{{SOURCE_DOC}}` into a presentation-ready slide deck about `{{PRODUCT_NAME}}`. Diagrams carry the explanation. Text supports them.

Deliver two things:

1. **A source tree** (`deck/`): modular slide partials, diagram specs, stylesheets, scripts, assets and a build script. You edit and maintain the deck here.
2. **One distributable file**, `deck/dist/{{DECK_NAME}}.html`. It must open by double-click from any folder, with no network, no server and no install, in current Chrome, Edge, Firefox and Safari. Everything is inlined: CSS, JavaScript, fonts, images and diagram data.

Never fetch anything at runtime. The built file has no `http://` or `https://` references in `src`, `href`, `url()` or `@import`. The only exception is plain hyperlinks the presenter clicks on purpose.

---

## 1. Content process

### 1.1 Research before design
1. Read `{{SOURCE_DOC}}` end to end. Also read every file it links to that a slide depends on.
2. When a slide shows a concrete artifact (a config file, headers, a manifest, a command), read the real source code and copy its actual content. Do not paraphrase from the README.
3. Never invent facts. When an example needs sample values, use obviously illustrative ones and say on the slide that they are illustrative.
4. Keep a fact trail: each slide records where its content came from in `data-source` (for example `data-source="README.md#resolution-pipeline-the-core-idea"`).

### 1.2 Structure: zoom levels
- Order content from high-level concepts to implementation detail, one zoom level per section: `{{SECTIONS}}`.
- The deck opens with a **title slide** that lists the levels as a "zoom ladder" (number, name, the question that level answers).
- Each section opens with a **divider slide**: a big level number, the section name, its question, an auto-generated numbered list of the section's slides, and the ladder with the current level highlighted.
- Within a section, order slides from context → structure → mechanism → edge cases.

### 1.3 One idea per slide
- Each content slide makes **one** point and has **at most one** diagram.
- **Split a topic across slides** when any of these is true:
  - a flow diagram would need more than about 12 nodes or 14 edges;
  - a sequence diagram would need more than 7 participants or 13 messages;
  - a class diagram would need more than 7 boxes;
  - body text would go over about 45 words.
- Name split slides "…, part 1: …" and "…, part 2: …", and make each half complete on its own. Example: "Key abstractions, part 1: the template side", then "part 2: the site side".

### 1.4 Slide anatomy
Every content slide has, in order:
1. **Eyebrow**: generated automatically as `Level N · Section name`.
2. **Title**: an assertion that states the takeaway in eight to twelve words. Example: "Section overrides are keyed by id, never by position", not "Override semantics".
3. **Lede**: optional, at most two lines. It says why the slide matters or names the governing file or function.
4. **Body**: the visual (a diagram, cards, a matrix, code panels or lanes).
5. **Notes row**: optional, one to three callout boxes. Each has an uppercase mono label ("WATCH OUT", "KEEP IN SYNC", "SECURITY BOUNDARY") and one sentence.
6. **Footer**: generated automatically. Product name on the left, `n / N` on the right.

### 1.5 Mapping source constructs to slide types

| Source construct | Slide type |
|---|---|
| Mermaid `flowchart` | Flow diagram (§2.5.2) |
| Mermaid `sequenceDiagram` | Sequence diagram (§2.5.4) |
| Mermaid `classDiagram` | Class-box diagram (§2.5.3), split template side and instance side |
| Mermaid `stateDiagram` | Flow diagram with a start dot and state nodes |
| In/out-of-scope table | Comparison grid with check and minus marks |
| Component/responsibility table | Card grid |
| Config/env-var lists | Matrix: rows are sources, columns are consumers, dots mark who reads what |
| Command lists | Cheat sheet, grouped by task |
| Merge or precedence rules | Stacked-layer visual plus before + override → result rule cards |
| Step lists ("journey") | Lanes: columns of command chips linked by chevrons |
| Generated files | Code panels showing the real file content, with annotation bullets |

### 1.6 Copy rules
- Plain, active and specific. Name things the way users recognise them.
- No marketing language, no emoji, no exclamation marks.
- Avoid "not X but Y" framing, asides set off by em dashes, and stock phrases.
- Paths, commands, identifiers, env vars and file names always appear in monospace.
- Edge and message labels are at most five words.
- Use numbering (1 · 2 · 3) only when the order is real.

---

## 2. Visual design system

### 2.1 Look and feel
A calm engineering-blueprint style. Cool neutral surfaces, one cobalt accent, and semantic colors that are used only to carry meaning. Hierarchy comes from type and spacing, not decoration.

- **No:** gradients, emoji, decorative illustrations, per-element drop shadows, or rounded-everything card stacks.
- **Only shadow:** the slide canvas itself, `0 1px 2px rgba(10,20,40,.08), 0 12px 40px rgba(10,20,40,.10)`.

The deck supports light and dark themes equally well. It follows the OS setting, and the presenter can override it.

### 2.2 Color tokens
Define every color as a CSS custom property on `:root` (light). Redefine the same tokens for dark in two places:
- `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`
- `:root[data-theme="dark"] { … }`

Component rules reference tokens only. No literal colors anywhere else.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | Stage around the canvas | `#E6EAEF` | `#090D13` |
| `--slide` | Canvas, label chips | `#FBFCFD` | `#111821` |
| `--ink` | Primary text | `#111A25` | `#E6EBF1` |
| `--muted` | Secondary text, labels | `#566476` | `#97A3B4` |
| `--line` | Borders, lifelines | `#CDD5DE` | `#283341` |
| `--chip` | Inline code background | `#EEF2F6` | `#18212C` |
| `--accent` | Eyebrows, numbers, highlights | `#2445D6` | `#8EA5FF` |
| `--accent-soft` | Highlighted card fill | `#E2E8FD` | `#1B2547` |
| `--step-f` / `--step-s` | Process step (fill/stroke) | `#EAF0FF` / `#3D5BDB` | `#16223D` / `#6F8CF4` |
| `--in-f` / `--in-s` | Input, actor, neutral | `#F1F3F6` / `#8592A3` | `#18202A` / `#6E7B8C` |
| `--out-f` / `--out-s` | Output, success | `#E3F4EB` / `#1C8657` | `#10281E` / `#3DBB83` |
| `--err-f` / `--err-s` | Error, failure path | `#FBE8E4` / `#C0402B` | `#2D1613` / `#EC7A65` |
| `--end-f` / `--end-s` | Terminal, no-op, production | `#E2F1F3` / `#2B7884` | `#0E2528` / `#4DB1BE` |
| `--warn-f` / `--warn-s` | Guard, security check, caution | `#FCF2DA` / `#AE7414` | `#291F10` / `#DDA446` |
| `--dec-f` / `--dec-s` | Decision | `#FFFFFF` / `#4A5768` | `#111821` / `#A8B4C3` |
| `--grp-f` / `--grp-s` | Group band | `#F2F4F8` / `#D6DCE4` | `#141C26` / `#25303D` |
| `--grp2-f` / `--grp2-s` | Alternate group band (run side, release phase) | `#EFF6F2` / `#CBE2D5` | `#11211B` / `#22392E` |
| `--edge` | Default edge and arrowhead | `#5A6778` | `#8592A3` |

Rules:
- Semantic colors are not the accent. Green means success or output, red means failure, amber means a guard, teal means a terminal state. Never use them for decoration.
- `body` always sets `background: var(--bg)`.
- The dark theme sets `color-scheme: dark` so native controls follow it.
- Check contrast: body text against its surface at least 4.5:1, and node strokes clearly visible on node fills, in both themes.

### 2.3 Typography
Three families, all under the SIL Open Font License, so they can be embedded:

| Role | Family | Weights | Fallback stack |
|---|---|---|---|
| Display (titles, card titles, ladder) | Schibsted Grotesk | 600, 700 | `"IBM Plex Sans", system-ui, sans-serif` |
| Body (lede, cards, node text) | IBM Plex Sans | 400, 500, 600 | `system-ui, -apple-system, "Segoe UI", sans-serif` |
| Mono (code, paths, eyebrows, footers, counters) | JetBrains Mono | 400, 500 | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` |

Type scale, in canvas pixels (the canvas is 1280 × 720):

| Element | Size / line height | Weight | Notes |
|---|---|---|---|
| Title-slide h1 | 92 / 0.95 | 700 | letter-spacing −0.035em |
| Divider numeral | 150 / 0.85 | 700 | accent color |
| Divider h2 | 58 / 1 | 700 | −0.025em |
| Slide title h2 | 36 / 1.12 | 600 | −0.015em, `text-wrap: balance` |
| Lede | 18 / 1.45 | 400 | muted, max-width 980 |
| Card title | 19–23 | 600 | display face |
| Card body | 15.5–18 / 1.45 | 400 | muted |
| Note text | 16 / 1.45 | 400 | |
| Eyebrow, callout label | 12–13 | 500–600 | mono, uppercase, letter-spacing 0.08em |
| Diagram node title | 17 | 600 | mono titles ×0.92 at weight 500 |
| Diagram node subtitle | 14 | 400 | muted |
| Edge label | 13 | 500 | muted, on a chip |
| Sequence message | 15 | 500 | ink |
| Class-box field | 14 | 400 | mono, prefixed `+ ` |
| Code panel | 15.5 / 1.6 | 400 | mono |
| Footer, counter | 12–13 | 500 | mono, `tabular-nums` |

Legibility floor: **no text renders smaller than 12 px at canvas scale** after a diagram's SVG is scaled into its box. Aim for 13 px or more. When a diagram would shrink below that, split it or drop the lede.

### 2.4 Layout system
- **Canvas:** fixed at 1280 × 720 logical pixels, radius 10, letterboxed and scaled uniformly to fit the window (§3.2).
- **Slide padding:** 44 top, 56 sides, 46 bottom. The footer sits 16 from the bottom.
- **Vertical rhythm:** header, then 22 px gap, then the body (flex 1, fills the remaining height), then the notes row. Body blocks are 16 apart, cards 14 apart.
- **Radii:** 8 for nodes, 10 for cards and notes, 12 for diagram groups, 999 for chips and pills.
- **Borders:** 1.5 px on cards, notes and nodes. 1.2 px on groups and separators.
- **Card grids** stretch to fill the body (`grid-auto-rows: 1fr`). They never leave a large empty band below short cards. When cards are short, enlarge their type with the `.big` modifier: title 23, body 18, padding 22/24.
- **Code and identifiers inside cards** use `white-space: nowrap` only when they are short. Split long commands into two code chips rather than letting them overflow.

Slide templates. Each is a class or combination on `section.slide`:

| Template | Use | Composition |
|---|---|---|
| `title-slide` | Opening | Left: eyebrow, h1, tagline (25 px), one-sentence summary. Right: zoom ladder (one rung per level: number, name, question). |
| `div-slide` | Section divider | Left: numeral, h2, question, two-column numbered slide list. Right: compact ladder with the current level highlighted and the others dimmed. |
| diagram | Default | Header + one `svg.dg` filling the body |
| diagram + notes | Diagram plus caveats | Header + svg + `.row` of 2–3 `.note` |
| cards | Responsibilities, example sites, gotchas | `.grid.big`, 3–4 columns; one card may span 2 to signal primacy, using an accent border |
| matrix | Config → consumer | Table with kind pills, mono source names, dot cells, tiny sub-captions under dots |
| comparison | Scope | Grid: category column, then green "in" and red "out" columns with drawn check and minus marks (CSS shapes, not glyphs) |
| code panels | Generated files | Two panels side by side, each with an uppercase mono heading, the real file, highlighted lines, and annotation bullets |
| lanes | Journeys | Five columns of command chips linked by chevrons; the final lane is green (ship) |
| cheat sheet | Commands | Two-column grid of groups; each group is a two-column list of mono command and muted description |

### 2.5 Diagram conventions

#### 2.5.1 General
- All diagrams are **inline SVG generated from data specs** (§3.4). Never hand-place SVG text in markup, and never use bitmap diagrams.
- **Coordinate space:** draw at `width = 1160` (the canvas body width), so that 1 unit ≈ 1 canvas pixel and text looks the same size on every slide. Height is whatever the content needs, normally 100–520. Crop empty space at the top with `y0`.
- **Reading direction:** the primary flow goes left to right, the secondary flow top to bottom. A long chain may "snake" across rows, but every row still reads left to right.
- **Spacing:** at least 40 units between unlabeled neighbours. Labeled neighbours need at least the label width + 16 (in practice 80–110). Vertical gap between rows is 60 or more.
- **Nodes:** at most three text lines (a title plus two subtitles). Single-line nodes are at least 46 tall; typical nodes are 64–96. Make the width fit the title at 17 px plus 24 px padding. Text auto-shrinks as a last resort, never below 12 px.
- **Groups:** a rounded band with an uppercase label at the top left, or a 130 px left label column for stacked layer bands. Groups sit behind everything and may themselves be edge endpoints.

#### 2.5.2 Node kinds and edge styles

| Kind | Shape | Meaning |
|---|---|---|
| `step` | Rounded rectangle, blue | Process step, internal component |
| `in` | Rounded rectangle, grey | Input, actor, external system, data at rest |
| `out` | Rounded rectangle, green | Output, success, published artifact |
| `err` | Rounded rectangle, red | Error state, failure outcome |
| `end` | Rounded rectangle, teal | Terminal or no-op outcome (nothing to do), production |
| `guard` | Rounded rectangle, amber | Security or validation boundary |
| `dec` | Hexagon, outlined | Decision, phrased as a question ending in "?" |
| `ghost` | Dashed rectangle | Optional, external or "not part of the build" |
| `start` | Filled dot (24 px) | Initial state in a state diagram |
| `cls` | Rectangle with a 36 px header and `+ field` rows | Class or abstraction |

Optional `badge` on a node: a small pill at the top center, such as `noindex` (amber) or `indexable` (green).

| Edge style | Meaning |
|---|---|
| Solid, neutral | Call, dependency, request, normal flow |
| Dashed `6 5` | Event-driven, optional, reply, "resolved from" |
| Dotted `2 4` | Fire-and-forget or async forward |
| Green (`ok`) | Success or "yes, valid" branch |
| Red (`err`) | Failure, invalid or retry loop |
| Accent (`acc`) | The primary write direction when two directions are compared |

Routing and labels:
- Routing is orthogonal with 10 px rounded corners. Arrowheads are 10 px filled triangles colored to match the edge.
- Connect to the middle of the facing side by default. Use side offsets (`ao`/`bo`) to separate parallel edges, a fixed elbow (`mx`/`my`) to align fan-ins and fan-outs on a shared trunk, and explicit waypoints (`via`) for loops and back-edges, routed outside the main flow.
- Decision branches are labeled `yes` / `no` (or `valid` / `invalid`).
- Edge labels sit on a chip filled with `--slide`, placed by default at the midpoint of the longest segment and overridable with `lp`. A label must never overlap a node.
- Add a legend (a notes row: "Solid arrow: …", "Dashed arrow: …") on the first slide that mixes styles.

#### 2.5.3 Class diagrams
- Template-side and instance-side abstractions go on separate slides.
- Edges carry the relationship verb and its multiplicity ("registers", "ships 0..*", "defines 1..*").
- Color class boxes by role: core types are `step`, value objects are `in`, and the resolved result is `out`.

#### 2.5.4 Sequence diagrams
- **Participants:** evenly spaced across 1160 units, with header boxes 46 tall (56 with a mono subtitle). Actors are pill-shaped (`in`), systems are rectangles (`step`). Path-like names render in mono. Lifelines are dashed in `--line`.
- **Messages:** rows are 32 units apart (self-messages 38). Every message is numbered with an accent badge (r 9.5) placed just left of its label chip. Labels are 15 px ink on a chip above the line. Replies are dashed, async forwards dotted, and error or success replies red or green.
- **Self-messages:** a small right-hand loop. The label goes to the right of the loop, or to the left (end-anchored) when it would cross the right edge. The badge always sits between the label and the loop.
- **Frames:** `alt`, `else` and `opt` are drawn as full-width rounded bands with a tab showing the operator and an italic `[condition]`. Nested frames are inset 14 units per level. Draw outer frames before inner ones so nesting stays visible.

### 2.6 Presentation style
- Each slide reads in under 20 seconds: the title gives the claim, the diagram the proof, the notes the caveats.
- Prefer showing the real artifact (actual headers, actual manifest keys) over describing it.
- Close the deck with a command cheat sheet and pointers to further reading.
- Motion: a slide fades and rises 5 px over 200 ms when it appears. Nothing else animates. Disable all motion under `prefers-reduced-motion`.

---

## 3. Runtime architecture (what the built file contains)

### 3.1 Document structure
```html
<!doctype html><html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{{PRODUCT_NAME}} Deck</title>
  <meta name="generator" content="deck-build {{version}} {{ISO date}}">
  <style>/* inlined: fonts (base64) → tokens → base → slide types → diagram → nav → print */</style>
</head><body>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><!-- arrowhead markers --></defs></svg>
  <div class="app">
    <main class="stage"><div class="fit"><div class="canvas">
      <section class="slide" data-sec="2" data-title="Resolution pipeline" data-source="README.md#…"
               aria-roledescription="slide" aria-label="10 of 40: Resolution pipeline">…</section>
      …
    </div></div></main>
    <nav class="bar" aria-label="Slide navigation">…</nav>
  </div>
  <div class="ov" hidden><!-- outline overlay --></div>
  <script>/* inlined: diagram data → engine → deck runtime, one IIFE */</script>
</body></html>
```

Required base rules:
- `html, body { height: 100% }` and `body { margin: 0 }`.
- `[hidden] { display: none !important }`. Slides use `display: flex`, so without `!important` every hidden slide would still show.
- Arrowhead `<marker>`s live in a zero-size but rendered SVG. Some browsers drop markers that sit in a `display: none` SVG.

### 3.2 Scaling and stage
- `.canvas` is positioned at 50% / 50% with `transform: translate(-50%,-50%) scale(s)`, where `s = min(fitWidth/1280, fitHeight/720)`. Recompute on `resize` and `fullscreenchange`.
- The stage keeps a side gutter of `max(16px, env(safe-area-inset-left/right))`. The page body never scrolls.
- On a narrow portrait screen, show "Rotate for a larger view" in the nav bar.

### 3.3 Generated chrome
On startup the runtime derives these from `data-sec`, `data-title` and the section config. Authors never type them:
- slide eyebrows (`Level N · Section`);
- footers (`{{PRODUCT_NAME}}`, `n / N`);
- divider-slide contents (numeral, question, the section's numbered slide list, the ladder);
- the title-slide ladder;
- the outline overlay;
- progress-bar segments, each sized in proportion to its section's slide count and clickable to jump to the section start.

### 3.4 Diagram engine
Diagram specs are plain data, rendered at startup into `svg.dg[data-d]`. Specs follow this schema:

```ts
type FlowSpec = {
  w?: number;            // default 1160
  h: number;             // content height in units
  y0?: number;           // crop top
  title: string;         // used for aria-label
  groups?: { id?: string; x: number; y: number; w: number; h: number; t?: string; s?: string; side?: boolean; g2?: boolean }[];
  nodes: {
    id: string; x: number; y: number; w: number; h?: number;
    t?: string;            // title; wrap in `backticks` to render mono
    s?: string[];          // 0–2 subtitles
    k?: 'step'|'in'|'out'|'err'|'end'|'guard'|'dec'|'ghost'|'start'|'cls';
    f?: string[];          // class fields (k:'cls'); height = 36 + 22*fields + 12
    c?: 'step'|'in'|'out'; // class-box color role
    badge?: string; bk?: 'warn'|'ok';
  }[];
  edges: {
    a: string; b: string;                // node or group ids
    as?: 'l'|'r'|'t'|'b'; bs?: 'l'|'r'|'t'|'b';  // sides; auto from relative position
    ao?: number; bo?: number;            // offsets along the side
    mx?: number; my?: number;            // fixed elbow position
    via?: [number, number][];            // explicit waypoints
    l?: string; lp?: [number, number]; lx?: number; ly?: number;  // label and placement
    c?: 'dash'|'async'|'ok'|'err'|'acc';
  }[];
};
type SeqSpec = {
  seq: true; title: string;
  p: { id: string; t: string; s?: string; a?: boolean /* actor */ }[];
  m: ( [from: string, to: string, label: string, kind?: 'r'|'a', color?: 'ok'|'err']
     | { f: 'alt'|'opt'|'loop'; t: string } | { else: string } | { end: true } )[];
};
```

Engine behavior:
- **Auto-routing:** pick sides from relative position (target fully right → r→l; left → l→r; below → b→t; otherwise t→b). Build H-V-H or V-H-V elbows, or an L-shape for mixed sides. Drop zero-length segments and round the corners.
- **Text measurement:** use a 2D canvas with the **same font stacks read from the CSS custom properties**, plus a 3% safety margin. Shrink text that does not fit its node. Re-render every diagram after `document.fonts.ready`.
- **Draw order:** groups → edges → nodes → labels. In sequence diagrams: frames (outer first) → lifelines → messages → headers.
- Every SVG gets `role="img"` and `aria-label` set from the spec `title`. Each node's full text is also present as SVG text, so it can be searched and selected.
- **Lazy rendering for large decks:** render a slide's diagrams the first time it is shown, plus the next slide ahead. Re-render visible diagrams when the theme changes only if the measurements depend on it.

### 3.5 Navigation and presenter usability

| Input | Action |
|---|---|
| → · Space · PageDown · swipe left | Next slide |
| ← · PageUp · swipe right | Previous slide |
| Home / End | First / last slide |
| `O` | Toggle the outline overlay (grouped by section, current slide highlighted; Esc closes) |
| `F` | Toggle fullscreen (wrapped in try/catch) |
| `T` | Cycle theme: system → light → dark (sets `data-theme` on `<html>`, remembered in `localStorage` inside try/catch) |
| `N` | Toggle the speaker-notes panel below the canvas (from `<aside class="notes">` inside each slide) |
| Digits + Enter | Jump to slide number |
| Nav bar | Prev / next buttons, `n / N` counter, section progress segments, section name, Outline button |

Further requirements:
- **Deep links:** `#s12` opens slide 12. Update the hash with `history.replaceState` on every slide change.
- **Focus:** buttons have `aria-label`s and a visible `:focus-visible` ring in the accent color. Ignore keystrokes while focus is in a form field.
- **Hidden cursor:** hide the pointer after 2 seconds of inactivity in fullscreen.
- **Print / PDF:** under `@media print` with `@page { size: 1280px 720px; margin: 0 }`, hide the nav, outline and notes, show every slide one per page at scale 1, and keep the light theme. The browser's own Print → Save as PDF then produces a handout. Make sure all diagrams are rendered before printing (handle `beforeprint`).

---

## 4. Implementation strategy (development workflow)

### 4.1 Source tree
```
deck/
  deck.config.json            # title, product, version, sections, slide order, output name, size budget
  slides/                     # one partial per slide; prefix sets the order inside a section
    00-title.html
    01-overview/00-divider.html
    01-overview/10-idea.html
    01-overview/20-scope.html
    02-architecture/…
  diagrams/                   # one data spec per diagram; filename = diagram id
    idea.js                   # export default { title, h, nodes, edges }
    pipeline.js
    build-seq.js
  styles/                     # concatenated in this order
    fonts.css                 # @font-face with url(../assets/fonts/*.woff2)
    tokens.css                # §2.2 tokens, light + dark
    base.css                  # reset, stage, canvas, slide chrome, [hidden]
    slide-types.css           # title, divider, cards, matrix, scope, lanes, code, cheat
    diagram.css               # node kinds, edges, chips, sequence, frames
    nav.css                   # bar, outline, notes panel
    print.css                 # @media print
  scripts/
    engine/measure.js  engine/flow.js  engine/seq.js  engine/route.js
    deck/scale.js  deck/chrome.js  deck/nav.js  deck/outline.js  deck/theme.js  deck/notes.js
    main.js                   # boot order: chrome → render diagrams → scale → go(hash)
  assets/
    fonts/                    # latin-subset woff2 files + OFL.txt
    images/                   # SVG preferred; PNG/JPG only for photos
  tools/
    build.mjs                 # assemble → dist/
    check.mjs                 # static validation
    qa.mjs                    # optional headless render + overflow/overlap report
    sheet.mjs                 # contact-sheet page for visual review
  dist/
    {{DECK_NAME}}.html        # the only distributable
```

### 4.2 Authoring contracts
- **Slide partial:** exactly one `<section class="slide …">` with `data-sec`, `data-title` and `data-source`. It contains no `<script>` and no `<style>`. Inline `style=""` is allowed only for a one-off grid column count. A diagram appears only as a placeholder: `<svg class="dg" data-d="pipeline"></svg>`. Optional speaker notes go in `<aside class="notes">…</aside>`.
- **Divider partial:** `<section class="slide div-slide" data-sec="2" data-title="Architecture" data-divider></section>`. The body is generated.
- **Diagram spec:** a pure data module with no functions. The id equals the filename. Add comments explaining non-obvious offsets ("ao:+45 keeps clear of the CLI→core trunk").
- **Styles:** components use tokens only. No new colors outside `tokens.css`. Add slide types as new classes in `slide-types.css`, never as per-slide CSS.
- **Engine and runtime:** written as ES modules for development. They must not depend on a bundler-only feature, so concatenating them into one IIFE works.

### 4.3 `deck.config.json`
```json
{
  "product": "{{PRODUCT_NAME}}",
  "output": "{{DECK_NAME}}.html",
  "version": "1.0.0",
  "budgetKB": 3000,
  "sections": [
    { "n": 0, "t": "{{PRODUCT_NAME}}", "q": "" },
    { "n": 1, "t": "Overview", "q": "What is this, who uses it, what does it talk to?" }
  ],
  "slides": ["00-title.html", "01-overview/*", "02-architecture/*"]
}
```
Glob entries expand in filename order. The section list is the single source for eyebrows, dividers, the ladder and the progress bar.

### 4.4 Build pipeline (`node tools/build.mjs`; Node 20 or later, no runtime dependencies)
1. **Load config.** Expand the slide globs and read each partial.
2. **Validate (fail the build on any error):**
   - each partial has one `section.slide` and the required attributes;
   - every `data-sec` exists in `sections`;
   - every `data-d` has a spec in `diagrams/` and every spec is used;
   - ids are unique;
   - spec nodes referenced by edges exist;
   - no `<script>` in partials.
3. **Styles.** Concatenate in the fixed order. Replace each `url(…/fonts/x.woff2)` with `url(data:font/woff2;base64,…)`. Replace image URLs with data URIs: SVG as URL-encoded UTF-8, raster as base64.
4. **Markup.** Concatenate the partials. Inline `<img src="assets/…">` as data URIs.
5. **Data.** Import every diagram spec and serialise them into one `const D = {…}` object keyed by id.
6. **Scripts.** Resolve the module graph from `main.js` and emit one IIFE in dependency order. Either strip `import`/`export` and concatenate topologically, or use `esbuild --bundle --format=iife` if a dev dependency is acceptable. Put the IIFE at the end of `<body>`.
7. **Template.** Write the document skeleton from §3.1. Stamp `generator`, `version` and the build date.
8. **Offline guard.** Fail if the output contains `src="http`, `href="http` on `<link>` or `<script>`, `url(http`, `@import`, or `fetch(`.
9. **Budget.** Report the size, and fail if it is over `budgetKB`. Fonts usually account for 250–450 KB.
10. **Write** `dist/{{DECK_NAME}}.html`.

Flags:
- `--watch` rebuilds on any change under `deck/`.
- `--minify` collapses whitespace in CSS and markup only (never inside `<pre>`).
- `--sheet` also writes `dist/sheet.html`, a contact sheet rendering every slide at 1280 × 720 in a scrolling column (2–3 per screen) for visual review.

### 4.5 Fonts for offline use
Download the latin subsets as woff2:
- Schibsted Grotesk 600 and 700;
- IBM Plex Sans 400, 500 and 600;
- JetBrains Mono 400 and 500.

Keep `OFL.txt` next to them and copy its notice into an HTML comment in the build. Use `font-display: block` for the embedded faces (they are local, so there is no flash), and keep the system fallback stacks for safety. Never link Google Fonts in the distributable.

### 4.6 Development loop
1. `node tools/build.mjs --watch --sheet`
2. Open `dist/sheet.html` to review all slides at once and `dist/{{DECK_NAME}}.html` to rehearse. Both are plain files, so no server is needed.
3. Edit a partial or spec, then save and reload.
4. Before sharing, run `node tools/check.mjs` and, when a headless browser is available, `node tools/qa.mjs`.

### 4.7 Quality assurance
`check.mjs` (static):
- runs the validation from step 2;
- checks diagram specs for node rectangles that overlap, nodes outside `[0,w]×[y0,h]`, labeled edges whose gap is narrower than the estimated label width + 16, more than three text lines in a node, sequences over 7 participants or 13 messages, and flows over 12 nodes (as a warning).

`qa.mjs` (optional, Playwright Chromium):
- for each slide, in both light and dark at 1280 × 720:
  - reports elements whose `scrollWidth > clientWidth` (text overflow);
  - reports SVG text whose bounding box overlaps another text box or leaves its node;
  - reports effective font sizes below 12 px after SVG scaling;
  - reports console errors;
- saves a PNG per slide to `dist/qa/`.

Manual review on the contact sheet:
- titles are assertions;
- one idea per slide;
- legends present where needed;
- semantic colors used correctly;
- no large empty bands;
- facts match the source.

### 4.8 Known pitfalls to design against
- Text measured with a different fallback font than the one rendered makes labels overlap their number badges. Measure with the CSS font stack and a safety margin.
- An opaque outer frame drawn after an inner one hides the inner frame. Sort frames by depth.
- `display: flex` on slides overrides the `hidden` attribute. Add `[hidden]{display:none!important}`.
- A missing `<meta charset="utf-8">` turns `·` and `→` into mojibake when the file is opened locally.
- A diagram taller than its box shrinks all of its text. Watch sequence diagrams in particular; split them or crop with `y0`.
- `nowrap` code in narrow cards overflows. Split long commands.
- Card grids aligned to the start leave dead space. Stretch rows and enlarge the type.

### 4.9 Maintainability and scalability
- **Single sources of truth:** colors live in `tokens.css`, structure in `deck.config.json`, facts in `{{SOURCE_DOC}}` (traced by `data-source`), and diagrams in specs.
- **When the source changes:** search `data-source` for the affected anchors, update those partials and specs, and rebuild.
- **New slide type:** add a class in `slide-types.css` and a template example under `slides/_templates/`, which the build ignores.
- **New diagram type:** add an engine module under `scripts/engine/`, extend the spec schema, and add a check rule.
- **Large decks (100+ slides):** use lazy diagram rendering, keep the section-grouped outline, and let config globs order the slides. Several decks can share `styles/`, `scripts/` and `tools/` as a common package, each with its own config, slides and diagrams.
- **Versioning:** bump `version` in config for content changes and stamp it into the footer tooltip and the `generator` meta. Commit `deck/` sources. Treat `dist/` as a release artifact.

---

## 5. Acceptance criteria
- [ ] `dist/{{DECK_NAME}}.html` opens offline by double-click in Chrome, Edge, Firefox and Safari, and renders identically with the network disabled.
- [ ] The file makes no external requests (verified in the browser network panel), and the build's offline guard passes.
- [ ] Every content slide has an assertion title and no more than one diagram. Topics over the §1.3 thresholds are split.
- [ ] The deck progresses from high-level to implementation detail through the zoom-level sections, each with a generated divider.
- [ ] No text renders below 12 px at canvas scale. No overflow, no overlapping labels, no clipped nodes, in light and dark.
- [ ] Semantic colors follow §2.5.2, and legends are present where edge styles are mixed.
- [ ] All navigation inputs in §3.5 work. Deep links, the outline, fullscreen, the theme toggle, notes and print to PDF all work.
- [ ] Every concrete artifact shown matches the repository source. Illustrative values are labelled.
- [ ] `check.mjs` passes, and `qa.mjs` passes where it can run.

## 6. What to return
1. The `deck/` source tree and `dist/{{DECK_NAME}}.html`.
2. A short build report: slide count per section, file size, the font payload, and any check warnings.
3. A list of facts you could not verify against the source, if any.

# Intent: Date El Gusto v1, Saito pipeline showcase

> **Status:** confirmed on 2026-10-29 (interview). Runbook: [`step-by-step.md`](../step-by-step.md). Capability map: [`specs/date-el-gusto-capability-map.md`](../specs/date-el-gusto-capability-map.md).

| | |
|---|---|
| **Outcome** | Extract a reusable restaurant template from the Tangerine prototype (`live-sketching/eatery-cafe/tangerine/tangerine-web-site/`) and build `date-el-gusto` as a thin site on top of it. Ship it through YAML → build → Cloudflare Pages, and show a Studio publish rebuilding the site in minutes. |
| **Audience** | Internal stakeholders first (prove Saito as a website factory). Pitching the restaurant owner comes after, and v1 must not block it. |
| **Fidelity** | Indistinguishable from the prototype side by side at 390 px and 1280 px: same look, same interactions, same outcomes (an identical WhatsApp message for the same cart). Not pixel-perfect; minor rendering differences are fine. |
| **Platform rule** | No site-specific code. Everything is built from reusable parts: the template, shared section components and their variants, theme tokens and web components. If another site can't reuse a feature, don't build it as custom logic. |
| **In v1** | The full WhatsApp cart (product dialog, ingredient removal, cart, map pin, order id, `wa.me` hand-off) as a platform commerce provider. Every visual pattern (marquee, masonry, colour slabs, doodles, scroll reveal). The PWA (Instalar App, offline page, service worker). Fictional content with self-hosted images. Order number `+502 4539 3659` (controlled by the team). |
| **Infrastructure** | The existing Saito Sanity project and Studio (`saito-builder.sanity.studio`), the existing Cloudflare account (the one that hosts `saito-acme-corp`), and production at `saito-date-el-gusto.pages.dev`. Staging and production are public and `noindex` everywhere. |
| **Workflow** | One editor (the developer). Both Sanity webhooks are enabled, and a production publish goes live immediately; that is the demo moment. |
| **Template sections** | Reservas (as a WhatsApp `cta`), Testimonios and Catering ship as optional sections. `date-el-gusto` turns them off to match the prototype. |
| **Constraint** | No hard date. If time runs short, the PWA is cut first. The cart and visual fidelity are never cut. |
| **Out of scope** | Custom domain, DNS and redirects. Real content. Client handoff and the Spanish editing guide. Client roles and approval gates. The contact form and `apps/api`. Analytics. Live visual editing (later). All of these move to the "Before a real client" checklist in the runbook. |

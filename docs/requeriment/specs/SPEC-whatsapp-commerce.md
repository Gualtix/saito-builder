# Spec: `whatsapp-commerce`

> Module of the [capability map](date-el-gusto-capability-map.md). Status: draft, awaiting review (2026-10-29). Depends on: `ui-strings`.
> **No automated tests** (decision 2026-10-29): validation is manual end-to-end testing by a person, using the checks under *Manual verification*. The prototype's `?sf-selftest` assertions are not ported.

## Objective

The primary conversion of restaurant templates: order from the menu without a backend. Payment and delivery are arranged in WhatsApp. This ports the prototype's storefront (`live-sketching/eatery-cafe/tangerine/tangerine-web-site/js/`) into a platform commerce provider any site can enable.

| Capability key | What the platform adds |
|---|---|
| `menu-item-photos` | Menu item `image?`; `menu.layout: 'list' \| 'cards'` (default `list`) |
| `product-options-dialog` | Menu item `ingredients?: string[]` (removable); product dialog with quantity stepper |
| `messaging-app-checkout` | `integrations.commerce` provider `whatsapp`; cart bar, cart sheet, checkout form, message builder, `wa.me` hand-off, order id |
| `delivery-location-pin` | `commerce.location`; map picker in checkout; `geolocation=(self)` only when enabled |

Full behaviour and numbers are in `templateExtensions.unsupportedCapabilities` of `family-kitchen/v1.ts`. The prototype's code is the reference implementation: `store.js`, `services.js`, `ui.js`, `components/menu.js`, `components/order.js`.

### Schema

```ts
// packages/core/src/schema/site.ts, a new member of the commerce discriminated union
z.object({
  provider: z.literal('whatsapp'),
  phone: z.string().min(6),                    // any format; reduced to digits for wa.me. Public by design
  currency: z.string().length(3),
  orderIdPrefix: z.string().regex(/^[A-Z0-9]{1,6}$/),
  maxQty: z.number().int().min(1).max(99).default(20),
  location: z.object({ enabled: z.boolean().default(false), center: z.tuple([z.number(), z.number()]), zoom: z.number().int().min(1).max(19).default(16) }).optional(),
})
```

Menu items gain `image?: image` and `ingredients?: string[]`. `orderable` and `id` already exist; with the `whatsapp` provider, `orderable` items with an `id` get an order button, as with Snipcart today.

## Tech stack

Zod 3, Astro 5, one web-component module in TypeScript (`web/whatsapp-cart.ts`) on the native `<dialog>`, `localStorage`. Leaflet 1.9.4 is loaded lazily from unpkg with the prototype's SRI hashes, plus OpenStreetMap tiles. No npm dependency is added.

## Commands

```bash
npm run typecheck
npm run saito -- validate --all
npm run saito -- dev <site>                      # order from the menu on :4321
npm run saito -- build <site> --env staging      # then: grep Permissions-Policy dist/staging/<site>/_headers
```

## Project structure

| File | Change |
|---|---|
| `packages/core/src/schema/site.ts` | `whatsapp` provider |
| `packages/core/src/schema/sections.ts` | Menu item `image`, `ingredients`; `menu.layout` |
| `packages/components/src/sections/Menu.astro` | `cards` layout (photo, category label, name, description, price, "Ordenar ahora"); `canOrder` for `whatsapp`; ordering notice above the menu; product data emitted with `jsonForScript` |
| `packages/components/src/web/whatsapp-cart.ts` | **New**: the store (`CartStore`, storage key `saito:<site-id>:cart`), `buildMessage`, `waUrl`, `orderId`, `mapsUrl`, `locate`, `loadLeaflet`, and the elements `<saito-product-dialog>`, `<saito-cart-bar>`, `<saito-cart-dialog>`, `<saito-location-picker>`. Ported from the prototype, with the message format unchanged |
| `packages/components/src/layout/SiteLayout.astro` | With the `whatsapp` provider: mount the dialogs and the cart bar at the end of `<body>`, and pass config and strings as JSON |
| `packages/components/src/strings.ts` | The prototype's storefront strings (`data.js` → `text`, about 55 keys) in `en` and `es` |
| `packages/cli/src/build.ts` | `Permissions-Policy`: `geolocation=(self)` when `commerce.location.enabled`, otherwise `geolocation=()` |
| `apps/renderer/src/styles/global.css` | Bottom sheets on phones, the cart bar, the map pin (`.sf-pin`), using `--saito-*` tokens |
| `apps/studio/schemaTypes/index.ts` | Menu item `image`, `ingredients`; `menu.layout`. The integration stays YAML-only |
| `docs/CONFIGURATION.md` | The provider, the menu fields, the geolocation rule |
| `packages/templates/src/family-kitchen/v1.ts` | Release 1.4.0: `menu.layout: cards`; items with `image` and `ingredients`; remove the 4 flags. Registry keys to `supported`, `x-patterns` to `implemented`. The provider itself is set by sites, not the template |

## Code style

Port the prototype's functions as they are; only adapt imports, names (`sf-` → `saito-`) and the source of copy (`strings.ts`). Keep the security boundaries: product data through `jsonForScript`, every interpolated string escaped (the prototype's `esc`), and URLs built only by `waUrl` and `mapsUrl`.

```ts
/** Order id "<prefix>-YYMMDD-XXXXX" (5 random chars from an unambiguous alphabet), as in the prototype. */
export const orderId = (prefix: string, now = new Date()): string => { /* ported unchanged */ };
```

Nothing leaves the browser except the `wa.me` navigation the customer triggers, and the tile requests while the optional map is open.

## Manual verification

On a site with `commerce.provider: whatsapp`, side by side with the prototype at 390 px and 1280 px:

1. The menu shows photo cards. "Ordenar ahora" opens the dialog with photo, ingredients and stepper (maximum 20).
2. Unchecking an ingredient and adding shows the cart bar with count and total. Reopening a line edits it.
3. In checkout, name, address and notes are remembered on the next visit. "Seguir Comprando" returns to the menu.
4. "Pedir por WhatsApp" opens `wa.me/<digits>?text=…`. For the same cart, the text matches the prototype's character for character, starting with `Pedido: <PREFIX>-YYMMDD-XXXXX`.
5. The location pin: "use my location" works on the deployed HTTPS build, and the pin can be dragged and placed by tapping. The message gets a maps link. With `location.enabled: false`, `_headers` keeps `geolocation=()`.
6. **Offline:** with the network off, an order action shows the offline notice (with `pwa`) or fails gracefully (without it).
7. Keyboard: the dialogs trap focus, `Esc` closes them, and the screen reader announces cart updates.
8. **No regressions:** a Snipcart site (if any) and the sites without commerce behave as before.

## Boundaries

- **Always:** the message format and order id identical to the prototype; Spanish and English copy from `strings.ts`; storage namespaced by site; Leaflet only when the map opens, with SRI.
- **Ask first:** sending orders anywhere but WhatsApp, storing orders, or adding a tile provider with an API key.
- **Never:** a server-side component, analytics or tracking inside the cart, or `geolocation=(self)` on sites that don't enable the map.

## Success criteria

- The 4 keys are `supported` in the registry and `implemented` in `x-patterns`, and `family-kitchen@1.4.0` has no flags for them.
- The 8 manual checks pass on staging.
- `npm run typecheck` and `npm run saito -- validate --all` pass.

## Open questions

- Should the cart's storage key include the environment (`saito:<site>:<env>:cart`), so that staging and production on different hosts never share a cart? *Recommendation:* no. They are different origins, so `localStorage` is already separate.

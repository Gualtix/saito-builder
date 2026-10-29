/*
 * WhatsApp storefront: the `whatsapp` commerce provider's browser side. Ported from the prototype
 * (live-sketching/eatery-cafe/tangerine/tangerine-web-site/js: utils, store, services, ui, components/menu, components/order);
 * only imports, names (sf- → saito-) and the copy source (strings.ts, passed in as JSON) changed.
 *
 * Elements: <saito-product-dialog>, <saito-cart-bar>, <saito-cart-dialog> and <saito-location-picker> (inside the cart).
 * SiteLayout mounts the first three and a <script type="application/json" id="saito-cart-data"> with
 * { config, text, products }; this module reads it once and hands every element the shared `app` context.
 * Menu.astro renders the order buttons as [data-saito-add="<item id>"]; any [data-saito-open-cart] opens the cart.
 *
 * Flow: menu button -> 'saito:product' -> product dialog -> store line { id, qty, removed[] } -> cart sheet
 *   -> checkout -> buildMessage -> https://wa.me/<digits>?text=<encoded>. Payment and delivery happen in that chat.
 * Storage: localStorage `saito:<site-id>:cart` and `saito:<site-id>:profile` (name + address only).
 * Security: every interpolated string goes through esc(); user input is only assigned as .value or put in the
 *   message text. URLs are built only by waUrl and mapsUrl. Nothing leaves the browser except the customer's
 *   wa.me navigation and, while the optional map is open, Leaflet (pinned, SRI) and OpenStreetMap tiles.
 */
import type { strings } from '../strings.ts';

type Text = ReturnType<typeof strings>;

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
  ingredients?: string[];
}

export interface CartConfig {
  siteId: string;
  locale: string;
  phone: string;
  currency: string;
  orderIdPrefix: string;
  maxQty: number;
  location?: { enabled: boolean; center: [number, number]; zoom: number };
}

export interface CartLine {
  id: string;
  qty: number;
  removed: string[];
}

interface LatLng {
  lat: number;
  lng: number;
}

/* ===== utils (prototype js/utils.js) ===== */

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes a value for safe use in HTML text and attribute positions. */
export const esc = (v: unknown): string => String(v).replace(/[&<>"']/g, (c) => ESC[c]!);

/** Limits n to the range [lo, hi]. */
export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** True when two arrays hold the same strings in any order: the cart's line-merge key for removed ingredients. */
export const sameSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && [...a].sort().join('\n') === [...b].sort().join('\n');

/** Returns a currency formatter, e.g. money('es-GT', 'GTQ')(35) -> "Q35.00". Build it once and reuse it. */
export const money = (locale: string, currency: string) => {
  const format = new Intl.NumberFormat(locale, { style: 'currency', currency });
  return (n: number): string => format.format(n);
};

/** Reduces a phone number in any format to its digits, as wa.me links require. */
export const digitsOnly = (v: unknown): string => String(v).replace(/\D/g, '');

/** "1 platillo" / "3 platillos" (the prototype's itemsLabel). */
const itemsLabel = (t: Text, n: number): string => (n === 1 ? t.itemsOne : t.itemsMany.replace('{n}', String(n)));

/* ===== store (prototype js/store.js) ===== */

/** Namespaced, fail-safe JSON access to localStorage. */
export const storage = (key: string) => ({
  get<T>(name: string, fallback: T): T {
    try {
      return JSON.parse(localStorage.getItem(`${key}:${name}`) as string) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(name: string, value: unknown): void {
    try {
      localStorage.setItem(`${key}:${name}`, JSON.stringify(value));
    } catch {
      /* private mode or quota: keep working in memory */
    }
  },
});

/**
 * The cart and the customer profile. Lines are { id, qty, removed[] }: one per product + removed-ingredient set.
 * Unknown ids and malformed saved entries are dropped on load; prices are never stored. Fires 'change' after every mutation.
 */
export class CartStore extends EventTarget {
  #storage;
  #catalog: Map<string, { price: number }>;
  #maxQty: number;
  lines: CartLine[];
  /** { name, address } of the returning customer, or {} */
  profile: { name?: string; address?: string };

  constructor({ storageKey, maxQty, catalog }: { storageKey: string; maxQty: number; catalog: Map<string, { price: number }> }) {
    super();
    this.#storage = storage(storageKey);
    this.#catalog = catalog;
    this.#maxQty = maxQty;
    // a saved cart that is not an array (valid JSON, wrong shape) counts as empty instead of crashing startup
    const saved = this.#storage.get<unknown>('cart', []);
    this.lines = (Array.isArray(saved) ? saved : [])
      .filter((l) => catalog.has(l?.id) && Array.isArray(l.removed))
      .map((l) => ({ id: l.id, qty: clamp(Math.floor(l.qty) || 1, 1, maxQty), removed: l.removed.map(String) }));
    this.profile = this.#storage.get('profile', {});
  }

  /** Total number of items across all lines. */
  count(): number {
    return this.lines.reduce((n, l) => n + l.qty, 0);
  }

  /** Order total from current catalogue prices. */
  total(): number {
    return this.lines.reduce((n, l) => n + this.#catalog.get(l.id)!.price * l.qty, 0);
  }

  /** Adds qty of a product; merges into an existing line with the same removed-ingredient set. */
  add(id: string, qty: number, removed: string[]): void {
    const same = this.lines.find((l) => l.id === id && sameSet(l.removed, removed));
    if (same) same.qty = clamp(same.qty + qty, 1, this.#maxQty);
    else this.lines.push({ id, qty, removed });
    this.#changed();
  }

  /** Replaces line i in place; if the edit makes it identical to another line, merges into that one. */
  update(i: number, qty: number, removed: string[]): void {
    const { id } = this.lines.splice(i, 1)[0]!;
    const same = this.lines.find((l) => l.id === id && sameSet(l.removed, removed));
    if (same) same.qty = clamp(same.qty + qty, 1, this.#maxQty);
    else this.lines.splice(i, 0, { id, qty, removed });
    this.#changed();
  }

  /** Sets the quantity of line i, clamped to 1..maxQty. */
  setQty(i: number, qty: number): void {
    this.lines[i]!.qty = clamp(qty, 1, this.#maxQty);
    this.#changed();
  }

  /** Removes line i. */
  remove(i: number): void {
    this.lines.splice(i, 1);
    this.#changed();
  }

  /** Persists the customer's name and address for the next visit. */
  saveProfile({ name, address }: { name: string; address: string }): void {
    this.profile = { name, address };
    this.#storage.set('profile', this.profile);
  }

  #changed(): void {
    this.#storage.set('cart', this.lines);
    this.dispatchEvent(new Event('change'));
  }
}

/* ===== services (prototype js/services.js) ===== */

/**
 * Builds the plain-text order message. Its exact text and layout are what staff read in WhatsApp,
 * so change it deliberately (it must match the prototype character for character).
 */
export function buildMessage(
  lines: CartLine[],
  info: { name: string; address: string; notes?: string; location?: string; orderId?: string },
  { t, fmt, byId }: { t: Pick<Text, 'msgOrder' | 'msgGreeting' | 'without' | 'total' | 'msgName' | 'msgAddress' | 'msgLocation' | 'msgNotes'>; fmt: (n: number) => string; byId: Map<string, { name: string; price: number }> },
): string {
  const out = info.orderId ? [`${t.msgOrder}: ${info.orderId}`, t.msgGreeting, ''] : [t.msgGreeting, ''];
  lines.forEach((l, i) => {
    const p = byId.get(l.id)!;
    out.push(`${i + 1}) ${l.qty} x ${p.name} - ${fmt(p.price * l.qty)}`);
    if (l.removed.length) out.push(`   ${t.without} ${l.removed.join(', ')}`);
  });
  out.push('', `${t.total}: ${fmt(lines.reduce((n, l) => n + byId.get(l.id)!.price * l.qty, 0))}`, '');
  out.push(`${t.msgName}: ${info.name}`, `${t.msgAddress}: ${info.address}`);
  if (info.location) out.push(`${t.msgLocation}: ${info.location}`);
  if (info.notes) out.push(`${t.msgNotes}: ${info.notes}`);
  return out.join('\n');
}

/** wa.me deep link that opens a chat with `number` and the message prefilled. */
export const waUrl = (number: string, text: string): string => `https://wa.me/${digitsOnly(number)}?text=${encodeURIComponent(text)}`;

// Order id: PREFIX-YYMMDD-RANDOM, e.g. DG-261027-7KQ4M. No backend, so uniqueness is probabilistic:
// ids can only collide within the same day (32^5 ≈ 33M codes/day), and WhatsApp also shows the sender's number.
// Crockford base32 (no I, L, O, U) so staff can read it aloud; 256 % 32 === 0, so no modulo bias.
const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Creates a fresh order id from crypto randomness; `now` is injectable. */
export const orderId = ({ prefix = '', randomLength = 5 } = {}, now = new Date()): string => {
  const date = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('');
  const code = Array.from(crypto.getRandomValues(new Uint8Array(randomLength)), (b) => ID_ALPHABET[b % 32]).join('');
  return [prefix, date, code].filter(Boolean).join('-');
};

/** Google Maps link for a point, rounded to 6 decimals (~10 cm). */
export const mapsUrl = ({ lat, lng }: LatLng): string => `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

/**
 * Resolves the device position as { lat, lng }. Geolocation only works in a secure context (https or
 * localhost); on plain http, when permission is denied, or after the 10 s timeout it rejects and the
 * caller falls back to its default map centre.
 */
export const locate = (): Promise<LatLng> =>
  new Promise((ok, fail) => {
    if (!navigator.geolocation || !window.isSecureContext) return fail(new Error('geolocation unavailable'));
    navigator.geolocation.getCurrentPosition((p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }), fail, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  });

// shortcut: Leaflet is untyped here (no npm dependency for its types); add @types/leaflet if the map grows.
type Leaflet = any;

const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet';
let leaflet: Promise<Leaflet> | null = null; // the in-flight or finished load, shared by every caller

/** Appends a <link>/<script> to <head> and resolves when it has loaded. */
const tag = (el: HTMLLinkElement | HTMLScriptElement) =>
  new Promise((ok, fail) => {
    el.onload = ok;
    el.onerror = fail;
    document.head.append(el);
  });

/**
 * Loads Leaflet's CSS and JS once, pinned to 1.9.4 with Subresource Integrity, and resolves with the
 * Leaflet namespace. A failed load is forgotten so the next map open retries.
 */
export const loadLeaflet = (): Promise<Leaflet> =>
  (leaflet ||= ((window as Leaflet).L
    ? Promise.resolve()
    : Promise.all([
        tag(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: LEAFLET + '.css', integrity: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=', crossOrigin: '' })),
        tag(Object.assign(document.createElement('script'), { src: LEAFLET + '.js', integrity: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=', crossOrigin: '' })),
      ])
  ).then(
    () => (window as Leaflet).L,
    (err) => {
      leaflet = null; // reset so the next open retries
      throw err;
    },
  ));

/* ===== ui helpers (prototype js/ui.js); the class sets live in global.css as .saito-* ===== */

const ICONS = {
  wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
};

/** Decorative 20px line icon ('wa' or 'pin'); extra classes tint or nudge it. */
const icon = (name: keyof typeof ICONS, extra = '') =>
  `<svg class="size-5 flex-none ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

/**
 * Quantity stepper markup: − output +. Buttons carry data-saito-step="-1|1" for the caller's click handler,
 * disable at the limits, and the output is aria-live so the new value is announced.
 */
const stepper = (t: Text, qty: number, max: number) =>
  `<div class="saito-stepper" data-saito-qty role="group" aria-label="${esc(t.quantity)}">
      <button type="button" data-saito-step="-1" aria-label="${esc(t.decrease)}"${qty <= 1 ? ' disabled' : ''}>−</button>
      <output class="min-w-[2ch] text-center font-bold" aria-live="polite">${qty}</output>
      <button type="button" data-saito-step="1" aria-label="${esc(t.increase)}"${qty >= max ? ' disabled' : ''}>+</button></div>`;

/**
 * Closes a dialog on a backdrop click or on any [data-saito-close] button inside it. The closest('dialog')
 * check keeps a close button in a nested dialog from also closing its parent. Esc is native.
 */
const wireDialog = (dialog: HTMLDialogElement) =>
  dialog.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (target === dialog || (target.closest('[data-saito-close]') && target.closest('dialog') === dialog)) dialog.close();
  });

const closest = (e: Event, selector: string) => (e.target as Element).closest<HTMLElement>(selector);

/* ===== elements (prototype js/components/menu.js and order.js) ===== */

interface App {
  data: CartConfig & { text: Text; products: Product[] };
  store: CartStore;
  fmt: (n: number) => string;
  byId: Map<string, Product>;
}

/** Event that asks <saito-product-dialog> to open: detail { id, edit } where edit is a cart line index or null. */
const OPEN_PRODUCT = 'saito:product';
/** Asks an offline notice (pwa module, when present) to show the offline message. */
const OFFLINE = 'saito:offline';

/**
 * <saito-product-dialog>: product image, description, removable ingredients (checked = included) and a
 * quantity stepper. Adds a new cart line, or, when opened with `edit`, prefills from that line and
 * Save replaces it. Announces the result in its aria-live region.
 */
class SaitoProductDialog extends HTMLElement {
  #app!: App;
  #draft: { p: Product; qty: number; edit: number | null } | null = null;
  #dialog!: HTMLDialogElement;
  #form!: HTMLFormElement;
  #live!: HTMLElement;

  set app(app: App) {
    this.#app = app;
    this.innerHTML = `<dialog class="saito-sheet" aria-labelledby="saito-p-name"><form class="saito-sheet-col" novalidate></form></dialog>
      <p class="sr-only" aria-live="polite"></p>`;
    this.#dialog = this.querySelector('dialog')!;
    this.#form = this.#dialog.firstElementChild as HTMLFormElement;
    this.#live = this.querySelector('[aria-live]')!;
    wireDialog(this.#dialog);
    this.#form.addEventListener('click', (e) => this.#step(e));
    this.#form.addEventListener('submit', (e) => this.#submit(e));
    document.addEventListener(OPEN_PRODUCT, (e) => {
      const { id, edit } = (e as CustomEvent<{ id: string; edit: number | null }>).detail;
      this.open(id, edit);
    });
  }

  /** Opens the dialog for product `id`; `edit` is the index of the cart line being changed, or null for a new line. */
  open(id: string, edit: number | null = null): void {
    const { data, store, fmt, byId } = this.#app,
      t = data.text;
    const p = byId.get(id);
    if (!p) return;
    const line = edit === null ? null : store.lines[edit];
    this.#draft = { p, qty: line ? line.qty : 1, edit };
    const ing = p.ingredients || [];
    this.#form.innerHTML = `
      <button type="button" class="saito-sheet-close absolute top-2.5 right-2.5 z-1 bg-background/90" data-saito-close aria-label="${esc(t.close)}">×</button>
      <div class="saito-sheet-body">
        ${p.image ? `<img class="block w-full h-auto aspect-video max-h-[30vh] object-cover" src="${esc(p.image)}" alt="" width="600" height="338">` : '<div class="h-14"></div>'}
        <div class="px-5 py-4">
          <h2 class="text-[1.2rem] font-bold leading-[1.3]" id="saito-p-name">${esc(p.name)}</h2>
          <p class="mt-1 text-[.95rem] text-muted">${esc(p.description)}</p>
          ${
            ing.length
              ? `<fieldset class="mt-4 min-w-0"><legend class="font-bold">${esc(t.ingredients)}</legend>
            <p class="saito-sheet-hint mt-0.5 mb-2">${esc(t.ingredientsHint)}</p>
            <div class="grid grid-cols-2 gap-2">${ing.map((i) => `<label class="saito-ingredient"><input type="checkbox" name="ing" value="${esc(i)}"${line?.removed.includes(i) ? '' : ' checked'}><span>${esc(i)}</span></label>`).join('')}</div>
          </fieldset>`
              : ''
          }
        </div>
      </div>
      <div class="saito-sheet-foot">
        ${stepper(t, this.#draft.qty, data.maxQty)}
        <button type="submit" class="saito-btn saito-btn-primary flex-1">${esc(line ? t.save : t.add)} · <span data-saito-p-total>${esc(fmt(p.price * this.#draft.qty))}</span></button>
      </div>`;
    this.#dialog.showModal();
  }

  /** Stepper click: changes the draft quantity and re-renders the stepper and the button total. */
  #step(e: Event): void {
    const step = closest(e, '[data-saito-step]');
    if (!step || !this.#draft) return;
    const { data, fmt } = this.#app,
      draft = this.#draft,
      form = this.#form;
    draft.qty = clamp(draft.qty + Number(step.dataset.saitoStep), 1, data.maxQty);
    form.querySelector('[data-saito-qty]')!.outerHTML = stepper(data.text, draft.qty, data.maxQty);
    form.querySelector('[data-saito-p-total]')!.textContent = fmt(draft.p.price * draft.qty);
    // keep focus inside the stepper even when the pressed button just became disabled
    (
      form.querySelector<HTMLElement>(`[data-saito-step="${step.dataset.saitoStep}"]:not(:disabled)`) ||
      form.querySelector<HTMLElement>('[data-saito-qty] button:not(:disabled)')
    )?.focus();
  }

  /** Add / Save: writes the line to the store, closes, hands focus back to the cart when editing, and announces. */
  #submit(e: Event): void {
    e.preventDefault();
    const { data, store, fmt } = this.#app,
      t = data.text,
      draft = this.#draft;
    if (!draft) return;
    const removed = [...this.#form.querySelectorAll<HTMLInputElement>('input[name="ing"]:not(:checked)')].map((i) => i.value);
    if (draft.edit === null) store.add(draft.p.id, draft.qty, removed);
    else store.update(draft.edit, draft.qty, removed);
    this.#dialog.close();
    // the Edit button that opened the dialog was re-rendered, so <saito-cart-dialog> moves focus back by hand
    if (draft.edit !== null) this.dispatchEvent(new CustomEvent('saito:line-saved', { bubbles: true, detail: { index: draft.edit } }));
    this.#live.textContent = `${draft.edit === null ? t.added : t.updated}:${draft.qty} × ${draft.p.name}. ${itemsLabel(t, store.count())}, ${fmt(store.total())}.`;
  }
}

/**
 * <saito-cart-bar>: sticky "Ver pedido" button with item count and total, shown only while the cart has items.
 * Also pads the page bottom then, so the bar never covers the footer.
 */
class SaitoCartBar extends HTMLElement {
  set app({ data, store, fmt }: App) {
    const t = data.text;
    this.innerHTML = `<button type="button" class="saito-cart-bar" data-saito-open-cart hidden></button>`;
    const bar = this.firstElementChild as HTMLButtonElement;
    const render = () => {
      const n = store.count(),
        total = fmt(store.total());
      bar.hidden = n === 0;
      document.body.classList.toggle('pb-21', n > 0);
      bar.innerHTML = `<span class="saito-cart-bar-count" aria-hidden="true">${n}</span><span>${esc(t.viewCart)}</span><span class="ml-auto">${esc(total)}</span>`;
      bar.setAttribute('aria-label', `${t.viewCart}: ${itemsLabel(t, n)}, ${total}`);
    };
    store.addEventListener('change', render);
    render();
  }
}

/**
 * <saito-cart-dialog>: the order sheet. Lists lines (quantity stepper, Cambiar reopens the product dialog,
 * Eliminar), then the checkout form. Name and address persist as the customer profile; notes are per
 * order. Submit trims the fields, validates natively, and opens WhatsApp with the order text.
 */
class SaitoCartDialog extends HTMLElement {
  #app!: App;
  #dialog!: HTMLDialogElement;
  #form!: HTMLFormElement;
  #status!: HTMLElement;

  set app(app: App) {
    this.#app = app;
    const { data, store } = app,
      t = data.text;
    this.innerHTML = `<dialog class="saito-sheet" aria-labelledby="saito-c-title">
        <form class="saito-sheet-col">
          <div class="saito-sheet-head"><h2 class="text-[1.2rem] font-bold leading-[1.3]" id="saito-c-title">${esc(t.cartTitle)}</h2>
            <button type="button" class="saito-sheet-close bg-surface" data-saito-close aria-label="${esc(t.close)}">×</button></div>
          <div class="saito-sheet-body"><div class="px-5 py-4">
            <ul data-saito-lines></ul>
            <p class="py-7 text-center text-muted" data-saito-empty>${esc(t.empty)}</p>
            <div data-saito-checkout>
              <p class="flex justify-between pt-3.5 pb-1 text-[1.1rem] font-bold"><span>${esc(t.total)}</span><span data-saito-total></span></p>
              <label class="block mt-3"><span class="saito-sheet-label">${esc(t.name)}</span><input class="saito-sheet-input" name="customer" autocomplete="name" required></label>
              <label class="block mt-3"><span class="saito-sheet-label">${esc(t.deliveryAddress)}</span><textarea class="saito-sheet-input" name="address" rows="2" autocomplete="street-address" placeholder="${esc(t.addressHint)}" required></textarea></label>
              ${data.location?.enabled ? '<saito-location-picker class="block mt-3"></saito-location-picker>' : ''}
              <label class="block mt-3"><span class="saito-sheet-label">${esc(t.notes)}</span><input class="saito-sheet-input" name="notes" autocomplete="off"></label>
            </div>
          </div></div>
          <div class="saito-sheet-foot" data-saito-checkout>
            <!-- side by side when they fit; stacked on narrow phones with WhatsApp (the main action) on top -->
            <div class="w-full flex gap-2.5 max-[419px]:flex-col-reverse">
              <button type="button" class="saito-btn saito-btn-outline flex-auto whitespace-nowrap" data-saito-close>${esc(t.keepShopping)}</button>
              <button type="submit" class="saito-btn saito-btn-wa flex-auto whitespace-nowrap">${icon('wa')}${esc(t.submit)}</button>
            </div>
            <p class="saito-sheet-hint w-full text-center">${esc(t.submitHint)}</p>
            <p class="w-full text-center text-[.9rem] font-semibold text-wa empty:hidden" role="status"></p>
          </div>
        </form>
      </dialog>`;
    this.#dialog = this.querySelector('dialog')!;
    this.#form = this.#dialog.firstElementChild as HTMLFormElement;
    this.#status = this.#form.querySelector('[role="status"]')!;
    const picker = this.querySelector<SaitoLocationPicker>('saito-location-picker');
    if (picker) picker.app = app;
    wireDialog(this.#dialog);

    // profile (name + address) persists for returning customers; notes are per order
    this.#field('customer').value = store.profile.name || '';
    this.#field('address').value = store.profile.address || '';
    this.#form.addEventListener('input', () => store.saveProfile({ name: this.#field('customer').value, address: this.#field('address').value }));
    this.#form.addEventListener('click', (e) => this.#onLineClick(e));
    this.#form.addEventListener('submit', (e) => this.#submit(e));

    document.addEventListener('click', (e) => {
      if (closest(e, '[data-saito-open-cart]')) {
        e.preventDefault();
        this.#dialog.showModal();
      }
    });
    // after a Cambiar edit the line's buttons were re-rendered, so put focus back on that line's edit button
    document.addEventListener('saito:line-saved', (e) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      (
        this.querySelector<HTMLElement>(`[data-saito-line="${Math.min(index, store.lines.length - 1)}"] [data-saito-edit]`) ||
        this.querySelector<HTMLElement>('[data-saito-close]')
      )?.focus();
    });
    store.addEventListener('change', () => {
      this.#status.textContent = '';
      this.#render();
    });
    this.#render();
  }

  #field(name: string) {
    return this.#form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
  }

  /** Renders the lines, the empty state, the checkout visibility and the total. */
  #render(): void {
    const { data, store, fmt, byId } = this.#app,
      t = data.text,
      n = store.count();
    this.querySelector('[data-saito-lines]')!.innerHTML = store.lines
      .map((l, i) => {
        const p = byId.get(l.id)!;
        return `<li class="py-3 border-b border-line" data-saito-line="${i}">
          <div class="flex justify-between gap-3 font-semibold"><span>${esc(p.name)}${
            l.removed.length
              ? `<small class="block text-[.85rem] font-semibold text-danger">${esc(t.removedLabel)}: ${esc(l.removed.join(', '))}</small>`
              : p.ingredients?.length
                ? `<small class="block text-[.85rem] font-normal text-muted">${esc(t.allIngredients)}</small>`
                : ''
          }</span>
            <span>${esc(fmt(p.price * l.qty))}</span></div>
          <div class="flex items-center justify-between gap-2 mt-2">${stepper(t, l.qty, data.maxQty)}
            <span class="flex gap-2">
              <button type="button" class="saito-pill" data-saito-edit aria-label="${esc(t.edit)}: ${esc(p.name)}">${esc(t.edit)}</button>
              <button type="button" class="saito-pill saito-pill-danger" data-saito-remove aria-label="${esc(t.remove)}: ${esc(p.name)}">${esc(t.remove)}</button></span></div>
        </li>`;
      })
      .join('');
    this.querySelector<HTMLElement>('[data-saito-empty]')!.hidden = n > 0;
    this.querySelectorAll<HTMLElement>('[data-saito-checkout]').forEach((el) => {
      el.hidden = n === 0;
    });
    this.querySelector('[data-saito-total]')!.textContent = fmt(store.total());
  }

  /** Line controls: stepper, Cambiar (edit in the product dialog) and Eliminar, keeping focus inside the cart. */
  #onLineClick(e: Event): void {
    const li = closest(e, '[data-saito-line]');
    if (!li) return;
    const { store } = this.#app;
    const i = Number(li.dataset.saitoLine),
      step = closest(e, '[data-saito-step]');
    if (step) {
      store.setQty(i, store.lines[i]!.qty + Number(step.dataset.saitoStep));
      (
        this.querySelector<HTMLElement>(`[data-saito-line="${i}"] [data-saito-step="${step.dataset.saitoStep}"]:not(:disabled)`) ||
        this.querySelector<HTMLElement>(`[data-saito-line="${i}"] [data-saito-qty] button:not(:disabled)`)
      )?.focus();
    } else if (closest(e, '[data-saito-edit]')) {
      this.dispatchEvent(new CustomEvent(OPEN_PRODUCT, { bubbles: true, detail: { id: store.lines[i]!.id, edit: i } }));
    } else if (closest(e, '[data-saito-remove]')) {
      store.remove(i);
      (this.querySelector<HTMLElement>('[data-saito-remove]') || this.querySelector<HTMLElement>('[data-saito-close]'))?.focus();
    }
  }

  /** Checkout: trims and validates, saves the profile, and opens WhatsApp with a freshly numbered order. */
  #submit(e: Event): void {
    e.preventDefault();
    const { data, store, fmt, byId } = this.#app,
      form = this.#form;
    if (!store.lines.length) return;
    // offline, WhatsApp would open as a broken tab; the cart and the typed fields stay as they are
    if (!navigator.onLine) {
      document.dispatchEvent(new Event(OFFLINE));
      return;
    }
    ['customer', 'address', 'notes'].forEach((k) => {
      this.#field(k).value = this.#field(k).value.trim();
    });
    if (!form.reportValidity()) return;
    const pin = this.querySelector<SaitoLocationPicker>('saito-location-picker')?.value;
    const info = { name: this.#field('customer').value, address: this.#field('address').value, notes: this.#field('notes').value, location: pin ? mapsUrl(pin) : '' };
    store.saveProfile({ name: info.name, address: info.address });
    // a fresh id on every tap, even for an unchanged order, so staff never see two messages with the same id
    const message = buildMessage(store.lines, { ...info, orderId: orderId({ prefix: data.orderIdPrefix }) }, { t: data.text, fmt, byId });
    window.open(waUrl(data.phone, message), '_blank', 'noopener');
    this.#status.textContent = data.text.opened;
  }
}

/**
 * <saito-location-picker>: optional delivery pin inside the checkout form. "Compartir ubicación" opens a
 * bottom-sheet map; once confirmed, the row shows Mapa / Cambiar / Quitar and `value` returns the point.
 *
 * The map centres on device GPS, or on config.location.center when GPS is denied, unavailable or not in a
 * secure context. Leaflet and OSM tiles load lazily on the first open; if they fail, the address alone still
 * completes the order. Privacy: the pin is per order and kept in memory only, never persisted.
 */
class SaitoLocationPicker extends HTMLElement {
  #app!: App;
  #delivery: LatLng | null = null;
  #picked: LatLng | null = null;
  #map: Leaflet = null;
  #pin: Leaflet = null;
  #dialog!: HTMLDialogElement;
  #hint!: HTMLElement;
  #confirm!: HTMLButtonElement;
  #share!: HTMLElement;
  #set!: HTMLElement;

  /** The confirmed delivery point { lat, lng }, or null. */
  get value(): LatLng | null {
    return this.#delivery;
  }

  set app(app: App) {
    this.#app = app;
    const t = app.data.text;
    this.innerHTML = `
      <button type="button" class="saito-btn saito-loc-share w-full" data-saito-loc-open>${icon('pin')}${esc(t.locShare)}</button>
      <!-- row 1: pin + "Ubicación agregada"; row 2: Mapa · Cambiar · Quitar as pill buttons -->
      <div class="saito-loc-set" data-saito-loc-set hidden>${icon('pin', 'text-wa')}<b class="flex-[1_1_calc(100%_-_32px)]">${esc(t.locAdded)}</b>
        <a class="saito-pill saito-pill-wa flex-[1_1_0]" data-saito-loc-link target="_blank" rel="noopener">${esc(t.locView)}</a>
        <button type="button" class="saito-pill flex-[1_1_0]" data-saito-loc-open>${esc(t.locChange)}</button>
        <button type="button" class="saito-pill saito-pill-danger flex-[1_1_0]" data-saito-loc-clear>${esc(t.locRemove)}</button></div>
      <dialog class="saito-sheet" aria-labelledby="saito-l-title">
        <div class="saito-sheet-col">
          <div class="saito-sheet-head"><h2 class="text-[1.2rem] font-bold leading-[1.3]" id="saito-l-title">${esc(t.locTitle)}</h2>
            <button type="button" class="saito-sheet-close bg-surface" data-saito-close aria-label="${esc(t.close)}">×</button></div>
          <div class="saito-sheet-body">
            <p class="saito-sheet-hint px-5 py-4 mt-0.5 mb-2" role="status" data-saito-loc-hint></p>
            <div class="h-[min(55vh,440px)] bg-surface" data-saito-map></div>
          </div>
          <div class="saito-sheet-foot"><button type="button" class="saito-btn saito-btn-primary flex-1" data-saito-loc-confirm disabled>${esc(t.locConfirm)}</button></div>
        </div>
      </dialog>`;
    this.#dialog = this.querySelector('dialog')!;
    this.#hint = this.querySelector('[data-saito-loc-hint]')!;
    this.#confirm = this.querySelector('[data-saito-loc-confirm]')!;
    this.#share = this.querySelector(':scope > [data-saito-loc-open]')!;
    this.#set = this.querySelector('[data-saito-loc-set]')!;
    wireDialog(this.#dialog);

    this.#confirm.addEventListener('click', () => {
      if (!this.#picked) return;
      this.#delivery = this.#picked;
      this.#dialog.close();
      this.#render();
      this.#set.querySelector<HTMLElement>('[data-saito-loc-open]')!.focus();
    });
    this.addEventListener('click', (e) => {
      if (closest(e, '[data-saito-loc-open]')) void this.#open();
      else if (closest(e, '[data-saito-loc-clear]')) {
        this.#delivery = null;
        this.#render();
        this.#share.focus();
      }
    });
  }

  /** Opens the map: starts from the confirmed pin ("Cambiar") or GPS, and reports progress in the status hint. */
  async #open(): Promise<void> {
    const { text: t, location: loc } = this.#app.data;
    this.#picked = this.#delivery;
    this.#confirm.disabled = !this.#picked;
    this.#hint.textContent = t.locLocating;
    this.#dialog.showModal();
    const geo = this.#delivery ? Promise.resolve(this.#delivery) : locate();
    geo.then(
      (p) => {
        this.#setPoint(p);
        this.#map?.setView(p, loc!.zoom);
      },
      () => {},
    );
    const [g, lib] = await Promise.allSettled([geo, loadLeaflet().then((L) => this.#initMap(L))]);
    this.#hint.textContent = lib.status === 'rejected' ? t.locMapFailed : g.status === 'fulfilled' ? t.locFound : t.locDenied;
  }

  /** Records a candidate point. Only GPS or the customer sets one; the default centre is never confirmable on its own. */
  #setPoint(p: LatLng): void {
    this.#picked = { lat: +p.lat, lng: +p.lng };
    this.#pin?.setLatLng(this.#picked);
    this.#confirm.disabled = false;
  }

  /** Creates the map and draggable pin on first use (tap or drag moves the pin), or recentres it later. */
  #initMap(L: Leaflet): void {
    const loc = this.#app.data.location!,
      t = this.#app.data.text;
    const start = this.#picked || { lat: loc.center[0], lng: loc.center[1] };
    if (!this.#map) {
      this.#map = L.map(this.querySelector('[data-saito-map]')).setView(start, loc.zoom);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.#map);
      this.#pin = L.marker(start, {
        draggable: true,
        autoPan: true,
        title: t.locPin,
        alt: t.locPin,
        icon: L.divIcon({ className: 'saito-pin', iconSize: [44, 48], iconAnchor: [22, 38] }),
      }).addTo(this.#map);
      this.#pin.on('dragend', () => this.#setPoint(this.#pin.getLatLng()));
      this.#map.on('click', (e: { latlng: LatLng }) => this.#setPoint(e.latlng));
    } else if (this.#picked) {
      this.#map.setView(this.#picked, loc.zoom);
      this.#pin.setLatLng(this.#picked);
    }
    this.#map.invalidateSize(); // the map container was hidden until the dialog opened
  }

  /** Shows either the share button or the confirmed-pin row, and points "Mapa" at Google Maps. */
  #render(): void {
    const d = this.#delivery;
    this.#share.hidden = !!d;
    this.#set.hidden = !d;
    if (d) this.querySelector<HTMLAnchorElement>('[data-saito-loc-link]')!.href = mapsUrl(d);
  }
}

/* ===== boot (prototype js/app.js, storefront part) ===== */

function boot(): void {
  const source = document.getElementById('saito-cart-data');
  if (!source) return;
  const { config, text, products } = JSON.parse(source.textContent || '{}') as { config: CartConfig; text: Text; products: Product[] };
  const fmt = money(config.locale, config.currency);
  const byId = new Map(products.map((p) => [p.id, p]));
  const store = new CartStore({ storageKey: `saito:${config.siteId}`, maxQty: config.maxQty, catalog: byId });
  const app: App = { data: { ...config, text, products }, store, fmt, byId };
  document.querySelectorAll<HTMLElement & { app: App }>('saito-product-dialog, saito-cart-bar, saito-cart-dialog').forEach((el) => {
    el.app = app;
  });
  // the menu is server-rendered, so its "Ordenar ahora" buttons are wired here (the prototype's <menu-catalog> click handler)
  document.addEventListener('click', (e) => {
    const btn = closest(e, '[data-saito-add]');
    if (btn) btn.dispatchEvent(new CustomEvent(OPEN_PRODUCT, { bubbles: true, detail: { id: btn.dataset.saitoAdd, edit: null } }));
  });
}

const define = (name: string, element: CustomElementConstructor) => {
  if (!customElements.get(name)) customElements.define(name, element);
};
define('saito-product-dialog', SaitoProductDialog);
define('saito-cart-bar', SaitoCartBar);
define('saito-cart-dialog', SaitoCartDialog);
define('saito-location-picker', SaitoLocationPicker);
boot();

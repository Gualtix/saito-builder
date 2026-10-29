/*
 * Installable-app chrome, ported from the prototype (live-sketching/eatery-cafe/tangerine/tangerine-web-site/js/components/pwa.js
 * and the service-worker line of js/app.js): <saito-app-install> (the install button and the iOS "Add to Home Screen" sheet)
 * and <saito-offline-notice> (full-screen message while the device is offline). Only names (sf- → saito-), classes and the
 * copy source (strings.ts) changed. Loaded only for sites with brand.pwa.
 *
 * SiteLayout mounts <saito-offline-notice> and a <script type="application/json" id="saito-pwa-data"> with PwaData;
 * Header.astro renders <saito-app-install hidden> in the desktop nav and in the mobile menu. This module registers the
 * site's service worker, which only swaps in offline.html for page loads that fail; nothing is cached for offline use.
 *
 * Install flow, mobile and tablets only, never once the site runs installed:
 *   Android / Chromium: the button appears only after 'beforeinstallprompt' and opens the native prompt.
 *   iOS / iPadOS: no install API, so the button opens a two-step "Share, then Add to Home Screen" sheet.
 *     iOS also never reports an install, so closing the sheet snoozes the button for later visits.
 * Storage: localStorage `saito:<site-id>:install-hint` (when the iOS sheet was last closed).
 */
import type { strings } from '../strings.ts';

type Text = ReturnType<typeof strings>;

export interface PwaData {
  siteId: string;
  serviceWorker: string;
  /** pwaIosIntro and pwaOfflineBody arrive with {name} filled in; {share} in pwaIosShare is filled here. */
  text: Pick<
    Text,
    'pwaInstall' | 'pwaIosTitle' | 'pwaIosIntro' | 'pwaIosShare' | 'pwaIosAdd' | 'close' | 'pwaOfflineTitle' | 'pwaOfflineBody' | 'pwaOfflineAuto' | 'pwaRetry'
  >;
}

/** Order components dispatch this on document when they need the network and the device is offline. */
const OFFLINE = 'saito:offline';
const SNOOZE_MS = 30 * 864e5; // 30 days

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v: unknown): string => String(v).replace(/[&<>"']/g, (c) => ESC[c]!);

/**
 * Which install path fits this browser: 'ios' (instructions sheet), 'prompt' (Chromium install prompt,
 * shown only if the browser offers it) or '' (no button: desktop, installed, or an in-app webview).
 * @param env { ua, uaData (navigator.userAgentData), touchPoints (navigator.maxTouchPoints), standalone }
 */
export function installMode({
  ua = '',
  uaData,
  touchPoints = 0,
  standalone = false,
}: {
  ua?: string;
  uaData?: { platform?: string; mobile?: boolean };
  touchPoints?: number;
  standalone?: boolean;
}): '' | 'ios' | 'prompt' {
  if (standalone || /FBAN|FBAV|FB_IAB|Instagram|Line\/|musical_ly|; wv\)/.test(ua)) return '';
  // iPadOS Safari reports a Mac; only the touch points tell them apart
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return 'ios';
  // userAgentData.mobile is false on Android tablets, hence the platform check; it is blank when the UA
  // is overridden (DevTools device emulation), so fall back to the UA string then
  const mobile = uaData?.platform ? uaData.mobile || uaData.platform === 'Android' : /Android|iPhone|iPod/.test(ua);
  return mobile ? 'prompt' : '';
}

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

// iOS Share glyph (square with an up arrow), drawn inline so the sheet matches what Safari shows
const SHARE =
  '<svg class="inline size-5 -mt-1 mx-0.5 align-middle text-[#007aff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M8 11H6v10h12V11h-2"/></svg>';

const source = document.getElementById('saito-pwa-data');
const data = source ? (JSON.parse(source.textContent || '{}') as PwaData) : null;
const hintKey = data ? `saito:${data.siteId}:install-hint` : '';

const snoozedAt = (): number => {
  try {
    return Number(localStorage.getItem(hintKey)) || 0;
  } catch {
    return 0;
  }
};

/** The iOS sheet, shared by both install buttons (desktop nav and mobile menu); appended to <body> so a closed menu never hides it. */
let sheet: HTMLDialogElement | undefined;
function iosSheet(t: PwaData['text']): HTMLDialogElement {
  if (sheet) return sheet;
  sheet = document.createElement('dialog');
  sheet.className = 'saito-sheet';
  sheet.setAttribute('aria-labelledby', 'saito-i-title');
  const step =
    'flex gap-3 py-2.5 before:grid before:flex-none before:size-7 before:place-items-center before:rounded-full before:bg-primary before:text-primary-contrast before:text-[.9rem] before:font-bold before:content-[counter(step)] [counter-increment:step]';
  sheet.innerHTML = `<div class="saito-sheet-col">
      <div class="saito-sheet-head"><h2 class="text-[1.2rem] font-bold leading-[1.3]" id="saito-i-title">${esc(t.pwaIosTitle)}</h2>
        <button type="button" class="saito-sheet-close bg-surface" data-saito-close aria-label="${esc(t.close)}">×</button></div>
      <div class="saito-sheet-body px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <p class="saito-sheet-hint mb-1">${esc(t.pwaIosIntro)}</p>
        <ol class="[counter-reset:step]">
          <li class="${step}"><span>${esc(t.pwaIosShare).replace('{share}', SHARE)}</span></li>
          <li class="${step}"><span>${esc(t.pwaIosAdd)}</span></li>
        </ol>
      </div>
    </div>`;
  document.body.append(sheet);
  const dialog = sheet;
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || (e.target as Element).closest('[data-saito-close]')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    try {
      localStorage.setItem(hintKey, String(Date.now()));
    } catch {
      /* private mode or quota: the button just shows again next visit */
    }
  });
  // Esc closes only the sheet: <saito-header> would also close the mobile menu and strand focus
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') e.stopPropagation();
  });
  return dialog;
}

/**
 * <saito-app-install hidden>: renders a button and unhides itself only when installMode() and the browser allow it.
 */
class SaitoAppInstall extends HTMLElement {
  connectedCallback(): void {
    if (!data || this.firstElementChild) return;
    const t = data.text;
    const mode = installMode({
      ua: navigator.userAgent,
      uaData: (navigator as { userAgentData?: { platform?: string; mobile?: boolean } }).userAgentData,
      touchPoints: navigator.maxTouchPoints,
      standalone: standalone(),
    });
    this.innerHTML = `<button type="button" class="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-current px-4 py-2 text-sm font-medium transition-colors hover:bg-current/10">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/></svg>${esc(t.pwaInstall)}</button>`;
    const btn = this.querySelector('button')!;
    const hide = () => {
      this.hidden = true;
    };
    addEventListener('appinstalled', hide);

    if (mode === 'prompt') {
      let deferred: (Event & { prompt(): void; userChoice: Promise<unknown> }) | null = null;
      addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferred = e as typeof deferred;
        this.hidden = false;
      });
      btn.addEventListener('click', async () => {
        if (!deferred) return;
        deferred.prompt();
        await deferred.userChoice;
        // a prompt event works once; if the user said no, the browser may offer a fresh one later
        deferred = null;
        hide();
      });
    } else if (mode === 'ios') {
      btn.addEventListener('click', () => iosSheet(t).showModal());
      this.hidden = Date.now() - snoozedAt() < SNOOZE_MS;
    }
  }
}

/**
 * <saito-offline-notice>: full-screen modal shown while the device is offline (on load, on the 'offline'
 * event, and when an order needs the network). It closes itself when the connection returns; Retry
 * reloads, which the service worker answers with offline.html while still offline. Esc also closes it,
 * so nobody is trapped; it comes back on the next offline event or order attempt.
 */
class SaitoOfflineNotice extends HTMLElement {
  connectedCallback(): void {
    if (!data || this.firstElementChild) return;
    const t = data.text;
    this.innerHTML = `<dialog class="m-0 size-full max-h-none max-w-none bg-background p-6 text-ink open:grid open:place-items-center backdrop:bg-background" role="alertdialog" aria-labelledby="saito-o-title" aria-describedby="saito-o-body">
        <div class="max-w-[24rem] text-center">
          <div class="mx-auto mb-6 grid size-24 place-items-center rounded-[26px] bg-primary text-primary-contrast">
            <svg class="size-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r=".8" fill="currentColor"/><path d="M3 3l18 18"/></svg>
          </div>
          <h2 class="text-[1.6rem] leading-[1.2] font-extrabold" id="saito-o-title">${esc(t.pwaOfflineTitle)}</h2>
          <p class="mt-3 text-muted" id="saito-o-body">${esc(t.pwaOfflineBody)}</p>
          <button type="button" class="saito-btn saito-btn-primary mt-7 w-full max-w-[16rem]" autofocus>${esc(t.pwaRetry)}</button>
          <p class="saito-sheet-hint mt-4">${esc(t.pwaOfflineAuto)}</p>
        </div>
      </dialog>`;
    const dialog = this.querySelector('dialog')!;
    const show = () => {
      if (!dialog.open) dialog.showModal();
    };
    dialog.querySelector('button')!.addEventListener('click', () => (navigator.onLine ? dialog.close() : location.reload()));
    addEventListener('offline', show);
    addEventListener('online', () => dialog.close());
    document.addEventListener(OFFLINE, show);
    if (!navigator.onLine) show();
  }
}

const define = (name: string, element: CustomElementConstructor) => {
  if (!customElements.get(name)) customElements.define(name, element);
};
define('saito-app-install', SaitoAppInstall);
define('saito-offline-notice', SaitoOfflineNotice);
// root-relative (brand.pwa.serviceWorker), so its scope is the folder holding it: the whole site for /sw.js
if (data && 'serviceWorker' in navigator)
  navigator.serviceWorker.register(data.serviceWorker).catch((err) => console.warn('[pwa] service worker not registered', err));

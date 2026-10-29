/**
 * <saito-marquee><ul>…items…</ul></saito-marquee>
 *
 * Seamless horizontal loop: repeats the track's items (enough to cover the visible width, then doubled)
 * so the CSS animation in global.css can slide by exactly half. Copies are aria-hidden so screen readers
 * hear each item once. Sets [data-ready] to start the animation; without JavaScript, or under
 * prefers-reduced-motion, it does nothing and the row stays static (and scrollable).
 */
export class SaitoMarquee extends HTMLElement {
  connectedCallback(): void {
    const track = this.firstElementChild;
    if (!track || this.hasAttribute('data-ready')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const originals = [...track.children];
    // Sets of items needed to cover the visible width; the track then holds twice that many.
    const sets = Math.min(10, Math.max(1, Math.ceil(this.clientWidth / Math.max(track.scrollWidth, 1))));
    for (let i = 1; i < sets * 2; i++) {
      for (const item of originals) {
        const copy = item.cloneNode(true) as Element;
        copy.setAttribute('aria-hidden', 'true');
        track.append(copy);
      }
    }
    this.setAttribute('data-ready', '');
  }
}

if (!customElements.get('saito-marquee')) customElements.define('saito-marquee', SaitoMarquee);

/**
 * <header data-solid><saito-header>…links… <details>mobile menu</details></saito-header></header>
 *
 * Transparent header over a photo hero. The header is rendered solid ([data-solid]), so without JavaScript it
 * stays readable; this element clears [data-solid] while the page is within 60px of the top and the mobile
 * menu is closed. Choosing a menu link or pressing Escape closes the menu. Framework-independent.
 */
export class SaitoHeader extends HTMLElement {
  connectedCallback(): void {
    const bar = this.closest('header');
    if (!bar || this.hasAttribute('data-ready')) return;
    this.setAttribute('data-ready', '');
    const menu = this.querySelector('details');
    const sync = () => bar.toggleAttribute('data-solid', scrollY > 60 || Boolean(menu?.open));
    addEventListener('scroll', sync, { passive: true });
    if (menu) {
      menu.addEventListener('toggle', sync);
      menu.addEventListener('click', (event) => {
        if ((event.target as Element).closest('a')) menu.open = false;
      });
      addEventListener('keydown', (event) => {
        if (event.key === 'Escape') menu.open = false;
      });
    }
    sync();
  }
}

if (!customElements.get('saito-header')) customElements.define('saito-header', SaitoHeader);

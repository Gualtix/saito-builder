/**
 * <saito-contact-form success-message="…"><form action="…">…</form></saito-contact-form>
 *
 * Progressive enhancement: without JavaScript the inner form posts normally (the API redirects back).
 * With JavaScript, submissions go over fetch and status is announced inline.
 * Framework-independent, so it can be reused outside Astro.
 */
export class SaitoContactForm extends HTMLElement {
  connectedCallback(): void {
    const form = this.querySelector('form');
    if (!form || form.dataset.enhanced) return;
    form.dataset.enhanced = 'true';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.submit(form);
    });
  }

  private async submit(form: HTMLFormElement): Promise<void> {
    const status = form.querySelector<HTMLElement>('[data-status]');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const setStatus = (text: string) => {
      if (status) status.textContent = text;
    };

    if (button) button.disabled = true;
    setStatus('Sending…');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      setStatus(this.getAttribute('success-message') ?? 'Thanks! Your message has been sent.');
      this.dispatchEvent(new CustomEvent('saito:submitted', { bubbles: true }));
    } catch {
      setStatus('Sorry, something went wrong. Please try again later.');
    } finally {
      if (button) button.disabled = false;
    }
  }
}

if (!customElements.get('saito-contact-form')) customElements.define('saito-contact-form', SaitoContactForm);

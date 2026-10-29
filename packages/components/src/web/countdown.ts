/**
 * <saito-countdown target="2030-01-01T09:00:00Z" expired-text="We're live!" days-label="Days" hours-label="Hours"
 *   minutes-label="Minutes" seconds-label="Seconds">fallback</saito-countdown>
 * Framework-independent live countdown (unit labels default to English); the server-rendered fallback stays until it upgrades.
 */
export class SaitoCountdown extends HTMLElement {
  private timer: number | undefined;

  connectedCallback(): void {
    const target = Date.parse(this.getAttribute('target') ?? '');
    if (Number.isNaN(target)) return;
    this.setAttribute('role', 'timer');
    this.render(target);
    this.timer = window.setInterval(() => this.render(target), 1000);
  }

  disconnectedCallback(): void {
    window.clearInterval(this.timer);
  }

  private render(target: number): void {
    const remaining = target - Date.now();
    if (remaining <= 0) {
      window.clearInterval(this.timer);
      this.textContent = this.getAttribute('expired-text') ?? '';
      return;
    }
    const units: Array<[string, number]> = [
      [this.getAttribute('days-label') ?? 'Days', Math.floor(remaining / 86_400_000)],
      [this.getAttribute('hours-label') ?? 'Hours', Math.floor(remaining / 3_600_000) % 24],
      [this.getAttribute('minutes-label') ?? 'Minutes', Math.floor(remaining / 60_000) % 60],
      [this.getAttribute('seconds-label') ?? 'Seconds', Math.floor(remaining / 1000) % 60],
    ];
    const grid = document.createElement('div');
    grid.className = 'mx-auto grid max-w-lg grid-cols-4 gap-4';
    for (const [label, value] of units) {
      const cell = document.createElement('div');
      cell.className = 'saito-card !p-4';
      const number = document.createElement('div');
      number.className = 'font-heading text-3xl font-extrabold tabular-nums sm:text-5xl';
      number.textContent = String(value).padStart(2, '0');
      const caption = document.createElement('div');
      caption.className = 'text-xs uppercase tracking-wider text-muted';
      caption.textContent = label;
      cell.append(number, caption);
      grid.append(cell);
    }
    this.replaceChildren(grid);
  }
}

if (!customElements.get('saito-countdown')) customElements.define('saito-countdown', SaitoCountdown);

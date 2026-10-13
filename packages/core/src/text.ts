const escapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => escapes[c]!);
}

/** Allows http(s), mailto, tel, root-relative and anchor links; everything else becomes "#". */
export function safeHref(href: string): string {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  return '#';
}

/**
 * Minimal, safe rich-text renderer for editor copy: blank-line separated paragraphs,
 * **bold**, *italic* and [label](url). Input is escaped first, so raw HTML never passes through.
 */
export function renderRichText(source: string): string {
  return source
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const html = escapeHtml(paragraph.trim())
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
          const url = safeHref(href.replace(/&amp;/g, '&'));
          const external = /^https?:/i.test(url);
          return `<a href="${escapeHtml(url)}"${external ? ' rel="noopener noreferrer"' : ''}>${label}</a>`;
        })
        .replace(/\n/g, '<br>');
      return `<p>${html}</p>`;
    })
    .join('\n');
}

/** JSON safe to embed inside a <script> element (cannot terminate the tag). */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function formatPrice(amount: number, currency: string, locale = 'en'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

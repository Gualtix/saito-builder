import type { Theme } from './schema/theme.ts';

const radius: Record<Theme['radius'], string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.875rem',
  '3xl': '2.5rem',
  full: '9999px',
};

const fallbackStack = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Emits the CSS custom properties that Tailwind's theme tokens point at.
 * All values come from a validated Theme (hex colors, alphanumeric font names), so they are CSS-safe.
 */
export function themeToCss(theme: Theme): string {
  const vars: Record<string, string> = {
    '--saito-color-primary': theme.colors.primary,
    '--saito-color-primary-contrast': theme.colors.primaryContrast,
    '--saito-color-secondary': theme.colors.secondary,
    '--saito-color-accent': theme.colors.accent,
    '--saito-color-background': theme.colors.background,
    '--saito-color-surface': theme.colors.surface,
    '--saito-color-text': theme.colors.text,
    '--saito-color-muted': theme.colors.muted,
    '--saito-color-border': theme.colors.border,
    '--saito-font-heading': `"${theme.fonts.heading}", ${fallbackStack}`,
    '--saito-font-body': `"${theme.fonts.body}", ${fallbackStack}`,
    '--saito-radius': radius[theme.radius],
  };
  // Emitted only when set, so sites without them keep byte-identical CSS.
  const optional: Record<string, string | undefined> = {
    '--saito-color-accent-2': theme.colors.accent2,
    '--saito-color-accent-3': theme.colors.accent3,
    '--saito-color-scrim': theme.colors.scrim,
    '--saito-radius-button': theme.radii?.button && radius[theme.radii.button],
    '--saito-radius-card': theme.radii?.card && radius[theme.radii.card],
    '--saito-radius-image': theme.radii?.image && radius[theme.radii.image],
    '--saito-radius-panel': theme.radii?.panel && radius[theme.radii.panel],
  };
  const body = [...Object.entries(vars), ...Object.entries(optional).filter(([, v]) => v)]
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');
  return `:root { color-scheme: ${theme.mode}; ${body} }`;
}

export function googleFontsHref(theme: Theme): string | undefined {
  if (!theme.fonts.googleFonts) return undefined;
  const families = [...new Set([theme.fonts.heading, theme.fonts.body])]
    .map((f) => `family=${f.trim().replace(/ +/g, '+')}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

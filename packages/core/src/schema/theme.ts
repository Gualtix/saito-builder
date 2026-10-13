import { z } from 'zod';

const color = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex color like #1e3a5f');
// Restricted so theme values can be written into CSS safely.
const fontFamily = z.string().regex(/^[A-Za-z0-9 ]+$/, 'font names may only contain letters, digits and spaces');

export const themeSchema = z.object({
  mode: z.enum(['light', 'dark']).default('light'),
  colors: z.object({
    primary: color,
    primaryContrast: color,
    secondary: color,
    accent: color,
    background: color,
    surface: color,
    text: color,
    muted: color,
    border: color,
  }),
  fonts: z.object({
    heading: fontFamily,
    body: fontFamily,
    /** Load fonts from Google Fonts. Disable for system fonts or self-hosted fonts. */
    googleFonts: z.boolean().default(true),
  }),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
});

export type Theme = z.infer<typeof themeSchema>;

import { z } from 'zod';

const color = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex color like #1e3a5f');
// Hex with alpha (#rrggbbaa), used for photo overlays.
const colorWithAlpha = z.string().regex(/^#[0-9a-fA-F]{8}$/, 'must be a hex color with alpha like #140f0a9e');
const radiusScale = z.enum(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']);
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
    accent2: color.optional(),
    accent3: color.optional(),
    scrim: colorWithAlpha.optional(),
  }),
  fonts: z.object({
    heading: fontFamily,
    body: fontFamily,
    /** Load fonts from Google Fonts. Disable for system fonts or self-hosted fonts. */
    googleFonts: z.boolean().default(true),
  }),
  radius: radiusScale.default('md'),
  /** Per-role corner radius; a role left unset uses `radius`. */
  radii: z
    .object({
      button: radiusScale.optional(),
      card: radiusScale.optional(),
      image: radiusScale.optional(),
      panel: radiusScale.optional(),
    })
    .optional(),
  // --- site-chrome ---
  /** `bar`: a short accent-coloured bar under section headings (SectionHeader and richText). Unset means `none`. */
  // Optional rather than .default('none') so theme presets typed as the output `Theme` stay valid.
  headingDecoration: z.enum(['none', 'bar']).optional(),
  /** `mark-name`: the header and footer show the logo beside the business name (needs `brand.logo`). Unset means `mark`. */
  logoLockup: z.enum(['mark', 'mark-name']).optional(),
  /** `reveal`: blocks fade in and rise as they scroll into view (skipped under reduced motion). */
  motion: z.object({ reveal: z.boolean().default(false) }).optional(),
  // --- end site-chrome ---
});

export type Theme = z.infer<typeof themeSchema>;

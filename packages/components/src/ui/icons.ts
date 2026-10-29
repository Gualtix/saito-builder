/**
 * Shared inline-SVG icon set, by name. Each entry is the inner markup of a 24×24 line icon drawn with
 * `stroke="currentColor"`, so it takes the surrounding text colour. Render it with `iconSvgAttrs`:
 *
 *   <svg {...iconSvgAttrs} class="size-6" set:html={icons[name]} />
 *
 * The markup is static and trusted (never built from content), which is why `set:html` is safe here.
 * Social names match `footer.social[].platform` in the site schema.
 */
export const iconNames = [
  // Feature icons
  'pot',
  'heart',
  'home',
  'family',
  'leaf',
  // Contact
  'mail',
  'whatsapp',
  // Social platforms
  'x',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'github',
  'tiktok',
] as const;

export type IconName = (typeof iconNames)[number];

export const icons: Record<IconName, string> = {
  pot: '<path d="M5 12h14M7 12a5 5 0 0 1 10 0M4 12v2a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-2"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  family: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 14c3 0 6 1.5 6 5"/>',
  leaf: '<path d="M5 19c1-9 6-13 15-14-1 9-5 14-14 14z"/><path d="M5 19c3-4 6-7 10-9"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
  x: '<path d="M4 4h4.5L20 20h-4.5zM20 4l-6.6 7.2M4 20l6.6-7.2"/>',
  facebook: '<path d="M14 8h2V4h-3a4 4 0 0 0-4 4v3H7v4h2v6h4v-6h3l1-4h-4V8z"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r=".6"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-7M12 13a3 3 0 0 1 6 0v4"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
  github:
    '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5.1 5.1 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.8 2.5 4.6 5 4.8"/>',
};

/** Attributes every icon `<svg>` needs; decorative by default (pair it with visible text or an aria-label on the link). */
export const iconSvgAttrs = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.8',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
} as const;

export function isIconName(name: string | undefined): name is IconName {
  return name !== undefined && Object.hasOwn(icons, name);
}

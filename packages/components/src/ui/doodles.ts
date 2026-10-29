import type { SectionOf } from '@saito/core';

export type DoodleName = NonNullable<SectionOf<'richText'>['doodle']>;

/**
 * Hand-drawn line doodles for `richText.doodle`, by name: the inner markup of a 100×100 drawing stroked
 * with `currentColor`. Render with `doodleSvgAttrs`. Static, trusted markup (never built from content),
 * so `set:html` is safe. Add a name here and to the `doodle` enum in packages/core/src/schema/sections.ts.
 */
export const doodles: Record<DoodleName, string> = {
  leaf: '<path d="M20 70c10-40 40-55 70-50-5 35-35 60-70 50zM20 70C35 55 55 40 80 28"/>',
  citrus: '<path d="M50 40c-14 0-22 12-22 26s8 26 22 26 22-12 22-26-8-26-22-26zM50 40c-4-10-2-18 8-24M50 40c-8-6-18-6-24 2M50 40c6-6 16-6 22 0M36 58l28 20M64 58L36 78"/>',
  // Pea pod, drawn in the same hand as the two above (the prototype names it but does not include it).
  pod: '<path d="M12 66c16-28 48-44 78-38-8 24-42 46-78 38zM12 66c26-6 52-20 78-38M90 28c2-6 6-9 10-10"/><circle cx="36" cy="54" r="6"/><circle cx="52" cy="46" r="6"/><circle cx="68" cy="38" r="6"/>',
};

export const doodleSvgAttrs = {
  viewBox: '0 0 100 100',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.6',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
} as const;

import type { Theme } from '@saito/core';

/** Base themes templates start from. Sites override any token in their `theme:` block. */
export const themes = {
  ocean: {
    mode: 'light',
    colors: {
      primary: '#1d4ed8',
      primaryContrast: '#ffffff',
      secondary: '#0f172a',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f1f5f9',
      text: '#0f172a',
      muted: '#475569',
      border: '#e2e8f0',
    },
    fonts: { heading: 'Inter', body: 'Inter', googleFonts: true },
    radius: 'md',
  },
  slate: {
    mode: 'light',
    colors: {
      primary: '#0f766e',
      primaryContrast: '#ffffff',
      secondary: '#1e293b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#111827',
      muted: '#4b5563',
      border: '#e5e7eb',
    },
    fonts: { heading: 'Manrope', body: 'Source Sans 3', googleFonts: true },
    radius: 'sm',
  },
  bistro: {
    mode: 'light',
    colors: {
      primary: '#9a3412',
      primaryContrast: '#fff7ed',
      secondary: '#292524',
      accent: '#ca8a04',
      background: '#fffbf5',
      surface: '#f5ede1',
      text: '#1c1917',
      muted: '#57534e',
      border: '#e7dccb',
    },
    fonts: { heading: 'Playfair Display', body: 'Lato', googleFonts: true },
    radius: 'lg',
  },
  midnight: {
    mode: 'dark',
    colors: {
      primary: '#a78bfa',
      primaryContrast: '#0b0b14',
      secondary: '#e2e8f0',
      accent: '#f472b6',
      background: '#0b0b14',
      surface: '#161625',
      text: '#f1f5f9',
      muted: '#a1a1b5',
      border: '#2a2a40',
    },
    fonts: { heading: 'Space Grotesk', body: 'Inter', googleFonts: true },
    radius: 'lg',
  },
  // Cream canvas, apricot fills, espresso ink; rounded display type. Dark text on primary (9.8:1).
  apricot: {
    mode: 'light',
    colors: {
      primary: '#f6b46a',
      primaryContrast: '#241510',
      secondary: '#241510',
      accent: '#f29e45',
      background: '#fcebdd',
      surface: '#f5d9c4',
      text: '#3b2a22',
      muted: '#6b5144',
      border: '#8a6d5e',
    },
    fonts: { heading: 'Fredoka', body: 'Nunito', googleFonts: true },
    radius: 'lg',
  },
  // Near-white canvas, tangerine fills, sage accent, ink bands; handwritten script headings.
  // Ink on primary 7.6:1, muted on background 7.1:1.
  citrus: {
    mode: 'light',
    colors: {
      primary: '#e99b3f',
      primaryContrast: '#1c1a17',
      secondary: '#1c1a17',
      accent: '#99bd76',
      background: '#fefefe',
      surface: '#f1f1f1',
      text: '#1c1a17',
      muted: '#5d574f',
      border: '#e6e1d9',
    },
    fonts: { heading: 'Dancing Script', body: 'Figtree', googleFonts: true },
    radius: 'lg',
  },
} satisfies Record<string, Theme>;

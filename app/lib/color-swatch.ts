import {stegaClean} from '@sanity/client/stega';

/**
 * Resolves a Shopify "Color" option value (e.g. "Off White", "Washed Indigo",
 * "Black / White") into a CSS background suitable for a circular swatch.
 *
 * Color names in fashion catalogues rarely map 1:1 to CSS named colors, so we
 * keep a curated dictionary of common values and fall back to token matching
 * (e.g. "washed indigo" -> "indigo"). When a value can't be resolved we return
 * `null` so the caller can fall back to a plain text label.
 */

export type Swatch = {
  /** CSS background value — a hex color or a gradient for multi-color names. */
  background: string;
  /** Light colors need a subtle border so the circle stays visible on white. */
  isLight: boolean;
};

// Multi-word / brand-specific names take priority over token matching.
const NAMED_COLORS: Record<string, string> = {
  // Whites / naturals
  white: '#ffffff',
  'off white': '#f3efe6',
  'offwhite': '#f3efe6',
  antique: '#f0ebe0',
  bone: '#e5ded0',
  ecru: '#e8e0cf',
  ivory: '#fffff0',
  cream: '#f5f0e1',
  natural: '#e9e2d0',
  oatmeal: '#ded5c4',
  vanilla: '#f3e9d2',
  chalk: '#f0efe9',
  // Blacks
  black: '#111111',
  'washed black': '#2c2c2c',
  'vintage black': '#2b2b2b',
  'faded black': '#3a3a3a',
  'jet black': '#0a0a0a',
  onyx: '#1b1b1b',
  // Greys
  grey: '#8a8a8a',
  gray: '#8a8a8a',
  'heather grey': '#b6b6b6',
  'heather gray': '#b6b6b6',
  charcoal: '#3c3c3c',
  slate: '#5b6770',
  silver: '#c7c7c7',
  smoke: '#9a9a9a',
  ash: '#a7a29b',
  cement: '#a19f98',
  // Browns / tans / neutrals
  tan: '#c9a878',
  camel: '#c19a6b',
  brown: '#6b4a2b',
  chocolate: '#4a2f1b',
  mocha: '#6f5442',
  espresso: '#3b2a20',
  coffee: '#4b3621',
  taupe: '#8b7d6b',
  sand: '#d8c3a5',
  beige: '#d9c7a8',
  khaki: '#b3a476',
  clay: '#b66a4f',
  rust: '#9c4a2b',
  copper: '#a5613b',
  bronze: '#8a6a3a',
  caramel: '#a9702e',
  // Reds
  red: '#c0362c',
  burgundy: '#5e1f2a',
  maroon: '#5a1a1a',
  wine: '#5b2333',
  crimson: '#a01e2b',
  brick: '#9a3b2e',
  cherry: '#8f1d2a',
  // Pinks
  pink: '#e79ab0',
  blush: '#e7bfc0',
  rose: '#c96a7a',
  fuchsia: '#c2286e',
  mauve: '#b784a7',
  // Oranges / yellows
  orange: '#d9772f',
  peach: '#f0b088',
  apricot: '#e8a06a',
  yellow: '#e8c34a',
  mustard: '#c99a2e',
  gold: '#c9a227',
  // Greens
  green: '#3f7a4d',
  olive: '#6b6a3a',
  army: '#575c37',
  forest: '#274428',
  emerald: '#1f7a5a',
  sage: '#9caa8a',
  mint: '#b9dfc9',
  moss: '#5a6338',
  hunter: '#2c4a35',
  // Blues
  blue: '#2f5aa8',
  navy: '#1e2a4a',
  indigo: '#33487a',
  denim: '#4a6a94',
  royal: '#22409a',
  cobalt: '#1f4fbf',
  sky: '#8fc0e8',
  'baby blue': '#b7d6ea',
  teal: '#2b7a78',
  turquoise: '#33b0a6',
  // Purples
  purple: '#6a3d8f',
  lavender: '#c7b8e0',
  violet: '#7a5299',
  plum: '#5e3a5c',
};

// Base color tokens used when a value contains a known color word among
// modifiers (e.g. "vintage washed indigo" -> "indigo").
const TOKEN_KEYS = Object.keys(NAMED_COLORS).filter((k) => !k.includes(' '));

function normalize(name: string): string {
  return stegaClean(name).toLowerCase().trim().replace(/\s+/g, ' ');
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Resolve a single (non-composite) name to a hex color, or null. */
function resolveHex(name: string): null | string {
  if (NAMED_COLORS[name]) return NAMED_COLORS[name];

  // Scan tokens right-to-left: the base color noun is usually last
  // ("washed indigo", "heather grey" handled above as full names).
  const tokens = name.split(/[^a-z]+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (TOKEN_KEYS.includes(tokens[i])) return NAMED_COLORS[tokens[i]];
  }
  return null;
}

export function resolveSwatch(value?: null | string): null | Swatch {
  if (!value) return null;
  const name = normalize(value);
  if (!name) return null;

  // Multi-color names like "Black / White" or "Red-Blue".
  const parts = name.split(/\s*[/&+]\s*/).filter(Boolean);
  if (parts.length > 1) {
    const hexes = parts.map(resolveHex).filter(Boolean) as string[];
    if (hexes.length >= 2) {
      const stops = hexes
        .map((hex, i) => {
          const from = Math.round((i / hexes.length) * 100);
          const to = Math.round(((i + 1) / hexes.length) * 100);
          return `${hex} ${from}% ${to}%`;
        })
        .join(', ');
      return {
        background: `linear-gradient(135deg, ${stops})`,
        isLight: hexes.every((h) => luminance(h) > 0.8),
      };
    }
  }

  const hex = resolveHex(name);
  if (!hex) return null;
  return {background: hex, isLight: luminance(hex) > 0.8};
}

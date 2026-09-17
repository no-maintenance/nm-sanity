import {stegaClean} from '@sanity/client/stega';

/**
 * Product titles mostly follow the "NAME - COLOR" convention
 * (e.g. "Double Rivet Jacket - Raw Indigo"), so we can show the name and color
 * on separate lines. But not every title does: some have no separator
 * ("GT Scarf"), and some have a trailing size or note ("... - XXS",
 * "... - 1/1 sample"). For those we DON'T guess a color — `color` comes back
 * empty and callers fall back to showing the full title unchanged, so nothing
 * ever renders a size/junk value as a "color" or duplicates the title.
 */

// Size tokens that can appear as a trailing "- SIZE" segment. Never a color.
const SIZE_TOKENS = new Set([
  'xxxs', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl',
  'x-small', 'xx-small', 'small', 'medium', 'large', 'x-large', 'xx-large',
  'one size', 'onesize', 'os', 'o/s',
]);

// Trailing segments that are notes, not colors (samples, one-of-ones, collabs).
const NON_COLOR_RE = /\bsample\b|^\d+\s*\/\s*\d+$|^\d+\s+of\s+\d+$|^nm\s*x\b/i;

export function splitTitleNameColor(title?: null | string): {
  color: string;
  name: string;
} {
  const raw = stegaClean(title || '').trim();

  // Match the LAST " - " (or " -" with no trailing space). Requires whitespace
  // before the dash so hyphenated words ("Sun-Faded", "X-Small", "Light-Wash")
  // are never split.
  const m = raw.match(/^(.*\S)\s-\s*(\S.*)$/);
  if (!m) return {color: '', name: raw};

  const name = m[1].trim();
  const suffix = m[2].trim();

  if (SIZE_TOKENS.has(suffix.toLowerCase()) || NON_COLOR_RE.test(suffix)) {
    return {color: '', name: raw};
  }

  return {color: suffix, name};
}

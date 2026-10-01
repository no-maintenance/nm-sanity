/**
 * Size label helpers.
 *
 * Shopify returns long-form size option values ("X-Small", "Medium",
 * "XX-Large"). We display the short codes ("XS", "M", "XXL") everywhere in the
 * storefront — the product card, the product page selector, and the collection
 * size filter — while the underlying Shopify values stay untouched, so carts,
 * URLs, and orders keep the real variant names.
 */

// Long-form Shopify labels -> canonical short codes.
export const SIZE_ALIASES: Record<string, string> = {
  'XX-SMALL': 'XXS',
  XXSMALL: 'XXS',
  'X-SMALL': 'XS',
  XSMALL: 'XS',
  'EXTRA SMALL': 'XS',
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L',
  'X-LARGE': 'XL',
  XLARGE: 'XL',
  'EXTRA LARGE': 'XL',
  'XX-LARGE': 'XXL',
  XXLARGE: 'XXL',
  'XXX-LARGE': 'XXXL',
  XXXLARGE: 'XXXL',
};

/**
 * Display-only: "X-Small" -> "XS".
 *
 * Anything we don't recognise is returned unchanged, so numeric waist sizes
 * ("30", "32"), "One Size", and colour names pass through untouched. Composite
 * variant titles are mapped per segment, so "X-Small / Black" -> "XS / Black".
 */
export function abbreviateSize(value?: null | string): string {
  if (!value) return '';

  return value
    .split('/')
    .map((segment) => {
      const trimmed = segment.trim();
      return SIZE_ALIASES[trimmed.toUpperCase()] ?? trimmed;
    })
    .join(' / ');
}

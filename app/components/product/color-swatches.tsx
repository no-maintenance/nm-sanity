import {Link, useLoaderData} from '@remix-run/react';

import {useLocalePath} from '~/hooks/use-locale-path';
import {resolveSwatch} from '~/lib/color-swatch';
import {cn} from '~/lib/utils';

// "Baggy Denim - Dark-Wash" -> "Dark-Wash". Colors on this store live as separate
// products following a "<Style> - <Color>" naming convention.
function colorFromTitle(title?: null | string): string {
  if (!title) return '';
  const parts = title.split(' - ');
  return (parts.length > 1 ? parts[parts.length - 1] : title).trim();
}

type LinkedProduct = {
  availableForSale?: boolean;
  featuredImage?: {altText?: null | string; url?: string} | null;
  handle?: string;
  id?: string;
  title?: string;
};

/**
 * Renders a row of color swatches that link between the separate color products
 * in a family. The family is defined by the `custom.color_group` metafield (a
 * list of product references) on each product. Renders nothing when a product
 * isn't part of a color group, so it can never break a product page.
 */
export function ColorSwatches() {
  const data = useLoaderData<any>();
  const productsPath = useLocalePath({path: '/products'});
  const product = data?.product;

  const refs: LinkedProduct[] = (
    product?.colorGroup?.references?.nodes ?? []
  ).filter((n: LinkedProduct) => n?.handle);

  if (!product?.handle || refs.length === 0) return null;

  const self: LinkedProduct = {
    availableForSale: true,
    featuredImage: {url: product.media?.nodes?.[0]?.image?.url},
    handle: product.handle,
    id: product.id,
    title: product.title,
  };

  // Current product first, then linked siblings, deduped by handle.
  const seen = new Set<string>();
  const family = [self, ...refs].filter((p) => {
    if (!p.handle || seen.has(p.handle)) return false;
    seen.add(p.handle);
    return true;
  });

  if (family.length < 2) return null;

  const currentColor = colorFromTitle(product.title);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fine uppercase tracking-wide">
        Color{currentColor ? `: ${currentColor}` : ''}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {family.map((p) => {
          const isCurrent = p.handle === product.handle;
          const colorName = colorFromTitle(p.title);
          const swatch = resolveSwatch(colorName);
          const soldOut = p.availableForSale === false;
          const style = swatch
            ? {background: swatch.background}
            : p.featuredImage?.url
              ? {
                  backgroundImage: `url(${p.featuredImage.url})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }
              : {background: 'rgb(var(--muted))'};

          return (
            <Link
              aria-current={isCurrent ? 'true' : undefined}
              aria-label={colorName || p.title}
              className={cn(
                'relative block size-7 rounded-full transition',
                'ring-offset-background focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2',
                swatch?.isLight && 'ring-1 ring-border',
                isCurrent
                  ? 'ring-2 ring-foreground ring-offset-2'
                  : 'notouch:hover:ring-1 notouch:hover:ring-foreground/50',
                soldOut && 'opacity-40',
              )}
              key={p.handle}
              prefetch="intent"
              style={style}
              title={colorName || p.title || undefined}
              to={`${productsPath}/${p.handle}`}
            >
              {soldOut && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="block h-px w-full rotate-45 bg-foreground/60" />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

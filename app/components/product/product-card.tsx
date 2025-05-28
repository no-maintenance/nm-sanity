import type { ProductCardFragment } from 'types/shopify/storefrontapi.generated';

import { Link } from '@remix-run/react';
import { stegaClean } from '@sanity/client/stega';
import { flattenConnection } from '@shopify/hydrogen';
import { useState } from 'react';

import { useLocalePath } from '~/hooks/use-locale-path';
import { cn } from '~/lib/utils';
import { useRootLoaderData } from '~/root';

import { ProductBadges } from '../blocks/price-block';
import { ShopifyImage } from '../shopify-image';
import { ShopifyMoney } from '../shopify-money';
import { Card, CardContent, CardMedia } from '../ui/card';

export function ProductCard(props: {
  className?: string;
  columns?: {
    desktop?: null | number;
    mobile?: null | number;
  };
  product?: ProductCardFragment;
  skeleton?: {
    cardsNumber?: number;
  };
}) {
  const { columns, product, skeleton } = props;
  const { sanityRoot } = useRootLoaderData();
  const { data } = stegaClean(sanityRoot);
  const style = data?.settings?.productCards?.style;
  const textAlignment = data?.settings?.productCards?.textAlignment || 'left';
  const aspectRatio = data?.settings?.productCards?.imageAspectRatio || 'video';
  const variants = product?.variants?.nodes.length
    ? flattenConnection(product?.variants)
    : null;
  const firstVariant = variants?.[0];

  // Extract images from media
  const mediaImages = product?.media?.nodes
    ?.map(node => node.image)
    ?.filter(Boolean) || [];

  // Use media images if available, fallback to variant image
  const primaryImage = mediaImages[0] || firstVariant?.image;
  const secondaryImage = mediaImages[1];

  const [isHovered, setIsHovered] = useState(false);
  const currentImage = isHovered && secondaryImage ? secondaryImage : primaryImage;

  const sizes = [
    '(min-width: 1024px)',
    columns?.desktop ? `${100 / columns.desktop}vw` : '33vw',
    columns?.mobile ? `${100 / columns.mobile}vw` : '100vw',
  ].join(', ');

  /**
 * Optional: Extended more granular image sizes
 * 
  const sizes = [
    '(min-width: 1200px) and (max-width: 1599px)',
    columns?.desktop ? `${100 / columns.desktop}vw` : '25vw',
    '(min-width: 1024px) and (max-width: 1199px)',
    columns?.desktop ? `${100 / columns.desktop}vw` : '33vw',
    '(min-width: 768px) and (max-width: 1023px)',
    columns?.mobile ? `${100 / columns.mobile}vw` : '50vw',
    '100vw'
  ].join(', ');
 */

  const path = useLocalePath({ path: `/products/${product?.handle}` });

  const cardClass = cn(
    style === 'card'
      ? 'overflow-hidden rounded-(--product-card-border-corner-radius)'
      : 'rounded-t-[calc(var(--product-card-border-corner-radius)*1.2)]',
    style === 'card'
      ? 'border-[rgb(var(--border)_/_var(--product-card-border-opacity))] [border-width:var(--product-card-border-thickness)]'
      : 'border-0',
    style === 'card'
      ? '[box-shadow:rgb(var(--shadow)_/_var(--product-card-shadow-opacity))_var(--product-card-shadow-horizontal-offset)_var(--product-card-shadow-vertical-offset)_var(--product-card-shadow-blur-radius)_0px]'
      : 'shadow-none',
    style === 'standard' && 'bg-transparent',
    textAlignment === 'center'
      ? 'text-center'
      : textAlignment === 'right'
        ? 'text-right'
        : 'text-left',
  );

  const priceClass = cn(
    'mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-3 *:overflow-hidden *:text-ellipsis *:whitespace-nowrap',
    textAlignment === 'center'
      ? 'justify-center'
      : textAlignment === 'right'
        ? 'justify-end'
        : 'justify-start',
  );
  return (
    <>
      {!skeleton && product && firstVariant ? (
        <Link prefetch="intent" to={path}>
          <Card
            className={cn(cardClass, 'group/card')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {currentImage && (
              <CardMedia
                aspectRatio={aspectRatio}
                className={cn(
                  'relative overflow-hidden',
                  style === 'standard' &&
                  'rounded-(--product-card-border-corner-radius)',
                  style === 'standard' &&
                  '[border-width:var(--product-card-border-thickness)] border-[rgb(var(--border)_/_var(--product-card-border-opacity))]',
                  style === 'standard' &&
                  '[box-shadow:rgb(var(--shadow)_/_var(--product-card-shadow-opacity))_var(--product-card-shadow-horizontal-offset)_var(--product-card-shadow-vertical-offset)_var(--product-card-shadow-blur-radius)_0px]',
                )}
              >
                <ShopifyImage
                  aspectRatio={cn(
                    aspectRatio === 'square' && '1/1',
                    aspectRatio === 'video' && '16/9',
                    aspectRatio === 'auto' &&
                    `${currentImage.width}/${currentImage.height}`,
                  )}
                  crop="center"
                  data={currentImage}
                  showBorder={false}
                  showShadow={false}
                  sizes={sizes}
                />
                {secondaryImage && (
                  <ShopifyImage
                    aspectRatio={cn(
                      aspectRatio === 'square' && '1/1',
                      aspectRatio === 'video' && '16/9',
                      aspectRatio === 'auto' &&
                      `${secondaryImage.width}/${secondaryImage.height}`,
                    )}
                    crop="center"
                    data={secondaryImage}
                    showBorder={false}
                    showShadow={false}
                    sizes={sizes}
                    className="absolute inset-0 opacity-0 group-hover/card:opacity-100"
                  />
                )}
                <ProductBadges
                  layout="card"
                  variants={product?.variants.nodes}
                />
              </CardMedia>
            )}
            <CardContent className="pl-0 pt-2 pb-0 mb-6 space-y-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap underline-offset-4  uppercase ">
                {product.title}
              </div>
              <div className="gap-truncate-e h-10">

                <div className={'hidden group-hover/card:block'}>
                  <div className={'flex gap-x-3  flex-wrap '}>
                    <ProductCardVariants variants={variants} />
                  </div>
                </div>

                <div className={cn(priceClass, 'group-hover/card:hidden flex gap-4')}>
                  {firstVariant.availableForSale ? (
                    <>
                      <ShopifyMoney
                        className="text-sm md:text-base"
                        data={firstVariant.price}
                      />
                      {firstVariant.compareAtPrice && (
                        <ShopifyMoney
                          className="text-xs line-through md:text-sm opacity-50"
                          data={firstVariant.compareAtPrice}
                        />
                      )}
                    </>
                  ) : (
                    <span className="flex gap-4 opacity-50">SOLD OUT</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : skeleton ? (
        <Card className={cn('animate-pulse', cardClass)}>
          <CardMedia aspectRatio={aspectRatio}>
            <div
              className={cn(
                'bg-muted w-full rounded-(--product-card-border-corner-radius)',
                aspectRatio === 'square' && 'aspect-square',
                aspectRatio === 'video' && 'aspect-video',
                aspectRatio === 'auto' && 'aspect-none',
              )}
            />
          </CardMedia>
          <CardContent className="text-muted-foreground/0 p-3 md:px-6 md:py-4">
            <div className="text-lg">
              <span className="rounded-sm">Skeleton product title</span>
            </div>
            <div className={priceClass}>
              <span className="rounded-sm text-sm md:text-base">
                Skeleton price
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function ProductCardVariants({
  variants,
}: {
  variants: ProductCardFragment['variants']['nodes'];
}) {
  return (
    <>
      {variants?.map((variant, idx) => (
        <h4 key={`variant-${idx}`} className={'inline text-base'}>
          {variant.availableForSale ? (
            variant.title
          ) : (
            <span
              className={cn(['strike', variant.title.length < 4 && 'small'])}
            >
              {variant.title}
            </span>
          )}
        </h4>
      ))}
    </>
  );
}

import type {SectionOfType} from 'types';
import type {ProductVariantFragmentFragment} from 'types/shopify/storefrontapi.generated';

import {stegaClean} from '@sanity/client/stega';
import {flattenConnection} from '@shopify/hydrogen';
import {useProduct} from '@shopify/hydrogen-react';

import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';
import {useSelectedVariant} from '~/hooks/use-selected-variant';
import {cn} from '~/lib/utils';
import {useRootLoaderData} from '~/root';

import {VariantPrice} from '../product/variant-price';
import {useProductVariants} from '../sections/product-information-section';

export type PriceBlockProps = NonNullable<
  SectionOfType<'productInformationSection'>['richtext']
>[number] & {
  _type: 'price';
  showShopifyBrand?: boolean;
};

export function PriceBlock(props: PriceBlockProps) {
  const {product} = useProduct();
  const variantsContextData = useProductVariants();

  if (!product) return null;

  if (variantsContextData?.variants) {
    return (
      <Layout>
        <VariantPrice showShopifyBrand={props.showShopifyBrand} variants={variantsContextData?.variants} />
        {/* <ProductBadges variants={variantsContextData?.variants} /> */}
      </Layout>
    );
  }

  const variants = product?.variants?.nodes?.length
    ? (flattenConnection(product.variants) as ProductVariantFragmentFragment[])
    : [];

  return (
    <Layout>
      <VariantPrice showShopifyBrand={props.showShopifyBrand} variants={variants} />
      {/* <ProductBadges variants={variants} /> */}
    </Layout>
  );
}

function Layout({children}: {children: React.ReactNode}) {
  return <div className="flex items-center gap-3">{children}</div>;
}

// "2027-01-07" -> "1/7" (no zero padding, no year), parsed as plain text so
// the day never shifts with the viewer's time zone.
export function formatShippingBeginsDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function ProductBadges({
  compact,
  layout,
  shippingBeginsDate,
  variants,
}: {
  /** Narrow cards (2-up on phones): smaller shipping-label type so it fits. */
  compact?: boolean;
  layout?: 'card';
  /** ISO date from Sanity's product "Shipping label"; renders the black pill. */
  shippingBeginsDate?: null | string;
  variants: ProductVariantFragmentFragment[];
}) {
  const {sanityRoot} = useRootLoaderData();
  const data = sanityRoot?.data;
  const {themeContent} = useSanityThemeContent();
  const selectedVariant = useSelectedVariant({variants});
  const isSoldOut = !selectedVariant?.availableForSale;
  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount &&
    parseFloat(selectedVariant?.price?.amount) <
      parseFloat(selectedVariant?.compareAtPrice?.amount);
  const badgesPosition = stegaClean(data?.settings?.badgesPosition);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1',
        // Cap at the card's width so a long label + SALE wrap onto two rows
        // (aligned to the badges' side) instead of spilling off the image.
        layout === 'card' && 'absolute z-5 m-2 max-w-[calc(100%-1rem)]',
        layout === 'card' &&
          (badgesPosition === 'top_right' || badgesPosition === 'bottom_right')
          ? 'justify-end'
          : 'justify-start',
        layout === 'card' && badgesPosition === 'top_left' && 'top-0 left-0',
        layout === 'card' && badgesPosition === 'top_right' && 'top-0 right-0',
        layout === 'card' &&
          badgesPosition === 'bottom_left' &&
          'bottom-0 left-0',
        layout === 'card' &&
          badgesPosition === 'bottom_right' &&
          'right-0 bottom-0',
        layout === 'card' && !badgesPosition && 'bottom-0 left-0',
      )}
    >
      {shippingBeginsDate && (
        // Same 22px height and m-1 inset as the SALE pill so the two line up.
        <span
          className={cn(
            'm-1 inline-flex h-[22px] items-center rounded-full bg-black px-3 text-xs font-semibold uppercase whitespace-nowrap text-white select-none',
            compact && 'max-sm:px-2 max-sm:text-[10px]',
          )}
          data-type="shipping-label"
        >
          Shipping begins {formatShippingBeginsDate(shippingBeginsDate)}
        </span>
      )}
      {isOnSale && !isSoldOut && (
        // Daniel's supplied artwork (the pill cropped losslessly from his
        // 3000px file, 244×102). Drawn at the old text badge's 22px height
        // and the same m-1 inset so placement is unchanged.
        <img
          alt={themeContent?.product?.sale || 'Sale'}
          className="m-1 select-none"
          data-type="sale-badge"
          // Inline so the global responsive-image rules can't stretch it.
          style={{height: 22, width: 'auto', maxWidth: 'none'}}
          decoding="async"
          draggable={false}
          height={102}
          src="/sale-badge.png"
          width={244}
        />
      )}
      {isSoldOut && (
        // Daniel's supplied artwork (the pill cropped losslessly from his
        // 3000px file, 376×92), drawn at the same 22px height and m-1 inset as
        // the SALE pill so the two line up.
        <img
          alt={
            themeContent?.product?.soldOutProductBadge ||
            themeContent?.product?.soldOut ||
            'Notify me'
          }
          className="m-1 select-none"
          data-type="sold-out-badge"
          // Inline so the global responsive-image rules can't stretch it.
          style={{height: 22, width: 'auto', maxWidth: 'none'}}
          decoding="async"
          draggable={false}
          height={92}
          src="/notify-me.png"
          width={376}
        />
      )}
    </div>
  );
}

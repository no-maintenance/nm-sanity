import type {ProductVariantFragmentFragment} from 'types/shopify/storefrontapi.generated';

import {useSelectedVariant} from '~/hooks/use-selected-variant';
import {cn} from '~/lib/utils';

import {ShopifyMoney} from '../shopify-money';

export function VariantPrice({
  variants,
  showShopifyBrand,
}: {
  variants: ProductVariantFragmentFragment[];
  showShopifyBrand?: boolean;
}) {
  const selectedVariant = useSelectedVariant({variants});
  const price = selectedVariant?.price;
  const compareAtPrice = selectedVariant?.compareAtPrice;

  return (
    <div className={cn(
      "flex items-center gap-2",
      showShopifyBrand && "justify-between w-full"
    )}>
       {showShopifyBrand && (
        <div className="text-muted-foreground text-small uppercase tracking-widest">
          No Maintenance
        </div>
      )}
      <div className="flex items-center gap-2">
        {compareAtPrice && (
          <ShopifyMoney
            className="text-muted-foreground line-through"
            data={compareAtPrice}
          />
        )}
        {price && <ShopifyMoney className="text-sm" data={price} />}
      </div>
    </div>
  );
}

export function VariantPriceSkeleton() {
  return (
    <div aria-hidden className="text-lg">
      <span className="opacity-0">Skeleton</span>
    </div>
  );
}

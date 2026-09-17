import type {ProductVariantFragmentFragment} from 'types/shopify/storefrontapi.generated';

import {useProduct} from '@shopify/hydrogen-react';

import {useSelectedVariant} from '~/hooks/use-selected-variant';
import {splitTitleNameColor} from '~/lib/product-title';
import {cn} from '~/lib/utils';

import {ShopifyMoney} from '../shopify-money';
import {useIsPurchasePanel} from './purchase-panel-context';

export function VariantPrice({
  variants,
  showShopifyBrand,
}: {
  variants: ProductVariantFragmentFragment[];
  showShopifyBrand?: boolean;
}) {
  const selectedVariant = useSelectedVariant({variants});
  const {product} = useProduct();
  const isPurchasePanel = useIsPurchasePanel();
  const price = selectedVariant?.price;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  // Only swap the brand label for the item name in the purchase panel, and only
  // when the title has a real color to move to the big line. Otherwise keep the
  // original "No Maintenance" brand.
  const {color, name} = splitTitleNameColor(product?.title);
  const brandLabel = isPurchasePanel && color ? name : 'No Maintenance';

  return (
    <div className={cn(
      "flex items-center gap-2",
      showShopifyBrand && "justify-between w-full"
    )}>
       {showShopifyBrand && (
        <div className="text-muted-foreground text-small font-bold uppercase tracking-widest">
          {brandLabel}
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

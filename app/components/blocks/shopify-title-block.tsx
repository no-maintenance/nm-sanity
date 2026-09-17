import type {SectionOfType} from 'types';

import {useParams} from '@remix-run/react';
import {useProduct} from '@shopify/hydrogen-react';

import {useIsPurchasePanel} from '~/components/product/purchase-panel-context';
import {splitTitleNameColor} from '~/lib/product-title';

export type ShopifyTitleBlockProps = NonNullable<
  SectionOfType<'productInformationSection'>['richtext']
>[number] & {
  _type: 'shopifyTitle';
};

export function ShopifyTitleBlock(props: ShopifyTitleBlockProps) {
  const {product} = useProduct();
  const params = useParams();
  const isPurchasePanel = useIsPurchasePanel();
  const classes = "max-w-prose text-base whitespace-normal uppercase font-normal my-0"
  if (!product) return null;

  // In the PDP purchase panel, show the color (from the "NAME - COLOR" title).
  // Everywhere else (featured sections, accordions), and for titles with no
  // color segment, show the full title unchanged.
  const {color} = splitTitleNameColor(product?.title);
  const display = isPurchasePanel && color ? color : product?.title;

  return params.productHandle ? (
    <h1 className={classes}>{display}</h1>
  ) : (
    <h2 className={classes}>{display}</h2>
  );
}

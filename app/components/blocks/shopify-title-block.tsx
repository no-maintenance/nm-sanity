import type {SectionOfType} from 'types';

import {useParams} from '@remix-run/react';
import {useProduct} from '@shopify/hydrogen-react';

export type ShopifyTitleBlockProps = NonNullable<
  SectionOfType<'productInformationSection'>['richtext']
>[number] & {
  _type: 'shopifyTitle';
};

export function ShopifyTitleBlock(props: ShopifyTitleBlockProps) {
  const {product} = useProduct();
  const params = useParams();
  const classes = "max-w-prose text-base whitespace-normal uppercase font-normal my-0"
  if (!product) return null;

  return params.productHandle ? (
    <h1 className={classes}>{product?.title}</h1>
  ) : (
    <h2 className={classes}>{product?.title}</h2>
  );
}

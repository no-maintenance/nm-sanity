import type {SectionOfType} from 'types';
import type {ProductVariantFragmentFragment} from 'types/shopify/storefrontapi.generated';

import {flattenConnection, useProduct} from '@shopify/hydrogen-react';

import {useProductVariants} from '../sections/product-information-section';
import {AddToCartForm} from './add-to-cart-form';
import {ColorSwatches} from './color-swatches';
import {VariantSelector} from './variant-selector';

export type AddToCartButtonBlockProps = NonNullable<
  SectionOfType<'productInformationSection'>['richtext']
>[number] & {
  _type: 'addToCartButton';
};

export function ProductForm(props: AddToCartButtonBlockProps) {
  const {product} = useProduct();
  const variantsContextData = useProductVariants();
  const showQuantitySelector = props.quantitySelector;
  // mb-1 (not mb-4) so the Size Guide / Returns row sits close under the
  // purchase buttons. The full gap below Shop Pay is this margin plus the
  // sticky wrapper's pb-2 and the column's space-y-1 — 16px in total.
  const containerClass = 'grid gap-4 mt-2 mb-1';
  if (!product) return null;

  if (variantsContextData?.variants) {
    return (
      <div className={containerClass}>
        <ColorSwatches />
        <VariantSelector
          options={product.options}
          variants={variantsContextData?.variants}
        />
        <AddToCartForm
          showQuantitySelector={showQuantitySelector}
          showShopPay={props.shopPayButton}
          variants={variantsContextData?.variants}
        />
      </div>
    );
  }

  const variants = product?.variants?.nodes?.length
    ? (flattenConnection(product.variants) as ProductVariantFragmentFragment[])
    : [];

  return (
    <div className={containerClass}>
      <ColorSwatches />
      <VariantSelector options={product.options} variants={variants} />
      <AddToCartForm
        showQuantitySelector={showQuantitySelector}
        showShopPay={props.shopPayButton}
        variants={variants}
      />
    </div>
  );
}

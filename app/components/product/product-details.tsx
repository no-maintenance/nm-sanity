import type {PortableTextComponents} from '@portabletext/react';
import type {PortableTextMarkComponentProps} from '@portabletext/react';

import {PortableText} from '@portabletext/react';
import {useMemo} from 'react';

import type {PriceBlockProps} from '../blocks/price-block';
import type {ProductDetailsBlockProps} from '../blocks/extra-product-information-block';
import type {ShopifyAccordionBlockProps} from '../blocks/shopify-accordion-block';
import type {ShopifyDescriptionBlockProps} from '../blocks/shopify-description-block';
import type {ShopifyTitleBlockProps} from '../blocks/shopify-title-block';
import type {ProductModalBlockProps} from '../blocks/product-modal-block';
import type {FeaturedProductSectionProps} from '../sections/featured-product-section';
import type {ProductInformationSectionProps} from '../sections/product-information-section';
import type {AddToCartButtonBlockProps} from './product-form';

import {PriceBlock} from '../blocks/price-block';
import {ProductDetailsBlock} from '../blocks/extra-product-information-block';
import ProductModalBlock from '../blocks/product-modal-block';
import {ShopifyAccordionBlock} from '../blocks/shopify-accordion-block';
import {ShopifyDescriptionBlock} from '../blocks/shopify-description-block';
import {ShopifyTitleBlock} from '../blocks/shopify-title-block';
import {ExternalLinkAnnotation} from '../sanity/richtext/components/external-link-annotation';
import {InternalLinkAnnotation} from '../sanity/richtext/components/internal-link-annotation';
import {ProductForm} from './product-form';

export function ProductDetails({
  data,
}: {
  data: FeaturedProductSectionProps | ProductInformationSectionProps;
}) {
  // Pre-process richtext to group adjacent productModal blocks
  function groupModalBlocks(blocks: any[]) {
    const result: any[] = [];
    let i = 0;
    while (i < blocks.length) {
      if (blocks[i]._type === 'productModal') {
        const modals = [];
        let j = i;
        while (j < blocks.length && blocks[j]._type === 'productModal') {
          modals.push(blocks[j]);
          j++;
        }
        result.push({
          _type: 'modalGroup',
          _key: `modalGroup-${i}`,
          modals,
        });
        i = j;
      } else {
        result.push(blocks[i]);
        i++;
      }
    }
    return result;
  }

  // Default PortableText components (for recursion)
  const defaultComponents: PortableTextComponents = useMemo(
    () => ({
      marks: {
        externalLink: (props: PortableTextMarkComponentProps<any>) => {
          return (
            <ExternalLinkAnnotation {...props.value}>
              {props.children}
            </ExternalLinkAnnotation>
          );
        },
        internalLink: (props: PortableTextMarkComponentProps<any>) => {
          return (
            <InternalLinkAnnotation {...props.value}>
              {props.children}
            </InternalLinkAnnotation>
          );
        },
      },
      types: {
        addToCartButton: (props: {value: AddToCartButtonBlockProps}) => (
          <ProductForm {...props.value} />
        ),
        price: (props: {value: PriceBlockProps}) => (
          <PriceBlock {...props.value} />
        ),
        shopifyDescription: (props: {value: ShopifyDescriptionBlockProps}) => (
          <ShopifyDescriptionBlock {...props.value} />
        ),
        shopifyTitle: (props: {value: ShopifyTitleBlockProps}) => (
          <ShopifyTitleBlock {...props.value} />
        ),
        shopifyAccordion: (props: any) => (
          <ShopifyAccordionBlock {...props.value} />
        ),
        productModal: (props: {value: ProductModalBlockProps}) => (
          <ProductModalBlock value={props.value} />
        ),
        // New modalGroup renderer
        modalGroup: (props: {value: {modals: any[]}}) => (
          <div className="flex w-full justify-between gap-4 mb-2">
            {props.value.modals.map((modal, idx) => (
              <ProductModalBlock key={modal._key || idx} value={modal} />
            ))}
          </div>
        ),
        productDetails: (props: {value: ProductDetailsBlockProps}) => (
          <ProductDetailsBlock {...props.value} />
        ),
      },
    }),
    []
  );

  // Pre-process richtext before rendering
  const processedRichtext = data.richtext ? groupModalBlocks(data.richtext) : [];

  return (
    <div className="container space-y-1 lg:max-w-none lg:px-0">
      {processedRichtext.length > 0 && (
        <PortableText
          components={defaultComponents}
          value={processedRichtext}
        />
      )}
    </div>
  );
}

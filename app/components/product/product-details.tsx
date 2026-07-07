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
import {ShopifyAccordionBlock, ShopifyAccordionGroup} from '../blocks/shopify-accordion-block';
import {ShopifyDescriptionBlock} from '../blocks/shopify-description-block';
import {ShopifyTitleBlock} from '../blocks/shopify-title-block';
import {ExternalLinkAnnotation} from '../sanity/richtext/components/external-link-annotation';
import {InternalLinkAnnotation} from '../sanity/richtext/components/internal-link-annotation';
import {ProductForm} from './product-form';
import {cn} from '~/lib/utils';

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

  // Pre-process richtext to group adjacent shopifyAccordion blocks so they share
  // a single accordion root — that way only one (e.g. Description or Details) can
  // be open at a time.
  function groupAccordionBlocks(blocks: any[]) {
    const result: any[] = [];
    let i = 0;
    while (i < blocks.length) {
      if (blocks[i]._type === 'shopifyAccordion') {
        const accordions = [];
        let j = i;
        while (j < blocks.length && blocks[j]._type === 'shopifyAccordion') {
          accordions.push(blocks[j]);
          j++;
        }
        result.push({
          _type: 'accordionGroup',
          _key: `accordionGroup-${i}`,
          accordions,
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
        // Grouped accordions share one root so only one can be open at a time
        accordionGroup: (props: {value: {accordions: any[]}}) => (
          <ShopifyAccordionGroup accordions={props.value.accordions} />
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
  const processedRichtext = data.richtext
    ? groupAccordionBlocks(groupModalBlocks(data.richtext))
    : [];

  // Split the blocks so the purchase summary (title, price, add-to-cart,
  // Shop Pay) stays pinned to the top while the description and other blocks
  // below it scroll underneath, on both mobile and desktop. Boundary = the
  // add-to-cart block.
  const addToCartIndex = processedRichtext.findIndex(
    (block) => block._type === 'addToCartButton',
  );
  const stickyBlocks =
    addToCartIndex >= 0
      ? processedRichtext.slice(0, addToCartIndex + 1)
      : processedRichtext;
  const scrollBlocks =
    addToCartIndex >= 0 ? processedRichtext.slice(addToCartIndex + 1) : [];

  // On desktop, the scrollable-gallery layout makes this column its own sticky,
  // internally-scrolling container. There the summary should pin to the top of
  // that column (top-0). In other layouts the page scrolls on desktop, so the
  // summary stays below the header (the mobile offset carries over).
  const columnIsScrollContainer =
    !!data &&
    'galleryStyle' in data &&
    (data as ProductInformationSectionProps).galleryStyle !== 'simple' &&
    (data as ProductInformationSectionProps).stickyProductInfo !== false;

  return (
    <div className="container space-y-1 lg:max-w-none lg:px-0">
      {stickyBlocks.length > 0 && (
        <div
          className={cn(
            'sticky top-(--header-height) z-10 space-y-1 bg-background pb-2',
            columnIsScrollContainer && 'lg:top-0',
          )}
        >
          <PortableText components={defaultComponents} value={stickyBlocks} />
        </div>
      )}
      {scrollBlocks.length > 0 && (
        <div className="space-y-1">
          <PortableText components={defaultComponents} value={scrollBlocks} />
        </div>
      )}
    </div>
  );
}

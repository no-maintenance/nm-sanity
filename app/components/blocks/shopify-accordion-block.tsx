import type { SectionOfType } from 'types';
import { useProduct } from '@shopify/hydrogen-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { useMemo, useState } from 'react';
import { PriceBlock } from './price-block';
import { ProductDetailsBlock } from './extra-product-information-block';
import { ShopifyDescriptionBlock } from './shopify-description-block';
import { ShopifyTitleBlock } from './shopify-title-block';
import { ProductForm } from '../product/product-form';
import { ExternalLinkAnnotation } from '../sanity/richtext/components/external-link-annotation';
import { InternalLinkAnnotation } from '../sanity/richtext/components/internal-link-annotation';

export type ShopifyAccordionBlockProps = NonNullable<
  SectionOfType<'productInformationSection'>['richtext']
>[number] & {
  _type: 'shopifyAccordion';
  title: string;
  content?: any[]; // Base richtext content without recursion
  defaultOpen?: boolean;
};

// Stable id for an accordion item, derived from its title.
const accordionItemId = (title: string) =>
  `accordion-${String(title).toLowerCase().replace(/\s+/g, '-')}`;

// Base richtext components for accordion content (no accordion/modal to avoid recursion)
function useAccordionContentComponents(): PortableTextComponents {
  return useMemo(
    () => ({
      marks: {
        externalLink: (props: any) => (
          <ExternalLinkAnnotation {...props.value}>
            {props.children}
          </ExternalLinkAnnotation>
        ),
        internalLink: (props: any) => (
          <InternalLinkAnnotation {...props.value}>
            {props.children}
          </InternalLinkAnnotation>
        ),
      },
      types: {
        addToCartButton: (props: any) => <ProductForm {...props.value} />,
        price: (props: any) => <PriceBlock {...props.value} />,
        shopifyDescription: (props: any) => <ShopifyDescriptionBlock {...props.value} />,
        shopifyTitle: (props: any) => <ShopifyTitleBlock {...props.value} />,
        productDetails: (props: any) => <ProductDetailsBlock {...props.value} />,
      },
    }),
    []
  );
}

// A single accordion item. Must be rendered inside an <Accordion> root.
export function ShopifyAccordionItem({ title, content }: ShopifyAccordionBlockProps) {
  const components = useAccordionContentComponents();

  if (!content) return null;

  return (
    <AccordionItem value={accordionItemId(title)}>
      <AccordionTrigger className='uppercase font-normal'>{title}</AccordionTrigger>
      <AccordionContent className="pb-1">
        <div className="prose max-w-none [&_p]:mt-0 [&_p:last-child]:mb-0 [&>div]:py-0">
          <PortableText value={content} components={components} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// A set of accordions sharing one root, so only one item can be open at a time.
export function ShopifyAccordionGroup({
  accordions,
}: {
  accordions: ShopifyAccordionBlockProps[];
}) {
  const { product } = useProduct();

  const items = accordions.filter((a) => a?.content);
  // Start with the flagged item, otherwise the first one.
  const initialItem = items.find((a) => a.defaultOpen) ?? items[0];
  const [value, setValue] = useState(
    initialItem ? accordionItemId(initialItem.title) : '',
  );

  if (!product || items.length === 0) return null;

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      // Never allow zero open: minimizing the open item opens the other one
      // instead (e.g. minimizing Description pops Details up, and vice versa).
      onValueChange={(next) => {
        if (next) return setValue(next);
        const other = items.find((a) => accordionItemId(a.title) !== value);
        setValue(other ? accordionItemId(other.title) : value);
      }}
      className="w-full"
    >
      {items.map((a, i) => (
        <ShopifyAccordionItem key={a._key || i} {...a} />
      ))}
    </Accordion>
  );
}

// Standalone single accordion (kept for backwards compatibility).
export function ShopifyAccordionBlock(props: ShopifyAccordionBlockProps) {
  return <ShopifyAccordionGroup accordions={[props]} />;
}

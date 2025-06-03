import type { SectionOfType } from 'types';
import { useProduct } from '@shopify/hydrogen-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '~/components/ui/accordion';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { useMemo } from 'react';
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

export function ShopifyAccordionBlock(props: ShopifyAccordionBlockProps) {
  const { product } = useProduct();
  const { title, content, defaultOpen = false } = props;

  if (!product || !content) return null;

  // Generate a unique ID for the accordion item
  const itemId = `accordion-${String(title).toLowerCase().replace(/\s+/g, '-')}`;

  // Base richtext components (no accordion or modal to avoid recursion)
  const baseComponents: PortableTextComponents = useMemo(
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

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? itemId : undefined}
      className="w-full"
    >
      <AccordionItem value={itemId}>
        <AccordionTrigger className='uppercase font-normal'>{title}</AccordionTrigger>
        <AccordionContent>
          <div className="prose max-w-none [&_p]:mt-0">
            <PortableText value={content} components={baseComponents} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

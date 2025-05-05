import type { SectionOfType } from 'types';
import { useProduct } from '@shopify/hydrogen-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '~/components/ui/accordion';
import { PortableText, type PortableTextBlock } from '@portabletext/react';

export type ShopifyAccordionBlockProps = NonNullable<
  SectionOfType<'productInformationSection'>['richtext']
>[number] & {
  _type: 'shopifyAccordion';
  title: string;
  contentType: 'description' | 'shipping' | 'custom';
  customContent?: PortableTextBlock[];
  defaultOpen?: boolean;
};

export function ShopifyAccordionBlock(props: ShopifyAccordionBlockProps) {
  const { product } = useProduct();
  const { title, contentType, customContent, defaultOpen = false } = props;

  if (!product) return null;

  // Generate a unique ID for the accordion item
  const itemId = `accordion-${contentType}-${String(title).toLowerCase().replace(/\s+/g, '-')}`;
  
  let content: React.ReactNode = null;

  switch (contentType) {
    case 'description':
      if (!product.descriptionHtml) return null;
      content = (
        <div
          className="prose [&_a]:text-primary touch:[&_a]:active:underline notouch:[&_a]:hover:underline [&_a]:underline-offset-4"
          dangerouslySetInnerHTML={{
            __html: product.descriptionHtml,
          }}
        />
      );
      break;
    case 'shipping':
      content = (
        <div className="prose">
          <p>Shipping information for {product.title}</p>
          {/* Add your shipping information here */}
        </div>
      );
      break;
    case 'custom':
      content = customContent ? (
        <div className="prose">
          <PortableText value={customContent} />
        </div>
      ) : null;
      break;
    default:
      return null;
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? itemId : undefined}
      className="w-full"
    >
      <AccordionItem value={itemId}>
        <AccordionTrigger className='uppercase font-normal'>{title}</AccordionTrigger>
        <AccordionContent>{content}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

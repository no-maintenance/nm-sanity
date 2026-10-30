import { PortableText } from '@portabletext/react';
import React, { useState } from 'react';

import type { PortableTextBlock } from '@portabletext/types';

import { cn } from '~/lib/utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '~/components/ui/dialog';
import { portableTextMarks } from './portableTextMarks';
import { ProductDetailsBlock, type ProductDetailsBlockProps } from '../../../blocks/extra-product-information-block';
import { SizeGuide, type ModelMeasurements } from '~/components/product/size-guide';
import { modelNoteFromHtml } from '~/lib/size-guide';
import { useProduct } from '@shopify/hydrogen-react';

// Define types for Sanity's table format
interface TableRow {
  _key?: string;
  _type?: string;
  cells?: string[];
}

function isSizeChartContent(content: unknown): content is {
  table?: { rows?: TableRow[] };
  description?: any;
  image?: { asset?: { url?: string }, alt?: string };
} {
  return (
    !!content &&
    typeof content === 'object' &&
    !Array.isArray(content) &&
    ('table' in content || 'description' in content || 'image' in content)
  );
}

export interface ProductModalBlockProps {
  value: {
    triggerLabel: string;
    /**
     * When set, the trigger renders as a plain link to this URL instead of
     * opening a modal (e.g. "Returns and Exchanges" -> the policy page).
     */
    linkUrl?: string;
    modalTitle: string;
    content: PortableTextBlock[];
  };
  productSizeChart?: {
    table?: { rows?: TableRow[] };
    garmentType?: string;
    description?: any;
    image?: { asset?: { url?: string }, alt?: string };
    modelMeasurements?: ModelMeasurements;
  };
}

export default function ProductModalBlock(props: ProductModalBlockProps) {
  const { value, productSizeChart } = props;
  const [open, setOpen] = useState(false);
  const { triggerLabel, linkUrl, modalTitle, content } = value;
  const {product} = useProduct();
  // Use the product's sizeChart if productSizeChart is not provided
  const sizeChart = productSizeChart || (product && 'sizeChart' in product ? (product as any).sizeChart : undefined);
  // Drives which garment drawing the guide shows; merged onto the product from
  // Sanity in the product route (the Storefront API doesn't return it).
  const productType =
    product && 'productType' in product ? (product as any).productType : undefined;
  // Footwear's guide is just a boot sketch beside a short EU/US table, so it
  // doesn't need the wide frame the illustrated guides do — let its modal shrink
  // to the content instead of stranding it in a mostly-empty 5xl box.
  const isFootwear =
    (productType ?? '').toString().toLowerCase() === 'footwear';
  // Show the same model/fit note the product copy does, lifted straight from the
  // description so the two can't drift apart.
  const modelNote = modelNoteFromHtml(
    product && 'descriptionHtml' in product
      ? (product as any).descriptionHtml
      : undefined,
  );
  // Custom Portable Text component to inject the product's size chart
  const portableTextComponents = {
    types: {
      sizeChart: () => (
        <SizeGuide
          garmentType={sizeChart?.garmentType}
          modelMeasurements={sizeChart?.modelMeasurements}
          modelNote={modelNote}
          productType={productType}
          table={sizeChart?.table}
          title={product?.title}
        />
      ),
      productDetails: (props: {value: ProductDetailsBlockProps}) => (
        <ProductDetailsBlock {...props.value} />
      ),
    },
    marks: {
      ...portableTextMarks,
    },
  };

  // A link-style entry (e.g. "Returns and Exchanges") renders as a plain
  // anchor, styled identically to the modal triggers so it still lines up in
  // the Size Guide row. External URLs open in a new tab.
  if (linkUrl) {
    const isExternal = /^https?:\/\//i.test(linkUrl);
    return (
      <a
        className="text-[11px] font-medium text-primary uppercase underline"
        href={linkUrl}
        {...(isExternal
          ? {rel: 'noopener noreferrer', target: '_blank'}
          : {})}
      >
        {triggerLabel}
      </a>
    );
  }

  // The illustrated size guide needs a far wider frame than the text-only
  // modals (Returns, Shipping), so widen only when a sizeChart block is present.
  const hasSizeChart = (content ?? []).some(
    (b: any) => b?._type === 'sizeChart',
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[11px] font-medium text-primary uppercase underline">
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          // DialogContent is itself a grid whose implicit column is auto-sized,
          // so wide children (the size table) stretch it past the viewport on
          // mobile. Pin the column to minmax(0,1fr) to make overflow scroll
          // inside the table rather than widening the modal.
          'w-full grid-cols-[minmax(0,1fr)] p-4 pt-4 md:p-6',
          // max-h in dvh (not vh) so in-app browsers like Instagram, whose
          // toolbars shrink the visible area, don't push the modal taller than
          // the screen. Desktop clamps and the flex-1 drawing shrinks to fit
          // (overflow-hidden, no scroll); mobile stacks taller than the viewport,
          // so it scrolls instead of clipping its content.
          hasSizeChart &&
            'max-h-[92dvh] flex flex-col overflow-y-auto gap-0 md:overflow-hidden md:p-8',
          // Footwear hugs its content; the illustrated guides take the wide 5xl
          // frame they need.
          hasSizeChart && (isFootwear ? 'sm:w-fit sm:max-w-5xl' : 'sm:max-w-5xl'),
          !hasSizeChart && 'max-w-2xl',
        )}
        variant="wide"
      >
        <div className={cn('flex items-center justify-between', hasSizeChart && 'shrink-0')}>
          {modalTitle && (
            <DialogTitle
              className={cn(
                'text-lg font-medium mb-4',
                // The mockups show only the close control, no heading.
                hasSizeChart && 'sr-only mb-0',
              )}
            >
              {modalTitle}
            </DialogTitle>
          )}
          <DialogClose asChild>
            <button aria-label="Close" className="text-xl" />
          </DialogClose>
        </div>
        {content && (
          <div
            className={cn(
              hasSizeChart
                ? 'flex flex-col md:min-h-0 md:flex-1'
                : 'prose max-w-none [&_p]:mt-0',
            )}
          >
            <PortableText value={content} components={portableTextComponents} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

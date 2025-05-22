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
import { useProduct } from '@shopify/hydrogen-react';

// Define types for Sanity's table format
interface TableRow {
  _key?: string;
  _type?: string;
  cells?: string[];
}

interface SizeChartTableProps {
  table: { rows?: TableRow[] };
}

function SizeChartTable({ table }: SizeChartTableProps) {
  if (!table?.rows || table.rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white text-base">
        <thead>
          <tr>
            {table.rows[0]?.cells?.map((cell: string, i: number) => (
              <th
                key={i}
                className="px-4 py-3 font-semibold text-black text-start border-b whitespace-nowrap"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.slice(1).map((row: TableRow, i: number) => (
            <tr key={row._key || i}>
              {row.cells?.map((cell: string, j: number) => (
                <td
                  key={j}
                  className="px-4 py-3 border-bwhitespace-nowrap text-black"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
    modalTitle: string;
    content: PortableTextBlock[];
  };
  productSizeChart?: {
    table?: { rows?: TableRow[] };
    description?: any;
    image?: { asset?: { url?: string }, alt?: string };
  };
}

export default function ProductModalBlock(props: ProductModalBlockProps) {
  const { value, productSizeChart } = props;
  const [open, setOpen] = useState(false);
  const { triggerLabel, modalTitle, content } = value;
  const {product} = useProduct();
  // Use the product's sizeChart if productSizeChart is not provided
  const sizeChart = productSizeChart || (product && 'sizeChart' in product ? (product as any).sizeChart : undefined);

  // Custom Portable Text component to inject the product's size chart
  const portableTextComponents = {
    types: {
      sizeChart: () =>
        sizeChart ? (
          <>
            {sizeChart.table && <SizeChartTable table={sizeChart.table} />}
            {/* {sizeChart.description && (
              <div className="mt-4 prose max-w-none">
                <PortableText value={sizeChart.description} />
              </div>
            )}
            {sizeChart.image?.asset?.url && (
              <img
                src={sizeChart.image.asset.url}
                alt={sizeChart.image.alt || ''}
                className="mt-4  max-h-64 object-contain mx-auto"
              />
            )} */}
          </>
        ) : (
          <div className="text-sm text-gray-500">No size chart available for this product.</div>
        ),
    },
    marks: {
      ...portableTextMarks,
    },
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-primary underline">
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent variant="wide" className="max-w-2xl w-full p-6 pt-4 ">
        <div className="flex justify-between items-center ">
          {modalTitle && <DialogTitle className="text-lg font-medium mb-4">{modalTitle}</DialogTitle>}
          <DialogClose asChild>
            <button aria-label="Close" className="text-xl" />
          </DialogClose>
        </div>
        {content && (
          <div className='prose max-w-none  [&_p]:mt-0'>
            <PortableText value={content} components={portableTextComponents} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import {ReactNode} from 'react';
import type {PortableTextBlock} from '@portabletext/types';

import ProductModalBlockComponent from '~/components/sanity/richtext/components/product-modal-block';

export interface ProductModalBlockProps {
  _key?: string;
  _type: 'productModal';
  triggerLabel: string;
  modalTitle: string;
  content?: PortableTextBlock[];
}

export default function ProductModalBlock({
  value,
}: {
  value: ProductModalBlockProps;
}): ReactNode {
  return <ProductModalBlockComponent value={{...value, content: value.content || []}} />;
}

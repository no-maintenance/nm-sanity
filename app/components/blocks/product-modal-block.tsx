import {ReactNode} from 'react';

import ProductModalBlockComponent from '~/components/sanity/richtext/components/product-modal-block';

export interface ProductModalBlockProps {
  _key?: string;
  _type: 'productModal';
  triggerLabel: string;
  modalTitle: string;
  content?: any[];
}

export default function ProductModalBlock({
  value,
}: {
  value: ProductModalBlockProps;
}): ReactNode {
  return <ProductModalBlockComponent value={value} />;
}

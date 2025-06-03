import type {PortableTextBlock} from '@portabletext/types';

// Global type augmentation for any Product type to include our CMS fields
declare global {
  namespace Shopify {
    interface Product {
      details?: PortableTextBlock[] | null;
      sizeChart?: any;
    }
  }
}

// Also extend the common Product interface pattern used by Hydrogen
declare module '@shopify/hydrogen/storefront-api-types' {
  interface Product {
    details?: PortableTextBlock[] | null;
    sizeChart?: any;
  }
}

export {}; 
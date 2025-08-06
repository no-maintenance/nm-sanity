declare global {
  interface Window {
    klaviyo?: any;
    _klOnsite?: Array<any>;
  }
}

import {useEffect, useRef} from 'react';
import {useAnalytics} from '@shopify/hydrogen';

// ---------------------------------------------------------------------------
// Simplified Klaviyo loader without SPA manual mode
// ---------------------------------------------------------------------------
function useLoadKlaviyo(accountId: string, nonce?: string) {
  const loaded = useRef(false);

  useEffect(() => {
    if (!accountId || loaded.current || typeof document === 'undefined') return;

    // Initialize the queue
    window._klOnsite = window._klOnsite || [];
    window._klOnsite.push(['account', accountId]);

    // Load script directly without manual SPA mode
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://static.klaviyo.com/onsite/js/${accountId}/klaviyo.js`;
    if (nonce) script.nonce = nonce;
    script.onload = () => {
      // Script loaded successfully
      console.log('Klaviyo script loaded');
    };
    script.onerror = () => {
      console.error('Failed to load Klaviyo script');
    };
    document.head.appendChild(script);

    loaded.current = true;
  }, [accountId, nonce]);
}

// ---------------------------------------------------------------------------
// KlaviyoPixel: loads the SDK and wires Hydrogen analytics → Klaviyo events
// ---------------------------------------------------------------------------
export function KlaviyoPixel({id, nonce}: {id: string; nonce?: string}) {
  useLoadKlaviyo(id, nonce);

  const {register, subscribe} = useAnalytics();
  const {ready} = register('Klaviyo');

  useEffect(() => {
    if (!id) return;

      const unsubscribeProductViewed = subscribe('product_viewed', (data) => {
        if (!window._klOnsite) return;
        
        const product = data.products[0];
        const item = {
          Name: product.title,
          ProductID: product.id.substring(product.id.lastIndexOf('/') + 1),
          ImageURL: product.image,
          Handle: product.handle,
          Brand: product.vendor,
          Price: product.price,
        };
        
        window._klOnsite.push(['track', 'Viewed Product', item]);
        window._klOnsite.push(['trackViewedItem', item]);
      });

      const unsubscribeAddedToCart = subscribe('product_added_to_cart', (data) => {
        if (!window._klOnsite) return;
        
        const curr = data.currentLine?.merchandise?.product;
        const item = {
          $value: Number(data.currentLine?.cost.amountPerQuantity.amount ?? 0),
          AddedItemProductName: curr?.title,
          AddedItemProductID: curr?.id.substring(curr?.id.lastIndexOf('/') + 1),
          AddedItemImageURL: data.currentLine?.merchandise?.image?.url,
          AddedItemURL: `https://nomaintenance.us/products/${curr?.handle ?? ''}`,
          Handle: curr?.handle,
          Brand: curr?.vendor,
          AddedItemQuantity: 1,
          AddedItemPrice: Number(data.currentLine?.cost.amountPerQuantity.amount ?? 0),
          CheckoutURL: data?.cart?.checkoutUrl,
        };
        
        window._klOnsite.push(['track', 'Added to Cart', item]);
      });

    ready();
  }, [id, subscribe, ready]);

  return null;
}



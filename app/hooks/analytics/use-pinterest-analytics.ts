import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import ReactPinterest from '~/lib/pixels/pinterest';
import { useAnalyticsEnv } from '~/hooks/use-analytics-env';
import { useAnalyticsDebug } from '~/hooks/use-analytics-debug';

const PIXEL_NAME = 'Pinterest';

export function usePinterestAnalytics({id}: {id: string}) {
  const {register, subscribe} = useAnalytics();
  const { debugTracking } = useAnalyticsEnv();
  const { debugInit, debugEvent } = useAnalyticsDebug();
  const initialized = useRef(false);
  const currentId = useRef<string>('');
  
  const {ready} = register(PIXEL_NAME);
  
  useEffect(() => {
    // Skip if no ID provided
    if (!id) {
      debugInit(PIXEL_NAME, '');
      return;
    }
    
    // Skip if already initialized with the same ID
    if (initialized.current && currentId.current === id) {
      return;
    }
    
    debugInit(PIXEL_NAME, id);
    
    ReactPinterest.init(id, '', {debug: debugTracking});
    
    initialized.current = true;
    currentId.current = id;
    const ts = new Date().toISOString();

    // Standard events
    subscribe('page_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'page_viewed', data);
      ReactPinterest.track('pagevisit', {event_id: `pageview--${ts}`});
    });
    subscribe('product_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'product_viewed', data);
      // const p = data.products[0];
      // ReactPinterest.track('pagevisit', {
      //   event_id: `product-viewed--${p.id}--${ts}`,
      //   line_items: [
      //     {
      //       product_name: p.title,
      //       product_id: p.id,
      //       product_category: p.productType,
      //     },
      //   ],
      // });
    });
    subscribe('collection_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'collection_viewed', data);
    });
    subscribe('cart_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'cart_viewed', data);
    });
    subscribe('cart_updated', (data) => {
      debugEvent(PIXEL_NAME, 'cart_updated', data);
    });
    subscribe('product_added_to_cart', (data) => {
      debugEvent(PIXEL_NAME, 'product_added_to_cart', data);
      const id = data.currentLine?.merchandise?.product.id;
      const ts = new Date().toISOString();
      ReactPinterest.track('addtocart', {
        event_id: `addtocart--${ts}`,
        value: data.currentLine?.cost?.totalAmount?.amount,
        currency: data.currentLine?.cost?.totalAmount?.currencyCode,
        line_items: [
          {
            // product_category: p.productType,
            product_name: data.currentLine?.merchandise?.product.title,
            product_id: data.currentLine?.merchandise?.product.id,
            product_variant_id: data.currentLine?.merchandise?.id,
            product_variant: data.currentLine?.merchandise.title,
            product_price: data.currentLine?.merchandise.price.amount,
            product_quantity: data.currentLine?.quantity,
          },
        ],
      });
    });
    subscribe('custom_newsletter_signup', (data) => {
      ReactPinterest.track('lead', {});
    });
    // Mark this analytics integration as ready as soon as it's done setting up
    ready();
  }, []);
  return null;
}

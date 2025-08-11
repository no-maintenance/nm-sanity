import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import ReactPixel from '~/lib/pixels/fb';
import {getAddToCartValue} from '~/lib/utils';
import { useAnalyticsEnv } from '~/hooks/use-analytics-env';
import { useAnalyticsDebug } from '~/hooks/use-analytics-debug';
import { useIsDev } from '~/hooks/use-is-dev';

const PIXEL_NAME = 'Facebook';

export function useFacebookAnalytics({id}: {id: string}) {
  const {register, subscribe} = useAnalytics();
  const isDev = useIsDev();
  const { debugTracking } = useAnalyticsEnv();
  const { debugInit, debugEvent } = useAnalyticsDebug();
  const initialized = useRef(false);
  const currentId = useRef<string>('');
  const {ready} = register(PIXEL_NAME);
  
  // Don't initialize analytics in development unless debug tracking is enabled
  const shouldInitialize = !isDev || debugTracking;
  
  useEffect(() => {
    // Skip if shouldn't initialize or no ID provided
    if (!shouldInitialize || !id) {
      debugInit(PIXEL_NAME, '');
      ready();
      return;
    }
    
    // Skip if already initialized with the same ID
    if (initialized.current && currentId.current === id) {
      return;
    }
    
    debugInit(PIXEL_NAME, id);
    
    ReactPixel.init(
      id,
      {},
      {
        autoConfig: true, // set pixel's autoConfig. More info: https://developers.facebook.com/docs/facebook-pixel/advanced/
        debug: debugTracking, // enable logs
      },
    );
    
    initialized.current = true;
    currentId.current = id;

    // Standard events
    subscribe('page_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'page_viewed', data);
    });
    subscribe('product_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'product_viewed', data);
      const p = data.products[0];
      const payload = {
        content_ids: [p.id],
        content_name: p.title,
        content_type: 'product',
      };
      ReactPixel.track('ViewContent', payload);
    });
    subscribe('collection_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'collection_viewed', data);
      const payload = {
        content_ids: [data.collection.id],
        content_type: 'product_group',
        contents: [{id: data.collection.id, handle: data.collection.handle}],
        ...data.customData,
      };
      ReactPixel.track('ViewContent', payload);
    });
    subscribe('cart_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'cart_viewed', data);
      // const payload = {
      //   value: data.cart?.cost?.totalAmount?.amount,
      //   currency: data.cart?.cost?.totalAmount?.currencyCode,
      //   contents: data.cart?.lines.nodes.map((line) => ({
      //     id: line.merchandise?.product.id,
      //     name: line.merchandise.product.title,
      //     price: line.merchandise.price.amount,
      //     quantity: line.quantity,
      //   })),
      //   content_type: 'product',
      //   ...data.customData,
      // };
      // window.fbq('trackCustom', 'ViewCart', payload);
    });
    subscribe('cart_updated', (data) => {
      debugEvent(PIXEL_NAME, 'cart_updated', data);
    });
    subscribe('product_added_to_cart', (data) => {
      const m = data?.currentLine?.merchandise;
      const p = m?.product;
      ReactPixel.track('AddToCart', {
        currency: m?.price?.currencyCode,
        value: getAddToCartValue(parseInt(m?.price?.amount ?? '0')),
        content_ids: [m?.id],
        content_name: p?.title,
        content_type: 'product',
        content: [{id: m?.id, quantity: data?.currentLine}],
      });
    });
    // Custom events
    subscribe('custom_newsletter_signup', (data) => {
      ReactPixel.track('Lead', {});
    });
    // Mark this analytics integration as ready as soon as it's done setting up
    ready();
  }, [shouldInitialize, id]);

  return null;
}

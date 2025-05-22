import {useAnalytics} from '@shopify/hydrogen';
import {useEffect} from 'react';
import ReactPixel from '~/lib/pixels/fb';
import {getAddToCartValue} from '~/lib/utils';

const PIXEL_NAME = 'Facebook';
function log(...args: any) {
  if (process.env.DEBUG_TRACKING) {
    console.log(PIXEL_NAME, ...args);
  }
}
export function useFacebookAnalytics({id}: {id: string}) {
  const {register, subscribe} = useAnalytics();
  const {ready} = register(PIXEL_NAME);
  useEffect(() => {
    ReactPixel.init(
      id,
      {},
      {
        autoConfig: true, // set pixel's autoConfig. More info: https://developers.facebook.com/docs/facebook-pixel/advanced/
        debug: !!process.env.DEBUG_TRACKING, // enable logs
      },
    );

    // Standard events
    subscribe('page_viewed', (data) => {
      log('Page viewed:', data);
    });
    subscribe('product_viewed', (data) => {
      log('Product viewed:', data);
      const p = data.products[0];
      const payload = {
        content_ids: [p.id],
        content_name: p.title,
        content_type: 'product',
      };
      ReactPixel.track('ViewContent', payload);
    });
    subscribe('collection_viewed', (data) => {
      log('Collection viewed:', data);
      const payload = {
        content_ids: [data.collection.id],
        content_type: 'product_group',
        contents: [{id: data.collection.id, handle: data.collection.handle}],
        ...data.customData,
      };
      ReactPixel.track('ViewContent', payload);
    });
    subscribe('cart_viewed', (data) => {
      log(' Cart viewed:', data);
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
      log('Cart updated:', data);
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
  }, []);

  return null;
}

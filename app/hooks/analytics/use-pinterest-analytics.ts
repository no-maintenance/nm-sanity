import {useAnalytics} from '@shopify/hydrogen';
import {useEffect} from 'react';
import ReactPinterest from '~/lib/pixels/pinterest';
const PIXEL_NAME = 'Pinterest';

function log(...args: any) {
  if (process.env.DEBUG_TRACKING) {
    console.log(PIXEL_NAME, ...args);
  }
}
export function usePinterestAnalytics({id}: {id: string}) {
  const {register, subscribe} = useAnalytics();
  const {ready} = register(PIXEL_NAME);
  useEffect(() => {
    ReactPinterest.init(id, '', {debug: !!process.env.DEBUG_TRACKING});
    const ts = new Date().toISOString();

    // Standard events
    subscribe('page_viewed', (data) => {
      log('Page viewed:', data);
      ReactPinterest.track('pagevisit', {event_id: `pageview--${ts}`});
    });
    subscribe('product_viewed', (data) => {
      log('Product viewed:', data);
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
      log('Collection viewed:', data);
    });
    subscribe('cart_viewed', (data) => {
      log(' Cart viewed:', data);
    });
    subscribe('cart_updated', (data) => {
      log('Cart updated:', data);
    });
    subscribe('product_added_to_cart', (data) => {
      log('Cart add to cart:', data);
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

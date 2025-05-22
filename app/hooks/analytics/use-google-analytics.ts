import {useAnalytics, useLoadScript} from '@shopify/hydrogen';
import ReactGA from 'react-ga4';
import React, {useEffect, useState} from 'react';

const PIXEL_NAME = 'GA4';
function log(...args: any) {
  if (process.env.DEBUG_TRACKING) {
    console.log(PIXEL_NAME, ...args);
  }
}
export function useGoogleAnalytics({id}: {id: string}) {
  const {subscribe, register, cart, canTrack} = useAnalytics();
  // unique string identifier
  const {ready} = register(PIXEL_NAME);
  useEffect(() => {
    log('Google Analytics Pixel');
    ReactGA.initialize([
      {
        trackingId: id,
        gaOptions: {
          debug_mode: !!process.env.DEBUG_TRACKING,
        },
      },
    ]);
    // Standard events
    subscribe('page_viewed', (data) => {
      log('Page viewed:', data);
    });
    subscribe('product_viewed', (data) => {
      log('Product viewed:', data);
      const payload = {
        items: data.products.map((product) => {
          const {
            id,
            title,
            price,
            variantTitle,
            vendor,
            quantity,
            ...otherProps
          } = product;
          return {
            item_id: id,
            item_name: title,
            price,
            item_variant: variantTitle,
            item_brand: vendor,
            quantity,
            ...otherProps,
          };
        }),
        ...data.customData,
      };
      ReactGA.event('view_item', payload);
    });
    subscribe('collection_viewed', (data) => {
      log('Collection viewed:', data);
      const payload = {
        item_list_id: data.collection.id,
        item_list_name: data.collection.handle,
        ...data.customData,
      };
      ReactGA.event('view_item_list', payload);
    });
    subscribe('cart_viewed', (data) => {
      log('Cart viewed:', data);
      const payload = {
        value: data.cart?.cost?.totalAmount?.amount,
        currency: data.cart?.cost?.totalAmount?.currencyCode,
        items: data.cart?.lines.nodes.map((line) => ({
          item_id: line.merchandise?.product.id,
          item_name: line.merchandise?.product.title,
          price: line.merchandise.price.amount,
          quantity: line.quantity,
          item_variant: line.merchandise.title,
        })),
        ...data.customData,
      };
      ReactGA.event('view_cart', payload);
    });
    subscribe('cart_updated', (data) => {
      log('Cart updated:', data);
    });
    subscribe('product_added_to_cart', (data) => {
      log('Cart add to cart:', data);
      log('GoogleAnalyticsPixel', 'product_added_to_cart');
      const payload = {
        value: data.currentLine?.cost?.totalAmount?.amount,
        currency: data.currentLine?.cost?.totalAmount?.currencyCode,
        items: [
          {
            item_id: data.currentLine?.merchandise?.product.id,
            item_name: data.currentLine?.merchandise?.product.title,
            price: data.currentLine?.merchandise.price.amount,
            quantity: data.currentLine?.quantity,
            item_variant: data.currentLine?.merchandise.title,
          },
        ],
        ...data.customData,
      };
      ReactGA.event('add_to_cart', payload);
    });
    subscribe('custom_newsletter_signup', (data) => {
      ReactGA.event('generate_lead', {lead_source: data.source});
    });

    // Mark this analytics integration as ready as soon as it's done setting up
    ready();
  }, []);

  return null;
}

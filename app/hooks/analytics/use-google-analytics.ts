import {useAnalytics, useLoadScript} from '@shopify/hydrogen';
import ReactGA from 'react-ga4';
import React, {useEffect, useState, useCallback, useRef} from 'react';
import { useAnalyticsEnv } from '~/hooks/use-analytics-env';
import { useAnalyticsDebug } from '~/hooks/use-analytics-debug';
import { useIsDev } from '~/hooks/use-is-dev';

const PIXEL_NAME = 'GA4';

export function useGoogleAnalytics({id}: {id: string}) {
  const {subscribe, register, cart, canTrack} = useAnalytics();
  const isDev = useIsDev();
  const { debugTracking } = useAnalyticsEnv();
  const { debugInit, debugEvent } = useAnalyticsDebug();
  const initialized = useRef(false);
  const currentId = useRef<string>('');
  const {ready} = register(PIXEL_NAME);
  
  // Don't initialize analytics in development unless debug tracking is enabled
  const shouldInitialize = !isDev || debugTracking;
  
  useEffect(() => {
    if (!shouldInitialize || !id) {
      ready();
      return;
    }
    ReactGA.initialize([
          {
            trackingId: id,
            gaOptions: {
              debug_mode: debugTracking,
            },
          },
        ]);
        
    initialized.current = true;
    currentId.current = id;
    // Standard events
    subscribe('page_viewed', (data) => {
      debugEvent(PIXEL_NAME, 'page_viewed', data);
    });
    subscribe('product_viewed', (data) => {
    debugEvent(PIXEL_NAME, 'product_viewed', data);
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
    debugEvent(PIXEL_NAME, 'collection_viewed', data);
    const payload = {
      item_list_id: data.collection.id,
      item_list_name: data.collection.handle,
      ...data.customData,
    };
    ReactGA.event('view_item_list', payload);
  });
  subscribe('cart_viewed', (data) => {
    debugEvent(PIXEL_NAME, 'cart_viewed', data);
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
    debugEvent(PIXEL_NAME, 'cart_updated', data);
  });
  subscribe('product_added_to_cart', (data) => {
    debugEvent(PIXEL_NAME, 'product_added_to_cart', data);
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

  ready();
  }, [shouldInitialize, id]);
  // useEffect(() => {
    
  //   // Skip if no ID provided
  //   if (!id) {
  //     debugInit(PIXEL_NAME, '');
  //     return;
  //   }
    
  //   // Skip if already initialized with the same ID
  //   if (initialized.current && currentId.current === id) {
  //     return;
  //   }
    
  //   debugInit(PIXEL_NAME, id);
    
  //
  

  return null;
}

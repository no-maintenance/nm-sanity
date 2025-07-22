declare global {
  interface Window {
    klaviyo?: Array<any>;
  }
}

import {useEffect, useRef} from 'react';
import {useAnalytics} from '@shopify/hydrogen';

// ---------------------------------------------------------------------------
// Helper: load Klaviyo.js once and opt-out of its automatic SPA page tracking
// ---------------------------------------------------------------------------
function useLoadKlaviyo(accountId: string, nonce?: string) {
  const loaded = useRef(false);

  useEffect(() => {
    if (!accountId || loaded.current || typeof document === 'undefined') return;

    // 1️⃣  Pre-bootstrap config – must run BEFORE the Klaviyo loader
    //     – set our account id
    //     – tell Klaviyo we will handle SPA page-view events manually
    //       so it will NOT patch history.pushState / replaceState.
    (window as any)._klOnsite = (window as any)._klOnsite || [];
    window._klOnsite.push(['account', accountId]);
    window._klOnsite.push(['spa', 'manual']);

    // 2️⃣  Inject the recommended klaviyo-object bootstrap (docs)
    const bootstrap = document.createElement('script');
    bootstrap.innerHTML = `
      !function(){if(!window.klaviyo){
        window._klOnsite=window._klOnsite||[];
        try{window.klaviyo=new Proxy({},{get:function(n,i){
          return"push"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}
          :function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];
            var t="function"==typeof o[o.length-1]?o.pop():void 0,
            e=new Promise(function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))});
            return e}}})}
        catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){
          var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();
    `;
    document.head.appendChild(bootstrap);

    // 3️⃣  Load the actual Klaviyo.js file
    const lib = document.createElement('script');
    lib.async = true;
    lib.src = `https://static.klaviyo.com/onsite/js/${accountId}/klaviyo.js`;
    if (nonce) lib.nonce = nonce;
    document.head.appendChild(lib);

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
    // make sure klaviyo object is available
    const kl = (window as any).klaviyo;
    if (!kl) return;

    subscribe('product_viewed', (data) => {
      const p = data.products[0];
      const item = {
        Name: p.title,
        ProductID: p.id.substring(p.id.lastIndexOf('/') + 1),
        ImageURL: p.image,
        Handle: p.handle,
        Brand: p.vendor,
        Price: p.price,
        Metadata: {
          Brand: p.vendor,
          Price: p.price,
          CompareAtPrice: p.compareAtPrice,
        },
      };
      kl.track?.('Viewed Product', item);
      kl.trackViewedItem?.(item);
    });

    subscribe('product_added_to_cart', (data) => {
      const curr = data.currentLine?.merchandise?.product;
      const newline = {
        $value: Number(data.currentLine?.cost.amountPerQuantity.amount ?? 0),
        AddedItemProductName: curr?.title,
        AddedItemProductID: curr?.id.substring(curr?.id.lastIndexOf('/') + 1),
        AddedItemImageURL: data.currentLine?.merchandise?.image?.url,
        AddedItemURL: `https://nomaintenance.us/products/${curr?.handle ?? ''}`,
        Handle: curr?.handle,
        Brand: curr?.vendor,
        AddedItemQuantity: 1,
        AddedItemPrice: Number(
          data.currentLine?.cost.amountPerQuantity.amount ?? 0,
        ),
        CheckoutURL: data?.cart?.checkoutUrl,
        ...data.customData,
      };
      const payload = {
        ...newline,
        Items: data.cart?.lines.nodes.map((i) => ({
          ProductID: i.id,
          ProductName: i?.merchandise?.product?.title,
          Quantity: i.quantity,
          ItemPrice: Number(i.cost.amountPerQuantity.amount),
          RowTotal: Number(i.cost.totalAmount.amount),
          ProductURL: `https://nomaintenance.us/products/${i.merchandise.product.handle}`,
          ImageURL: i.merchandise.image?.url,
        })),
      };
      kl.track?.('Added to Cart', payload);
    });

    // Other hooks (collection_viewed, cart_viewed, etc.) can be added here

    ready();
  }, [subscribe, ready]);

  return null; // no DOM output
}


export function useKlaviyoAnalytics({id, nonce}: {id: string; nonce?: string}) {
  const {register, subscribe} = useAnalytics();
  const {ready} = register('Klaviyo');
  const initialized = useRef(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Skip if no ID or already initialized
    if (!id || initialized.current) return;

    
    const scriptUrl = `//static.klaviyo.com/onsite/js/RDT3xD/klaviyo.js`;
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src*="${id}/klaviyo.js"]`);
    
    if (existingScript || scriptLoaded.current) {
      // Script already exists, proceed with initialization
      // initializeKlaviyo();
    } else {
      // Load the script
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      if (nonce) script.nonce = nonce;
      
      script.onload = () => {
        scriptLoaded.current = true;
        // initializeKlaviyo();
      };
      
      script.onerror = () => {
        console.error('Failed to load Klaviyo script');
        ready(); // Still mark as ready to prevent blocking other analytics
      };
      
      document.head.appendChild(script);
    }

    function initializeKlaviyo() {
      if (initialized.current) return;
      
      const klaviyo = window.klaviyo || [];
      
      subscribe('product_viewed', (data) => {
        const product = data.products[0];
        const item = {
          Name: product.title,
          ProductID: product.id.substring(product.id.lastIndexOf('/') + 1),
          ImageURL: product.image,
          Handle: product.handle,
          Brand: product.vendor,
          Price: product.price,
          Metadata: {
            Brand: product.vendor,
            Price: product.price,
            CompareAtPrice: product.compareAtPrice,
          },
        };
        klaviyo.push(['track', 'Viewed Product', item]);
        klaviyo.push(['trackViewedItem', item]);
      });
      
      subscribe('product_added_to_cart', (data) => {
        const curr = data.currentLine?.merchandise?.product;
        const newline = {
          $value: parseInt(data.currentLine?.cost.amountPerQuantity.amount ?? ''),
          AddedItemProductName: curr?.title,
          AddedItemProductID: curr?.id.substring(curr?.id.lastIndexOf('/') + 1),
          AddedItemImageURL: data.currentLine?.merchandise?.image?.url,
          AddedItemURL: `https://nomaintenance.us/products/${curr?.handle ?? ''}`,
          Handle: curr?.handle,
          Brand: curr?.vendor,
          AddedItemQuantity: 1,
          AddedItemPrice: parseInt(
            data.currentLine?.cost.amountPerQuantity.amount ?? '0',
          ),
          CheckoutURL: data?.cart?.checkoutUrl,
          ...data.customData,
        };
        const payload = {
          ...newline,
          Items: data.cart?.lines.nodes.map((i) => ({
            ProductID: i.id,
            ProductName: i?.merchandise?.product?.title,
            Quantity: i.quantity,
            ItemPrice: parseInt(i.cost.amountPerQuantity.amount),
            RowTotal: parseInt(i.cost.totalAmount.amount),
            ProductURL: `https://nomaintenance.us/products/${i.merchandise.product.handle}`,
            ImageURL: i.merchandise.image?.url,
          })),
        };
        klaviyo.push(['track', 'Added to Cart', payload]);
      });
      
      subscribe('collection_viewed', (data) => {});
      subscribe('cart_viewed', (data) => {});
      subscribe('custom_newsletter_signup', (data) => {});
      
      ready();
      initialized.current = true;
    }

    // Cleanup function
    return () => {
      // Remove script if component unmounts
      const script = document.querySelector(`script[src*="${id}/klaviyo.js"]`);
      if (script) {
        script.remove();
      }
    };
  }, []);
}

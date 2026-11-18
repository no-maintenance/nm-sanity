declare global {
  interface Window {
    klaviyo?: any;
    _klOnsite?: Array<any>;
  }
}

import {useEffect, useRef} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import { useAnalyticsDebug } from '~/hooks/use-analytics-debug';

// ---------------------------------------------------------------------------
// Keep Klaviyo's own "Popup Newsletter" onsite form from showing. The site's
// branded signup popup (SignupOverlay, auto-opens for new visitors) replaces
// it, and two popups a second apart would be a mess.
//
// Klaviyo's onsite script keeps a per-form "last closed" time in
// localStorage['klaviyoOnsite'] and skips a form until its "don't show again
// for N days" window has passed. Seeding that time far in the future (before
// klaviyo.js loads) makes it skip the form every time. Verified against the
// live site: with this seeded the form never renders. If Klaviyo changes its
// storage layout this quietly stops working — the form should also be turned
// off (unpublished) in Klaviyo > Sign-up forms, which is the real fix.
// ---------------------------------------------------------------------------
const REPLACED_KLAVIYO_FORM_ID = 'Rc2Qwz';
const KLAVIYO_ONSITE_STORAGE_KEY = 'klaviyoOnsite';
const FAR_FUTURE_UNIX_SECONDS = 4102444800; // 2100-01-01

function suppressReplacedKlaviyoForm() {
  try {
    const raw = window.localStorage.getItem(KLAVIYO_ONSITE_STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    const viewed = (store.viewedForms ??= {});
    const modal = (viewed.modal ??= {
      disabledForms: {},
      disabledTeasers: {},
      viewedForms: {},
    });
    const disabled = (modal.disabledForms ??= {});
    disabled[REPLACED_KLAVIYO_FORM_ID] = {
      ...disabled[REPLACED_KLAVIYO_FORM_ID],
      lastCloseTime: FAR_FUTURE_UNIX_SECONDS,
    };
    window.localStorage.setItem(KLAVIYO_ONSITE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage blocked or unparseable — Klaviyo will behave as before.
  }
}

// ---------------------------------------------------------------------------
// Simplified Klaviyo loader without SPA manual mode
// ---------------------------------------------------------------------------
function useLoadKlaviyo(accountId: string, nonce?: string) {
  const loaded = useRef(false);

  useEffect(() => {
    if (!accountId || loaded.current || typeof document === 'undefined') return;

    // Must run before klaviyo.js reads its storage.
    suppressReplacedKlaviyoForm();

    // Initialize the queue
    window._klOnsite = window._klOnsite || [];
    window._klOnsite.push(['account', accountId]);

    // Load script directly without manual SPA mode
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://static.klaviyo.com/onsite/js/${accountId}/klaviyo.js`;
    if (nonce) script.nonce = nonce;
    script.onload = () => {
      // Script loaded successfully - only log in debug mode
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
  const { debugEvent } = useAnalyticsDebug();

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
        
        debugEvent('Klaviyo', 'product_viewed', item);
        window._klOnsite.push(['track', 'Viewed Product', item]);
        window._klOnsite.push(['trackViewedItem', item]);
      });

      const unsubscribeAddedToCart = subscribe('product_added_to_cart', (data) => {
        if (!window._klOnsite) return;
        
        const curr = data.currentLine?.merchandise?.product;
        const item = {
          // $value: Number(data.currentLine?.cost.amountPerQuantity.amount ?? 0),
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
        
        debugEvent('Klaviyo', 'product_added_to_cart', item);
        window._klOnsite.push(['track', 'Added to Cart', item]);
      });

    ready();
  }, [id, subscribe, ready]);

  return null;
}



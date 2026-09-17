import {createContext, useContext} from 'react';

/**
 * True only inside the PDP purchase panel (the sticky title/price/add-to-cart
 * summary). The title→color / brand→name swap applies ONLY there. Everywhere
 * else these blocks can appear (Featured Product sections on the homepage /
 * collection pages, accordion bodies) they keep the original behavior:
 * full product title + "No Maintenance" brand.
 */
export const PurchasePanelContext = createContext(false);

export const useIsPurchasePanel = () => useContext(PurchasePanelContext);

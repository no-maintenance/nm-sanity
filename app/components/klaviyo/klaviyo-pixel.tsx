import {Script, useAnalytics} from '@shopify/hydrogen';
import {useEffect} from 'react';

export function KlaviyoPixel({id, nonce}: {id: string; nonce?: string}) {
  const {register, subscribe} = useAnalytics();
  const {ready} = register('Klaviyo');
  // const scriptStatus = useLoadScript(
  //   `//static.klaviyo.com/onsite/js/${id}/klaviyo.js`,
  // );

  useEffect(() => {
    // if (scriptStatus !== 'done') return;
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
    subscribe('collection_viewed', (data) => {});
    subscribe('cart_viewed', (data) => {});
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
    subscribe('custom_newsletter_signup', (data) => {});
    ready();
  }, []);
  return (
    <Script
      async
      nonce={nonce}
      type="text/javascript"
      src={`//static.klaviyo.com/onsite/js/${id}/klaviyo.js`}
    />
  );
}

import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import type {PRODUCT_QUERYResult} from 'types/sanity/sanity.generated';
import type {ProductQuery} from 'types/shopify/storefrontapi.generated';

import {useLoaderData} from '@remix-run/react';
import {Analytics, CacheNone, getSelectedProductOptions} from '@shopify/hydrogen';
import {ProductProvider} from '@shopify/hydrogen-react';
import {DEFAULT_LOCALE} from 'countries';
import invariant from 'tiny-invariant';

import {CmsSection} from '~/components/cms-section';
import {PRODUCT_QUERY as CMS_PRODUCT_QUERY} from '~/data/sanity/queries';
import {PRODUCT_QUERY, VARIANTS_QUERY} from '~/data/shopify/queries';
import {requireUnprotectedAccess} from '~/lib/guards/site-protection.server';
import {mergeMeta} from '~/lib/meta';
import {resolveShopifyPromises} from '~/lib/resolve-shopify-promises';
import {getSeoMetaFromMatches} from '~/lib/seo';
import {seoPayload} from '~/lib/seo.server';

export const meta: MetaFunction<typeof loader> = mergeMeta(({matches}) =>
  getSeoMetaFromMatches(matches),
);

export async function loader({context, params, request}: LoaderFunctionArgs) {
  // Check if site is protected
  await requireUnprotectedAccess(context, request);

  const {productHandle} = params;
  const {locale, sanity, storefront} = context;
  const language = locale?.language.toLowerCase();

  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request);

  const queryParams = {
    defaultLanguage: DEFAULT_LOCALE.language.toLowerCase(),
    language,
    productHandle,
  };

  const productData = Promise.all([
    sanity.loadQuery<PRODUCT_QUERYResult>(CMS_PRODUCT_QUERY, queryParams),
    storefront.query<ProductQuery>(PRODUCT_QUERY, {
      variables: {
        country: storefront.i18n.country,
        handle: productHandle,
        language: storefront.i18n.language,
        selectedOptions,
      },
    }),
  ]);

  const [cmsProduct, shopifyProduct] = await productData;
  let {product} = shopifyProduct;

  // A freshly-published product can briefly be absent from the cached Storefront
  // response. Before giving up, retry the query uncached so newly-launched
  // products don't intermittently render "not found" while caches warm up.
  if (!product?.id) {
    const fresh = await storefront.query<ProductQuery>(PRODUCT_QUERY, {
      cache: CacheNone(),
      variables: {
        country: storefront.i18n.country,
        handle: productHandle,
        language: storefront.i18n.language,
        selectedOptions,
      },
    });
    product = fresh.product;
  }

  // Only a genuinely missing Shopify product is a 404. A momentarily-missing CMS
  // document (e.g. Sanity CDN lag right after a publish) must NOT 404 — the page
  // falls back to the default product template so the product still renders.
  if (!product?.id) {
    throw new Response('product', {status: 404});
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deferred query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: {
      country: storefront.i18n.country,
      handle: productHandle,
      language: storefront.i18n.language,
    },
  });

  const {
    collectionListPromise,
    featuredCollectionPromise,
    featuredProductPromise,
    relatedProductsPromise,
  } = resolveShopifyPromises({
    document: cmsProduct,
    productId: product.id,
    request,
    storefront,
  });

  const seo = seoPayload.product({
    product,
    selectedVariant: product.variants.nodes[0],
    url: request.url,
  });

  return {
    cmsProduct,
    collectionListPromise,
    featuredCollectionPromise,
    featuredProductPromise,
    product: {
      ...product,
      sizeChart: cmsProduct?.data?.product?.sizeChart,
      extraProductInformation: cmsProduct?.data?.product?.extraProductInformation,
    },
    relatedProductsPromise,
    seo,
    variants,
  };
}

export default function Product() {
  const {cmsProduct, product} = useLoaderData<typeof loader>();
  const data = cmsProduct?.data;

  const template = data?.product?.template || data?.defaultProductTemplate;
  const selectedVariant = product.variants.nodes[0];

  return (
    <ProductProvider data={product}>
      {template?.sections &&
        template.sections.length > 0 &&
        template.sections.map((section, index) => (
          <CmsSection data={section} index={index} key={section._key} />
        ))}
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              price: selectedVariant?.price.amount || '0',
              quantity: 1,
              title: product.title,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              vendor: product.vendor,
            },
          ],
        }}
      />
    </ProductProvider>
  );
}

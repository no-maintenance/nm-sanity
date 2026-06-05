import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import type {CollectionProductGridQuery} from 'types/shopify/storefrontapi.generated';

import {json} from '@shopify/remix-oxygen';

import {COLLECTION_PRODUCT_GRID_QUERY} from '~/data/shopify/queries';
import {getFiltersFromParam} from '~/lib/shopify-collection';

/**
 * Plain JSON endpoint used by the collection grid's infinite scroll.
 * We fetch this directly with `fetch()` instead of relying on Remix
 * navigation/single-fetch pagination, which currently hangs on same-route
 * (cursor-only) revalidations in this Hydrogen version.
 */
export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const collectionId = searchParams.get('collectionId');
  const cursor = searchParams.get('cursor');
  const first = Number(searchParams.get('first') || 8);

  if (!collectionId) {
    return json({
      nodes: [],
      pageInfo: {endCursor: null, hasNextPage: false},
    });
  }

  const {filters, reverse, sortKey} = getFiltersFromParam(searchParams);

  const {collection} = await storefront.query<CollectionProductGridQuery>(
    COLLECTION_PRODUCT_GRID_QUERY,
    {
      variables: {
        country: storefront.i18n.country,
        endCursor: cursor || null,
        filters,
        first,
        id: collectionId,
        language: storefront.i18n.language,
        last: null,
        reverse,
        sortKey,
        startCursor: null,
      },
    },
  );

  return json({
    nodes: collection?.products.nodes ?? [],
    pageInfo: collection?.products.pageInfo ?? {
      endCursor: null,
      hasNextPage: false,
    },
  });
}

import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import type {
  NormalizedPredictiveSearch,
  NormalizedPredictiveSearchResults,
} from '~/components/search';
import {NO_PREDICTIVE_SEARCH_RESULTS} from '~/components/search';
import {applyTrackingParams} from '~/lib/search';

import type {
  PredictiveCollectionFragment,
  PredictiveProductFragment,
  PredictiveQueryFragment,
  PredictiveSearchQuery,
  ProductCardFragment,
} from 'types/shopify/storefrontapi.generated';
import { PREDICTIVE_SEARCH_QUERY } from '~/data/shopify/queries';

type PredictiveSearchTypes =
  | 'ARTICLE'
  | 'COLLECTION'
  | 'PAGE'
  | 'PRODUCT'
  | 'QUERY';

const DEFAULT_SEARCH_TYPES: PredictiveSearchTypes[] = [
  'ARTICLE',
  'COLLECTION',
  'PAGE',
  'PRODUCT',
  'QUERY',
];

/**
 * Fetches the search results from the predictive search API
 * requested by the SearchForm component
 */
export async function loader({request, params, context}: LoaderFunctionArgs) {
  const search = await fetchPredictiveSearchResults({
    params,
    request,
    context,
  });

  return json(search, {
    headers: {'Cache-Control': `max-age=${search.searchTerm ? 60 : 3600}`},
  });
}

async function fetchPredictiveSearchResults({
  params,
  request,
  context,
}: Pick<LoaderFunctionArgs, 'params' | 'context' | 'request'>) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const searchTerm = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || 10);
  const rawTypes = String(searchParams.get('type') || 'ANY');

  const searchTypes =
    rawTypes === 'ANY'
      ? DEFAULT_SEARCH_TYPES
      : rawTypes
          .split(',')
          .map((t) => t.toUpperCase() as PredictiveSearchTypes)
          .filter((t) => DEFAULT_SEARCH_TYPES.includes(t));

  if (!searchTerm) {
    return {
      searchResults: {results: null, totalResults: 0},
      searchTerm,
      searchTypes,
    };
  }

  const data = await context.storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      limit,
      limitScope: 'EACH',
      searchTerm,
      types: searchTypes,
    },
  });

  if (!data) {
    throw new Error('No data returned from Shopify API');
  }

  const searchResults = normalizePredictiveSearchResults(
    data.predictiveSearch,
    params.locale,
  );

  return {searchResults, searchTerm, searchTypes};
}

/**
 * Normalize results and apply tracking qurery parameters to each result url
 */
export function normalizePredictiveSearchResults(
  predictiveSearch: PredictiveSearchQuery['predictiveSearch'],
  locale: LoaderFunctionArgs['params']['locale'],
): NormalizedPredictiveSearch {
  let totalResults = 0;
  if (!predictiveSearch) {
    return {
      results: NO_PREDICTIVE_SEARCH_RESULTS,
      totalResults,
    };
  }

  const localePrefix = locale ? `/${locale}` : '';
  const results: NormalizedPredictiveSearchResults = [];

  if (predictiveSearch.queries.length) {
    results.push({
      type: 'queries',
      items: predictiveSearch.queries.map((query: PredictiveQueryFragment) => {
        const trackingParams = applyTrackingParams(
          query,
          `q=${encodeURIComponent(query.text)}`,
        );

        totalResults++;
        return {
          __typename: query.__typename,
          handle: '',
          id: query.text,
          image: undefined,
          title: query.text,
          styledTitle: query.styledText,
          url: `${localePrefix}/search${trackingParams}`,
        };
      }),
    });
  }

  if (predictiveSearch.products.length) {
    results.push({
      type: 'products',
      items: predictiveSearch.products.map(
        (product) => {
          totalResults++;
          const trackingParams = applyTrackingParams(product);
          
          // Extract images from media if available, fallback to variant image
          const productWithMedia = product as any; // Temporarily use any since types haven't been regenerated
          const mediaImages = productWithMedia.media?.nodes
            ?.map((node: any) => node.image)
            ?.filter(Boolean) || [];
          const firstVariant = product.variants?.nodes?.[0];
          const primaryImage = mediaImages[0] || firstVariant?.image;
          
          return {
            __typename: product.__typename,
            handle: product.handle,
            id: product.id,
            image: primaryImage,
            title: product.title,
            url: `${localePrefix}/products/${product.handle}${trackingParams}`,
            price: firstVariant?.price,
          };
        },
      ),
    });
  }

  if (predictiveSearch.collections.length) {
    results.push({
      type: 'collections',
      items: predictiveSearch.collections.map(
        (collection: PredictiveCollectionFragment) => {
          totalResults++;
          const trackingParams = applyTrackingParams(collection);
          return {
            __typename: collection.__typename,
            handle: collection.handle,
            id: collection.id,
            image: collection.image,
            title: collection.title,
            url: `${localePrefix}/collections/${collection.handle}${trackingParams}`,
          };
        },
      ),
    });
  }

  return {results, totalResults};
}

import type {
  ProductCollectionSortKeys,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';
import type {I18nLocale} from 'types';

import type {ShopifyCollection} from '~/components/sections/collection-product-grid-section';

import {
  FILTER_URL_PREFIX,
  type SortParam,
} from '~/components/collection/sort-filter-layout';

import {parseAsCurrency} from './utils';

export const AVAILABLE_SIZE_URL_PARAM = 'size';
export const SIZE_VARIANT_OPTION_NAME = 'Size';

// Size values that should never appear in the "Available Size" filter.
const EXCLUDED_SIZES = new Set([
  'xx-small',
  'xxsmall',
  'os',
  'one size',
  'onesize',
]);

function isExcludedSize(value: string): boolean {
  return EXCLUDED_SIZES.has(value.toLowerCase().trim());
}

// Hydrogen's <Pagination> adds these to the URL on load-more; when filters
// change we want to start over from page 1 instead of inheriting a stale
// cursor from the unfiltered result set.
const PAGINATION_PARAMS = ['direction', 'cursor'] as const;

export function stripPaginationParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of PAGINATION_PARAMS) next.delete(key);
  return next;
}

type SizesQueryResult = {
  collection?: {
    products: {
      nodes: Array<{
        variants: {
          nodes: Array<{
            availableForSale: boolean;
            selectedOptions: Array<{name: string; value: string}>;
          }>;
        };
      }>;
    };
  } | null;
} | null;

export function getAvailableSizes(result: SizesQueryResult): string[] {
  const products = result?.collection?.products.nodes;
  if (!products) return [];
  const sizes = new Set<string>();
  for (const product of products) {
    for (const variant of product.variants.nodes) {
      if (!variant.availableForSale) continue;
      for (const option of variant.selectedOptions) {
        if (
          option.name === SIZE_VARIANT_OPTION_NAME &&
          option.value &&
          !isExcludedSize(option.value)
        ) {
          sizes.add(option.value);
        }
      }
    }
  }
  return Array.from(sizes);
}

export function getFiltersFromParam(searchParams: URLSearchParams) {
  const {reverse, sortKey} = getSortValuesFromParam(
    searchParams.get('sort') as SortParam,
  );

  const filters = [...searchParams.entries()].reduce(
    (filters, [key, value]) => {
      if (key.startsWith(FILTER_URL_PREFIX)) {
        const filterKey = key.substring(FILTER_URL_PREFIX.length);
        filters.push({
          [filterKey]: JSON.parse(value),
        });
      }
      return filters;
    },
    [] as ProductFilter[],
  );

  const size = searchParams.get(AVAILABLE_SIZE_URL_PARAM);
  if (size) {
    filters.push({
      variantOption: {
        name: SIZE_VARIANT_OPTION_NAME,
        value: size,
      },
    });
    filters.push({available: true});
  }

  return {
    filters,
    reverse,
    sortKey,
  };
}

export function getAppliedFilters({
  collection,
  locale,
  searchParams,
}: {
  collection?: ShopifyCollection;
  locale?: I18nLocale;
  searchParams: URLSearchParams;
}) {
  if (!locale || !collection) {
    return [];
  }

  const {filters} = getFiltersFromParam(searchParams);

  const allFilterValues = collection?.products.filters.flatMap(
    (filter) => filter.values,
  );

  return filters
    .map((filter) => {
      // Size filter is rendered via a custom section, not from collection.products.filters
      if (filter.variantOption?.name === SIZE_VARIANT_OPTION_NAME) {
        return {
          filter,
          label: filter.variantOption.value,
        };
      }
      // The companion {available: true} filter is paired with size; skip its chip
      if (
        filter.available !== undefined &&
        Object.keys(filter).length === 1 &&
        searchParams.get(AVAILABLE_SIZE_URL_PARAM)
      ) {
        return null;
      }
      const foundValue = allFilterValues?.find((value) => {
        const valueInput = JSON.parse(value.input as string) as ProductFilter;
        // special case for price, the user can enter something freeform (still a number, though)
        // that may not make sense for the locale/currency.
        // Basically just check if the price filter is applied at all.
        if (valueInput.price && filter.price) {
          return true;
        }
        return (
          // This comparison should be okay as long as we're not manipulating the input we
          // get from the API before using it as a URL param.
          JSON.stringify(valueInput) === JSON.stringify(filter)
        );
      });
      if (!foundValue) {
        console.error('Could not find filter value for filter', filter);
        return null;
      }

      if (foundValue.id === 'filter.v.price') {
        // Special case for price, we want to show the min and max values as the label.
        const input = JSON.parse(foundValue.input as string) as ProductFilter;
        const min = parseAsCurrency(input.price?.min ?? 0, locale);
        const max = input.price?.max
          ? parseAsCurrency(input.price.max, locale)
          : '';
        const label = min && max ? `${min} - ${max}` : 'Price';

        return {
          filter,
          label,
        };
      }
      return {
        filter,
        label: foundValue.label,
      };
    })
    .filter((filter): filter is NonNullable<typeof filter> => filter !== null);
}

export function getSortValuesFromParam(sortParam: null | SortParam): {
  reverse: boolean;
  sortKey: ProductCollectionSortKeys;
} {
  switch (sortParam) {
    case 'best-selling':
      return {
        reverse: false,
        sortKey: 'BEST_SELLING',
      };
    case 'featured':
      return {
        reverse: false,
        sortKey: 'MANUAL',
      };
    case 'newest':
      return {
        reverse: true,
        sortKey: 'CREATED',
      };
    case 'price-high-low':
      return {
        reverse: true,
        sortKey: 'PRICE',
      };
    case 'price-low-high':
      return {
        reverse: false,
        sortKey: 'PRICE',
      };
    default:
      return {
        reverse: false,
        sortKey: 'RELEVANCE',
      };
  }
}

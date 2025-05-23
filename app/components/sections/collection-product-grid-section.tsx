import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import type {SectionDefaultProps, SectionOfType} from 'types';
import type {
  CollectionProductGridQuery,
  ProductCardFragment,
} from 'types/shopify/storefrontapi.generated';

import {
  Await,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';
import {Pagination} from '@shopify/hydrogen';
import {Suspense, useCallback, useEffect, useMemo, useState} from 'react';

import type {loader} from '~/routes/($locale).collections.$collectionHandle';

import {useOptimisticNavigationData} from '~/hooks/use-optimistic-navigation-data';
import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';
import {getAppliedFilters} from '~/lib/shopify-collection';
import {cn} from '~/lib/utils';
import {useRootLoaderData} from '~/root';

import type {AppliedFilter} from '../collection/sort-filter-layout';

import {SortFilter} from '../collection/sort-filter-layout';
import {ProductCardGrid} from '../product/product-card-grid';
import {Skeleton} from '../skeleton';
import {Button} from '../ui/button';
import {useInView} from '~/hooks/use-in-view';

type CollectionProductGridSectionProps =
  SectionOfType<'collectionProductGridSection'>;

export type ShopifyCollection = CollectionProductGridQuery['collection'];

export function CollectionProductGridSection(
  props: SectionDefaultProps & {data: CollectionProductGridSectionProps},
) {
  const {locale} = useRootLoaderData();
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const collectionProductGridPromise = loaderData?.collectionProductGridPromise;
  const columns = props.data.desktopColumns;
  const mobileColumns = props.data.mobileColumns;
  const {themeContent} = useSanityThemeContent();

  const handleClearFilters = useCallback(() => {
    navigate(pathname, {
      preventScrollReset: true,
      replace: true,
      // Set optimistic data to clear all filters
      state: {
        optimisticData: true,
        optimisticId: 'clear-all-filters',
      },
    });
  }, [navigate, pathname]);

  const CollectionProductGridSkeleton = useMemo(() => {
    return (
      <div className="container">
        <SortFilter
          filters={[]}
          onClearAllFilters={handleClearFilters}
          productsCount={0}
          sectionSettings={props.data.settings}
        >
          <div className="mt-6">
            <ProductCardGrid
              columns={{
                desktop: columns,
                mobile: mobileColumns,
              }}
              skeleton={{
                cardsNumber: props.data.productsPerPage || 3,
              }}
            />
          </div>
        </SortFilter>
      </div>
    );
  }, [
    columns,
    handleClearFilters,
    mobileColumns,
    props.data.productsPerPage,
    props.data.settings,
  ]);

  return (
    <Suspense fallback={<Skeleton>{CollectionProductGridSkeleton}</Skeleton>}>
      <Await
        errorElement={
          <Skeleton isError>{CollectionProductGridSkeleton}</Skeleton>
        }
        resolve={collectionProductGridPromise}
      >
        {(result) => {
          const collection = result?.collection as ShopifyCollection;

          if (!collection) {
            return null;
          }

          const appliedFilters = getAppliedFilters({
            collection,
            locale,
            searchParams,
          });

          // Todo => add enableFiltering and enableSorting settings
          return (
            <div className="container">
              <SortFilter
                appliedFilters={appliedFilters}
                filters={collection?.products.filters as Filter[]}
                onClearAllFilters={handleClearFilters}
                productsCount={collection?.products.nodes.length}
                sectionSettings={props.data.settings}
              >
                <Pagination connection={collection?.products}>
                  {({
                    hasNextPage,
                    isLoading,
                    NextLink,
                    nextPageUrl,
                    nodes,
                    PreviousLink,
                    state,
                  }) => (
                    <>
                      <div className="mb-6 flex items-center justify-center">
                        <PreviousLink>
                          {isLoading
                            ? themeContent?.collection?.loading
                            : themeContent?.collection?.loadPrevious}
                        </PreviousLink>
                      </div>
                      <ProductsLoadedOnScroll
                        appliedFilters={appliedFilters}
                        columns={{
                          desktop: columns,
                          mobile: mobileColumns,
                        }}
                        hasNextPage={hasNextPage}
                        inView={true}
                        nextPageUrl={nextPageUrl}
                        nodes={nodes}
                        onClearAllFilters={handleClearFilters}
                        state={state}
                      />
                      <div className="mt-6 flex items-center justify-center">
                        <NextLink>
                          {isLoading
                            ? themeContent?.collection?.loading
                            : themeContent?.collection?.loadMoreProducts}
                        </NextLink>
                      </div>
                    </>
                  )}
                </Pagination>
              </SortFilter>
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}

function ProductsLoadedOnScroll({
  appliedFilters,
  columns,
  hasNextPage,
  nextPageUrl,
  nodes,
  onClearAllFilters,
  state,
}: {
  appliedFilters?: AppliedFilter[];
  columns?: {
    desktop?: null | number;
    mobile?: null | number;
  };
  hasNextPage: boolean;
  inView: boolean;
  nextPageUrl: string;
  nodes: ProductCardFragment[];
  onClearAllFilters: () => void;
  state: unknown;
}) {
  const navigate = useNavigate();
  const {pending} = useOptimisticNavigationData<boolean>('clear-all-filters');
  const {themeContent} = useSanityThemeContent();
  const [nextRef, nextInView] = useInView<HTMLDivElement>({ rootMargin: '200px' });
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (nextInView && hasNextPage && !hasTriggered) {
      setHasTriggered(true);
      navigate(nextPageUrl, {
        preventScrollReset: true,
        replace: true,
        state,
      });
    } else if (!nextInView) {
      setHasTriggered(false);
    }
  }, [nextInView, hasNextPage, nextPageUrl, navigate, state, hasTriggered]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col justify-center text-center">
        <p>{themeContent?.collection?.noProductFound}</p>
        {appliedFilters && appliedFilters.length > 0 && (
          <Button
            className={cn([
              'mx-auto mt-4 flex w-max items-center gap-1',
              pending && 'pointer-events-none animate-pulse delay-500',
            ])}
            onClick={onClearAllFilters}
            variant="secondary"
          >
            <span>{themeContent?.collection?.clearFilters}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <ProductCardGrid
        columns={{
          desktop: columns?.desktop,
          mobile: columns?.mobile,
        }}
        products={nodes}
      />
      <div className="mt-6 flex items-center justify-center" ref={nextRef}>
        {/* This wrapper is observed for inView to trigger next page load */}
      </div>
    </>
  );
}

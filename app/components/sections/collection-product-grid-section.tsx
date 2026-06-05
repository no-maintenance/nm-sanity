import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import type {SectionDefaultProps, SectionOfType} from 'types';
import type {
  CollectionProductGridQuery,
  ProductCardFragment,
} from 'types/shopify/storefrontapi.generated';

import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';
import {Await} from '@remix-run/react';
import {Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import type {loader} from '~/routes/($locale).collections.$collectionHandle';

import {useInView} from '~/hooks/use-in-view';
import {useLocalePath} from '~/hooks/use-locale-path';
import {useOptimisticNavigationData} from '~/hooks/use-optimistic-navigation-data';
import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';
import {getAppliedFilters, getAvailableSizes} from '~/lib/shopify-collection';
import {cn} from '~/lib/utils';
import {useRootLoaderData} from '~/root';

import type {AppliedFilter} from '../collection/sort-filter-layout';

import {sortSizes} from '../collection/available-size-filter';
import {CollectionMobileNav} from '../collection/collection-mobile-nav';
import {SortFilter} from '../collection/sort-filter-layout';
import {ProductCardGrid} from '../product/product-card-grid';
import {Skeleton} from '../skeleton';
import {Button} from '../ui/button';

type CollectionProductGridSectionProps =
  SectionOfType<'collectionProductGridSection'>;

export type ShopifyCollection = CollectionProductGridQuery['collection'];

type PageInfo = {endCursor?: null | string; hasNextPage?: boolean};

export function CollectionProductGridSection(
  props: SectionDefaultProps & {data: CollectionProductGridSectionProps},
) {
  const {locale} = useRootLoaderData();
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const collectionProductGridPromise = loaderData?.collectionProductGridPromise;
  const collectionSizesPromise = loaderData?.collectionSizesPromise;
  const combinedPromise = useMemo(
    () =>
      Promise.all([
        collectionProductGridPromise,
        collectionSizesPromise,
      ] as const),
    [collectionProductGridPromise, collectionSizesPromise],
  );
  const columns = props.data.desktopColumns;
  const mobileColumns = props.data.mobileColumns;
  const productsPerPage = props.data.productsPerPage || 8;

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
      <div className="container -mt-[calc(var(--paddingTop)*0.75)] sm:-mt-[var(--paddingTop)]">
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
                cardsNumber: productsPerPage || 3,
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
    productsPerPage,
    props.data.settings,
  ]);

  return (
    <Suspense fallback={<Skeleton>{CollectionProductGridSkeleton}</Skeleton>}>
      <Await
        errorElement={
          <Skeleton isError>{CollectionProductGridSkeleton}</Skeleton>
        }
        resolve={combinedPromise}
      >
        {([result, sizesResult]) => {
          const collection = result?.collection as ShopifyCollection;

          if (!collection) {
            return null;
          }

          const appliedFilters = getAppliedFilters({
            collection,
            locale,
            searchParams,
          });

          const availableSizes = sortSizes(getAvailableSizes(sizesResult));

          return (
            <>
              <CollectionMobileNav
                appliedFilters={appliedFilters}
                availableSizes={availableSizes}
                filters={collection?.products.filters as Filter[]}
                menu={loaderData?.mobileCategoriesMenu}
                onClearAllFilters={handleClearFilters}
                productsCount={collection?.products.nodes.length}
              />
              <div className="container">
                <SortFilter
                  appliedFilters={appliedFilters}
                  availableSizes={availableSizes}
                  filters={collection?.products.filters as Filter[]}
                  onClearAllFilters={handleClearFilters}
                  productsCount={collection?.products.nodes.length}
                  sectionSettings={props.data.settings}
                >
                  <InfiniteProducts
                    appliedFilters={appliedFilters}
                    collectionId={collection.id}
                    columns={{desktop: columns, mobile: mobileColumns}}
                    initialNodes={collection.products.nodes}
                    initialPageInfo={collection.products.pageInfo}
                    onClearAllFilters={handleClearFilters}
                    productsPerPage={productsPerPage}
                  />
                </SortFilter>
              </div>
            </>
          );
        }}
      </Await>
    </Suspense>
  );
}

function InfiniteProducts({
  appliedFilters,
  collectionId,
  columns,
  initialNodes,
  initialPageInfo,
  onClearAllFilters,
  productsPerPage,
}: {
  appliedFilters?: AppliedFilter[];
  collectionId: string;
  columns?: {desktop?: null | number; mobile?: null | number};
  initialNodes: ProductCardFragment[];
  initialPageInfo: PageInfo;
  onClearAllFilters: () => void;
  productsPerPage: number;
}) {
  const [searchParams] = useSearchParams();
  const {pending} = useOptimisticNavigationData<boolean>('clear-all-filters');
  const {themeContent} = useSanityThemeContent();
  const apiPath = useLocalePath({path: '/api/collection-products'});

  const [nodes, setNodes] = useState<ProductCardFragment[]>(initialNodes);
  const [cursor, setCursor] = useState<null | string>(
    initialPageInfo?.endCursor ?? null,
  );
  const [hasNextPage, setHasNextPage] = useState<boolean>(
    Boolean(initialPageInfo?.hasNextPage),
  );
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const inViewOptions = useMemo(() => ({rootMargin: '600px'}), []);
  const [sentinelRef, inView] = useInView<HTMLDivElement>(inViewOptions);

  // Reset when the server-provided list changes (new collection / filters).
  useEffect(() => {
    setNodes(initialNodes);
    setCursor(initialPageInfo?.endCursor ?? null);
    setHasNextPage(Boolean(initialPageInfo?.hasNextPage));
  }, [initialNodes, initialPageInfo]);

  useEffect(() => {
    if (!inView || !hasNextPage || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    const params = new URLSearchParams(searchParams);
    params.set('collectionId', collectionId);
    params.set('first', String(productsPerPage));
    if (cursor) params.set('cursor', cursor);

    fetch(`${apiPath}?${params.toString()}`)
      .then(
        (res) =>
          res.json() as Promise<{
            nodes?: ProductCardFragment[];
            pageInfo?: PageInfo;
          }>,
      )
      .then((data) => {
        setNodes((prev) => [...prev, ...(data.nodes ?? [])]);
        setCursor(data.pageInfo?.endCursor ?? null);
        setHasNextPage(Boolean(data.pageInfo?.hasNextPage));
      })
      .catch(() => {
        // On failure, stop trying so we don't loop forever.
        setHasNextPage(false);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  }, [
    apiPath,
    collectionId,
    cursor,
    hasNextPage,
    inView,
    productsPerPage,
    searchParams,
  ]);

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
        columns={{desktop: columns?.desktop, mobile: columns?.mobile}}
        products={nodes}
      />
      {hasNextPage && (
        <div
          className="mt-6 flex items-center justify-center"
          ref={sentinelRef}
        >
          <span
            aria-live="polite"
            className={cn('select-none', loading && 'animate-pulse')}
          >
            {themeContent?.collection?.loadMoreProducts}
          </span>
        </div>
      )}
    </>
  );
}

import type {SectionDefaultProps, SectionOfType} from 'types';
import type {
  FeaturedCollectionQuery,
  ProductCardFragment,
} from 'types/shopify/storefrontapi.generated';

import {Await, Link, useLoaderData} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import {Suspense} from 'react';

import {useLocalePath} from '~/hooks/use-locale-path';
import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';
import {containsIgnoringUnicode, equalsIgnoringUnicode, sanitizeString} from '~/lib/string-utils';

import type {loader as indexLoader} from '../../routes/_index';

import {ProductCardGrid} from '../product/product-card-grid';
import {ProductSwimlane, ProductSwimlaneLoading} from '../product-swimlane';
import {Skeleton} from '../skeleton';
import {Button} from '../ui/button';
import {cn} from '~/lib/utils';
import {Heading} from '../primatives/text';

type FeaturedCollectionSectionProps =
  SectionOfType<'featuredCollectionSection'> & {
    displayType?: 'grid' | 'swimlane';
  };

/**
 * `FeaturedCollectionSection` is a section that displays a collection of products.
 * The collection data is fetched from Shopify using the `featuredCollectionPromise`
 * returned by the loader. The data is streamed to the client so we need to use a `Suspense`
 * component and to display a `Skeleton` while waiting for the data to be available.
 * 
 * This component can display products in two ways:
 * - Grid: Traditional grid layout of products (default)
 * - Swimlane: Horizontal scrollable row of products
 */
export function FeaturedCollectionSection(
  props: SectionDefaultProps & {data: FeaturedCollectionSectionProps},
) {
  const collectionHandle = useLocalePath({
    path: `/collections/${props.data.collection?.store?.slug?.current}`,
  });
  const {themeContent} = useSanityThemeContent();
  const displayType = props.data.displayType || 'grid';

  // For grid display type
  if (displayType === 'grid') {
    return (
      <div className="container space-y-4">
        <div className="flex justify-between">
          {props.data.heading && <h2>{props.data.heading}</h2>}
          {props.data.viewAll && (
            <Button asChild className="hidden md:inline-flex" variant="ghost">
              <Link to={collectionHandle}>
                {themeContent?.collection?.viewAll || 'View all'}
              </Link>
            </Button>
          )}
        </div>
        <AwaitFeaturedCollection
          error={
            <Skeleton isError>
              <div aria-hidden className="animate-pulse">
                <ProductCardGrid
                  columns={{
                    desktop: props.data.desktopColumns || 3,
                  }}
                  skeleton={{
                    cardsNumber: props.data.maxProducts || 3,
                  }}
                />
              </div>
            </Skeleton>
          }
          fallback={
            <Skeleton>
              <div aria-hidden className="animate-pulse">
                <ProductCardGrid
                  columns={{
                    desktop: props.data.desktopColumns || 3,
                  }}
                  skeleton={{
                    cardsNumber: props.data.maxProducts || 3,
                  }}
                />
              </div>
            </Skeleton>
          }
          sanityData={props.data}
        >
          {(products) => (
            <ProductCardGrid
              columns={{
                desktop: props.data.desktopColumns,
              }}
              products={products}
            />
          )}
        </AwaitFeaturedCollection>
        {props.data.viewAll && (
          <div className="flex justify-center md:hidden">
            <Button asChild variant="ghost">
              <Link to={collectionHandle}>
                {themeContent?.collection?.viewAll || 'View all'}
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // For swimlane display type
  return (
    <div>
      <div className="flex justify-between items-center">
        {props.data.heading && (
          <Heading size="lead" className={cn('px-gutter pb-gutter')}>
            {props.data.heading}
          </Heading>
        )}
        {props.data.viewAll && (
          <Button asChild className="hidden md:inline-flex" variant="ghost">
            <Link to={collectionHandle}>
              {themeContent?.collection?.viewAll || 'View all'}
            </Link>
          </Button>
        )}
      </div>
      <AwaitFeaturedCollectionSwimlane
        fallback={<ProductSwimlaneLoading count={props.data.maxProducts || 12} />}
        sanityData={props.data}
      />
      {props.data.viewAll && (
        <div className="flex justify-center mt-4 md:hidden">
          <Button asChild variant="ghost">
            <Link to={collectionHandle}>
              {themeContent?.collection?.viewAll || 'View all'}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to extract numeric collection ID from a GID
 */
function extractCollectionId(gid: string): string | null {
  const match = gid.match(/\/Collection\/(\d+)/);
  return match ? match[1] : null;
}

function AwaitFeaturedCollection(props: {
  children: (products: ProductCardFragment[]) => React.ReactNode;
  error: React.ReactNode;
  fallback: React.ReactNode;
  sanityData: FeaturedCollectionSectionProps;
}) {
  const loaderData = useLoaderData<typeof indexLoader>();
  const featuredCollectionPromise = loaderData?.featuredCollectionPromise;
  const sanityCollectionGid = props.sanityData?.collection?.store?.gid;

  if (!featuredCollectionPromise) {
    console.warn(
      '[FeaturedCollectionSection] No featuredCollectionPromise found in loader data.',
    );
    return null;
  }

  return (
    <Suspense fallback={props.fallback}>
      <Await errorElement={props.error} resolve={featuredCollectionPromise}>
        {(data) => {
          // Resolve the collection data from Shopify with the gid from Sanity
          let collection:
            | NonNullable<FeaturedCollectionQuery['collection']>
            | null
            | undefined;

          for (const result of data) {
            if (result.status === 'fulfilled') {
              const {collection: resultCollection} = result.value;
              // Check if the gid from Sanity is the same as the gid from Shopify
              if (sanityCollectionGid === resultCollection?.id) {
                collection = resultCollection;
                break;
              }
              
              // If direct comparison fails, try by numeric ID
              if (resultCollection?.id && sanityCollectionGid) {
                const resultNumericId = extractCollectionId(resultCollection.id);
                const sanityNumericId = extractCollectionId(sanityCollectionGid);
                
                if (resultNumericId && sanityNumericId && resultNumericId === sanityNumericId) {
                  collection = resultCollection;
                  break;
                }
              }
            } else if (result.status === 'rejected') {
              return props.error;
            }
          }

          const products =
            collection?.products?.nodes && collection?.products?.nodes?.length
              ? flattenConnection(collection?.products)
              : [];

          return <>{products && props.children(products)}</>;
        }}
      </Await>
    </Suspense>
  );
}

/**
 * Component specifically for awaiting collection data for swimlane display
 */
function AwaitFeaturedCollectionSwimlane(props: {
  fallback: React.ReactNode;
  sanityData: FeaturedCollectionSectionProps;
}) {
  const loaderData = useLoaderData<typeof indexLoader>();
  const featuredCollectionPromise = loaderData?.featuredCollectionPromise;
  const sanityCollectionGid = props.sanityData?.collection?.store?.gid;

  if (!featuredCollectionPromise || !sanityCollectionGid) {
    return <ProductSwimlaneLoading count={props.sanityData.maxProducts || 12} />;
  }

  return (
    <Suspense fallback={props.fallback}>
      <Await 
        errorElement={<ProductSwimlaneLoading count={props.sanityData.maxProducts || 12} />} 
        resolve={featuredCollectionPromise}
      >
        {(data) => {
          // Find the matching collection from the resolved data
          let collection = null;
          
          // Extract numeric ID from Sanity GID
          const sanityNumericId = extractCollectionId(sanityCollectionGid);
          
          for (const result of data) {
            if (result.status === 'fulfilled') {
              const {collection: resultCollection} = result.value;
              
              if (resultCollection && resultCollection.id) {
                // Extract numeric ID from result GID
                const resultNumericId = extractCollectionId(resultCollection.id);
                
                // Match by numeric ID first (most reliable)
                if (resultNumericId && sanityNumericId && resultNumericId === sanityNumericId) {
                  collection = resultCollection;
                  break;
                }
                
                // Fall back to string comparison if numeric extraction fails
                if (equalsIgnoringUnicode(sanityCollectionGid, resultCollection.id)) {
                  collection = resultCollection;
                  break;
                }
              }
            }
          }

          // If no matching collection found, show loading state
          if (!collection || !collection.products?.nodes) {
            return <ProductSwimlaneLoading count={props.sanityData.maxProducts || 12} />;
          }

          // Extract products from collection
          const products = flattenConnection(collection.products);

          // Display products in swimlane
          return (
            <ProductSwimlane
              products={{nodes: products.slice(0, props.sanityData.maxProducts || 12)}}
              count={props.sanityData.maxProducts || 12}
            />
          );
        }}
      </Await>
    </Suspense>
  );
}

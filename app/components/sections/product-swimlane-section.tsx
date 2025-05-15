import type {SectionDefaultProps, SectionOfType} from 'types';
import type {
  ApiAllProductsQuery,
  ProductCardFragment,
  ProductRecommendationsQuery,
} from 'types/shopify/storefrontapi.generated';

import {Await, Link, useLoaderData} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import {Suspense} from 'react';

import {useLocalePath} from '~/hooks/use-locale-path';
import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';

import {ProductSwimlane, ProductSwimlaneLoading} from '~/components/product-swimlane';
import {Button} from '~/components/ui/button';
import {Heading} from '~/components/primatives/text';
import {cn} from '~/lib/utils';
import {containsIgnoringUnicode, equalsIgnoringUnicode, sanitizeString} from '~/lib/string-utils';

// Define the expected shape of the data from Sanity
type ProductSwimlaneSectionProps = SectionOfType<'productSwimlaneSection'> & {
  heading?: any;
  source: 'manual' | 'collection' | 'related';
  manualProducts?: {
    store: {
      gid: string;
    };
  }[];
  collection?: {
    store: {
      gid: string;
      slug: {
        current: string;
      };
      title: string;
    };
  };
  maxProducts?: number;
  viewAll?: boolean;
  settings?: {
    hide?: boolean;
  };
};

/**
 * `ProductSwimlaneSection` is a section that displays a horizontal scrollable row of products.
 * Products can be sourced from:
 * - Manual selection of products
 * - A collection
 * - Related products (when used in a product template)
 */
export function ProductSwimlaneSection(
  props: SectionDefaultProps & {data: ProductSwimlaneSectionProps},
) {
  console.log('ProductSwimlaneSection', props);
  const {data} = props;
  const {themeContent} = useSanityThemeContent();
  
  // For collection source
  const collectionHandle = data.collection?.store?.slug?.current 
    ? useLocalePath({
        path: `/collections/${sanitizeString(data.collection.store.slug.current)}`,
      })
    : '#';
  
  // Clean the source value to handle invisible Unicode characters
  const cleanSource = sanitizeString(data.source);
  
  // Handle different product sources
  switch(true) {
    case equalsIgnoringUnicode(data.source, 'manual'):
      return <ManualProductSwimlane data={data} />;
    case equalsIgnoringUnicode(data.source, 'collection'):
      return (
        <div>
          <div className="flex justify-between items-center">
            {data.heading && (
              <Heading size="lead" className={cn('px-gutter pb-gutter')}>
                {data.heading}
              </Heading>
            )}
            {data.viewAll && (
              <Button asChild className="hidden md:inline-flex" variant="ghost">
                <Link to={collectionHandle}>
                  {themeContent?.collection?.viewAll || 'View all'}
                </Link>
              </Button>
            )}
          </div>
          <CollectionProductSwimlane data={data} />
          {data.viewAll && (
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
    case equalsIgnoringUnicode(data.source, 'related'):
      return <RelatedProductSwimlane data={data} />;
    default:
      console.log('Unknown source type:', data.source, 'Cleaned source:', cleanSource);
      return null;
  }
}

/**
 * Component for displaying manually selected products in a swimlane
 */
function ManualProductSwimlane({data}: {data: ProductSwimlaneSectionProps}) {
  // If no products are selected, return null
  if (!data.manualProducts || data.manualProducts.length === 0) {
    return null;
  }
  
  // TODO: Implement fetching of manually selected products
  // For now, just display a simple placeholder
  return (
    <>
      {data.heading && (
        <Heading size="lead" className={cn('px-gutter pb-gutter')}>
          {data.heading}
        </Heading>
      )}
      <ProductSwimlaneLoading count={data.maxProducts} />
    </>
  );
}

/**
 * Helper function to extract numeric collection ID from a GID
 */
function extractCollectionId(gid: string): string | null {
  const match = gid.match(/\/Collection\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Component for displaying collection products in a swimlane
 */
function CollectionProductSwimlane({data}: {data: ProductSwimlaneSectionProps}) {
  // If no collection is selected, return null
  if (!data.collection) {
    return null;
  }
  
  // Use both promise types to support different route loaders
  const loaderData = useLoaderData<{
    productSwimlaneSectionPromise?: Promise<any>;
    featuredCollectionPromise?: Promise<any>;
  }>();
  
  // Support both promise types - some routes may use one or the other
  const collectionPromise = loaderData?.productSwimlaneSectionPromise || loaderData?.featuredCollectionPromise;
  const sanityCollectionGid = data.collection?.store?.gid;

  console.log('CollectionProductSwimlane', {
    sanityCollectionGid,
    hasPromise: !!collectionPromise
  });

  if (!collectionPromise || !sanityCollectionGid) {
    return <ProductSwimlaneLoading count={data.maxProducts || 12} />;
  }

  // Extract numeric ID from Sanity GID
  const sanityNumericId = extractCollectionId(sanityCollectionGid);

  return (
    <Suspense fallback={<ProductSwimlaneLoading count={data.maxProducts || 12} />}>
      <Await 
        errorElement={<ProductSwimlaneLoading count={data.maxProducts || 12} />} 
        resolve={collectionPromise}
      >
        {(collectionData) => {
          // Find the matching collection from the resolved data
          let collection = null;
          console.log('Resolved collection data:', collectionData);
          
          // Handle different promise structures based on which promise was used
          if (Array.isArray(collectionData)) {
            // For productSwimlaneSectionPromise - multiple collections in array
            console.log('Processing array of collections, length:', collectionData.length);
            
            for (const result of collectionData) {
              // Type guard to ensure we have a fulfilled promise result with value
              if (
                result && 
                typeof result === 'object' && 
                'status' in result && 
                result.status === 'fulfilled' && 
                'value' in result && 
                result.value && 
                typeof result.value === 'object' && 
                'collection' in result.value
              ) {
                const resultCollection = result.value.collection as { id?: string, products?: { nodes: any[] } };
                
                if (resultCollection && resultCollection.id) {
                  // Extract numeric ID from result GID
                  const resultNumericId = extractCollectionId(resultCollection.id);
                  console.log('Comparing IDs:', {resultNumericId, resultGid: resultCollection.id, sanityNumericId, sanityGid: sanityCollectionGid});
                  
                  // Match by numeric ID first (most reliable)
                  if (resultNumericId && sanityNumericId && resultNumericId === sanityNumericId) {
                    console.log('Matched by numeric ID');
                    collection = resultCollection;
                    break;
                  }
                  
                  // Fall back to string comparison if numeric extraction fails
                  if (equalsIgnoringUnicode(sanityCollectionGid, resultCollection.id)) {
                    console.log('Matched by full GID comparison');
                    collection = resultCollection;
                    break;
                  }
                }
              }
            }
          } else if (
            collectionData && 
            typeof collectionData === 'object' && 
            'status' in collectionData && 
            collectionData.status === 'fulfilled' && 
            'value' in collectionData && 
            collectionData.value && 
            typeof collectionData.value === 'object' && 
            'collection' in collectionData.value
          ) {
            // For featuredCollectionPromise - single collection
            const resultCollection = collectionData.value.collection as { id?: string, products?: { nodes: any[] } };
            
            if (resultCollection && resultCollection.id) {
              // Extract numeric ID from result GID
              const resultNumericId = extractCollectionId(resultCollection.id);
              console.log('Single collection - comparing IDs:', {resultNumericId, resultGid: resultCollection.id, sanityNumericId, sanityGid: sanityCollectionGid});
              
              // Match by numeric ID first (most reliable)
              if (resultNumericId && sanityNumericId && resultNumericId === sanityNumericId) {
                console.log('Matched by numeric ID');
                collection = resultCollection;
              } else if (equalsIgnoringUnicode(sanityCollectionGid, resultCollection.id)) {
                // Fall back to string comparison if numeric extraction fails
                console.log('Matched by full GID comparison');
                collection = resultCollection;
              }
            }
          }

          // If no matching collection found, show loading state
          if (!collection || !collection.products?.nodes) {
            console.log('No matching collection found or no products in collection');
            return <ProductSwimlaneLoading count={data.maxProducts || 12} />;
          }

          // Extract products from collection
          const products = flattenConnection(collection.products);
          console.log(`Found ${products.length} products in collection`);

          // Display products in swimlane - cast to correct type
          return (
            <ProductSwimlane
              products={{nodes: products.slice(0, data.maxProducts || 12) as ProductCardFragment[]}}
              count={data.maxProducts || 12}
            />
          );
        }}
      </Await>
    </Suspense>
  );
}

/**
 * Component for displaying related products in a swimlane
 */
function RelatedProductSwimlane({data}: {data: ProductSwimlaneSectionProps}) {
  const loaderData = useLoaderData<{relatedProductsPromise?: Promise<ProductRecommendationsQuery>}>();
  const relatedProductsPromise = loaderData?.relatedProductsPromise;
  
  if (!relatedProductsPromise) {
    return (
      <>
        {data.heading && (
          <Heading size="lead" className={cn('px-gutter pb-gutter')}>
            {data.heading}
          </Heading>
        )}
        <ProductSwimlaneLoading count={data.maxProducts || 12} />
      </>
    );
  }

  return (
    <Suspense 
      fallback={
        <>
          {data.heading && (
            <Heading size="lead" className={cn('px-gutter pb-gutter')}>
              {data.heading}
            </Heading>
          )}
          <ProductSwimlaneLoading count={data.maxProducts || 12} />
        </>
      }
    >
      <Await 
        errorElement={
          <>
            {data.heading && (
              <Heading size="lead" className={cn('px-gutter pb-gutter')}>
                {data.heading}
              </Heading>
            )}
            <ProductSwimlaneLoading count={data.maxProducts || 12} />
          </>
        } 
        resolve={relatedProductsPromise}
      >
        {(result) => {
          // Extract and filter products
          const products = getRelatedProducts(result, data.maxProducts || 12);
          
          // If no related products found, don't render anything
          if (products.length === 0) {
            return null;
          }
          
          // Display products in swimlane
          return (
            <>
              {data.heading && (
                <Heading size="lead" className={cn('px-gutter pb-gutter')}>
                  {data.heading}
                </Heading>
              )}
              <ProductSwimlane
                products={{nodes: products}}
                count={data.maxProducts || 12}
              />
            </>
          );
        }}
      </Await>
    </Suspense>
  );
}

/**
 * Helper function to extract and filter related products
 */
function getRelatedProducts(
  data: ProductRecommendationsQuery,
  maxProducts: number,
): ProductCardFragment[] {
  // Merge recommended and additional products, removing duplicates
  const mergedProducts = (data.recommended ?? [])
    .concat(data.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  // Remove the current product if it's in the list
  const originalProductIndex = mergedProducts.findIndex(
    (item) => item.id === data.mainProduct?.id,
  );
  
  if (originalProductIndex >= 0) {
    mergedProducts.splice(originalProductIndex, 1);
  }

  // Limit to max number of products
  if (mergedProducts.length > maxProducts) {
    mergedProducts.splice(maxProducts);
  }

  return mergedProducts;
}

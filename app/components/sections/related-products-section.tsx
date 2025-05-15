import type {SectionDefaultProps, SectionOfType} from 'types';
import type {ProductRecommendationsQuery} from 'types/shopify/storefrontapi.generated';

import {Await, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {flattenConnection} from '@shopify/hydrogen';

import type {loader} from '~/routes/($locale).products.$productHandle';

import {ProductCardGrid} from '../product/product-card-grid';
import {RelatedProducts, getRecommendedProducts} from '../product/related-products';
import {Skeleton} from '../skeleton';
import {ProductSwimlane, ProductSwimlaneLoading} from '../product-swimlane';
import {cn} from '~/lib/utils';
import {Heading} from '../primatives/text';

export type RelatedProductsSectionProps =
  SectionOfType<'relatedProductsSection'> & {
    displayType?: 'grid' | 'swimlane';
  };

export function RelatedProductsSection(
  props: SectionDefaultProps & {data: RelatedProductsSectionProps},
) {
  const {data} = props;
  const loaderData = useLoaderData<typeof loader>();
  const relatedProductsPromise = loaderData?.relatedProductsPromise;
  const displayType = data.displayType || 'grid';
  // Grid display type
  if (displayType === 'grid') {
    return (
      <div className="container">
        <Suspense
          fallback={
            <Skeleton>
              {data.heading && <h2>{data.heading}</h2>}
              <div className="mt-4">
                <ProductCardGrid
                  columns={{
                    desktop: data.desktopColumns,
                  }}
                  skeleton={{
                    cardsNumber: data.maxProducts || 3,
                  }}
                />
              </div>
            </Skeleton>
          }
        >
          <Await
            errorElement={
              <Skeleton isError>
                {data.heading && <h2>{data.heading}</h2>}
                <div className="mt-4">
                  <ProductCardGrid
                    columns={{
                      desktop: data.desktopColumns,
                    }}
                    skeleton={{
                      cardsNumber: data.maxProducts || 3,
                    }}
                  />
                </div>
              </Skeleton>
            }
            resolve={relatedProductsPromise}
          >
            {(result) => (
              <RelatedProducts
                columns={{
                  desktop: data.desktopColumns,
                }}
                data={result}
                heading={data.heading}
                maxProducts={data.maxProducts || 3}
              />
            )}
          </Await>
        </Suspense>
      </div>
    );
  }

  // Swimlane display type
  return (
    <div>
      <Suspense fallback={<ProductSwimlaneLoading count={data.maxProducts || 12} />}>
        <Await
          errorElement={<ProductSwimlaneLoading count={data.maxProducts || 12} />}
          resolve={relatedProductsPromise}
        >
          {(result) => {
            // Get recommended products using the same method as in RelatedProducts component
            if (!result) {
              return <ProductSwimlaneLoading count={data.maxProducts || 12} />;
            }
            
            const products = getRecommendedProducts(result, data.maxProducts || 12);
            
            return (
              <ProductSwimlane
                products={{nodes: products}}
                count={data.maxProducts || 12}
                title={data.heading || undefined}
              />
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}

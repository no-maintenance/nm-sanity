import type {SectionDefaultProps, SectionOfType} from 'types';
import type {ProductVariantFragmentFragment} from 'types/shopify/storefrontapi.generated';

import {Await, useLoaderData} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import {flattenConnection} from '@shopify/hydrogen-react';
import {createContext, Suspense, useContext} from 'react';

import type {loader} from '~/routes/($locale).products.$productHandle';

import {cn, getAspectRatioData} from '~/lib/utils';

import {MediaGallery} from '../product/media-gallery';
import {SimpleMediaGallery} from '../product/simple-media-gallery';
import {ProductDetails} from '../product/product-details';
import {Skeleton} from '../skeleton';

export type ProductInformationSectionProps =
  SectionOfType<'productInformationSection'> & {
    galleryStyle?: 'scrollable' | 'simple';
    stickyProductInfo?: boolean;
  };

type ProductVariantsContextType = {
  variants: ProductVariantFragmentFragment[];
};

export function ProductInformationSection(
  props: SectionDefaultProps & {
    data: ProductInformationSectionProps;
  },
) {
  const loaderData = useLoaderData<typeof loader>();
  const {data} = props;
  const variantsPromise = loaderData.variants;
  const aspectRatio = getAspectRatioData(data.mediaAspectRatio);

  if (variantsPromise) {
    return (
      <>
        <Suspense
          fallback={
            <Skeleton>
              <ProductInformationGrid
                data={stegaClean(data)}
                mediaGallery={
                  data.galleryStyle === 'simple' ? (
                    <SimpleMediaGallery aspectRatio={aspectRatio} />
                  ) : (
                    <MediaGallery aspectRatio={aspectRatio} />
                  )
                }
                productDetails={<ProductDetails data={data} />}
              />
            </Skeleton>
          }
        >
          <Await
            errorElement={
              <Skeleton isError>
                <ProductInformationGrid
                  data={stegaClean(data)}
                  mediaGallery={
                    data.galleryStyle === 'simple' ? (
                      <SimpleMediaGallery aspectRatio={aspectRatio} />
                    ) : (
                      <MediaGallery aspectRatio={aspectRatio} />
                    )
                  }
                  productDetails={<ProductDetails data={data} />}
                />
              </Skeleton>
            }
            resolve={variantsPromise}
          >
            {({product}) => {
              const variants = product?.variants?.nodes.length
                ? flattenConnection(product.variants)
                : [];

              return (
                <ProductVariantsContext.Provider value={{variants}}>
                  <ProductInformationGrid
                    data={stegaClean(data)}
                    mediaGallery={
                      data.galleryStyle === 'simple' ? (
                        <SimpleMediaGallery aspectRatio={aspectRatio} />
                      ) : (
                        <MediaGallery aspectRatio={aspectRatio} />
                      )
                    }
                    productDetails={<ProductDetails data={data} />}
                  />
                </ProductVariantsContext.Provider>
              );
            }}
          </Await>
        </Suspense>
      </>
    );
  }

  return (
    <ProductInformationGrid
      data={stegaClean(data)}
      mediaGallery={
        data.galleryStyle === 'simple' ? (
          <SimpleMediaGallery aspectRatio={aspectRatio} />
        ) : (
          <MediaGallery aspectRatio={aspectRatio} />
        )
      }
      productDetails={<ProductDetails data={data} />}
    />
  );
}

function ProductInformationGrid({
  data,
  mediaGallery,
  productDetails,
}: {
  data: ProductInformationSectionProps;
  mediaGallery: React.ReactNode;
  productDetails: React.ReactNode;
}) {
  const isSimpleGallery = data?.galleryStyle === 'simple';
  const isScrollableGallery = !isSimpleGallery;
  const shouldStick = isScrollableGallery && data?.stickyProductInfo !== false;
  
  // Only apply these settings for simple gallery
  const desktopMediaPosition = isSimpleGallery ? data?.desktopMediaPosition : null;
  const desktopMediaWidth = isSimpleGallery ? data?.desktopMediaWidth : null;
  
  return (
    <div className="lg:container">
      <div className={cn('grid gap-10 lg:grid-cols-12')}>
        <div
          className={cn(
            'lg:col-span-6',
            // Only apply position/width for simple gallery
            isSimpleGallery && desktopMediaPosition === 'right' && 'lg:order-last',
            isSimpleGallery && desktopMediaWidth === 'small' && 'lg:col-span-5',
            isSimpleGallery && desktopMediaWidth === 'large' && 'lg:col-span-7',
            // For scrollable, use default 50/50 split
            isScrollableGallery && 'lg:col-span-6'
          )}
        >
          {mediaGallery}
        </div>
        <div
          className={cn(
            'lg:col-span-6',
            // Only apply width adjustments for simple gallery
            isSimpleGallery && desktopMediaWidth === 'small' && 'lg:col-span-7',
            isSimpleGallery && desktopMediaWidth === 'large' && 'lg:col-span-5',
            // For scrollable gallery with sticky behavior
            shouldStick && 'lg:self-start h-full'
          )}
        >
          <div 
            className={cn(
              shouldStick && 'lg:sticky lg:top-[calc(var(--height-nav)+6rem)] lg:max-h-[calc(100vh-var(--height-nav)-6rem)] lg:overflow-y-auto lg:max-w-lg lg:p-8 mx-auto',
              'flex flex-col items-start'
            )}
          >
            {productDetails}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProductVariantsContext =
  createContext<null | ProductVariantsContextType>(null);

export function useProductVariants() {
  return useContext(ProductVariantsContext);
}

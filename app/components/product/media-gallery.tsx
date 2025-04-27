import type {
  Media_ExternalVideo_Fragment,
  Media_MediaImage_Fragment,
  Media_Model3d_Fragment,
  Media_Video_Fragment,
} from 'types/shopify/storefrontapi.generated';

import {useLoaderData, useNavigation} from '@remix-run/react';
import {flattenConnection, MediaFile} from '@shopify/hydrogen';
import React, {Dispatch, ReactNode, RefObject, useCallback, useEffect, useRef, useState} from 'react';

import type {loader} from '~/routes/($locale).products.$productHandle';

import {useDevice} from '~/hooks/use-device';
import {type AspectRatioData, cn} from '~/lib/utils';

import type {CarouselApi} from '../ui/carousel';

import {ShopifyImage} from '../shopify-image';
import {Badge} from '../ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselCounter,
  CarouselItem,
} from '../ui/carousel';
import { AnimatePresence, m } from 'motion/react';
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import { IconClose } from '../icons/icon-close';
import { ProgressiveMotionDiv } from '~/components/progressive-motion';

type Media =
  | Media_ExternalVideo_Fragment
  | Media_MediaImage_Fragment
  | Media_Model3d_Fragment
  | Media_Video_Fragment;

export function MediaGallery(props: {aspectRatio?: AspectRatioData}) {
  const {product} = useLoaderData<typeof loader>();
  const medias = product?.media?.nodes.length
    ? flattenConnection(product.media)
    : [];

  return (
    <div>
      <div className="hidden lg:block">
        <DesktopMedia aspectRatio={props.aspectRatio} media={medias} />
      </div>
      <MobileCarousel aspectRatio={props.aspectRatio} medias={medias} />
    </div>
  );
}

function DesktopMedia({
  aspectRatio,
  media,
}: {
  aspectRatio?: AspectRatioData;
  media: Media[];
}) {
  const [modalIdx, setModalIdx] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <ProductModal
        modalRef={modalRef}
        modalIdx={modalIdx}
        setModalIdx={setModalIdx}
      >
        {media.map((data, idx) => (
          <ModalImage
            key={`modal-image--${data.id}`}
            modalRef={modalRef}
            modalIdx={modalIdx}
            idx={idx + 1}
          >
            
            <MediaFile data={data}
              className="object-cover w-full h-full  fadeIn"
            />
          </ModalImage>
        ))}
      </ProductModal>
      <div className="hidden w-full md:grid gap-y-12 xl:col-start-2 col-span-6  xl:col-span-5">
        {media.map((data, i) => {
          return (
            <button
              onClick={() => setModalIdx(i + 1)}
              className={
                'md:col-span-2 aspect-[4/5] snap-center card-image bg-white dark:bg-background/10 w-mobileGallery md:w-full crosshair-plus'
              }
              key={data.id}
            >
              <MediaFile data={data} className="object-cover w-full h-full  fadeIn" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileCarousel({
  aspectRatio,
  medias,
}: {
  aspectRatio?: AspectRatioData;
  medias: Media[];
}) {
  const device = useDevice();
  const isActive = medias.length > 1;

  if (!isActive) {
    return (
      <div className="container lg:hidden">
        <DesktopMedia aspectRatio={aspectRatio} media={medias} />
      </div>
    );
  }

  return (
    <Carousel
      className="[--slide-size:100%] [--slide-spacing:1rem] lg:hidden"
      opts={{
        active: isActive && device !== 'desktop',
      }}
    >
      <div className="relative">
        <CarouselContent className="px-(--slide-spacing)">
          {medias.map((media, index) => {
            return (
              <CarouselItem
                className="last:pr-(--slide-spacing) [&>span]:h-full"
                key={media.id}
              >
                {media.__typename === 'MediaImage' && media.image && (
                  <ShopifyImage
                    aspectRatio={aspectRatio?.value}
                    className={cn(
                      'size-full object-cover',
                      aspectRatio?.className,
                    )}
                    data={media.image}
                    decoding={index === 0 ? 'sync' : 'async'}
                    fetchpriority={index === 0 ? 'high' : 'low'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="100vw"
                  />
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="mt-3 flex items-center justify-center">
          <Badge variant="outline">
            <CarouselCounter>
              <span>{medias.length}</span>
            </CarouselCounter>
          </Badge>
        </div>
      </div>
    </Carousel>
  );
}

function ThumbnailCarousel({
  medias,
  selectedImage,
  setActiveMediaId,
}: {
  medias: Media[];
  selectedImage: Media;
  setActiveMediaId: React.Dispatch<React.SetStateAction<null | string>>;
}) {
  const device = useDevice();
  const slidesPerView = 6;
  const [api, setApi] = useState<CarouselApi>();

  const handleSelect = useCallback(
    (index: number, mediaId: string) => {
      api?.scrollTo(index);
      setActiveMediaId(mediaId);
    },
    [api, setActiveMediaId],
  );

  if (medias.length <= 1) return null;

  return (
    <div className="mt-3 hidden lg:block">
      <Carousel
        className="[--slide-spacing:.5rem]"
        opts={{
          active: device === 'desktop' && slidesPerView < medias.length,
          containScroll: 'keepSnaps',
          dragFree: true,
        }}
        setApi={setApi}
        style={
          {
            '--slides-per-view': slidesPerView,
          } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-2">
          <CarouselContent className="ml-0 py-1">
            {medias.map((media, index) => {
              return (
                <CarouselItem
                  className="px-[calc(var(--slide-spacing)/2)]"
                  key={media.id}
                >
                  {media.__typename === 'MediaImage' && media.image && (
                    <button
                      className={cn(
                        'border-primary/0 notouch:hover:border-primary/100 overflow-hidden rounded-(--media-border-corner-radius) border-2 transition-opacity',
                        'ring-offset-background focus-visible:ring-ring transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
                        media.id === selectedImage.id && 'border-primary/100',
                      )}
                      key={media.id}
                      onClick={() => handleSelect(index, media.id)}
                    >
                      <span className="sr-only">{`Thumbnail ${index + 1}`}</span>
                      <ShopifyImage
                        aspectRatio="1/1"
                        className="size-full object-cover"
                        data={media.image}
                        draggable="false"
                        loading="eager"
                        showBorder={false}
                        showShadow={false}
                        sizes="96px"
                      />
                    </button>
                  )}
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </div>
      </Carousel>
    </div>
  );
}


export const ProductModal = ({
  setModalIdx,
  modalIdx,
  children,
  modalRef,
}: {
  children: ReactNode;
  setModalIdx: Dispatch<number>;
  modalIdx: number;
  modalRef: RefObject<HTMLDivElement>;
}) => {
  const {location} = useNavigation();
  useEffect(() => {
    if (!modalRef.current) return;
    if (modalIdx) {
      disableBodyScroll(modalRef.current, {reserveScrollBarGap: true});
    } else {
      clearAllBodyScrollLocks();
    }
  }, [modalIdx]);
  useEffect(() => {
    clearAllBodyScrollLocks();
  }, [location]);
  return (
    <AnimatePresence>
      {modalIdx && (
        <ProgressiveMotionDiv
          onClick={() => setModalIdx(0)}
          ref={modalRef}
          className={' fixed left-0 top-0 w-full z-50 h-full overflow-y-auto'}
        >
          <button
            aria-label="Close panel"
            className={'fixed right-8 top-6 cursor-pointer z-20'}
            onClick={() => setModalIdx(0)}
          >
            <IconClose width={25} height={24} viewBox="0 0 25 24" />
          </button>
          <div className={'w-full'}>{children}</div>
        </ProgressiveMotionDiv>
      )}
    </AnimatePresence>
  );
};


const ModalImage = ({
  idx,
  modalIdx,
  modalRef,
  children,
}: {
  modalRef: RefObject<HTMLDivElement>;
  idx: number;
  modalIdx: number;
  children: ReactNode;
}) => {
  const imgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!imgRef.current || !modalRef.current) return;
    if (idx === modalIdx) {
      modalRef.current.scrollTop = imgRef.current.offsetTop;
    }
  }, [modalIdx]);
  return (
    <div
      ref={imgRef}
      className={
        'md:col-span-2 card-image bg-white dark:bg-background/10 md:w-full crosshair-minus'
      }
    >
      {children}
    </div>
  );
};

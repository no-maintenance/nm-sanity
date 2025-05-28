import type {SectionOfType} from 'types';

import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselPagination} from '~/components/ui/carousel';
import {SanityImage} from '../../sanity-image';

export type CarouselBlockProps = NonNullable<
  SectionOfType<'richtextSection'>['richtext']
>[number] & {
  _type: 'carousel';
};

export function CarouselBlock(props: CarouselBlockProps) {
  const {slides, slidesPerViewDesktop = 3, pagination = true, arrows = true} = props;

  if (!slides || slides.length === 0) return null;

  const slidesCount = slidesPerViewDesktop || 3;

  const carouselStyle = {
    '--slides-per-view': slidesCount,
    '--slide-spacing': '1rem',
  } as React.CSSProperties;

  return (
    <div className="w-full" style={carouselStyle}>
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide._key || index}
            >
              {slide.image && (
                <div className="aspect-square overflow-hidden rounded-lg">
                  <SanityImage
                    data={slide.image}
                    className="h-full w-full object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {arrows && slides.length > slidesCount && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
      {pagination && slides.length > slidesCount && (
        <div className="mt-4">
          <CarouselPagination />
        </div>
      )}
    </div>
  );
} 
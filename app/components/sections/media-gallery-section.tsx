import type {SectionDefaultProps} from 'types';
import {useState, useEffect} from 'react';
import {SanityMedia} from '../sanity/sanity-media';
import {cn} from '~/lib/utils';

// Helper functions for layout classes
function getGapClass(gap?: string): string {
  switch (gap) {
    case 'none':
      return 'gap-0';
    case 'small':
      return 'gap-2';
    case 'medium':
      return 'gap-4';
    case 'large':
      return 'gap-8';
    default:
      return 'gap-4'; // default medium
  }
}

function getAspectRatioClass(aspectRatio?: string): string {
  switch (aspectRatio) {
    case 'square':
      return 'aspect-square';
    case 'portrait':
      return 'aspect-[3/4]';
    case 'landscape':
      return 'aspect-[4/3]';
    case 'wide':
      return 'aspect-video';
    case 'original':
    default:
      return 'aspect-auto';
  }
}

// Define the types based on our schema
type SimpleImage = {
  _key?: string;
  _type: 'simpleImage';
  asset?: any;
  alt?: string;
};

type GalleryItem = {
  _key?: string;
  _type: 'galleryItem';
  mediaType: 'image' | 'video';
  image?: {
    asset?: any;
    alt?: string;
  };
  video?: {
    playbackId?: string;
  };
  caption?: any;
};

type MediaGalleryItem = SimpleImage | GalleryItem;

type MediaGallerySectionProps = {
  _type: 'mediaGallerySection';
  _key?: string;
  items?: MediaGalleryItem[];
  layout?: {
    aspectRatio?: string;
    gap?: string;
  };
};

export function MediaGallerySection(
  props: SectionDefaultProps & {data: MediaGallerySectionProps},
) {
  const {data} = props;
  
  
  // Get global column toggle state from localStorage or context
  const [isWideLayout, setIsWideLayout] = useState(false);
  
  useEffect(() => {
    // Check localStorage for user's preference
    const saved = localStorage.getItem('editorial-grid-layout');
    if (saved === 'wide') {
      setIsWideLayout(true);
    }
    
    // Listen for global toggle events
    const handleToggle = (event: CustomEvent<{isWide: boolean}>) => {
      setIsWideLayout(event.detail.isWide);
    };
    
    window.addEventListener('editorial-grid-toggle' as any, handleToggle);
    return () => window.removeEventListener('editorial-grid-toggle' as any, handleToggle);
  }, []);

  if (!data?.items?.length) {
    return null;
  }

  // Dynamic grid classes based on global toggle state and layout settings
  const gapClass = getGapClass(data.layout?.gap);
  const aspectRatioClass = getAspectRatioClass(data.layout?.aspectRatio);
  
  const gridClasses = cn(
    'grid',
    gapClass,
    isWideLayout 
      ? 'grid-cols-2 md:grid-cols-4' // Wide: 2 cols mobile, 4 cols desktop
      : 'grid-cols-1 md:grid-cols-2'  // Narrow: 1 col mobile, 2 cols desktop
  );

  return (
    <section className="my-8">
      <div className="px-4 md:px-8">
        <div className={gridClasses}>
          {data.items.map((item, index) => (
            <MediaGalleryItem 
              key={item._key || `item-${index}`} 
              item={item} 
              index={index}
              aspectRatioClass={aspectRatioClass}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface MediaGalleryItemProps {
  item: MediaGalleryItem;
  index: number;
  aspectRatioClass: string;
}

function MediaGalleryItem({item, index, aspectRatioClass}: MediaGalleryItemProps) {
  // Handle simple images (direct image upload)
  if (item._type === 'simpleImage' && item.asset) {
    return (
      <div className={cn(aspectRatioClass, "overflow-hidden relative")}>
        <SanityMedia
          mediaType="image"
          image={item}
          alt={item.alt || `Gallery image ${index + 1}`}
          className="w-full h-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>
    );
  }
  
  // Handle gallery items with mediaType field
  if (item._type === 'galleryItem') {
    return (
      <div className={cn(aspectRatioClass, "overflow-hidden relative")}>
        <SanityMedia
          mediaType={item.mediaType}
          image={item.image}
          video={item.video}
          alt={item.image?.alt || `Gallery ${item.mediaType} ${index + 1}`}
          className="w-full h-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          hiddenControls={false}
          autoPlay={false}
          loop={false}
          muted={false}
        />
      </div>
    );
  }
  
  // Fallback: log unhandled type in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Unhandled media gallery item type:', item._type, item);
  }
  
  return null;
}

// Global toggle hook for use in the editorial layout
export function useEditorialGridToggle() {
  const [isWideLayout, setIsWideLayout] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('editorial-grid-layout');
    if (saved === 'wide') {
      setIsWideLayout(true);
    }
  }, []);
  
  const toggleLayout = () => {
    const newState = !isWideLayout;
    setIsWideLayout(newState);
    
    // Save to localStorage
    localStorage.setItem('editorial-grid-layout', newState ? 'wide' : 'narrow');
    
    // Dispatch custom event for all gallery sections to listen
    window.dispatchEvent(
      new CustomEvent('editorial-grid-toggle', {
        detail: { isWide: newState }
      })
    );
  };
  
  return {
    isWideLayout,
    toggleLayout,
  };
}
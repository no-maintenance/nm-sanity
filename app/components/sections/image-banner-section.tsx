import type {PortableTextComponents} from '@portabletext/react';
import type {SectionDefaultProps, SectionOfType} from 'types';

import {PortableText} from '@portabletext/react';
import {useMemo} from 'react';

import type {ButtonBlockProps} from '../sanity/richtext/components/button-block';

import {
  Banner,
  BannerContent,
  BannerMedia,
  BannerMediaOverlay,
} from '../banner';
import {useSection} from '../cms-section';
import {ButtonBlock} from '../sanity/richtext/components/button-block';
import {SanityMedia} from '../sanity/sanity-media';
import { stegaClean } from '@sanity/client/stega';

type ImageBannerSectionProps = SectionOfType<'imageBannerSection'>;

export function ImageBannerSection(
  props: SectionDefaultProps & {data: ImageBannerSectionProps},
) {
  const {data} = props;
  const {contentAlignment, contentPosition, overlayOpacity, mediaType} = data;
  const heightMode = stegaClean(data.heightMode);
  const section = useSection();

  // Determine aspect ratio based on height mode and screen size
  const getAspectRatio = () => {
    if (heightMode === 'aspectRatio') {
      // Use custom aspect ratio if selected
      if (data.aspectRatio === 'custom' && data.customAspectRatio) {
        return stegaClean(data.customAspectRatio).replace(':', '/');
      }
      
      // Use predefined aspect ratio
      if (data.aspectRatio) {
        return stegaClean(data.aspectRatio).replace(':', '/');
      }
    }
    
    // Default to 16/9
    return '16/9';
  };

  // For fullscreen mode
  if (heightMode === 'fullscreen') {
    return (
      <div className="relative h-screen w-full">
        <BannerMedia>
          <SanityMedia
            mediaType={mediaType || 'image'}
            image={data.backgroundImage}
            video={data.backgroundVideo}
            className="h-full w-full"
            objectFit="cover"
            priority={section?.index === 0}
            hiddenControls={mediaType === 'video'}
          />
        </BannerMedia>
        <BannerMediaOverlay opacity={overlayOpacity} />
        <BannerContent
          contentAlignment={contentAlignment}
          contentPosition={contentPosition}
        >
          <BannerRichtext value={data.content} />
        </BannerContent>
      </div>
    );
  }

  // For fixed height mode
  if (heightMode === 'fixed') {
    return (
      <Banner height={data.bannerHeight}>
        <BannerMedia>
          <SanityMedia
            mediaType={mediaType || 'image'}
            image={data.backgroundImage}
            video={data.backgroundVideo}
            className="h-full w-full"
            objectFit="cover"
            priority={section?.index === 0}
            hiddenControls={mediaType === 'video'}
          />
        </BannerMedia>
        <BannerMediaOverlay opacity={overlayOpacity} />
        <BannerContent
          contentAlignment={contentAlignment}
          contentPosition={contentPosition}
        >
          <BannerRichtext value={data.content} />
        </BannerContent>
      </Banner>
    );
  }

  // For aspect ratio mode
  return (
    <div className="relative">
      <div className="relative w-full" style={{ 
        paddingBottom: `calc(100% / (${getAspectRatio().split('/')[0]} / ${getAspectRatio().split('/')[1]}))` 
      }}>
        <BannerMedia className="absolute inset-0">
          <SanityMedia
            mediaType={mediaType || 'image'}
            image={data.backgroundImage}
            video={data.backgroundVideo}
            className="h-full w-full"
            objectFit="cover"
            priority={section?.index === 0}
            hiddenControls={mediaType === 'video'}
          />
        </BannerMedia>
        <BannerMediaOverlay opacity={overlayOpacity} />
        <BannerContent
          contentAlignment={contentAlignment}
          contentPosition={contentPosition}
          className="absolute inset-0"
        >
          <BannerRichtext value={data.content} />
        </BannerContent>
      </div>
    </div>
  );
}

function BannerRichtext(props: {
  value?: ImageBannerSectionProps['content'] | null;
}) {
  const components = useMemo(
    () => ({
      types: {
        button: (props: {value: ButtonBlockProps}) => (
          <ButtonBlock {...props.value} />
        ),
      },
    }),
    [],
  );

  if (!props.value) return null;

  return (
    <div className="flex flex-col gap-4 text-balance [&_a]:w-fit [&_a:not(:last-child)]:mr-4">
      <PortableText
        components={components as PortableTextComponents}
        value={props.value}
      />
    </div>
  );
}

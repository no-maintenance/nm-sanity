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
import {SanityInternalLink} from '~/components/sanity/link/sanity-internal-link';
import {SanityExternalLink} from '~/components/sanity/link/sanity-external-link';

type ImageBannerSectionProps = SectionOfType<'imageBannerSection'>;

export function ImageBannerSection(
  props: SectionDefaultProps & {data: ImageBannerSectionProps},
) {
  const {data} = props;
  const {contentAlignment, contentPosition, overlayOpacity, mediaType, link, externalLink, openInNewTab} = data;
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

  // Create the banner content based on height mode
  const getBannerContent = () => {
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
            <BannerRichtext value={data.content} hasLink={!!(link || externalLink)} />
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
            <BannerRichtext value={data.content} hasLink={!!(link || externalLink)} />
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
            <BannerRichtext value={data.content} hasLink={!!(link || externalLink)} />
          </BannerContent>
        </div>
      </div>
    );
  };

  const bannerContent = getBannerContent();
  const linkClasses = "block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-[1.01]";

  // Wrap in internal link if provided
  if (link?.slug?.current || link?.documentType) {
    const internalLinkData = {
      link: data.link,
    };
    return (
      <SanityInternalLink data={internalLinkData as any} className={linkClasses}>
        {bannerContent}
      </SanityInternalLink>
    );
  }

  // Wrap in external link if provided
  if (externalLink) {
    const externalLinkData: {
      _type: 'externalLink';
      _key: string;
      link?: string | null;
      name?: string | null;
      openInNewTab?: boolean | null;
    } = {
      _type: 'externalLink',
      _key: data._key || 'external-link',
      link: externalLink,
      openInNewTab,
    };
    return (
      <SanityExternalLink data={externalLinkData} className={linkClasses}>
        {bannerContent}
      </SanityExternalLink>
    );
  }

  // Return unwrapped banner if no link
  return bannerContent;
}

function BannerRichtext(props: {
  value?: ImageBannerSectionProps['content'] | null;
  hasLink?: boolean;
}) {
  const components = useMemo(
    () => ({
      types: {
        button: (buttonProps: {value: ButtonBlockProps}) => {
          // Don't render buttons when the banner has a link
          // This prevents nested interactive elements
          if (props.hasLink) {
            return null;
          }
          return <ButtonBlock {...buttonProps.value} />;
        },
      },
    }),
    [props.hasLink],
  );

  if (!props.value) return null;

  // Filter out button blocks when banner has a link
  const filteredValue = props.hasLink
    ? props.value.filter(block => block._type !== 'button')
    : props.value;

  return (
    <div className="flex flex-col gap-4 text-balance [&_a]:w-fit [&_a:not(:last-child)]:mr-4">
      <PortableText
        components={components as PortableTextComponents}
        value={filteredValue}
      />
    </div>
  );
}

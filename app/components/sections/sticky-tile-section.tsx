import type { PortableTextComponents } from '@portabletext/react';
import type { SectionDefaultProps, SectionOfType } from 'types';

import { PortableText } from '@portabletext/react';
import { useMemo } from 'react';

// import type {ButtonBlockProps} from '../sanity/richtext/components/button-block'; // If you use button blocks

import { SanityMedia } from '../sanity/sanity-media';
import { cn } from '../../lib/utils';
import { useSection } from '../cms-section'; // For determining if it's the first section
import { Link } from '@remix-run/react'; // Assuming Remix for internal links if `link` can be internal
import { useShouldHaveFluidHeader } from '~/hooks/use-should-have-fluid-header';
import { useRootLoaderData } from '~/root';
import { SanityInternalLink } from '~/components/sanity/link/sanity-internal-link';
import { SanityExternalLink } from '~/components/sanity/link/sanity-external-link';
import { BannerContent, BannerMedia } from '~/components/banner';
import type { ContentPosition, ContentAlignment, SectionSettings } from 'types/sanity/sanity.generated'; // Import the specific types
import { useColorsCssVars } from '~/hooks/use-colors-css-vars';

type StickyTileSectionProps = SectionOfType<'stickyTileSection'>;
type TileProps = StickyTileSectionProps['tiles'];

// Temporarily define what the resolved link structure might look like after GROQ query
// This will be replaced by generated types once typegen is fixed.
interface ResolvedSanityLink {
    documentType?: string | null;
    slug?: { current?: string | null; _type?: string } | null;
}

interface TilePropsFallback {
    _key?: string;
    mediaType?: 'image' | 'video' | null;
    image?: any;
    video?: any;
    richtext?: any;
    link?: {
        documentType?: string | null;
        slug?: { current?: string | null; _type?: string } | null;
    } | null;
    externalLink?: string | null;
    openInNewTab?: boolean | null;
    contentPosition?: string | null;
    contentAlignment?: string | null;
    settings?: any;
    [key: string]: any;
}

// Helper to determine if a link is internal or external
const isInternalLink = (url?: string | null) => url && (url.startsWith('/') || url.startsWith('#'));

export function StickyTileSection(
    props: SectionDefaultProps & { data: StickyTileSectionProps },
) {
    const { data } = props;
    const { tiles, stickyColumn = 'left' } = data;
    const section = useSection();
    const { sanityRoot } = useRootLoaderData();
    const header = sanityRoot?.data?.header;
    const shouldHaveFluidHeader = useShouldHaveFluidHeader();

    if (!tiles || tiles.length < 2) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('StickyTileSection: Requires at least 2 tiles.');
        }
        return null;
    }

    const isFirstSection = section?.index === 0;
    // Use header height and sticky status from header data
    const headerIsSticky = header?.sticky === 'always' || header?.sticky === 'onScrollUp';
    const headerHeight = headerIsSticky ? (header?.desktopLogoWidth || 60) : 0; // Fallback to 60 if not set
    const stickyVhOffset = isFirstSection ? `calc(100vh - ${headerHeight}px)` : '100vh';

    const stickyTileIndex = 0; // The first tile in the array is always the candidate for stickiness
    const firstColumnTiles: TileProps[] = [];
    const secondColumnTiles: TileProps[] = [];
    const stickyTile = tiles[stickyTileIndex]
    function isStickyTile(stickyColumn: string, column: string, tiles: TileProps[], tile: TileProps, stickyTileIndex: number) {
        return stickyColumn === column && tiles.indexOf(tile) === stickyTileIndex;
    }

    return (
        <div className="">
            <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-0">
                <div className='h-full'>
                    <div className='sticky top-0'>
                        <Tile tile={stickyTile} isSticky={true} stickyHeight={stickyVhOffset} />
                    </div>
                </div>
                <div className='grid grid-cols-1 order-1 h-full'>
                    {tiles.slice(1).map((tile, index) => (
                        <Tile key={tile._key || `tile-col1-${index}`} tile={tile} isSticky={false} stickyHeight={undefined} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function Tile({
    tile,
    isSticky,
    stickyHeight,
    className,
}: {
    tile: TilePropsFallback;
    isSticky: boolean;
    stickyHeight?: string;
    className?: string;
}) {
    const {
        mediaType = 'image',
        image,
        video,
        richtext,
        link,
        externalLink,
        openInNewTab,
        contentPosition = 'middle_center',
        contentAlignment = 'center',
        settings,
    } = tile;

    const colorsCssVars = useColorsCssVars({settings});
    const portableTextComponents = useMemo((): PortableTextComponents => ({}), []);

    const hasMedia = (mediaType === 'image' && image?.asset) || (mediaType === 'video' && video?.asset);

    let mediaContainerClassName = 'aspect-auto'; // Default
    if (mediaType === 'video' && tile.video?.asset?.data?.aspect_ratio) {
        const aspectRatioStr = tile.video.asset.data.aspect_ratio;
        if (aspectRatioStr === '16:9') mediaContainerClassName = 'aspect-video';
        else if (aspectRatioStr === '9:16') mediaContainerClassName = 'aspect-[9/16]';
        // ... other mappings ...
    }

    const tileInnerContent = (
        <div
            className={cn(
                'w-full',
                'flex flex-col',
                'relative',
                isSticky ? 'h-full' : 'min-h-[200px]',
            )}
            style={isSticky ? { height: stickyHeight } : {}}
        >
            {hasMedia && (
                <div className={cn(
                    'relative w-full overflow-hidden',
                    isSticky ? 'h-full' : mediaContainerClassName
                )}
                >

                        <SanityMedia
                            image={image}
                            video={video}
                            mediaType={mediaType}
                            className={cn('w-full object-cover', isSticky ? 'h-full' : '')}
                            objectFit="cover"
                            priority={isSticky}
                            hiddenControls={mediaType === 'video'}
                        />
                </div>
            )}

            {richtext && (
                <div className='absolute inset-0'>
                    <BannerContent
                        contentPosition={contentPosition as ContentPosition | null}
                        contentAlignment={contentAlignment as ContentAlignment | null}
                        className={cn(
                            'py-4',
                            { 'flex-grow': !hasMedia }
                        )}
                    >
                        <div className="">
                            <PortableText value={richtext} components={portableTextComponents} />
                        </div>
                    </BannerContent>
                </div>
            )}
        </div>
    );

    const tileWrapperClasses = cn(
        'block w-full',
        isSticky ? 'h-full' : '',
        className,
        (link?.slug?.current || externalLink) && 'group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md'
    );

    if (link?.slug?.current) {
        const internalLinkData = {
            link: tile.link,
        };
        return (
            <SanityInternalLink data={internalLinkData as any} className={tileWrapperClasses}>
                {tileInnerContent}
            </SanityInternalLink>
        );
    } else if (externalLink) {
        const externalLinkData: {
            _type: 'externalLink';
            _key: string;
            link?: string | null;
            name?: string | null;
            openInNewTab?: boolean | null;
        } = {
            _type: 'externalLink',
            _key: tile._key || 'external-link',
            link: externalLink,
            openInNewTab: openInNewTab,
        };
        return (
            <SanityExternalLink data={externalLinkData} className={tileWrapperClasses}>
                {tileInnerContent}
            </SanityExternalLink>
        );
    }

    return (
        <div className={tileWrapperClasses}>
            <style dangerouslySetInnerHTML={{__html: colorsCssVars}} />
            {tileInnerContent}
        </div>
    );
} 
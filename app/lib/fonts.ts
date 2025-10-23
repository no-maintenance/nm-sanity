import type {ROOT_QUERYResult} from 'types/sanity/sanity.generated';

import {getFonts} from '~/components/fonts';

export type FontsQuery = NonNullable<ROOT_QUERYResult['fonts']>;

type PreloadLink = {
  as: string;
  crossOrigin: string;
  href: string;
  rel: string;
  tagName: string;
  type: string;
  key?: string;
};

export function generateFontsPreloadLinks({
  fontsData,
}: {
  fontsData?: FontsQuery | null;
}) {
  const fonts = fontsData ? getFonts({fontsData}) : [];
  const preloadLinks: Array<PreloadLink> = [];
  const fontTypes = ['woff2', 'woff', 'ttf'] as const;
  const seenUrls = new Set<string>();

  fonts.forEach((font) => {
    fontTypes.forEach((fontType) => {
      if (font[fontType]) {
        const url = font[fontType].url as string;

        // Skip if we've already added a preload for this URL
        if (seenUrls.has(url)) {
          return;
        }

        seenUrls.add(url);

        preloadLinks.push({
          as: 'font',
          crossOrigin: 'anonymous',
          href: url,
          rel: 'preload',
          tagName: 'link',
          type: `font/${fontType}`,
          key: url, // Add unique key for React
        });
      }
    });
  });

  return preloadLinks;
}

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
  // Preload only the single best format per font (woff2 preferred). Preloading
  // every format wastes bandwidth and competes with the format the browser
  // actually uses, which slows it down and causes the font to flash in late.
  const fontTypes = ['woff2', 'woff', 'ttf'] as const;
  const seenUrls = new Set<string>();

  fonts.forEach((font) => {
    const fontType = fontTypes.find((type) => font[type]);
    if (!fontType) return;

    const asset = font[fontType];
    if (!asset) return;

    const url = asset.url as string;
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    preloadLinks.push({
      as: 'font',
      crossOrigin: 'anonymous',
      href: url,
      rel: 'preload',
      tagName: 'link',
      type: `font/${fontType}`,
      key: url,
    });
  });

  return preloadLinks;
}

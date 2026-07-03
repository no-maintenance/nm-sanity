import type {CSSProperties} from 'react';

import {useRootLoaderData} from '~/root';

import {SanityImage} from '../sanity/sanity-image';

export function Logo(props: {
  className?: string;
  loading?: 'eager' | 'lazy';
  sanityEncodeData?: string;
  sizes?: string;
  style?: React.CSSProperties;
}) {
  const {sanityRoot} = useRootLoaderData();
  const data = sanityRoot?.data;
  const sanitySettings = data?.settings;
  const logo = sanitySettings?.logo;
  const siteName = sanitySettings?.siteName;

  const front = !logo?._ref ? (
    <div className="md:scale-100 scale-80 font-heading flex h-11 items-center justify-center text-2xl whitespace-nowrap">
      {siteName}
    </div>
  ) : (
    <SanityImage
      data={{
        ...logo,
        altText: siteName || '',
      }}
      {...props}
    />
  );

  return <LogoFlip front={front} />;
}

/**
 * Coin-flip reveal: on hover the wordmark revolves 180° around its vertical
 * axis (like the reference clip) and settles on the NO MAINTENANCE emblem,
 * all within half a second. The emblem is drawn as a currentColor mask so it
 * tracks the header's text color — white over the hero, black once solid.
 * Touch devices (no hover) just show the wordmark.
 */
function LogoFlip({front}: {front: React.ReactNode}) {
  const maskStyle: CSSProperties = {
    aspectRatio: '1275 / 1005',
    WebkitMaskImage: 'url(/nm-logo-white.png)',
    maskImage: 'url(/nm-logo-white.png)',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  };

  return (
    <span className="relative inline-block [perspective:600px]">
      <span className="relative block transition-transform duration-500 ease-out [transform-style:preserve-3d] [transform:rotateY(0deg)] notouch:group-hover:[transform:rotateY(180deg)] motion-reduce:transition-none">
        {/* Front: the wordmark */}
        <span className="block [backface-visibility:hidden]">{front}</span>
        {/* Back: the emblem, painted in the current text color */}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <span className="block h-14 bg-current" style={maskStyle} />
        </span>
      </span>
    </span>
  );
}

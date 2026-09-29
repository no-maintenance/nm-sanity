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
    // The wordmark is a fixed ~223px wide (whitespace-nowrap) and sits between
    // the menu button and the search/account/cart icons. There isn't room for
    // it at full size on narrow phones, so it scales up to the largest size
    // that fits the available gap (≈ viewport − 188px) and reaches full size
    // (scale-100) around 427px and on desktop. Breakpoints are tuned to real
    // iPhone widths (375 SE/mini, 390/393 std, 402 Pro, 414 Plus, 428+ Pro Max)
    // so every device gets as large a logo as fits without touching the icons.
    <div className="font-heading flex h-11 items-center justify-center text-2xl whitespace-nowrap scale-[0.75] min-[375px]:scale-[0.8] min-[390px]:scale-[0.85] min-[402px]:scale-[0.9] min-[414px]:scale-[0.95] min-[428px]:scale-100">
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

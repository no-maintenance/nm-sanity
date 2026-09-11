import type {CSSProperties} from 'react';

import {useId} from 'react';

import {cn} from '~/lib/utils';

const EMBLEM_SRC = '/nm-logo-white.png';

// Confine the glitch to the emblem silhouette (never the background).
const maskStyle: CSSProperties = {
  WebkitMaskImage: `url(${EMBLEM_SRC})`,
  maskImage: `url(${EMBLEM_SRC})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
};

// The mark itself, that the black specks drop out of.
const BASE_COLOR = '#ffffff';

// Speck passes: two slices of the clip (left/right), plus two more offset in
// time so twice as many distinct black blocks glitch through at once.
const SPECK_PASSES: {position: string; timeOffset: number}[] = [
  {position: 'object-left', timeOffset: 0},
  {position: 'object-right', timeOffset: 0},
  {position: 'object-left', timeOffset: 14},
  {position: 'object-right', timeOffset: 14},
];

/**
 * NO MAINTENANCE emblem with drifting black specks dropping out of it.
 *
 * The base is the solid emblem; over it a desaturated speck clip is inverted
 * (its grey background → white → no-op under multiply; its white specks → black)
 * and multiply-blended, so black specks punch dropouts into the mark. Both are
 * masked to the emblem shape (nothing on the background) and the whole composite
 * is rippled by the water displacement filter. Sits on a dark background.
 */
export function NmWaterGlitch({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const filterId = `nm-wg-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lo = Math.round(12 * intensity);
  const hi = Math.round(26 * intensity);
  const mid = Math.round(17 * intensity);
  const motionStyle = {'--nm-warp': intensity} as CSSProperties;

  return (
    // `screen` over the page turns the internal black blocks transparent (the
    // background shows through the cut-outs) while the white mark stays white.
    <div
      aria-label="NO MAINTENANCE"
      className={cn('relative select-none mix-blend-screen', className)}
      role="img"
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute h-0 w-0"
        focusable="false"
      >
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            height="180%"
            id={filterId}
            width="180%"
            x="-40%"
            y="-40%"
          >
            <feTurbulence
              baseFrequency="0.009 0.016"
              numOctaves="3"
              result="noise"
              seed="6"
              type="fractalNoise"
            >
              <animate
                attributeName="baseFrequency"
                calcMode="spline"
                dur="14s"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
                keyTimes="0;0.33;0.66;1"
                repeatCount="indefinite"
                values="0.009 0.016;0.013 0.020;0.010 0.014;0.009 0.016"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              xChannelSelector="R"
              yChannelSelector="G"
            >
              <animate
                attributeName="scale"
                calcMode="spline"
                dur="7s"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
                keyTimes="0;0.25;0.5;0.75;1"
                repeatCount="indefinite"
                values={`${lo};${hi};${mid};${hi};${lo}`}
              />
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>

      {/* Water sway → displacement ripple → solid mark + black specks. */}
      <div
        className="nm-warp-motion origin-center animate-nm-warp will-change-transform"
        style={motionStyle}
      >
        <div className="relative" style={{filter: `url(#${filterId})`}}>
          {/* Solid emblem (defines size). */}
          <span
            className="block w-full"
            style={{
              ...maskStyle,
              aspectRatio: '1275 / 1005',
              backgroundColor: BASE_COLOR,
            }}
          />
          {/* Specks: inverted binary clip → grey field becomes white (no-op
              under multiply) and specks become solid black, multiplied to punch
              solid-black dropouts into the white mark. Four passes sample
              different slices (object-left / -right) and two are offset in time
              so twice as many distinct blocks glitch through at once. */}
          {SPECK_PASSES.map((pass, i) => (
            <video
              aria-hidden
              autoPlay
              className={cn(
                'pointer-events-none absolute inset-0 h-full w-full object-cover grayscale invert mix-blend-multiply [image-rendering:pixelated]',
                pass.position,
              )}
              key={i}
              loop
              muted
              onLoadedMetadata={
                pass.timeOffset
                  ? (e) => {
                      e.currentTarget.currentTime = pass.timeOffset;
                    }
                  : undefined
              }
              playsInline
              src="/nm-glitch.mp4"
              style={maskStyle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import type {CSSProperties} from 'react';

import {useId} from 'react';

import {cn} from '~/lib/utils';

const EMBLEM_SRC = '/nm-logo-white.png';

/**
 * Liquid-warp NO MAINTENANCE emblem.
 *
 * Matches the reference reel, where the hand-drawn wordmark is alive: the whole
 * blob squashes, stretches and changes proportion while its outline "boils"
 * like wet ink. Two layers combine:
 *   1. a CSS squash/stretch transform (`nm-warp-squash`) — the dominant motion,
 *      morphing the emblem's overall shape;
 *   2. an animated SVG `feTurbulence` → `feDisplacementMap` — a low-frequency
 *      smooth wobble on the outline (the boil).
 *
 * Tuned to ~40% of the reel's amplitude ("reduce intensity by 60%"); dial it
 * with `intensity` (1 = default) which scales both layers together. Colour
 * comes from the PNG (white); size with `className` (e.g. `w-72`). Respects
 * `prefers-reduced-motion` (both layers off → static clean emblem).
 */
export function NmWarpLogo({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  // Unique per instance so multiple logos on one page don't share a filter.
  const filterId = `nm-warp-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  // Displacement ripple depth (element px). Eases smoothly between a shallow
  // and a deeper ripple so the surface gently swells — never scrambles.
  const lo = Math.round(12 * intensity);
  const hi = Math.round(26 * intensity);
  const midRipple = Math.round(17 * intensity);

  const motionStyle = {'--nm-warp': intensity} as CSSProperties;

  return (
    <div
      aria-label="NO MAINTENANCE"
      className={cn('relative isolate select-none', className)}
      role="img"
    >
      {/* Off-screen filter definition. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute h-0 w-0"
        focusable="false"
      >
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            height="200%"
            id={filterId}
            width="200%"
            x="-50%"
            y="-50%"
          >
            <feTurbulence
              baseFrequency="0.009 0.016"
              numOctaves="3"
              result="noise"
              seed="6"
              type="fractalNoise"
            >
              {/* Slowly morph the noise field so ripples travel and shimmer. */}
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
              {/* Ripple depth swells and settles smoothly. */}
              <animate
                attributeName="scale"
                calcMode="spline"
                dur="7s"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
                keyTimes="0;0.25;0.5;0.75;1"
                repeatCount="indefinite"
                values={`${lo};${hi};${midRipple};${hi};${lo}`}
              />
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>

      {/* Stepped jitter wrapper (the boil's scale/rotate/offset jumps). */}
      <div
        className="nm-warp-motion origin-center animate-nm-warp will-change-transform"
        style={motionStyle}
      >
        <img
          alt=""
          className="nm-warp block w-full"
          src={EMBLEM_SRC}
          style={{
            aspectRatio: '1275 / 1005',
            filter: `url(#${filterId})`,
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
}

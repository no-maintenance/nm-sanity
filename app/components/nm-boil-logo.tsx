import {cn} from '~/lib/utils';

/**
 * Exact NO MAINTENANCE boil — the real animation from the reference reel.
 *
 * `/nm-boil.mp4` is a seamless (ping-pong) loop cut straight from the source
 * recording: the actual hand-drawn emblem boiling on black, not a simulation.
 * White line-art on black, so it sits on a dark background. Size it with
 * `className` (the clip is square; e.g. `w-72`).
 */
export function NmBoilLogo({className}: {className?: string}) {
  return (
    <video
      aria-label="NO MAINTENANCE"
      autoPlay
      className={cn('block select-none', className)}
      loop
      muted
      playsInline
      poster="/nm-logo-white.png"
      src="/nm-boil.mp4"
    />
  );
}

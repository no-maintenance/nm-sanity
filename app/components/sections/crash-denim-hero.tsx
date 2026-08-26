/**
 * "Pre-Fall Seasonal Denim" home hero.
 *
 * Full-bleed campaign flat-lay with a "PRE-FALL SEASONAL DENIM RELEASE: 8/28"
 * headline pinned to the bottom-left, set in the SS26 display font. Desktop uses
 * the full landscape frame; mobile uses a portrait crop of the center washes.
 * Links to New Arrivals.
 *
 * Assets (committed to /public):
 *   - /prefall-denim.jpg         landscape flat-lay, NO baked-in text (desktop)
 *   - /prefall-denim-mobile.jpg  portrait crop, NO baked-in text (mobile)
 *
 * Note: filenames are versioned on each art change so the year-long asset cache
 * (Cache-Control: max-age=31536000) doesn't serve a stale image to returning
 * visitors. Bump the suffix whenever the photo changes.
 */

import {Link} from '@remix-run/react';

const HERO_IMAGE = '/prefall-denim.jpg';
const HERO_IMAGE_MOBILE = '/prefall-denim-mobile.jpg';
const HERO_LINK = '/collections/new-arrivals';

const HERO_CSS = `
@font-face {
  font-family: "SS26 Display";
  src: url("/fonts/ss26-display.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.crash-denim {
  position: relative;
  width: 100%;
  /* fit below the in-flow header so the whole tile (incl. the headline) is
     visible without scrolling; --header-height is set by the header component */
  height: calc(100svh - var(--header-height, 3.5rem));
  overflow: hidden;
  background: #0a0a0a;
  display: block;
  text-decoration: none;
}
.crash-denim__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}
/* bottom scrim so the white headline stays legible over the light photo */
.crash-denim::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 42%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.58), rgba(0, 0, 0, 0));
  z-index: 0;
  pointer-events: none;
}
.crash-denim__title {
  position: absolute;
  /* bottom-left corner, inset from the edges */
  left: 4vw;
  bottom: 5svh;
  margin: 0;
  z-index: 1;
  pointer-events: none;
  color: #fff;
  font-family: "SS26 Display", ui-monospace, Menlo, Monaco, monospace;
  font-weight: 400;
  text-transform: uppercase;
  white-space: nowrap;
  text-align: left;
  letter-spacing: 0.04em;
  line-height: 1.04;
  /* half the sale hero headline (5.7vw) */
  font-size: 2.85vw;
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.35);
}

/* portrait/mobile: wrap the longer release headline instead of overflowing */
@media (max-width: 768px) {
  .crash-denim__title {
    font-size: 5.5vw;
    white-space: normal;
    max-width: 72vw;
    line-height: 1.15;
  }
}

@media (prefers-reduced-motion: reduce) {
  .crash-denim__title { text-shadow: none; }
}
`;

export function CrashDenimHero() {
  return (
    <Link
      to={HERO_LINK}
      className="crash-denim"
      aria-label="Shop Pre-Fall Seasonal Denim — New Arrivals"
    >
      <style dangerouslySetInnerHTML={{__html: HERO_CSS}} />
      <picture>
        <source media="(max-width: 768px)" srcSet={HERO_IMAGE_MOBILE} />
        <img
          className="crash-denim__img"
          src={HERO_IMAGE}
          alt="Pre-Fall Seasonal Denim"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <h1 className="crash-denim__title">PRE-FALL SEASONAL DENIM RELEASE: 8/28</h1>
    </Link>
  );
}

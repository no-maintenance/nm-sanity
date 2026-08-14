/**
 * "Kumo Sneakers" home hero.
 *
 * Full-bleed campaign photo with a "KUMO SNEAKERS" headline pinned to the
 * bottom-left, set in the SS26 display font. Desktop uses a landscape crop of
 * the shoes; mobile uses the full portrait frame. Links to New Arrivals.
 *
 * Assets (committed to /public):
 *   - /kumo-hero.jpg         landscape crop, NO baked-in text (desktop)
 *   - /kumo-hero-mobile.jpg  full portrait frame, NO baked-in text (mobile)
 */

import {Link} from '@remix-run/react';

const HERO_IMAGE = '/kumo-hero.jpg';
const HERO_IMAGE_MOBILE = '/kumo-hero-mobile.jpg';
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

/* portrait/mobile: half the sale hero's mobile headline (7.3vw) */
@media (max-width: 768px) {
  .crash-denim__title {
    font-size: 3.65vw;
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
      aria-label="Shop Kumo Sneakers — New Arrivals"
    >
      <style dangerouslySetInnerHTML={{__html: HERO_CSS}} />
      <picture>
        <source media="(max-width: 768px)" srcSet={HERO_IMAGE_MOBILE} />
        <img
          className="crash-denim__img"
          src={HERO_IMAGE}
          alt="Kumo Sneakers"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <h1 className="crash-denim__title">KUMO SNEAKERS</h1>
    </Link>
  );
}

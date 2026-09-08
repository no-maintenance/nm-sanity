/**
 * "Double Collar Polo & Moc Toe Loafer" home hero.
 *
 * Full-bleed campaign diptych with a "DOUBLE COLLAR POLO & MOC TOE LOAFER: 9/3"
 * headline pinned to the bottom-left, set in the SS26 display font. Desktop
 * shows the full 16:9 diptych; mobile centers on the left-panel model. Links
 * to New Arrivals.
 *
 * Assets (committed to /public):
 *   - /sept3-landing.jpg         landscape diptych, NO baked-in text (desktop)
 *   - /sept3-landing-mobile.jpg  left-panel model crop, NO baked-in text (mobile)
 *
 * Note: filenames are versioned on each art change so the year-long asset cache
 * (Cache-Control: max-age=31536000) doesn't serve a stale image to returning
 * visitors. Bump the suffix whenever the photo changes.
 */

import {Link} from '@remix-run/react';

const HERO_IMAGE = '/sept11-landing.jpg';
const HERO_IMAGE_MOBILE = '/sept11-landing-mobile.jpg';
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
  /* desktop headline ~50px @1440 (3.47vw), scales with viewport */
  font-size: 3.47vw;
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.35);
}

/* desktop: size the hero to the landscape art's aspect ratio so the FULL
   image shows (no cover-crop). Height follows the 16:9 photo instead of the
   viewport. */
@media (min-width: 769px) {
  .crash-denim {
    height: auto;
    aspect-ratio: 2880 / 1360;
  }
}

/* portrait/mobile: keep the full-bleed frame but anchor the crop near the top
   so the model's head stays in view (cover trims the lower edge instead), and
   wrap the longer release headline. */
@media (max-width: 768px) {
  .crash-denim__img {
    object-position: center top;
  }
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
      aria-label="Shop FW26 Delivery 3 — New Arrivals"
    >
      <style dangerouslySetInnerHTML={{__html: HERO_CSS}} />
      <picture>
        <source media="(max-width: 768px)" srcSet={HERO_IMAGE_MOBILE} />
        <img
          className="crash-denim__img"
          src={HERO_IMAGE}
          alt="FW26 Delivery 3"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <h1 className="crash-denim__title">FW26 DELIVERY 3: RELEASING 9/11</h1>
    </Link>
  );
}

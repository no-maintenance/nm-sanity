/**
 * SS26 Summer Sale home hero.
 *
 * A full-bleed photo that cover-crops seamlessly from a wide desktop frame
 * into a tall mobile frame (the model stays centered), with a live
 * "SS26: SUMMER SALE" headline that scales with the viewport (clamp on vw)
 * and reflows — centered on desktop, lower-left + wrapped on mobile.
 *
 * Assets (committed to /public):
 *   - /ss26-hero.jpg        clean model photo, NO baked-in text
 *   - /fonts/ss26-display.*  the chamfered display font for the headline
 */

import {Link} from '@remix-run/react';

const HERO_IMAGE = '/ss26-hero.jpg';
const HERO_LINK = '/collections/summersale';

const HERO_CSS = `
@font-face {
  font-family: "SS26 Display";
  src: url("/fonts/ss26-display.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.ss26-hero {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 100svh;
  overflow: hidden;
  background: #0a0a0a;
  display: block;
  text-decoration: none;
}
.ss26-hero__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* keep the model centered as the frame crops from wide -> tall */
  object-position: center center;
  display: block;
}
.ss26-hero__title {
  position: absolute;
  /* centered on both axes; vertical center ~49% to match the mockups */
  top: 49%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  z-index: 1;
  pointer-events: none;
  color: #fff;
  font-family: "SS26 Display", ui-monospace, Menlo, Monaco, monospace;
  font-weight: 400;
  text-transform: uppercase;
  white-space: nowrap;
  text-align: center;
  letter-spacing: 0.04em;
  line-height: 1.04;
  /* landscape/desktop: headline spans ~68% of viewport width (mockup 01) */
  font-size: 5.7vw;
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.35);
}

/* portrait/mobile: same centered placement, larger relative size (~87% width, mockup 02) */
@media (max-width: 768px) {
  .ss26-hero__title {
    font-size: 7.3vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ss26-hero__title { text-shadow: none; }
}
`;

export function SaleHero() {
  return (
    <Link to={HERO_LINK} className="ss26-hero" aria-label="Shop SS26 Summer Sale">
      <style dangerouslySetInnerHTML={{__html: HERO_CSS}} />
      <img
        className="ss26-hero__img"
        src={HERO_IMAGE}
        alt="SS26 Summer Sale"
        fetchPriority="high"
        decoding="async"
      />
      <h1 className="ss26-hero__title">SS26:SUMMER SALE</h1>
    </Link>
  );
}

/**
 * Home Hero — the full-bleed image + headline at the top of the homepage.
 *
 * Content is editable in Sanity Studio under Header → "Home Hero"
 * (desktop image, mobile image, headline, link). If a field is empty, it falls
 * back to the hardcoded values below, so the hero never renders blank and always
 * matches the last shipped art. Read-path mirrors the announcement bar.
 *
 * Desktop shows the full image uncropped (the frame's aspect-ratio follows the
 * uploaded desktop image); mobile is full-bleed, top-anchored so the subject's
 * head stays in view. The headline sits bottom-left over a scrim.
 */

import {getImageDimensions} from '@sanity/asset-utils';
import {stegaClean} from '@sanity/client/stega';
import imageUrlBuilder from '@sanity/image-url';
import {Link} from '@remix-run/react';

import {useRootLoaderData} from '~/root';

// Fallbacks — keep in sync with the last shipped hero so nothing changes if the
// CMS fields are empty.
const FALLBACK_DESKTOP = '/sept11-landing.jpg';
const FALLBACK_MOBILE = '/sept11-landing-mobile.jpg';
const FALLBACK_LINK = '/collections/new-arrivals';
const FALLBACK_HEADLINE = 'FW26 DELIVERY 3: RELEASING 9/11';
const FALLBACK_ALT = 'FW26 Delivery 3';
const FALLBACK_DESKTOP_RATIO = '2880 / 1360';

const SRCSET_WIDTHS = [750, 1080, 1500, 2000, 2560, 2880, 3840];

/** Build responsive src/srcSet for a Sanity image (respecting hotspot/crop). */
function buildHeroImage(
  image: any,
  env?: {PUBLIC_SANITY_STUDIO_DATASET?: string; PUBLIC_SANITY_STUDIO_PROJECT_ID?: string},
) {
  const ref: string | undefined = image?.asset?._ref ?? image?._ref;
  if (!ref || !env?.PUBLIC_SANITY_STUDIO_PROJECT_ID || !env?.PUBLIC_SANITY_STUDIO_DATASET) return null;

  let dims: {height: number; width: number};
  try {
    dims = getImageDimensions(ref);
  } catch {
    return null;
  }

  const builder = imageUrlBuilder({
    dataset: env.PUBLIC_SANITY_STUDIO_DATASET,
    projectId: env.PUBLIC_SANITY_STUDIO_PROJECT_ID,
  })
    .image({_ref: ref, crop: image?.crop, hotspot: image?.hotspot})
    .auto('format');

  const widths = SRCSET_WIDTHS.filter((w) => w <= dims.width);
  if (widths.length === 0) widths.push(dims.width);

  return {
    alt: stegaClean(image?.altText)?.trim() || '',
    height: dims.height,
    src: builder.width(Math.min(dims.width, 2880)).url(),
    srcSet: widths.map((w) => `${builder.width(w).url()} ${w}w`).join(', '),
    width: dims.width,
  };
}

function buildCss(desktopRatio: string, headlineFontSize: string) {
  return `
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
  /* wrap long headlines instead of overflowing the right edge */
  white-space: normal;
  max-width: 92vw;
  text-align: left;
  letter-spacing: 0.04em;
  line-height: 1.08;
  /* desktop headline size: uses the CMS "Headline size" slider when set,
     otherwise a responsive default (min 24px, ~50px @1440, capped 50px) */
  font-size: ${headlineFontSize};
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.35);
}

/* desktop: size the hero to the desktop art's aspect ratio so the FULL image
   shows (no cover-crop). Height follows the photo instead of the viewport. */
@media (min-width: 769px) {
  .crash-denim {
    height: auto;
    aspect-ratio: ${desktopRatio};
  }
}

/* portrait/mobile: keep the full-bleed frame but anchor the crop near the top
   so the subject's head stays in view (cover trims the lower edge instead), and
   wrap the longer release headline. */
@media (max-width: 768px) {
  .crash-denim__img {
    object-position: center top;
  }
  .crash-denim__title {
    font-size: clamp(18px, 5.5vw, 34px);
    white-space: normal;
    max-width: 72vw;
    line-height: 1.15;
  }
}

@media (prefers-reduced-motion: reduce) {
  .crash-denim__title { text-shadow: none; }
}
`;
}

export function CrashDenimHero() {
  const {env, sanityRoot} = useRootLoaderData();
  const hero = sanityRoot?.data?.header?.hero;

  const desktop = buildHeroImage(hero?.desktopImage, env);
  const mobile = buildHeroImage(hero?.mobileImage, env);

  const headline = stegaClean(hero?.headline)?.trim() || FALLBACK_HEADLINE;
  const link = stegaClean(hero?.link)?.trim() || FALLBACK_LINK;

  // Desktop headline size from the CMS slider (px), else responsive default.
  const headlineSize = hero?.headlineSize;
  const headlineFontSize =
    typeof headlineSize === 'number' && headlineSize > 0
      ? `${headlineSize}px`
      : 'clamp(24px, 3.47vw, 50px)';

  const desktopSrc = desktop?.src || FALLBACK_DESKTOP;
  const mobileSrc = mobile?.src || FALLBACK_MOBILE;
  const alt = desktop?.alt || FALLBACK_ALT;
  const desktopRatio = desktop
    ? `${desktop.width} / ${desktop.height}`
    : FALLBACK_DESKTOP_RATIO;

  return (
    <Link
      to={link}
      className="crash-denim"
      aria-label={`Shop ${headline}`}
    >
      <style dangerouslySetInnerHTML={{__html: buildCss(desktopRatio, headlineFontSize)}} />
      <picture>
        <source
          media="(max-width: 768px)"
          srcSet={mobile?.srcSet || mobileSrc}
          sizes="100vw"
        />
        <img
          className="crash-denim__img"
          src={desktopSrc}
          srcSet={desktop?.srcSet}
          sizes="100vw"
          alt={alt}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <h1 className="crash-denim__title">{headline}</h1>
    </Link>
  );
}

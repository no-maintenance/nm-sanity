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

function buildCss(desktopRatio: string, headlineFontSize: string, headlineFontSizeMobile: string) {
  return `
/* expose the desktop hero's aspect ratio so sibling sections (e.g. the home
   tiles) can match the hero's height and stay in sync on image swaps. */
:root { --home-hero-desktop-ratio: ${desktopRatio}; }
@font-face {
  font-family: "SS26 Display";
  src: url("/fonts/ss26-display.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Alte Haas Grotesk";
  src: url("/fonts/alte-haas-grotesk.ttf") format("truetype");
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
/* left scrim so the white headline stays legible over the photo */
.crash-denim::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0) 50%);
  z-index: 0;
  pointer-events: none;
}
.crash-denim__title {
  position: absolute;
  /* left edge, vertically centered */
  left: 4vw;
  top: 44%;
  transform: translateY(-50%);
  margin: 0;
  z-index: 1;
  pointer-events: none;
  color: #fff;
  font-family: "Alte Haas Grotesk", ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-weight: 400;
  text-transform: uppercase;
  /* desktop: keep the headline on ONE line (auto-fit sizing, see component) */
  white-space: nowrap;
  text-align: left;
  /* tracking 25 */
  letter-spacing: 0.025em;
  line-height: 1.04;
  /* auto-fit: shrinks just enough to fit the headline on one line; the CMS
     "Headline size" slider caps the max (short headlines stay ~50px). */
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
  /* desktop headline placement — matches the design (more indented + lower). */
  .crash-denim__title {
    left: 11.5vw;
    top: 49%;
  }
}

/* portrait/mobile: keep the full-bleed frame but anchor the crop near the top
   so the subject's head stays in view (cover trims the lower edge instead). The
   headline stays on ONE line (auto-fit, same as desktop) to match the design. */
@media (max-width: 768px) {
  .crash-denim__img {
    object-position: center top;
  }
  /* mobile headline is smaller than desktop (matches the design ~12px). */
  .crash-denim__title {
    font-size: ${headlineFontSizeMobile};
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

  // Desktop headline: auto-fit to ONE line. `fitVw` is the largest size (in vw)
  // at which the headline still fits on one line. The CMS "Headline size" slider
  // caps the desktop max (set to 17 for the current design).
  const maxPx =
    typeof hero?.headlineSize === 'number' && hero.headlineSize > 0
      ? hero.headlineSize
      : 17;
  // Mobile headline reads ~0.7x the desktop size in the design (desktop ~17px,
  // mobile ~12px), so give mobile its own, smaller cap.
  const mobileMaxPx = maxPx * 0.7;
  const fitVw = 92 / (Math.max(headline.length, 1) * 0.85);
  const headlineFontSize = `min(${maxPx}px, ${fitVw.toFixed(2)}vw)`;
  const headlineFontSizeMobile = `min(${mobileMaxPx.toFixed(2)}px, ${fitVw.toFixed(2)}vw)`;

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
      <style dangerouslySetInnerHTML={{__html: buildCss(desktopRatio, headlineFontSize, headlineFontSizeMobile)}} />
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

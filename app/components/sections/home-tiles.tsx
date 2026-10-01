/**
 * Home Tiles — two side-by-side image tiles directly under the homepage hero.
 *
 * Equal columns on desktop, stacked on mobile. Full-bleed to match the hero.
 * Each tile links somewhere (defaults to New Arrivals), cover-crops its photo to
 * a shared frame so both columns line up, and shows a centred Inter caption that
 * matches the hero headline's weight.
 *
 * Links use plain <a> (full document navigation), NOT Remix <Link>: the targets
 * /fw26 and /collections/fw26 collide with the ($locale)/fw26 route pattern on
 * client-side nav (React Router can match ($locale)=collections → fw26), which
 * intermittently 404s. A document load lets the server route them correctly —
 * the same reason the /fw26 route's own "Shop the collection" CTA uses <a href>.
 */
const TILES = [
  {
    alt: 'FW26 — full looks',
    label: 'DISCOVER “WE WILL BE HOME AGAIN SOON”',
    link: '/fw26',
    // favour the centre where the subjects/red boots sit
    position: 'center',
    src: '/hometile-left-v1.jpg',
  },
  {
    alt: 'FW26 — jacket detail',
    label: 'SHOP FW26 COLLECTION',
    link: '/collections/fw26',
    // keep the face/collar in frame
    position: 'center 25%',
    src: '/hometile-right-v1.jpg',
  },
];

const CSS = `
@font-face {
  /* Inter (variable, latin) — self-hosted; used at the 18pt optical size, to
     match the hero headline. */
  font-family: "Inter 18pt";
  src: url("/fonts/inter-latin-var.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
.home-tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  width: 100%;
  background: #0a0a0a;
  /* cancel the <main> flex column's section gap so the tiles sit flush against
     the hero above AND the next section below (no white seam on either edge).
     Uses the same var/breakpoint as that gap. */
  margin-top: calc(var(--space-between-template-sections) * -0.75);
  margin-bottom: calc(var(--space-between-template-sections) * -1);
}
@media (min-width: 640px) {
  .home-tiles {
    margin-top: calc(var(--space-between-template-sections) * -1);
  }
}
.home-tiles__tile {
  position: relative;
  display: block;
  overflow: hidden;
  text-decoration: none;
  min-height: 0;
}
/* absolutely positioned so the image's intrinsic size never forces the tile
   taller than its aspect-ratio / hero-matched height. */
.home-tiles__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s ease;
}
.home-tiles__tile:hover .home-tiles__img {
  transform: scale(1.03);
}
/* centred caption — Inter, light weight (matches the hero headline exactly). */
.home-tiles__caption {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  margin: 0;
  padding: 0 6vw;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: "Inter 18pt", ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-optical-sizing: none;
  font-variation-settings: "opsz" 18, "wght" 250;
  font-weight: 250;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.2;
  white-space: nowrap;
  font-size: clamp(12px, 1.2vw, 18px);
  text-shadow: 0 1px 18px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

/* desktop: the two-tile row is the same size as the hero (full width + hero's
   aspect ratio), so each tile is exactly as tall as the hero image. */
@media (min-width: 769px) {
  .home-tiles {
    aspect-ratio: var(--home-hero-desktop-ratio, 3664 / 1908);
  }
  .home-tiles__tile {
    height: 100%;
  }
}

/* mobile: tiles stack full-width; keep each a portrait frame and let the long
   caption wrap instead of overflowing. */
@media (max-width: 768px) {
  .home-tiles {
    grid-template-columns: 1fr;
  }
  .home-tiles__tile {
    aspect-ratio: 4 / 5;
  }
  .home-tiles__caption {
    white-space: normal;
    font-size: clamp(13px, 3.4vw, 18px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-tiles__img,
  .home-tiles__tile:hover .home-tiles__img {
    transition: none;
    transform: none;
  }
}
`;

export function HomeTiles() {
  return (
    <section className="home-tiles" aria-label="Featured">
      <style dangerouslySetInnerHTML={{__html: CSS}} />
      {TILES.map((tile) => (
        <a
          key={tile.src}
          href={tile.link}
          className="home-tiles__tile"
          aria-label={tile.alt}
        >
          <img
            className="home-tiles__img"
            src={tile.src}
            alt={tile.alt}
            loading="lazy"
            decoding="async"
            style={{objectPosition: tile.position}}
          />
          <span className="home-tiles__caption">{tile.label}</span>
        </a>
      ))}
    </section>
  );
}

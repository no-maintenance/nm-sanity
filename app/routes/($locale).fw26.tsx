import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';

import {Link, useLoaderData} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import imageUrlBuilder from '@sanity/image-url';
import {useEffect, useRef, useState, type FormEvent} from 'react';
import {toast} from 'sonner';

import {getKlaviyoSubscriptionRequestData} from '~/components/klaviyo/newsletter';
import {
  KLAVIYO_BASE_URL,
  KLAVIYO_COMPANY_ID,
  KLAVIYO_LIST_ID,
} from '~/sanity/constants';

export const meta: MetaFunction = () => [
  {title: 'FW26 — We Will Be Home Again Soon | No Maintenance'},
  {
    name: 'description',
    content:
      'Fall Winter 2026. We Will Be Home Again Soon — the No Maintenance FW26 collection.',
  },
];

const SHOP_LINK = '/collections/fw26';
const NEW_ARRIVALS_LINK = '/collections/new-arrivals';

// Full runway film — web-optimized H.264 (1080p, ~22MB). Autoplays muted + loops.
const RUNWAY_VIDEO_URL = '/fw26/videos/runway.mp4';

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

// Top hero grid — six full runway films, each playing from the start and
// looping infinitely.
const HERO_VIDEOS = [
  {name: 'warr-topleft', alt: 'FW26 runway film', start: 0},
  {name: 'rob-topmiddle', alt: 'FW26 runway film', start: 0},
  {name: 'aaron-topright', alt: 'FW26 runway film', start: 0},
  {name: 'amu-bottomleft', alt: 'FW26 runway film', start: 0},
  {name: 'warr-bottommiddle', alt: 'FW26 runway film', start: 0},
  {name: 'rob-bottomright', alt: 'FW26 runway film', start: 0},
];

const WALK_LOOKS = [
  {name: 'walk-01', alt: 'FW26 runway — white long sleeve, wide grey trousers'},
  {name: 'walk-02', alt: 'FW26 runway — striped knit under black overshirt'},
  {name: 'walk-03', alt: 'FW26 runway — argyle knit hood'},
  {name: 'walk-04', alt: 'FW26 runway — hooded top with red boots'},
];

// FW26 release roadmap — every product shown in the grid, in display order.
// To rearrange the grid, just move an entry up or down in this list.
// `name` is the image file in /public/fw26 (without the .jpg). Name + price
// are intentionally left off each card so they can be filled in later.
const ROADMAP: Array<{name: string; alt: string}> = [
  // — Knits & tops —
  {name: 'product-grey-varsity-crew', alt: 'Grey crew knit with burgundy side stripe'},
  {name: 'product-burgundy-knit-polo', alt: 'Burgundy knit polo'},
  {name: 'product-lana-knit', alt: 'Lana High Knit'},
  {name: 'product-navy-polo', alt: 'Navy piqué polo shirt'},
  // — Jackets & outerwear —
  {name: 'product-mauve-jacket', alt: 'Mauve zip jacket'},
  {name: 'product-velum-jacket', alt: 'Velum Jacket'},
  {name: 'product-slate-bomber', alt: 'Slate bomber jacket'},
  {name: 'product-brown-flap-bomber', alt: 'Brown flap-pocket bomber jacket'},
  {name: 'product-oxblood-rivet-jacket', alt: 'Oxblood double-rivet leather jacket'},
  {name: 'product-black-denim-rivet-jacket', alt: 'Black double-rivet denim jacket'},
  {name: 'product-indigo-rivet-jacket', alt: 'Indigo double-rivet denim jacket'},
  {name: 'product-indigo-trucker', alt: 'Indigo denim trucker jacket'},
  {name: 'product-black-peacoat', alt: 'Black double-breasted peacoat'},
  // — Denim & pants —
  {name: 'product-drifter', alt: 'Drifter Flared Denim in Crash'},
  {name: 'product-torai-pants', alt: 'Torai Denim in Hickory Stripe'},
  {name: 'product-washed-jeans', alt: 'Washed wide-leg jeans'},
  {name: 'product-raw-indigo-jeans', alt: 'Raw indigo straight jeans'},
  {name: 'product-brown-cargo-pants', alt: 'Brown cargo pants'},
  {name: 'product-black-trousers', alt: 'Black wide-leg trousers'},
  // — Footwear —
  {name: 'product-zip-boots', alt: 'Black leather zip boots'},
];

const COLLECTION_COPY = [
  'The collection begins with the experience of leaving a place of familiarity and entering a condition where comfort can no longer be assumed. If there is anything that we are constantly reminded of during our time on this earth, it is that distance has a way of changing our relationship to what we know. Permanence becomes memory, and self-reliance becomes less of a choice than a necessity.',
  'The military, workwear, and various other references we utilized throughout the collection reinforce this idea. We have become increasingly interested in garments designed for movement through periods of historic or emotional uncertainty, in addition to clothing that provides a certainty of comfort without too many compromises. We are primarily concerned with clothing that is shaped by function, which offers endurance and the protection of the body; or even the mind.',
];

const SILHOUETTE_COPY = [
  'We find that there is an inherent softening to the severity of these garments and concepts when reimagined by our team.',
  'NO MAINTENANCE FW26 aims to structure the remains of this identity, and create an ensemble that carries the evidence of wear, vulnerability and time.',
];

const CLOSING_COPY = [
  'WE WILL BE HOME AGAIN SOON is about the tension between resilience and the desire to no longer need it.',
  'The collection sits somewhere between distance and return, iterating on the belief that eventually we will always find our way back to something that feels like home.',
];

const LANA_DESC =
  'Our Lana High Knit is composed of a soft, blue mid-weight mohair and wool blend. It is cut in a raglan construction and defined by the contrast hand-stitched white yarn that traces along major body seams, from the neck through the sleeve, and runs parallel along the full length of the front body zipper. Features a mock neck, bound edge cuffs and hemline, and a silver finish two-way zipper. Cut in a relaxed fit, with a slight crop.';

const VELUM_DESC =
  'Our Velum Jacket in Olive is made with a 100% cotton ripstop shell, filled for warmth and lined with cotton, cut in a slightly over sized fit. The shell is enzyme washed for a worn-in feel and look. Inspired by a vintage deck jacket, the Velum Jacket brings that silhouette into a fresh, modern interpretation, featuring a faux fur neck liner, elbow darting, YKK two-way zippers, and our seasonal argyle detail stitching along the collar and placket.';

const TORAI_DESC =
  'Our Torai Denim in Hickory Stripe is constructed from 11.5oz, 100% cotton denim, featuring hand distressing and darned repairs. The hickory stripe is woven into the fabric rather than printed, a workwear ticking that has run through railroad and mechanic uniforms for more than a century. The Torai cut has a wide-leg fit with a relaxed drape and twisted out seam, which rotates the outseam toward the front of the leg so the denim falls with a natural spiral and settles into the body as it wears in. Openings at the thigh and knee are backed and closed with darning stitched by hand, left visible so the repair reads as part of the garment rather. Because each pair is finished by hand, no two are identical.';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function Img({
  name,
  alt,
  className,
  priority = false,
}: {
  name: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture>
      <source media="(max-width: 768px)" srcSet={`/fw26/${name}-mobile.jpg`} />
      <img
        src={`/fw26/${name}.jpg`}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  );
}

function HeroVideo({
  name,
  alt,
  start,
}: {
  name: string;
  alt: string;
  start: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [useAnimatedImage, setUseAnimatedImage] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const seek = () => {
      try {
        v.currentTime = start;
      } catch {
        // ignore
      }
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener('loadedmetadata', seek, {once: true});

    // iOS Low Power Mode blocks video autoplay at the OS level. If play() is
    // rejected — or the video never actually starts — swap in an animated WebP
    // which loops even in Low Power Mode (it renders as an image, not a video).
    let swapped = false;
    const swap = () => {
      if (!swapped) {
        swapped = true;
        setUseAnimatedImage(true);
      }
    };
    const p = v.play();
    if (p) p.catch(swap);
    const t = setTimeout(() => {
      if (v.paused || v.currentTime < 0.02) swap();
    }, 2000);
    return () => clearTimeout(t);
  }, [start]);

  if (useAnimatedImage) {
    return (
      <img
        src={`/fw26/videos/${name}.webp`}
        alt={alt}
        className="block aspect-[4/5] w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <video
      ref={ref}
      src={`/fw26/videos/${name}.mp4?v=2`}
      poster={`/fw26/videos/${name}-poster.jpg`}
      className="block aspect-[4/5] w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label={alt}
    />
  );
}

function RunwayVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p) p.catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      src={RUNWAY_VIDEO_URL}
      poster="/fw26/runway-still.jpg"
      className="block aspect-[599/399] w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label="FW26 runway film"
    />
  );
}

function ReleaseCaption({
  title,
  price = '290',
  releasing = true,
  available = false,
  soldOut = false,
}: {
  title: string;
  price?: string;
  releasing?: boolean;
  available?: boolean;
  soldOut?: boolean;
}) {
  const status = soldOut
    ? 'Sold out'
    : available
      ? `Now available — $${price}`
      : releasing
        ? `Releasing soon — $${price}`
        : `$${price}`;
  return (
    <div className="mt-3 space-y-1">
      <p className="text-[11px] md:text-xs uppercase tracking-[0.12em] leading-snug">
        {title}
      </p>
      <p className="text-[11px] md:text-xs uppercase tracking-[0.12em] text-foreground/50">
        {status}
      </p>
    </div>
  );
}

function HoverProduct({
  name,
  alt,
  title,
  description,
  price,
  href,
  aspect = '3/4',
  releasing = true,
  available = false,
  soldOut = false,
}: {
  name: string;
  alt: string;
  title: string;
  description: string;
  price?: string;
  href?: string;
  aspect?: string;
  releasing?: boolean;
  available?: boolean;
  soldOut?: boolean;
}) {
  const content = (
    <>
      <div className="group relative overflow-hidden">
        <Img
          name={name}
          alt={alt}
          className={`block aspect-[${aspect}] w-full object-cover`}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-4">
          <p className="max-h-full overflow-hidden text-center text-[9px] leading-[1.3] text-white md:text-[10px]">
            {description}
          </p>
        </div>
      </div>
      <ReleaseCaption
        title={title}
        price={price}
        releasing={releasing}
        available={available}
        soldOut={soldOut}
      />
    </>
  );
  return href && !soldOut ? (
    <a href={href} className="block">
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
}

const CTA_CLASS =
  'inline-flex h-12 select-none items-center justify-center whitespace-nowrap bg-black px-9 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-black/85 disabled:opacity-50';

function ShopButton() {
  return (
    <div className="flex justify-center px-4 py-14 md:py-20">
      {/* Full-page navigation: /collections/fw26 collides with this route's
          ($locale)/fw26 pattern on client-side nav, so force a document load
          which the server routes correctly to the collection page. */}
      <a href={SHOP_LINK} style={{fontSize: '8.4px'}} className={CTA_CLASS}>
        Shop the collection
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Early-access newsletter                                             */
/* ------------------------------------------------------------------ */

function EarlyAccessSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(
        `${KLAVIYO_BASE_URL}/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`,
        {
          method: 'POST',
          headers: {
            revision: '2025-01-15',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            data: getKlaviyoSubscriptionRequestData(
              email,
              'fw26-early-access',
              KLAVIYO_LIST_ID,
            ),
          }),
        },
      );
      if (!res.ok) throw new Error('Request failed');
      setStatus('done');
      setEmail('');
    } catch (err) {
      setStatus('idle');
      toast('Uh oh! Something went wrong', {
        description:
          'There was a problem with your request. Please try again later.',
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 text-center">
      <p className="text-[9px] leading-relaxed md:whitespace-nowrap md:text-[10.5px]">
        Sign up for our newsletter to receive early access on FW26 product.
      </p>
      {status === 'done' ? (
        <p className="mt-6 text-sm uppercase tracking-[0.12em]">
          Thank you — you&rsquo;re on the list.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            id="fw26-newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            aria-label="Email Address"
            className="h-12 w-full border border-foreground/25 bg-transparent px-4 text-center font-semibold tracking-[0.12em] outline-none placeholder:uppercase placeholder:text-foreground/40 focus:border-foreground"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{fontSize: '8.4px'}}
            className={`${CTA_CLASS} w-full`}
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Roadmap — loaded from Sanity ("FW26 Roadmap"), falls back to ROADMAP */
/* ------------------------------------------------------------------ */

type RoadmapCard = {
  src: string;
  srcSet: string;
  alt: string;
  name: string;
  price: string;
  available: boolean;
  soldOut: boolean;
  url: string;
  description: string;
};

const FW26_ROADMAP_QUERY = `*[_type == "fw26Roadmap"][0]{
  products[]{
    name, price, url, available, soldOut, description,
    "alt": image.alt,
    "ref": image.asset._ref,
    "hotspot": image.hotspot,
    "crop": image.crop
  }
}`;

const CARD_WIDTHS = [500, 800, 1000, 1400];

export async function loader({context}: LoaderFunctionArgs) {
  const {env, sanity} = context;
  const projectId = env.PUBLIC_SANITY_STUDIO_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_STUDIO_DATASET;

  let products: RoadmapCard[] = [];
  try {
    const res = await sanity.loadQuery<{products?: any[]} | null>(
      FW26_ROADMAP_QUERY,
    );
    const builder =
      projectId && dataset ? imageUrlBuilder({projectId, dataset}) : null;
    const clean = (v: unknown) =>
      typeof v === 'string' ? stegaClean(v).trim() : '';

    products = (res?.data?.products ?? [])
      .map((p): RoadmapCard | null => {
        const ref = p?.ref as string | undefined;
        if (!ref || !builder) return null;
        let src = '';
        let srcSet = '';
        try {
          const img = builder
            .image({_ref: ref, crop: p?.crop, hotspot: p?.hotspot})
            .auto('format');
          src = img.width(1000).url();
          srcSet = CARD_WIDTHS.map((w) => `${img.width(w).url()} ${w}w`).join(
            ', ',
          );
        } catch {
          return null;
        }
        return {
          src,
          srcSet,
          alt: clean(p?.alt),
          name: clean(p?.name),
          price: clean(p?.price),
          available: !!p?.available,
          soldOut: !!p?.soldOut,
          url: clean(p?.url),
          description: clean(p?.description),
        };
      })
      .filter((p): p is RoadmapCard => !!p && !!p.src);
  } catch {
    products = [];
  }

  return {products};
}

/** Caption under a roadmap card: name + status/price, or reserved blank space. */
function RoadmapCaption({
  name,
  price,
  available,
  soldOut,
}: {
  name?: string;
  price?: string;
  available?: boolean;
  soldOut?: boolean;
}) {
  if (!name && !price && !soldOut) {
    return <div className="mt-3 min-h-[2.75rem]" />;
  }
  const label = available ? 'Now available' : 'Releasing soon';
  const status = soldOut
    ? 'Sold out'
    : price
      ? `${label} — $${price}`
      : available
        ? label
        : '';
  return (
    <div className="mt-3 min-h-[2.75rem] space-y-1">
      {name ? (
        <p className="text-[11px] md:text-xs uppercase tracking-[0.12em] leading-snug">
          {name}
        </p>
      ) : null}
      {status ? (
        <p className="text-[11px] md:text-xs uppercase tracking-[0.12em] text-foreground/50">
          {status}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function FW26() {
  // Guard against null loader data (e.g. if this route is ever matched without
  // its loader running) so the page can never white-screen.
  const data = useLoaderData<typeof loader>();
  const products = data?.products ?? [];
  return (
    <div className="fw26 w-full overflow-x-clip bg-background text-foreground">
      {/* Season heading */}
      <div className="px-6 py-4">
        <div className="mx-auto grid max-w-2xl grid-cols-3 items-center text-[1.125rem] uppercase tracking-[0.15em] sm:text-[1.3125rem] md:text-[1.5rem] md:tracking-[0.2em]">
          <span className="text-left">Fall</span>
          <span className="text-center">Winter</span>
          <span className="text-right">2026</span>
        </div>
      </div>

      {/* Hero video grid — frozen (sticky) backdrop; content scrolls over it.
          The sticky `top` is (100vh − gridHeight), which pins the BOTTOM of the
          grid to the viewport bottom: all 6 videos scroll through, then the last
          row freezes as the content rises over it. Grid height = rows × tile
          height (aspect 4/5 → 1.25× width): mobile 2-col = 3 × 62.5vw = 187.5vw;
          desktop 3-col = 2 × 41.667vw = 83.334vw. */}
      <div className="sticky top-[calc(100dvh_-_187.5vw)] z-0 grid grid-cols-2 md:top-[calc(100dvh_-_83.334vw)] md:grid-cols-3">
        {HERO_VIDEOS.map((v) => (
          <HeroVideo key={v.name} name={v.name} alt={v.alt} start={v.start} />
        ))}
      </div>

      {/* Everything below scrolls up and covers the frozen videos */}
      <div className="relative z-10 bg-background">
        {/* Collection title */}
      <h1 className="px-4 pt-14 pb-4 text-center text-xl uppercase leading-none tracking-[0.15em] md:pb-6 md:pt-20 md:text-3xl">
        &ldquo;We Will Be Home Again Soon&rdquo;
      </h1>

      {/* Early access */}
      <EarlyAccessSignup />

      {/* Intro editorial — products + pair image + copy */}
      <section className="w-full px-4 py-14 md:px-0 md:py-20">
        <div className="flex flex-col gap-14 md:flex-row md:items-stretch md:justify-center md:gap-[1.3%]">
          {/* Left: products */}
          <div className="order-2 md:order-1 md:w-[38.1%]">
            <div className="grid grid-cols-2 gap-4 md:gap-[3.4%]">
              <HoverProduct
                name="product-velum-jacket"
                alt="Velum Jacket"
                title="Velum Jacket"
                description={VELUM_DESC}
                price="325"
                href={NEW_ARRIVALS_LINK}
              />
              <HoverProduct
                name="product-torai-pants"
                alt="Torai Wide Leg Pants in Hickory Stripe"
                title="Torai Wide Leg Pants in Hickory Stripe"
                description={TORAI_DESC}
                href={NEW_ARRIVALS_LINK}
              />
            </div>
          </div>

          {/* Right: pair image */}
          <div className="order-1 md:order-2 md:w-[38.5%]">
            <Img
              name="pair-warehouse"
              alt="Two models in the FW26 collection"
              className="block aspect-[360/488] w-full object-cover"
            />
          </div>
        </div>

        {/* Boots (footwear) left; collection copy centered on the right */}
        <div className="mt-14 md:mt-20 md:flex md:items-center">
          <div className="w-1/2 md:ml-[3.5%] md:w-[46.5%]">
            <Img
              name="boots"
              alt="FW26 footwear"
              className="block aspect-[348/472] w-full object-cover"
            />
          </div>
          <div className="mt-14 space-y-4 text-center text-[0.65625rem] leading-relaxed md:mt-0 md:w-[46.5%] md:space-y-4 md:px-[3.4%] md:text-[9.75px]">
            {COLLECTION_COPY.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Runway walk grid — full bleed */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {WALK_LOOKS.map((look) => (
          <Img
            key={look.name}
            name={look.name}
            alt={look.alt}
            className="block aspect-[4/5] w-full object-cover"
          />
        ))}
      </div>

      {/* Shop CTA */}
      <ShopButton />

      {/* Video of runway */}
      <RunwayVideo />

      {/* Silhouette copy */}
      <section className="w-full px-4 py-14 md:px-0 md:py-20">
        <div className="space-y-4 text-[0.65625rem] leading-relaxed text-center md:mx-auto md:max-w-[78%] md:text-[9.75px]">
          {SILHOUETTE_COPY.map((line) => (
            <p key={line.slice(0, 24)}>{line}</p>
          ))}
        </div>

        {/* Silhouette image + Lana knit — centered, matched size */}
        <div className="mt-14 md:mt-20">
          <div className="grid grid-cols-2 items-start gap-4 md:flex md:justify-center md:gap-[1.3%]">
            <div className="md:w-[28.5%]">
              <Img
                name="silhouette"
                alt="FW26 knitwear silhouette"
                className="block aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="md:w-[28.5%]">
              <HoverProduct
                name="product-lana-knit"
                alt="Lana High Knit"
                title="Lana High Knit"
                description={LANA_DESC}
                aspect="4/5"
                href="https://nomaintenance.us/products/lana-high-knit-blue"
                soldOut
              />
            </div>
          </div>
        </div>

        {/* Red boots + street — gap centered on page, bottom edges aligned */}
        <div className="mt-14 md:mt-20">
          <div className="grid grid-cols-2 items-end gap-x-4 md:gap-x-[1.3%]">
            <div className="justify-self-end w-[55.85%] md:w-[47.25%]">
              <Img
                name="street"
                alt="FW26 collection worn on location"
                className="block aspect-[200/292] w-full object-cover"
              />
            </div>
            <div className="justify-self-start w-full md:w-[84.6%]">
              <Img
                name="red-boots"
                alt="FW26 boots detail"
                className="block aspect-[376/508] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Editorial — full bleed. Left: two stacked photos; right: leather look */}
      <div className="grid grid-cols-2">
        {/* Left column — group shot over bags shot; heights sum to the right image */}
        <div>
          <Img
            name="editorial-group"
            alt="FW26 collection — backstage group"
            className="block aspect-[594/445] w-full object-cover"
          />
          <Img
            name="editorial-bags"
            alt="FW26 collection — bags"
            className="block aspect-[594/445] w-full object-cover"
          />
        </div>
        <Img
          name="editorial-suit"
          alt="FW26 collection — tailoring"
          className="block aspect-[594/890] w-full object-cover"
        />
      </div>

      {/* Closing copy — sits in the break between the editorial images and grid */}
      <section className="w-full px-4 pt-14 md:px-0 md:pb-4 md:pt-20">
        <div className="space-y-4 text-[0.65625rem] leading-relaxed text-center md:mx-auto md:max-w-[78%] md:text-[9.75px]">
          {CLOSING_COPY.map((line) => (
            <p key={line.slice(0, 24)}>{line}</p>
          ))}
        </div>
      </section>

      {/* Release roadmap grid — very bottom. Edit in Sanity ("FW26 Roadmap");
          falls back to the hardcoded ROADMAP list above when the CMS is empty. */}
      <section className="container pt-14 md:pt-16">
        <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-4 md:gap-x-[1.3%]">
          {products.length > 0
            ? products.map((p, i) => {
                const card = (
                  <>
                    <div className="group relative overflow-hidden">
                      <img
                        src={p.src}
                        srcSet={p.srcSet || undefined}
                        sizes="(min-width: 768px) 25vw, 50vw"
                        alt={p.alt}
                        loading="lazy"
                        decoding="async"
                        className="block aspect-[3/4] w-full object-cover"
                      />
                      {p.description ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-4">
                          <p className="max-h-full overflow-hidden text-center text-[9px] leading-[1.3] text-white md:text-[10px]">
                            {p.description}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <RoadmapCaption
                      name={p.name}
                      price={p.price}
                      available={p.available}
                      soldOut={p.soldOut}
                    />
                  </>
                );
                // Sold out → labelled, not clickable.
                if (p.soldOut) {
                  return <div key={i}>{card}</div>;
                }
                // Releasing soon → send shoppers to the New Arrivals page.
                if (!p.available) {
                  return (
                    <Link key={i} to={NEW_ARRIVALS_LINK} className="block">
                      {card}
                    </Link>
                  );
                }
                // Available → link to its own product page if one is set.
                return p.url ? (
                  <a key={i} href={p.url} className="block">
                    {card}
                  </a>
                ) : (
                  <div key={i}>{card}</div>
                );
              })
            : ROADMAP.map((product) => (
                <div key={product.name}>
                  <Img
                    name={product.name}
                    alt={product.alt}
                    className="block aspect-[3/4] w-full object-cover"
                  />
                  {/* Reserved space for name + price — fill in later */}
                  <div className="mt-3 min-h-[2.75rem]" />
                </div>
              ))}
        </div>
      </section>
      </div>
    </div>
  );
}

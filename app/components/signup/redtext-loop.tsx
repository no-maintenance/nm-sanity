import {useEffect, useRef} from 'react';

/**
 * Animated scattered-red-text header for the signup.
 *
 * Shows ONLY the (clean) expanded-blur artwork. Each detected letter/word
 * cluster fades in and out on its own randomly-offset phase, in one of two
 * styles — and in BOTH styles the whole letter is always drawn (never cut):
 *   'radial' — radial fade: becomes visible from its centre outward (soft
 *              edge, no scaling) and fades out extremities-first.
 *   'ltr'    — drifts: slides in from the left as it fades in and keeps moving
 *              right as it fades out (a continuous left→right travel).
 * Every cluster currently uses the left-to-right drift; with random phases a shifting ~50% of the
 * clusters are visible at any instant.
 *
 * Each cluster is sampled from a region of the artwork sized to that letter's
 * own bounding box (plus margin for the soft halo) — never a fixed square — so
 * wide letters like "no" are never clipped.
 */

// Per-cluster: centre cx,cy (fractions of W,H), half-width (fraction of W),
// half-height (fraction of H), and style. Measured from the artwork.
const CLUSTERS: Array<[number, number, number, number, 'radial' | 'ltr']> = [
  [0.9233, 0.1651, 0.0467, 0.0067, 'ltr'],
  [0.1453, 0.1556, 0.0433, 0.0074, 'ltr'],
  [0.247, 0.2405, 0.0437, 0.0056, 'ltr'],
  [0.4887, 0.1536, 0.0313, 0.0105, 'ltr'],
  [0.708, 0.2151, 0.0334, 0.0074, 'ltr'],
  [0.8463, 0.1656, 0.017, 0.0056, 'ltr'],
  [0.0337, 0.2187, 0.0303, 0.0054, 'ltr'],
  [0.966, 0.2115, 0.0347, 0.0054, 'ltr'],
  [0.7747, 0.2174, 0.022, 0.0051, 'ltr'],
  [0.2407, 0.1762, 0.022, 0.0054, 'ltr'],
  [0.375, 0.1646, 0.0197, 0.0056, 'ltr'],
  [0.5777, 0.2028, 0.0197, 0.0054, 'ltr'],
  [0.2823, 0.1503, 0.0197, 0.0056, 'ltr'],
  [0.4463, 0.2536, 0.0204, 0.0054, 'ltr'],
  [0.6747, 0.1874, 0.0207, 0.0054, 'ltr'],
  [0.884, 0.1877, 0.0187, 0.0056, 'ltr'],
  [0.098, 0.2177, 0.0187, 0.0054, 'ltr'],
];

// Extra padding (px) around each letter's bbox so the soft halo is included
// and the region edge lands on transparent artwork.
const MARGIN = 12;

export function RedTextLoop({
  blurSrc = '/signup/redtext-blurbig.png?v=17',
  periodMs = 6000,
  className,
  style,
}: {
  blurSrc?: string;
  periodMs?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const phases = useRef<number[]>(
    CLUSTERS.map(() => Math.random() * Math.PI * 2),
  );

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blur = new Image();
    let raf = 0;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Draw one cluster. `p` is presence 0..1 (opacity); `theta` is the raw
    // phase angle driving the ltr drift; `still` draws it static (reduced motion).
    const drawCluster = (
      cxPx: number,
      cyPx: number,
      halfWpx: number,
      halfHpx: number,
      p: number,
      theta: number,
      mode: 'radial' | 'ltr',
      still: boolean,
    ) => {
      if (!octx || p <= 0) return;
      const W = canvas.width;
      const H = canvas.height;
      const rwH = halfWpx + MARGIN;
      const rhH = halfHpx + MARGIN;
      const rw = Math.ceil(rwH * 2);
      const rh = Math.ceil(rhH * 2);
      const rx = Math.round(cxPx - rwH);
      const ry = Math.round(cyPx - rhH);
      if (off.width < rw || off.height < rh) {
        off.width = Math.max(off.width, rw);
        off.height = Math.max(off.height, rh);
      }
      octx.clearRect(0, 0, rw, rh);
      octx.globalCompositeOperation = 'source-over';
      // Sample the artwork region, clamped to the image (1:1, no distortion).
      const sx0 = Math.max(0, rx);
      const sy0 = Math.max(0, ry);
      const sx1 = Math.min(W, rx + rw);
      const sy1 = Math.min(H, ry + rh);
      const sw = sx1 - sx0;
      const sh = sy1 - sy0;
      if (sw <= 0 || sh <= 0) return;
      octx.drawImage(blur, sx0, sy0, sw, sh, sx0 - rx, sy0 - ry, sw, sh);
      octx.globalCompositeOperation = 'destination-in';
      const lx = cxPx - rx;
      const ly = cyPx - ry;
      const R = Math.hypot(rwH, rhH); // reaches the region corners
      let g: CanvasGradient;
      let alpha: number;
      if (mode === 'radial' && !still) {
        // Radial fade: a soft disc of visibility grows out from the centre as
        // the letter fades in (and shrinks back as it fades out). The falloff
        // is wide, so there is never a hard circular edge — the centre is
        // simply visible before the extremities. At full presence the disc
        // covers the whole letter at full opacity.
        const outer = R * (0.4 + 1.6 * p);
        g = octx.createRadialGradient(lx, ly, 0, lx, ly, outer);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.5, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        alpha = Math.min(1, p * 2); // gentle overall ease so the centre doesn't pop
      } else {
        // Soft vignette so the region edge is never a hard line.
        g = octx.createRadialGradient(lx, ly, 0, lx, ly, R);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.8, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        alpha = p;
      }
      octx.fillStyle = g;
      octx.fillRect(0, 0, rw, rh);
      octx.globalCompositeOperation = 'source-over';

      ctx.globalAlpha = alpha;
      if (still || mode === 'radial') {
        // Drawn at its true size and position; the radial mask does the reveal.
        ctx.drawImage(off, 0, 0, rw, rh, rx, ry, rw, rh);
      } else {
        // Drift: continuous left→right travel across the visible window. The
        // wrap-around happens at the point of zero presence, so it is unseen.
        const TAU = Math.PI * 2;
        const phi = (((theta - 1.5 * Math.PI) % TAU) + TAU) % TAU; // 0 at p=0
        const shift = 20 + halfWpx * 0.5;
        const dx = -shift + (2 * shift * phi) / TAU;
        ctx.drawImage(off, 0, 0, rw, rh, rx + dx, ry, rw, rh);
      }
      ctx.globalAlpha = 1;
    };

    const paint = (t: number) => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < CLUSTERS.length; i++) {
        const [cx, cy, hwx, hhy, mode] = CLUSTERS[i];
        const theta = 2 * Math.PI * t + phases.current[i];
        const p = reduceMotion ? 1 : (1 + Math.sin(theta)) / 2;
        if (p <= 0.02) continue;
        drawCluster(
          cx * W,
          cy * H,
          hwx * W,
          hhy * H,
          p,
          theta,
          mode,
          reduceMotion,
        );
      }
    };

    const loop = (now: number) => {
      paint((now % periodMs) / periodMs);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (!blur.naturalWidth) return;
      canvas.width = blur.naturalWidth;
      canvas.height = blur.naturalHeight;
      if (reduceMotion) {
        paint(0);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    blur.onload = start;
    blur.src = blurSrc;

    return () => cancelAnimationFrame(raf);
  }, [blurSrc, periodMs]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{display: 'block', width: '100%', height: 'auto', ...style}}
    />
  );
}

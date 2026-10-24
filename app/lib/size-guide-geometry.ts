/**
 * Where each measurement arrow sits on each garment drawing.
 *
 * Both the drawings and these coordinates were recovered from the five
 * SIZEGUIDE_MOCK files: the red arrows were isolated by colour channel, their
 * two halves (the number sits in a gap in the middle) paired by fitting each
 * stub's principal direction, and the endpoints re-expressed relative to the
 * cropped drawing. So an arrow lands exactly where the mockup drew it.
 *
 * `guides` are the dotted leader lines tying an arrow back to the silhouette.
 * Their far ends were found by walking in from each arrow endpoint until the
 * first dark pixel of the drawing, so they touch the actual garment edge.
 * `null` means that end needs no leader — the arrow already crosses the
 * garment (pit to pit, thigh).
 *
 * Coordinates are in a 1000-wide space with the drawing at (0,0)-(1000,height),
 * where `height` keeps the PNG's real aspect ratio. Values outside that box are
 * intentional — most arrows sit just off the garment, hence the padded viewBox.
 *
 * Regenerate with .context/tools/{arrow-pairs,guide-anchors}.py.
 */

import type {GarmentKey, MeasurementKey} from './size-guide';

export interface Point {
  x: number;
  y: number;
}

export interface ArrowSpec {
  /** Dotted leader for each end; null where none is drawn. */
  guides: [null | Point, null | Point];
  /** Which side of the line the number sits on. */
  label: 'above' | 'left' | 'right';
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface GarmentSpec {
  arrows: Partial<Record<MeasurementKey, ArrowSpec>>;
  /** Drawing height in the 1000-wide coordinate space. */
  height: number;
  src: string;
}

type Raw = [number, number, number, number, ArrowSpec['label']];
type RawGuides = [null | [number, number], null | [number, number]];

/**
 * The crotch apex — the point the rise and inseam leaders have to touch.
 *
 * Found by .context/tools/find-crotch.py, which took three goes. Scanning up
 * from the hem lands far too low: these are sketchy lines, so a stray break in
 * a seam reads as the gap closing. Fitting the two inner seams and intersecting
 * them overshoots the other way, because the seams curve near the apex and the
 * far-field slope opens too fast. What works is scanning down for the first row
 * carrying a *small* (>=4px) gap that then stays open — threshold low enough to
 * catch the apex itself, sustained long enough to reject noise.
 */
const CROTCH: [number, number] = [0.5169, 0.4379];

function garment(
  src: string,
  imgW: number,
  imgH: number,
  arrows: Record<string, {a: Raw; g: RawGuides}>,
): GarmentSpec {
  const height = (1000 * imgH) / imgW;
  const X = (n: number) => Math.round(n * 1000);
  const Y = (n: number) => Math.round(n * height);
  const out: Partial<Record<MeasurementKey, ArrowSpec>> = {};
  for (const [key, {a, g}] of Object.entries(arrows)) {
    const [x1, y1, x2, y2, label] = a;
    out[key as MeasurementKey] = {
      guides: [
        g[0] ? {x: X(g[0][0]), y: Y(g[0][1])} : null,
        g[1] ? {x: X(g[1][0]), y: Y(g[1][1])} : null,
      ],
      label,
      x1: X(x1),
      x2: X(x2),
      y1: Y(y1),
      y2: Y(y2),
    };
  }
  return {arrows: out, height, src};
}

export const GARMENTS: Record<GarmentKey, GarmentSpec> = {
  bottoms: garment('/sizeguide/bottoms.png', 712, 1192, {
    // Rise and inseam both meet at CROTCH, so their arrows end on that row and
    // their leaders run flat to it. Probing in from the arrow (how every other
    // leader was found) stops at the outer leg seam instead, which left the
    // dots short of the crotch.
    //
    // The inseam arrow runs *down the right leg* rather than outside the
    // garment — measured off the supplied reference at 0.178 of the garment's
    // width right of the crotch, with its number in a break in the line.
    inseam: {
      a: [0.6771, CROTCH[1], 0.6771, 0.966, 'above'],
      g: [CROTCH, [0.5976, 0.9656]],
    },
    legOpening: {
      a: [0.055, 1.001, 0.41, 1.017, 'above'],
      g: [[0.0618, 0.9505], [0.4171, 0.9622]],
    },
    // Number in a break in the line, as the mockup draws it.
    rise: {
      a: [0.787, 0.039, 0.787, CROTCH[1], 'above'],
      g: [[0.23, 0.0403], CROTCH],
    },
    thigh: {
      a: [0.136, 0.459, 0.49, 0.484, 'above'],
      g: [null, null],
    },
    waist: {
      a: [0.235, -0.025, 0.792, -0.025, 'above'],
      g: [[0.2346, 0.0369], [0.7921, 0.0453]],
    },
  }),
  jersey: garment('/sizeguide/jersey.png', 983, 966, {
    pitToPit: {
      a: [0.233, 0.423, 0.777, 0.423, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.222, -0.117, 0.771, -0.117, 'above'],
      g: [[0.2218, 0.117], [0.7711, 0.1035]],
    },
    sleeveLength: {
      a: [0.13, 0.059, -0.038, 0.308, 'left'],
      g: [[0.2187, 0.1211], [0.0509, 0.3706]],
    },
    totalLength: {
      a: [1.079, 0.064, 1.079, 0.96, 'right'],
      g: [[0.6755, 0.0642], null],
    },
  }),
  knitwear: garment('/sizeguide/knitwear.png', 1031, 1063, {
    pitToPit: {
      a: [0.24, 0.4, 0.768, 0.4, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.205, -0.029, 0.791, -0.029, 'above'],
      g: [[0.2047, 0.1656], [0.7915, 0.1722]],
    },
    sleeveLength: {
      a: [0.055, 0.141, -0.083, 0.926, 'left'],
      g: [[0.1998, 0.1646], [0.0495, 0.9483]],
    },
    totalLength: {
      a: [1.058, 0.079, 1.061, 0.825, 'right'],
      g: [[0.6605, 0.0809], [0.9544, 0.825]],
    },
  }),
  outerwear: garment('/sizeguide/outerwear.png', 1235, 1052, {
    pitToPit: {
      a: [0.232, 0.5, 0.767, 0.5, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.27, -0.015, 0.728, -0.015, 'above'],
      g: [[0.2696, 0.1654], [0.7279, 0.1939]],
    },
    sleeveLength: {
      a: [0.173, 0.143, -0.051, 0.875, 'left'],
      g: [[0.2583, 0.1787], [0.034, 0.9106]],
    },
    totalLength: {
      a: [0.958, 0.074, 0.958, 0.846, 'right'],
      g: [[0.617, 0.0741], [0.5, 0.846]],
    },
  }),
  shirting: garment('/sizeguide/shirting.png', 1104, 1061, {
    pitToPit: {
      a: [0.299, 0.389, 0.736, 0.389, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.275, -0.079, 0.755, -0.079, 'above'],
      g: [[0.2754, 0.1225], [0.7554, 0.1282]],
    },
    sleeveLength: {
      a: [0.181, 0.076, -0.086, 0.855, 'left'],
      g: [[0.2799, 0.1131], [0.125, 0.9331]],
    },
    totalLength: {
      a: [1.02, 0.07, 1.02, 0.904, 'right'],
      g: [[0.6449, 0.0697], [0.962, 0.9039]],
    },
  }),
};

/**
 * Smallest box holding the drawing, every one of its arrows, and room for the
 * numbers beside them.
 *
 * A fixed pad would have to clear the worst case on all four sides at once,
 * which left the garment floating small in the middle for measurements like pit
 * to pit that sit entirely inside it. Deriving the box per garment keeps the
 * drawing as large as its own arrows allow — and keeps it still between tabs,
 * which a per-arrow box would not.
 */
export function viewBoxFor(g: GarmentSpec): string {
  let minX = 0;
  let minY = 0;
  let maxX = 1000;
  let maxY = g.height;
  const grow = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const a of Object.values(g.arrows)) {
    if (!a) continue;
    grow(a.x1, a.y1);
    grow(a.x2, a.y2);
    for (const gu of a.guides) if (gu) grow(gu.x, gu.y);
    // Numbers sitting beside a line need their own clearance.
    if (a.label === 'left') grow(Math.min(a.x1, a.x2) - 200, a.y1);
    if (a.label === 'right') grow(Math.max(a.x1, a.x2) + 200, a.y1);
    // A number inside a break in the line straddles it, so make room on both
    // axes — a vertical arrow (rise, inseam) needs the horizontal half-width,
    // a horizontal one the vertical.
    if (a.label === 'above') {
      const mx = (a.x1 + a.x2) / 2;
      grow(mx - 110, Math.min(a.y1, a.y2) - 55);
      grow(mx + 110, Math.max(a.y1, a.y2) + 55);
    }
  }
  const m = 28;
  return [minX - m, minY - m, maxX - minX + 2 * m, maxY - minY + 2 * m].join(' ');
}

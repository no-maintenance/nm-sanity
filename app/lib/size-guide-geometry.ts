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
const CROTCH: [number, number] = [0.5162, 0.439];

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
  // Footwear carries no measurement arrows — the chart is an EU/US conversion,
  // so the drawing sits alongside the table purely as a reference.
  footwear: garment('/sizeguide/footwear.png', 1723, 1313, {}),
  bottoms: garment('/sizeguide/bottoms.png', 919, 1500, {
    // Rise and inseam both meet at CROTCH, so their arrows end on that row and
    // their leaders run flat to it. Probing in from the arrow (how every other
    // leader was found) stops at the outer leg seam instead, which left the
    // dots short of the crotch.
    //
    // The inseam arrow runs *down the right leg* rather than outside the
    // garment — measured off the supplied reference at 0.178 of the garment's
    // width right of the crotch, with its number in a break in the line.
    inseam: {
      a: [0.67, CROTCH[1], 0.67, 0.9542, 'above'],
      g: [CROTCH, [0.5937, 0.9538]],
    },
    legOpening: {
      a: [0.0729, 0.9884, 0.4136, 1.004, 'above'],
      g: [[0.0794, 0.9391], [0.4204, 0.9505]],
    },
    // Number in a break in the line, as the mockup draws it.
    rise: {
      a: [0.7755, 0.0498, 0.7755, CROTCH[1], 'above'],
      g: [[0.2408, 0.0511], CROTCH],
    },
    thigh: {
      a: [0.1506, 0.4596, 0.4904, 0.484, 'above'],
      g: [null, null],
    },
    waist: {
      a: [0.2456, -0.0126, 0.7803, -0.0126, 'above'],
      g: [[0.2453, 0.0478], [0.7804, 0.056]],
    },
  }),
  jersey: garment('/sizeguide/jersey.png', 1500, 1478, {
    pitToPit: {
      a: [0.2356, 0.4238, 0.7737, 0.4238, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.2247, -0.1108, 0.7677, -0.1108, 'above'],
      g: [[0.2245, 0.1208], [0.7678, 0.1075]],
    },
    sleeveLength: {
      a: [0.1337, 0.0634, -0.0325, 0.3099, 'left'],
      g: [[0.2214, 0.1249], [0.0554, 0.3719]],
    },
    totalLength: {
      a: [1.0724, 0.0684, 1.0724, 0.9554, 'right'],
      g: [[0.6733, 0.0686], null],
    },
  }),
  knitwear: garment('/sizeguide/knitwear.png', 1457, 1500, {
    pitToPit: {
      a: [0.2444, 0.4013, 0.7634, 0.4013, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.21, -0.0209, 0.786, -0.0209, 'above'],
      g: [[0.2097, 0.1706], [0.7865, 0.1771]],
    },
    sleeveLength: {
      a: [0.0626, 0.1464, -0.073, 0.9189, 'left'],
      g: [[0.2049, 0.1696], [0.0572, 0.9408]],
    },
    totalLength: {
      a: [1.0485, 0.0923, 1.0514, 0.8136, 'right'],
      // Bottom leader reaches back under the top leader so the two form a
      // matched bracket, as the mockup draws it (not a stub at the cuff).
      g: [[0.6578, 0.0923], [0.6799, 0.8136]],
    },
  }),
  outerwear: garment('/sizeguide/outerwear.png', 1500, 1283, {
    pitToPit: {
      a: [0.2394, 0.5, 0.7597, 0.5, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.2764, 0.0017, 0.7218, 0.0017, 'above'],
      g: [[0.276, 0.1762], [0.7217, 0.2038]],
    },
    sleeveLength: {
      a: [0.1821, 0.1546, -0.0358, 0.8628, 'left'],
      g: [[0.265, 0.1891], [0.0469, 0.8973]],
    },
    totalLength: {
      a: [0.9454, 0.0878, 0.9454, 0.8348, 'right'],
      g: [[0.6138, 0.0879], [0.5001, 0.8348]],
    },
  }),
  shirting: garment('/sizeguide/shirting.png', 1500, 1455, {
    pitToPit: {
      a: [0.3028, 0.3916, 0.7309, 0.3916, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.2792, -0.0669, 0.7495, -0.0669, 'above'],
      g: [[0.2796, 0.1305], [0.7499, 0.1361]],
    },
    sleeveLength: {
      a: [0.1872, 0.0849, -0.0744, 0.8481, 'left'],
      g: [[0.284, 0.1213], [0.1323, 0.9247]],
    },
    totalLength: {
      a: [1.0091, 0.0791, 1.0091, 0.8961, 'right'],
      g: [[0.6416, 0.0788], [0.9523, 0.896]],
    },
  }),
  // Hoodie: arrows and dotted guides measured directly off the four
  // `hoodie size guide` mockups, normalised to the hoodie drawing's tight bbox.
  hoodie: garment('/sizeguide/hoodie.png', 1428, 1500, {
    // All four re-measured from the `hoodie size guide` mockups via
    // .context/tools/hoodie-geometry.py rather than adjusted by eye.
    pitToPit: {
      a: [0.253, 0.5904, 0.7546, 0.5924, 'above'],
      g: [null, null],
    },
    shoulder: {
      a: [0.2757, -0.0091, 0.7331, -0.0071, 'above'],
      g: [[0.2761, 0.3448], [0.7336, 0.3186]],
    },
    // Re-measured from `hoodie size guide-01` (.context/tools/hoodie-geometry.py).
    // The lower leader used to anchor at -0.0189, which is *left of* the arrow's
    // own endpoint — so it pointed away from the garment and dangled in space
    // instead of meeting the cuff.
    sleeveLength: {
      a: [0.2409, 0.3224, -0.0017, 0.9132, 'left'],
      g: [[0.2715, 0.3483], [0.047, 0.9295]],
    },
    totalLength: {
      a: [1.0242, 0.2779, 1.0225, 0.8466, 'right'],
      g: [[0.6559, 0.2802], [0.6805, 0.8471]],
    },
  }),
  // Shorts: arrows and dotted guides measured directly off the four
  // `shorts size guide` mockups, normalised to the shorts drawing's tight bbox.
  // The mockups carry no thigh measurement, so the shorts don't offer that tab.
  shorts: garment('/sizeguide/shorts.png', 1500, 1461, {
    inseam: {
      a: [0.6114, 0.5242, 0.6114, 0.922, 'above'],
      g: [[0.5119, 0.5242], [0.5575, 0.922]],
    },
    legOpening: {
      a: [0.5397, 1.0114, 0.9772, 0.9951, 'above'],
      g: [[0.5397, 0.9299], [0.9772, 0.9552]],
    },
    rise: {
      a: [0.9529, 0.0768, 0.9529, 0.5374, 'above'],
      g: [[0.5065, 0.0768], [0.5155, 0.5374]],
    },
    waist: {
      a: [0.2176, -0.0622, 0.7889, -0.0622, 'above'],
      g: [[0.2176, 0.0495], [0.7889, 0.055]],
    },
  }),
};

/**
 * Smallest box holding the full drawing plus the one arrow being shown and room
 * for its number.
 *
 * The frame starts at the whole drawing (0,0)-(1000,height) so the garment is
 * always shown in full, then grows only for the *active* measurement's arrow.
 * Sizing it to every arrow at once — as it used to — meant each tab reserved
 * the margin the sleeve, total-length and shoulder arrows need even when none
 * of them is on screen, so the garment sat shrunken with an empty gap where the
 * other tabs' lines would go. Framing per measurement keeps the garment as
 * large as the active arrow allows and leaves no reserved blank space; the
 * trade is that the drawing reframes a little as you switch tabs.
 */
export function viewBoxFor(g: GarmentSpec): string {
  // A drawing with no measurement arrows (footwear) is a plain reference image.
  // Frame it in a box twice the drawing's size so it renders at half scale,
  // centred in the panel, rather than filling it.
  if (!Object.values(g.arrows).some(Boolean)) {
    return [-500, -g.height / 2, 2000, 2 * g.height].join(' ');
  }
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
  // Every arrow earns margin, not just the one on screen. Sizing to the active
  // arrow makes a tighter frame, but then the box changes shape on each tab —
  // which rescales the drawing, moves it, and resizes the whole modal. A frame
  // that holds all of them is identical for every measurement.
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

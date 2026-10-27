/**
 * Size-guide data model.
 *
 * Turns a Sanity `sizeChart` table into something the illustrated guide can
 * drive: which garment drawing to show, which measurements are selectable, and
 * what number sits in the arrow for a given size + unit.
 *
 * The tables were authored by hand over a couple of years, so they are not
 * uniform: some say "Sleeve", others "Sleeve Length"; some say "Hem", others
 * "Leg Opening". Everything is normalised to a canonical key here rather than
 * in the component, and anything unrecognised (footwear's "US", a belt's
 * "S/M | L/XL") falls through to `null`, which makes the caller render the
 * plain table instead of the illustration.
 */

export type MeasurementKey =
  | 'inseam'
  | 'legOpening'
  | 'pitToPit'
  | 'rise'
  | 'shoulder'
  | 'sleeveLength'
  | 'thigh'
  | 'totalLength'
  | 'waist';

export type GarmentKey =
  | 'bottoms'
  | 'jersey'
  | 'knitwear'
  | 'outerwear'
  | 'shirting';

export type Unit = 'cm' | 'in';

export interface SizeChartTable {
  rows?: {_key?: string; cells?: string[]}[];
}

/** Canonical label shown on the tab, per measurement. */
export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  inseam: 'INSEAM',
  legOpening: 'LEG OPENING',
  pitToPit: 'PIT TO PIT',
  rise: 'RISE',
  shoulder: 'SHOULDER',
  sleeveLength: 'SLEEVE LENGTH',
  thigh: 'THIGH',
  totalLength: 'TOTAL LENGTH',
  waist: 'WAIST',
};

/**
 * Header-cell spellings seen across the 123 live size charts. Keys are
 * lowercased and stripped of punctuation before lookup, so "Pit to Pit" and
 * "pit-to-pit" both land here.
 */
const HEADER_ALIASES: Record<string, MeasurementKey> = {
  'body length': 'totalLength',
  'chest': 'pitToPit',
  'front length': 'totalLength',
  'hem': 'legOpening',
  'inseam': 'inseam',
  'leg opening': 'legOpening',
  'length': 'totalLength',
  'pit to pit': 'pitToPit',
  'pittopit': 'pitToPit',
  'rise': 'rise',
  'shoulder': 'shoulder',
  'shoulder to shoulder': 'shoulder',
  'shoulder width': 'shoulder',
  'sleeve': 'sleeveLength',
  'sleeve length': 'sleeveLength',
  'thigh': 'thigh',
  'total length': 'totalLength',
  'waist': 'waist',
};

/** Shopify `productType` -> which line drawing to show. */
const PRODUCT_TYPE_GARMENT: Record<string, GarmentKey> = {
  bottoms: 'bottoms',
  denim: 'bottoms',
  jersey: 'jersey',
  knit: 'knitwear',
  knitwear: 'knitwear',
  // No leather-specific drawing exists; every leather piece with a chart is a
  // jacket, and the outerwear sketch is the right silhouette for it.
  leather: 'outerwear',
  outerwear: 'outerwear',
  shirt: 'shirting',
  shirting: 'shirting',
};

/**
 * Types that are never a garment silhouette, whatever their chart says. The
 * leather belt's chart is transposed and carries a "Waist" row, which would
 * otherwise resolve it to the trousers drawing.
 */
const NON_GARMENT_TYPES = new Set(['accessories', 'footwear']);

/**
 * Long-sleeved pieces, by name. The jersey sketch is a short-sleeve tee, so
 * anything with sleeves has to use the knitwear one whatever Shopify files it
 * under — most of these are typed "Jersey" there.
 */
const LONG_SLEEVE = /\b(hoodie|hooded|long[\s-]?sleeve|longsleeve|sweatshirt|thermal|crewneck|sweater|cardigan|henley|knit)\b/i;

/**
 * Fallback when Shopify has no productType — several vintage tees have none,
 * and without this they take the generic tops default and get drawn as a
 * jacket. Ordered: "t-shirt" has to beat "shirt".
 */
const TITLE_GARMENT: [RegExp, GarmentKey][] = [
  [/\b(t-?shirt|tee|tank)\b/i, 'jersey'],
  [/\b(jacket|coat|parka|bomber|vest|anorak)\b/i, 'outerwear'],
  [/\bshirt\b/i, 'shirting'],
];

const BOTTOMS_KEYS = new Set<MeasurementKey>([
  'inseam',
  'legOpening',
  'rise',
  'thigh',
  'waist',
]);

function normaliseHeader(cell: string): MeasurementKey | null {
  const k = cell
    .toLowerCase()
    .replace(/["”″'']/g, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return HEADER_ALIASES[k] ?? null;
}

/**
 * Put a chart the right way up: sizes down the side, measurements across.
 *
 * Nearly every chart is authored that way, but a few (the Johnny Collar knit
 * polos) were entered transposed — measurements down the side, sizes across.
 * Rather than ask for those to be retyped, work out which way round it is by
 * seeing which axis actually carries recognisable measurement names, and flip
 * when it's the first column. A chart whose names sit on neither axis is left
 * alone; it falls through to the plain table either way.
 */
function orientGrid(grid: string[][]): string[][] {
  const named = (cells: string[]) =>
    cells.slice(1).filter((c) => normaliseHeader(c ?? '')).length;
  const acrossTop = named(grid[0] ?? []);
  const downSide = named(grid.map((r) => r?.[0] ?? ''));
  if (downSide <= acrossTop) return grid;
  const width = Math.max(...grid.map((r) => r.length));
  return Array.from({length: width}, (_, c) => grid.map((r) => r[c] ?? ''));
}

export interface ParsedSizeChart {
  /** Measurement columns, in the order the chart lists them. */
  columns: {index: number; key: MeasurementKey; label: string}[];
  /** Which drawing to render, or null when the chart isn't a garment table. */
  garment: GarmentKey | null;
  /** Row labels: "Small", "30", "US 9"... whatever the chart actually uses. */
  sizes: string[];
  /** sizes[r] -> measurement key -> raw cell text ("20.5\""). */
  values: Record<string, Partial<Record<MeasurementKey, string>>>;
}

/**
 * Parse a Sanity size table. `productType` picks between the four tops
 * drawings; the columns themselves decide tops-vs-bottoms, so a denim jacket
 * filed under "Denim" still gets the jacket sketch rather than the jeans one.
 */
export function parseSizeChart(
  table: SizeChartTable | null | undefined,
  productType?: null | string,
  title?: null | string,
): null | ParsedSizeChart {
  const raw = table?.rows?.filter((r) => r?.cells?.length) ?? [];
  if (raw.length < 2) return null;

  const grid = orientGrid(raw.map((r) => r.cells ?? []));
  const header = grid[0] ?? [];
  const rows = grid.slice(1).map((cells) => ({cells}));
  const columns: ParsedSizeChart['columns'] = [];
  for (let i = 1; i < header.length; i++) {
    const key = normaliseHeader(header[i] ?? '');
    // Guard against a chart listing the same measurement twice.
    if (key && !columns.some((c) => c.key === key)) {
      columns.push({index: i, key, label: MEASUREMENT_LABELS[key]});
    }
  }

  const sizes: string[] = [];
  const values: ParsedSizeChart['values'] = {};
  for (const row of rows) {
    const cells = row.cells ?? [];
    const size = (cells[0] ?? '').trim();
    if (!size || values[size]) continue;
    sizes.push(size);
    const entry: Partial<Record<MeasurementKey, string>> = {};
    for (const col of columns) {
      const raw = (cells[col.index] ?? '').trim();
      if (raw) entry[col.key] = raw;
    }
    values[size] = entry;
  }
  if (!sizes.length) return null;

  return {
    columns,
    garment: resolveGarment(columns, productType, title),
    sizes,
    values,
  };
}

/**
 * Pick the drawing. Order matters:
 *
 * 1. Accessories and footwear get no drawing at all.
 * 2. Bottoms measurements then mean trousers, so a denim jacket filed under
 *    "Denim" still gets the jacket sketch.
 * 3. A long-sleeved name beats productType: the jersey sketch is a short-sleeve
 *    tee, and most hoodies and long sleeves are filed as "Jersey" in Shopify.
 * 4. Then productType, then the name, then the tops default.
 */
function resolveGarment(
  columns: ParsedSizeChart['columns'],
  productType?: null | string,
  title?: null | string,
): GarmentKey | null {
  if (!columns.length) return null;

  // Before anything else: a belt or a shoe is never a garment silhouette. The
  // belt's chart is transposed and carries a "Waist" row, so checking the
  // bottoms columns first would resolve it to trousers.
  const type = (productType ?? '').toLowerCase().trim();
  if (NON_GARMENT_TYPES.has(type)) return null;

  if (columns.some((c) => BOTTOMS_KEYS.has(c.key))) return 'bottoms';

  const name = title ?? '';
  if (LONG_SLEEVE.test(name)) return 'knitwear';

  const byType = PRODUCT_TYPE_GARMENT[type];
  if (byType && byType !== 'bottoms') return byType;

  for (const [re, g] of TITLE_GARMENT) {
    if (re.test(name)) return g;
  }
  return 'outerwear';
}

/**
 * Re-express a cell for the chosen unit. Cells are free text ("20.5\"", "25",
 * "29.5 in"), so the number is pulled out and the rest discarded; anything
 * without a number is passed through untouched.
 */
export function formatMeasurement(raw: string | undefined, unit: Unit): string {
  if (!raw) return '—';
  const match = raw.match(/-?\d+(\.\d+)?/);
  if (!match) return raw;
  const inches = parseFloat(match[0]);
  if (!Number.isFinite(inches)) return raw;
  if (unit === 'in') {
    return `${trim(inches)}"`;
  }
  return `${Math.round(inches * 2.54)}cm`;
}

function trim(n: number): string {
  return String(Number(n.toFixed(2)));
}

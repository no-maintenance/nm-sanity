/**
 * Illustrated size guide.
 *
 * Replaces the bare table with the layout from the SIZEGUIDE_MOCK files: a
 * garment line drawing on the left with a single measurement arrow over it, the
 * controls on the right, and the full table underneath.
 *
 * Everything is driven by the product's Sanity size chart — the sizes come from
 * its rows and the measurement tabs from its columns, so a chart with no
 * Shoulder column simply doesn't offer that tab. Only one arrow is ever drawn;
 * picking a tab swaps it, picking a size changes the number it carries.
 *
 * Charts that aren't garment measurements at all (footwear's "US", a belt's
 * "S/M | L/XL") resolve to no garment and fall back to the plain table.
 */

import {useMemo, useRef, useState} from 'react';

import type {
  MeasurementKey,
  ParsedSizeChart,
  SizeChartTable,
  Unit,
} from '~/lib/size-guide';

import {cn} from '~/lib/utils';
import {GARMENTS, viewBoxFor} from '~/lib/size-guide-geometry';
import {formatMeasurement, parseSizeChart} from '~/lib/size-guide';
import {useIsomorphicLayoutEffect} from '~/hooks/use-isomorphic-layout-effect';

const ARROW_RED = '#AB1A1A';
const LABEL_FONT = 'Helvetica, Arial, sans-serif';

/**
 * Optical centring for the arrow's number.
 *
 * SVG centres text on its *advance* box, which isn't where the ink sits. A
 * trailing inch mark carries side bearing, so `21.5"` reads shifted left; and
 * digits don't fill the em box vertically, so the line crosses above their
 * middle. Both are a few units — invisible at a glance, obvious once you zoom
 * in on the arrow.
 *
 * Canvas reports true ink extents, so measure there and offset by the
 * difference. It runs in a layout effect so the correction lands before paint
 * — with a plain effect the first painted frame is the uncorrected one — and
 * it reads the font off the rendered element rather than assuming LABEL_FONT,
 * so a stylesheet overriding the presentation attribute can't silently skew
 * the measurement.
 */
function useInkCentring(
  ref: React.RefObject<null | SVGTextElement>,
  text: null | string,
  fontPx: number,
) {
  const [off, setOff] = useState<null | {dx: number; dy: number; h: number; w: number}>(
    null,
  );
  useIsomorphicLayoutEffect(() => {
    if (!text) {
      setOff(null);
      return;
    }
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    const el = ref.current;
    const cs = el ? getComputedStyle(el) : null;
    ctx.font = cs?.fontFamily
      ? `${cs.fontSize || `${fontPx}px`} ${cs.fontFamily}`
      : `${fontPx}px ${LABEL_FONT}`;
    const m = ctx.measureText(text);
    const {
      actualBoundingBoxLeft: left,
      actualBoundingBoxRight: right,
    } = m;
    // Centre on the digits' cap height, not the whole string's ink box. The
    // unit mark (the tall " in inches, the x-height "cm") would otherwise skew
    // the measured ascent and leave the numerals sitting off the line; a plain
    // digit gives the true cap-height box so the number reads dead-centre.
    const d = ctx.measureText('0');
    const asc = d.actualBoundingBoxAscent;
    const desc = d.actualBoundingBoxDescent;
    if (![asc, desc, left, right, m.width].every((n) => Number.isFinite(n))) {
      setOff(null);
      return;
    }
    setOff({
      // Advance centre -> ink centre.
      dx: m.width / 2 - (right - left) / 2,
      // Baseline offset that puts the digits' middle on the line.
      dy: (asc - desc) / 2,
      // True ink width, for sizing the break in the line around it.
      w: left + right,
      // Ink height, for breaks in a vertical line.
      h: asc + desc,
    });
  }, [text, fontPx, ref]);
  return off;
}

export interface ModelMeasurements {
  chest?: string;
  height?: string;
  sizeWorn?: string;
  waist?: string;
}

interface Props {
  /** Explicit "Garment Type" from the Sanity size chart; overrides auto-detection. */
  garmentType?: null | string;
  modelMeasurements?: ModelMeasurements | null;
  /** The model's fit sentence, lifted from the product description so the guide
      always shows the same model info as the copy on the page. */
  modelNote?: null | string;
  productType?: null | string;
  table?: null | SizeChartTable;
  /** Product name — decides the drawing when productType is missing or when
      the name says long-sleeved (the jersey sketch is a short-sleeve tee). */
  title?: null | string;
}

export function SizeGuide({garmentType, modelMeasurements, modelNote, productType, table, title}: Props) {
  const chart = useMemo(
    () => parseSizeChart(table, productType, title, garmentType),
    [table, productType, title, garmentType],
  );

  if (!chart) {
    return (
      <p className="text-sm text-neutral-500">
        No size chart available for this product.
      </p>
    );
  }
  // A chart with no measurements can still have a drawing — footwear's is an
  // EU/US conversion. Show the sketch beside the table as a reference, with no
  // measurement tabs, size picker or unit toggle, since none of them apply.
  if (!chart.columns.length) {
    return chart.garment ? (
      <ReferenceOnlyGuide chart={chart} garment={GARMENTS[chart.garment]} />
    ) : (
      <RawTable grid={chart.raw} />
    );
  }
  if (!chart.garment) {
    return <RawTable grid={chart.raw} />;
  }
  return (
    <IllustratedGuide
      chart={chart}
      model={modelMeasurements ?? null}
      note={modelNote ?? null}
    />
  );
}

/** Drawing + the chart as authored. No arrows, because there are none. */
function ReferenceOnlyGuide({
  chart,
  garment,
}: {
  chart: ParsedSizeChart;
  garment: (typeof GARMENTS)[keyof typeof GARMENTS];
}) {
  return (
    // Boot and chart are each sized to themselves and centred together, so the
    // guide isn't flung to opposite edges of a tall, mostly-empty modal. The
    // boot sits in a fixed box (its own size, no baked-in padding) beside the
    // horizontal EU/US table.
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-2 text-black md:flex-row md:gap-10">
      <div className="h-[166px] w-[218px] shrink-0">
        <GarmentDrawing garment={garment} measurement={null} value={null} />
      </div>
      <div className="min-w-0">
        <RawTable fit transpose grid={chart.raw} />
      </div>
    </div>
  );
}

/**
 * The chart exactly as authored — used when its columns aren't measurements
 * (footwear's EU/US, a belt's S/M | L/XL). Running those through the
 * measurement model would drop every column it didn't recognise.
 */
function RawTable({
  grid,
  fit,
  transpose,
}: {
  grid: string[][];
  fit?: boolean;
  transpose?: boolean;
}) {
  if (!grid.length) return null;
  const thCls =
    'border border-neutral-300 px-1.5 py-1.5 text-start font-semibold uppercase tracking-[0.04em] md:px-4';
  const tdCls =
    'border border-neutral-300 px-1.5 py-1.5 whitespace-nowrap md:px-4';
  // `fit` hugs the table to its content (no empty space to the right of the
  // numbers); otherwise it stretches to fill its column.
  const wrap = cn('max-w-full overflow-x-auto', fit ? 'w-fit' : 'w-full');
  const tableCls = cn(
    'table-auto border-collapse text-[11px] md:text-sm',
    !fit && 'w-full',
  );

  // East-to-west: flip the chart so each original column becomes a row — its
  // label (EU / US) leads as a header cell and the sizes run across, instead of
  // stacking down the page.
  if (transpose) {
    const w = Math.max(...grid.map((r) => r.length));
    const rows = Array.from({length: w}, (_, c) => grid.map((r) => r[c] ?? ''));
    return (
      <div className={wrap}>
        <table className={tableCls}>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th className={thCls} key={i} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td className={tdCls} key={i}>
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const [head, ...body] = grid;
  return (
    <div className={wrap}>
      <table className={tableCls}>
        <thead>
          <tr>
            {head.map((c, i) => (
              <th className={thCls} key={i}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r}>
              {head.map((_, i) => (
                <td className={tdCls} key={i}>
                  {row[i] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IllustratedGuide({
  chart,
  model,
  note,
}: {
  chart: ParsedSizeChart;
  model: ModelMeasurements | null;
  note: null | string;
}) {
  const garment = GARMENTS[chart.garment!];
  // Only offer tabs the drawing can actually point at.
  const tabs = chart.columns.filter((c) => garment.arrows[c.key]);
  const [unit, setUnit] = useState<Unit>('in');
  // Mid-range size reads as the most representative default, and matches the
  // size the model is wearing in the copy below.
  const [size, setSize] = useState(
    chart.sizes[Math.min(1, chart.sizes.length - 1)],
  );
  const [active, setActive] = useState<MeasurementKey>(
    (tabs[0] ?? chart.columns[0]).key,
  );

  const raw = chart.values[size]?.[active];
  const value = formatMeasurement(raw, unit);

  return (
    // The whole guide is sized to the modal rather than the other way round:
    // the controls and table take the height they need, and the drawing absorbs
    // whatever is left, so nothing ever has to scroll.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col text-black">
      {/* minmax(0,1fr) on the stacked layout too, or the wide table below sets
          the column's intrinsic width and pushes the modal past the viewport. */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
        <div className="flex min-h-0 items-center justify-center">
          <GarmentDrawing
            garment={garment}
            measurement={active}
            value={raw ? value : null}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden md:gap-6 md:pt-2">
          {/* Sizes */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {chart.sizes.map((s) => (
              <button
                aria-pressed={s === size}
                className={cn(
                  'text-[13px] uppercase tracking-[0.06em] transition-colors',
                  s === size
                    ? 'font-semibold text-black'
                    : 'text-neutral-400 notouch:hover:text-neutral-600',
                )}
                key={s}
                onClick={() => setSize(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Measurements */}
          <div className="flex flex-wrap">
            {tabs.map((c, i) => (
              <button
                aria-pressed={c.key === active}
                className={cn(
                  'border border-black px-3 py-2.5 text-[11px] uppercase tracking-[0.06em] transition-colors',
                  i > 0 && '-ml-px',
                  c.key === active
                    ? 'bg-black text-white'
                    : 'bg-white text-black notouch:hover:bg-neutral-100',
                )}
                key={c.key}
                onClick={() => setActive(c.key)}
                type="button"
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Units */}
          <div className="flex">
            {(['in', 'cm'] as Unit[]).map((u, i) => (
              <button
                aria-pressed={u === unit}
                className={cn(
                  'border border-black px-5 py-2.5 text-[11px] uppercase tracking-[0.06em] transition-colors',
                  i > 0 && '-ml-px',
                  u === unit
                    ? 'bg-black text-white'
                    : 'bg-white text-black notouch:hover:bg-neutral-100',
                )}
                key={u}
                onClick={() => setUnit(u)}
                type="button"
              >
                {u === 'in' ? 'Inch' : 'CM'}
              </button>
            ))}
          </div>

          <ModelBlock model={model} note={note} />
        </div>
      </div>

      <div className="mt-4 min-w-0 shrink-0 md:mt-8">
        <PlainTable chart={chart} compact unit={unit} />
      </div>
    </div>
  );
}

function ModelBlock({
  model,
  note,
}: {
  model: ModelMeasurements | null;
  note: null | string;
}) {
  // Prefer the fit sentence lifted from the product copy so the two always
  // match; fall back to a structured figure only if the chart carries one.
  const line =
    note ??
    (model?.height
      ? `Model is ${model.height}${
          model.sizeWorn ? ` and wears size ${model.sizeWorn}` : ''
        }`
      : null);
  if (!line) return null;
  return (
    <div className="mt-2 space-y-1.5 text-[13px] text-black">
      <p className="uppercase tracking-[0.06em]">Model Measurements</p>
      <p>{line.replace(/[.\s]+$/, '')}.</p>
    </div>
  );
}

/**
 * The drawing plus exactly one arrow. The SVG shares a coordinate space with
 * the PNG (drawing at 0,0-1000,height) so arrows stay registered to the artwork
 * at any size; viewBoxFor sizes the frame to all of this garment's arrows, so
 * it is identical on every tab — the drawing never rescales or shifts.
 */
function GarmentDrawing({
  garment,
  measurement,
  value,
}: {
  garment: (typeof GARMENTS)[keyof typeof GARMENTS];
  measurement: MeasurementKey;
  value: null | string;
}) {
  const arrow = garment.arrows[measurement];
  // Frame to the full drawing plus only the active arrow, so the garment shows
  // at full size with no blank margin reserved for the other tabs' lines.
  const vb = viewBoxFor(garment);
  const FONT = 42;
  const textRef = useRef<SVGTextElement>(null);
  const ink = useInkCentring(textRef, value, FONT);

  const mid = arrow
    ? {x: (arrow.x1 + arrow.x2) / 2, y: (arrow.y1 + arrow.y2) / 2}
    : null;
  // Horizontal arrows carry the number inside a break in the line, the way the
  // mockups draw them; vertical and diagonal ones sit it alongside instead.
  const inline = arrow?.label === 'above';

  // Half the label's ink width — measured once painted, estimated before.
  const halfW = value ? (ink ? ink.w : value.length * FONT * 0.5) / 2 : 0;
  const halfH = value ? (ink ? ink.h : FONT * 0.72) / 2 : 0;
  // A break in a vertical line has to clear the number's height, not its width.
  const steep =
    !!arrow && Math.abs(arrow.y2 - arrow.y1) > Math.abs(arrow.x2 - arrow.x1);

  // A number beside a vertical/diagonal line clears the line by a fixed gap on
  // its *near* edge, whatever its width. Offsetting the centre by a constant
  // (the old +70) let a wide "63.5cm" overrun back onto the line while a narrow
  // "30"" sat clear; keying off the measured width keeps every label off it.
  const SIDE_GAP = 34;
  const off =
    arrow?.label === 'right'
      ? {x: SIDE_GAP + halfW, y: 0}
      : arrow?.label === 'left'
        ? {x: -(SIDE_GAP + halfW), y: 0}
        : {x: 0, y: 0};

  // Half-length of the break in the line for an inline number: the ink's
  // extent along the arrow, plus breathing room.
  const gap = value
    ? Math.max(46, (steep ? halfH : halfW) + FONT * 0.42)
    : 0;
  let legs: {x1: number; x2: number; y1: number; y2: number}[] = [];
  if (arrow) {
    if (inline && value && mid) {
      const dx = arrow.x2 - arrow.x1;
      const dy = arrow.y2 - arrow.y1;
      const len = Math.hypot(dx, dy) || 1;
      const ux = (dx / len) * gap;
      const uy = (dy / len) * gap;
      legs = [
        {x1: mid.x - ux, x2: arrow.x1, y1: mid.y - uy, y2: arrow.y1},
        {x1: mid.x + ux, x2: arrow.x2, y1: mid.y + uy, y2: arrow.y2},
      ];
    } else {
      legs = [{x1: arrow.x1, x2: arrow.x2, y1: arrow.y1, y2: arrow.y2}];
    }
  }

  return (
    <svg
      // Sized by its parent in both axes and letterboxed, so a tall garment
      // (trousers) shrinks to the space left over instead of pushing the table
      // out of the modal.
      className="h-full max-h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={vb}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="sg-head"
          markerHeight="7"
          markerUnits="strokeWidth"
          markerWidth="7"
          orient="auto"
          // Tip exactly on the line's endpoint. refX used to sit 1.4 marker
          // units short, which pushed every arrowhead 7 user units past the
          // measurement it marks — enough to poke outside the garment.
          refX="7"
          refY="3.5"
        >
          <path d="M0,0 L7,3.5 L0,7 z" fill={ARROW_RED} />
        </marker>
        <marker
          id="sg-tail"
          markerHeight="7"
          markerUnits="strokeWidth"
          markerWidth="7"
          orient="auto"
          refX="0"
          refY="3.5"
        >
          <path d="M7,0 L0,3.5 L7,7 z" fill={ARROW_RED} />
        </marker>
      </defs>

      <image height={garment.height} href={garment.src} width={1000} x={0} y={0} />

      {arrow ? (
        <g>
          {arrow.guides.map((g, i) =>
            g ? (
              <line
                key={i}
                stroke={ARROW_RED}
                strokeDasharray="7 9"
                strokeWidth={3}
                x1={i === 0 ? arrow.x1 : arrow.x2}
                x2={g.x}
                y1={i === 0 ? arrow.y1 : arrow.y2}
                y2={g.y}
              />
            ) : null,
          )}
          {legs.map((l, i) => (
            // A split line only gets a head on its outer end; an unsplit one
            // gets both.
            <line
              key={i}
              markerEnd="url(#sg-head)"
              markerStart={legs.length === 1 ? 'url(#sg-tail)' : undefined}
              stroke={ARROW_RED}
              strokeWidth={5}
              x1={l.x1}
              x2={l.x2}
              y1={l.y1}
              y2={l.y2}
            />
          ))}
          {value && mid ? (
            <>
              {/* Solid white plate behind the number. The ink corrections put
                  the glyphs' centre exactly on (mid + off), so the plate is
                  centred there too. A stroked halo alone left the drawing's
                  texture showing between the strokes of a digit. */}
              {/* Both paddings stay under the FONT*0.42 the break in the line is
                  sized with, so the plate never eats the arrow it sits in —
                  horizontally for a flat arrow, vertically for an upright one. */}
              <rect
                fill="#fff"
                height={2 * halfH + FONT * 0.72}
                width={2 * halfW + FONT * 0.56}
                x={mid.x + off.x - halfW - FONT * 0.28}
                y={mid.y + off.y - halfH - FONT * 0.36}
              />
              <text
                ref={textRef}
                // Once measured, the baseline is positioned explicitly so the
                // ink sits on the line; dominant-baseline is the fallback for
                // the first frame.
                dominantBaseline={ink ? undefined : 'middle'}
                fill="#111"
                fontFamily={LABEL_FONT}
                fontSize={FONT}
                textAnchor="middle"
                x={mid.x + off.x + (ink?.dx ?? 0)}
                y={mid.y + off.y + (ink?.dy ?? 0)}
              >
                {value}
              </text>
            </>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}

function PlainTable({
  chart,
  compact,
  unit,
}: {
  chart: ParsedSizeChart;
  /** Tightens the rows when the table shares the modal with the diagram. */
  compact?: boolean;
  unit?: Unit;
}) {
  const cell = cn(
    'border border-neutral-300 px-1.5 md:px-4',
    compact ? 'py-1 md:py-1.5' : 'py-2.5',
  );
  // Headers are the widest cells ("LEG OPENING"); letting them wrap on narrow
  // screens is what keeps the table inside the modal instead of scrolling.
  const head = cn(
    cell,
    'text-start font-semibold uppercase tracking-[0.04em] whitespace-normal md:whitespace-nowrap',
  );
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table
        className={cn(
          // Hug the content so columns are only as wide as their numbers — no
          // empty space stretched across each cell to fill the modal.
          'w-fit table-auto border-collapse',
          compact ? 'text-[10px] md:text-xs' : 'text-[11px] md:text-sm',
        )}
      >
        <thead>
          <tr>
            <th className={head}>Size</th>
            {chart.columns.map((c) => (
              <th className={head} key={c.key}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.sizes.map((s) => (
            <tr key={s}>
              <td className={cn(cell, 'whitespace-nowrap')}>{s}</td>
              {chart.columns.map((c) => (
                <td className={cn(cell, 'whitespace-nowrap')} key={c.key}>
                  {unit
                    ? formatMeasurement(chart.values[s]?.[c.key], unit)
                    : (chart.values[s]?.[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

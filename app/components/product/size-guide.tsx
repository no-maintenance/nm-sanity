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

import {useMemo, useState} from 'react';

import type {
  MeasurementKey,
  ParsedSizeChart,
  SizeChartTable,
  Unit,
} from '~/lib/size-guide';

import {cn} from '~/lib/utils';
import {GARMENTS, viewBoxFor} from '~/lib/size-guide-geometry';
import {formatMeasurement, parseSizeChart} from '~/lib/size-guide';

const ARROW_RED = '#AB1A1A';

export interface ModelMeasurements {
  chest?: string;
  height?: string;
  sizeWorn?: string;
  waist?: string;
}

/**
 * Shown under the controls when the chart doesn't carry its own. These are the
 * figures the mockups were drawn with; a `modelMeasurements` object on the
 * Sanity size chart overrides them per product.
 */
const DEFAULT_MODEL: ModelMeasurements = {
  chest: '35.5"',
  height: '6ft 1"',
  sizeWorn: 'M',
  waist: '31"',
};

interface Props {
  modelMeasurements?: ModelMeasurements | null;
  productType?: null | string;
  table?: null | SizeChartTable;
}

export function SizeGuide({modelMeasurements, productType, table}: Props) {
  const chart = useMemo(
    () => parseSizeChart(table, productType),
    [table, productType],
  );

  if (!chart) {
    return (
      <p className="text-sm text-neutral-500">
        No size chart available for this product.
      </p>
    );
  }
  // A chart we can't illustrate (footwear, accessories) still shows its table.
  if (!chart.garment || !chart.columns.length) {
    return <PlainTable chart={chart} />;
  }
  return (
    <IllustratedGuide
      chart={chart}
      model={modelMeasurements ?? DEFAULT_MODEL}
    />
  );
}

function IllustratedGuide({
  chart,
  model,
}: {
  chart: ParsedSizeChart;
  model: ModelMeasurements;
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

          <ModelBlock model={model} />
        </div>
      </div>

      <div className="mt-4 min-w-0 shrink-0 md:mt-8">
        <PlainTable chart={chart} compact unit={unit} />
      </div>
    </div>
  );
}

function ModelBlock({model}: {model: ModelMeasurements}) {
  if (!model?.height && !model?.chest && !model?.waist) return null;
  return (
    <div className="mt-2 space-y-1.5 text-[13px] text-black">
      <p className="uppercase tracking-[0.06em]">Model Measurements</p>
      {model.height ? (
        <p>
          Model is {model.height}
          {model.sizeWorn ? ` and wears size ${model.sizeWorn}.` : '.'}
        </p>
      ) : null}
      {model.chest ? (
        <p>
          <span className="inline-block w-16">Chest</span>
          {model.chest}
        </p>
      ) : null}
      {model.waist ? (
        <p>
          <span className="inline-block w-16">Waist</span>
          {model.waist}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The drawing plus exactly one arrow. The SVG shares a coordinate space with
 * the PNG (drawing at 0,0-1000,height) so arrows stay registered to the artwork
 * at any size; viewBoxFor sizes the frame to this garment's own arrows, which
 * keeps the drawing as large as it can be without shifting between tabs.
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
  const vb = viewBoxFor(garment);
  const FONT = 42;

  const mid = arrow
    ? {x: (arrow.x1 + arrow.x2) / 2, y: (arrow.y1 + arrow.y2) / 2}
    : null;
  // Horizontal arrows carry the number inside a break in the line, the way the
  // mockups draw them; vertical and diagonal ones sit it alongside instead.
  const inline = arrow?.label === 'above';
  const off =
    arrow?.label === 'right'
      ? {x: 70, y: 0}
      : arrow?.label === 'left'
        ? {x: -70, y: 0}
        : {x: 0, y: 0};

  // Half-width of the break, from the rendered string.
  const gap = value ? Math.max(46, value.length * FONT * 0.33) : 0;
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
          refX="5.6"
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
          refX="1.4"
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
            <text
              dominantBaseline="middle"
              fill="#111"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize={FONT}
              paintOrder="stroke"
              stroke="#fff"
              strokeLinejoin="round"
              strokeWidth={inline ? 4 : 14}
              textAnchor="middle"
              x={mid.x + off.x}
              y={mid.y + off.y}
            >
              {value}
            </text>
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
          'w-full table-auto border-collapse',
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

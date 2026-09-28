"use client";

import React, { useMemo, useState } from "react";
import type { TrendPoint, TrendSeries } from "@/services/insightsService";
import { shortDate } from "@/utils/date";

/**
 * Daily-average progress line chart, drawn as inline SVG.
 *
 * Built by hand rather than with a charting library: the project ships none, and
 * this needs exactly one thing — a small multi-series percentage line — which
 * does not justify a dependency.
 *
 * Two details worth keeping:
 *
 * 1. The SVG uses a fixed `viewBox` and scales with `w-full h-auto`, so the chart
 *    is fluid without a ResizeObserver. The viewBox is never stretched, so
 *    stroke widths and text do not distort.
 * 2. Dates are formatted by hand from the `YYYY-MM-DD` strings the API returns,
 *    never via `toLocaleDateString` / `Intl`. Those depend on the runtime locale
 *    and timezone, which differ between the Node render and the browser and
 *    would surface as a hydration mismatch.
 *
 * A day with no evaluations is `null` and drawn as a **gap**, not as zero. The
 * line breaks there and resumes on the next scored day, because a day nobody was
 * evaluated is missing data rather than a score of zero.
 */

/** Fixed aspect for the plot; the viewBox is the unit the geometry is built in. */
const VIEW_W = 860;
const VIEW_H = 300;

/** Plot insets: room for the y-axis labels and the x-axis dates. */
const PAD = { top: 16, right: 16, bottom: 34, left: 46 };

const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

/**
 * Series colours, ordered for maximum separation. Chosen to stay distinct on
 * white and to hold up next to the dashed grey average line.
 *
 * There are 8 slots and the palette cycles past that, so two batches beyond the
 * eighth share a colour. The chart is meant for comparing a handful of batches;
 * for a larger spread the filter is the tool, not the line.
 */
const SERIES_COLORS = [
  "#4B2EF5", // violet (the product primary)
  "#0D9488", // teal
  "#EA580C", // orange
  "#0891B2", // cyan
  "#DB2777", // pink
  "#65A30D", // lime
  "#2563EB", // blue
  "#B45309", // amber
];

/**
 * The colour a batch is drawn in, from its `series_index`.
 *
 * The index comes from the server's full batch list rather than the batch's
 * position in the currently plotted `series`, so hiding a batch never recolours
 * the ones that remain. Exported so the filter's chips can show the same swatch
 * as the line they control.
 */
export function trendSeriesColor(seriesIndex: number): string {
  const safe = Number.isFinite(seriesIndex) ? seriesIndex : 0;
  return SERIES_COLORS[((safe % SERIES_COLORS.length) + SERIES_COLORS.length) % SERIES_COLORS.length];
}

/** The few x-axis ticks that fit without colliding. */
function tickIndexes(count: number, wanted: number): number[] {
  if (count <= 0) return [];
  if (count <= wanted) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (wanted - 1);
  const out: number[] = [];
  for (let i = 0; i < wanted; i += 1) out.push(Math.round(i * step));
  return Array.from(new Set(out));
}

/**
 * A y-domain that frames the data instead of pinning it to 0-100.
 *
 * Score data clusters (72-86 should not look like a flat line pinned to the top
 * of a 0-100 axis), so the domain tracks the data with padding. It is clamped to
 * 0-100 because the metric is a percentage, and given a minimum span so a nearly
 * flat series is not magnified into dramatic-looking noise.
 */
function yDomain(values: number[]): [number, number] {
  const bounded = values.filter((v) => Number.isFinite(v));
  if (bounded.length === 0) return [0, 100];
  let min = Math.min(...bounded);
  let max = Math.max(...bounded);
  if (min === max) {
    min -= 5;
    max += 5;
  }
  const pad = Math.max((max - min) * 0.15, 4);
  min -= pad;
  max += pad;
  if (max - min < 20) {
    const centre = (max + min) / 2;
    min = centre - 10;
    max = centre + 10;
  }
  return [Math.max(0, Math.min(min, 100)), Math.min(100, Math.max(max, 0))];
}

export default function TrendChart({
  series,
  average,
  height = 300,
}: {
  series: TrendSeries[];
  average: TrendPoint[];
  height?: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const pointCount = series[0]?.points.length ?? average.length;

  // One shared domain across every line, so the batches are directly comparable.
  const [lo, hi] = useMemo(() => {
    const values: number[] = [];
    for (const entry of series) {
      for (const point of entry.points) {
        if (point.average_percentage !== null) values.push(point.average_percentage);
      }
    }
    for (const point of average) {
      if (point.average_percentage !== null) values.push(point.average_percentage);
    }
    return yDomain(values);
  }, [series, average]);

  const x = (index: number) =>
    pointCount <= 1 ? PAD.left + PLOT_W / 2 : PAD.left + (index / (pointCount - 1)) * PLOT_W;
  const y = (value: number) =>
    PAD.top + PLOT_H - ((value - lo) / (hi - lo || 1)) * PLOT_H;

  const hasData =
    series.some((entry) => entry.points.some((p) => p.average_percentage !== null)) ||
    average.some((p) => p.average_percentage !== null);

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map(
    (fraction) => lo + (hi - lo) * fraction
  );
  const xTicks = tickIndexes(pointCount, 5);

  // Per-day readout for the hover tooltip: only the batches that actually scored.
  const hoverRows =
    hoverIndex === null
      ? []
      : series
          .map((entry) => ({
            name: entry.batch_name,
            color: trendSeriesColor(entry.series_index),
            point: entry.points[hoverIndex],
          }))
          .filter((row) => row.point && row.point.average_percentage !== null)
          .sort((a, b) => (b.point.average_percentage ?? 0) - (a.point.average_percentage ?? 0));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        style={{ maxHeight: height }}
        role="img"
        aria-label={`Daily average progress for ${series.length} batch${
          series.length === 1 ? "" : "es"
        }, from ${series[0]?.points[0]?.date ?? ""} to ${
          series[0]?.points[pointCount - 1]?.date ?? ""
        }`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <title>Daily average progress by batch</title>

        {/* Horizontal gridlines + y labels */}
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={VIEW_W - PAD.right}
              y1={y(value)}
              y2={y(value)}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(value) + 3}
              textAnchor="end"
              className="fill-slate-400"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {Math.round(value)}%
            </text>
          </g>
        ))}

        {/* X labels */}
        {xTicks.map((index) => (
          <text
            key={index}
            x={x(index)}
            y={VIEW_H - 12}
            textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            {shortDate(series[0]?.points[index]?.date ?? average[index]?.date ?? "")}
          </text>
        ))}

        {/* The average line, drawn from index-aware runs so x stays tied to the day */}
        {buildRuns(average).map((run, runIndex) => (
          <path
            key={`avgline-${runIndex}`}
            d={run
              .map(
                (index, i) =>
                  `${i === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(
                    average[index].average_percentage as number
                  ).toFixed(2)}`
              )
              .join(" ")}
            fill="none"
            stroke="#94A3B8"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        ))}

        {/* One line per batch */}
        {series.map((entry) => {
          const color = trendSeriesColor(entry.series_index);
          return (
            <g key={entry.batch_id}>
              {buildRuns(entry.points).map((run, runIndex) => (
                <path
                  key={`${entry.batch_id}-${runIndex}`}
                  d={run
                    .map(
                      (index, i) =>
                        `${i === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(
                          entry.points[index].average_percentage as number
                        ).toFixed(2)}`
                    )
                    .join(" ")}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Markers, but only while the window is short enough to stay legible */}
              {pointCount <= 32 &&
                entry.points.map((point, index) =>
                  point.average_percentage === null ? null : (
                    <circle
                      key={`${entry.batch_id}-dot-${index}`}
                      cx={x(index)}
                      cy={y(point.average_percentage)}
                      r={2.75}
                      fill="#fff"
                      stroke={color}
                      strokeWidth={2}
                    />
                  )
                )}
            </g>
          );
        })}

        {/* Hover guide */}
        {hoverIndex !== null && (
          <line
            x1={x(hoverIndex)}
            x2={x(hoverIndex)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke="#4B2EF5"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        )}

        {/* Hit areas, one per day, so hovering anywhere on a column works */}
        {pointCount > 0 &&
          Array.from({ length: pointCount }, (_, index) => {
            const columnWidth = PLOT_W / Math.max(1, pointCount - 1 || 1);
            return (
              <rect
                key={`hit-${index}`}
                x={x(index) - columnWidth / 2}
                y={PAD.top}
                width={columnWidth}
                height={PLOT_H}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(index)}
              />
            );
          })}
      </svg>

      {/* Readout */}
      {hoverIndex !== null && hoverRows.length > 0 && (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-lg"
          style={{
            left: `${(x(hoverIndex) / VIEW_W) * 100}%`,
            top: PAD.top,
            transform:
              x(hoverIndex) / VIEW_W > 0.62
                ? "translateX(calc(-100% - 10px))"
                : "translateX(10px)",
          }}
        >
          <p className="text-[10px] font-bold text-slate-500">
            {shortDate(series[0]?.points[hoverIndex]?.date ?? average[hoverIndex]?.date ?? "")}
          </p>
          {hoverRows.map((row) => (
            <div key={row.name} className="mt-1 flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="truncate text-[10px] text-slate-600">{row.name}</span>
              <span className="ml-auto pl-2 font-mono text-[10px] font-bold text-slate-900">
                {row.point.average_percentage?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {!hasData && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-slate-400">
          No evaluations recorded in this window.
        </p>
      )}

      {/* Legend — also the only place a batch with no data is named */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {series.map((entry) => {
          const scored = entry.points.some((p) => p.average_percentage !== null);
          return (
            <span key={entry.batch_id} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: trendSeriesColor(entry.series_index), opacity: scored ? 1 : 0.3 }}
              />
              <span className={`text-[11px] font-semibold ${scored ? "text-slate-700" : "text-slate-400"}`}>
                {entry.batch_name}
              </span>
            </span>
          );
        })}
        <span className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-full"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, #94A3B8 0 5px, transparent 5px 9px)",
            }}
          />
          <span className="text-[11px] font-semibold text-slate-500">All batches</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Index runs of consecutive non-null points.
 *
 * Returns point *indexes* rather than points, so the x coordinate stays tied to
 * the day even across a gap.
 */
function buildRuns(points: TrendPoint[]): number[][] {
  const runs: number[][] = [];
  let current: number[] = [];
  for (let index = 0; index < points.length; index += 1) {
    if (points[index].average_percentage === null) {
      if (current.length) runs.push(current);
      current = [];
    } else {
      current.push(index);
    }
  }
  if (current.length) runs.push(current);
  return runs;
}

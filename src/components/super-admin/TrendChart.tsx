"use client";

import React, { useMemo, useSyncExternalStore } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import type { LineSeriesType } from "@mui/x-charts/models";
import type { TrendPoint, TrendSeries } from "@/services/insightsService";
import { shortDate } from "@/utils/date";

type ChartLineSeries = Omit<LineSeriesType, "type"> & { type?: "line" };

/**
 * Vibrant and harmonious palette tailored for high readability and contrast.
 * Matches both the MUI X Charts lines and the batch selection chips.
 */
const SERIES_COLORS = [
  "#4F46E5", // Indigo (Primary)
  "#0D9488", // Teal
  "#EA580C", // Orange
  "#0891B2", // Cyan
  "#DB2777", // Pink / Rose
  "#16A34A", // Emerald green
  "#2563EB", // Royal blue
  "#9333EA", // Purple
];

/**
 * Returns a stable color swatch for a batch by series_index.
 */
export function trendSeriesColor(seriesIndex: number): string {
  const safe = Number.isFinite(seriesIndex) ? seriesIndex : 0;
  return SERIES_COLORS[((safe % SERIES_COLORS.length) + SERIES_COLORS.length) % SERIES_COLORS.length];
}

/**
 * Computes a padded y-axis domain for score percentages (clamped to [0, 100]).
 * Avoids flat-looking lines when values cluster in a narrow range.
 */
function computeYDomain(values: number[]): [number, number] {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length === 0) return [0, 100];

  let min = Math.min(...valid);
  let max = Math.max(...valid);

  if (min === max) {
    min = Math.max(0, min - 10);
    max = Math.min(100, max + 10);
  } else {
    const pad = Math.max((max - min) * 0.15, 5);
    min = Math.max(0, min - pad);
    max = Math.min(100, max + pad);
  }

  // Ensure at least 15% range for visual context
  if (max - min < 15) {
    const mid = (max + min) / 2;
    min = Math.max(0, mid - 7.5);
    max = Math.min(100, mid + 7.5);
  }

  // Round to nearest multiple of 5 for clean tick marks
  const roundedMin = Math.floor(min / 5) * 5;
  const roundedMax = Math.min(100, Math.ceil(max / 5) * 5);

  return [Math.max(0, roundedMin), roundedMax];
}

interface TrendChartProps {
  series: TrendSeries[];
  average: TrendPoint[];
  height?: number;
}

export default function TrendChart({
  series,
  average,
  height = 320,
}: TrendChartProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Collect unique dates across series and average
  const dates = useMemo(() => {
    if (series.length > 0 && series[0]?.points?.length > 0) {
      return series[0].points.map((p) => p.date);
    }
    if (average?.length > 0) {
      return average.map((p) => p.date);
    }
    return [];
  }, [series, average]);

  const pointCount = dates.length;

  // Determine if there is any actual evaluation data to plot
  const hasData = useMemo(() => {
    const seriesHasData = series.some((entry) =>
      entry.points.some((p) => p.average_percentage !== null)
    );
    const avgHasData = average.some((p) => p.average_percentage !== null);
    return seriesHasData || avgHasData;
  }, [series, average]);

  // Compute domain bounds
  const [yMin, yMax] = useMemo(() => {
    const allValues: number[] = [];
    for (const entry of series) {
      for (const p of entry.points) {
        if (p.average_percentage !== null && Number.isFinite(p.average_percentage)) {
          allValues.push(p.average_percentage);
        }
      }
    }
    for (const p of average) {
      if (p.average_percentage !== null && Number.isFinite(p.average_percentage)) {
        allValues.push(p.average_percentage);
      }
    }
    return computeYDomain(allValues);
  }, [series, average]);

  // Compute 5-6 evenly-spaced tick indices for X axis to prevent label crowding
  const tickIndices = useMemo(() => {
    const targetTicks = Math.min(6, Math.max(2, pointCount));
    if (pointCount <= targetTicks) {
      return new Set(Array.from({ length: pointCount }, (_, i) => i));
    }
    const step = (pointCount - 1) / (targetTicks - 1);
    const indices: number[] = [];
    for (let i = 0; i < targetTicks; i++) {
      indices.push(Math.round(i * step));
    }
    return new Set(indices);
  }, [pointCount]);

  // Build MUI X Charts series configurations
  const chartSeries = useMemo(() => {
    const result: ChartLineSeries[] = [];

    // Batch lines
    series.forEach((entry) => {
      const color = trendSeriesColor(entry.series_index);
      result.push({
        id: entry.batch_id,
        label: entry.batch_name,
        data: entry.points.map((p) => p.average_percentage),
        color: color,
        curve: "monotoneX", // Smooth natural bezier curves
        connectNulls: false, // Breaks lines on un-evaluated days as per requirements
        showMark: false, // No circles along the line
        disableHighlight: true, // No circle markers on hover
        valueFormatter: (value: number | null) =>
          value !== null ? `${value.toFixed(1)}%` : "No evaluation",
        highlightScope: { highlight: "series", fade: "global" },
      });
    });

    // Cross-batch average line (dashed grey)
    if (average.length > 0 && average.some((p) => p.average_percentage !== null)) {
      result.push({
        id: "average",
        label: "All Batches (Average)",
        data: average.map((p) => p.average_percentage),
        color: "#94A3B8", // slate-400
        curve: "monotoneX",
        connectNulls: false,
        showMark: false,
        disableHighlight: true,
        valueFormatter: (value: number | null) =>
          value !== null ? `${value.toFixed(1)}% (Average)` : "No evaluation",
        highlightScope: { highlight: "series", fade: "global" },
      });
    }

    return result;
  }, [series, average]);

  if (!isMounted) {
    return (
      <div
        className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Rendering chart...
        </div>
      </div>
    );
  }

  if (!hasData || dates.length === 0) {
    return (
      <div
        className="relative w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-8 flex flex-col items-center justify-center text-center"
        style={{ minHeight: height }}
      >
        <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
          <span className="material-symbols-outlined text-2xl text-slate-400">show_chart</span>
        </div>
        <h4 className="text-sm font-bold text-slate-800">No evaluations in this timeframe</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No learner scores were recorded during the selected period. Choose a wider date window above or record evaluations to populate this trend.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl bg-white/60 p-2 sm:p-4 border border-slate-200/70 shadow-2xs">
      {/* MUI X Charts Line Chart */}
      <div className="w-full overflow-hidden" style={{ height }}>
        <LineChart
          series={chartSeries}
          xAxis={[
            {
              scaleType: "point",
              data: dates,
              valueFormatter: (val: string | number) => shortDate(String(val)),
              tickInterval: (_val: unknown, index: number) => tickIndices.has(index),
              disableTicks: true,
              disableLine: false,
            },
          ]}
          yAxis={[
            {
              min: yMin,
              max: yMax,
              valueFormatter: (val: number | null) => (val !== null ? `${Math.round(val)}%` : ""),
              disableTicks: true,
              disableLine: true,
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ top: 16, right: 24, bottom: 28, left: 42 }}
          hideLegend
          disableLineItemHighlight
          slotProps={{
            tooltip: {
              sx: {
                "& .MuiChartsTooltip-paper": {
                  borderRadius: "14px !important",
                  boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08) !important",
                  border: "1px solid #E2E8F0 !important",
                  backgroundColor: "rgba(255, 255, 255, 0.98) !important",
                  backdropFilter: "blur(12px) !important",
                  padding: "8px 12px !important",
                },
                "& .MuiChartsTooltip-table": {
                  borderCollapse: "separate !important",
                  borderSpacing: "0 3px !important",
                },
                "& .MuiChartsTooltip-cell": {
                  fontSize: "11px !important",
                  fontWeight: 500,
                  color: "#334155 !important",
                  padding: "2px 6px !important",
                },
                "& .MuiChartsTooltip-mark": {
                  borderRadius: "50% !important",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1) !important",
                },
              },
            },
          }}
          sx={{
            width: "100%",
            height: "100%",
            // Gridline styling: subtle and clean
            "& .MuiChartsGrid-line": {
              stroke: "#F1F5F9",
              strokeDasharray: "4 4",
              strokeWidth: 1,
            },
            // Axis labels & lines
            "& .MuiChartsAxis-line": {
              stroke: "#E2E8F0",
              strokeWidth: 1,
            },
            "& .MuiChartsAxis-tickLabel": {
              fill: "#64748B !important",
              fontSize: "11px !important",
              fontWeight: "600 !important",
              fontFamily: "inherit !important",
            },
            // Cross-batch average line: dashed slate with slight opacity
            "& .MuiLineElement-series-average": {
              strokeDasharray: "6 4 !important",
              strokeWidth: "2px !important",
              opacity: 0.8,
            },
            // Batch lines: smooth 3px stroke with rounded caps and joins
            "& .MuiLineElement-root": {
              strokeWidth: 3,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              transition: "stroke-width 0.2s ease, opacity 0.2s ease",
            },
            // Completely hide all circles / dots along the line and on hover
            "& .MuiMarkElement-root": {
              display: "none !important",
            },
            "& .MuiChartsLineHighlight-root": {
              display: "none !important",
            },
            "& .MuiChartsLineHighlightItem-root": {
              display: "none !important",
            },
            "& circle": {
              display: "none !important",
            },
            // Vertical hover guide line
            "& .MuiChartsAxisHighlight-root": {
              stroke: "#6366F1",
              strokeWidth: 1.5,
              strokeDasharray: "3 3",
              opacity: 0.5,
            },
          }}
        />
      </div>

      {/* Interactive Legend with dynamic summary */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 px-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {series.map((entry) => {
            const scored = entry.points.some((p) => p.average_percentage !== null);
            const latestPoint = [...entry.points].reverse().find((p) => p.average_percentage !== null);

            return (
              <div
                key={entry.batch_id}
                className="flex items-center gap-2 text-[11px] group cursor-default"
                title={scored && latestPoint ? `Latest: ${latestPoint.average_percentage?.toFixed(1)}% on ${shortDate(latestPoint.date)}` : "No evaluation scores"}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: trendSeriesColor(entry.series_index),
                    opacity: scored ? 1 : 0.35,
                  }}
                />
                <span className={`font-semibold ${scored ? "text-slate-700" : "text-slate-400"}`}>
                  {entry.batch_name}
                </span>
                {scored && latestPoint?.average_percentage != null && (
                  <span className="font-mono text-[10px] text-slate-500 font-medium">
                    {latestPoint.average_percentage.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 text-[11px]">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{
                backgroundImage: "repeating-linear-gradient(90deg, #94A3B8 0 5px, transparent 5px 9px)",
              }}
            />
            <span className="font-semibold text-slate-500">All batches (Mean)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          MUI X Charts · {series.length} series plotted
        </div>
      </div>
    </div>
  );
}

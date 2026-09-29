"use client";

import React, { useMemo, useSyncExternalStore } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import type { StudentEvaluationItem } from "@/services/adminService";
import { shortDate } from "@/utils/date";

interface InternEvaluationTrendChartProps {
  evaluations: StudentEvaluationItem[];
  height?: number;
}

export default function InternEvaluationTrendChart({
  evaluations,
  height = 200,
}: InternEvaluationTrendChartProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Chronologically sorted evaluations with valid percentage scores
  const validEvals = useMemo(() => {
    return [...evaluations]
      .filter((e) => e.percentage !== null && e.percentage !== undefined && !Number.isNaN(Number(e.percentage)))
      .sort((a, b) => {
        const dateA = a.evaluation_date || a.evaluated_at || "";
        const dateB = b.evaluation_date || b.evaluated_at || "";
        return dateA.localeCompare(dateB);
      });
  }, [evaluations]);

  const scores = useMemo(() => validEvals.map((e) => Math.round(Number(e.percentage))), [validEvals]);

  const labels = useMemo(() => {
    return validEvals.map((e, idx) => {
      const d = String(e.evaluation_date || e.evaluated_at || "").slice(0, 10);
      const formatted = d ? shortDate(d) : `Eval ${idx + 1}`;
      return validEvals.length > 4 ? formatted : `Eval #${idx + 1} (${formatted})`;
    });
  }, [validEvals]);

  const yDomain = useMemo(() => {
    if (scores.length === 0) return { min: 0, max: 100 };
    const minVal = Math.min(...scores);
    const maxVal = Math.max(...scores);
    const min = Math.max(0, Math.floor(Math.max(0, minVal - 15) / 10) * 10);
    const max = Math.min(100, Math.ceil(Math.min(100, maxVal + 10) / 10) * 10);
    return { min, max: Math.max(max, min + 20) };
  }, [scores]);

  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;
  const prevScore = scores.length > 1 ? scores[scores.length - 2] : null;
  const scoreDiff = prevScore !== null && latestScore !== null ? latestScore - prevScore : 0;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null;

  if (!isMounted) {
    return (
      <div
        className="w-full rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-xs text-slate-400 font-medium">Loading evaluation trend...</span>
      </div>
    );
  }

  if (validEvals.length === 0) {
    return (
      <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-2xl text-slate-300 mb-1.5">monitoring</span>
        <p className="text-xs font-bold text-slate-700">No evaluation score trend yet</p>
        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
          Evaluation trend line will display here as daily and workflow evaluations are recorded.
        </p>
      </div>
    );
  }

  // Handle single evaluation gracefully by creating a 2-point baseline
  const chartLabels = validEvals.length === 1 ? ["Baseline", labels[0]] : labels;
  const chartScores = validEvals.length === 1 ? [scores[0], scores[0]] : scores;

  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3 shadow-2xs">
      {/* Header with Title and Score KPIs */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-[#4B2EF5]">trending_up</span>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Evaluation Score Trend
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Score percentage trajectory across {validEvals.length} evaluation{validEvals.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {latestScore !== null && (
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Latest</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold font-mono text-slate-900">{latestScore}%</span>
                {scoreDiff !== 0 && (
                  <span
                    className={`flex items-center text-[10px] font-bold ${
                      scoreDiff > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {scoreDiff > 0 ? "arrow_upward" : "arrow_downward"}
                    </span>
                    {Math.abs(scoreDiff)}%
                  </span>
                )}
              </div>
            </div>
          )}

          {avgScore !== null && (
            <div className="text-right pl-2 border-l border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Average</span>
              <span className="text-sm font-bold font-mono text-[#4B2EF5]">{avgScore}%</span>
            </div>
          )}
        </div>
      </div>

      {/* MUI X Charts Line Chart */}
      <div className="w-full overflow-hidden" style={{ height }}>
        <LineChart
          series={[
            {
              id: "evaluation-scores",
              label: "Evaluation Score (%)",
              data: chartScores,
              color: "#4B2EF5",
              curve: "monotoneX",
              showMark: false,
              disableHighlight: true,
              area: true,
              valueFormatter: (value: number | null) =>
                value !== null ? `${value}% score` : "No score",
            },
          ]}
          xAxis={[
            {
              scaleType: "point",
              data: chartLabels,
              disableTicks: true,
              disableLine: false,
            },
          ]}
          yAxis={[
            {
              min: yDomain.min,
              max: yDomain.max,
              valueFormatter: (val: number | null) => (val !== null ? `${val}%` : ""),
              disableTicks: true,
              disableLine: true,
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ top: 12, right: 16, bottom: 24, left: 38 }}
          hideLegend
          disableLineItemHighlight
          sx={{
            "& .MuiAreaElement-root": {
              fill: "url(#internScoreAreaGradient) !important",
              opacity: 0.15,
            },
            "& .MuiLineElement-root": {
              strokeWidth: 2.5,
              strokeLinecap: "round",
            },
            "& .MuiChartsAxis-line": {
              stroke: "#E2E8F0 !important",
            },
            "& .MuiChartsGrid-line": {
              stroke: "#F1F5F9 !important",
              strokeDasharray: "4 4",
            },
            "& .MuiChartsAxis-tickLabel": {
              fill: "#94A3B8 !important",
              fontSize: "10px !important",
              fontFamily: "inherit !important",
              fontWeight: 500,
            },
          }}
          slotProps={{
            tooltip: {
              sx: {
                "& .MuiChartsTooltip-paper": {
                  borderRadius: "12px !important",
                  boxShadow: "0 8px 20px -4px rgba(15, 23, 42, 0.12) !important",
                  border: "1px solid #E2E8F0 !important",
                  backgroundColor: "rgba(255, 255, 255, 0.98) !important",
                  backdropFilter: "blur(8px) !important",
                  padding: "6px 10px !important",
                },
                "& .MuiChartsTooltip-cell": {
                  fontSize: "11px !important",
                  fontWeight: 600,
                  color: "#1E293B !important",
                },
              },
            },
          }}
        >
          {/* Subtle gradient underneath the line curve */}
          <defs>
            <linearGradient id="internScoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4B2EF5" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#4B2EF5" stopOpacity={0.0} />
            </linearGradient>
          </defs>
        </LineChart>
      </div>
    </div>
  );
}

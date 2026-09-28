"use client";

import React, { useMemo, useSyncExternalStore } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import type { TeamRecord, TeamTotals } from "@/services/insightsService";
import { SectionCard } from "./SuperAdminUi";

interface ProgressChartsRowProps {
  teams: TeamRecord[];
  overall: TeamTotals;
}

/**
 * Returns a color based on the task completion percentage.
 */
function getCompletionToneColor(rate: number): string {
  if (rate >= 75) return "#10B981"; // Emerald
  if (rate >= 50) return "#6366F1"; // Indigo
  if (rate >= 25) return "#F59E0B"; // Amber
  return "#F43F5E"; // Rose
}

export default function ProgressChartsRow({ teams, overall }: ProgressChartsRowProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // ---------------------------------------------------------------------------
  // Bar Chart Data: Batch / Team Task Completion Rate
  // ---------------------------------------------------------------------------
  const barData = useMemo(() => {
    return teams.map((team) => {
      const completionRate = team.tasks?.completion_percentage ?? 0;
      // Short label for the X-axis tick
      const shortName =
        team.name.length > 14 ? `${team.name.slice(0, 12)}…` : team.name;

      return {
        id: team.id,
        teamName: shortName,
        fullName: team.name,
        completion: completionRate,
        completedTasks: team.tasks?.completed ?? 0,
        totalTasks: team.tasks?.total ?? 0,
        color: getCompletionToneColor(completionRate),
      };
    });
  }, [teams]);

  // ---------------------------------------------------------------------------
  // Pie Chart Data: Aggregated Task Status Breakdown
  // ---------------------------------------------------------------------------
  const pieData = useMemo(() => {
    let completed = 0;
    let submitted = 0;
    let inProgress = 0;
    let pending = 0;
    let overdue = 0;

    for (const team of teams) {
      completed += team.tasks?.completed ?? 0;
      submitted += team.tasks?.submitted ?? 0;
      inProgress += team.tasks?.in_progress ?? 0;
      pending += team.tasks?.pending ?? 0;
      overdue += team.tasks?.overdue ?? 0;
    }

    // Fall back to overall roll-up if individual teams don't sum up
    if (completed === 0 && overall.tasks_completed > 0) {
      completed = overall.tasks_completed;
      overdue = overall.tasks_overdue;
      pending = Math.max(0, overall.tasks - completed - overdue);
    }

    const total = completed + submitted + inProgress + pending + overdue || overall.tasks || 1;

    const rawSlices = [
      {
        id: "completed",
        label: "Completed",
        value: completed,
        color: "#10B981", // Emerald
      },
      {
        id: "submitted",
        label: "Submitted",
        value: submitted,
        color: "#0D9488", // Teal
      },
      {
        id: "in_progress",
        label: "In Progress",
        value: inProgress,
        color: "#6366F1", // Indigo
      },
      {
        id: "pending",
        label: "Pending",
        value: pending,
        color: "#94A3B8", // Slate
      },
      {
        id: "overdue",
        label: "Overdue",
        value: overdue,
        color: "#F43F5E", // Rose
      },
    ];

    // Filter out zero slices so the pie chart remains sleek and legible
    const filtered = rawSlices.filter((s) => s.value > 0);

    return {
      slices: filtered.length > 0 ? filtered : [{ id: "empty", label: "No tasks", value: 1, color: "#E2E8F0" }],
      total,
      rawSlices,
    };
  }, [teams, overall]);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 h-80 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
        <div className="lg:col-span-5 xl:col-span-4 h-80 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* =================================================================== */}
      {/* 1. Bar Graph: Batches Task Completion Rate (Wider Column)           */}
      {/* =================================================================== */}
      <SectionCard
        title="Batch completion rate"
        subtitle="Task completion percentage across all monitored batches"
        icon="bar_chart"
        className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between"
      >
        {barData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No batch task data available.
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full overflow-hidden" style={{ height: 280 }}>
              <BarChart
                dataset={barData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "teamName",
                    categoryGapRatio: 0.55,
                    disableTicks: true,
                    disableLine: false,
                    tickLabelStyle: {
                      fontSize: 11,
                      fontWeight: 600,
                      fill: "#64748B",
                      fontFamily: "inherit",
                    },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 100,
                    valueFormatter: (val: number | null) => (val !== null ? `${val}%` : ""),
                    disableTicks: true,
                    disableLine: true,
                    tickLabelStyle: {
                      fontSize: 11,
                      fontWeight: 600,
                      fill: "#64748B",
                      fontFamily: "inherit",
                    },
                  },
                ]}
                series={[
                  {
                    dataKey: "completion",
                    label: "Completion Rate",
                    valueFormatter: (val: number | null) => (val !== null ? `${val}%` : ""),
                    color: "#4F46E5",
                  },
                ]}
                borderRadius={6}
                grid={{ horizontal: true }}
                margin={{ top: 16, right: 16, bottom: 32, left: 42 }}
                hideLegend
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
                      "& .MuiChartsTooltip-cell": {
                        fontSize: "11px !important",
                        fontWeight: 500,
                        color: "#334155 !important",
                      },
                    },
                  },
                }}
                sx={{
                  width: "100%",
                  height: "100%",
                  "& .MuiChartsGrid-line": {
                    stroke: "#F1F5F9",
                    strokeDasharray: "4 4",
                    strokeWidth: 1,
                  },
                  "& .MuiChartsAxis-line": {
                    stroke: "#E2E8F0",
                    strokeWidth: 1,
                  },
                  "& .MuiBarElement-root": {
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                    "&:hover": {
                      opacity: 0.85,
                    },
                  },
                }}
              />
            </div>

            {/* Quick summary indicators */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {barData.length} Batch{barData.length === 1 ? "" : "es"} Tracked
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  &ge;75% High
                </span>
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  50-74% Mid
                </span>
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  &lt;50% Behind
                </span>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* =================================================================== */}
      {/* 2. Pie Chart: Related Task Status Distribution (Compact Column)     */}
      {/* =================================================================== */}
      <SectionCard
        title="Task status distribution"
        subtitle="Platform-wide breakdown of all workflow tasks by status"
        icon="donut_large"
        className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between"
      >
        <div className="w-full">
          <div className="w-full flex items-center justify-center overflow-hidden relative" style={{ height: 280 }}>
            <PieChart
              series={[
                {
                  data: pieData.slices,
                  innerRadius: 54,
                  outerRadius: 90,
                  paddingAngle: 3,
                  cornerRadius: 5,
                  highlightScope: { highlight: "item", fade: "global" },
                  valueFormatter: (item: { value: number }) =>
                    `${item.value} tasks (${Math.round((item.value / pieData.total) * 100)}%)`,
                },
              ]}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              hideLegend
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
                    "& .MuiChartsTooltip-cell": {
                      fontSize: "11px !important",
                      fontWeight: 500,
                      color: "#334155 !important",
                    },
                  },
                },
              }}
              sx={{
                width: "100%",
                height: "100%",
              }}
            />

            {/* Centered Donut Stat Callout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-mono text-slate-900 leading-none">
                {overall.tasks}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Total Tasks
              </span>
            </div>
          </div>

          {/* Interactive Legend for Pie Chart */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {pieData.rawSlices.map((slice) => {
              const pct = Math.round((slice.value / pieData.total) * 100) || 0;
              return (
                <div key={slice.id} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-semibold text-slate-700">{slice.label}</span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {slice.value} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

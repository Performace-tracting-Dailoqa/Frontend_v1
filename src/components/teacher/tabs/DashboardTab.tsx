"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  fetchTeacherDashboardSummary,
  createTeacherBatch,
  TeacherDashboardSummaryResponse,
  HistoryPoint,
} from "@/services/teacherService";
import { computeTimelineData, getAvailableMonths, Timeframe } from "@/utils/date";
import TeacherBatchDetailModal from "../TeacherBatchDetailModal";
import TeacherStudentAnalyticsModal from "../TeacherStudentAnalyticsModal";

interface DashboardTabProps {
  assignedBatches?: string[];
  assignedLearnerCount?: number;
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardTab({ onNavigateTab }: DashboardTabProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [dashboardData, setDashboardData] = useState<TeacherDashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [selectedBatchForModal, setSelectedBatchForModal] = useState<string | null>(null);
  const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = useState<string | null>(null);

  // Create Batch Modal State
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: "",
    course: "Japanese Language & Technical Training",
    department: "Engineering",
    start_date: "",
    end_date: "",
  });
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTeacherDashboardSummary();
      setDashboardData(res);
    } catch (err) {
      console.warn("Error loading teacher dashboard summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.name.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await createTeacherBatch({
        name: batchForm.name,
        course: batchForm.course,
        department: batchForm.department,
        start_date: batchForm.start_date || undefined,
        end_date: batchForm.end_date || undefined,
      });
      setStatusMessage({ type: "success", text: "Batch created successfully!" });
      setShowCreateBatchModal(false);
      setBatchForm({
        name: "",
        course: "Japanese Language & Technical Training",
        department: "Engineering",
        start_date: "",
        end_date: "",
      });
      await loadDashboard();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to create batch" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = dashboardData?.summary || {
    total_batches: 0,
    total_students: 0,
    overall_avg_score: 0,
    chapters_completed: 0,
    total_evaluations: 0,
    finalized_evaluations: 0,
    jlpt_target: "JLPT N5 - N4 Cohort",
  };

  const batches = dashboardData?.batches || [];
  const globalHistory = dashboardData?.global_history || [];
  const skillBreakdown = dashboardData?.skill_breakdown || [];

  // Determine active performance history based on filter
  const activeBatch = batches.find((b) => b.batch_id === selectedBatchFilter);
  const activeHistory: HistoryPoint[] =
    selectedBatchFilter === "all"
      ? globalHistory
      : activeBatch?.performance_history || [];

  const availableMonths = useMemo(() => getAvailableMonths(activeHistory), [activeHistory]);

  const currentSelectionAvg =
    selectedBatchFilter === "all"
      ? summary.overall_avg_score
      : activeBatch?.average_score || 0;

  // Compute Timeline Data for Week (7D) vs Month (30D) vs All
  const { labels: lineDates, scores: lineScores, minScore: minChartScore } = useMemo(() => {
    return computeTimelineData(activeHistory, timeframe, currentSelectionAvg, selectedMonth);
  }, [activeHistory, timeframe, currentSelectionAvg, selectedMonth]);

  // Bar Chart Data for Category Competencies using @mui/x-charts
  const { skillCategories, skillValues } = useMemo(() => {
    if (!skillBreakdown || skillBreakdown.length === 0) {
      return { skillCategories: [], skillValues: [] };
    }
    return {
      skillCategories: skillBreakdown.map((s) => s.category),
      skillValues: skillBreakdown.map((s) => s.average_percentage ?? 0),
    };
  }, [skillBreakdown]);

  // Batch Comparison Data
  const { batchNames, batchScores } = useMemo(() => {
    if (!batches || batches.length === 0) {
      return { batchNames: [], batchScores: [] };
    }
    return {
      batchNames: batches.map((b) => b.batch_name),
      batchScores: batches.map((b) => b.average_score ?? 0),
    };
  }, [batches]);

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Batches */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-sm text-outline font-semibold">Assigned Batches</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-[#4B2EF5] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
          </div>
          <p className="text-headline-md font-headline font-bold text-on-surface">
            {summary.total_batches}
          </p>
          <p className="text-[11px] text-primary mt-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All cohorts active</span>
          </p>
        </div>

        {/* Card 2: Total Learners */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-sm text-outline font-semibold">Total Students</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">groups</span>
            </div>
          </div>
          <p className="text-headline-md font-headline font-bold text-on-surface">
            {summary.total_students}
          </p>
          <p className="text-[11px] text-outline mt-1">Across {summary.total_batches} training batches</p>
        </div>

        {/* Card 3: Overall Performance */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-sm text-outline font-semibold">Overall Performance</span>
            <div className="w-8 h-8 rounded-xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">trending_up</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-headline-md font-headline font-bold text-[#4B2EF5]">
              {summary.overall_avg_score}%
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              JLPT N5-N4
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Mean Japanese score</p>
        </div>

        {/* Card 4: Chapters Completed */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-sm text-outline font-semibold">Chapters / Milestones</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">auto_stories</span>
            </div>
          </div>
          <p className="text-headline-md font-headline font-bold text-on-surface">
            {summary.chapters_completed}
          </p>
          <p className="text-[11px] text-outline mt-1">{summary.total_evaluations} Evaluations &amp; drills logged</p>
        </div>
      </div>

      {/* Main Performance Analytics with MUI X-Charts (Weekly & Monthly View Toggle) */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4B2EF5] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">monitoring</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight font-headline">
                {selectedBatchFilter === "all"
                  ? "Japanese Language Performance Trajectory (All Batches)"
                  : `Japanese Performance Trajectory: ${activeBatch?.batch_name || "Selected Batch"}`}
              </h3>
              <p className="text-[11px] text-slate-500">
                Daily evaluation score trajectory across {timeframe === "week" ? "the whole week" : timeframe === "month" ? "the whole month (30 days)" : "all recorded sessions"}
              </p>
            </div>
          </div>

          {/* Timeframe Pill Buttons (Week vs Month) + Batch Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Week / Month Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setTimeframe("week")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === "week"
                    ? "bg-white text-[#4B2EF5] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Whole Week (7D)
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("month")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === "month"
                    ? "bg-white text-[#4B2EF5] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Whole Month (30D)
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === "all"
                    ? "bg-white text-[#4B2EF5] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Sessions
              </button>
            </div>

            {/* Month Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 shadow-2xs">
              <span className="material-symbols-outlined text-sm text-[#4B2EF5]">calendar_month</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setTimeframe("month");
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                aria-label="Filter performance by month"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Filter Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 shadow-2xs">
              <span className="material-symbols-outlined text-sm text-[#4B2EF5]">filter_alt</span>
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                aria-label="Filter performance by batch"
              >
                <option value="all">All Batches Combined ({batches.length})</option>
                {batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_name} ({b.student_count} learners • avg {b.average_score}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center gap-1.5">
              <span className="text-[11px] text-indigo-700 font-medium">
                {selectedBatchFilter === "all" ? "Combined Avg:" : `${activeBatch?.batch_name} Avg:`}
              </span>
              <span className="text-xs font-bold text-[#4B2EF5] font-mono">{currentSelectionAvg}%</span>
            </div>

            {selectedBatchFilter !== "all" && activeBatch && (
              <button
                onClick={() => setSelectedBatchForModal(activeBatch.batch_id)}
                className="flex items-center gap-1 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                <span>Open Batch View</span>
              </button>
            )}
          </div>
        </div>

        {/* MUI X-Charts LineChart for Batch Performance */}
        <div className="w-full h-80 pt-2">
          {isMounted ? (
            <LineChart
              xAxis={[
                {
                  scaleType: "point",
                  data: lineDates,
                },
              ]}
              yAxis={[
                {
                  min: minChartScore,
                  max: 100,
                },
              ]}
              series={[
                {
                  data: lineScores,
                  color: "#4B2EF5",
                  area: true,
                  curve: "monotoneX",
                  showMark: false,
                  label: selectedBatchFilter === "all" ? "Combined Japanese Score %" : `${activeBatch?.batch_name} Score %`,
                },
              ]}
              height={300}
              margin={{ top: 15, right: 25, bottom: 35, left: 45 }}
            />
          ) : (
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin m-auto mt-24" />
          )}
        </div>
      </div>

      {/* 2-Column Analytics: Skill Breakdown BarChart + Batch Comparison BarChart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Japanese Competency Bar Chart */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4B2EF5] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">psychology</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-headline">Language Competency Breakdown</h4>
                <p className="text-[10px] text-slate-500">Mean proficiency across language domains</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary font-bold rounded">
              JLPT N5 Drills
            </span>
          </div>

          <div className="w-full h-56 pt-2">
            {isMounted && skillCategories.length > 0 ? (
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: skillCategories,
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 100,
                  },
                ]}
                series={[
                  {
                    data: skillValues,
                    color: "#4B2EF5",
                    label: "Proficiency %",
                  },
                ]}
                height={220}
                margin={{ top: 10, right: 15, bottom: 30, left: 40 }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No competency breakdown data available
              </div>
            )}
          </div>
        </div>

        {/* Batch Comparative Performance Bar Chart */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-base">stacked_bar_chart</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-headline">Cohort Batch Comparison</h4>
                <p className="text-[10px] text-slate-500">Average score comparison across active cohorts</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">
              {batches.length} Cohorts
            </span>
          </div>

          <div className="w-full h-56 pt-2">
            {isMounted && batchNames.length > 0 ? (
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: batchNames,
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 100,
                  },
                ]}
                series={[
                  {
                    data: batchScores,
                    color: "#10B981",
                    label: "Cohort Avg %",
                  },
                ]}
                height={220}
                margin={{ top: 10, right: 15, bottom: 30, left: 40 }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No batch comparison data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Batches Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4B2EF5] text-xl">folder_shared</span>
              <span>Assigned Batches ({batches.length})</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Click on any batch card to open the batch student roster and view individual Japanese performance graphs.
            </p>
          </div>

          <button
            onClick={() => setShowCreateBatchModal(true)}
            className="flex items-center gap-1.5 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>New Batch</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin mb-2">sync</span>
            <p>Loading assigned batches & performance metrics...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">school</span>
            <p className="text-sm font-semibold text-on-surface">No batches assigned yet</p>
            <p className="text-xs text-on-surface-variant mt-1">Create a new batch or contact the administrator.</p>
            <button
              onClick={() => setShowCreateBatchModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold"
            >
              Create your first batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {batches.map((batch) => {
              const avgScore = batch.average_score;
              const isSelected = selectedBatchFilter === batch.batch_id;

              return (
                <div
                  key={batch.batch_id}
                  onClick={() => setSelectedBatchForModal(batch.batch_id)}
                  className={`bg-surface-container-lowest p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group hover:shadow-md hover:border-primary/50 ${
                    isSelected ? "border-[#4B2EF5] ring-2 ring-[#4B2EF5]/20 shadow-xs" : "border-outline-variant/40 shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary">
                        {batch.department || "Engineering"}
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Avg {avgScore}%
                      </span>
                    </div>

                    <div>
                      <h4 className="font-headline font-bold text-base text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>{batch.batch_name}</span>
                        <span className="material-symbols-outlined text-lg text-outline group-hover:translate-x-1 group-hover:text-primary transition-all">
                          arrow_forward
                        </span>
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-1">
                        JLPT N5-N4 Linguistic Track
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-base text-secondary">groups</span>
                      <span>{batch.student_count} Learners</span>
                    </span>

                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <span className="material-symbols-outlined text-base">bar_chart</span>
                      <span>{batch.evaluations_count} Graded</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch Detail Modal (Opens when clicking any batch) */}
      {selectedBatchForModal && (
        <TeacherBatchDetailModal
          batchId={selectedBatchForModal}
          onClose={() => setSelectedBatchForModal(null)}
          onNavigateToEvaluations={(studentId) => {
            setSelectedBatchForModal(null);
            if (onNavigateTab) onNavigateTab("evaluations");
          }}
        />
      )}

      {/* Student Analytics Modal */}
      {selectedStudentForAnalytics && (
        <TeacherStudentAnalyticsModal
          studentId={selectedStudentForAnalytics}
          onClose={() => setSelectedStudentForAnalytics(null)}
          onNavigateToEvaluations={(studentId) => {
            setSelectedStudentForAnalytics(null);
            if (onNavigateTab) onNavigateTab("evaluations");
          }}
        />
      )}

      {/* Create Batch Modal */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">add_box</span>
                <span>Create New Cohort Batch</span>
              </h3>
              <button
                onClick={() => setShowCreateBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. 2026-Cohort-Tokyo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curriculum / Track</label>
                <input
                  type="text"
                  value={batchForm.course}
                  onChange={(e) => setBatchForm({ ...batchForm, course: e.target.value })}
                  placeholder="e.g. Japanese Language & Technical Training"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={batchForm.department}
                  onChange={(e) => setBatchForm({ ...batchForm, department: e.target.value })}
                  placeholder="e.g. Engineering"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={batchForm.start_date}
                    onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={batchForm.end_date}
                    onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

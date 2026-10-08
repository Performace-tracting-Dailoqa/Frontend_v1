"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  BatchJapaneseDetailsResponse,
  fetchBatchJapaneseDetails,
} from "@/services/teacherService";
import { computeTimelineData, getAvailableMonths, Timeframe } from "@/utils/date";
import TeacherStudentAnalyticsModal from "./TeacherStudentAnalyticsModal";
import WorkflowsTab from "./tabs/WorkflowsTab";

interface TeacherBatchDetailModalProps {
  batchId: string;
  onClose: () => void;
  onNavigateToEvaluations?: (studentId?: string) => void;
}

export default function TeacherBatchDetailModal({
  batchId,
  onClose,
  onNavigateToEvaluations,
}: TeacherBatchDetailModalProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [data, setData] = useState<BatchJapaneseDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalTab, setModalTab] = useState<"workflows" | "overview" | "students">("workflows");

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchBatchJapaneseDetails(batchId)
      .then((res) => setData(res))
      .catch((err) => {
        console.error("Error fetching batch Japanese details:", err);
        setError(err.message || "Failed to load batch details");
      })
      .finally(() => setIsLoading(false));
  }, [batchId]);

  const historyPoints = data?.performance_history || [];
  const skillBreakdown = data?.skill_breakdown || [];
  const batchAvg = data?.summary?.average_score || 75;
  const availableMonths = useMemo(() => getAvailableMonths(historyPoints), [historyPoints]);

  // Timeline Data for Week (7D) vs Month (30D) vs All
  const { labels: lineDates, scores: lineScores, minScore: minChartScore } = useMemo(() => {
    return computeTimelineData(historyPoints, timeframe, batchAvg, selectedMonth);
  }, [historyPoints, timeframe, batchAvg, selectedMonth]);

  // Bar Chart Data for Skills
  const { skillCategories, skillValues } = useMemo(() => {
    if (!skillBreakdown || skillBreakdown.length === 0) {
      return { skillCategories: [], skillValues: [] };
    }
    return {
      skillCategories: skillBreakdown.map((s) => s.category),
      skillValues: skillBreakdown.map((s) => s.average_percentage ?? 0),
    };
  }, [skillBreakdown]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/40 shadow-2xl flex flex-col items-center gap-3 max-w-sm w-full text-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <p className="text-sm font-semibold text-on-surface">Loading Batch Performance Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-2xl max-w-md w-full">
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <span className="material-symbols-outlined">error</span>
            <h3 className="font-bold text-base">Failed to Load Batch</h3>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">{error || "No data available."}</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { summary, students } = data;

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-transparent border-b border-outline-variant/30 flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#4B2EF5] text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-headline font-bold text-on-surface">{summary.batch_name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Active Cohort
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Department: <span className="font-semibold text-on-surface">{summary.department || "Engineering"}</span> • {summary.student_count} Enrolled Learners • {summary.evaluations_count} Evaluations Logged
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Modal Tab Strip */}
          <div className="flex items-center gap-2 px-5 sm:px-6 pt-2 border-b border-outline-variant/30 bg-surface-container/20 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setModalTab("workflows")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer shrink-0 ${
                modalTab === "workflows"
                  ? "border-[#4B2EF5] text-[#4B2EF5] bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-base">assignment</span>
              <span>Workflows, Homework &amp; Tests</span>
            </button>
            <button
              type="button"
              onClick={() => setModalTab("overview")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer shrink-0 ${
                modalTab === "overview"
                  ? "border-[#4B2EF5] text-[#4B2EF5] bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-base">analytics</span>
              <span>Score Trends &amp; Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setModalTab("students")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer shrink-0 ${
                modalTab === "students"
                  ? "border-[#4B2EF5] text-[#4B2EF5] bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-base">groups</span>
              <span>Enrolled Learners ({filteredStudents.length})</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* TAB 1: WORKFLOWS, HOMEWORK & TESTS */}
            {modalTab === "workflows" && (
              <WorkflowsTab
                initialBatchId={batchId}
                onNavigateToEvaluations={onNavigateToEvaluations}
              />
            )}

            {/* TAB 2: OVERVIEW & ANALYTICS */}
            {modalTab === "overview" && (
              <div className="space-y-6">
                {/* KPI Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30">
                    <span className="text-[11px] text-on-surface-variant font-medium">Batch Average Score</span>
                    <p className="text-2xl font-bold text-[#4B2EF5] mt-1">{summary.average_score}%</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">JLPT N5 Target</span>
                  </div>

                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30">
                    <span className="text-[11px] text-on-surface-variant font-medium">Enrolled Students</span>
                    <p className="text-2xl font-bold text-on-surface mt-1">{summary.student_count}</p>
                    <span className="text-[10px] text-on-surface-variant">Active learners</span>
                  </div>

                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30">
                    <span className="text-[11px] text-on-surface-variant font-medium">Session Evaluations</span>
                    <p className="text-2xl font-bold text-on-surface mt-1">{summary.evaluations_count}</p>
                    <span className="text-[10px] text-on-surface-variant">Daily &amp; milestone drills</span>
                  </div>

                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/30">
                    <span className="text-[11px] text-on-surface-variant font-medium">Cohort Status</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Passing</p>
                    <span className="text-[10px] text-primary font-medium">Linguistic Track</span>
                  </div>
                </div>

                {/* Performance History Line Graph & Category Skills with @mui/x-charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Line Chart */}
                  <div className="lg:col-span-2 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#4B2EF5] text-lg">ssid_chart</span>
                          <span>Batch Score Trend Over Sessions</span>
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Showing performance for {timeframe === "week" ? "the whole week (7 days)" : timeframe === "month" ? "the whole month (30 days)" : "all sessions"}.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Timeframe Toggle Buttons */}
                        <div className="flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant/40 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setTimeframe("week")}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              timeframe === "week"
                                ? "bg-white text-[#4B2EF5] shadow-xs"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            Week (7D)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimeframe("month")}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              timeframe === "month"
                                ? "bg-white text-[#4B2EF5] shadow-xs"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            Month (30D)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimeframe("all")}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              timeframe === "all"
                                ? "bg-white text-[#4B2EF5] shadow-xs"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            All
                          </button>
                        </div>

                        {/* Month Dropdown */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/40 rounded-xl text-xs font-medium text-slate-700 shadow-2xs">
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
                      </div>
                    </div>

                    <div className="w-full h-56 pt-2">
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
                              label: `${summary.batch_name} Avg %`,
                            },
                          ]}
                          height={220}
                          margin={{ top: 10, right: 20, bottom: 30, left: 40 }}
                        />
                      ) : (
                        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin m-auto mt-16" />
                      )}
                    </div>
                  </div>

                  {/* Category Competency with MUI X-Charts BarChart */}
                  <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
                      <span>Batch Category Averages</span>
                    </h3>

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
                          margin={{ top: 10, right: 10, bottom: 30, left: 35 }}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          No category metrics available
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: STUDENTS */}
            {modalTab === "students" && (
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">group</span>
                      <span>Learners in {summary.batch_name} ({filteredStudents.length})</span>
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Click on any student to open their granular Japanese line graphs, daily evaluation drilldowns, and competency reports.
                    </p>
                  </div>

                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search student or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-outline bg-surface-container rounded-xl">
                    No students found matching your search.
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/30 border border-outline-variant/30 rounded-2xl overflow-hidden">
                    {filteredStudents.map((st) => {
                      const avg = st.average_score;
                      const badgeColor =
                        avg >= 85
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : avg >= 70
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-amber-50 text-amber-700 border-amber-200";

                      return (
                        <div
                          key={st.id}
                          className="p-4 hover:bg-surface-container/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                          onClick={() => setSelectedStudentForAnalytics(st.id)}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#4B2EF5]/15 text-[#4B2EF5] flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                              {st.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                                  {st.name}
                                </h4>
                                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-surface-container font-semibold text-on-surface-variant">
                                  {st.enrollment_no}
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant mt-0.5">{st.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 justify-between md:justify-end">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] text-on-surface-variant font-medium block">Average Score</span>
                              <span className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${badgeColor}`}>
                                {st.average_score}%
                              </span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[10px] text-on-surface-variant font-medium block">Attendance</span>
                              <span className="text-xs font-semibold text-emerald-600">{st.attendance_rate}%</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudentForAnalytics(st.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary hover:text-white text-on-surface text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                              >
                                <span className="material-symbols-outlined text-sm">analytics</span>
                                <span>Graphs</span>
                              </button>

                              {onNavigateToEvaluations && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToEvaluations(st.id);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#4B2EF5] text-white hover:bg-[#4B2EF5]/90 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                  <span>Grade</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-surface-container border-t border-outline-variant/30 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-xs font-semibold text-on-surface cursor-pointer"
            >
              Close Batch View
            </button>
          </div>

        </div>
      </div>

      {/* Nested Student Analytics Modal */}
      {selectedStudentForAnalytics && (
        <TeacherStudentAnalyticsModal
          studentId={selectedStudentForAnalytics}
          onClose={() => setSelectedStudentForAnalytics(null)}
          onNavigateToEvaluations={onNavigateToEvaluations}
        />
      )}
    </>
  );
}

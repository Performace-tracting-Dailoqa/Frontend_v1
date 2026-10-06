"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  StudentJapaneseAnalyticsResponse,
  fetchStudentJapaneseAnalytics,
} from "@/services/teacherService";
import { computeTimelineData, getAvailableMonths, Timeframe } from "@/utils/date";

interface TeacherStudentAnalyticsModalProps {
  studentId: string;
  onClose: () => void;
  onNavigateToEvaluations?: (studentId: string) => void;
}

export default function TeacherStudentAnalyticsModal({
  studentId,
  onClose,
  onNavigateToEvaluations,
}: TeacherStudentAnalyticsModalProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [data, setData] = useState<StudentJapaneseAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchStudentJapaneseAnalytics(studentId)
      .then((res) => {
        setData(res);
        if (res.evaluations_history && res.evaluations_history.length > 0) {
          setSelectedEvalId(res.evaluations_history[0].id);
        }
      })
      .catch((err) => {
        console.error("Error fetching student Japanese analytics:", err);
        setError(err.message || "Failed to load student Japanese analytics");
      })
      .finally(() => setIsLoading(false));
  }, [studentId]);

  const trendPoints = data?.performance_trend || [];
  const skillsBreakdown = data?.skills_breakdown || [];
  const studentAvg = data?.student?.overall_average || 75;
  const availableMonths = useMemo(() => getAvailableMonths(trendPoints), [trendPoints]);

  // Timeline Data for Week (7D) vs Month (30D) vs All
  const { labels: lineDates, scores: lineScores, minScore: minChartScore } = useMemo(() => {
    return computeTimelineData(trendPoints, timeframe, studentAvg, selectedMonth);
  }, [trendPoints, timeframe, studentAvg, selectedMonth]);

  // Bar Chart Data for Category Competencies
  const { categoryNames, categoryScores } = useMemo(() => {
    if (!skillsBreakdown || skillsBreakdown.length === 0) {
      return { categoryNames: [], categoryScores: [] };
    }
    return {
      categoryNames: skillsBreakdown.map((s) => s.category),
      categoryScores: skillsBreakdown.map((s) => s.score ?? 0),
    };
  }, [skillsBreakdown]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/40 shadow-2xl flex flex-col items-center gap-3 max-w-sm w-full text-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <p className="text-sm font-semibold text-on-surface">Loading Japanese Performance Dossier...</p>
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
            <h3 className="font-bold text-base">Failed to Load Performance Data</h3>
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

  const { student, evaluations_history } = data;
  const activeEval = evaluations_history.find((e) => e.id === selectedEvalId) || evaluations_history[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-transparent border-b border-outline-variant/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4B2EF5] text-white flex items-center justify-center font-bold text-lg shadow-md">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-headline font-bold text-on-surface">{student.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4B2EF5]/15 text-[#4B2EF5]">
                  {student.target_jlpt} Track
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {student.email} • ID: <span className="font-mono text-on-surface">{student.enrollment_no}</span> • Batch: <span className="font-semibold text-primary">{student.batch_name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToEvaluations && (
              <button
                onClick={() => onNavigateToEvaluations(student.id)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                <span>Evaluate Now</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/30">
              <span className="text-[11px] text-on-surface-variant font-medium">Overall Average</span>
              <p className="text-xl font-bold text-[#4B2EF5] mt-0.5">{student.overall_average}%</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Across all Japanese drills</span>
            </div>

            <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/30">
              <span className="text-[11px] text-on-surface-variant font-medium">Attendance Rate</span>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{student.attendance_rate}%</p>
              <span className="text-[10px] text-on-surface-variant">Linguistic drill presence</span>
            </div>

            <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/30">
              <span className="text-[11px] text-on-surface-variant font-medium">Evaluations Logged</span>
              <p className="text-xl font-bold text-on-surface mt-0.5">{student.total_evaluations}</p>
              <span className="text-[10px] text-on-surface-variant">Daily &amp; milestone drills</span>
            </div>

            <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/30">
              <span className="text-[11px] text-on-surface-variant font-medium">Linguistic Status</span>
              <p className="text-xl font-bold text-on-surface mt-0.5 capitalize">
                {student.overall_average >= 85 ? "Advanced" : student.overall_average >= 70 ? "On Track" : "Needs Review"}
              </p>
              <span className="text-[10px] text-primary font-medium">{student.department} Cohort</span>
            </div>
          </div>

          {/* Section 1: Japanese Daily Performance Line Graph using @mui/x-charts */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4B2EF5] text-lg">trending_up</span>
                  <span>Japanese Daily Evaluation Score Progression</span>
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Trajectory across {timeframe === "week" ? "the whole week (7 days)" : timeframe === "month" ? "the whole month (30 days)" : "all sessions"}.
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

            {/* MUI X-Charts LineChart */}
            <div className="w-full h-64 pt-2">
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
                      label: `${student.name} Score %`,
                    },
                  ]}
                  height={250}
                  margin={{ top: 10, right: 20, bottom: 30, left: 40 }}
                />
              ) : (
                <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin m-auto mt-20" />
              )}
            </div>
          </div>

          {/* Section 2: Skills Breakdown BarChart & Drill Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Category Competency BarChart */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
                <span>Language Competency by Category</span>
              </h3>

              <div className="w-full h-56 pt-2">
                {isMounted && categoryNames.length > 0 ? (
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",
                        data: categoryNames,
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
                        data: categoryScores,
                        color: "#4B2EF5",
                        label: "Competency %",
                      },
                    ]}
                    height={220}
                    margin={{ top: 10, right: 10, bottom: 30, left: 35 }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No competency metrics available
                  </div>
                )}
              </div>
            </div>

            {/* Selected Evaluation Drill Details */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4B2EF5] text-lg">rate_review</span>
                    <span>Session Drill Breakdown</span>
                  </h3>
                  {activeEval && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {activeEval.evaluation_date}
                    </span>
                  )}
                </div>

                {activeEval ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30">
                      <p className="font-bold text-on-surface">{activeEval.evaluation_title}</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5 italic">
                        &quot;{activeEval.feedback || "Good performance during drills."}&quot;
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {activeEval.metrics.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30"
                        >
                          <div>
                            <p className="font-semibold text-on-surface">{m.name}</p>
                            <span className="text-[10px] text-on-surface-variant">{m.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-primary">
                              {m.score} / {m.full_score}
                            </span>
                            {m.proficiency_level && (
                              <span className="block text-[9px] font-bold text-emerald-600">
                                {m.proficiency_level}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-outline italic">Select a session below to view granular drills.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Evaluation Sessions History List */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">history_edu</span>
              <span>All Evaluated Sessions ({evaluations_history.length})</span>
            </h3>

            <div className="divide-y divide-outline-variant/30">
              {evaluations_history.map((ev) => {
                const isSelected = ev.id === selectedEvalId;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvalId(ev.id)}
                    className={`py-3 px-3.5 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-surface-container"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-on-surface">{ev.evaluation_title}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant uppercase">
                          {ev.evaluation_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">
                        Date: <span className="font-medium text-on-surface">{ev.evaluation_date}</span> • Level: <span className="font-medium text-primary">{ev.jlpt_level}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-primary">{ev.percentage}%</span>
                        <span className="block text-[10px] text-emerald-600 font-semibold capitalize">{ev.status}</span>
                      </div>
                      <span className="material-symbols-outlined text-base text-outline">
                        {isSelected ? "radio_button_checked" : "chevron_right"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container border-t border-outline-variant/30 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-xs font-semibold text-on-surface cursor-pointer"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}

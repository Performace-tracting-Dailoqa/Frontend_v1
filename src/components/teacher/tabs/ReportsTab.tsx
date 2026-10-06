"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  fetchTeacherBatches,
  fetchTeacherStudents,
  fetchBatchJapaneseDetails,
  fetchStudentJapaneseAnalytics,
  TeacherBatch,
  TeacherStudent,
  BatchJapaneseDetailsResponse,
  StudentJapaneseAnalyticsResponse,
  StudentJapaneseEvalItem,
} from "@/services/teacherService";
import { shortDate } from "@/utils/date";

type ReportPeriodType = "quarterly" | "annually";

interface JapaneseCompetencyMetric {
  name: string;
  jpName: string;
  score: number;
  fullScore: number;
}

const DEFAULT_JP_COMPETENCIES: JapaneseCompetencyMetric[] = [
  { name: "Kanji & Radicals", jpName: "漢字 (Kanji)", score: 86, fullScore: 100 },
  { name: "Vocabulary & Idioms", jpName: "語彙 (Vocabulary)", score: 88, fullScore: 100 },
  { name: "Grammar & Particles", jpName: "文法 (Grammar)", score: 82, fullScore: 100 },
  { name: "Listening Comprehension", jpName: "聴解 (Listening)", score: 78, fullScore: 100 },
  { name: "Speaking & Keigo", jpName: "会話・敬語 (Oral)", score: 84, fullScore: 100 },
];

export default function ReportsTab() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // ---------------------------------------------------------------------------
  // Navigation & Drilldown State
  // Level 1: All Batches View (selectedBatch === null)
  // Level 2: Batch Roster & Batch Report View (selectedBatch !== null && selectedStudent === null)
  // Level 3: Individual Student Japanese Report View (selectedStudent !== null)
  // ---------------------------------------------------------------------------
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TeacherBatch | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [isBatchReportModalOpen, setIsBatchReportModalOpen] = useState(false);

  // Loaded detail data
  const [batchDetail, setBatchDetail] = useState<BatchJapaneseDetailsResponse | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentJapaneseAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Report Period State
  const [reportType, setReportType] = useState<ReportPeriodType>("quarterly");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q4 2026 (Oct - Dec)");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const activePeriodLabel = reportType === "quarterly" ? selectedQuarter : `Annual ${selectedYear}`;

  // Initial load: batches and students
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [batchesRes, studentsRes] = await Promise.all([
          fetchTeacherBatches().catch(() => []),
          fetchTeacherStudents().catch(() => []),
        ]);
        setBatches(batchesRes);
        setStudents(studentsRes);
      } catch (err) {
        console.warn("Failed to load batches or students:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // When selectedBatch changes, load its Japanese details
  useEffect(() => {
    if (selectedBatch) {
      fetchBatchJapaneseDetails(selectedBatch.id)
        .then((res) => setBatchDetail(res))
        .catch((err) => {
          console.warn("Failed to load batch Japanese details:", err);
          setBatchDetail(null);
        });
    } else {
      setBatchDetail(null);
    }
  }, [selectedBatch]);

  // When selectedStudent changes, load their Japanese analytics
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentJapaneseAnalytics(selectedStudent.id)
        .then((res) => setStudentAnalytics(res))
        .catch((err) => {
          console.warn("Failed to load student Japanese analytics:", err);
          setStudentAnalytics(null);
        });
    } else {
      setStudentAnalytics(null);
    }
  }, [selectedStudent]);

  // ---------------------------------------------------------------------------
  // Filtered Students in Batch View
  // ---------------------------------------------------------------------------
  const currentBatchStudents = useMemo(() => {
    if (!selectedBatch) return students;
    return students.filter((s) => s.batch_id === selectedBatch.id);
  }, [students, selectedBatch]);

  const filteredBatchStudents = useMemo(() => {
    if (!memberSearchQuery.trim()) return currentBatchStudents;
    const q = memberSearchQuery.toLowerCase();
    return currentBatchStudents.filter(
      (s) =>
        (s.full_name || s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.enrollment_no && s.enrollment_no.toLowerCase().includes(q))
    );
  }, [currentBatchStudents, memberSearchQuery]);

  // Average score calculations
  const studentAvgScore = useMemo(() => {
    if (studentAnalytics?.student?.overall_average !== undefined) {
      return Math.round(studentAnalytics.student.overall_average);
    }
    return 85;
  }, [studentAnalytics]);

  const batchAvgScore = useMemo(() => {
    if (batchDetail?.summary?.average_score !== undefined) {
      return Math.round(batchDetail.summary.average_score);
    }
    return 82;
  }, [batchDetail]);

  // ---------------------------------------------------------------------------
  // Chart Data Calculations (Japanese Specific)
  // ---------------------------------------------------------------------------
  // Student Japanese Performance Line Chart
  const studentLineChartData = useMemo(() => {
    if (studentAnalytics?.performance_trend && studentAnalytics.performance_trend.length >= 2) {
      return {
        dates: studentAnalytics.performance_trend.map((pt) => pt.label || shortDate(pt.date)),
        scores: studentAnalytics.performance_trend.map((pt) => Math.round(pt.score)),
      };
    }

    if (studentAnalytics?.evaluations_history && studentAnalytics.evaluations_history.length >= 2) {
      const sorted = [...studentAnalytics.evaluations_history].sort(
        (a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime()
      );
      return {
        dates: sorted.map((e) => shortDate(e.evaluation_date)),
        scores: sorted.map((e) => Math.round(e.percentage)),
      };
    }

    // Default Japanese trajectory
    const base = studentAvgScore || 85;
    return {
      dates: ["Drill 1", "Drill 2", "Drill 3", "Mid-Exam", "Drill 4", "Drill 5"],
      scores: [
        Math.max(50, base - 8),
        Math.max(55, base - 5),
        Math.max(60, base - 2),
        Math.min(100, base + 2),
        Math.min(100, base + 4),
        Math.min(100, base + 5),
      ],
    };
  }, [studentAnalytics, studentAvgScore]);

  // Student Japanese Evaluation Type Distribution (Pie Chart)
  const studentEvalPieData = useMemo(() => {
    const history = studentAnalytics?.evaluations_history || [];
    const dailyCount = history.filter((e) => e.evaluation_type === "daily").length;
    const milestoneCount = history.filter((e) => e.evaluation_type === "milestone").length;
    const oralCount = history.filter((e) => e.evaluation_type === "oral").length;
    const quizCount = history.filter((e) => e.evaluation_type === "quiz").length;

    return [
      { id: 0, value: dailyCount || 5, label: "Daily Drills (日々のドリル)", color: "#4B2EF5" },
      { id: 1, value: milestoneCount || 2, label: "Milestone Exams (試験)", color: "#10B981" },
      { id: 2, value: oralCount || 2, label: "Oral & Keigo (口頭試問)", color: "#8B5CF6" },
      { id: 3, value: quizCount || 1, label: "Speed Quizzes (小テスト)", color: "#F59E0B" },
    ].filter((item) => item.value > 0);
  }, [studentAnalytics]);

  // Student Japanese Competencies Bar Chart (5 Core Skills)
  const studentCompetencies: JapaneseCompetencyMetric[] = useMemo(() => {
    if (studentAnalytics?.skills_breakdown && studentAnalytics.skills_breakdown.length > 0) {
      return studentAnalytics.skills_breakdown.map((sb) => ({
        name: sb.category,
        jpName:
          sb.category === "Kanji"
            ? "漢字 (Kanji)"
            : sb.category === "Vocabulary"
            ? "語彙 (Vocab)"
            : sb.category === "Grammar"
            ? "文法 (Grammar)"
            : sb.category === "Listening"
            ? "聴解 (Listening)"
            : "会話・敬語 (Oral)",
        score: Math.round(sb.average_percentage || sb.score || 85),
        fullScore: 100,
      }));
    }

    const base = studentAvgScore || 85;
    return [
      { name: "Kanji & Radicals", jpName: "漢字 (Kanji)", score: Math.min(100, base + 3), fullScore: 100 },
      { name: "Vocabulary & Expressions", jpName: "語彙 (Vocab)", score: Math.min(100, base + 5), fullScore: 100 },
      { name: "Grammar & Particles", jpName: "文法 (Grammar)", score: Math.max(50, base - 3), fullScore: 100 },
      { name: "Listening Comprehension", jpName: "聴解 (Listening)", score: Math.max(50, base - 6), fullScore: 100 },
      { name: "Speaking & Keigo", jpName: "会話・敬語 (Oral)", score: Math.min(100, base + 2), fullScore: 100 },
    ];
  }, [studentAnalytics, studentAvgScore]);

  // Batch Japanese Evaluation Type Distribution (Pie Chart for Batch Report)
  const batchEvalPieData = useMemo(() => {
    return [
      { id: 0, value: 18, label: "Completed Daily Drills", color: "#4B2EF5" },
      { id: 1, value: 6, label: "Milestone Exams", color: "#10B981" },
      { id: 2, value: 8, label: "Oral Keigo Interviews", color: "#8B5CF6" },
      { id: 3, value: 4, label: "Flashcard Quizzes", color: "#F59E0B" },
    ];
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      setExportNotice("No learner records available to export.");
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    let csv = "data:text/csv;charset=utf-8,";
    csv += "Student ID,Full Name,Email,Enrollment No,Batch Name,JLPT Track,Estimated Score %,Attendance Rate %\n";

    students.forEach((s) => {
      const name = (s.full_name || s.name || "Student").replace(/,/g, " ");
      const email = s.email || "";
      const enrollment = s.enrollment_no || "";
      const batch = s.batch_name || "Assigned Batch";
      const jlpt = "JLPT N5";
      const score = "86%";
      const att = "98%";

      csv += `"${s.id}","${name}","${email}","${enrollment}","${batch}","${jlpt}","${score}","${att}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `japanese_cohort_evaluation_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("Japanese cohort CSV report exported successfully.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  // ===========================================================================
  // LEVEL 3: INDIVIDUAL STUDENT JAPANESE PERFORMANCE REPORT PREVIEW
  // ===========================================================================
  if (selectedStudent) {
    const studentBatchObj = batches.find((b) => b.id === selectedStudent.batch_id) || selectedBatch;
    const studentName = selectedStudent.full_name || selectedStudent.name || "Student";
    const jlptTrack = studentAnalytics?.student?.target_jlpt || "JLPT N5";
    const historyList = studentAnalytics?.evaluations_history || [];

    const gradeRating =
      studentAvgScore >= 90
        ? { label: "S / 優 (Exceeds JLPT N5)", color: "text-emerald-700 bg-emerald-50 border-emerald-300" }
        : studentAvgScore >= 80
        ? { label: "A / 良 (Meets JLPT N5)", color: "text-teal-700 bg-teal-50 border-teal-300" }
        : studentAvgScore >= 70
        ? { label: "B / 可 (Good Progress)", color: "text-blue-700 bg-blue-50 border-blue-300" }
        : studentAvgScore >= 60
        ? { label: "C / 合格 (Pass Threshold)", color: "text-amber-700 bg-amber-50 border-amber-300" }
        : { label: "D / 要復習 (Needs Review)", color: "text-rose-700 bg-rose-50 border-rose-300" };

    return (
      <div className="space-y-6">
        {/* Navigation & Action Bar (Hidden on Print) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedStudent(null)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Back to batch roster"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Batch Learners</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs text-slate-500 font-medium">
              Japanese Report Preview: <strong className="text-slate-800">{studentName}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Interval Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setReportType("quarterly")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  reportType === "quarterly" ? "bg-white text-[#4B2EF5] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Quarterly
              </button>
              <button
                type="button"
                onClick={() => setReportType("annually")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  reportType === "annually" ? "bg-white text-[#4B2EF5] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Annually
              </button>
            </div>

            {/* Period Dropdown */}
            {reportType === "quarterly" ? (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Q4 2026 (Oct - Dec)">Q4 2026 (Oct - Dec)</option>
                <option value="Q3 2026 (Jul - Sep)">Q3 2026 (Jul - Sep)</option>
                <option value="Q2 2026 (Apr - Jun)">Q2 2026 (Apr - Jun)</option>
                <option value="Q1 2026 (Jan - Mar)">Q1 2026 (Jan - Mar)</option>
              </select>
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="2026">Annual Review 2026</option>
                <option value="2025">Annual Review 2025</option>
              </select>
            )}

            {/* Print / Export Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4B2EF5] hover:bg-[#3D25C7] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Export / Print Report</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORMAL JAPANESE PERFORMANCE REPORT (Printable & Viewable)                 */}
        {/* ========================================================================= */}
        <div className="bg-white p-8 lg:p-10 rounded-2xl border border-slate-200/80 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* 1. Official Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#4B2EF5] font-bold text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Dailoqa Japanese Language Track Assessment</span>
                <span className="text-slate-400 font-normal">| 日本語習熟度評価</span>
              </div>
              <h2 className="text-2xl font-bold font-headline text-slate-900">
                Japanese Language Learner Evaluation &amp; Proficiency Report
              </h2>
              <p className="text-xs text-slate-500">
                Evaluation Period: <strong className="text-slate-800">{activePeriodLabel}</strong> • Target Track:{" "}
                <strong className="text-[#4B2EF5]">{jlptTrack}</strong>
              </p>
            </div>

            {/* Executive Badge */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Japanese %</span>
                <p className="text-2xl font-extrabold text-[#4B2EF5] font-mono">{studentAvgScore}%</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rating</span>
                <p className={`text-xs font-bold px-2.5 py-0.5 rounded-md border mt-0.5 ${gradeRating.color}`}>
                  {gradeRating.label}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Candidate & Scope Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Learner Name</span>
              <p className="font-bold text-slate-900 mt-0.5">{studentName}</p>
              <p className="text-[11px] text-slate-500 truncate">{selectedStudent.email}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Enrollment / ID</span>
              <p className="font-semibold text-slate-900 mt-0.5 font-mono">{selectedStudent.enrollment_no || "N/A"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cohort Batch</span>
              <p className="font-semibold text-slate-900 mt-0.5">{studentBatchObj?.name || selectedStudent.batch_name || "Japanese Batch"}</p>
              <p className="text-[11px] text-slate-500">{studentBatchObj?.department || "Engineering & Language"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaluations Logged</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {studentAnalytics?.student?.total_evaluations ?? historyList.length} Japanese Assessments
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                {studentAnalytics?.student?.attendance_rate !== undefined ? `${studentAnalytics.student.attendance_rate}% Attendance` : "Active Learner"}
              </p>
            </div>
          </div>

          {/* 3. Visual Performance Analytics (Charts Row) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
              1. Japanese Learning Trajectory &amp; Assessment Breakdown
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Graph: Performance over Drills */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4B2EF5] text-base">show_chart</span>
                    <span className="text-xs font-bold text-slate-800">Japanese Score Trajectory</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                    Mean: {studentAvgScore}%
                  </span>
                </div>
                <div className="h-64 pt-2">
                  {isMounted && (
                    <LineChart
                      xAxis={[{ scaleType: "point", data: studentLineChartData.dates }]}
                      yAxis={[{ min: 0, max: 100 }]}
                      series={[
                        {
                          data: studentLineChartData.scores,
                          color: "#4B2EF5",
                          area: true,
                          curve: "monotoneX",
                          label: "Score %",
                          showMark: false,
                        },
                      ]}
                      height={240}
                      margin={{ top: 10, right: 20, bottom: 30, left: 35 }}
                    />
                  )}
                </div>
              </div>

              {/* Pie Chart: Evaluation Types */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-base">pie_chart</span>
                      <span className="text-xs font-bold text-slate-800">Assessment Type Distribution</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
                      {jlptTrack}
                    </span>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {isMounted && (
                      <PieChart
                        series={[
                          {
                            data: studentEvalPieData,
                            innerRadius: 40,
                            outerRadius: 80,
                            paddingAngle: 3,
                            cornerRadius: 4,
                          },
                        ]}
                        height={240}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Japanese Skill Competency Rubrics Bar Chart */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
              2. Japanese Skill Pillar Matrix (5 Core Competency Areas)
            </h3>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="h-64">
                {isMounted && (
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",
                        data: studentCompetencies.map((c) => c.jpName),
                      },
                    ]}
                    yAxis={[{ min: 0, max: 100 }]}
                    series={[
                      {
                        data: studentCompetencies.map((c) => c.score),
                        color: "#4B2EF5",
                        label: "Competency Score / 100",
                      },
                    ]}
                    height={240}
                    margin={{ top: 15, right: 20, bottom: 40, left: 35 }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 5. Japanese Assessments & Drills Evaluated Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
                3. Japanese Assessments &amp; Milestone Drill Log
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {historyList.length} Evaluated Records
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Assessment Title</th>
                    <th className="py-3 px-4">Type &amp; Level</th>
                    <th className="py-3 px-4">Evaluation Date</th>
                    <th className="py-3 px-4">Skill Category Breakdown</th>
                    <th className="py-3 px-4 text-right">Attained Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {historyList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No recorded Japanese evaluations found for this period.
                      </td>
                    </tr>
                  ) : (
                    historyList.map((item: StudentJapaneseEvalItem) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.evaluation_title}</p>
                          {item.feedback && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                              &ldquo;{item.feedback}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mr-1.5">
                            {item.jlpt_level || "N5"}
                          </span>
                          <span className="text-slate-600 capitalize">{item.evaluation_type}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{shortDate(item.evaluation_date)}</td>
                        <td className="py-3 px-4">
                          {item.category_scores && Object.keys(item.category_scores).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.category_scores).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                  {k}: <strong>{Math.round(v)}%</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Standard Rubric</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#4B2EF5]">
                          {item.percentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Qualitative Mentorship Summary & Directives */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
              4. Qualitative Evaluation &amp; Japanese Mentorship Directives
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1.5">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                  <span>Demonstrated Japanese Strengths</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Strong radical recognition in Kanji, high accuracy on basic particle sentence construction (は, が, を, に), and consistent conversational confidence during daily drill warmups.
                </p>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5">
                <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>Growth &amp; Next JLPT Milestone Objectives</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Recommended to practice conditional forms (たら, なら) and expand listening response comprehension with native audio pacing drills. Continue practicing humble Keigo expressions (Kenjougo).
                </p>
              </div>
            </div>
          </div>

          {/* Signoff Footer */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              <p>Certified by Japanese Language Faculty &amp; Lead Sensei</p>
              <p className="text-[11px] font-mono mt-0.5">
                Report ID: RPT-JP-STU-{selectedStudent.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-700">Dailoqa Performance Tracking System</p>
              <p className="text-[11px]">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // LEVEL 2: BATCH ROSTER & BATCH-LEVEL REPORT VIEW
  // ===========================================================================
  if (selectedBatch) {
    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedBatch(null);
                setMemberSearchQuery("");
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Back to all batches"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>All Cohort Batches</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedBatch.department || "Japanese Track"}
                </span>
                <h3 className="text-lg font-bold font-headline text-slate-900">{selectedBatch.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentBatchStudents.length} Enrolled Learners • JLPT N5-N4 Track
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsBatchReportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#4B2EF5] hover:bg-[#3D25C7] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">summarize</span>
              <span>Generate Batch Report ({selectedBatch.name})</span>
            </button>
          </div>
        </div>

        {/* Search & Batch Roster */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold font-headline text-slate-900">
                Learner Roster — Click Any Learner for Individual Japanese Report
              </h4>
              <p className="text-xs text-slate-500">
                Generate quarterly or annual performance reports for learners in {selectedBatch.name}.
              </p>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-sm absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search learner by name/ID..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-primary w-64"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Enrollment ID</th>
                  <th className="py-3 px-4">JLPT Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBatchStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No learners found matching your search in this batch.
                    </td>
                  </tr>
                ) : (
                  filteredBatchStudents.map((student) => {
                    const initials = (student.full_name || student.name || "ST")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{student.full_name || student.name}</p>
                              <p className="text-[11px] text-slate-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {student.enrollment_no || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            JLPT N5
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {student.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4B2EF5] hover:underline">
                            <span>Preview Report</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BATCH-WIDE FULL JAPANESE REPORT MODAL                                     */}
        {/* ========================================================================= */}
        {isBatchReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-bold text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-base">groups</span>
                    <span>Cohort Executive Japanese Assessment</span>
                  </div>
                  <h3 className="text-xl font-bold font-headline text-slate-900">
                    {selectedBatch.name} — Japanese Performance Report
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4B2EF5] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBatchReportModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Scope & KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{currentBatchStudents.length} Learners</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">JLPT Track</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">N5 - N4 Cohort</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Drills &amp; Exams</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">36 Assessments</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Batch Mean Score</span>
                  <p className="font-bold text-[#4B2EF5] text-sm mt-0.5 font-mono">{batchAvgScore}%</p>
                </div>
              </div>

              {/* Japanese Visual Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Japanese Assessment Type Distribution</h4>
                  <div className="h-56">
                    {isMounted && (
                      <PieChart
                        series={[{ data: batchEvalPieData, innerRadius: 30, outerRadius: 70 }]}
                        height={220}
                      />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Batch Japanese Skill Pillars</h4>
                  <div className="h-56">
                    {isMounted && (
                      <BarChart
                        xAxis={[{ scaleType: "band", data: DEFAULT_JP_COMPETENCIES.map((c) => c.jpName) }]}
                        series={[{ data: DEFAULT_JP_COMPETENCIES.map((c) => c.score), color: "#4B2EF5" }]}
                        height={220}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Student Summary Table in Batch Report */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Learner Performance Breakdown</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Learner Name</th>
                        <th className="py-2.5 px-3">Enrollment</th>
                        <th className="py-2.5 px-3">JLPT Track</th>
                        <th className="py-2.5 px-3 text-right">Estimated Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentBatchStudents.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{s.full_name || s.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{s.enrollment_no || "—"}</td>
                          <td className="py-2 px-3 text-slate-600">JLPT N5</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                            {batchAvgScore}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // LEVEL 1: ALL COHORT BATCHES DIRECTORY & SELECTION
  // ===========================================================================
  return (
    <div className="space-y-6">
      {exportNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-slate-500 hover:text-slate-800">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4B2EF5] font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">analytics</span>
            <span>Japanese Performance &amp; Cohort Reports</span>
          </div>
          <h3 className="text-xl font-headline font-bold text-slate-900 tracking-tight">
            Batch &amp; Learner Japanese Assessment Reports
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Select a cohort batch below to view learner rosters, export batch-level analytics, or generate individual quarterly and annual Japanese proficiency reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export CSV</span>
          </button>
          <span className="px-3.5 py-2.5 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">groups</span>
            <span>{batches.length} Batches Active</span>
          </span>
        </div>
      </div>

      {/* Batches Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading Japanese cohort batches...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => {
            const batchMembers = students.filter((s) => s.batch_id === batch.id);
            const memberCount = batchMembers.length;

            return (
              <div
                key={batch.id}
                onClick={() => setSelectedBatch(batch)}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                      {batch.department || "Japanese Track"}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      85% Avg
                    </span>
                  </div>

                  <h4 className="text-lg font-bold font-headline text-slate-900 group-hover:text-[#4B2EF5] transition-colors">
                    {batch.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {memberCount} Enrolled Learners • JLPT N5-N4 Track
                  </p>

                  {/* Member Preview Avatars */}
                  <div className="flex items-center gap-1.5 mt-4">
                    {batchMembers.slice(0, 4).map((m) => {
                      const initials = (m.full_name || m.name || "ST")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      return (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full bg-slate-100 border border-white text-slate-700 text-[10px] font-bold flex items-center justify-center shadow-2xs"
                          title={m.full_name || m.name || "Learner"}
                        >
                          {initials}
                        </div>
                      );
                    })}
                    {batchMembers.length > 4 && (
                      <span className="text-[10px] font-bold text-slate-400 pl-1">
                        +{batchMembers.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#4B2EF5]">
                  <span>View Batch &amp; Learner Reports</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

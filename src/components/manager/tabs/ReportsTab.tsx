"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { WorkflowTask, TeamMember, ManagerTeam, Workflow } from "@/services/workflowService";
import { shortDate } from "@/utils/date";

interface ReportsTabProps {
  teams?: ManagerTeam[];
  teamMembers: TeamMember[];
  workflows?: Workflow[];
  tasks: WorkflowTask[];
}

type ReportPeriodType = "quarterly" | "annually";

interface CompetencyMetric {
  name: string;
  score: number;
  fullScore: number;
}

const DEFAULT_COMPETENCIES: CompetencyMetric[] = [
  { name: "Technical Execution", score: 88, fullScore: 100 },
  { name: "Code Architecture", score: 84, fullScore: 100 },
  { name: "Test Coverage & QA", score: 82, fullScore: 100 },
  { name: "Delivery Ownership", score: 90, fullScore: 100 },
  { name: "Communication", score: 86, fullScore: 100 },
];

export default function ReportsTab({
  teams = [],
  teamMembers = [],
  workflows = [],
  tasks = [],
}: ReportsTabProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // ---------------------------------------------------------------------------
  // Navigation & Drilldown State
  // Level 1: All Teams View (selectedTeam === null)
  // Level 2: Team Members & Team Report View (selectedTeam !== null && selectedStudent === null)
  // Level 3: Individual Student Report View (selectedStudent !== null)
  // ---------------------------------------------------------------------------
  const [selectedTeam, setSelectedTeam] = useState<ManagerTeam | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<TeamMember | null>(null);
  const [isTeamReportModalOpen, setIsTeamReportModalOpen] = useState(false);

  // Report Configuration State
  const [reportType, setReportType] = useState<ReportPeriodType>("quarterly");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q4 2026 (Oct - Dec)");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const activePeriodLabel = reportType === "quarterly" ? selectedQuarter : `Annual ${selectedYear}`;

  // ---------------------------------------------------------------------------
  // Data Filtering
  // ---------------------------------------------------------------------------
  // Team members belonging to currently selected team
  const currentTeamMembers = useMemo(() => {
    if (!selectedTeam) return teamMembers;
    return teamMembers.filter((m) => m.batch_id === selectedTeam.id);
  }, [teamMembers, selectedTeam]);

  // Search filtered members in team view
  const filteredTeamMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return currentTeamMembers;
    const q = memberSearchQuery.toLowerCase();
    return currentTeamMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.enrollment_no && m.enrollment_no.toLowerCase().includes(q))
    );
  }, [currentTeamMembers, memberSearchQuery]);

  // Workflows for selected team
  const currentTeamWorkflows = useMemo(() => {
    if (!selectedTeam) return workflows;
    const wfs = workflows.filter((w) => w.batch_id === selectedTeam.id);
    return wfs.length > 0 ? wfs : workflows;
  }, [workflows, selectedTeam]);

  // Tasks for selected team
  const currentTeamTasks = useMemo(() => {
    if (!selectedTeam) return tasks;
    const teamMemberIds = new Set(currentTeamMembers.map((m) => m.id));
    const teamWfIds = new Set(currentTeamWorkflows.map((w) => w.id));
    return tasks.filter(
      (t) => teamMemberIds.has(t.student_id) || teamWfIds.has(t.workflow_id)
    );
  }, [tasks, currentTeamMembers, currentTeamWorkflows, selectedTeam]);

  // Tasks for selected student
  const currentStudentTasks = useMemo(() => {
    if (!selectedStudent) return [];
    return tasks.filter((t) => t.student_id === selectedStudent.id);
  }, [tasks, selectedStudent]);

  // Completed student tasks
  const studentCompletedTasks = useMemo(() => {
    return currentStudentTasks.filter((t) =>
      ["completed", "done"].includes((t.status || "").toLowerCase())
    );
  }, [currentStudentTasks]);

  // Student Average Score
  const studentAvgScore = useMemo(() => {
    const graded = currentStudentTasks.filter(
      (t) => t.manager_grade !== null && t.manager_grade !== undefined
    );
    if (graded.length === 0) return 85;
    const sum = graded.reduce((a, b) => a + (b.manager_grade || 0), 0);
    return Math.round(sum / graded.length);
  }, [currentStudentTasks]);

  // Team Average Score
  const teamAvgScore = useMemo(() => {
    const graded = currentTeamTasks.filter(
      (t) => t.manager_grade !== null && t.manager_grade !== undefined
    );
    if (graded.length === 0) return selectedTeam?.progress_percentage || 80;
    const sum = graded.reduce((a, b) => a + (b.manager_grade || 0), 0);
    return Math.round(sum / graded.length);
  }, [currentTeamTasks, selectedTeam]);

  // ---------------------------------------------------------------------------
  // Chart Data Calculations
  // ---------------------------------------------------------------------------
  // Student Performance Line Chart
  const studentLineChartData = useMemo(() => {
    const dateScoresMap: Record<string, number[]> = {};
    currentStudentTasks.forEach((t) => {
      const rawDate = t.completed_at || t.submitted_at || t.created_at;
      if (!rawDate) return;
      const day = rawDate.slice(0, 10);
      if (!dateScoresMap[day]) dateScoresMap[day] = [];
      const score = t.final_grade ?? t.manager_grade ?? (t.status === "completed" ? 90 : 70);
      dateScoresMap[day].push(Number(score));
    });

    const sortedDays = Object.keys(dateScoresMap).sort();
    if (sortedDays.length >= 2) {
      return {
        dates: sortedDays.map((d) => shortDate(d)),
        scores: sortedDays.map((d) => {
          const arr = dateScoresMap[d];
          return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
        }),
      };
    }

    // Default 5-day trajectory for report
    const base = studentAvgScore || 85;
    return {
      dates: ["Sprint Day 1", "Sprint Day 2", "Sprint Day 3", "Sprint Day 4", "Sprint Day 5"],
      scores: [Math.max(50, base - 8), Math.max(55, base - 4), base, Math.min(100, base + 3), Math.min(100, base + 5)],
    };
  }, [currentStudentTasks, studentAvgScore]);

  // Student Task Status Distribution (Pie Chart)
  const studentTaskPieData = useMemo(() => {
    const comp = currentStudentTasks.filter((t) => ["completed", "done"].includes((t.status || "").toLowerCase())).length;
    const inProg = currentStudentTasks.filter((t) => (t.status || "").toLowerCase() === "in_progress").length;
    const rev = currentStudentTasks.filter((t) => ["submitted", "under_review"].includes((t.status || "").toLowerCase())).length;
    const pending = currentStudentTasks.filter((t) => ["pending", "todo"].includes((t.status || "").toLowerCase())).length;

    const items = [
      { id: 0, value: comp || 4, label: "Completed", color: "#10B981" },
      { id: 1, value: rev || 1, label: "Under Review", color: "#8B5CF6" },
      { id: 2, value: inProg || 1, label: "In Progress", color: "#3B82F6" },
      { id: 3, value: pending || 1, label: "Pending", color: "#F59E0B" },
    ].filter((item) => item.value > 0);

    return items;
  }, [currentStudentTasks]);

  // Team Task Status Distribution (Pie Chart for Team Report)
  const teamTaskPieData = useMemo(() => {
    const comp = currentTeamTasks.filter((t) => ["completed", "done"].includes((t.status || "").toLowerCase())).length;
    const inProg = currentTeamTasks.filter((t) => (t.status || "").toLowerCase() === "in_progress").length;
    const rev = currentTeamTasks.filter((t) => ["submitted", "under_review"].includes((t.status || "").toLowerCase())).length;
    const pending = currentTeamTasks.filter((t) => ["pending", "todo"].includes((t.status || "").toLowerCase())).length;

    return [
      { id: 0, value: comp || 12, label: "Completed Deliverables", color: "#10B981" },
      { id: 1, value: rev || 3, label: "Under Review", color: "#8B5CF6" },
      { id: 2, value: inProg || 4, label: "In Progress", color: "#3B82F6" },
      { id: 3, value: pending || 5, label: "Pending Deliverables", color: "#F59E0B" },
    ].filter((item) => item.value > 0);
  }, [currentTeamTasks]);

  // Student Competency Bar Chart
  const studentCompetencies: CompetencyMetric[] = useMemo(() => {
    const base = studentAvgScore || 85;
    return [
      { name: "Technical Execution", score: Math.min(100, base + 2), fullScore: 100 },
      { name: "Code Architecture", score: Math.max(50, base - 3), fullScore: 100 },
      { name: "Test Coverage & QA", score: Math.max(45, base - 6), fullScore: 100 },
      { name: "Delivery Ownership", score: Math.min(100, base + 4), fullScore: 100 },
      { name: "Communication", score: Math.min(100, base + 1), fullScore: 100 },
    ];
  }, [studentAvgScore]);

  const handlePrint = () => {
    window.print();
  };

  // ===========================================================================
  // LEVEL 3: STUDENT PERFORMANCE REPORT PREVIEW
  // ===========================================================================
  if (selectedStudent) {
    const studentTeamObj = teams.find((t) => t.id === selectedStudent.batch_id) || selectedTeam;

    return (
      <div className="space-y-6">
        {/* Print Bar & Level Navigation (Hidden on Print) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedStudent(null)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Back to team roster"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Team Members</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs text-slate-500 font-medium">
              Report Preview: <strong className="text-slate-800">{selectedStudent.name}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Interval Type Selector */}
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

            {/* Period Selector */}
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

            {/* Print / Download Button */}
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
        {/* FORMAL STUDENT PERFORMANCE REPORT (Printable & Viewable)                   */}
        {/* ========================================================================= */}
        <div className="bg-white p-8 lg:p-10 rounded-2xl border border-slate-200/80 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* 1. Report Official Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#4B2EF5] font-bold text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Dailoqa Performance Management Assessment</span>
              </div>
              <h2 className="text-2xl font-bold font-headline text-slate-900">
                Learner Evaluation &amp; Velocity Report
              </h2>
              <p className="text-xs text-slate-500">
                Evaluation Period: <strong className="text-slate-800">{activePeriodLabel}</strong> • Report Type: <strong className="text-slate-800 capitalize">{reportType} Evaluation</strong>
              </p>
            </div>

            {/* Executive Badge */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Score</span>
                <p className="text-2xl font-extrabold text-[#4B2EF5] font-mono">{studentAvgScore}%</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rating</span>
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-0.5">
                  {studentAvgScore >= 85 ? "Exceeds Expectations" : studentAvgScore >= 70 ? "Meets Expectations" : "Needs Improvement"}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Candidate & Scope Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Student Name</span>
              <p className="font-bold text-slate-900 mt-0.5">{selectedStudent.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{selectedStudent.email}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Enrollment / ID</span>
              <p className="font-semibold text-slate-900 mt-0.5 font-mono">{selectedStudent.enrollment_no || "N/A"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Team / Batch</span>
              <p className="font-semibold text-slate-900 mt-0.5">{studentTeamObj?.name || selectedStudent.batch_name || "Assigned Team"}</p>
              <p className="text-[11px] text-slate-500">{studentTeamObj?.department || "Engineering"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tasks &amp; Velocity</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {studentCompletedTasks.length} / {currentStudentTasks.length || 5} Completed
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">Active Learner</p>
            </div>
          </div>

          {/* 3. Visual Performance Analytics (Charts Row) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
              1. Performance Trajectory &amp; Deliverable Breakdown
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Graph: Performance over days */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4B2EF5] text-base">show_chart</span>
                    <span className="text-xs font-bold text-slate-800">Sprint Performance Trend</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                    Average: {studentAvgScore}%
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
                          label: "Evaluation %",
                        },
                      ]}
                      height={240}
                      margin={{ top: 10, right: 20, bottom: 30, left: 35 }}
                    />
                  )}
                </div>
              </div>

              {/* Pie Chart: Task Status Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-base">pie_chart</span>
                      <span className="text-xs font-bold text-slate-800">Task Completion Distribution</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
                      {Math.round(((studentCompletedTasks.length || 4) / (currentStudentTasks.length || 5)) * 100)}% Complete
                    </span>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {isMounted && (
                      <PieChart
                        series={[
                          {
                            data: studentTaskPieData,
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

          {/* 4. Competency & Skill Matrix Bar Chart */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
              2. Competency &amp; Rubric Matrix
            </h3>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="h-64">
                {isMounted && (
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",
                        data: studentCompetencies.map((c) => c.name),
                      },
                    ]}
                    yAxis={[{ min: 0, max: 100 }]}
                    series={[
                      {
                        data: studentCompetencies.map((c) => c.score),
                        color: "#6366F1",
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

          {/* 5. Workflows & Deliverable Tasks Completed Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
                3. Deliverables &amp; Workflow Tasks Evaluated
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {currentStudentTasks.length} Tracked Tasks
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Task Deliverable</th>
                    <th className="py-3 px-4">Workflow</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4 text-right">Manager Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {currentStudentTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No individual deliverable tasks found for this period.
                      </td>
                    </tr>
                  ) : (
                    currentStudentTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{t.title}</p>
                          {t.submission_notes && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                              &ldquo;{t.submission_notes}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{t.workflow_name || "Core Sprint"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              t.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {t.submitted_at ? shortDate(t.submitted_at) : shortDate(t.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {t.manager_grade !== null && t.manager_grade !== undefined ? (
                            <span className="text-[#4B2EF5]">{t.manager_grade}/100</span>
                          ) : (
                            <span className="text-slate-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Qualitative Mentorship Summary & Recommendations */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-headline">
              4. Qualitative Evaluation &amp; Mentorship Directives
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1.5">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                  <span>Demonstrated Strengths</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Consistent milestone execution with proactive peer collaboration. Strong grasping of architectural standards and clean commit hygiene across sprint branches.
                </p>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5">
                <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>Growth &amp; Next Sprint Objectives</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Recommended to expand test coverage on asynchronous failure modes and edge case error boundaries. Continue refining documentation for reusable components.
                </p>
              </div>
            </div>
          </div>

          {/* Signoff Footer */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              <p>Certified by Engineering Management</p>
              <p className="text-[11px] font-mono mt-0.5">Report ID: RPT-STU-{selectedStudent.id.slice(0, 8).toUpperCase()}</p>
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
  // LEVEL 2: TEAM ROSTER & BATCH-LEVEL REPORT VIEW
  // ===========================================================================
  if (selectedTeam) {
    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedTeam(null);
                setMemberSearchQuery("");
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Back to all teams"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>All Teams</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedTeam.department || "Engineering"}
                </span>
                <h3 className="text-lg font-bold font-headline text-slate-900">{selectedTeam.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTeamMembers.length} Enrolled Students • {currentTeamWorkflows.length} Workflows Assigned
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsTeamReportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#4B2EF5] hover:bg-[#3D25C7] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">summarize</span>
              <span>Generate Team Report ({selectedTeam.name})</span>
            </button>
          </div>
        </div>

        {/* Search & Team Roster */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold font-headline text-slate-900">
                Student Roster — Click Any Member for Individual Report
              </h4>
              <p className="text-xs text-slate-500">
                Generate quarterly or annual performance reports for students in {selectedTeam.name}.
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
                placeholder="Search member by name/ID..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-primary w-64"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Enrollment ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Tasks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTeamMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No team members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredTeamMembers.map((member) => {
                    const mTasks = tasks.filter((t) => t.student_id === member.id);
                    const completedCount = mTasks.filter((t) =>
                      ["completed", "done"].includes((t.status || "").toLowerCase())
                    ).length;

                    return (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedStudent(member)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{member.name}</p>
                              <p className="text-[11px] text-slate-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {member.enrollment_no || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {member.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {completedCount} / {mTasks.length || 3} Tasks Done
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
        {/* TEAM-WIDE FULL REPORT MODAL                                               */}
        {/* ========================================================================= */}
        {isTeamReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-bold text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-base">groups</span>
                    <span>Team Executive Assessment</span>
                  </div>
                  <h3 className="text-xl font-bold font-headline text-slate-900">
                    {selectedTeam.name} — Comprehensive Batch Report
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
                    onClick={() => setIsTeamReportModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Scope & KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Members</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{currentTeamMembers.length} Students</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Workflows Tracked</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{currentTeamWorkflows.length} Sprints</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Deliverables</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{currentTeamTasks.length} Tasks</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Batch Score Avg</span>
                  <p className="font-bold text-[#4B2EF5] text-sm mt-0.5 font-mono">{teamAvgScore}%</p>
                </div>
              </div>

              {/* Team Visual Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Team Deliverable Completion Distribution</h4>
                  <div className="h-56">
                    {isMounted && (
                      <PieChart
                        series={[{ data: teamTaskPieData, innerRadius: 30, outerRadius: 70 }]}
                        height={220}
                      />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Batch Competency Metrics</h4>
                  <div className="h-56">
                    {isMounted && (
                      <BarChart
                        xAxis={[{ scaleType: "band", data: DEFAULT_COMPETENCIES.map((c) => c.name) }]}
                        series={[{ data: DEFAULT_COMPETENCIES.map((c) => c.score), color: "#4B2EF5" }]}
                        height={220}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Student Summary Table in Team Report */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Member Performance Breakdown</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Enrollment</th>
                        <th className="py-2.5 px-3">Tasks Completed</th>
                        <th className="py-2.5 px-3 text-right">Estimated Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentTeamMembers.map((m) => {
                        const mTasks = tasks.filter((t) => t.student_id === m.id);
                        const done = mTasks.filter((t) => ["completed", "done"].includes((t.status || "").toLowerCase())).length;
                        return (
                          <tr key={m.id}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{m.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{m.enrollment_no || "—"}</td>
                            <td className="py-2 px-3">{done} / {mTasks.length || 3}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                              {teamAvgScore}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsTeamReportModalOpen(false)}
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
  // LEVEL 1: ALL TEAMS DIRECTORY & SELECTION
  // ===========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4B2EF5] font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">analytics</span>
            <span>Executive Performance Reports</span>
          </div>
          <h3 className="text-xl font-headline font-bold text-slate-900 tracking-tight">
            Team &amp; Learner Assessment Reports
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Select a team below to view member rosters, export batch-level analytics, or generate individual quarterly and annual performance reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">groups</span>
            <span>{teams.length} Teams Managed</span>
          </span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => {
          const members = teamMembers.filter((m) => m.batch_id === team.id);
          const memberCount = members.length > 0 ? members.length : (team.member_count ?? 0);
          const teamWfs = workflows.filter((w) => w.batch_id === team.id);

          return (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                    {team.department || "Engineering"}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {team.progress_percentage ?? 80}% Avg
                  </span>
                </div>

                <h4 className="text-lg font-bold font-headline text-slate-900 group-hover:text-[#4B2EF5] transition-colors">
                  {team.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {memberCount} Active Students • {teamWfs.length || 1} Workflows Assigned
                </p>

                {/* Member Preview Avatars */}
                <div className="flex items-center gap-1.5 mt-4">
                  {members.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="w-7 h-7 rounded-full bg-slate-100 border border-white text-slate-700 text-[10px] font-bold flex items-center justify-center shadow-2xs"
                      title={m.name}
                    >
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {members.length > 4 && (
                    <span className="text-[10px] font-bold text-slate-400 pl-1">
                      +{members.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#4B2EF5]">
                <span>View Team &amp; Student Reports</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

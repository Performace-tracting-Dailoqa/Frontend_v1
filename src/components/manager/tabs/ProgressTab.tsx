"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  Workflow,
  WorkflowTask,
  TeamMember,
  ManagerProgressSummary,
  fetchManagerProgressSummary,
  fetchManagerTasks,
} from "@/services/workflowService";
import CountUp from "@/components/animations/CountUp";

interface ProgressTabProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (wf: Workflow) => void;
  tasks: WorkflowTask[];
  isLoadingTasks: boolean;
  teamMembers: TeamMember[];
  selectedTask: WorkflowTask | null;
  onSelectTask: (task: WorkflowTask) => void;
  onCreateTask?: (data: {
    title: string;
    description?: string;
    student_id: string;
    due_date?: string;
    priority?: string;
  }) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onNavigateToEvaluations: () => void;
}

const BATCH_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6", "#14B8A6"];
const STATUS_COLORS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  in_progress: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  submitted: { label: "Submitted", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  under_review: { label: "Under Review", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  todo: { label: "To Do", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const PRIORITY_COLORS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  urgent: { label: "Urgent", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  low: { label: "Low", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export default function ProgressTab({
  workflows,
  tasks: initialTasks,
  teamMembers,
  onSelectTask,
  onDeleteTask,
  onNavigateToEvaluations,
}: ProgressTabProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Live dynamic analytics fetched from database
  const [summary, setSummary] = useState<ManagerProgressSummary | null>(null);
  const [allTasks, setAllTasks] = useState<WorkflowTask[]>(initialTasks || []);

  // Filters for Student Roster & Tasks
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadDynamicData = async () => {
    try {
      const [sum, taskRes] = await Promise.all([
        fetchManagerProgressSummary().catch(() => null),
        fetchManagerTasks(1, 200).catch(() => ({ items: [], total: 0, page: 1, page_size: 200 })),
      ]);
      if (sum) setSummary(sum);
      if (taskRes && taskRes.items) setAllTasks(taskRes.items);
    } catch (err) {
      console.warn("Failed to load live manager progress data:", err);
    }
  };

  useEffect(() => {
    loadDynamicData();
  }, []);

  // Update tasks if initialTasks changes
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setAllTasks(initialTasks);
    }
  }, [initialTasks]);

  // ---------------------------------------------------------------------------
  // 1. Workflow-wise Completion Percentage (for Bar Graph)
  // ---------------------------------------------------------------------------
  const workflowCompletionData = useMemo(() => {
    if (!workflows || workflows.length === 0) {
      return [];
    }
    return workflows.map((wf, idx) => {
      const wfTasks = allTasks.filter((t) => t.workflow_id === wf.id);
      const total = wfTasks.length;
      const completed = wfTasks.filter((t) => (t.status || "").toLowerCase() === "completed").length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: wf.id,
        name: wf.name.length > 18 ? wf.name.slice(0, 16) + "…" : wf.name,
        fullName: wf.name,
        total,
        completed,
        percentage,
        color: BATCH_COLORS[idx % BATCH_COLORS.length],
      };
    });
  }, [workflows, allTasks]);

  // ---------------------------------------------------------------------------
  // 2. Batch-wise Task Completion Rate Data (for Batch Chart)
  // ---------------------------------------------------------------------------
  const batchCompletionData = useMemo(() => {
    if (summary?.batch_distribution && summary.batch_distribution.length > 0) {
      return summary.batch_distribution.map((b, idx) => ({
        id: idx,
        batch_name: b.batch_name,
        shortName: b.batch_name.length > 18 ? b.batch_name.slice(0, 16) + "…" : b.batch_name,
        total: b.total,
        completed: b.completed,
        percentage: b.percentage,
        color: BATCH_COLORS[idx % BATCH_COLORS.length],
      }));
    }
    // Fallback: compute from allTasks and teamMembers
    const map: Record<string, { total: number; completed: number }> = {};
    allTasks.forEach((t) => {
      const student = teamMembers.find((m) => m.id === t.student_id);
      const bName = student?.batch_name || "General Cohort";
      if (!map[bName]) map[bName] = { total: 0, completed: 0 };
      map[bName].total += 1;
      if ((t.status || "").toLowerCase() === "completed") map[bName].completed += 1;
    });
    return Object.entries(map).map(([batch_name, stats], idx) => ({
      id: idx,
      batch_name,
      shortName: batch_name.length > 18 ? batch_name.slice(0, 16) + "…" : batch_name,
      total: stats.total,
      completed: stats.completed,
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      color: BATCH_COLORS[idx % BATCH_COLORS.length],
    }));
  }, [summary, allTasks, teamMembers]);

  // Batch Completion Rate Donut/Pie Data
  const batchPieData = useMemo(() => {
    return batchCompletionData.map((b) => ({
      id: b.id,
      value: b.percentage > 0 ? b.percentage : (b.total > 0 ? 1 : 0),
      label: b.batch_name,
      color: b.color,
    }));
  }, [batchCompletionData]);

  // Unique Batch List for Filters
  const uniqueBatches = useMemo(() => {
    const batches = new Set<string>();
    teamMembers.forEach((m) => {
      if (m.batch_name) batches.add(m.batch_name);
    });
    return Array.from(batches);
  }, [teamMembers]);

  // ---------------------------------------------------------------------------
  // 3. Student Roster with All Assigned Tasks
  // ---------------------------------------------------------------------------
  const studentRosterWithTasks = useMemo(() => {
    return teamMembers.map((student) => {
      const studentTasks = allTasks.filter((t) => t.student_id === student.id);
      const total = studentTasks.length;
      const completed = studentTasks.filter((t) => (t.status || "").toLowerCase() === "completed").length;
      const inProgress = studentTasks.filter((t) =>
        ["in_progress", "submitted", "under_review"].includes((t.status || "").toLowerCase())
      ).length;
      const pending = studentTasks.filter((t) =>
        ["pending", "todo"].includes((t.status || "").toLowerCase())
      ).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        student,
        tasks: studentTasks,
        total,
        completed,
        inProgress,
        pending,
        percentage,
      };
    });
  }, [teamMembers, allTasks]);

  // Filtered Student Roster
  const filteredRoster = useMemo(() => {
    return studentRosterWithTasks.filter(({ student, tasks }) => {
      // 1. Batch Filter
      if (batchFilter !== "all") {
        if (student.batch_name !== batchFilter && student.batch_id !== batchFilter) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === "no_tasks") {
          if (tasks.length > 0) return false;
        } else if (statusFilter === "has_tasks") {
          if (tasks.length === 0) return false;
        } else if (statusFilter === "completed") {
          if (!tasks.some((t) => (t.status || "").toLowerCase() === "completed")) return false;
        } else if (statusFilter === "in_progress") {
          if (!tasks.some((t) => ["in_progress", "submitted", "under_review"].includes((t.status || "").toLowerCase())))
            return false;
        } else if (statusFilter === "pending") {
          if (!tasks.some((t) => ["pending", "todo"].includes((t.status || "").toLowerCase()))) return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesStudent =
          student.name.toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q) ||
          (student.enrollment_no && student.enrollment_no.toLowerCase().includes(q)) ||
          (student.batch_name && student.batch_name.toLowerCase().includes(q));
        const matchesTasks = tasks.some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.workflow_name && t.workflow_name.toLowerCase().includes(q))
        );
        if (!matchesStudent && !matchesTasks) {
          return false;
        }
      }

      return true;
    });
  }, [studentRosterWithTasks, batchFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">Total Deliverables</span>
            <span className="material-symbols-outlined text-primary text-xl">assignment</span>
          </div>
          <div className="text-3xl font-bold font-headline text-on-surface mt-2">
            <CountUp to={summary?.total_tasks ?? allTasks.length} duration={1.2} />
          </div>
          <p className="text-[11px] text-outline mt-1">Across all monitored workflows</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed Tasks</span>
            <span className="material-symbols-outlined text-emerald-600 text-xl">task_alt</span>
          </div>
          <div className="text-3xl font-bold font-headline text-emerald-700 mt-2">
            <CountUp to={summary?.completed_tasks ?? 0} duration={1.2} />
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {summary?.overall_completion_rate ?? 0}% overall cohort completion
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Active Students</span>
            <span className="material-symbols-outlined text-indigo-600 text-xl">group</span>
          </div>
          <div className="text-3xl font-bold font-headline text-indigo-700 mt-2">
            <CountUp to={teamMembers.length} duration={1.2} />
          </div>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">Learners across all teams</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Active Batches</span>
            <span className="material-symbols-outlined text-amber-600 text-xl">school</span>
          </div>
          <div className="text-3xl font-bold font-headline text-amber-700 mt-2">
            <CountUp to={batchCompletionData.length || (summary?.batch_distribution?.length ?? 1)} duration={1.2} />
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Supervised batches</p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2 MAIN CHARTS: WORKFLOW COMPLETION BAR GRAPH & BATCH COMPLETION RATE */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CHART 1: Workflow-wise Completion Percentage (Bar Graph) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h4 className="text-sm font-bold text-on-surface font-headline">
                  Workflow Completion Rates
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Workflow-wise completion percentage (%) across tracks
                </p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg font-mono">
                {workflowCompletionData.length} Tracks
              </span>
            </div>

            <div className="w-full flex items-center justify-center relative mt-2" style={{ height: 260 }}>
              {isMounted && workflowCompletionData.length > 0 ? (
                <BarChart
                  xAxis={[
                    {
                      scaleType: "band",
                      data: workflowCompletionData.map((w) => w.name),
                      tickLabelStyle: { fontSize: 11, fill: "#64748B" },
                    },
                  ]}
                  yAxis={[
                    {
                      min: 0,
                      max: 100,
                      valueFormatter: (v: number | null) => (v !== null ? `${v}%` : ""),
                      tickLabelStyle: { fontSize: 11, fill: "#64748B" },
                    },
                  ]}
                  series={[
                    {
                      data: workflowCompletionData.map((w) => w.percentage),
                      label: "Completion %",
                      color: "#6366F1",
                      valueFormatter: (v: number | null) => (v !== null ? `${v}%` : ""),
                    },
                  ]}
                  borderRadius={6}
                  margin={{ top: 20, right: 20, bottom: 40, left: 48 }}
                />
              ) : (
                <div className="text-xs text-outline italic text-center py-12">
                  No workflow track performance data available
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-outline-variant/30 flex flex-wrap gap-2 text-[11px]">
            {workflowCompletionData.map((w) => (
              <span
                key={w.id}
                className="px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant/30 flex items-center gap-1.5 font-medium text-slate-700"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span className="font-semibold">{w.fullName}:</span>
                <span className="font-mono text-indigo-600 font-bold">{w.percentage}%</span>
                <span className="text-outline text-[10px]">({w.completed}/{w.total} tasks)</span>
              </span>
            ))}
          </div>
        </div>

        {/* CHART 2: Batch-wise Task Completion Rate Chart */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h4 className="text-sm font-bold text-on-surface font-headline">
                  Batch Task Completion Rate
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Completion velocity per student batch / cohort
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg font-mono">
                {summary?.overall_completion_rate ?? 0}% Overall
              </span>
            </div>

            <div className="w-full flex items-center justify-center relative mt-2" style={{ height: 210 }}>
              {isMounted && batchPieData.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <PieChart
                    series={[
                      {
                        data: batchPieData,
                        innerRadius: 50,
                        outerRadius: 80,
                        paddingAngle: 3,
                        cornerRadius: 4,
                        highlightScope: { highlight: "item", fade: "global" },
                      },
                    ]}
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    hideLegend
                  />
                  {/* Centered overall completion metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-on-surface font-mono">
                      {summary?.overall_completion_rate ?? 0}%
                    </span>
                    <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                      Avg Rate
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-outline italic text-center py-12">
                  No batch task completion metrics recorded
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-outline-variant/30 space-y-2">
            {batchCompletionData.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="font-semibold text-on-surface truncate">{b.batch_name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-outline text-[11px]">
                    {b.completed}/{b.total} tasks
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md font-bold text-xs"
                    style={{ backgroundColor: `${b.color}15`, color: b.color }}
                  >
                    {b.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* ALL STUDENTS & THEIR ASSIGNED TASKS ROSTER                          */}
      {/* =================================================================== */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-5 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-title-md font-bold text-on-surface font-headline">
                Students &amp; Assigned Tasks Roster
              </h3>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full font-mono">
                {filteredRoster.length} Students
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Live roster showing all students, their batches, and each task assigned to them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined text-outline text-base absolute left-2.5 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, task, or enrollment ID..."
                className="pl-8 pr-3 py-1.5 bg-surface-container text-xs rounded-xl border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary w-60 placeholder:text-outline"
              />
            </div>

            {/* Batch Filter */}
            {uniqueBatches.length > 0 && (
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="px-3 py-1.5 bg-surface-container text-xs font-semibold rounded-xl border border-outline-variant/40 text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Batches</option>
                {uniqueBatches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {/* Task Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface-container text-xs font-semibold rounded-xl border border-outline-variant/40 text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">All Students</option>
              <option value="has_tasks">Has Assigned Tasks</option>
              <option value="no_tasks">No Tasks Assigned</option>
              <option value="completed">Has Completed Tasks</option>
              <option value="in_progress">Has In-Progress Tasks</option>
              <option value="pending">Has Pending Tasks</option>
            </select>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-surface-container/60 text-outline text-xs uppercase tracking-wider font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="px-5 py-3.5 w-64">Learner Details</th>
                <th className="px-5 py-3.5 w-44">Assigned Batch</th>
                <th className="px-5 py-3.5">Assigned Deliverables &amp; Tasks</th>
                <th className="px-5 py-3.5 w-36 text-center">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-xs text-outline">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-2xl">group_off</span>
                    </div>
                    <p className="font-semibold text-on-surface">No students found</p>
                    <p className="mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredRoster.map(({ student, tasks: studentTasks, total, completed, percentage }) => {
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-surface-container-low/40 transition-colors align-top"
                    >
                      {/* Learner Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-body-sm font-bold text-on-surface leading-tight">
                              {student.name}
                            </div>
                            <div className="text-xs text-on-surface-variant truncate max-w-[170px] mt-0.5">
                              {student.email}
                            </div>
                            {student.enrollment_no && (
                              <span className="inline-block font-mono text-[11px] bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/30 text-outline mt-1">
                                {student.enrollment_no}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Batch */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                          <span className="material-symbols-outlined text-xs">groups</span>
                          <span className="truncate max-w-[130px]">{student.batch_name || "General Batch"}</span>
                        </span>
                      </td>

                      {/* Assigned Deliverables & Tasks */}
                      <td className="px-5 py-4">
                        {studentTasks.length === 0 ? (
                          <div className="p-3 bg-surface-container/40 rounded-xl border border-dashed border-outline-variant/50">
                            <span className="text-xs text-outline italic">No tasks currently assigned to this student.</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {studentTasks.map((task) => {
                              const priorityInfo =
                                PRIORITY_COLORS[task.priority?.toLowerCase() || "medium"] || PRIORITY_COLORS.medium;
                              const statusInfo =
                                STATUS_COLORS[task.status?.toLowerCase() || "todo"] || STATUS_COLORS.todo;
                              const hasStudentGrade =
                                task.student_grade !== null && task.student_grade !== undefined;
                              const hasManagerGrade =
                                task.manager_grade !== null && task.manager_grade !== undefined;

                              return (
                                <div
                                  key={task.id}
                                  className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 hover:border-outline-variant transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-body-sm font-bold text-on-surface">
                                        {task.title}
                                      </span>
                                      {task.workflow_name && (
                                        <span className="text-[10px] font-semibold px-2 py-0.2 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                          {task.workflow_name}
                                        </span>
                                      )}
                                    </div>
                                    {task.description && (
                                      <p className="text-xs text-on-surface-variant line-clamp-1">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                                    {/* Priority */}
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
                                    >
                                      {priorityInfo.label}
                                    </span>

                                    {/* Status */}
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                                    >
                                      {statusInfo.label}
                                    </span>

                                    {/* Score / Grade */}
                                    {hasManagerGrade ? (
                                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                        {task.manager_grade}%
                                      </span>
                                    ) : hasStudentGrade ? (
                                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                                        Self: {task.student_grade}%
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-outline italic">Ungraded</span>
                                    )}

                                    {/* Actions */}
                                    <button
                                      onClick={() => {
                                        onSelectTask(task);
                                        onNavigateToEvaluations();
                                      }}
                                      className="p-1 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                      title="Evaluate this task"
                                    >
                                      <span className="material-symbols-outlined text-sm">fact_check</span>
                                    </button>
                                    <button
                                      onClick={() => onDeleteTask(task.id)}
                                      className="p-1 text-outline hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete task"
                                    >
                                      <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Progress Bar / Metric */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-xs text-on-surface">
                            {completed} / {total} Tasks
                          </span>
                          <span className="text-[11px] text-primary font-bold">{percentage}%</span>
                          <div className="w-16 bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

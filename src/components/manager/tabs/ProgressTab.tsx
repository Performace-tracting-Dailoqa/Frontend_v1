import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { BarChart, PieChart } from "@mui/x-charts";
import {
  Workflow,
  WorkflowTask,
  TeamMember,
  ManagerProgressSummary,
  ManagerStudentDetails,
  fetchManagerProgressSummary,
  fetchManagerTasks,
  fetchWorkflows,
  fetchManagerStudentDetails,
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
  const [localWorkflows, setLocalWorkflows] = useState<Workflow[]>(workflows || []);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(false);

  // Student Detail & Task History Modal State (When clicking a student in the roster)
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<TeamMember | null>(null);
  const [studentTaskData, setStudentTaskData] = useState<ManagerStudentDetails | null>(null);
  const [isLoadingStudentDetails, setIsLoadingStudentDetails] = useState(false);
  const [studentTaskFilter, setStudentTaskFilter] = useState<"all" | "completed" | "in_progress" | "pending">("all");
  const [studentTaskSearch, setStudentTaskSearch] = useState("");

  const handleOpenStudentDetails = async (member: TeamMember) => {
    setSelectedStudentDetail(member);
    setStudentTaskData(null);
    setStudentTaskFilter("all");
    setStudentTaskSearch("");
    setIsLoadingStudentDetails(true);
    try {
      const data = await fetchManagerStudentDetails(member.id);
      setStudentTaskData(data);
    } catch (err) {
      console.warn("Failed to fetch student details:", err);
    } finally {
      setIsLoadingStudentDetails(false);
    }
  };

  // Filters for Student Roster & Tasks
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadDynamicData = async () => {
    try {
      setIsLoadingDynamic(true);
      const [sum, taskRes, wfRes] = await Promise.all([
        fetchManagerProgressSummary().catch(() => null),
        fetchManagerTasks(1, 200).catch(() => ({ items: [], total: 0, page: 1, page_size: 200 })),
        fetchWorkflows(1, 100).catch(() => ({ items: [], total: 0, page: 1, page_size: 100 })),
      ]);
      if (sum) setSummary(sum);
      if (taskRes && taskRes.items && taskRes.items.length > 0) setAllTasks(taskRes.items);
      if (wfRes && wfRes.items && wfRes.items.length > 0) setLocalWorkflows(wfRes.items);
    } catch (err) {
      console.warn("Failed to load live manager progress data:", err);
    } finally {
      setIsLoadingDynamic(false);
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

  // Update workflows if prop changes
  useEffect(() => {
    if (workflows && workflows.length > 0) {
      setLocalWorkflows(workflows);
    }
  }, [workflows]);

  const effectiveWorkflows = useMemo(() => {
    if (workflows && workflows.length > 0) return workflows;
    if (localWorkflows && localWorkflows.length > 0) return localWorkflows;
    return [];
  }, [workflows, localWorkflows]);

  // ---------------------------------------------------------------------------
  // 1. Workflow-wise Completion Percentage (for Bar Graph)
  // ---------------------------------------------------------------------------
  const workflowCompletionData = useMemo(() => {
    // 1. First priority: Precomputed workflow_distribution from backend summary
    if (summary?.workflow_distribution && summary.workflow_distribution.length > 0) {
      return summary.workflow_distribution.map((w, idx) => ({
        id: w.id,
        name: w.name.length > 18 ? w.name.slice(0, 16) + "…" : w.name,
        fullName: w.name,
        total: w.total,
        completed: w.completed,
        percentage: w.percentage,
        color: w.color || BATCH_COLORS[idx % BATCH_COLORS.length],
      }));
    }

    // 2. Second priority: Compute from effectiveWorkflows and allTasks
    if (effectiveWorkflows && effectiveWorkflows.length > 0) {
      return effectiveWorkflows.map((wf, idx) => {
        const wfTasks = allTasks.filter((t) => t.workflow_id === wf.id);
        const total = wfTasks.length;
        const completed = wfTasks.filter((t) =>
          ["completed", "done"].includes((t.status || "").toLowerCase())
        ).length;
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
    }

    // 3. Fallback: Group by workflow_name from allTasks
    if (allTasks && allTasks.length > 0) {
      const wfMap = new Map<string, { name: string; total: number; completed: number }>();
      allTasks.forEach((t) => {
        const wid = t.workflow_id || "general";
        const wname = t.workflow_name || "Workflow Track";
        if (!wfMap.has(wid)) {
          wfMap.set(wid, { name: wname, total: 0, completed: 0 });
        }
        const entry = wfMap.get(wid)!;
        entry.total += 1;
        if (["completed", "done"].includes((t.status || "").toLowerCase())) {
          entry.completed += 1;
        }
      });
      return Array.from(wfMap.entries()).map(([id, info], idx) => ({
        id,
        name: info.name.length > 18 ? info.name.slice(0, 16) + "…" : info.name,
        fullName: info.name,
        total: info.total,
        completed: info.completed,
        percentage: info.total > 0 ? Math.round((info.completed / info.total) * 100) : 0,
        color: BATCH_COLORS[idx % BATCH_COLORS.length],
      }));
    }

    return [];
  }, [summary, effectiveWorkflows, allTasks]);

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
  // 3. Student Roster with Assigned Workflows & Task Stats
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

      // Group studentTasks by workflow
      const wfMap = new Map<string, { id: string; name: string; total: number; completed: number }>();
      studentTasks.forEach((t) => {
        const wid = t.workflow_id || "general";
        const wname = t.workflow_name || "Workflow Track";
        if (!wfMap.has(wid)) {
          wfMap.set(wid, { id: wid, name: wname, total: 0, completed: 0 });
        }
        const entry = wfMap.get(wid)!;
        entry.total += 1;
        if (["completed", "done"].includes((t.status || "").toLowerCase())) {
          entry.completed += 1;
        }
      });
      const assignedWorkflows = Array.from(wfMap.values()).map((wf) => ({
        ...wf,
        percentage: wf.total > 0 ? Math.round((wf.completed / wf.total) * 100) : 0,
      }));

      return {
        student,
        tasks: studentTasks,
        assignedWorkflows,
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
    return studentRosterWithTasks.filter(({ student, tasks, assignedWorkflows }) => {
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
        const matchesWorkflows = assignedWorkflows.some((wf) =>
          wf.name.toLowerCase().includes(q)
        );
        const matchesTasks = tasks.some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.workflow_name && t.workflow_name.toLowerCase().includes(q))
        );
        if (!matchesStudent && !matchesWorkflows && !matchesTasks) {
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
              {isLoadingDynamic ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs text-outline font-medium">Loading workflow completion rates...</p>
                </div>
              ) : isMounted && workflowCompletionData.length > 0 ? (
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
      {/* ALL STUDENTS & THEIR ASSIGNED WORKFLOWS ROSTER                     */}
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
              Live roster showing assigned workflow tracks per student. Click any student to inspect their detailed task history.
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
                placeholder="Search student, workflow, or ID..."
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
                <th className="px-5 py-3.5 w-60">Learner Details</th>
                <th className="px-5 py-3.5 w-40">Assigned Batch</th>
                <th className="px-5 py-3.5">Assigned Workflows</th>
                <th className="px-5 py-3.5 w-32 text-center">Progress</th>
                <th className="px-5 py-3.5 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-xs text-outline">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-2xl">group_off</span>
                    </div>
                    <p className="font-semibold text-on-surface">No students found</p>
                    <p className="mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredRoster.map(({ student, assignedWorkflows, total, completed, percentage }) => {
                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleOpenStudentDetails(student)}
                      className="hover:bg-primary/5 transition-colors align-middle cursor-pointer group"
                      title="Click to view detailed student tasks"
                    >
                      {/* Learner Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-body-sm font-bold text-on-surface leading-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                              <span>{student.name}</span>
                              <span className="material-symbols-outlined text-outline group-hover:text-primary text-xs transition-colors">
                                open_in_new
                              </span>
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
                          <span className="truncate max-w-[120px]">{student.batch_name || "General Batch"}</span>
                        </span>
                      </td>

                      {/* Assigned Workflows (Clean Badges with Task Count & Rate) */}
                      <td className="px-5 py-4">
                        {assignedWorkflows.length === 0 ? (
                          <div className="p-2 bg-surface-container/30 rounded-lg border border-dashed border-outline-variant/40 inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-outline text-xs">info</span>
                            <span className="text-xs text-outline italic">No workflows currently assigned</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedWorkflows.map((wf) => (
                              <div
                                key={wf.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 font-medium text-xs shadow-2xs group-hover:border-indigo-300 transition-all"
                              >
                                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                                <span className="font-bold font-headline">{wf.name}</span>
                                <span className="px-1.5 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-mono font-bold text-[10px]">
                                  {wf.completed}/{wf.total} ({wf.percentage}%)
                                </span>
                              </div>
                            ))}
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

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudentDetails(student);
                          }}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="View student tasks & details"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP MODAL: DETAILED STUDENT TASKS & HISTORY            */}
      {/* ========================================================= */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 p-6 sm:p-7 shadow-2xl animate-fade-in max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0 gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4B2EF5] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs border border-indigo-100">
                  {selectedStudentDetail.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase rounded-md">
                      {selectedStudentDetail.department || "Engineering"}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-md">
                      Batch: {selectedStudentDetail.batch_name || "General Pool"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      selectedStudentDetail.status?.toLowerCase() === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {selectedStudentDetail.status || "Active"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-headline truncate">
                    {selectedStudentDetail.name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                    <span>{selectedStudentDetail.email}</span>
                    {selectedStudentDetail.enrollment_no && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-700 font-medium">ID: {selectedStudentDetail.enrollment_no}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Close popup"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {isLoadingStudentDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-700">Loading student tasks &amp; performance details...</p>
                <p className="text-xs text-slate-400 mt-1">Fetching assignments and competency evaluations</p>
              </div>
            ) : (
              <>
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 shrink-0 bg-slate-50/70 -mx-6 sm:-mx-7 px-6 sm:px-7">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Assigned</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {studentTaskData?.stats.total_tasks ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Tasks</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Completed</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-emerald-700 font-mono">
                        {studentTaskData?.stats.completed_tasks ?? 0}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">
                        ({studentTaskData?.stats.completion_rate ?? 0}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Finished</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">In Progress</span>
                    <span className="text-lg font-bold text-amber-700 font-mono">
                      {studentTaskData?.stats.in_progress_tasks ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Active / Submitted</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pending / Todo</span>
                    <span className="text-lg font-bold text-slate-700 font-mono">
                      {studentTaskData?.stats.pending_tasks ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Awaiting start</span>
                  </div>
                </div>

                {/* Filter Tabs & Search Controls */}
                <div className="pt-4 pb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "all"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({studentTaskData?.stats.total_tasks ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("completed")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "completed"
                          ? "bg-white text-emerald-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Completed ({studentTaskData?.stats.completed_tasks ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("in_progress")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "in_progress"
                          ? "bg-white text-amber-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      In Progress ({studentTaskData?.stats.in_progress_tasks ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "pending"
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Pending ({studentTaskData?.stats.pending_tasks ?? 0})
                    </button>
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search tasks by title or workflow..."
                      value={studentTaskSearch}
                      onChange={(e) => setStudentTaskSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {(() => {
                    const allTasksList = studentTaskData?.tasks || [];
                    const filtered = allTasksList.filter((t) => {
                      const st = (t.status || "").toLowerCase();
                      if (studentTaskFilter === "completed" && !["completed", "done"].includes(st)) return false;
                      if (studentTaskFilter === "in_progress" && !["in_progress", "in progress", "submitted"].includes(st)) return false;
                      if (studentTaskFilter === "pending" && !["pending", "todo", "assigned"].includes(st)) return false;

                      if (studentTaskSearch.trim()) {
                        const q = studentTaskSearch.toLowerCase();
                        const titleMatch = (t.title || "").toLowerCase().includes(q);
                        const descMatch = (t.description || "").toLowerCase().includes(q);
                        const wfMatch = (t.workflow_name || "").toLowerCase().includes(q);
                        if (!titleMatch && !descMatch && !wfMatch) return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                            <span className="material-symbols-outlined text-2xl">assignment_late</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">No tasks found</h4>
                          <p className="text-xs text-slate-500 mt-0.5 mb-3 max-w-sm mx-auto">
                            {studentTaskSearch || studentTaskFilter !== "all"
                              ? "No tasks match your active filter or search."
                              : "No workflow tasks have been assigned to this student yet."}
                          </p>
                        </div>
                      );
                    }

                    return filtered.map((task) => {
                      const st = (task.status || "pending").toLowerCase();
                      const isCompleted = ["completed", "done"].includes(st);
                      const isInProgress = ["in_progress", "in progress", "submitted"].includes(st);

                      return (
                        <div
                          key={task.id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-3"
                        >
                          {/* Task Top Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isInProgress
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {isCompleted ? "check_circle" : isInProgress ? "pending" : "radio_button_unchecked"}
                                </span>
                                <span className="capitalize">{task.status || "Pending"}</span>
                              </span>

                              {task.workflow_name && (
                                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-md">
                                  Track: {task.workflow_name}
                                </span>
                              )}

                              {task.priority && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  task.priority.toLowerCase() === "high" || task.priority.toLowerCase() === "urgent"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : task.priority.toLowerCase() === "medium"
                                    ? "bg-orange-50 text-orange-700 border border-orange-100"
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {task.priority} Priority
                                </span>
                              )}
                            </div>

                            {/* Scores & Completion info */}
                            <div className="flex items-center gap-2">
                              {task.student_grade !== null && task.student_grade !== undefined && (
                                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-lg font-mono">
                                  Self-Grade: {task.student_grade}/10
                                </span>
                              )}
                              {task.manager_grade !== null && task.manager_grade !== undefined && (
                                <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold rounded-lg font-mono">
                                  Manager Grade: {task.manager_grade}/10
                                </span>
                              )}

                              {/* Evaluation Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentDetail(null);
                                  onSelectTask(task);
                                  onNavigateToEvaluations();
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Evaluate this task"
                              >
                                <span className="material-symbols-outlined text-xs">fact_check</span>
                                <span>Evaluate</span>
                              </button>

                              {/* Delete Action */}
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteTask(task.id);
                                  if (selectedStudentDetail) {
                                    handleOpenStudentDetails(selectedStudentDetail);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 font-headline">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Submission notes if any */}
                          {task.submission_notes && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                              <span className="font-semibold text-slate-800 block text-[11px] uppercase mb-0.5">Learner Submission Notes:</span>
                              <p className="italic text-slate-600">{task.submission_notes}</p>
                            </div>
                          )}

                          {/* Task Bottom Dates & Metadata */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                            <div className="flex items-center gap-3 flex-wrap">
                              {task.start_date && (
                                <span>Start: <span className="font-mono text-slate-700">{task.start_date.split("T")[0]}</span></span>
                              )}
                              {task.due_date && (
                                <span>Due: <span className="font-mono text-slate-700">{task.due_date.split("T")[0]}</span></span>
                              )}
                              {task.completed_at && (
                                <span className="text-emerald-700">Completed: <span className="font-mono">{task.completed_at.split("T")[0]}</span></span>
                              )}
                            </div>
                            {task.assigned_by_name && (
                              <span>Assigned by: <span className="text-slate-700 font-semibold">{task.assigned_by_name}</span></span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-500 mt-2">
              <span>
                {studentTaskData ? `${studentTaskData.tasks.length} total tasks on record` : ""}
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
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
  onCreateTask: (data: {
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
const STATUS_COLORS: Record<string, string> = {
  completed: "#10B981",
  in_progress: "#3B82F6",
  submitted: "#8B5CF6",
  under_review: "#8B5CF6",
  pending: "#F59E0B",
  todo: "#64748B",
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#10B981",
};

export default function ProgressTab({
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  tasks: initialTasks,
  isLoadingTasks,
  teamMembers,
  selectedTask,
  onSelectTask,
  onCreateTask,
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
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [allTasks, setAllTasks] = useState<WorkflowTask[]>(initialTasks || []);
  const [isLoadingAllTasks, setIsLoadingAllTasks] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Assign Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDynamicData = async () => {
    try {
      setIsLoadingSummary(true);
      const [sum, taskRes] = await Promise.all([
        fetchManagerProgressSummary().catch(() => null),
        fetchManagerTasks(1, 200).catch(() => ({ items: [], total: 0, page: 1, page_size: 200 })),
      ]);
      if (sum) setSummary(sum);
      if (taskRes && taskRes.items) setAllTasks(taskRes.items);
    } catch (err) {
      console.warn("Failed to load live manager progress data:", err);
    } finally {
      setIsLoadingSummary(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !studentId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        student_id: studentId,
        due_date: dueDate || undefined,
        priority: priority,
      });
      setTitle("");
      setDescription("");
      setStudentId("");
      setDueDate("");
      setPriority("medium");
      setIsModalOpen(false);
      await loadDynamicData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Data for Charts: Batch-wise, Task-wise Status, and Assigned/Priority-wise
  // ---------------------------------------------------------------------------
  const batchPieData = useMemo(() => {
    if (!summary || !summary.batch_distribution || summary.batch_distribution.length === 0) {
      return [];
    }
    return summary.batch_distribution.map((b, idx) => ({
      id: idx,
      value: b.total,
      label: b.batch_name,
      color: BATCH_COLORS[idx % BATCH_COLORS.length],
    }));
  }, [summary]);

  const statusPieData = useMemo(() => {
    if (!summary || !summary.status_distribution || summary.status_distribution.length === 0) {
      return [];
    }
    return summary.status_distribution
      .filter((s) => s.value > 0)
      .map((s, idx) => ({
        id: idx,
        value: s.value,
        label: s.name.replace("_", " "),
        color: STATUS_COLORS[s.name.toLowerCase()] || BATCH_COLORS[idx % BATCH_COLORS.length],
      }));
  }, [summary]);

  const priorityPieData = useMemo(() => {
    if (!summary || !summary.priority_distribution || summary.priority_distribution.length === 0) {
      return [];
    }
    return summary.priority_distribution
      .filter((p) => p.value > 0)
      .map((p, idx) => ({
        id: idx,
        value: p.value,
        label: p.name.charAt(0).toUpperCase() + p.name.slice(1),
        color: PRIORITY_COLORS[p.name.toLowerCase()] || "#94A3B8",
      }));
  }, [summary]);

  // Filter tasks table
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const matchesStatus = statusFilter === "all" || t.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesPriority = priorityFilter === "all" || t.priority?.toLowerCase() === priorityFilter.toLowerCase();
      const student = teamMembers.find((m) => m.id === t.student_id);
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student?.name && student.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [allTasks, statusFilter, priorityFilter, searchQuery, teamMembers]);

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
            {summary?.overall_completion_rate ?? 0}% cohort completion
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Under Review</span>
            <span className="material-symbols-outlined text-indigo-600 text-xl">rate_review</span>
          </div>
          <div className="text-3xl font-bold font-headline text-indigo-700 mt-2">
            <CountUp to={summary?.under_review_tasks ?? 0} duration={1.2} />
          </div>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">Awaiting manager grading</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Active Batches</span>
            <span className="material-symbols-outlined text-amber-600 text-xl">school</span>
          </div>
          <div className="text-3xl font-bold font-headline text-amber-700 mt-2">
            <CountUp to={summary?.batch_distribution?.length ?? 1} duration={1.2} />
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Live supervised cohorts</p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3 PIE CHARTS: BATCH-WISE, TASK-WISE STATUS, ASSIGNED/PRIORITY-WISE  */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pie 1: Batch-wise Distribution */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-on-surface font-headline">Batch-wise Distribution</h4>
              <p className="text-[11px] text-on-surface-variant">Task assignments by learner batch</p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
          </div>

          <div className="w-full flex items-center justify-center relative" style={{ height: 210 }}>
            {isMounted && batchPieData.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: batchPieData,
                    innerRadius: 40,
                    outerRadius: 75,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    highlightScope: { highlight: "item", fade: "global" },
                  },
                ]}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                hideLegend
              />
            ) : (
              <div className="text-xs text-outline italic">No batch task data available</div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-outline-variant/30 flex flex-wrap gap-2 text-[10px]">
            {batchPieData.slice(0, 4).map((b) => (
              <span key={b.id} className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                {b.label}: {b.value}
              </span>
            ))}
          </div>
        </div>

        {/* Pie 2: Task-wise Status Distribution */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-on-surface font-headline">Task Status Distribution</h4>
              <p className="text-[11px] text-on-surface-variant">Completed vs In Progress vs Review</p>
            </div>
            <span className="material-symbols-outlined text-emerald-600 text-xl">donut_large</span>
          </div>

          <div className="w-full flex items-center justify-center relative" style={{ height: 210 }}>
            {isMounted && statusPieData.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: statusPieData,
                    innerRadius: 40,
                    outerRadius: 75,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    highlightScope: { highlight: "item", fade: "global" },
                  },
                ]}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                hideLegend
              />
            ) : (
              <div className="text-xs text-outline italic">No task status data available</div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-outline-variant/30 flex flex-wrap gap-2 text-[10px]">
            {statusPieData.map((s) => (
              <span key={s.id} className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}: {s.value}
              </span>
            ))}
          </div>
        </div>

        {/* Pie 3: Assigned-wise / Priority Distribution */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-on-surface font-headline">Priority &amp; Urgency</h4>
              <p className="text-[11px] text-on-surface-variant">Assigned priority allocation</p>
            </div>
            <span className="material-symbols-outlined text-amber-600 text-xl">flag</span>
          </div>

          <div className="w-full flex items-center justify-center relative" style={{ height: 210 }}>
            {isMounted && priorityPieData.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: priorityPieData,
                    innerRadius: 40,
                    outerRadius: 75,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    highlightScope: { highlight: "item", fade: "global" },
                  },
                ]}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                hideLegend
              />
            ) : (
              <div className="text-xs text-outline italic">No priority allocation data available</div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-outline-variant/30 flex flex-wrap gap-2 text-[10px]">
            {priorityPieData.map((p) => (
              <span key={p.id} className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.label}: {p.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BATCH PROGRESS BARS                                                 */}
      {/* =================================================================== */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-title-md font-bold text-on-surface font-headline">
              Batch Progress &amp; Milestone Completion
            </h4>
            <p className="text-xs text-on-surface-variant">
              Live completion velocity across monitored student batches
            </p>
          </div>
          <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-xs rounded-lg font-mono">
            {summary?.overall_completion_rate ?? 0}% Overall Cohort Rate
          </span>
        </div>

        <div className="space-y-4">
          {(!summary?.batch_distribution || summary.batch_distribution.length === 0) ? (
            <div className="py-6 text-center text-xs text-outline">
              No batch progress metrics currently recorded.
            </div>
          ) : (
            summary.batch_distribution.map((batch, idx) => {
              const color = BATCH_COLORS[idx % BATCH_COLORS.length];
              return (
                <div key={batch.batch_name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">{batch.batch_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-outline">
                        {batch.completed} of {batch.total} tasks completed
                      </span>
                      <span className="font-mono font-bold text-on-surface" style={{ color }}>
                        {batch.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${batch.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* DELIVERABLES & TASKS TABLE WITH DYNAMIC FILTERS                     */}
      {/* =================================================================== */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 bg-surface-container/30 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-lowest text-xs font-semibold rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="submitted">Under Review / Submitted</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-lowest text-xs font-semibold rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined text-outline text-base absolute left-2.5 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables or learners..."
                className="pl-8 pr-3 py-1.5 bg-surface-container-lowest text-xs rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary w-52"
              />
            </div>

            {selectedWorkflow && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add_task</span>
                <span>Assign Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-surface-container text-outline text-xs uppercase tracking-wider font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="px-5 py-3.5">Task Deliverable</th>
                <th className="px-5 py-3.5">Assigned Learner</th>
                <th className="px-5 py-3.5">Student Self-Grade</th>
                <th className="px-5 py-3.5">Manager Grade</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-outline">
                    No deliverables found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const student = teamMembers.find((m) => m.id === task.student_id);
                  const isSelected = selectedTask?.id === task.id;
                  const hasStudentGrade = task.student_grade !== null && task.student_grade !== undefined;
                  const hasManagerGrade = task.manager_grade !== null && task.manager_grade !== undefined;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-surface-container/50 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-on-surface">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-on-surface-variant line-clamp-1">{task.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-on-surface">
                          {student ? student.name : "Assigned Student"}
                        </div>
                        {student?.batch_name && (
                          <div className="text-[11px] font-mono text-outline">{student.batch_name}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasStudentGrade ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1 font-mono">
                            <span className="material-symbols-outlined text-xs">stars</span>
                            <span>{task.student_grade} / 100</span>
                          </span>
                        ) : (
                          <span className="text-xs text-outline italic">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasManagerGrade ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Evaluated ({task.manager_grade}%)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 inline-flex items-center gap-1.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Not Evaluated</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                            task.priority === "urgent"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : task.priority === "high"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {task.priority || "Normal"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                            task.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : task.status === "submitted"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {task.status?.replace("_", " ") || "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              onSelectTask(task);
                              onNavigateToEvaluations();
                            }}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">fact_check</span>
                            <span>Grade Task</span>
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 text-outline hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Delete task"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
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

      {/* Assign Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full border border-outline-variant/50 p-6 shadow-xl animate-fade-in">
            <h3 className="text-title-md font-bold text-on-surface font-headline mb-3">
              Assign Deliverable Task
            </h3>
            {error && <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement REST API for Japanese Vocabulary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Assignee *</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Select a team member...</option>
                  <option value="ALL">⚡ All Team Members ({teamMembers.length})</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.enrollment_no || m.department || "Intern"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Task instructions, criteria for acceptance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-surface-container text-xs font-semibold rounded-lg hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !studentId}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90"
                >
                  {isSubmitting ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

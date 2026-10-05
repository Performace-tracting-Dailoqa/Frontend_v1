"use client";

import React, { useState, useMemo } from "react";
import { Workflow, WorkflowTask, TeamMember, ManagerTeam } from "@/services/workflowService";

interface WorkflowTasksViewProps {
  workflow: Workflow;
  tasks: WorkflowTask[];
  isLoadingTasks: boolean;
  teams: ManagerTeam[];
  teamMembers: TeamMember[];
  onBack: () => void;
  onCreateTask: (data: {
    title: string;
    description?: string;
    student_id: string;
    due_date?: string;
    priority?: string;
  }) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onNavigateToEvaluations?: (workflow: Workflow, task?: WorkflowTask) => void;
  onDeleteWorkflow?: (id: string) => Promise<void>;
}

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  urgent: { label: "Urgent", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  low: { label: "Low", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "check_circle" },
  in_progress: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "pending" },
  submitted: { label: "Submitted", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "task_alt" },
  under_review: { label: "Under Review", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "rate_review" },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "schedule" },
  todo: { label: "To Do", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: "radio_button_unchecked" },
};

export default function WorkflowTasksView({
  workflow,
  tasks,
  isLoadingTasks,
  teams,
  teamMembers,
  onBack,
  onCreateTask,
  onDeleteTask,
  onNavigateToEvaluations,
  onDeleteWorkflow,
}: WorkflowTasksViewProps) {
  // Filters and Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Create Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identify Assigned Batch Details
  const assignedBatch = useMemo(() => {
    if (!workflow.batch_id) return null;
    return teams.find((t) => t.id === workflow.batch_id) || null;
  }, [workflow.batch_id, teams]);

  const batchName = workflow.batch_name || assignedBatch?.name || (workflow.batch_id ? "Assigned Cohort" : "All Cohorts / General");

  // Filter team members applicable to this workflow's batch
  const batchLearners = useMemo(() => {
    if (!workflow.batch_id) return teamMembers;
    const filtered = teamMembers.filter((m) => m.batch_id === workflow.batch_id);
    return filtered.length > 0 ? filtered : teamMembers;
  }, [workflow.batch_id, teamMembers]);

  // Tasks belonging to this workflow
  const workflowTasks = useMemo(() => {
    return tasks.filter((t) => t.workflow_id === workflow.id);
  }, [tasks, workflow.id]);

  // Computed Metrics
  const metrics = useMemo(() => {
    const total = workflowTasks.length;
    const completed = workflowTasks.filter((t) => t.status === "completed").length;
    const inProgress = workflowTasks.filter(
      (t) => t.status === "in_progress" || t.status === "submitted" || t.status === "under_review"
    ).length;
    const pending = workflowTasks.filter((t) => t.status === "pending" || t.status === "todo").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, rate };
  }, [workflowTasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return workflowTasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesStudent = task.student_name?.toLowerCase().includes(q);
        const matchesEnrollment = task.enrollment_no?.toLowerCase().includes(q);
        const matchesEmail = task.student_email?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesStudent && !matchesEnrollment && !matchesEmail) {
          return false;
        }
      }
      // Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === "in_progress") {
          if (!["in_progress", "submitted", "under_review"].includes(task.status)) return false;
        } else if (task.status !== statusFilter) {
          return false;
        }
      }
      // Priority Filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [workflowTasks, searchQuery, statusFilter, priorityFilter]);

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !studentId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (studentId === "ALL_BATCH") {
        await Promise.all(
          batchLearners.map((m) =>
            onCreateTask({
              title: title.trim(),
              description: description.trim() || undefined,
              student_id: m.id,
              due_date: dueDate || undefined,
              priority: priority,
            })
          )
        );
      } else {
        await onCreateTask({
          title: title.trim(),
          description: description.trim() || undefined,
          student_id: studentId,
          due_date: dueDate || undefined,
          priority: priority,
        });
      }
      setTitle("");
      setDescription("");
      setStudentId("");
      setDueDate("");
      setPriority("medium");
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-on-surface transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-outline-variant/40 hover:border-outline-variant"
            title="Back to All Workflows"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Workflows</span>
          </button>
          <div className="h-5 w-px bg-outline-variant/40 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-title-lg font-headline font-bold text-on-surface">
                {workflow.name}
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                {workflow.status || "Active"}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              {workflow.description || "Manage, assign, and track all tasks in this workflow track."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {onDeleteWorkflow && (
            <button
              onClick={() => onDeleteWorkflow(workflow.id)}
              className="p-2 text-outline hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-200"
              title="Delete this workflow"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          )}
          <button
            onClick={() => {
              setStudentId(batchLearners.length > 0 ? batchLearners[0].id : "");
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white text-body-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Prominent Assigned Batch / Team Card */}
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">groups</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Assigned Batch / Team</span>
              <span className="text-xs text-outline">•</span>
              <span className="text-xs text-on-surface-variant">
                Created on {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString() : "Recent"}
              </span>
            </div>
            <h3 className="text-title-md font-bold text-on-surface mt-0.5">{batchName}</h3>
            {assignedBatch?.department && (
              <p className="text-xs text-on-surface-variant mt-0.5">
                Department / Program: <span className="font-semibold text-on-surface">{assignedBatch.department}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-surface-container/60 px-4 py-2.5 rounded-xl border border-outline-variant/30 shrink-0">
          <div className="text-center sm:text-right">
            <p className="text-xs text-on-surface-variant font-medium">Eligible Batch Members</p>
            <p className="text-title-sm font-bold text-on-surface">{batchLearners.length} Students</p>
          </div>
          <div className="h-7 w-px bg-outline-variant/40" />
          <div className="text-center sm:text-right">
            <p className="text-xs text-on-surface-variant font-medium">Tasks Allocated</p>
            <p className="text-title-sm font-bold text-primary">{workflowTasks.length} Tasks</p>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-on-surface-variant">Total Tasks</span>
            <span className="material-symbols-outlined text-lg text-indigo-500">assignment</span>
          </div>
          <div className="text-2xl font-bold font-headline text-on-surface">{metrics.total}</div>
          <p className="text-xs text-on-surface-variant mt-1">In this workflow</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-on-surface-variant">Completed</span>
            <span className="material-symbols-outlined text-lg text-emerald-500">check_circle</span>
          </div>
          <div className="text-2xl font-bold font-headline text-emerald-600">{metrics.completed}</div>
          <p className="text-xs text-on-surface-variant mt-1">Evaluated &amp; closed</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-on-surface-variant">In Progress</span>
            <span className="material-symbols-outlined text-lg text-blue-500">pending</span>
          </div>
          <div className="text-2xl font-bold font-headline text-blue-600">{metrics.inProgress}</div>
          <p className="text-xs text-on-surface-variant mt-1">Active / In Review</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-on-surface-variant">Completion Rate</span>
            <span className="material-symbols-outlined text-lg text-primary">percent</span>
          </div>
          <div className="text-2xl font-bold font-headline text-on-surface">{metrics.rate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by task title, student name, or enrollment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container text-body-sm rounded-xl border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface-container text-body-sm rounded-xl border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress / Review</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="todo">To Do</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-surface-container text-body-sm rounded-xl border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table / Content */}
      {isLoadingTasks ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">task</span>
          </div>
          <h4 className="text-body-md font-bold text-on-surface">No Tasks Found</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "No tasks match your filter criteria. Try adjusting the search or filters."
              : `No tasks have been assigned in this workflow track yet. Assign a task to get started.`}
          </p>
          <button
            onClick={() => {
              setStudentId(batchLearners.length > 0 ? batchLearners[0].id : "");
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
          >
            Assign First Task
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container/40">
                  <th className="px-5 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Task Details
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Assigned Student &amp; Batch
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Score / Grade
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredTasks.map((task) => {
                  const priorityInfo = PRIORITY_BADGES[task.priority?.toLowerCase() || "medium"] || PRIORITY_BADGES.medium;
                  const statusInfo = STATUS_BADGES[task.status?.toLowerCase() || "todo"] || STATUS_BADGES.todo;
                  const student = teamMembers.find((m) => m.id === task.student_id);
                  const studentName = task.student_name || student?.name || "Assigned Student";
                  const studentEmail = task.student_email || student?.email || "";
                  const enrollmentNo = task.enrollment_no || student?.enrollment_no || "";

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-surface-container-low/40 transition-colors"
                    >
                      {/* Task Info */}
                      <td className="px-5 py-4 max-w-xs">
                        <h4 className="text-body-sm font-bold text-on-surface">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Student & Batch */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-body-sm font-semibold text-on-surface leading-tight">
                              {studentName}
                            </div>
                            <div className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                              {enrollmentNo && (
                                <span className="font-mono text-[11px] bg-surface-container px-1.5 py-0.2 rounded border border-outline-variant/30">
                                  {enrollmentNo}
                                </span>
                              )}
                              {studentEmail && <span className="truncate max-w-[130px]">{studentEmail}</span>}
                            </div>
                            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                              {batchName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
                        >
                          {priorityInfo.label}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-on-surface font-medium">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Grade / Score */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {task.final_grade !== null && task.final_grade !== undefined ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-body-sm font-bold text-emerald-600">
                              {task.final_grade}
                            </span>
                            <span className="text-xs text-on-surface-variant">/ 100</span>
                          </div>
                        ) : task.manager_grade !== null && task.manager_grade !== undefined ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-body-sm font-bold text-primary">
                              {task.manager_grade}
                            </span>
                            <span className="text-xs text-on-surface-variant">/ 100</span>
                          </div>
                        ) : (
                          <span className="text-xs text-outline italic">Ungraded</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onNavigateToEvaluations && (
                            <button
                              onClick={() => onNavigateToEvaluations(workflow, task)}
                              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-xs font-semibold transition-all cursor-pointer border border-outline-variant/30 flex items-center gap-1"
                              title="Evaluate Task"
                            >
                              <span className="material-symbols-outlined text-sm">grade</span>
                              <span>Evaluate</span>
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-outline hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full border border-outline-variant/50 p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-title-md font-bold text-on-surface font-headline">
                  Assign Task to {batchName}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Workflow: <span className="font-semibold text-on-surface">{workflow.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-surface text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Assign To Student *
                </label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Select a student...</option>
                  {batchLearners.length > 1 && (
                    <option value="ALL_BATCH" className="font-bold text-primary">
                      ✦ Assign to ALL Students in this Batch ({batchLearners.length})
                    </option>
                  )}
                  {batchLearners.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.enrollment_no ? `(${m.enrollment_no})` : ""} — {m.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement REST API Endpoints with FastAPI"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Description / Deliverable Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the deliverable expectations, code requirements, and acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary resize-none"
                />
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Assign Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

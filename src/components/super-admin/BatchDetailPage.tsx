"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  BatchFullDetails,
  BatchStudentItem,
  BatchTaskItem,
  BatchWorkflowItem,
  fetchBatchFullDetails,
} from "@/services/batchService";
import { fetchStudentReport, StudentReportData } from "@/services/adminService";
import { TeamRecord } from "@/services/insightsService";
import { shortDate } from "@/utils/date";
import {
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Pill,
  PrimaryButton,
  ProgressBar,
  SearchInput,
  SectionCard,
  Select,
  StatCard,
  StatusDot,
} from "./SuperAdminUi";
import InternEvaluationTrendChart from "./InternEvaluationTrendChart";

interface BatchDetailPageProps {
  team: TeamRecord;
  onBack: () => void;
  onOpenAddPerson?: () => void;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
}

function getTaskStatusPill(
  status: string,
  dueDate: string | null | undefined
): { label: string; tone: "emerald" | "amber" | "slate" | "rose" | "teal" } {
  const s = (status || "").toLowerCase();
  const isOverdue =
    Boolean(dueDate) &&
    new Date(dueDate!).getTime() < Date.now() &&
    s !== "completed" &&
    s !== "done" &&
    s !== "evaluated";
  if (isOverdue) return { label: "Overdue", tone: "rose" };
  if (s === "completed" || s === "done") return { label: "Completed", tone: "emerald" };
  if (s === "evaluated") return { label: "Evaluated", tone: "teal" };
  if (s === "in_progress" || s === "submitted" || s === "review" || s === "under_review") {
    return { label: "In Progress", tone: "amber" };
  }
  return { label: "Pending", tone: "slate" };
}

function getPriorityBadge(priority: string | null | undefined) {
  const p = (priority || "medium").toLowerCase();
  if (p === "high") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        High
      </span>
    );
  }
  if (p === "low") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        Low
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      Medium
    </span>
  );
}

export default function BatchDetailPage({
  team,
  onBack,
  onOpenAddPerson,
}: BatchDetailPageProps) {
  const [activeTab, setActiveTab] = useState<"workflows" | "tasks" | "students">("workflows");
  const [search, setSearch] = useState("");
  const [taskWorkflowFilter, setTaskWorkflowFilter] = useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<BatchTaskItem | null>(null);

  // Student Individual Full Progress Inspection state
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<BatchStudentItem | null>(null);
  const [studentReport, setStudentReport] = useState<StudentReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "tasks" | "evaluations" | "profile">("overview");

  const loadStudentReport = React.useCallback(async (profileId: string) => {
    setIsReportLoading(true);
    setReportError(null);
    try {
      const report = await fetchStudentReport(profileId);
      setStudentReport(report);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Failed to load individual intern report.");
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedStudentForReport) {
      setDrawerTab("overview");
      void loadStudentReport(selectedStudentForReport.id);
    } else {
      setStudentReport(null);
      setIsReportLoading(false);
      setReportError(null);
    }
  }, [selectedStudentForReport, loadStudentReport]);

  const { data, isInitialLoading, isLoading, error, reload } = useAsyncData<BatchFullDetails>(
    () => fetchBatchFullDetails(team.id),
    [team.id],
    { toMessage: (caught) => (caught instanceof Error ? caught.message : String(caught)) }
  );

  const workflows = useMemo(() => data?.workflows ?? [], [data]);
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const students = useMemo(() => data?.students ?? [], [data]);
  const summary = useMemo(() => data?.summary ?? {
    student_count: team.student_count,
    workflow_count: team.workflow_count,
    task_count: team.tasks.total,
    completed_tasks: team.tasks.completed,
    in_progress_tasks: team.tasks.in_progress,
    pending_tasks: team.tasks.pending,
    overdue_tasks: team.tasks.overdue,
    completion_rate: team.tasks.completion_percentage,
  }, [data, team]);

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workflows;
    return workflows.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.manager_name && w.manager_name.toLowerCase().includes(q))
    );
  }, [workflows, search]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (taskWorkflowFilter !== "all" && t.workflow_id !== taskWorkflowFilter) return false;
      const statusInfo = getTaskStatusPill(t.status, t.due_date);
      if (taskStatusFilter !== "all") {
        if (taskStatusFilter === "overdue" && statusInfo.label !== "Overdue") return false;
        if (taskStatusFilter === "completed" && statusInfo.label !== "Completed" && statusInfo.label !== "Evaluated") return false;
        if (taskStatusFilter === "in_progress" && statusInfo.label !== "In Progress") return false;
        if (taskStatusFilter === "pending" && statusInfo.label !== "Pending") return false;
      }
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.student_name && t.student_name.toLowerCase().includes(q)) ||
        (t.workflow_title && t.workflow_title.toLowerCase().includes(q))
      );
    });
  }, [tasks, search, taskWorkflowFilter, taskStatusFilter]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.enrollment_no && s.enrollment_no.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
    );
  }, [students, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Top Banner Navigation */}
      <PageIntro
        icon="arrow_back"
        title={data?.batch.name || team.name}
        description={`Batch Hub · ${team.department ?? "General"} · ${
          data?.manager?.name ? `Lead: ${data.manager.name}` : "Manager Lead Unassigned"
        }`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={reload}
              disabled={isLoading}
              className="h-10 px-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Refresh batch data"
            >
              <span className={`material-symbols-outlined text-base text-slate-500 ${isLoading ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="h-10 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base text-slate-500">arrow_back</span>
              <span>Back to teams</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Workflows"
          value={summary.workflow_count}
          icon="account_tree"
          tone="indigo"
          hint={`${summary.task_count} total tasks assigned`}
        />
        <StatCard
          label="Tasks Completed"
          value={`${summary.completed_tasks} / ${summary.task_count}`}
          hint={`${summary.completion_rate}% completion rate`}
          icon="task_alt"
          tone="emerald"
        />
        <StatCard
          label="Enrolled Interns"
          value={summary.student_count}
          icon="school"
          tone="teal"
          hint={`${students.filter((s) => s.is_active).length} active learners`}
        />
        <StatCard
          label="Overdue Tasks"
          value={summary.overdue_tasks}
          icon="warning"
          tone={summary.overdue_tasks > 0 ? "rose" : "slate"}
          hint={summary.overdue_tasks > 0 ? "Requires attention" : "All on schedule"}
        />
      </div>

      {/* Tab Navigation & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("workflows")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "workflows"
                ? "bg-[#4B2EF5] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-base">account_tree</span>
            <span>Workflows ({workflows.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tasks"
                ? "bg-[#4B2EF5] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-base">assignment</span>
            <span>Tasks ({tasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "students"
                ? "bg-[#4B2EF5] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-base">school</span>
            <span>Students ({students.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "tasks" && (
            <>
              {workflows.length > 0 && (
                <Select
                  ariaLabel="Filter tasks by workflow"
                  value={taskWorkflowFilter}
                  onChange={setTaskWorkflowFilter}
                  options={[
                    { value: "all", label: "All Workflows" },
                    ...workflows.map((w) => ({ value: String(w.id), label: w.title })),
                  ]}
                />
              )}
              <Select
                ariaLabel="Filter tasks by status"
                value={taskStatusFilter}
                onChange={setTaskStatusFilter}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "completed", label: "Completed / Evaluated" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "pending", label: "Pending" },
                  { value: "overdue", label: "Overdue" },
                ]}
              />
            </>
          )}

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === "workflows"
                ? "Search workflows…"
                : activeTab === "tasks"
                ? "Search tasks, assignees…"
                : "Search students…"
            }
            className="w-full sm:w-60"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isInitialLoading ? (
        <LoadingState label={`Loading ${team.name} workflows, tasks and students…`} />
      ) : error ? (
        <ErrorState title="Could not load batch details" message={error} onRetry={reload} />
      ) : (
        <>
          {/* TAB 1: WORKFLOWS */}
          {activeTab === "workflows" && (
            <div className="space-y-4">
              {filteredWorkflows.length === 0 ? (
                <EmptyState
                  icon="account_tree"
                  title="No workflows found"
                  description={
                    search.trim()
                      ? `No workflows match "${search.trim()}".`
                      : "No workflows have been added to this batch yet."
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWorkflows.map((workflow) => {
                    const completionRate =
                      workflow.task_count > 0
                        ? Math.round((workflow.completed_task_count / workflow.task_count) * 100)
                        : 0;

                    return (
                      <div
                        key={workflow.id}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-[#4B2EF5]/50 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-slate-900 truncate">
                                {workflow.title}
                              </h4>
                              {workflow.manager_name && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                                  <span>Manager: {workflow.manager_name}</span>
                                </p>
                              )}
                            </div>
                            <Pill tone={workflow.status === "active" ? "emerald" : "slate"}>
                              {workflow.status ?? "active"}
                            </Pill>
                          </div>

                          {workflow.description && (
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {workflow.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Task Progress</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {workflow.completed_task_count} / {workflow.task_count} tasks ({completionRate}%)
                            </span>
                          </div>
                          <ProgressBar value={completionRate} showValue={false} />

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">calendar_today</span>
                              <span>
                                {workflow.start_date ? formatDate(workflow.start_date) : "No start date"} →{" "}
                                {workflow.end_date ? formatDate(workflow.end_date) : "Ongoing"}
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setTaskWorkflowFilter(String(workflow.id));
                                setActiveTab("tasks");
                              }}
                              className="text-xs font-bold text-[#4B2EF5] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View tasks</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TASKS */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <EmptyState
                  icon="assignment"
                  title="No tasks found"
                  description={
                    search.trim() || taskWorkflowFilter !== "all" || taskStatusFilter !== "all"
                      ? "No tasks match your filters. Try selecting 'All Workflows' or 'All Statuses'."
                      : "No workflow tasks have been added to this batch yet."
                  }
                />
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500">
                    Showing <strong>{filteredTasks.length}</strong> task{filteredTasks.length === 1 ? "" : "s"} ·{" "}
                    <em>Click on any task to view its full details and evaluation metrics breakdown</em>
                  </p>

                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                    {filteredTasks.map((task) => {
                      const statusInfo = getTaskStatusPill(task.status, task.due_date);
                      const hasEvaluation = Boolean(task.evaluation);

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-slate-900 hover:text-[#4B2EF5] transition-colors">
                                {task.title}
                              </h5>
                              <Pill tone={statusInfo.tone}>{statusInfo.label}</Pill>
                              {getPriorityBadge(task.priority)}
                              {hasEvaluation && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                  <span className="material-symbols-outlined text-xs">grade</span>
                                  <span>{Math.round(task.evaluation?.percentage ?? 0)}% Scored</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1 text-[#4B2EF5] font-semibold">
                                <span className="material-symbols-outlined text-sm">account_tree</span>
                                <span>{task.workflow_title ?? "Workflow Task"}</span>
                              </span>

                              <span className="flex items-center gap-1 text-slate-600">
                                <span className="material-symbols-outlined text-sm">person</span>
                                <span>{task.student_name ?? "Unassigned"}</span>
                                {task.enrollment_no && (
                                  <span className="font-mono text-[11px] text-slate-400">
                                    ({task.enrollment_no})
                                  </span>
                                )}
                              </span>

                              {task.due_date && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <span className="material-symbols-outlined text-sm">event</span>
                                  <span>Due: {formatDate(task.due_date)}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#4B2EF5] hover:text-white text-slate-700 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs">
                              <span>View details & metrics</span>
                              <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDENTS */}
          {activeTab === "students" && (
            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <EmptyState
                  icon="school"
                  title="No interns found"
                  description={
                    search.trim()
                      ? `No students match "${search.trim()}".`
                      : "No students are currently enrolled in this batch."
                  }
                  action={
                    onOpenAddPerson ? (
                      <PrimaryButton onClick={onOpenAddPerson} icon="person_add">
                        Add a student
                      </PrimaryButton>
                    ) : undefined
                  }
                />
              ) : (
                <SectionCard
                  title="Enrolled Students"
                  subtitle={`${filteredStudents.length} student${
                    filteredStudents.length === 1 ? "" : "s"
                  } in this batch`}
                  icon="groups"
                >
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-500">
                      Showing <strong>{filteredStudents.length}</strong> enrolled student{filteredStudents.length === 1 ? "" : "s"} ·{" "}
                      <em>Click on any student to inspect their full progress, workflow tasks, and performance evaluations</em>
                    </p>

                    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                      {filteredStudents.map((learner) => (
                        <div
                          key={learner.id}
                          onClick={() => setSelectedStudentForReport(learner)}
                          className="flex flex-wrap items-center gap-3.5 p-4 hover:bg-slate-50/80 hover:border-[#4B2EF5]/40 transition-all cursor-pointer group"
                        >
                          <Avatar name={learner.name || "Student"} size="md" />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-[#4B2EF5] transition-colors truncate">
                                {learner.name ?? "Unnamed intern"}
                              </p>
                              <StatusDot isActive={learner.is_active} />
                            </div>
                            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                              {learner.email ?? "No email"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {learner.enrollment_no && <Pill tone="slate">{learner.enrollment_no}</Pill>}
                            {learner.department && <Pill tone="slate">{learner.department}</Pill>}
                            {learner.joining_date && (
                              <Pill tone="slate">Joined {shortDate(learner.joining_date)}</Pill>
                            )}
                            <Pill tone={learner.is_active ? "emerald" : "rose"}>
                              {learner.is_active ? "Active" : "Inactive"}
                            </Pill>
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-[#4B2EF5] group-hover:text-white text-slate-700 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs">
                              <span>Full progress</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </>
      )}

      {/* TASK DETAILS & EVALUATION METRICS MODAL */}
      <AnimatePresence>
        {selectedTask && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedTask(null)}
            role="presentation"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Task: ${selectedTask.title}`}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Top Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Task Details & Metrics
                    </span>
                    <Pill tone={getTaskStatusPill(selectedTask.status, selectedTask.due_date).tone}>
                      {getTaskStatusPill(selectedTask.status, selectedTask.due_date).label}
                    </Pill>
                    {getPriorityBadge(selectedTask.priority)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedTask.title}
                  </h3>
                  <p className="text-xs text-[#4B2EF5] font-semibold mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">account_tree</span>
                    <span>{selectedTask.workflow_title ?? "Workflow Task"}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Assignee Intern Info */}
                <div
                  className={`p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center gap-3 ${
                    selectedTask.student_id ? "hover:bg-slate-100/80 hover:border-[#4B2EF5]/40 transition-colors cursor-pointer group" : ""
                  }`}
                  onClick={() => {
                    if (selectedTask.student_id) {
                      const matched = students.find((s) => s.id === selectedTask.student_id) || {
                        id: selectedTask.student_id,
                        user_id: "",
                        name: selectedTask.student_name ?? null,
                        email: selectedTask.student_email ?? null,
                        enrollment_no: selectedTask.enrollment_no ?? null,
                        department: null,
                        joining_date: null,
                        status: "Active",
                        is_active: true,
                      };
                      setSelectedStudentForReport(matched);
                    }
                  }}
                >
                  <Avatar name={selectedTask.student_name || "Student"} size="md" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Intern
                    </span>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#4B2EF5] transition-colors truncate">
                      {selectedTask.student_name ?? "Unassigned"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {selectedTask.student_email ?? "No email"}
                      {selectedTask.enrollment_no ? ` · ENR: ${selectedTask.enrollment_no}` : ""}
                    </p>
                  </div>
                  {selectedTask.student_id && (
                    <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 group-hover:border-[#4B2EF5] group-hover:text-[#4B2EF5] text-slate-600 text-[10px] font-bold transition-colors">
                      View full record →
                    </span>
                  )}
                  {selectedTask.due_date && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Due Date
                      </span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {formatDate(selectedTask.due_date)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Task Description */}
                {selectedTask.description && (
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Task Description
                    </h5>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTask.description}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Created</span>
                    <span className="font-semibold text-slate-800">{formatDate(selectedTask.created_at)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Submitted</span>
                    <span className="font-semibold text-slate-800">{formatDate(selectedTask.submitted_at)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Completed</span>
                    <span className="font-semibold text-slate-800">{formatDate(selectedTask.completed_at)}</span>
                  </div>
                </div>

                {/* EVALUATION & METRICS SECTION */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-[#4B2EF5]">rate_review</span>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Evaluation & Metrics Breakdown
                      </h4>
                    </div>

                    {selectedTask.evaluation?.percentage !== null && selectedTask.evaluation?.percentage !== undefined && (
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                          (selectedTask.evaluation.percentage ?? 0) >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : (selectedTask.evaluation.percentage ?? 0) >= 60
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        Score: {Math.round(selectedTask.evaluation.percentage)}%
                      </span>
                    )}
                  </div>

                  {selectedTask.evaluation ? (
                    <div className="space-y-3">
                      {/* Evaluator and Score Strip */}
                      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Evaluator: {selectedTask.evaluation.evaluator_name || "Manager Evaluator"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Evaluated on {formatDate(selectedTask.evaluation.evaluated_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-[#4B2EF5]">
                            {selectedTask.evaluation.total_score ?? 0} / {selectedTask.evaluation.max_score ?? 100}
                          </span>
                          <span className="text-[10px] text-slate-400 block">points</span>
                        </div>
                      </div>

                      {/* Remarks */}
                      {selectedTask.evaluation.remarks && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Feedback & Remarks
                          </span>
                          <p className="italic text-slate-800">&ldquo;{selectedTask.evaluation.remarks}&rdquo;</p>
                        </div>
                      )}

                      {/* Evaluation Metrics List */}
                      {selectedTask.evaluation.metrics && selectedTask.evaluation.metrics.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Individual Criteria Metrics ({selectedTask.evaluation.metrics.length})
                          </span>

                          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                            {selectedTask.evaluation.metrics.map((metric, idx) => (
                              <div key={metric.id || idx} className="p-3.5 flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h6 className="text-xs font-bold text-slate-900">{metric.name}</h6>
                                    {metric.weightage ? (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                        Weight: {metric.weightage}%
                                      </span>
                                    ) : null}
                                  </div>
                                  {metric.description && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">{metric.description}</p>
                                  )}
                                  {metric.remarks && (
                                    <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded">
                                      {metric.remarks}
                                    </p>
                                  )}
                                </div>

                                <div className="text-right shrink-0 font-mono text-xs">
                                  <span className="font-bold text-slate-900">
                                    {metric.score !== null && metric.score !== undefined ? metric.score : "—"}
                                  </span>
                                  {metric.full_score && (
                                    <span className="text-slate-400"> / {metric.full_score}</span>
                                  )}
                                  {metric.weighted_score !== null && metric.weighted_score !== undefined && (
                                    <span className="text-[10px] text-slate-400 block">
                                      weighted: {metric.weighted_score}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                          No specific criteria metrics attached to this evaluation.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center py-6">
                      <span className="material-symbols-outlined text-2xl text-slate-300 mb-1">pending_actions</span>
                      <p className="text-xs font-bold text-slate-700">Not Evaluated Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        This workflow task has not been evaluated by a manager or teacher yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDENT FULL PROGRESS INSPECTION DRAWER */}
      <AnimatePresence>
        {selectedStudentForReport && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
            onClick={() => setSelectedStudentForReport(null)}
            role="presentation"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Record for ${selectedStudentForReport.name || "Student"}`}
              className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
            >
              {/* Drawer Top Sticky Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/90 backdrop-blur-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Intern Performance & Record
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4B2EF5]/10 text-[#4B2EF5]">
                    {studentReport?.batch_name || team.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void loadStudentReport(selectedStudentForReport.id)}
                    disabled={isReportLoading}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Refresh report"
                  >
                    <span className={`material-symbols-outlined text-lg ${isReportLoading ? "animate-spin" : ""}`}>
                      refresh
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForReport(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Person Basic Identity Header */}
                <div className="flex items-start gap-4">
                  <Avatar name={selectedStudentForReport.name || "Student"} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-slate-900 truncate">
                        {selectedStudentForReport.name || "Unnamed Intern"}
                      </h3>
                      <StatusDot isActive={selectedStudentForReport.is_active} />
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                      {selectedStudentForReport.email || "No email"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Pill tone="indigo">Intern</Pill>
                      {selectedStudentForReport.enrollment_no && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                          {selectedStudentForReport.enrollment_no}
                        </span>
                      )}
                      {selectedStudentForReport.department && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          {selectedStudentForReport.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPI Quick Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Completion</span>
                      <span className="material-symbols-outlined text-sm text-emerald-600">task_alt</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {studentReport?.summary.completion_rate ?? 0}%
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {studentReport?.summary.completed_tasks ?? 0} of {studentReport?.summary.total_tasks ?? 0} tasks
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Avg Score</span>
                      <span className="material-symbols-outlined text-sm text-[#4B2EF5]">star</span>
                    </div>
                    <p className="text-lg font-bold text-[#4B2EF5] mt-1">
                      {studentReport?.summary.average_score ?? 0}%
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {studentReport?.summary.total_evaluations ?? 0} evaluations
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">In Progress</span>
                      <span className="material-symbols-outlined text-sm text-amber-600">timelapse</span>
                    </div>
                    <p className="text-lg font-bold text-amber-600 mt-1">
                      {studentReport?.summary.in_progress_tasks ?? 0}
                    </p>
                    <p className="text-[10px] text-slate-400">active assignments</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Overdue</span>
                      <span className="material-symbols-outlined text-sm text-rose-600">warning</span>
                    </div>
                    <p className="text-lg font-bold text-rose-600 mt-1">
                      {studentReport?.summary.overdue_tasks ?? 0}
                    </p>
                    <p className="text-[10px] text-slate-400">past deadline</p>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-1">
                  {[
                    { id: "overview", label: "Overview", icon: "dashboard" },
                    { id: "tasks", label: `Tasks (${studentReport?.tasks.length ?? 0})`, icon: "assignment" },
                    { id: "evaluations", label: `Evaluations (${studentReport?.evaluations.length ?? 0})`, icon: "rate_review" },
                    { id: "profile", label: "Profile & Details", icon: "badge" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDrawerTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        drawerTab === tab.id
                          ? "bg-[#4B2EF5] text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {isReportLoading ? (
                  <LoadingState label="Loading detailed intern report…" compact />
                ) : reportError ? (
                  <ErrorState
                    title="Could not load intern report"
                    message={reportError}
                    onRetry={() => void loadStudentReport(selectedStudentForReport.id)}
                  />
                ) : (
                  <>
                    {/* TAB: OVERVIEW */}
                    {drawerTab === "overview" && (
                      <div className="space-y-5">
                        {/* Evaluation Score Trend Line Graph */}
                        <InternEvaluationTrendChart
                          evaluations={studentReport?.evaluations ?? []}
                          height={200}
                        />

                        {/* Workload Progress Card */}
                        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Task Completion Health
                            </h4>
                            <span className="text-xs font-bold font-mono text-[#4B2EF5]">
                              {studentReport?.summary.completion_rate ?? 0}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${
                                  studentReport?.summary.total_tasks
                                    ? ((studentReport.summary.completed_tasks / studentReport.summary.total_tasks) * 100)
                                    : 0
                                }%`,
                              }}
                              title="Completed"
                            />
                            <div
                              className="h-full bg-amber-400"
                              style={{
                                width: `${
                                  studentReport?.summary.total_tasks
                                    ? ((studentReport.summary.in_progress_tasks / studentReport.summary.total_tasks) * 100)
                                    : 0
                                }%`,
                              }}
                              title="In Progress"
                            />
                            <div
                              className="h-full bg-rose-400"
                              style={{
                                width: `${
                                  studentReport?.summary.total_tasks
                                    ? ((studentReport.summary.overdue_tasks / studentReport.summary.total_tasks) * 100)
                                    : 0
                                }%`,
                              }}
                              title="Overdue"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>{studentReport?.summary.completed_tasks ?? 0} Completed</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>{studentReport?.summary.in_progress_tasks ?? 0} In Progress</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-300" />
                              <span>{studentReport?.summary.pending_tasks ?? 0} Pending</span>
                            </span>
                            {Boolean(studentReport?.summary.overdue_tasks) && (
                              <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span>{studentReport?.summary.overdue_tasks} Overdue</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Recent Evaluations Preview */}
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Latest Evaluation Scores
                            </h4>
                            <button
                              type="button"
                              onClick={() => setDrawerTab("evaluations")}
                              className="text-[11px] font-bold text-[#4B2EF5] hover:underline cursor-pointer"
                            >
                              View all ({studentReport?.evaluations.length ?? 0})
                            </button>
                          </div>
                          {studentReport?.evaluations.length === 0 ? (
                            <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                              No evaluations recorded yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {studentReport?.evaluations.slice(0, 3).map((ev) => (
                                <div
                                  key={ev.id}
                                  className="p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            ev.evaluation_type === "workflow"
                                              ? "bg-violet-50 text-violet-700 border border-violet-200"
                                              : "bg-teal-50 text-teal-700 border border-teal-200"
                                          }`}
                                        >
                                          {ev.evaluation_type === "workflow" ? "Workflow Eval" : "Daily Eval"}
                                        </span>
                                        {ev.task_title && (
                                          <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                                            {ev.task_title}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-1">
                                        Evaluator: {ev.evaluator_name || "Assigned Evaluator"} · {formatDate(ev.evaluation_date)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span
                                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                                          (ev.percentage ?? 0) >= 80
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : (ev.percentage ?? 0) >= 60
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}
                                      >
                                        {ev.percentage !== null && ev.percentage !== undefined
                                          ? `${Math.round(ev.percentage)}%`
                                          : "Pending"}
                                      </span>
                                      {ev.total_score !== null && (
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          {ev.total_score} / {ev.max_score ?? 100} pts
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {ev.remarks && (
                                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                      &ldquo;{ev.remarks}&rdquo;
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recent Tasks Preview */}
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Assigned Tasks Preview
                            </h4>
                            <button
                              type="button"
                              onClick={() => setDrawerTab("tasks")}
                              className="text-[11px] font-bold text-[#4B2EF5] hover:underline cursor-pointer"
                            >
                              View all ({studentReport?.tasks.length ?? 0})
                            </button>
                          </div>
                          {studentReport?.tasks.length === 0 ? (
                            <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                              No tasks currently assigned to this student.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {studentReport?.tasks.slice(0, 3).map((task) => {
                                const statusInfo = getTaskStatusPill(task.status, task.due_date);
                                return (
                                  <div
                                    key={task.id}
                                    className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 truncate">{task.title}</p>
                                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {task.workflow_title ? `Workflow: ${task.workflow_title}` : "Standalone Task"}
                                        {task.due_date ? ` · Due ${formatDate(task.due_date)}` : ""}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {getPriorityBadge(task.priority)}
                                      <Pill tone={statusInfo.tone}>{statusInfo.label}</Pill>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB: TASKS */}
                    {drawerTab === "tasks" && (
                      <div className="space-y-3">
                        {studentReport?.tasks.length === 0 ? (
                          <EmptyState
                            icon="task"
                            title="No tasks assigned"
                            description="This intern has not been assigned any workflow tasks yet."
                          />
                        ) : (
                          studentReport?.tasks.map((task) => {
                            const statusInfo = getTaskStatusPill(task.status, task.due_date);
                            return (
                              <div
                                key={task.id}
                                className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5 shadow-2xs hover:border-[#4B2EF5]/40 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h5 className="text-sm font-bold text-slate-900">{task.title}</h5>
                                    {task.workflow_title && (
                                      <p className="text-xs text-[#4B2EF5] font-semibold mt-0.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">account_tree</span>
                                        <span>{task.workflow_title}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {getPriorityBadge(task.priority)}
                                    <Pill tone={statusInfo.tone}>{statusInfo.label}</Pill>
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    <span>Due: {formatDate(task.due_date)}</span>
                                  </span>
                                  {task.completed_at && (
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                      <span className="material-symbols-outlined text-sm">check_circle</span>
                                      <span>Completed {formatDate(task.completed_at)}</span>
                                    </span>
                                  )}
                                  {task.submitted_at && !task.completed_at && (
                                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                                      <span className="material-symbols-outlined text-sm">schedule</span>
                                      <span>Submitted {formatDate(task.submitted_at)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* TAB: EVALUATIONS */}
                    {drawerTab === "evaluations" && (
                      <div className="space-y-4">
                        {studentReport?.evaluations.length === 0 ? (
                          <EmptyState
                            icon="rate_review"
                            title="No evaluations yet"
                            description="No daily or workflow evaluations have been submitted for this intern."
                          />
                        ) : (
                          studentReport?.evaluations.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        ev.evaluation_type === "workflow"
                                          ? "bg-violet-50 text-violet-700 border border-violet-200"
                                          : "bg-teal-50 text-teal-700 border border-teal-200"
                                      }`}
                                    >
                                      {ev.evaluation_type === "workflow"
                                        ? "Workflow Evaluation"
                                        : "Daily Evaluation"}
                                    </span>
                                    {ev.task_title && (
                                      <span className="text-xs font-bold text-slate-800">
                                        {ev.task_title}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    <span>Evaluator: <strong>{ev.evaluator_name || "Manager / Instructor"}</strong></span>
                                    <span>·</span>
                                    <span>{formatDate(ev.evaluation_date)}</span>
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <div
                                    className={`inline-block px-3 py-1 rounded-xl text-sm font-bold font-mono ${
                                      (ev.percentage ?? 0) >= 80
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : (ev.percentage ?? 0) >= 60
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}
                                  >
                                    {ev.percentage !== null && ev.percentage !== undefined
                                      ? `${Math.round(ev.percentage)}%`
                                      : "Pending"}
                                  </div>
                                  {ev.total_score !== null && (
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                      Score: {ev.total_score} / {ev.max_score ?? 100}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {ev.remarks && (
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-700 space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Feedback & Remarks
                                  </span>
                                  <p className="italic text-slate-700">&ldquo;{ev.remarks}&rdquo;</p>
                                </div>
                              )}

                              {ev.metrics && ev.metrics.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Criteria Breakdown
                                  </span>
                                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden">
                                    {ev.metrics.map((m, mIdx) => (
                                      <div
                                        key={m.id || mIdx}
                                        className="p-2.5 flex items-center justify-between text-xs"
                                      >
                                        <div className="min-w-0 pr-2">
                                          <p className="font-semibold text-slate-800">{m.name}</p>
                                          {m.remarks && (
                                            <p className="text-[11px] text-slate-500 italic mt-0.5">{m.remarks}</p>
                                          )}
                                        </div>
                                        <div className="text-right shrink-0 font-mono text-[11px]">
                                          <span className="font-bold text-slate-900">
                                            {m.score ?? "—"}
                                          </span>
                                          {m.full_score && (
                                            <span className="text-slate-400"> / {m.full_score}</span>
                                          )}
                                          {m.weightage ? (
                                            <span className="text-slate-400 block text-[10px]">
                                              weight: {m.weightage}%
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB: PROFILE */}
                    {drawerTab === "profile" && (
                      <div className="space-y-5">
                        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                          {[
                            { label: "Department", value: selectedStudentForReport.department ?? "—" },
                            { label: "Enrollment No", value: selectedStudentForReport.enrollment_no ?? "—" },
                            { label: "Batch", value: studentReport?.batch_name || team.name },
                            { label: "Joining Date", value: formatDate(studentReport?.student?.joining_date || selectedStudentForReport.joining_date) },
                            { label: "Status", value: selectedStudentForReport.is_active ? "Active" : "Inactive" },
                            { label: "Student ID", value: selectedStudentForReport.id, mono: true },
                            { label: "User ID", value: selectedStudentForReport.user_id || studentReport?.student?.user_id || "—", mono: true },
                          ].map((row) => (
                            <div key={row.label} className="flex justify-between gap-3">
                              <span className="text-slate-400 shrink-0">{row.label}</span>
                              <span
                                className={`font-semibold text-slate-800 text-right truncate ${
                                  row.mono ? "font-mono text-[11px]" : ""
                                }`}
                              >
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

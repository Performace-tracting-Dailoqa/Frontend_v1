"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import SpotlightCard from "@/components/animations/SpotlightCard";
import {
  fetchStudentTasks,
  updateStudentTaskStatus,
  StudentTaskItem,
  MetricGradeItem,
} from "@/services/workflowService";
import { shortDate } from "@/utils/date";

interface MetricScoreInput {
  metric_name: string;
  score: number;
  full_score: number;
  remarks: string;
}

const DEFAULT_RUBRICS: MetricScoreInput[] = [
  { metric_name: "Code & Implementation Quality", score: 23, full_score: 25, remarks: "" },
  { metric_name: "Problem Solving & Logic", score: 22, full_score: 25, remarks: "" },
  { metric_name: "Timeliness & Sprint Delivery", score: 24, full_score: 25, remarks: "" },
  { metric_name: "Documentation & Clean Code", score: 22, full_score: 25, remarks: "" },
];

export default function StudentLearningProgressPage() {
  const [tasks, setTasks] = useState<StudentTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "submitted" | "completed" | "pending">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "high" | "medium" | "low">("all");
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");
  const [activeTab, setActiveTab] = useState<"workflows" | "certifications">("workflows");

  // Self-Evaluation / Completion Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<StudentTaskItem | null>(null);
  const [modalStatus, setModalStatus] = useState<"in_progress" | "submitted" | "completed">("completed");
  const [rubrics, setRubrics] = useState<MetricScoreInput[]>(DEFAULT_RUBRICS);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load live tasks from database
  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetchStudentTasks(1, 100);
      if (res && res.items) {
        setTasks(res.items);
      }
    } catch (err) {
      console.warn("Could not load student tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Calculate high-level KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "in-progress").length;
  const submittedTasks = tasks.filter((t) => t.status === "submitted").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const evaluatedTasks = tasks.filter((t) => t.student_grade !== null && t.student_grade !== undefined);
  const avgSelfGrade = evaluatedTasks.length > 0
    ? Math.round(evaluatedTasks.reduce((acc, t) => acc + (Number(t.student_grade) || 0), 0) / evaluatedTasks.length)
    : null;

  const managerEvaluated = tasks.filter((t) => t.manager_grade !== null && t.manager_grade !== undefined);
  const avgManagerGrade = managerEvaluated.length > 0
    ? Math.round(managerEvaluated.reduce((acc, t) => acc + (Number(t.manager_grade) || 0), 0) / managerEvaluated.length)
    : null;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter === "in_progress" && t.status !== "in_progress" && t.status !== "in-progress") return false;
      if (statusFilter === "submitted" && t.status !== "submitted") return false;
      if (statusFilter === "completed" && t.status !== "completed" && t.status !== "done") return false;
      if (statusFilter === "pending" && t.status !== "pending" && t.status !== "todo") return false;

      // Priority filter
      if (priorityFilter !== "all" && (t.priority || "normal").toLowerCase() !== priorityFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(query);
        const matchesWorkflow = (t.workflow_name || "").toLowerCase().includes(query);
        const matchesDesc = (t.description || "").toLowerCase().includes(query);
        const matchesAssigner = (t.assigned_by_name || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesWorkflow && !matchesDesc && !matchesAssigner) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  // Group tasks by Workflow
  const workflowGroups = useMemo(() => {
    const groups: { [key: string]: { workflow_name: string; assigned_by: string; tasks: StudentTaskItem[] } } = {};

    filteredTasks.forEach((task) => {
      const wfKey = task.workflow_id || task.workflow_name || "General Assigned Tasks";
      const wfName = task.workflow_name || "Engineering Tasks & Milestones";
      const assigner = task.assigned_by_name || "Tech Lead";

      if (!groups[wfKey]) {
        groups[wfKey] = {
          workflow_name: wfName,
          assigned_by: assigner,
          tasks: [],
        };
      }
      groups[wfKey].tasks.push(task);
    });

    return Object.entries(groups).map(([key, value]) => ({
      id: key,
      ...value,
      total: value.tasks.length,
      completed: value.tasks.filter((t) => t.status === "completed" || t.status === "done").length,
      rate: value.tasks.length > 0
        ? Math.round((value.tasks.filter((t) => t.status === "completed" || t.status === "done").length / value.tasks.length) * 100)
        : 0,
    }));
  }, [filteredTasks]);

  // Quick Toggle Complete Action
  const handleQuickComplete = async (task: StudentTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isAlreadyCompleted = task.status === "completed" || task.status === "done";
    const nextStatus = isAlreadyCompleted ? "in_progress" : "completed";

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await updateStudentTaskStatus(task.id, nextStatus, {
        student_grade: task.student_grade ?? (nextStatus === "completed" ? 90 : undefined),
      });
      setFeedbackMessage({
        type: "success",
        text: isAlreadyCompleted
          ? `Task "${task.title}" reopened to In Progress.`
          : `Task "${task.title}" marked as Completed (Done ✓)!`,
      });
    } catch (err: any) {
      console.error("Failed to update status:", err);
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      setFeedbackMessage({
        type: "error",
        text: "Could not save task status. Please try again.",
      });
    }

    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Open Evaluation Modal
  const handleOpenEvaluationModal = (task: StudentTaskItem) => {
    setActiveTask(task);
    setModalStatus(
      task.status === "completed" || task.status === "done"
        ? "completed"
        : task.status === "submitted"
        ? "submitted"
        : "in_progress"
    );
    setSubmissionNotes(task.submission_notes || "");

    // Load existing rubrics if stored or initialize default
    if (task.student_metric_grades && task.student_metric_grades.length > 0) {
      setRubrics(
        task.student_metric_grades.map((m) => ({
          metric_name: m.metric_name,
          score: m.score,
          full_score: m.full_score || 25,
          remarks: m.remarks || "",
        }))
      );
    } else {
      const baseGrade = task.student_grade ?? 90;
      const part = Math.round(baseGrade / 4);
      setRubrics([
        { metric_name: "Code & Implementation Quality", score: Math.min(25, part + 1), full_score: 25, remarks: "" },
        { metric_name: "Problem Solving & Architecture", score: Math.min(25, part), full_score: 25, remarks: "" },
        { metric_name: "Timeliness & Sprint Delivery", score: Math.min(25, part + 1), full_score: 25, remarks: "" },
        { metric_name: "Documentation & Clean Code", score: Math.min(25, part), full_score: 25, remarks: "" },
      ]);
    }

    setIsModalOpen(true);
  };

  // Handle Score Change in Modal
  const handleRubricScoreChange = (index: number, newScore: number) => {
    setRubrics((prev) =>
      prev.map((r, i) => (i === index ? { ...r, score: Math.max(0, Math.min(r.full_score, newScore)) } : r))
    );
  };

  const handleRubricRemarkChange = (index: number, remarks: string) => {
    setRubrics((prev) =>
      prev.map((r, i) => (i === index ? { ...r, remarks } : r))
    );
  };

  // Calculate modal total grade out of 100
  const calculatedTotalScore = rubrics.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
  const calculatedMaxScore = rubrics.reduce((acc, r) => acc + (Number(r.full_score) || 25), 0);
  const finalPercentage = calculatedMaxScore > 0 ? Math.round((calculatedTotalScore / calculatedMaxScore) * 100) : 0;

  // Save Self-Evaluation Form
  const handleSaveSelfEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    try {
      setSubmitting(true);
      const metricGrades: MetricGradeItem[] = rubrics.map((r) => ({
        metric_name: r.metric_name,
        score: r.score,
        full_score: r.full_score,
        remarks: r.remarks,
      }));

      const updated = await updateStudentTaskStatus(activeTask.id, modalStatus, {
        student_grade: finalPercentage,
        submission_notes: submissionNotes,
        student_metric_grades: metricGrades,
      });

      // Update local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTask.id
            ? {
                ...t,
                status: modalStatus,
                student_grade: finalPercentage,
                submission_notes: submissionNotes,
                student_metric_grades: metricGrades,
              }
            : t
        )
      );

      setFeedbackMessage({
        type: "success",
        text: `Self-Evaluation saved! Task updated to ${modalStatus.replace("_", " ").toUpperCase()} with grade ${finalPercentage}/100.`,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save self-evaluation:", err);
      setFeedbackMessage({
        type: "error",
        text: "Failed to save evaluation. Please verify database connection.",
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const priorityBadges: Record<string, { bg: string; text: string; border: string }> = {
    urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    high: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    medium: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    normal: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    low: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-red-50 text-red-900 border-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">
                {feedbackMessage.type === "success" ? "check_circle" : "error"}
              </span>
              <p className="text-sm font-semibold">{feedbackMessage.text}</p>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-black/5"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* HEADER WITH TITLE & LIVE STATS                            */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase tracking-wider">
              Engineering Workflows
            </span>
            <span className="text-xs text-slate-500 font-medium">Sprint &amp; Milestone Mastery</span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            My Learning Progress
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Track all technical workflows and tasks assigned by your tech lead. Complete deliverables, perform self-evaluations, and submit code artifacts for evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block font-medium">Overall Progress</span>
            <span className="text-xl font-bold text-primary font-mono">
              <CountUp to={completionRate} duration={1.5} suffix="%" />
            </span>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 rounded-2xl bg-primary text-white flex flex-col items-center justify-center font-mono font-bold text-base shadow-sm shrink-0"
          >
            <span>{completedTasks}/{totalTasks}</span>
            <span className="text-[10px] font-normal tracking-wide opacity-80">Tasks</span>
          </motion.div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 SUMMARY METRIC CARDS                                    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Workflows */}
        <SpotlightCard
          spotlightColor="rgba(75, 46, 245, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Active Workflows</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">account_tree</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
              <CountUp to={workflowGroups.length} duration={1.2} />
            </div>
            <p className="text-xs text-slate-500 mt-1">{totalTasks} total tasks assigned</p>
          </div>
        </SpotlightCard>

        {/* Card 2: Tasks Completed */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Completed (Done)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">task_alt</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
                <CountUp to={completedTasks} duration={1.2} />
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {completionRate}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </SpotlightCard>

        {/* Card 3: Avg Self-Grade */}
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Average Self-Grade</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">rate_review</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
              {avgSelfGrade !== null ? (
                <CountUp to={avgSelfGrade} duration={1.2} suffix="/100" />
              ) : (
                <span className="text-base text-slate-400 font-normal">Pending Review</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {evaluatedTasks.length} tasks self-evaluated
            </p>
          </div>
        </SpotlightCard>

        {/* Card 4: Manager Reviews */}
        <SpotlightCard
          spotlightColor="rgba(139, 92, 246, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Tech Lead Grade</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">verified</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
              {avgManagerGrade !== null ? (
                <CountUp to={avgManagerGrade} duration={1.2} suffix="/100" />
              ) : (
                <span className="text-base text-slate-400 font-normal">In Progress</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {managerEvaluated.length} official manager evaluations
            </p>
          </div>
        </SpotlightCard>

      </div>

      {/* ========================================================= */}
      {/* WORKFLOWS & TASKS SECTION                                */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-headline">
              Assigned Workflows &amp; Tasks
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review assigned criteria, update status, and submit rubric self-evaluations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search workflows, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
              {[
                { id: "all", label: "All Tasks" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Done ✓" },
                { id: "submitted", label: "In Review" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === tab.id
                      ? "bg-white text-primary shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode("grouped")}
                title="Grouped by Workflow"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === "grouped"
                    ? "bg-white text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-base block">view_agenda</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="Flat Task List"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === "list"
                    ? "bg-white text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-base block">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Loading assigned workflows &amp; tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">task_alt</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "Your manager hasn't assigned any active workflow tasks yet."}
                </p>
              </div>
            </div>
          ) : viewMode === "grouped" ? (
            /* GROUPED BY WORKFLOW VIEW */
            <div className="space-y-6">
              {workflowGroups.map((wf) => (
                <div
                  key={wf.id}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Workflow Header Banner */}
                  <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold rounded-md uppercase tracking-wider">
                          Workflow
                        </span>
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                          Lead: <strong className="text-slate-800 font-bold">{wf.assigned_by}</strong>
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {wf.workflow_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-36 hidden sm:block">
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>{wf.completed}/{wf.total} Done</span>
                          <span className="text-primary font-mono">{wf.rate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              wf.rate === 100 ? "bg-emerald-600" : "bg-primary"
                            }`}
                            style={{ width: `${wf.rate}%` }}
                          />
                        </div>
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        wf.rate === 100
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}>
                        {wf.rate === 100 ? "Complete ✓" : `${wf.total - wf.completed} Pending`}
                      </span>
                    </div>
                  </div>

                  {/* Tasks in this Workflow */}
                  <div className="divide-y divide-slate-100">
                    {wf.tasks.map((task) => {
                      const isCompleted = task.status === "completed" || task.status === "done";
                      const pKey = (task.priority || "normal").toLowerCase();
                      const pStyle = priorityBadges[pKey] || priorityBadges.normal;

                      return (
                        <div
                          key={task.id}
                          className={`p-5 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                            isCompleted ? "bg-emerald-50/20 hover:bg-emerald-50/40" : "hover:bg-slate-50/60"
                          }`}
                        >
                          {/* Task Left: Checkbox + Info */}
                          <div className="flex items-start gap-3.5 flex-1">
                            {/* Interactive Quick Complete Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => handleQuickComplete(task, e)}
                              title={isCompleted ? "Mark as In Progress" : "Mark as Completed (Done ✓)"}
                              className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border ${
                                isCompleted
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                  : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent"
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm font-bold">
                                {isCompleted ? "check" : "check"}
                              </span>
                            </button>

                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                                  {task.priority || "Normal"} Priority
                                </span>

                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : task.status === "submitted"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                  {isCompleted
                                    ? "Completed ✓"
                                    : task.status === "submitted"
                                    ? "In Review"
                                    : "In Progress"}
                                </span>

                                {task.due_date && (
                                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-xs">event</span>
                                    Due: <strong className="text-slate-700">{shortDate(task.due_date)}</strong>
                                  </span>
                                )}
                              </div>

                              <h4 className={`text-base font-bold transition-all ${
                                isCompleted ? "text-slate-800 line-through decoration-slate-400" : "text-slate-900"
                              }`}>
                                {task.title}
                              </h4>

                              {task.description && (
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                                  {task.description}
                                </p>
                              )}

                              {/* Evaluation pill tags */}
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {task.student_grade !== null && task.student_grade !== undefined && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                                    <span className="material-symbols-outlined text-xs">rate_review</span>
                                    Self-Grade: <strong className="font-mono">{task.student_grade}/100</strong>
                                  </span>
                                )}

                                {task.manager_grade !== null && task.manager_grade !== undefined && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
                                    <span className="material-symbols-outlined text-xs">verified</span>
                                    Manager Grade: <strong className="font-mono">{task.manager_grade}/100</strong>
                                  </span>
                                )}

                                {task.submission_notes && (
                                  <span className="text-xs text-slate-500 italic truncate max-w-md">
                                    Notes: &quot;{task.submission_notes}&quot;
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Task Right Actions */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEvaluationModal(task)}
                              className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold transition-all border border-primary/20 flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">edit_note</span>
                              {task.student_grade !== null && task.student_grade !== undefined
                                ? "Update Evaluation"
                                : "Self-Evaluate"}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleQuickComplete(task, e)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 ${
                                isCompleted
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                  : "bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isCompleted ? "restart_alt" : "check"}
                              </span>
                              {isCompleted ? "Reopen" : "Done"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FLAT TASK LIST VIEW */
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === "completed" || task.status === "done";
                const pKey = (task.priority || "normal").toLowerCase();
                const pStyle = priorityBadges[pKey] || priorityBadges.normal;

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${
                      isCompleted
                        ? "bg-emerald-50/20 border-emerald-200/60"
                        : "bg-white border-slate-200/90 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        type="button"
                        onClick={(e) => handleQuickComplete(task, e)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border ${
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      </button>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                            {task.workflow_name || "General Workflow"}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                            {task.priority || "Normal"}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-slate-500">
                              Due: <strong className="text-slate-800">{shortDate(task.due_date)}</strong>
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base font-bold ${isCompleted ? "text-slate-800 line-through decoration-slate-400" : "text-slate-900"}`}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                      {task.student_grade !== null && task.student_grade !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold font-mono">
                          {task.student_grade}/100
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEvaluationModal(task)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold transition-all border border-primary/20"
                      >
                        Self-Evaluate
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickComplete(task, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isCompleted
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                            : "bg-emerald-600 text-white border-emerald-600"
                        }`}
                      >
                        {isCompleted ? "Reopen" : "Done ✓"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* SELF-EVALUATION & COMPLETION MODAL                        */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isModalOpen && activeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl my-8"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                      Self-Evaluation &amp; Submission
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {activeTask.workflow_name || "Workflow Task"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-headline">
                    {activeTask.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Evaluation Form */}
              <form onSubmit={handleSaveSelfEvaluation} className="space-y-6">
                
                {/* 1. Status Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Task Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "in_progress", label: "In Progress (50%)", icon: "pending" },
                      { id: "submitted", label: "Submit for Review", icon: "send" },
                      { id: "completed", label: "Completed (Done ✓)", icon: "check_circle" },
                    ].map((st) => (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => setModalStatus(st.id as any)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                          modalStatus === st.id
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Engineering Competency Rubric Scoring */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Competency Rubrics Scoring
                    </label>
                    <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Total: {calculatedTotalScore} / {calculatedMaxScore} ({finalPercentage}%)
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                    {rubrics.map((rubric, idx) => (
                      <div key={rubric.metric_name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                          <span>{rubric.metric_name}</span>
                          <span className="font-mono text-primary font-bold">
                            {rubric.score} / {rubric.full_score} pts
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max={rubric.full_score}
                            value={rubric.score}
                            onChange={(e) => handleRubricScoreChange(idx, Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Brief comment / justification for this criterion..."
                          value={rubric.remarks}
                          onChange={(e) => handleRubricRemarkChange(idx, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Deliverable Notes & Artifact Links */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Deliverable Notes, PR Link &amp; Key Findings
                  </label>
                  <textarea
                    rows={3}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="E.g., GitHub PR #42 merged, implemented JWT refresh handler, completed test coverage with 94% unit pass rate..."
                    className="w-full p-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">check</span>
                        <span>Save Self-Evaluation ({finalPercentage}%)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

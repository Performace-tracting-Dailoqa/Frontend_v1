"use client";

import React, { useState, useMemo, useEffect } from "react";
import { WorkflowTask, TeamMember, ManagerTeam } from "@/services/workflowService";
import { WorkflowEvaluation } from "@/services/evaluationService";

export interface BatchFeedbackItem {
  id: string;
  batch_id: string; // 'all' or specific batch id
  batch_name: string;
  title: string;
  message: string;
  category: "guidance" | "milestone" | "commendation" | "quality" | "announcement";
  priority: "normal" | "important" | "urgent";
  author_name: string;
  created_at: string;
  is_pinned?: boolean;
}

interface FeedbackTabProps {
  teams?: ManagerTeam[];
  tasks: WorkflowTask[];
  teamMembers: TeamMember[];
  evaluation: WorkflowEvaluation | null;
}

const CATEGORY_CONFIG: Record<
  BatchFeedbackItem["category"],
  { label: string; bg: string; text: string; icon: string }
> = {
  milestone: { label: "Milestone & Velocity", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "flag" },
  guidance: { label: "Technical Guidance", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", icon: "lightbulb" },
  commendation: { label: "Recognition & Kudos", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "star" },
  quality: { label: "Code Quality & Standards", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", icon: "verified" },
  announcement: { label: "Batch Announcement", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "campaign" },
};

const INITIAL_BATCH_FEEDBACK: BatchFeedbackItem[] = [
  {
    id: "bf-1",
    batch_id: "all",
    batch_name: "All Teams",
    title: "Sprint 1 Architecture & PR Review Standards",
    message: "Great work on the recent microservice deliverable submissions. Please ensure all pull requests include unit test coverage >= 80% and follow our REST error schema format before requesting manager review.",
    category: "quality",
    priority: "important",
    author_name: "Rajan Patel (Engineering Manager)",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    is_pinned: true,
  },
  {
    id: "bf-2",
    batch_id: "6e899e47-89c2-4c18-ae25-ae316c9fdc8d",
    batch_name: "Team Alpha",
    title: "Backend Services Milestone Progress Commendation",
    message: "Team Alpha has demonstrated exceptional velocity on the database migration scripts and JWT token handlers. Keep up the high standard of clean commit histories and proactive async communication.",
    category: "commendation",
    priority: "normal",
    author_name: "Rajan Patel (Engineering Manager)",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    is_pinned: false,
  },
  {
    id: "bf-3",
    batch_id: "fbf4e76f-9c62-4758-ab9c-b7783367b916",
    batch_name: "Team Beta",
    title: "QA Test Matrix and API Integration Next Steps",
    message: "For the Fullstack & QA workflow, remember to mock external service calls in your integration test suite. Check out the example tests in the repository for reference.",
    category: "guidance",
    priority: "normal",
    author_name: "Rajan Patel (Engineering Manager)",
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    is_pinned: false,
  },
];

const STORAGE_KEY = "dailoqa_manager_batch_feedback_list_v1";

export default function FeedbackTab({ teams = [], tasks, teamMembers }: FeedbackTabProps) {
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"batch_feedback" | "task_reflections">("batch_feedback");

  // Batch Feedback Form State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState("all");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState<BatchFeedbackItem["category"]>("guidance");
  const [feedbackPriority, setFeedbackPriority] = useState<BatchFeedbackItem["priority"]>("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Stored Batch Feedbacks
  const [batchFeedbacks, setBatchFeedbacks] = useState<BatchFeedbackItem[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBatchFeedbacks(parsed);
          return;
        }
      }
    } catch {}
    setBatchFeedbacks(INITIAL_BATCH_FEEDBACK);
  }, []);

  // Save to LocalStorage
  const saveFeedbacks = (items: BatchFeedbackItem[]) => {
    setBatchFeedbacks(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to persist batch feedback:", e);
    }
  };

  const handleCreateBatchFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackMessage.trim()) return;

    setIsSubmitting(true);

    let batchName = "All Teams";
    if (targetBatchId !== "all") {
      const targetTeam = teams.find((t) => t.id === targetBatchId);
      if (targetTeam) batchName = targetTeam.name;
    }

    const newItem: BatchFeedbackItem = {
      id: `bf-${Date.now()}`,
      batch_id: targetBatchId,
      batch_name: batchName,
      title: feedbackTitle.trim(),
      message: feedbackMessage.trim(),
      category: feedbackCategory,
      priority: feedbackPriority,
      author_name: "Manager Feedback",
      created_at: new Date().toISOString(),
      is_pinned: feedbackPriority === "urgent",
    };

    const updated = [newItem, ...batchFeedbacks];
    saveFeedbacks(updated);

    // Reset form
    setFeedbackTitle("");
    setFeedbackMessage("");
    setFeedbackCategory("guidance");
    setFeedbackPriority("normal");
    setIsComposeOpen(false);
    setIsSubmitting(false);
    setPostSuccess(true);
    setTimeout(() => setPostSuccess(false), 4000);
  };

  const handleDeleteFeedback = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback entry?")) return;
    const updated = batchFeedbacks.filter((item) => item.id !== id);
    saveFeedbacks(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = batchFeedbacks.map((item) =>
      item.id === id ? { ...item, is_pinned: !item.is_pinned } : item
    );
    saveFeedbacks(updated);
  };

  // Filtered Batch Feedback List
  const filteredBatchFeedbacks = useMemo(() => {
    return batchFeedbacks.filter((item) => {
      const matchesBatch =
        selectedBatchFilter === "all" ||
        item.batch_id === "all" ||
        item.batch_id === selectedBatchFilter;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.batch_name.toLowerCase().includes(q);

      return matchesBatch && matchesSearch;
    });
  }, [batchFeedbacks, selectedBatchFilter, searchQuery]);

  // Tasks that have either student reflections, manager grades, or submission notes
  const feedbackItems = useMemo(() => {
    return tasks.filter((t) => {
      const hasContent =
        Boolean(t.submission_notes) ||
        Boolean(t.student_grade) ||
        Boolean(t.manager_grade) ||
        Boolean(t.final_grade) ||
        t.status === "completed" ||
        t.status === "submitted";
      return hasContent;
    });
  }, [tasks]);

  const filteredTaskItems = useMemo(() => {
    return feedbackItems.filter((t) => {
      const student = teamMembers.find((m) => m.id === t.student_id);
      const matchesBatch =
        selectedBatchFilter === "all" ||
        (student?.batch_id && student.batch_id === selectedBatchFilter) ||
        (student?.batch_name && student.batch_name === selectedBatchFilter);

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(q) ||
        (student?.name && student.name.toLowerCase().includes(q)) ||
        (t.submission_notes && t.submission_notes.toLowerCase().includes(q));

      return matchesBatch && matchesSearch;
    });
  }, [feedbackItems, teamMembers, selectedBatchFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">forum</span>
            <span>Batch Communications &amp; Feedback Center</span>
          </div>
          <h3 className="text-xl font-headline font-bold text-slate-900 tracking-tight">
            Team Mentorship &amp; Feedback
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Broadcast targeted feedback, code standards, and sprint milestones directly to specific teams, while reviewing learner task reflections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsComposeOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4B2EF5] hover:bg-[#3D25C7] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              {isComposeOpen ? "close" : "edit_note"}
            </span>
            <span>{isComposeOpen ? "Close Composer" : "Give Batch Feedback"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {postSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Batch feedback posted and dispatched successfully to team members!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPOSE BATCH FEEDBACK FORM (Interactive Accordion / Card)                 */}
      {/* ========================================================================= */}
      {isComposeOpen && (
        <form
          onSubmit={handleCreateBatchFeedback}
          className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
              <span className="material-symbols-outlined text-primary">rate_review</span>
              <span>Compose Feedback / Commentary to a Batch</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Broadcasts to all students in selected team</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Batch */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Batch / Team *
              </label>
              <select
                value={targetBatchId}
                onChange={(e) => setTargetBatchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary cursor-pointer"
                required
              >
                <option value="all">📢 All Batches / Teams ({teams.length})</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    👥 {t.name} ({t.member_count ?? 0} members)
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Feedback Category
              </label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value as BatchFeedbackItem["category"])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="guidance">💡 Technical Guidance</option>
                <option value="milestone">🎯 Milestone & Velocity</option>
                <option value="commendation">⭐ Recognition & Kudos</option>
                <option value="quality">✨ Code Quality & Standards</option>
                <option value="announcement">📢 Batch Announcement</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <select
                value={feedbackPriority}
                onChange={(e) => setFeedbackPriority(e.target.value as BatchFeedbackItem["priority"])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="normal">Standard Message</option>
                <option value="important">⭐ Important Highlight</option>
                <option value="urgent">🚨 High Priority Action Item</option>
              </select>
            </div>
          </div>

          {/* Subject / Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Feedback Subject / Topic *
            </label>
            <input
              type="text"
              value={feedbackTitle}
              onChange={(e) => setFeedbackTitle(e.target.value)}
              placeholder="e.g., Sprint 1 Code Review Findings & Architecture Best Practices"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Feedback Body */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Feedback Remarks &amp; Action Items *
            </label>
            <textarea
              rows={4}
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Provide constructive feedback, highlight strong code patterns, or specify areas needing refactoring..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#4B2EF5] hover:bg-[#3D25C7] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>{isSubmitting ? "Posting..." : "Post Batch Feedback"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* FILTER & SUB-TAB CONTROLS                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        {/* Sub-tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("batch_feedback")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "batch_feedback"
                ? "bg-[#4B2EF5] text-white shadow-2xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span>Batch Directives &amp; Feedback ({filteredBatchFeedbacks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("task_reflections")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "task_reflections"
                ? "bg-[#4B2EF5] text-white shadow-2xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            <span>Learner Deliverable Reflections ({filteredTaskItems.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5">
          {/* Batch Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 shadow-2xs">
            <span className="material-symbols-outlined text-sm text-[#4B2EF5]">filter_alt</span>
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Batches ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined text-slate-400 text-sm absolute left-2.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="pl-8 pr-3 py-1.5 bg-white text-xs rounded-xl border border-slate-200/80 text-slate-900 focus:outline-none focus:border-primary w-44 sm:w-56 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BATCH FEEDBACK CARDS TIMELINE                                          */}
      {/* ========================================================================= */}
      {activeSubTab === "batch_feedback" && (
        <div className="space-y-4">
          {filteredBatchFeedbacks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">campaign</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-headline">No Batch Feedback Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Post comments or guidance to a particular batch using the &quot;Give Batch Feedback&quot; button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBatchFeedbacks.map((item) => {
                const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.guidance;
                return (
                  <div
                    key={item.id}
                    className={`bg-white p-5 rounded-2xl border transition-all ${
                      item.is_pinned
                        ? "border-indigo-300 ring-1 ring-indigo-200 shadow-sm"
                        : "border-slate-200/80 shadow-2xs hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Batch Badge */}
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 text-white flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">groups</span>
                            <span>{item.batch_name}</span>
                          </span>

                          {/* Category Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${cat.bg} ${cat.text}`}
                          >
                            <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>

                          {/* Priority Badge */}
                          {item.priority === "urgent" && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">priority_high</span>
                              <span>Urgent</span>
                            </span>
                          )}

                          {item.is_pinned && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">push_pin</span>
                              <span>Pinned</span>
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400 font-medium ml-auto">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 font-headline pt-1">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-0.5">
                          {item.message}
                        </p>
                      </div>

                      {/* Action Menu */}
                      <div className="flex items-center gap-1.5 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item.id)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            item.is_pinned
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700"
                          }`}
                          title={item.is_pinned ? "Unpin feedback" : "Pin to top"}
                        >
                          <span className="material-symbols-outlined text-sm">push_pin</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                          title="Delete feedback entry"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">account_circle</span>
                        <span>Author: <strong className="text-slate-600 font-semibold">{item.author_name}</strong></span>
                      </div>
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Delivered to Batch Members</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LEARNER TASK REFLECTIONS FEED                                          */}
      {/* ========================================================================= */}
      {activeSubTab === "task_reflections" && (
        <div>
          {filteredTaskItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">chat</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-headline">No Deliverable Reflections</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                When students complete deliverables and submit self-reflections, they will be catalogued here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTaskItems.map((task) => {
                const student = teamMembers.find((m) => m.id === task.student_id);
                const hasManagerGrade = task.manager_grade !== null && task.manager_grade !== undefined;
                const hasStudentGrade = task.student_grade !== null && task.student_grade !== undefined;

                return (
                  <div
                    key={task.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div>
                      {/* Top Meta */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                          {student?.batch_name || "Assigned Batch"}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() : "Active Sprint"}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 font-headline">{task.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Learner: <strong className="text-slate-800">{student?.name || task.student_name || "Learner"}</strong>
                        {student?.enrollment_no || task.enrollment_no ? ` • ID: ${student?.enrollment_no || task.enrollment_no}` : ""}
                        {task.workflow_name ? ` • Workflow: ${task.workflow_name}` : ""}
                      </p>

                      {/* Student Reflection */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-950 text-[11px] uppercase tracking-wide">
                            Learner Reflection
                          </span>
                          {hasStudentGrade && (
                            <span className="font-mono font-bold text-indigo-700 text-xs">
                              Self: {task.student_grade}/100
                            </span>
                          )}
                        </div>
                        <p className="italic text-slate-600 leading-relaxed">
                          {task.submission_notes ? `"${task.submission_notes}"` : "No reflection provided with submission."}
                        </p>
                      </div>

                      {/* Manager Feedback */}
                      {hasManagerGrade && (
                        <div className="mt-2.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-950 text-[11px] uppercase tracking-wide">
                              Manager Evaluation Score
                            </span>
                            <span className="font-mono font-bold text-indigo-800 text-xs">
                              Grade: {task.manager_grade}/100
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs">
                            Status: <strong className="text-slate-800 uppercase">{task.status}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

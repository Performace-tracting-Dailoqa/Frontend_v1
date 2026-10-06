"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  fetchTeacherBatches,
  fetchTeacherStudents,
  fetchTeacherFeedbackFeed,
  postTeacherFeedback,
  TeacherBatch,
  TeacherStudent,
  TeacherFeedbackItem,
} from "@/services/teacherService";
import TeacherStudentAnalyticsModal from "../TeacherStudentAnalyticsModal";

export default function FeedbackTab() {
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [feedbackFeed, setFeedbackFeed] = useState<TeacherFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected batch & student search state
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [feedSearchQuery, setFeedSearchQuery] = useState("");
  const [feedFilterType, setFeedFilterType] = useState<"all" | "batch" | "student">("all");

  // Post Feedback Modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackTargetType, setFeedbackTargetType] = useState<"batch" | "student">("batch");
  const [targetBatchId, setTargetBatchId] = useState<string>("");
  const [targetStudentId, setTargetStudentId] = useState<string>("");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | undefined>(85);
  const [feedbackJlpt, setFeedbackJlpt] = useState("N5");

  // Student Analytics Modal
  const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = useState<string | null>(null);

  // Toast notification state
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bList, sList, fList] = await Promise.all([
        fetchTeacherBatches().catch(() => []),
        fetchTeacherStudents().catch(() => []),
        fetchTeacherFeedbackFeed().catch(() => []),
      ]);
      setBatches(bList);
      setStudents(sList);
      setFeedbackFeed(fList);
      if (bList.length > 0 && !targetBatchId) {
        setTargetBatchId(bList[0].id);
      }
      if (sList.length > 0 && !targetStudentId) {
        setTargetStudentId(sList[0].id);
      }
    } catch (err) {
      console.warn("Error loading feedback data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter students based on selected batch and search
  const batchStudents = useMemo(() => {
    let list = students;
    if (selectedBatchId !== "all") {
      list = list.filter((s) => s.batch_id === selectedBatchId);
    }
    if (!studentSearchQuery.trim()) return list;

    const q = studentSearchQuery.toLowerCase();
    return list.filter(
      (s) =>
        (s.full_name || s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.enrollment_no || "").toLowerCase().includes(q)
    );
  }, [students, selectedBatchId, studentSearchQuery]);

  const selectedBatchObj = useMemo(() => {
    if (selectedBatchId === "all") return null;
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  // Open modal preconfigured for a batch
  const handleOpenBatchFeedback = (bId: string) => {
    setFeedbackTargetType("batch");
    setTargetBatchId(bId);
    const b = batches.find((x) => x.id === bId);
    setFeedbackTitle(b ? `Cohort Feedback: ${b.name}` : "Batch Feedback");
    setFeedbackText("");
    setShowFeedbackModal(true);
  };

  // Open modal preconfigured for a student
  const handleOpenStudentFeedback = (sId: string, sName: string) => {
    setFeedbackTargetType("student");
    setTargetStudentId(sId);
    setFeedbackTitle(`Mentorship Note: ${sName}`);
    setFeedbackText("");
    setShowFeedbackModal(true);
  };

  const handlePostFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      showToast("Please enter feedback remarks.", "error");
      return;
    }

    const targetId = feedbackTargetType === "batch" ? targetBatchId : targetStudentId;
    if (!targetId) {
      showToast("Please select a target batch or student.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await postTeacherFeedback({
        target_type: feedbackTargetType,
        target_id: targetId,
        title: feedbackTitle.trim() || (feedbackTargetType === "batch" ? "Cohort Feedback" : "Student Feedback"),
        feedback: feedbackText.trim(),
        rating: feedbackRating,
        jlpt_level: feedbackJlpt,
      });

      showToast(res.message || "Feedback posted successfully!", "success");
      setShowFeedbackModal(false);
      setFeedbackText("");
      // Refresh feedback feed
      const updatedFeed = await fetchTeacherFeedbackFeed();
      setFeedbackFeed(updatedFeed);
    } catch (err: any) {
      showToast(err.message || "Failed to post feedback", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Feedback Feed
  const filteredFeed = useMemo(() => {
    return feedbackFeed.filter((item) => {
      const q = feedSearchQuery.toLowerCase();
      const textMatch =
        item.title.toLowerCase().includes(q) ||
        item.feedback.toLowerCase().includes(q) ||
        item.student_name.toLowerCase().includes(q) ||
        item.batch_name.toLowerCase().includes(q);

      const typeMatch =
        feedFilterType === "all" ||
        (feedFilterType === "batch" ? item.is_batch_feedback : !item.is_batch_feedback);

      return textMatch && typeMatch;
    });
  }, [feedbackFeed, feedSearchQuery, feedFilterType]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-sm font-bold opacity-60 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner with Create Feedback Button */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-xs mb-1">
            <span className="material-symbols-outlined text-base">rate_review</span>
            <span>FEEDBACK &amp; MENTORSHIP CENTER</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Cohort &amp; Learner Feedback</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Post qualitative remarks, linguistic recommendations, and milestone feedback to entire batches or individual students.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedbackTargetType("batch");
            setFeedbackTitle("Cohort Feedback & Mentorship Note");
            setFeedbackText("");
            setShowFeedbackModal(true);
          }}
          className="flex items-center gap-1.5 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_comment</span>
          <span>Post Feedback</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. BATCH EXPLORER & STUDENT ROSTER SECTION                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Batches List */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4B2EF5] text-lg">school</span>
                <span>Training Batches ({batches.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Select to view learners</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {/* All Batches Item */}
              <div
                onClick={() => setSelectedBatchId("all")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedBatchId === "all"
                    ? "bg-indigo-50 border-[#4B2EF5] ring-2 ring-[#4B2EF5]/20"
                    : "bg-surface-container/50 border-outline-variant/40 hover:bg-surface-container"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">All Batches Combined</h4>
                  <p className="text-[11px] text-slate-500">{students.length} total enrolled students</p>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
              </div>

              {/* Batch Items */}
              {batches.map((b) => {
                const bLearners = students.filter((s) => s.batch_id === b.id);
                const isSelected = selectedBatchId === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBatchId(b.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-indigo-50 border-[#4B2EF5] ring-2 ring-[#4B2EF5]/20"
                        : "bg-surface-container/50 border-outline-variant/40 hover:bg-surface-container"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#4B2EF5] transition-colors">
                          {b.name}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                          {b.department || "General"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{bLearners.length} learners enrolled</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBatchFeedback(b.id);
                      }}
                      title="Post Feedback to Batch"
                      className="p-1.5 text-xs text-[#4B2EF5] bg-indigo-100 hover:bg-[#4B2EF5] hover:text-white rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm block">send</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/30">
            <button
              onClick={() => {
                setFeedbackTargetType("batch");
                if (selectedBatchId !== "all") setTargetBatchId(selectedBatchId);
                setShowFeedbackModal(true);
              }}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-[#4B2EF5] text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">campaign</span>
              <span>Broadcast Feedback to Batch</span>
            </button>
          </div>
        </div>

        {/* Right Column: Students in Selected Batch + Search */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-lg">groups</span>
                <span>
                  {selectedBatchObj ? `Learners in ${selectedBatchObj.name}` : "All Cohort Learners"} ({batchStudents.length})
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Click a student to view their dossier or give them individual feedback.
              </p>
            </div>

            {/* Student Search Bar */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search student or ID..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20"
              />
            </div>
          </div>

          {/* Student Grid / List */}
          {batchStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">person_search</span>
              <p className="text-xs text-slate-600 font-semibold">No students found matching your selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {batchStudents.map((st) => {
                const stName = st.full_name || st.name || "Student";
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentForAnalytics(st.id)}
                    className="p-3.5 bg-surface-container/40 hover:bg-indigo-50/60 rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#4B2EF5]/15 text-[#4B2EF5] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform shrink-0">
                        {stName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#4B2EF5] transition-colors truncate">
                          {stName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{st.enrollment_no || st.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenStudentFeedback(st.id, stName)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#4B2EF5] text-white hover:bg-[#4B2EF5]/90 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-xs">rate_review</span>
                        <span>Feedback</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHRONOLOGICAL FEEDBACK FEED & REMARKS LEDGER                           */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">forum</span>
              <span>Feedback Feed &amp; Evaluation Logs ({filteredFeed.length})</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              History of all qualitative evaluations, batch broadcasts, and mentorship remarks recorded.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Feed Type Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFeedFilterType("all")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  feedFilterType === "all" ? "bg-white text-[#4B2EF5] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Feed
              </button>
              <button
                type="button"
                onClick={() => setFeedFilterType("batch")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  feedFilterType === "batch" ? "bg-white text-[#4B2EF5] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Batch Broadcasts
              </button>
              <button
                type="button"
                onClick={() => setFeedFilterType("student")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  feedFilterType === "student" ? "bg-white text-[#4B2EF5] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Individual Notes
              </button>
            </div>

            {/* Feed Search Bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search feedback..."
                value={feedSearchQuery}
                onChange={(e) => setFeedSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 w-44 sm:w-52"
              />
            </div>
          </div>
        </div>

        {/* Feedback Feed Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-outline">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin mb-2">sync</span>
            <p>Loading feedback history...</p>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">rate_review</span>
            <p className="text-sm font-semibold text-slate-800">No feedback remarks found</p>
            <p className="text-xs text-slate-500 mt-1">Post your first feedback note to a batch or learner above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeed.map((item) => {
              const isBatch = item.is_batch_feedback;
              return (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/50 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                            isBatch ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-indigo-50 text-[#4B2EF5] border border-indigo-200"
                          }`}
                        >
                          {isBatch ? "Batch Feedback" : "Learner Feedback"}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {item.jlpt_level}
                        </span>
                      </div>

                      {item.percentage !== null && (
                        <span className="font-mono text-xs font-bold text-[#4B2EF5] bg-indigo-50/70 px-2 py-0.5 rounded">
                          {item.percentage}%
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>

                    {/* Feedback Content */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                      &ldquo;{item.feedback}&rdquo;
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        {isBatch ? "school" : "person"}
                      </span>
                      <span className="font-medium text-slate-700 truncate">
                        {isBatch ? item.batch_name : item.student_name}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {item.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. POST FEEDBACK MODAL                                                    */}
      {/* ========================================================================= */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4B2EF5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">rate_review</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">Post Feedback &amp; Mentorship Note</h3>
                  <p className="text-xs text-slate-500">Broadcast to a cohort or evaluate an individual learner</p>
                </div>
              </div>

              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handlePostFeedbackSubmit} className="space-y-4 text-xs">
              {/* Target Type Selector: Batch vs Student */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Feedback Target *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setFeedbackTargetType("batch")}
                    className={`py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      feedbackTargetType === "batch"
                        ? "bg-[#4B2EF5] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">school</span>
                    <span>Entire Batch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackTargetType("student")}
                    className={`py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      feedbackTargetType === "student"
                        ? "bg-[#4B2EF5] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>Individual Learner</span>
                  </button>
                </div>
              </div>

              {/* Target Selector Dropdown */}
              {feedbackTargetType === "batch" ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Cohort Batch *</label>
                  <select
                    value={targetBatchId}
                    onChange={(e) => setTargetBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.department || "General"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Student *</label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.name} ({s.enrollment_no || s.email}) - {s.batch_name || "General"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feedback Title</label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="e.g. Weekly Kanji Mastery Review"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                />
              </div>

              {/* Feedback Remarks Textarea */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feedback Remarks &amp; Recommendations *</label>
                <textarea
                  rows={4}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide qualitative feedback, linguistic strengths, areas for growth, and study advice..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20"
                />
              </div>

              {/* Score & JLPT Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proficiency Score % (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={feedbackRating ?? ""}
                    onChange={(e) => setFeedbackRating(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 85"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">JLPT Target Level</label>
                  <select
                    value={feedbackJlpt}
                    onChange={(e) => setFeedbackJlpt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                  >
                    <option value="N5">JLPT N5 (Beginner)</option>
                    <option value="N4">JLPT N4 (Elementary)</option>
                    <option value="N3">JLPT N3 (Intermediate)</option>
                    <option value="N2">JLPT N2 (Advanced)</option>
                    <option value="N1">JLPT N1 (Fluent)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white font-semibold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>{isSubmitting ? "Posting..." : "Publish Feedback"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Analytics Dossier Modal (When clicking any student) */}
      {selectedStudentForAnalytics && (
        <TeacherStudentAnalyticsModal
          studentId={selectedStudentForAnalytics}
          onClose={() => setSelectedStudentForAnalytics(null)}
          onNavigateToEvaluations={() => {
            setSelectedStudentForAnalytics(null);
          }}
        />
      )}
    </div>
  );
}

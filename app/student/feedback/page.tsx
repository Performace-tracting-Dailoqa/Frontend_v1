"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import SpotlightCard from "@/components/animations/SpotlightCard";
import {
  fetchStudentFeedbacks,
  postStudentFeedbackComment,
  StudentFeedbackItem,
  FeedbackCommentItem,
} from "@/services/workflowService";
import { shortDate } from "@/utils/date";

export default function StudentFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<StudentFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterReviewer, setFilterReviewer] = useState<"all" | "teacher" | "manager">("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Comment Box State per feedback
  const [commentInputs, setCommentInputs] = useState<{ [feedbackId: string]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{ [feedbackId: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<{ [feedbackId: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load feedbacks from backend
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await fetchStudentFeedbacks();
      if (res && res.feedbacks) {
        setFeedbacks(res.feedbacks);
      }
    } catch (err) {
      console.warn("Could not load student feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      if (filterReviewer !== "all" && item.reviewer_type !== filterReviewer) return false;
      if (filterType !== "all" && item.type.toLowerCase() !== filterType.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTopic = item.topic?.toLowerCase().includes(query);
        const matchesFeedback = item.feedback?.toLowerCase().includes(query);
        const matchesReviewer = item.reviewer_name?.toLowerCase().includes(query);
        if (!matchesTopic && !matchesFeedback && !matchesReviewer) return false;
      }
      return true;
    });
  }, [feedbacks, filterReviewer, filterType, searchQuery]);

  // Handle posting a comment on a feedback
  const handlePostComment = async (feedbackId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = (commentInputs[feedbackId] || "").trim();
    if (!commentText) return;

    try {
      setCommentSubmitting((prev) => ({ ...prev, [feedbackId]: true }));
      const res = await postStudentFeedbackComment(feedbackId, commentText);

      if (res && res.comment) {
        // Append comment to local state
        setFeedbacks((prev) =>
          prev.map((fb) =>
            fb.id === feedbackId
              ? { ...fb, comments: [...(fb.comments || []), res.comment] }
              : fb
          )
        );
        // Clear input
        setCommentInputs((prev) => ({ ...prev, [feedbackId]: "" }));
        // Ensure comments are expanded
        setExpandedComments((prev) => ({ ...prev, [feedbackId]: true }));

        setToastMessage({
          type: "success",
          text: "Your comment was posted successfully!",
        });
      }
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      setToastMessage({
        type: "error",
        text: "Could not post comment. Please try again.",
      });
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [feedbackId]: false }));
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Toggle comments expander
  const toggleExpand = (feedbackId: string) => {
    setExpandedComments((prev) => ({ ...prev, [feedbackId]: !prev[feedbackId] }));
  };

  // KPI Calculations
  const totalCount = feedbacks.length;
  const teacherCount = feedbacks.filter((f) => f.reviewer_type === "teacher").length;
  const managerCount = feedbacks.filter((f) => f.reviewer_type === "manager").length;
  const scoredFeedbacks = feedbacks.filter((f) => f.rating_score !== null && f.rating_score !== undefined);
  const avgRating =
    scoredFeedbacks.length > 0
      ? Math.round(scoredFeedbacks.reduce((acc, f) => acc + (f.rating_score || 0), 0) / scoredFeedbacks.length)
      : null;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg ${
              toastMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-red-50 text-red-900 border-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">
                {toastMessage.type === "success" ? "check_circle" : "error"}
              </span>
              <p className="text-sm font-semibold">{toastMessage.text}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-black/5"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase tracking-wider">
              Mentorship Feed
            </span>
            <span className="text-xs text-slate-500 font-medium">Mentor &amp; Sensei Feedback</span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Mentor &amp; Teacher Feedback
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Review detailed feedback from your technical lead, reporting manager, and Japanese language sensei. Reply with comments or ask follow-up questions directly on each feedback note.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block font-medium">Feedback Volume</span>
            <span className="text-xl font-bold text-primary font-mono">
              <CountUp to={totalCount} duration={1.5} suffix=" Records" />
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex flex-col items-center justify-center font-mono font-bold text-base shadow-sm shrink-0">
            <span>{totalCount}</span>
            <span className="text-[10px] font-normal opacity-80">Total</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Feedbacks */}
        <SpotlightCard
          spotlightColor="rgba(75, 46, 245, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Feedback</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">forum</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
              <CountUp to={totalCount} duration={1.2} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Logged across all sprints</p>
          </div>
        </SpotlightCard>

        {/* Card 2: Japanese Sensei Feedback */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Japanese Sensei</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">translate</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
              <CountUp to={teacherCount} duration={1.2} />
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">Language &amp; Keigo notes</p>
          </div>
        </SpotlightCard>

        {/* Card 3: Manager / Tech Lead Reviews */}
        <SpotlightCard
          spotlightColor="rgba(59, 130, 246, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Technical Lead</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">engineering</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
              <CountUp to={managerCount} duration={1.2} />
            </div>
            <p className="text-xs text-blue-700 font-medium mt-1">Workflow &amp; Code reviews</p>
          </div>
        </SpotlightCard>

        {/* Card 4: Average Score */}
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.08)"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Attainment Score</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">star</span>
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-headline">
              {avgRating !== null ? (
                <CountUp to={avgRating} duration={1.2} suffix="%" />
              ) : (
                "88%"
              )}
            </div>
            <p className="text-xs text-amber-700 font-medium mt-1">High Praise &amp; Growth</p>
          </div>
        </SpotlightCard>

      </div>

      {/* Feedback Feed Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-headline">
              Feedback Timeline &amp; Comments
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Read evaluator remarks and participate in 1:1 mentorship dialogue
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
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Reviewer Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              {[
                { id: "all", label: "All Reviewers" },
                { id: "teacher", label: "Japanese Sensei" },
                { id: "manager", label: "Tech Lead" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterReviewer(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filterReviewer === tab.id
                      ? "bg-white text-primary shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Items List */}
        <div className="pt-6 space-y-5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Loading feedback records...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">rate_review</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No feedback found</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {searchQuery || filterReviewer !== "all"
                    ? "Try adjusting your search query or reviewer filter."
                    : "Your mentors haven't recorded feedback yet. Check back after your next evaluation."}
                </p>
              </div>
            </div>
          ) : (
            filteredFeedbacks.map((fb) => {
              const isTeacher = fb.reviewer_type === "teacher";
              const commentList = fb.comments || [];
              const isExpanded = expandedComments[fb.id] || commentList.length > 0;
              const currentInput = commentInputs[fb.id] || "";
              const isSubmitting = commentSubmitting[fb.id] || false;

              const initials = fb.reviewer_name
                .replace("Dr. ", "")
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "M";

              return (
                <div
                  key={fb.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Feedback Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-2xs shrink-0 ${
                          isTeacher
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                            : "bg-gradient-to-br from-indigo-600 to-primary"
                        }`}
                      >
                        {initials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900">
                            {fb.reviewer_name}
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              isTeacher
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}
                          >
                            {fb.reviewer_role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {fb.date ? shortDate(fb.date) : "Active Sprint"} · on:{" "}
                          <strong className="text-slate-800 font-semibold">{fb.topic}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      {fb.rating_score !== null && fb.rating_score !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold font-mono">
                          {fb.rating_score}%
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          fb.rating_type === "exceeds"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : fb.rating_type === "on-track"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {fb.rating_badge}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Message Body */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-slate-800 text-sm leading-relaxed">
                    {fb.feedback}
                  </div>

                  {/* Tags */}
                  {fb.tags && fb.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fb.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Feedback Footer & Comments Toggle */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => toggleExpand(fb.id)}
                      className="flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">chat_bubble</span>
                      <span>
                        {commentList.length > 0
                          ? `${commentList.length} ${commentList.length === 1 ? "Comment" : "Comments"}`
                          : "Reply to Feedback"}
                      </span>
                      <span className="material-symbols-outlined text-sm">
                        {isExpanded ? "expand_less" : "expand_more"}
                      </span>
                    </button>

                    <span className="text-slate-400 font-medium">
                      Logged in Trainee Dossier
                    </span>
                  </div>

                  {/* Comments Thread & Reply Input */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        {/* List of existing comments */}
                        {commentList.length > 0 && (
                          <div className="space-y-2.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                            {commentList.map((cmt) => (
                              <div
                                key={cmt.id}
                                className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-sm">account_circle</span>
                                    {cmt.author_name}
                                    <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {cmt.author_role}
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {cmt.created_at ? shortDate(cmt.created_at) : "Just now"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed pl-5">
                                  {cmt.comment}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Input Form */}
                        <form
                          onSubmit={(e) => handlePostComment(fb.id, e)}
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={currentInput}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [fb.id]: e.target.value }))
                            }
                            placeholder="Write a response, thank your mentor, or ask a clarifying question..."
                            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting || !currentInput.trim()}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
                          >
                            {isSubmitting ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-sm">send</span>
                                <span>Comment</span>
                              </>
                            )}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import SpotlightCard from "@/components/animations/SpotlightCard";
import Magnet from "@/components/animations/Magnet";

interface FeedbackItem {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  reviewerAvatar: string;
  timestamp: string;
  topic: string;
  ratingBadge: string;
  ratingType: "exceeds" | "on-track" | "needs-work";
  comment: string;
  tags: string[];
  type: "Formal Review" | "Micro-Feedback" | "Class Feedback";
  pendingAcknowledgement?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  week: string;
}

const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: "fb-1",
    reviewerName: "Dr. Hiroshi Tanaka",
    reviewerRole: "Senior Mentor & Tech Lead",
    reviewerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    timestamp: "2 hours ago",
    topic: "API Integration & Async Exception Architecture",
    ratingBadge: "Exceeds Expectations",
    ratingType: "exceeds",
    comment:
      "Kanishka demonstrated exceptional foresight when refactoring the authentication endpoints. The error handling mechanism is robust and handles edge cases gracefully. Keep up the high standard of documentation and typing consistency.",
    tags: ["#Architecture", "#CodeQuality", "#NextJsFastAPI"],
    type: "Formal Review",
    pendingAcknowledgement: true,
    week: "Week 12 (Current)",
  },
  {
    id: "fb-2",
    reviewerName: "Yuki Sato",
    reviewerRole: "Japanese Language Sensei",
    reviewerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    timestamp: "Yesterday, 3:45 PM",
    topic: "Business Email Etiquette & Keigo Practice",
    ratingBadge: "On Track",
    ratingType: "on-track",
    comment:
      "Great improvement in keigo usage during our live roleplay session. Your tone was polite and professional. Focus slightly more on humble forms (kenjougo) when addressing external clients.",
    tags: ["#BusinessJapanese", "#Communication", "#JLPTN3"],
    type: "Class Feedback",
    acknowledgedBy: "Kanishka Sharma",
    acknowledgedAt: "17 Sep, 04:15 PM",
    week: "Week 12 (Current)",
  },
  {
    id: "fb-3",
    reviewerName: "Kenji Vance",
    reviewerRole: "Engineering Lead & Manager",
    reviewerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    timestamp: "3 days ago",
    topic: "Sprint 5 Delivery & Performance Gantt Tracker",
    ratingBadge: "Exceeds Expectations",
    ratingType: "exceeds",
    comment:
      "Clean execution on the student overview dashboard. Good attention to enterprise accessibility guidelines and mobile drawer navigation. Ahead of scheduled milestone completion.",
    tags: ["#SprintVelocity", "#FrontendExcellence"],
    type: "Micro-Feedback",
    acknowledgedBy: "Kanishka Sharma",
    acknowledgedAt: "15 Sep, 11:20 AM",
    week: "Week 11",
  },
  {
    id: "fb-4",
    reviewerName: "Dr. Hiroshi Tanaka",
    reviewerRole: "Senior Mentor & Tech Lead",
    reviewerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    timestamp: "Sep 10, 2026",
    topic: "Database ORM & Query Optimization",
    ratingBadge: "On Track",
    ratingType: "on-track",
    comment:
      "Good job avoiding N+1 queries by pre-loading relationships. Continue to profile queries on larger data samples.",
    tags: ["#Database", "#PostgresPerformance"],
    type: "Formal Review",
    acknowledgedBy: "Kanishka Sharma",
    acknowledgedAt: "10 Sep, 06:00 PM",
    week: "Week 10",
  },
];

const INITIAL_REQUESTS = [
  {
    id: "req-1",
    reviewer: "Dr. Hiroshi Tanaka",
    topic: "Security Review on Refresh Token Rotation",
    date: "Sep 18, 2026",
    status: "Pending Review",
    priority: "High",
  },
  {
    id: "req-2",
    reviewer: "Yuki Sato",
    topic: "Pronunciation check for pitch accent on Hiragana batch",
    date: "Sep 16, 2026",
    status: "Completed",
    priority: "Medium",
  },
];

export default function StudentFeedbackPage() {
  const [activeTab, setActiveTab] = useState<"received" | "requested">("received");
  const [filterReviewer, setFilterReviewer] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [quarter, setQuarter] = useState("Q3 2026");

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReviewer, setNewReviewer] = useState("Dr. Hiroshi Tanaka");
  const [newTopic, setNewTopic] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");

  const handleAcknowledge = (id: string) => {
    setFeedbacks((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              pendingAcknowledgement: false,
              acknowledgedBy: "Kanishka Sharma",
              acknowledgedAt: "Just now",
            }
          : item
      )
    );
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const reqItem = {
      id: `req-${Date.now()}`,
      reviewer: newReviewer,
      topic: newTopic,
      date: "Today",
      status: "Pending Review",
      priority: newPriority,
    };

    setRequests([reqItem, ...requests]);
    setIsModalOpen(false);
    setNewTopic("");
    setNewNotes("");
    setActiveTab("requested");
  };

  // Filtered Feedbacks
  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchesReviewer =
      filterReviewer === "All" || item.reviewerName.toLowerCase().includes(filterReviewer.toLowerCase());
    const matchesType = filterType === "All" || item.type === filterType;
    const matchesSearch =
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reviewerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesReviewer && matchesType && matchesSearch;
  });

  const pendingCount = feedbacks.filter((f) => f.pendingAcknowledgement).length;

  return (
    <div className="w-full pb-16">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline font-bold text-3xl text-on-surface">Feedback</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            All feedback received from your mentors, manager, and teachers this quarter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Magnet padding={20} magnetStrength={3}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_comment</span>
              Request Feedback
            </button>
          </Magnet>
        </div>
      </div>

      {/* Row 1: Three Compact Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -3 }}
          className="h-full"
        >
          <SpotlightCard
            spotlightColor="rgba(75, 46, 245, 0.08)"
            className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow flex items-center justify-between h-full"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Feedback</p>
              <h3 className="font-headline font-bold text-3xl text-slate-900 mt-1">
                <CountUp to={feedbacks.length + 20} duration={1.5} />
              </h3>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-xs">trending_up</span> +4 this week
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-2xl">forum</span>
            </div>
          </SpotlightCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          whileHover={{ y: -3 }}
          className="h-full"
        >
          <SpotlightCard
            spotlightColor="rgba(75, 46, 245, 0.08)"
            className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow flex items-center justify-between h-full"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Reviewers</p>
              <h3 className="font-headline font-bold text-3xl text-slate-900 mt-1">
                <CountUp to={3} duration={1.2} />
              </h3>
              <span className="text-xs text-slate-500 mt-1 block">Tanaka, Sato, Vance</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-2xl">supervisor_account</span>
            </div>
          </SpotlightCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          whileHover={{ y: -3 }}
          className="h-full"
        >
          <SpotlightCard
            spotlightColor="rgba(75, 46, 245, 0.08)"
            className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow flex items-center justify-between h-full"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Acknowledgement</p>
              <h3 className="font-headline font-bold text-3xl text-slate-900 mt-1 flex items-center gap-2">
                <CountUp to={pendingCount} duration={1} />
                {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block" />}
              </h3>
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-xs">priority_high</span> Action required
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Tabs */}
        <div className="flex border-b border-surface-container-high gap-6">
          <button
            onClick={() => setActiveTab("received")}
            className={`pb-3 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${
              activeTab === "received"
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            Received ({feedbacks.length})
          </button>
          <button
            onClick={() => setActiveTab("requested")}
            className={`pb-3 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${
              activeTab === "requested"
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            Requested ({requests.length})
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-surface-container-highest/60 p-4 rounded-2xl">
          <div className="flex flex-wrap items-center gap-3">
            {/* Quarter Selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface border border-surface-container-highest shadow-2xs">
              <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
              <span>{quarter}</span>
            </div>

            {/* Reviewer Dropdown */}
            <select
              value={filterReviewer}
              onChange={(e) => setFilterReviewer(e.target.value)}
              aria-label="Filter by Reviewer"
              className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface border border-surface-container-highest shadow-2xs outline-none cursor-pointer"
            >
              <option value="All">All Reviewers</option>
              <option value="Tanaka">Dr. Tanaka (Tech)</option>
              <option value="Sato">Yuki Sato (Japanese)</option>
              <option value="Vance">Kenji Vance (Manager)</option>
            </select>

            {/* Type Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["All", "Formal Review", "Micro-Feedback", "Class Feedback"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterType === t
                      ? "bg-primary text-on-primary shadow-2xs"
                      : "bg-slate-50 text-on-surface-variant border border-surface-container-highest hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl gap-2 border border-surface-container-highest shadow-2xs w-full md:w-64">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback notes..."
              className="bg-transparent text-xs text-on-surface focus:outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Received View */}
      {activeTab === "received" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Feedbacks Timeline */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-white border border-surface-container-highest/60 rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
                  feedback
                </span>
                <p className="text-on-surface font-semibold text-base">No feedback found</p>
                <p className="text-on-surface-variant text-xs mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              filteredFeedbacks.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl p-6 shadow-xs relative transition-all ${
                    item.pendingAcknowledgement
                      ? "border-primary shadow-indigo-500/5 ring-1 ring-primary/20"
                      : "border-surface-container-highest/70"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-primary text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 border border-slate-200">
                        {item.reviewerName
                          .replace("Dr. ", "")
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-headline font-bold text-base text-on-surface">
                            {item.reviewerName}
                          </h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-medium">
                            {item.reviewerRole}
                          </span>
                          {item.pendingAcknowledgement && (
                            <span className="w-2 h-2 rounded-full bg-primary inline-block" title="Unread" />
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {item.timestamp} · on:{" "}
                          <span className="text-primary font-semibold">{item.topic}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.ratingType === "exceeds"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.ratingType === "on-track"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.ratingBadge}
                    </span>
                  </div>

                  {/* Feedback Text */}
                  <p className="text-body-md text-slate-800 leading-relaxed mb-4">
                    {item.comment}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer & Acknowledgement */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {item.pendingAcknowledgement ? (
                      <>
                        <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">warning</span> Action Required: Please acknowledge receipt
                        </span>
                        <button
                          onClick={() => handleAcknowledge(item.id)}
                          className="px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-2xs cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                          Acknowledged by {item.acknowledgedBy} · {item.acknowledgedAt}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Logged in appraisal portfolio</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Mini Reviewer Breakdown */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white border border-surface-container-highest/70 rounded-2xl p-6 shadow-xs">
              <h3 className="font-headline font-bold text-base text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">star</span>
                Reviewer Summary
              </h3>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs">
                      HT
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Dr. Hiroshi Tanaka</p>
                      <span className="text-xs text-on-surface-variant">12 feedbacks logged</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-500 flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-sm">star</span> 4.9
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">High Praise</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs">
                      YS
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Yuki Sato (Sensei)</p>
                      <span className="text-xs text-on-surface-variant">8 feedbacks logged</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-500 flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-sm">star</span> 4.8
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium">N3 On Track</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      KV
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Kenji Vance (Manager)</p>
                      <span className="text-xs text-on-surface-variant">4 feedbacks logged</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-500 flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-sm">star</span> 5.0
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Excellent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
                <span className="material-symbols-outlined text-lg">lightbulb</span>
                Self-Appraisal Tip
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Acknowledged feedback is automatically summarized into your <strong>Quarterly Self-Evaluation</strong> draft, giving you tangible proof of sprint contributions and rapid learning agility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requested Feedback View */}
      {activeTab === "requested" && (
        <div className="bg-white border border-surface-container-highest/70 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface">Feedback Requests</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Track outbox review requests submitted to mentors and managers.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-medium text-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New Request
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/70">
                <tr>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Topic / Deliverable</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">person</span>
                      {r.reviewer}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{r.topic}</td>
                    <td className="py-3.5 px-4 text-slate-500">{r.date}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                          r.priority === "High"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                          r.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-primary hover:underline font-semibold cursor-pointer">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined">add_comment</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Request Feedback</h3>
                <p className="text-xs text-on-surface-variant">Ask your mentor or sensei for targeted guidance</p>
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Reviewer</label>
                <select
                  value={newReviewer}
                  onChange={(e) => setNewReviewer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Dr. Hiroshi Tanaka">Dr. Hiroshi Tanaka (Technical Lead)</option>
                  <option value="Yuki Sato">Yuki Sato (Japanese Language Sensei)</option>
                  <option value="Kenji Vance">Kenji Vance (Engineering Manager)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic / Deliverable</label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Authentication middleware PR review or JLPT N3 vocabulary"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specific Questions & Context</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Please highlight key areas where you would like constructive critique..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                <div className="flex gap-3">
                  {["Normal", "Medium", "High"].map((p) => (
                    <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={newPriority === p}
                        onChange={(e) => setNewPriority(e.target.value)}
                        className="text-primary"
                      />
                      <span className="text-slate-700 font-medium">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary/90 shadow-sm cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

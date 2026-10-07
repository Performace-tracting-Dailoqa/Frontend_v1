"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";

interface NotificationItem {
  id: string;
  category: "deadline" | "feedback" | "evaluation" | "class" | "report";
  title: string;
  description: string;
  timestamp: string;
  timeGroup: "Today" | "This Week" | "Earlier";
  unread: boolean;
  actionLabel?: string;
  actionHref?: string;
  priority?: "urgent" | "normal";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    category: "deadline",
    title: "Self Evaluation due in 24 hours",
    description: "The Q3 self-appraisal submission deadline is tomorrow at 5:00 PM JST. Please complete all rubric ratings and reflection goals.",
    timestamp: "2 hours ago",
    timeGroup: "Today",
    unread: true,
    priority: "urgent",
    actionLabel: "Complete Self-Evaluation",
    actionHref: "/student/learning-progress",
  },
  {
    id: "notif-2",
    category: "feedback",
    title: "New feedback from Mentor Dr. Tanaka",
    description: "Dr. Tanaka left constructive feedback and commended your API exception handling refactor.",
    timestamp: "4 hours ago",
    timeGroup: "Today",
    unread: true,
    actionLabel: "Review & Acknowledge",
    actionHref: "/student/feedback",
  },
  {
    id: "notif-3",
    category: "evaluation",
    title: "Q3 Appraisal Cycle Opened",
    description: "Manager approval workflow has been initiated. You can now track your peer feedback and mentor assessment progress.",
    timestamp: "6 hours ago",
    timeGroup: "Today",
    unread: true,
    actionLabel: "View Evaluation Status",
    actionHref: "/student/learning-progress",
  },
  {
    id: "notif-4",
    category: "report",
    title: "Monthly Progress Report Ready (August)",
    description: "Your comprehensive Gantt chart and task completion scorecard for August 2026 has been compiled.",
    timestamp: "2 days ago",
    timeGroup: "This Week",
    unread: false,
    actionLabel: "Inspect Report",
    actionHref: "/student/reports",
  },
  {
    id: "notif-5",
    category: "class",
    title: "Cloud Microservices Architecture Session Scheduled",
    description: "Lead Architect Dr. Tanaka has scheduled your weekly systems design sprint for Thursday at 10:00 AM JST on Microsoft Teams.",
    timestamp: "3 days ago",
    timeGroup: "This Week",
    unread: false,
    actionLabel: "View Learning Roadmap",
    actionHref: "/student/learning-progress",
  },
  {
    id: "notif-6",
    category: "evaluation",
    title: "Q2 Evaluation Cycle Officially Closed",
    description: "Your Q2 performance rating of 4.80 / 5.0 has been finalized by HR and archived into your permanent trainee record.",
    timestamp: "2 weeks ago",
    timeGroup: "Earlier",
    unread: false,
    actionLabel: "View Archive",
    actionHref: "/student/reports",
  },
];

type NotificationFilter = "all" | "unread" | "deadline" | "feedback" | "evaluation" | "class" | "report";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Preference Toggles
  const [preferences, setPreferences] = useState({
    deadlines: true,
    feedback: true,
    evaluations: true,
    classes: true,
    reports: false,
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSavePreferences = () => {
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return n.unread;
    if (filter === "all") return true;
    return n.category === filter;
  });

  const timeGroups: ("Today" | "This Week" | "Earlier")[] = ["Today", "This Week", "Earlier"];

  return (
    <div className="w-full pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline font-bold text-3xl text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-xs font-bold shadow-2xs">
                <CountUp to={unreadCount} duration={1} /> unread
              </span>
            )}
          </div>
          <p className="text-body-md text-on-surface-variant mt-1">
            Deadlines, mentor feedback alerts, appraisal reminders, and live classes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface bg-white hover:bg-slate-50 border border-surface-container-highest shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-slate-500">done_all</span>
            Mark all as read
          </button>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-primary bg-primary hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">settings</span>
            Notification Settings
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: "all", label: "All" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "deadline", label: "Deadlines" },
          { id: "feedback", label: "Feedback" },
          { id: "evaluation", label: "Evaluations" },
          { id: "class", label: "Classes" },
          { id: "report", label: "Reports" },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id as NotificationFilter)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              filter === chip.id
                ? "bg-primary text-on-primary shadow-2xs"
                : "bg-white text-on-surface-variant border border-surface-container-highest hover:bg-slate-100"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main Content: Notifications Feed + Preferences Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Notifications grouped by Time */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {filtered.length === 0 ? (
            <div className="bg-white border border-surface-container-highest/60 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <span className="material-symbols-outlined text-3xl">notifications_off</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface">You&apos;re all caught up!</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                No notifications match your current filter. Enjoy your productive sprint!
              </p>
              <button
                onClick={() => setFilter("all")}
                className="mt-4 text-xs font-semibold text-primary hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            timeGroups.map((group) => {
              const groupItems = filtered.filter((n) => n.timeGroup === group);
              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {group}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {groupItems.map((n) => {
                      let iconName = "notifications";
                      let iconBg = "bg-primary-fixed text-on-primary-fixed";

                      if (n.category === "deadline") {
                        iconName = "schedule";
                        iconBg = n.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
                      } else if (n.category === "feedback") {
                        iconName = "rate_review";
                        iconBg = "bg-indigo-100 text-indigo-700";
                      } else if (n.category === "evaluation") {
                        iconName = "assignment";
                        iconBg = "bg-purple-100 text-purple-700";
                      } else if (n.category === "class") {
                        iconName = "translate";
                        iconBg = "bg-emerald-100 text-emerald-700";
                      } else if (n.category === "report") {
                        iconName = "bar_chart";
                        iconBg = "bg-blue-100 text-blue-700";
                      }

                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ x: 4 }}
                          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex items-start gap-4 relative group ${
                            n.unread
                              ? "border-primary shadow-indigo-500/5 ring-1 ring-primary/20"
                              : "border-slate-200/80 hover:border-slate-300"
                          }`}
                        >
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-lg">{iconName}</span>
                          </div>

                          {/* Body */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-on-surface truncate">
                                  {n.title}
                                </h3>
                                {n.unread && (
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 whitespace-nowrap">{n.timestamp}</span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed mb-3">
                              {n.description}
                            </p>

                            <div className="flex items-center justify-between">
                              {n.actionLabel && n.actionHref && (
                                <Link
                                  href={n.actionHref}
                                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                                >
                                  <span>{n.actionLabel}</span>
                                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                              )}

                              <div className="flex items-center gap-2 ml-auto">
                                <button
                                  onClick={() => handleToggleRead(n.id)}
                                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100"
                                >
                                  {n.unread ? "Mark as read" : "Mark unread"}
                                </button>
                                <button
                                  onClick={() => handleDismiss(n.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                  title="Dismiss notification"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 4 Cols: Preferences Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-surface-container-highest/60 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">tune</span>
                Channel Preferences
              </h3>
              <span className="text-[11px] text-slate-400">In-App & Email</span>
            </div>

            <p className="text-xs text-on-surface-variant mb-5">
              Customize which notifications trigger instant alerts in your portal dashboard.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Deadline reminders</p>
                  <span className="text-[11px] text-slate-400">24h & 2h before appraisal cutoffs</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.deadlines}
                  onChange={(e) => setPreferences({ ...preferences, deadlines: e.target.checked })}
                  className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Feedback received</p>
                  <span className="text-[11px] text-slate-400">Notes from Tanaka, Sato, or Vance</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.feedback}
                  onChange={(e) => setPreferences({ ...preferences, feedback: e.target.checked })}
                  className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Appraisal stage changes</p>
                  <span className="text-[11px] text-slate-400">Self-eval, mentor, manager sign-offs</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.evaluations}
                  onChange={(e) => setPreferences({ ...preferences, evaluations: e.target.checked })}
                  className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Japanese live sessions</p>
                  <span className="text-[11px] text-slate-400">Oral keigo drill reminders</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.classes}
                  onChange={(e) => setPreferences({ ...preferences, classes: e.target.checked })}
                  className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Monthly report generation</p>
                  <span className="text-[11px] text-slate-400">Gantt and attendance dossier ready</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.reports}
                  onChange={(e) => setPreferences({ ...preferences, reports: e.target.checked })}
                  className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                />
              </div>
            </div>

            {savedSettingsNotice && (
              <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold text-center animate-in fade-in">
                Preferences saved successfully!
              </div>
            )}

            <button
              onClick={handleSavePreferences}
              className="mt-6 w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 transition-all shadow-2xs cursor-pointer"
            >
              Save Notification Preferences
            </button>
          </div>

          {/* Quick FAQ / Digest Box */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200 rounded-2xl p-6 shadow-xs text-xs">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">forward_to_inbox</span>
              Daily Email Digest
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Every morning at 08:30 AM JST, a consolidated digest is dispatched with your top 3 milestone goals, mentor notes, and daily Japanese vocabulary cards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationItem {
  id: string;
  category: "System" | "Organisations" | "Approvals" | "Cycle Activity" | "Access Requests" | "Billing" | "Integrations";
  title: string;
  message: string;
  orgName: string;
  orgCode: string;
  timestamp: string;
  isRead: boolean;
  priority: "critical" | "warning" | "info";
  actionType?: "approval" | "inspect" | "link";
  actionLabel?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    category: "System",
    title: "Database Latency Spike Detected",
    message: "Supabase primary node replication lag spiked to 410ms during peak batch assessment upload.",
    orgName: "Platform Infrastructure",
    orgCode: "PL",
    timestamp: "12 mins ago",
    isRead: false,
    priority: "critical",
    actionType: "inspect",
    actionLabel: "Inspect Telemetry",
  },
  {
    id: "notif-2",
    category: "Approvals",
    title: "Quota Expansion Request (+100 Seats)",
    message: "MiRai Language Institute requested tier elevation to 500 active learner seats for upcoming JLPT intake.",
    orgName: "MiRai Language Institute",
    orgCode: "MLI",
    timestamp: "35 mins ago",
    isRead: false,
    priority: "warning",
    actionType: "approval",
    actionLabel: "Approve Quota",
  },
  {
    id: "notif-3",
    category: "Cycle Activity",
    title: "Q3 Evaluation Cycle Completed",
    message: "Global Tech Innovations closed Q3 teacher evaluation cycle with 98.4% submission compliance.",
    orgName: "Global Tech Innovations",
    orgCode: "GTI",
    timestamp: "1 hour ago",
    isRead: false,
    priority: "info",
    actionType: "inspect",
    actionLabel: "View Report",
  },
  {
    id: "notif-4",
    category: "Access Requests",
    title: "Faculty Elevation Request",
    message: "Arthur Vance requested temporary superuser view-as privileges for curriculum audit.",
    orgName: "MiRai Language Institute",
    orgCode: "MLI",
    timestamp: "2 hours ago",
    isRead: false,
    priority: "warning",
    actionType: "approval",
    actionLabel: "Review Access",
  },
  {
    id: "notif-5",
    category: "Billing",
    title: "Storage Quota Warning (90%)",
    message: "NeoTech Osaka Consortium audio recording archive reached 90GB of 100GB licensed allocation.",
    orgName: "NeoTech Osaka Consortium",
    orgCode: "NOC",
    timestamp: "4 hours ago",
    isRead: false,
    priority: "warning",
    actionType: "inspect",
    actionLabel: "Manage Limits",
  },
  {
    id: "notif-6",
    category: "Organisations",
    title: "New Academic Tenant Provisioned",
    message: "Kyoto Digital Academy completed tenant onboarding and SAML 2.0 Microsoft Entra ID verification.",
    orgName: "Kyoto Digital Academy",
    orgCode: "KDA",
    timestamp: "Yesterday",
    isRead: false,
    priority: "info",
  },
  {
    id: "notif-7",
    category: "Integrations",
    title: "Microsoft Teams Bot Handshake Re-verified",
    message: "Teams webhook telemetry channel re-authenticated successfully for cross-tenant oral assessments.",
    orgName: "Platform Infrastructure",
    orgCode: "PL",
    timestamp: "Yesterday",
    isRead: false,
    priority: "info",
  },
];

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewState, setViewState] = useState<"live" | "empty">("live");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showBroadcastToast, setShowBroadcastToast] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkItemRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    setShowBroadcastToast(true);
    setTimeout(() => setShowBroadcastToast(false), 3000);
    setBroadcastMessage("");
  };

  const filteredNotifications = notifications.filter((item) => {
    if (viewState === "empty") return false;
    if (selectedOrgFilter !== "all" && item.orgName !== selectedOrgFilter) return false;
    if (activeCategory === "unread" && item.isRead) return false;
    if (activeCategory !== "all" && activeCategory !== "unread" && item.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.orgName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* 1. TOP LEVEL NOTIFICATION HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>{unreadCount} Unread</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
              Cross-Tenant Scope
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide alerts, approvals, and system activity across every registered organisation.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live / Empty Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewState("live")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewState === "live" ? "bg-white text-primary shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              Live Stream ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setViewState("empty")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewState === "empty" ? "bg-white text-primary shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              Simulate Empty
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-primary">done_all</span>
            <span>Mark all read</span>
          </motion.button>
        </div>
      </div>

      {/* 2. FILTER & QUERY CONTROL BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Org Selector & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Organisations (4)</option>
              <option value="MiRai Language Institute">MiRai Language Institute</option>
              <option value="Global Tech Innovations">Global Tech Innovations</option>
              <option value="Kyoto Digital Academy">Kyoto Digital Academy</option>
              <option value="NeoTech Osaka Consortium">NeoTech Osaka Consortium</option>
            </select>

            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search notifications by keyword, org, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Quick Triage SLA Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">SLA Health:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              1 Degraded
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[11px]">
              1 Action Req.
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
          {[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "System", label: "System" },
            { id: "Organisations", label: "Organisations" },
            { id: "Approvals", label: "Approvals" },
            { id: "Cycle Activity", label: "Cycle Activity" },
            { id: "Access Requests", label: "Access Requests" },
            { id: "Billing", label: "Billing" },
            { id: "Integrations", label: "Integrations" },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveCategory(chip.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === chip.id
                  ? "bg-[#4B2EF5] text-white shadow-xs font-bold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN GRID: 8 COLS FEED + 4 COLS PREFERENCES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Feed */}
        <div className="lg:col-span-8 space-y-3">
          {viewState === "empty" || filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">You&apos;re all caught up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are no pending platform alerts, unreviewed anomalies, or tenant quota warnings right now.
              </p>
              <button
                type="button"
                onClick={() => setViewState("live")}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-[#3d24c8] cursor-pointer"
              >
                Switch back to Live Stream
              </button>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-4 rounded-2xl border transition-all ${
                  n.isRead
                    ? "bg-white/70 border-slate-200/70"
                    : "bg-white border-slate-200/90 shadow-xs ring-1 ring-primary/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        n.priority === "critical"
                          ? "bg-rose-50 text-rose-600"
                          : n.priority === "warning"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {n.priority === "critical"
                          ? "warning"
                          : n.priority === "warning"
                          ? "notification_important"
                          : "info"}
                      </span>
                    </span>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {n.orgName} [{n.orgCode}]
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">
                        {n.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMarkItemRead(n.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title={n.isRead ? "Mark unread" : "Mark read"}
                    >
                      <span className="material-symbols-outlined text-base">
                        {n.isRead ? "mark_email_unread" : "check"}
                      </span>
                    </button>
                  </div>
                </div>

                {n.actionType && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {n.actionType === "approval" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMarkItemRead(n.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkItemRead(n.id)}
                          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-[#3d24c8] text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          {n.actionLabel || "Approve"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-bold cursor-pointer"
                      >
                        {n.actionLabel || "Inspect"}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column (4 cols): Notification Preferences & Broadcast */}
        <div className="lg:col-span-4 space-y-4">
          {/* Notification Channels Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Notification Channels
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">mail</span>
                  <span className="font-semibold text-slate-800">Email Routing</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-sky-600">chat</span>
                  <span className="font-semibold text-slate-800">Slack (#super-alerts)</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-indigo-600">emergency</span>
                  <span className="font-semibold text-slate-800">PagerDuty Tier-0</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Armed
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#505F76]">video_camera_front</span>
                  <span className="font-semibold text-slate-800">Microsoft Teams</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Platform Broadcast */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Emergency Broadcast
            </h3>
            <p className="text-xs text-slate-500">
              Broadcast an immediate banner alert to all active tenant dashboards and evaluator sessions.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <textarea
                rows={3}
                placeholder="e.g. Scheduled platform database migration at 02:00 UTC. Brief 2-min read-only window expected."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />

              <div className="flex items-center justify-between">
                <AnimatePresence>
                  {showBroadcastToast && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] text-emerald-600 font-bold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Broadcast Sent!
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Send Broadcast
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

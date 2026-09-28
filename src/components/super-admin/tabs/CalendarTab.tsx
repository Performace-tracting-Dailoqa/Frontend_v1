"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_ORGANISATIONS } from "../mockData";

interface CalendarEvent {
  id: string;
  title: string;
  orgName: string;
  orgCode: string;
  time: string;
  date: string; // e.g. "Oct 19, 2026"
  category: "infrastructure" | "workshop" | "evaluation" | "sync" | "billing";
  categoryLabel: string;
  googleMeetUrl?: string;
  attendees: Array<{ name: string; email: string; initials: string }>;
  description?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "AWS DB Cluster Maintenance",
    orgName: "Platform Infrastructure HQ",
    orgCode: "PL",
    time: "02:00 UTC",
    date: "Oct 5, 2026",
    category: "infrastructure",
    categoryLabel: "Platform Maintenance",
    description: "Multi-AZ PostgreSQL cluster patching and failover health verification.",
    attendees: [
      { name: "Marcus Brody", email: "admin@dailoqa.com", initials: "MB" },
      { name: "SRE Bot", email: "sre-infra@dailoqa.com", initials: "SR" },
    ],
  },
  {
    id: "evt-2",
    title: "JLPT N3 Batch Keigo Etiquette Workshop",
    orgName: "MiRai Language Institute",
    orgCode: "MLI",
    time: "05:30 UTC",
    date: "Oct 8, 2026",
    category: "workshop",
    categoryLabel: "Batch Workshop",
    googleMeetUrl: "https://meet.google.com/abc-mirai-n3",
    description: "Oral business Japanese keigo masterclass with peer evaluations.",
    attendees: [
      { name: "Prof. Arthur Vance", email: "vance@mirai.ac.jp", initials: "AV" },
      { name: "Kanishka Sharma", email: "k.sharma@mirai.ac.jp", initials: "KS" },
    ],
  },
  {
    id: "evt-3",
    title: "Acme Corp Q3 Self-Evaluations Open",
    orgName: "Global Tech Innovations",
    orgCode: "GTI",
    time: "10:00 UTC",
    date: "Oct 12, 2026",
    category: "evaluation",
    categoryLabel: "Evaluation Cycle",
    description: "Launch of trainee self-evaluations across Tokyo engineering cohorts.",
    attendees: [
      { name: "Elena Rostova", email: "e.rostova@globaltech.io", initials: "ER" },
    ],
  },
  {
    id: "evt-4",
    title: "Kyoto Digital Mid-Quarter Progress Review",
    orgName: "Kyoto Digital Academy",
    orgCode: "KDA",
    time: "08:00 UTC",
    date: "Oct 15, 2026",
    category: "workshop",
    categoryLabel: "Evaluation Review",
    googleMeetUrl: "https://meet.google.com/kda-prog-rev",
    description: "Cross-department performance checkpoints and mentor ratings.",
    attendees: [
      { name: "Samantha Vance", email: "s.vance@kyotodigital.edu", initials: "SV" },
    ],
  },
  {
    id: "evt-5",
    title: "Global SRE & Superuser Infrastructure Sync",
    orgName: "Dailoqa Master Infrastructure",
    orgCode: "PL",
    time: "13:00 UTC",
    date: "Oct 19, 2026",
    category: "sync",
    categoryLabel: "Superuser Direct",
    googleMeetUrl: "https://meet.google.com/sre-super-sync",
    description: "Bi-weekly superuser cross-tenant performance check and database metrics.",
    attendees: [
      { name: "Marcus Brody", email: "admin@dailoqa.com", initials: "MB" },
      { name: "Ayush V Panicker", email: "ayush.v.panicker@dailoqa.com", initials: "AP" },
    ],
  },
  {
    id: "evt-6",
    title: "NeoTech Enterprise Plan Grace Period Ends",
    orgName: "NeoTech Osaka Consortium",
    orgCode: "NOC",
    time: "23:59 UTC",
    date: "Oct 21, 2026",
    category: "billing",
    categoryLabel: "Billing Cap Deadline",
    description: "Final invoice settlement notice before storage quota tier restriction.",
    attendees: [
      { name: "Kenji Sato", email: "k.sato@neotech-osaka.co.jp", initials: "KS" },
    ],
  },
  {
    id: "evt-7",
    title: "JLPT N2 Oral Fluency Live Mock Exam",
    orgName: "MiRai Language Institute",
    orgCode: "MLI",
    time: "09:00 UTC",
    date: "Oct 26, 2026",
    category: "workshop",
    categoryLabel: "Cohort Exam",
    googleMeetUrl: "https://meet.google.com/mirai-n2-exam",
    description: "Faculty proctored oral evaluation with Teams recordings enabled.",
    attendees: [
      { name: "Prof. Arthur Vance", email: "vance@mirai.ac.jp", initials: "AV" },
      { name: "Amelia Earhart", email: "amelia@mirai.ac.jp", initials: "AE" },
    ],
  },
];

export default function CalendarTab() {
  // Calendar dynamic date state (defaulting to October 2026 matching system mock timeline)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDay, setSelectedDay] = useState<number>(19); // Oct 19 is active today

  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [scopeFilter, setScopeFilter] = useState<"all" | "org" | "my">("all");
  const [connectionState, setConnectionState] = useState<"connected" | "disconnected" | "error">("connected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState("");
  const [newOrg, setNewOrg] = useState(MOCK_ORGANISATIONS[0].name);
  const [newDate, setNewDate] = useState("Oct 19, 2026");
  const [newTime, setNewTime] = useState("10:00 UTC");
  const [newCategory, setNewCategory] = useState<CalendarEvent["category"]>("sync");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Helper date calculations
  const monthName = MONTH_NAMES[currentMonth];
  const shortMonth = SHORT_MONTHS[currentMonth];
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Monday-based first day of month (0 = Mon, 6 = Sun)
  const firstDayOfMonth = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Selected date formatted
  const selectedDateStr = `${shortMonth} ${selectedDay}, ${currentYear}`;

  // Month navigation handlers
  const handlePrev = () => {
    if (viewMode === "day") {
      if (selectedDay > 1) {
        setSelectedDay((d) => d - 1);
      } else {
        const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
        const daysInPrev = new Date(prevY, prevM + 1, 0).getDate();
        setCurrentMonth(prevM);
        setCurrentYear(prevY);
        setSelectedDay(daysInPrev);
      }
      return;
    }

    if (viewMode === "week") {
      if (selectedDay > 7) {
        setSelectedDay((d) => d - 7);
      } else {
        const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
        const daysInPrev = new Date(prevY, prevM + 1, 0).getDate();
        setCurrentMonth(prevM);
        setCurrentYear(prevY);
        setSelectedDay(Math.max(1, daysInPrev - 7));
      }
      return;
    }

    // Month view navigation
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    showToast(`Navigated to ${MONTH_NAMES[currentMonth === 0 ? 11 : currentMonth - 1]} ${currentMonth === 0 ? currentYear - 1 : currentYear}`);
  };

  const handleNext = () => {
    if (viewMode === "day") {
      if (selectedDay < daysInCurrentMonth) {
        setSelectedDay((d) => d + 1);
      } else {
        const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
        setCurrentMonth(nextM);
        setCurrentYear(nextY);
        setSelectedDay(1);
      }
      return;
    }

    if (viewMode === "week") {
      if (selectedDay + 7 <= daysInCurrentMonth) {
        setSelectedDay((d) => d + 7);
      } else {
        const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
        setCurrentMonth(nextM);
        setCurrentYear(nextY);
        setSelectedDay(1);
      }
      return;
    }

    // Month view navigation
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    showToast(`Navigated to ${MONTH_NAMES[currentMonth === 11 ? 0 : currentMonth + 1]} ${currentMonth === 11 ? currentYear + 1 : currentYear}`);
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9); // October
    setSelectedDay(19);
    showToast("Returned to today: Oct 19, 2026");
  };

  const handleQuickSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime("Just now");
      showToast("Google Workspace bi-directional calendar sync verified.");
    }, 1100);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const orgRecord = MOCK_ORGANISATIONS.find((o) => o.name === newOrg);
    const createdEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle,
      orgName: newOrg,
      orgCode: orgRecord?.code || "ORG",
      time: newTime,
      date: newDate,
      category: newCategory,
      categoryLabel:
        newCategory === "sync"
          ? "Superuser Direct"
          : newCategory === "workshop"
          ? "Cohort Workshop"
          : newCategory === "evaluation"
          ? "Evaluation Cycle"
          : "Platform Maintenance",
      googleMeetUrl: `https://meet.google.com/${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
      attendees: [
        { name: "Marcus Brody", email: "admin@dailoqa.com", initials: "MB" },
        { name: "Staff Member", email: "staff@dailoqa.com", initials: "SM" },
      ],
      description: "Synchronized cross-tenant event created via Superuser Console.",
    };

    setEvents((prev) => [createdEvent, ...prev]);
    setIsNewEventModalOpen(false);
    setNewTitle("");
    showToast(`Scheduled: "${createdEvent.title}" on ${createdEvent.date}`);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
    showToast("Event cancelled and removed from Google Calendar.");
  };

  const filteredEvents = events.filter((evt) => {
    if (scopeFilter === "my") {
      return evt.category === "sync" || evt.attendees.some((a) => a.email.includes("admin@dailoqa.com"));
    }
    if (scopeFilter === "org") {
      return evt.orgCode !== "PL";
    }
    return true;
  });

  // Events on selected day
  const selectedDayEvents = filteredEvents.filter((e) => e.date === selectedDateStr);

  // Week calculation for week view
  const weekStartDay = Math.max(1, selectedDay - 3);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = weekStartDay + i;
    return d <= daysInCurrentMonth ? d : null;
  }).filter(Boolean) as number[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* 1. TOP HERO & CONNECTION STATUS HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div className="flex flex-col space-y-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Google Calendar</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide">
              SUPERUSER OVERLAY
            </span>
            <span className="text-xs text-slate-400 font-medium">· Last synced {lastSyncTime}</span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            Platform-wide meetings, evaluation deadlines, and system telemetry events synchronized bi-directionally with Google Workspace Enterprise.
          </p>
        </div>

        {/* Diagnostics & State Simulator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs shadow-2xs">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.665-5.18 3.665-9.12z" fill="#4285F4" />
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.36 24 12 24z" fill="#34A853" />
              <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.13z" fill="#FBBC05" />
              <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.6 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335" />
            </svg>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connectionState === "connected" ? "bg-emerald-400" : connectionState === "disconnected" ? "bg-amber-400" : "bg-red-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                connectionState === "connected" ? "bg-emerald-500" : connectionState === "disconnected" ? "bg-amber-500" : "bg-red-500"
              }`} />
            </span>
            <span className="font-semibold text-slate-800">
              {connectionState === "connected" ? "admin@dailoqa.com (Online)" : connectionState === "disconnected" ? "Offline Cache" : "Auth Token Expired"}
            </span>
          </div>

          {/* Quick Sync */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleQuickSync}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <span className={`material-symbols-outlined text-base text-primary ${isSyncing ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>{isSyncing ? "Syncing..." : "Sync now"}</span>
          </motion.button>

          {/* Connection Simulator */}
          <select
            value={connectionState}
            onChange={(e) => {
              const s = e.target.value as "connected" | "disconnected" | "error";
              setConnectionState(s);
              showToast(`Sync Gateway switched to: ${s}`);
            }}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="connected">State: Connected</option>
            <option value="disconnected">State: Disconnected</option>
            <option value="error">State: Token Expired</option>
          </select>
        </div>
      </div>

      {/* CONDITIONAL WARNING BANNERS */}
      {connectionState === "disconnected" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-amber-600">cloud_off</span>
            <div>
              <p className="font-bold">Google Workspace Disconnected</p>
              <p className="text-amber-700">Cross-tenant aggregation is cached from last sync. Connect an enterprise OAuth identity to resume.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setConnectionState("connected");
              showToast("Google Workspace reconnected!");
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Reconnect
          </button>
        </div>
      )}

      {connectionState === "error" && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-red-600">error</span>
            <div>
              <p className="font-bold">Google OAuth Token Invalidation</p>
              <p className="text-red-700">Refresh token expired for `admin@dailoqa.com`. Sync engine halted.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setConnectionState("connected");
              showToast("OAuth credentials re-authenticated!");
            }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Re-authenticate
          </button>
        </div>
      )}

      {/* 2. CALENDAR TOOLBAR & CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: View Mode Pills & Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            {(["month", "week", "day"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setViewMode(m);
                  showToast(`Switched to ${m} view`);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  viewMode === m
                    ? "bg-white text-primary shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              title="Previous"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button
              onClick={handleNext}
              title="Next"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <span className="text-sm font-bold text-slate-900 pl-1">
            {viewMode === "day"
              ? `${shortMonth} ${selectedDay}, ${currentYear}`
              : `${monthName} ${currentYear}`}
          </span>
        </div>

        {/* Center: Scope Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                setScopeFilter("my");
                showToast("Scope: My Direct Events");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                scopeFilter === "my"
                  ? "bg-white text-primary font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => {
                setScopeFilter("org");
                showToast("Scope: Tenant Events");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                scopeFilter === "org"
                  ? "bg-white text-primary font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Organisation
            </button>
            <button
              onClick={() => {
                setScopeFilter("all");
                showToast("Scope: Fleetwide All Organisations");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === "all"
                  ? "bg-[#4B2EF5] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-sm">domain_verification</span>
              <span>All Organisations</span>
            </button>
          </div>
        </div>

        {/* Right: + New Event Button */}
        <div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setNewDate(`${shortMonth} ${selectedDay}, ${currentYear}`);
              setIsNewEventModalOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>New Event</span>
          </motion.button>
        </div>
      </div>

      {/* 3. COLOR LEGEND & ORG BADGES */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Legend:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Superuser Direct Sync
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            Batch Workshops
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            Evaluation Deadlines
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Infrastructure Maintenance
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Org Badges: <code className="px-1.5 py-0.5 rounded bg-slate-100 text-primary font-bold">[MLI]</code> MiRai ·{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 text-primary font-bold">[GTI]</code> Global Tech ·{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 text-primary font-bold">[KDA]</code> Kyoto ·{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 text-primary font-bold">[PL]</code> Platform
        </div>
      </div>

      {/* 4. MAIN DYNAMIC CALENDAR DISPLAY */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Interactive Calendar Display */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
          {/* A. MONTH VIEW */}
          {viewMode === "month" && (
            <div>
              {/* Day Names Header */}
              <div className="grid grid-cols-7 gap-2 pb-2 mb-2 bg-slate-50 rounded-xl p-2 text-center text-xs font-bold text-slate-500">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div className="text-primary">SAT</div>
                <div className="text-rose-600">SUN</div>
              </div>

              {/* 7-Column Month Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Previous Month Spillover */}
                {Array.from({ length: firstDayOfMonth }, (_, i) => {
                  const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
                  return (
                    <div
                      key={`prev-spill-${i}`}
                      onClick={() => handlePrev()}
                      className="min-h-[105px] p-2 rounded-xl bg-slate-50/50 opacity-40 flex flex-col justify-between text-xs text-slate-400 cursor-pointer hover:opacity-70 transition-opacity"
                    >
                      <span>{dayNum}</span>
                    </div>
                  );
                })}

                {/* Days of Current Month */}
                {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                  const dayDateStr = `${shortMonth} ${day}, ${currentYear}`;
                  const dayEvents = filteredEvents.filter((e) => e.date === dayDateStr);
                  const isSelected = selectedDay === day;
                  const isTodayHighlight = currentYear === 2026 && currentMonth === 9 && day === 19;

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => {
                        setSelectedDay(day);
                        showToast(`Selected ${shortMonth} ${day}, ${currentYear} (${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""})`);
                      }}
                      className={`min-h-[105px] p-2 rounded-xl border transition-all flex flex-col justify-between text-xs cursor-pointer ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs"
                          : isTodayHighlight
                          ? "bg-slate-50 border-primary/40"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold ${
                            isSelected || isTodayHighlight ? "text-primary" : "text-slate-800"
                          }`}
                        >
                          {day}
                        </span>
                        {isTodayHighlight && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Today" />
                        )}
                      </div>

                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayEvents.map((evt) => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                            }}
                            className={`w-full text-left p-1 rounded-lg text-[10px] leading-tight font-semibold truncate flex items-center gap-1 cursor-pointer transition-transform hover:scale-[1.02] ${
                              evt.category === "infrastructure"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : evt.category === "workshop"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                : evt.category === "evaluation"
                                ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                                : "bg-[#4B2EF5] text-white"
                            }`}
                          >
                            <span className="font-mono text-[9px] opacity-80">[{evt.orgCode}]</span>
                            <span className="truncate">{evt.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Next Month Spillover to complete grid */}
                {Array.from(
                  { length: (7 - ((firstDayOfMonth + daysInCurrentMonth) % 7)) % 7 },
                  (_, i) => (
                    <div
                      key={`next-spill-${i}`}
                      onClick={() => handleNext()}
                      className="min-h-[105px] p-2 rounded-xl bg-slate-50/50 opacity-40 flex flex-col justify-between text-xs text-slate-400 cursor-pointer hover:opacity-70 transition-opacity"
                    >
                      <span>{i + 1}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* B. WEEK VIEW */}
          {viewMode === "week" && (
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-2 pb-2 bg-slate-50 rounded-xl p-2 text-center text-xs font-bold text-slate-500">
                {weekDays.map((d) => (
                  <div
                    key={`week-head-${d}`}
                    onClick={() => setSelectedDay(d)}
                    className={`cursor-pointer p-1 rounded-lg transition-colors ${
                      selectedDay === d ? "bg-primary text-white" : "hover:bg-slate-200/60"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold">{shortMonth}</div>
                    <div className="text-base font-extrabold">{d}</div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="divide-y divide-slate-100 text-xs">
                {["08:00 UTC", "10:00 UTC", "12:00 UTC", "14:00 UTC", "16:00 UTC"].map((slot) => (
                  <div key={slot} className="py-3 flex items-start gap-4">
                    <span className="w-16 font-mono text-[11px] text-slate-400 shrink-0">{slot}</span>
                    <div className="flex-1 grid grid-cols-7 gap-2 min-h-[44px]">
                      {weekDays.map((d) => {
                        const dStr = `${shortMonth} ${d}, ${currentYear}`;
                        const matching = filteredEvents.filter((e) => e.date === dStr);

                        return (
                          <div
                            key={`slot-${slot}-${d}`}
                            onClick={() => {
                              setSelectedDay(d);
                              setNewDate(dStr);
                              setNewTime(slot);
                              setIsNewEventModalOpen(true);
                            }}
                            className="p-1 rounded-lg border border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer min-h-[40px]"
                          >
                            {matching.map((evt) => (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(evt);
                                }}
                                className="p-1 rounded bg-[#4B2EF5] text-white text-[9px] font-bold truncate mb-1"
                              >
                                {evt.title}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C. DAY VIEW */}
          {viewMode === "day" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {shortMonth} {selectedDay}, {currentYear}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(selectedDateStr);
                    setIsNewEventModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                >
                  + Add Event
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">event_busy</span>
                  <p>No platform events scheduled for this date.</p>
                  <button
                    onClick={() => {
                      setNewDate(selectedDateStr);
                      setIsNewEventModalOpen(true);
                    }}
                    className="mt-3 text-primary font-bold hover:underline"
                  >
                    Schedule an event on {selectedDateStr}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="p-4 rounded-xl border border-slate-200/80 hover:border-primary bg-slate-50/50 hover:bg-white transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{evt.title}</span>
                        <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">{evt.time}</span>
                      </div>
                      <p className="text-xs text-slate-500">{evt.orgName} • {evt.categoryLabel}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex -space-x-1.5">
                          {evt.attendees.map((a, i) => (
                            <div
                              key={i}
                              title={a.name}
                              className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
                            >
                              {a.initials}
                            </div>
                          ))}
                        </div>
                        {evt.googleMeetUrl && (
                          <a
                            href={evt.googleMeetUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">video_call</span>
                            Join Google Meet
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Selected Day's Schedule & Quick Action Panel */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDay === 19 && currentMonth === 9 && currentYear === 2026
                    ? "Today's Schedule"
                    : `Schedule (${shortMonth} ${selectedDay})`}
                </h3>
                <p className="text-[11px] text-slate-500">Live operational sync ledger</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {selectedDayEvents.length} Event{selectedDayEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3">
              {selectedDayEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">event_available</span>
                  <p>No events scheduled for {selectedDateStr}.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDate(selectedDateStr);
                      setIsNewEventModalOpen(true);
                    }}
                    className="mt-2 text-primary font-bold text-xs hover:underline cursor-pointer"
                  >
                    + Add Event for {shortMonth} {selectedDay}
                  </button>
                </div>
              ) : (
                selectedDayEvents.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvent(item)}
                    className="p-3 rounded-xl border border-slate-200/70 hover:border-primary/50 bg-slate-50/50 hover:bg-white transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      {item.orgName} • {item.categoryLabel}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {item.attendees.map((a, i) => (
                          <div
                            key={i}
                            title={a.name}
                            className="w-5 h-5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white"
                          >
                            {a.initials}
                          </div>
                        ))}
                      </div>

                      {item.googleMeetUrl && (
                        <a
                          href={item.googleMeetUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-xs">video_call</span>
                          <span>Join Meet</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Button on Panel */}
            <button
              type="button"
              onClick={() => {
                setNewDate(selectedDateStr);
                setIsNewEventModalOpen(true);
              }}
              className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Event for {shortMonth} {selectedDay}</span>
            </button>
          </div>
        </div>
      </div>

      {/* EVENT INSPECTION MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4 text-xs z-10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {selectedEvent.categoryLabel}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{selectedEvent.title}</h3>
                  <p className="text-xs text-slate-500">{selectedEvent.orgName} ({selectedEvent.orgCode})</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-semibold text-slate-800">{selectedEvent.date} at {selectedEvent.time}</span>
                </div>
                {selectedEvent.description && (
                  <p className="text-slate-600 text-[11px] pt-1 border-t border-slate-200/50">
                    {selectedEvent.description}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Synchronized Attendees</h4>
                <div className="space-y-2">
                  {selectedEvent.attendees.map((att, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {att.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{att.name}</div>
                        <div className="text-[10px] text-slate-400">{att.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedEvent.googleMeetUrl && (
                    <a
                      href={selectedEvent.googleMeetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#3d24c8] transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">video_call</span>
                      <span>Launch Google Meet</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE EVENT MODAL */}
      <AnimatePresence>
        {isNewEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewEventModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4 z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Schedule Platform Event</h3>
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Regional Faculty Assessment"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Organisation Scope</label>
                    <select
                      value={newOrg}
                      onChange={(e) => setNewOrg(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                    >
                      {MOCK_ORGANISATIONS.map((org) => (
                        <option key={org.id} value={org.name}>
                          {org.name} ({org.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Event Type</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as "sync" | "workshop" | "evaluation" | "infrastructure")}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                    >
                      <option value="sync">Superuser Direct Sync</option>
                      <option value="workshop">Cohort Workshop</option>
                      <option value="evaluation">Evaluation Deadline</option>
                      <option value="infrastructure">Infrastructure</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="text"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Time (UTC)</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewEventModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer"
                  >
                    Create &amp; Sync Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs border border-slate-700"
          >
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">calendar_month</span>
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarEvent,
  CalendarEventsResponse,
  CalendarStatus,
  CalendarTask,
  CreateEventPayload,
  CreateTaskPayload,
  createCalendarEvent,
  createCalendarTask,
  deleteCalendarEvent,
  deleteCalendarTask,
  activateCalendar,
  disconnectCalendar,
  fetchCalendarEvents,
  fetchCalendarStatus,
  fetchCalendarTasks,
  getMicrosoftConnectUrl,
  updateCalendarTask,
} from "@/services/calendarService";

type CalendarViewMode = "month" | "week" | "workWeek" | "day" | "agenda";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SHOW_AS_COLOR: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  busy: { bg: "bg-[#0078D4]/10", border: "border-l-[#0078D4]", text: "text-[#005A9E]", dot: "bg-[#0078D4]" },
  tentative: { bg: "bg-amber-500/10", border: "border-l-amber-500", text: "text-amber-800", dot: "bg-amber-500" },
  oof: { bg: "bg-rose-500/10", border: "border-l-rose-500", text: "text-rose-800", dot: "bg-rose-500" },
  free: { bg: "bg-emerald-500/10", border: "border-l-emerald-500", text: "text-emerald-800", dot: "bg-emerald-500" },
  workingelsewhere: { bg: "bg-teal-500/10", border: "border-l-teal-500", text: "text-teal-800", dot: "bg-teal-500" },
};

function getStatusStyle(showAs: string | null | undefined) {
  const key = (showAs || "busy").toLowerCase();
  return SHOW_AS_COLOR[key] || SHOW_AS_COLOR.busy;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date, startOnMonday = false): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (startOnMonday ? (day === 0 ? -6 : 1) : 0);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatTimeString(isoString: string | null, isAllDay: boolean): string {
  if (isAllDay) return "All day";
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDate(new Date()));
  const [showToDoPanel, setShowToDoPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Connection & Data States
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsData, setEventsData] = useState<CalendarEventsResponse | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Modals & Panels
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState<string>("");
  const [moreEventsModalDate, setMoreEventsModalDate] = useState<string | null>(null);

  // Task Filter
  const [taskFilter, setTaskFilter] = useState<"all" | "planned" | "important" | "completed">("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // New Event Form State
  const [eventForm, setEventForm] = useState<CreateEventPayload>({
    subject: "",
    start: "",
    end: "",
    is_all_day: false,
    location: "",
    body: "",
    is_online_meeting: true,
    show_as: "busy",
  });

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  // 1. Check Connection Status
  const checkStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetchCalendarStatus();
      setStatus(res);
    } catch {
      setStatus({
        configured: true,
        connected: false,
        mailbox: null,
        code: "NOT_CONNECTED",
        message: "Microsoft Calendar is not connected.",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  // Inspect URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const reason = params.get("reason");
      const connected = params.get("connected");

      if (err) {
        if (err.toLowerCase().includes("access_denied") || (reason && reason.toLowerCase().includes("approval"))) {
          setErrorMessage(
            "Microsoft Entra ID requires tenant administrator consent for calendar permissions. You can request admin approval in Microsoft Entra, or open the Calendar Planner below."
          );
        } else {
          setErrorMessage(`Microsoft connection notice: ${reason || err}`);
        }
      } else if (connected === "true") {
        setSuccessMessage("Microsoft Calendar connected successfully!");
      }
    }
  }, []);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await activateCalendar();
      await checkStatus();
    } catch (err) {
      console.error("Failed to activate calendar", err);
    } finally {
      setIsActivating(false);
    }
  };

  // Calculate Date Window for API Request
  const dateWindow = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
    return {
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
    };
  }, [currentDate]);

  // 2. Fetch Events
  const loadEvents = useCallback(async () => {
    if (!status?.connected) return;
    setIsLoadingEvents(true);
    try {
      const res = await fetchCalendarEvents(dateWindow);
      setEventsData(res);
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [status?.connected, dateWindow]);

  // 3. Fetch Tasks
  const loadTasks = useCallback(async () => {
    if (!status?.connected) return;
    setIsLoadingTasks(true);
    try {
      const res = await fetchCalendarTasks();
      setTasks(res.tasks || []);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [status?.connected]);

  useEffect(() => {
    if (status?.connected) {
      void loadEvents();
      void loadTasks();
    }
  }, [status?.connected, loadEvents, loadTasks]);

  // Filtered Events
  const allEvents = useMemo(() => {
    let list = eventsData?.events || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.body_preview && e.body_preview.toLowerCase().includes(q))
      );
    }
    return list;
  }, [eventsData?.events, searchQuery]);

  // Group Events by ISO Date
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of allEvents) {
      if (!e.start) continue;
      const key = e.start.slice(0, 10);
      const list = map.get(key) || [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [allEvents]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "completed") return t.is_completed;
      if (taskFilter === "important") return t.importance === "high" && !t.is_completed;
      if (taskFilter === "planned") return Boolean(t.due_date) && !t.is_completed;
      return !t.is_completed;
    });
  }, [tasks, taskFilter]);

  // Date Navigation
  const navigate = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() + direction);
    } else if (viewMode === "week" || viewMode === "workWeek") {
      d.setDate(d.getDate() + direction * 7);
    } else if (viewMode === "day") {
      d.setDate(d.getDate() + direction);
    } else {
      d.setMonth(d.getMonth() + direction);
    }
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(toIsoDate(now));
  };

  // Connect Handler
  const handleConnect = () => {
    window.location.href = getMicrosoftConnectUrl("calendar");
  };

  // Disconnect Handler
  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect your Microsoft account?")) {
      await disconnectCalendar();
      setStatus({
        configured: true,
        connected: false,
        mailbox: null,
        code: "NOT_CONNECTED",
        message: "Disconnected from Microsoft 365.",
      });
      setEventsData(null);
      setTasks([]);
    }
  };

  // Task Toggle
  const handleToggleTask = async (task: CalendarTask) => {
    const nextCompleted = !task.is_completed;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, is_completed: nextCompleted, status: nextCompleted ? "completed" : "notStarted" } : t
      )
    );
    try {
      await updateCalendarTask(task.id, { is_completed: nextCompleted });
    } catch {
      void loadTasks();
    }
  };

  // Task Create
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const payload: CreateTaskPayload = {
      title: newTaskTitle.trim(),
      due_date: newTaskDueDate || undefined,
    };
    setNewTaskTitle("");
    setNewTaskDueDate("");
    try {
      const created = await createCalendarTask(payload);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error(err);
      void loadTasks();
    }
  };

  // Task Delete
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteCalendarTask(taskId);
    } catch {
      void loadTasks();
    }
  };

  // Open Create Event Modal
  const openNewEventModal = (dateStr?: string) => {
    const target = dateStr || selectedDate || todayIso;
    setNewEventDate(target);
    setEventForm({
      subject: "",
      start: `${target}T09:00`,
      end: `${target}T10:00`,
      is_all_day: false,
      location: "",
      body: "",
      is_online_meeting: true,
      show_as: "busy",
    });
    setIsNewEventModalOpen(true);
  };

  // Create Event Submit
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.subject.trim()) return;
    try {
      await createCalendarEvent(eventForm);
      setIsNewEventModalOpen(false);
      void loadEvents();
    } catch (err) {
      alert("Failed to create event. Please verify required permissions.");
      console.error(err);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event from your Microsoft Calendar?")) return;
    try {
      await deleteCalendarEvent(eventId);
      setSelectedEvent(null);
      void loadEvents();
    } catch (err) {
      alert("Failed to delete event.");
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // RENDER: DISCONNECTED STATE (Prompt with Microsoft Connect Button)
  // -------------------------------------------------------------
  if (isCheckingStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-3 border-[#0078D4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Checking Microsoft 365 calendar connection…</p>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        {errorMessage && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">info</span>
              <div>
                <p className="font-bold text-amber-900">Notice from Microsoft Entra</p>
                <p className="mt-0.5 leading-relaxed text-amber-800">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-amber-500 hover:text-amber-700 cursor-pointer p-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0078D4] via-[#106EBE] to-[#005A9E] p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              {/* Microsoft 4-Color Logo */}
              <div className="w-8 h-8 grid grid-cols-2 gap-1 p-1 bg-white/15 backdrop-blur-md rounded-lg">
                <div className="bg-[#F25022] rounded-xs" />
                <div className="bg-[#7FBA00] rounded-xs" />
                <div className="bg-[#00A4EF] rounded-xs" />
                <div className="bg-[#FFB900] rounded-xs" />
              </div>
              <span className="text-xs uppercase tracking-widest font-bold text-white/80">
                Microsoft 365 Integration
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Connect your Microsoft Calendar
            </h1>
            <p className="text-white/85 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Connect your Microsoft 365 account to synchronize your live Outlook calendar,
              scheduled Teams meetings, and Microsoft To-Do tasks directly within the Superuser dashboard.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleConnect}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-[#0078D4] hover:bg-slate-50 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer transform active:scale-98"
              >
                {/* Outlook Icon */}
                <span className="material-symbols-outlined text-[20px] text-[#0078D4]">calendar_today</span>
                Connect Microsoft Calendar
              </button>

              <button
                type="button"
                onClick={handleActivate}
                disabled={isActivating}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl backdrop-blur-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isActivating ? "hourglass_empty" : "calendar_month"}
                </span>
                {isActivating ? "Enabling..." : "Open Calendar Planner"}
              </button>

              <button
                type="button"
                onClick={checkStatus}
                className="inline-flex items-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Check Status
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#0078D4]/10 text-[#0078D4] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">view_agenda</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Live Outlook Schedule</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Full Microsoft Calendar view featuring Month, Week, Work Week, Day, and Agenda grids.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">videocam</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Microsoft Teams Meetings</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Instant one-click join for scheduled Microsoft Teams calls and online events.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">task_alt</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Microsoft To-Do Integration</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Complete and track your daily tasks, deadlines, and action items side-by-side with your events.
              </p>
            </div>
          </div>

          {/* Permissions note */}
          <div className="px-8 py-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <span className="material-symbols-outlined text-sm text-[#0078D4]">lock</span>
            <span>Uses secure Microsoft Entra ID authorization. Your tokens are securely encrypted.</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: CONNECTED STATE (EXACTLY LIKE MICROSOFT CALENDAR)
  // -------------------------------------------------------------
  const monthTitle = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[700px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden select-none font-sans">
      {errorMessage && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-500 hover:text-amber-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}
      {/* 1. TOP OUTLOOK COMMAND BAR / RIBBON */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between gap-4 shrink-0">
        {/* Left: New Event + Nav */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openNewEventModal()}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] active:bg-[#005A9E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New event
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={jumpToToday}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
              title="Previous"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
              title="Next"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-800 ml-1 min-w-[160px]">
            {monthTitle}
          </h2>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xs relative">
          <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-2.5 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search calendar & tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 focus:bg-white focus:ring-1 focus:ring-[#0078D4] border border-transparent focus:border-[#0078D4] rounded-md text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Right: View Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs font-medium">
            {(["month", "week", "workWeek", "day", "agenda"] as CalendarViewMode[]).map((mode) => {
              const labelMap: Record<CalendarViewMode, string> = {
                month: "Month",
                week: "Week",
                workWeek: "Work week",
                day: "Day",
                agenda: "Agenda",
              };
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    active
                      ? "bg-white text-[#0078D4] font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {labelMap[mode]}
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Toggle To-Do Panel */}
          <button
            type="button"
            onClick={() => setShowToDoPanel((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
              showToDoPanel
                ? "bg-[#0078D4]/10 border-[#0078D4]/30 text-[#0078D4]"
                : "border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
            title="Toggle Microsoft To-Do Panel"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span className="hidden sm:inline">To Do</span>
            {tasks.filter((t) => !t.is_completed).length > 0 && (
              <span className="bg-[#0078D4] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {tasks.filter((t) => !t.is_completed).length}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              void loadEvents();
              void loadTasks();
            }}
            disabled={isLoadingEvents || isLoadingTasks}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
            title="Refresh from Microsoft 365"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isLoadingEvents || isLoadingTasks ? "animate-spin text-[#0078D4]" : ""
              }`}
            >
              refresh
            </span>
          </button>

          {/* User Account / Disconnect Dropdown */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div
              className="w-7 h-7 rounded-full bg-[#0078D4] text-white text-[11px] font-bold flex items-center justify-center shrink-0"
              title={status.mailbox || "Connected"}
            >
              {(status.mailbox || "M")[0].toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Disconnect Microsoft Calendar"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY SPLIT: Left Sidebar + Main Calendar + Right To-Do Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT OUTLOOK NAVIGATION SIDEBAR */}
        <aside className="w-56 border-r border-slate-200 bg-[#F9FAFB] p-3 flex flex-col gap-4 shrink-0 overflow-y-auto hidden lg:flex">
          {/* Mini Month Calendar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                {MONTHS[currentDate.getMonth()].slice(0, 3)} {currentDate.getFullYear()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(1)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Mini Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="text-[10px] font-semibold text-slate-400">
                  {d}
                </span>
              ))}
              {/* Build mini grid days */}
              {(() => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const totalDays = new Date(year, month + 1, 0).getDate();
                const cells = [];
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<span key={`empty-${i}`} />);
                }
                for (let d = 1; d <= totalDays; d++) {
                  const dayDate = new Date(year, month, d);
                  const iso = toIsoDate(dayDate);
                  const isToday = iso === todayIso;
                  const isSelected = iso === selectedDate;
                  const hasEvents = (eventsByDay.get(iso)?.length || 0) > 0;
                  cells.push(
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        setSelectedDate(iso);
                        setCurrentDate(dayDate);
                      }}
                      className={`h-5 w-5 mx-auto rounded-full text-[10px] flex items-center justify-center cursor-pointer transition-colors relative ${
                        isToday
                          ? "bg-[#0078D4] text-white font-bold"
                          : isSelected
                            ? "bg-[#0078D4]/20 text-[#0078D4] font-bold"
                            : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {d}
                      {hasEvents && !isToday && (
                        <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#0078D4]" />
                      )}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
          </div>

          {/* My Calendars Checkbox List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              My calendars
            </span>
            <label className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-slate-700 hover:bg-slate-200/50 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#0078D4] w-3.5 h-3.5 rounded" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4]" />
              <span className="font-medium truncate">{status.calendar_name || "Calendar"}</span>
            </label>
            <label className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-slate-700 hover:bg-slate-200/50 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-indigo-600 w-3.5 h-3.5 rounded" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="font-medium truncate">Teams Meetings</span>
            </label>
            <label className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-slate-700 hover:bg-slate-200/50 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-emerald-600 w-3.5 h-3.5 rounded" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium truncate">Microsoft To-Do</span>
            </label>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 mt-auto pt-4 border-t border-slate-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Status legend
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0078D4]" />
                Busy
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Tentative
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Away
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Free
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CALENDAR DISPLAY VIEW */}
        <main className="flex-1 flex flex-col bg-white overflow-y-auto">
          {viewMode === "month" && (
            <MonthCalendarView
              currentDate={currentDate}
              eventsByDay={eventsByDay}
              todayIso={todayIso}
              selectedDate={selectedDate}
              onSelectDate={(iso) => setSelectedDate(iso)}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onDoubleClickDay={(iso) => openNewEventModal(iso)}
              onShowMore={(iso) => setMoreEventsModalDate(iso)}
            />
          )}

          {(viewMode === "week" || viewMode === "workWeek") && (
            <WeekCalendarView
              currentDate={currentDate}
              isWorkWeek={viewMode === "workWeek"}
              allEvents={allEvents}
              todayIso={todayIso}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onTimeSlotClick={(dateIso, hour) => {
                const hourStr = String(hour).padStart(2, "0");
                const nextHourStr = String(hour + 1).padStart(2, "0");
                setEventForm({
                  subject: "",
                  start: `${dateIso}T${hourStr}:00`,
                  end: `${dateIso}T${nextHourStr}:00`,
                  is_all_day: false,
                  location: "",
                  body: "",
                  is_online_meeting: true,
                  show_as: "busy",
                });
                setIsNewEventModalOpen(true);
              }}
            />
          )}

          {viewMode === "day" && (
            <DayCalendarView
              date={new Date(selectedDate || currentDate)}
              allEvents={allEvents}
              todayIso={todayIso}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onTimeSlotClick={(dateIso, hour) => {
                const hourStr = String(hour).padStart(2, "0");
                const nextHourStr = String(hour + 1).padStart(2, "0");
                setEventForm({
                  subject: "",
                  start: `${dateIso}T${hourStr}:00`,
                  end: `${dateIso}T${nextHourStr}:00`,
                  is_all_day: false,
                  location: "",
                  body: "",
                  is_online_meeting: true,
                  show_as: "busy",
                });
                setIsNewEventModalOpen(true);
              }}
            />
          )}

          {viewMode === "agenda" && (
            <AgendaCalendarView
              allEvents={allEvents}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
            />
          )}
        </main>

        {/* RIGHT OUTLOOK MICROSOFT TO-DO PANEL */}
        {showToDoPanel && (
          <aside className="w-80 border-l border-slate-200 bg-[#FAFAFA] flex flex-col shrink-0 overflow-hidden">
            {/* To-Do Header */}
            <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                {/* To-Do Logo Icon */}
                <div className="w-5 h-5 rounded-md bg-[#0078D4] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <h3 className="text-xs font-bold text-slate-800">To Do</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowToDoPanel(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* To-Do Filters */}
            <div className="flex border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-500 shrink-0">
              {[
                { id: "all", label: "Tasks" },
                { id: "planned", label: "Planned" },
                { id: "important", label: "Starred" },
                { id: "completed", label: "Done" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTaskFilter(f.id as typeof taskFilter)}
                  className={`flex-1 py-2 text-center transition-colors border-b-2 cursor-pointer ${
                    taskFilter === f.id
                      ? "border-[#0078D4] text-[#0078D4] bg-[#0078D4]/5"
                      : "border-transparent hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Add Task Input */}
            <form onSubmit={handleCreateTask} className="p-3 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1.5 focus-within:ring-1 focus-within:ring-[#0078D4] focus-within:bg-white border border-transparent focus-within:border-[#0078D4] transition-all">
                <span className="material-symbols-outlined text-[16px] text-slate-400 pl-1">add</span>
                <input
                  type="text"
                  placeholder="Add a task"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="text-[10px] text-slate-500 bg-transparent outline-none cursor-pointer"
                  title="Due date"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-2 py-0.5 bg-[#0078D4] text-white text-[11px] font-bold rounded disabled:opacity-40 transition-opacity"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Task List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-3xl text-slate-300">task_alt</span>
                  <p className="text-xs">No tasks in this view.</p>
                </div>
              ) : (
                filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    className="group bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs flex items-start gap-2.5 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(t)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 transition-colors cursor-pointer ${
                        t.is_completed
                          ? "bg-[#0078D4] border-[#0078D4] text-white"
                          : "border-slate-300 hover:border-[#0078D4]"
                      }`}
                    >
                      {t.is_completed && (
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs text-slate-800 leading-snug break-words ${
                          t.is_completed ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] mt-1 ${
                            t.due_date < todayIso && !t.is_completed
                              ? "text-rose-600 font-semibold"
                              : "text-slate-400"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[11px]">schedule</span>
                          Due {t.due_date}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                      title="Delete task"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 3. NEW EVENT MODAL (Outlook Style) */}
      <AnimatePresence>
        {isNewEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-[#0078D4] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">event</span>
                  <h3 className="text-sm font-bold">New Microsoft Calendar Event</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateEvent} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Add title</label>
                  <input
                    type="text"
                    required
                    placeholder="Meeting, presentation, review..."
                    value={eventForm.subject}
                    onChange={(e) => setEventForm({ ...eventForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.start}
                      onChange={(e) => setEventForm({ ...eventForm, start: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">End</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.end}
                      onChange={(e) => setEventForm({ ...eventForm, end: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>

                {/* Teams Meeting Toggle */}
                <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">videocam</span>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Microsoft Teams Meeting</p>
                      <p className="text-[11px] text-slate-500">Generate an online Teams join link</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventForm.is_online_meeting}
                    onChange={(e) => setEventForm({ ...eventForm, is_online_meeting: e.target.checked })}
                    className="accent-[#0078D4] w-4 h-4 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location / Room</label>
                  <input
                    type="text"
                    placeholder="Conference Room 1 / Online"
                    value={eventForm.location || ""}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Show as</label>
                  <select
                    value={eventForm.show_as}
                    onChange={(e) => setEventForm({ ...eventForm, show_as: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:border-[#0078D4]"
                  >
                    <option value="busy">Busy</option>
                    <option value="tentative">Tentative</option>
                    <option value="free">Free</option>
                    <option value="oof">Away (Out of Office)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description / Agenda</label>
                  <textarea
                    rows={3}
                    placeholder="Add meeting notes, agenda, or attendees..."
                    value={eventForm.body || ""}
                    onChange={(e) => setEventForm({ ...eventForm, body: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:border-[#0078D4]"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewEventModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-bold rounded-md shadow-xs transition-colors"
                  >
                    Save to Microsoft 365
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. EVENT DETAILS MODAL (Outlook Style) */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0078D4]/10 text-[#0078D4] mb-1">
                      {selectedEvent.show_as || "Event"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {selectedEvent.subject}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Time & Date */}
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
                  <span>
                    {selectedEvent.start?.slice(0, 10)} ·{" "}
                    {formatTimeString(selectedEvent.start, selectedEvent.is_all_day)}
                    {selectedEvent.end && !selectedEvent.is_all_day ? ` – ${formatTimeString(selectedEvent.end, false)}` : ""}
                  </span>
                </div>

                {/* Teams Meeting Action */}
                {selectedEvent.is_online_meeting && selectedEvent.online_meeting_url && (
                  <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-lg">videocam</span>
                      <span className="text-xs font-bold text-indigo-900">Microsoft Teams Call</span>
                    </div>
                    <a
                      href={selectedEvent.online_meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
                    >
                      Join Teams
                    </a>
                  </div>
                )}

                {/* Location */}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {/* Organizer */}
                {selectedEvent.organizer && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                    <span>
                      {selectedEvent.organizer_name ? `${selectedEvent.organizer_name} ` : ""}
                      <span className="text-slate-400 font-mono">({selectedEvent.organizer})</span>
                    </span>
                  </div>
                )}

                {/* Body Preview */}
                {selectedEvent.body_preview && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 max-h-36 overflow-y-auto leading-relaxed">
                    {selectedEvent.body_preview}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MORE EVENTS POPOVER MODAL */}
      <AnimatePresence>
        {moreEventsModalDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  Events for {moreEventsModalDate}
                </h4>
                <button
                  type="button"
                  onClick={() => setMoreEventsModalDate(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-3 max-h-80 overflow-y-auto space-y-1.5">
                {(eventsByDay.get(moreEventsModalDate) || []).map((e) => {
                  const style = getStatusStyle(e.show_as);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        setSelectedEvent(e);
                        setMoreEventsModalDate(null);
                      }}
                      className={`w-full text-left p-2 rounded border-l-3 ${style.border} ${style.bg} hover:shadow-xs transition-all`}
                    >
                      <p className={`text-xs font-bold ${style.text} truncate`}>{e.subject}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {formatTimeString(e.start, e.is_all_day)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: MONTH VIEW (AUTHENTIC MICROSOFT OUTLOOK GRID)
// -------------------------------------------------------------
interface MonthCalendarViewProps {
  currentDate: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  todayIso: string;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onDoubleClickDay: (iso: string) => void;
  onShowMore: (iso: string) => void;
}

function MonthCalendarView({
  currentDate,
  eventsByDay,
  todayIso,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  onDoubleClickDay,
  onShowMore,
}: MonthCalendarViewProps) {
  const monthIndex = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // 6 weeks of 7 days = 42 cells
  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(year, monthIndex, 1);
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, monthIndex]);

  return (
    <div className="flex-1 flex flex-col min-w-[700px]">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-[#F9FAFB] shrink-0">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-bold text-slate-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* 42-cell Month Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 border-collapse">
        {gridDays.map((d) => {
          const iso = toIsoDate(d);
          const isCurrentMonth = d.getMonth() === monthIndex;
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;
          const dayEvents = eventsByDay.get(iso) || [];
          const visibleEvents = dayEvents.slice(0, 3);
          const extraCount = dayEvents.length - 3;

          return (
            <div
              key={iso}
              onClick={() => onSelectDate(iso)}
              onDoubleClick={() => onDoubleClickDay(iso)}
              className={`border-r border-b border-slate-200/80 p-1 flex flex-col min-h-[90px] transition-colors relative cursor-pointer ${
                isSelected
                  ? "bg-[#0078D4]/5"
                  : isCurrentMonth
                    ? "bg-white hover:bg-slate-50/70"
                    : "bg-slate-50/50 text-slate-300"
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1 px-1">
                <span
                  className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                    isToday
                      ? "bg-[#0078D4] text-white font-bold"
                      : isCurrentMonth
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {d.getDate()}
                </span>
                {dayEvents.length > 0 && !isToday && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event Pills */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {visibleEvents.map((evt) => {
                  const style = getStatusStyle(evt.show_as);
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium border-l-2 ${style.border} ${style.bg} ${style.text} truncate flex items-center gap-1 hover:brightness-95 transition-all`}
                      title={`${evt.subject} (${formatTimeString(evt.start, evt.is_all_day)})`}
                    >
                      {evt.is_online_meeting && (
                        <span className="material-symbols-outlined text-[11px] text-indigo-600 shrink-0">
                          videocam
                        </span>
                      )}
                      <span className="truncate">{evt.subject}</span>
                    </button>
                  );
                })}

                {extraCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowMore(iso);
                    }}
                    className="text-[10px] text-[#0078D4] hover:underline font-semibold px-1 block"
                  >
                    +{extraCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: WEEK & WORK-WEEK CALENDAR VIEW
// -------------------------------------------------------------
interface WeekCalendarViewProps {
  currentDate: Date;
  isWorkWeek: boolean;
  allEvents: CalendarEvent[];
  todayIso: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onTimeSlotClick: (dateIso: string, hour: number) => void;
}

function WeekCalendarView({
  currentDate,
  isWorkWeek,
  allEvents,
  todayIso,
  onSelectEvent,
  onTimeSlotClick,
}: WeekCalendarViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, isWorkWeek);
    const count = isWorkWeek ? 5 : 7;
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate, isWorkWeek]);

  // Hours: 7 AM to 9 PM (14 slots)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <div className="flex-1 flex flex-col min-w-[700px] overflow-y-auto">
      {/* Day Headers */}
      <div className="flex border-b border-slate-200 bg-[#F9FAFB] shrink-0 sticky top-0 z-10">
        <div className="w-16 border-r border-slate-200" />
        {days.map((d) => {
          const iso = toIsoDate(d);
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className={`flex-1 py-2 text-center border-r border-slate-200 ${
                isToday ? "bg-[#0078D4]/5" : ""
              }`}
            >
              <p className="text-[11px] font-bold text-slate-500 uppercase">
                {WEEKDAYS[d.getDay()]}
              </p>
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  isToday ? "bg-[#0078D4] text-white" : "text-slate-800"
                }`}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hourly Time Grid */}
      <div className="flex flex-1 relative">
        {/* Time Gutter */}
        <div className="w-16 shrink-0 border-r border-slate-200 text-right pr-2 select-none">
          {hours.map((h) => (
            <div key={h} className="h-14 text-[10px] text-slate-400 -translate-y-2">
              {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {days.map((d) => {
          const iso = toIsoDate(d);
          const dayEvents = allEvents.filter((e) => e.start?.startsWith(iso));

          return (
            <div
              key={iso}
              className="flex-1 border-r border-slate-200/80 relative"
            >
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => onTimeSlotClick(iso, h)}
                  className="h-14 border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors"
                />
              ))}

              {/* Event blocks placed absolutely */}
              {dayEvents.map((evt) => {
                if (!evt.start) return null;
                const dStart = new Date(evt.start);
                const dEnd = evt.end ? new Date(evt.end) : new Date(dStart.getTime() + 60 * 60 * 1000);
                const startHour = dStart.getHours() + dStart.getMinutes() / 60;
                const duration = Math.max(0.5, (dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60));

                if (startHour < 7 || startHour > 21) return null;

                const topOffset = (startHour - 7) * 56;
                const height = duration * 56;
                const style = getStatusStyle(evt.show_as);

                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt);
                    }}
                    style={{ top: `${topOffset}px`, height: `${height}px` }}
                    className={`absolute left-1 right-1 p-1.5 rounded-md border-l-3 ${style.border} ${style.bg} ${style.text} shadow-xs text-left overflow-hidden z-2 cursor-pointer hover:shadow-md transition-all`}
                  >
                    <p className="text-[11px] font-bold leading-tight truncate">{evt.subject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatTimeString(evt.start, evt.is_all_day)}
                    </p>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: DAY CALENDAR VIEW
// -------------------------------------------------------------
interface DayCalendarViewProps {
  date: Date;
  allEvents: CalendarEvent[];
  todayIso: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onTimeSlotClick: (dateIso: string, hour: number) => void;
}

function DayCalendarView({
  date,
  allEvents,
  todayIso,
  onSelectEvent,
  onTimeSlotClick,
}: DayCalendarViewProps) {
  const iso = toIsoDate(date);
  const isToday = iso === todayIso;
  const dayEvents = allEvents.filter((e) => e.start?.startsWith(iso));
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <div className="flex-1 flex flex-col min-w-[500px] overflow-y-auto">
      {/* Day Header */}
      <div className="py-3 px-6 border-b border-slate-200 bg-[#F9FAFB] flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            {WEEKDAYS[date.getDay()]}
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            {MONTHS[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
          </h3>
        </div>
        {isToday && (
          <span className="px-2.5 py-1 bg-[#0078D4] text-white text-xs font-bold rounded-full">
            Today
          </span>
        )}
      </div>

      {/* Hourly Grid */}
      <div className="flex flex-1 relative p-4">
        <div className="w-16 shrink-0 border-r border-slate-200 text-right pr-3 select-none">
          {hours.map((h) => (
            <div key={h} className="h-16 text-xs text-slate-400 -translate-y-2">
              {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </div>
          ))}
        </div>

        <div className="flex-1 relative pl-3">
          {hours.map((h) => (
            <div
              key={h}
              onClick={() => onTimeSlotClick(iso, h)}
              className="h-16 border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors"
            />
          ))}

          {dayEvents.map((evt) => {
            if (!evt.start) return null;
            const dStart = new Date(evt.start);
            const dEnd = evt.end ? new Date(evt.end) : new Date(dStart.getTime() + 60 * 60 * 1000);
            const startHour = dStart.getHours() + dStart.getMinutes() / 60;
            const duration = Math.max(0.5, (dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60));

            const topOffset = (startHour - 7) * 64;
            const height = duration * 64;
            const style = getStatusStyle(evt.show_as);

            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => onSelectEvent(evt)}
                style={{ top: `${topOffset}px`, height: `${height}px` }}
                className={`absolute left-4 right-4 p-3 rounded-lg border-l-4 ${style.border} ${style.bg} ${style.text} shadow-xs text-left z-2 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div>
                  <h4 className="text-xs font-bold">{evt.subject}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatTimeString(evt.start, evt.is_all_day)} – {formatTimeString(evt.end, false)}
                  </p>
                </div>
                {evt.location && (
                  <p className="text-[11px] text-slate-400 mt-1">{evt.location}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: AGENDA CALENDAR VIEW
// -------------------------------------------------------------
interface AgendaCalendarViewProps {
  allEvents: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

function AgendaCalendarView({ allEvents, onSelectEvent }: AgendaCalendarViewProps) {
  // Sort events chronologically
  const sorted = useMemo(() => {
    return [...allEvents].sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  }, [allEvents]);

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
        <p className="text-sm font-semibold">No scheduled events in this window</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-4">
      {sorted.map((evt) => {
        const style = getStatusStyle(evt.show_as);
        return (
          <div
            key={evt.id}
            onClick={() => onSelectEvent(evt)}
            className={`p-4 bg-white rounded-xl border border-slate-200 border-l-4 ${style.border} shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <h4 className="text-sm font-bold text-slate-900">{evt.subject}</h4>
                {evt.is_online_meeting && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">videocam</span>
                    Teams
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {evt.start?.slice(0, 10)} · {formatTimeString(evt.start, evt.is_all_day)}
                {evt.end && !evt.is_all_day ? ` – ${formatTimeString(evt.end, false)}` : ""}
              </p>
              {evt.location && (
                <p className="text-xs text-slate-400">{evt.location}</p>
              )}
            </div>

            <span className="text-xs text-[#0078D4] font-semibold flex items-center gap-1">
              View details
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

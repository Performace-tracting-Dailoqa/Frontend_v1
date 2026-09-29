"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  calendarHint,
  CalendarEvent,
  CalendarEventsResponse,
  CalendarStatus,
  errorMessage,
  fetchCalendarEvents,
  fetchCalendarStatus,
} from "@/services/calendarService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Pill,
  PrimaryButton,
  SectionCard,
  UnavailableState,
} from "../SuperAdminUi";

/** How the event text should be coloured, based on the Graph `showAs` value. */
const SHOW_AS_TONE: Record<string, string> = {
  free: "border-l-slate-300",
  tentative: "border-l-amber-400",
  busy: "border-l-[#4B2EF5]",
  oof: "border-l-rose-400",
  workingElsewhere: "border-l-teal-400",
};

/** Month-grid dot colour, keyed by the Graph `showAs` value. */
const SHOW_AS_DOT: Record<string, string> = {
  free: "bg-slate-300",
  tentative: "bg-amber-400",
  busy: "bg-[#4B2EF5]",
  oof: "bg-rose-400",
  workingElsewhere: "bg-teal-400",
};

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIsoDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, delta: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + delta, 1);
}

/** Parse a Graph start value into a local Date, treating all-day values as midnight. */
function parseEventStart(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTime(value: string | null, isAllDay: boolean): string {
  if (isAllDay) return "All day";
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function eventAccentClass(event: CalendarEvent): string {
  return SHOW_AS_TONE[(event.show_as ?? "busy").toLowerCase()] ?? "border-l-[#4B2EF5]";
}

/** Month grid: 6 weeks of days starting on the Sunday of the first row. */
function buildMonthGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

interface MonthGridProps {
  anchor: Date;
  today: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelectDay: (day: Date) => void;
  selectedDay: string | null;
}

function MonthGrid({ anchor, today, eventsByDay, onSelectDay, selectedDay }: MonthGridProps) {
  const days = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const monthIndex = anchor.getMonth();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY.map((day) => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toIsoDate(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = day.getMonth() === monthIndex;
          const isToday = key === toIsoDate(today);
          const isSelected = key === selectedDay;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`relative aspect-square rounded-lg border p-1 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-[#4B2EF5] ring-2 ring-[#4B2EF5]/20 bg-primary/5"
                  : inMonth
                    ? "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                    : "border-slate-100 bg-slate-50/40 text-slate-300"
              }`}
            >
              <span
                className={`text-[11px] font-bold ${
                  isToday
                    ? "text-white bg-[#4B2EF5] rounded-full w-5 h-5 flex items-center justify-center"
                    : inMonth
                      ? "text-slate-700"
                      : "text-slate-300"
                }`}
              >
                {day.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
                  {dayEvents.slice(0, 4).map((event) => (
                    <span
                      key={event.id}
                      title={event.subject}
                      className={`h-1 flex-1 rounded-full ${SHOW_AS_DOT[(event.show_as ?? "busy").toLowerCase()] ?? "bg-[#4B2EF5]"}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventList({ events, emptyLabel }: { events: CalendarEvent[]; emptyLabel: string }) {
  if (events.length === 0) {
    return <p className="text-xs text-slate-400 text-center py-8">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <motion.li
          key={event.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={`p-3 rounded-xl border border-slate-200/80 border-l-4 bg-white ${eventAccentClass(event)}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-900 min-w-0">{event.subject}</h4>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {event.is_online_meeting && (
                <Pill tone="primary">
                  <span className="material-symbols-outlined text-[12px]">videocam</span>
                  Teams
                </Pill>
              )}
              {(event.categories ?? []).slice(0, 1).map((category) => (
                <Pill key={category} tone="slate">
                  {category}
                </Pill>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            {formatTime(event.start, event.is_all_day)}
            {!event.is_all_day && event.end ? ` – ${formatTime(event.end, false)}` : ""}
            {event.time_zone && event.time_zone !== "UTC" ? ` (${event.time_zone})` : ""}
          </p>

          {event.location && (
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">location_on</span>
              {event.location}
            </p>
          )}
          {event.organizer && (
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-[13px]">person</span>
              {event.organizer_name ? `${event.organizer_name} · ` : ""}
              <span className="font-mono">{event.organizer}</span>
            </p>
          )}
          {event.body_preview && (
            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 border-t border-slate-100 pt-2">
              {event.body_preview}
            </p>
          )}
        </motion.li>
      ))}
    </ul>
  );
}

export default function CalendarTab() {
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [events, setEvents] = useState<CalendarEventsResponse | null>(null);
  const [today] = useState(() => new Date());

  // The window is padded a week either side so the 6-week month grid is covered.
  const range = useMemo(() => {
    const start = new Date(anchor);
    start.setDate(1);
    start.setDate(start.getDate() - 7);
    const end = new Date(anchor);
    end.setMonth(end.getMonth() + 1, 1);
    end.setDate(end.getDate() + 7);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }, [anchor]);

  const checkStatus = React.useCallback(async () => {
    setIsChecking(true);
    setStatusError(null);
    try {
      setStatus(await fetchCalendarStatus());
    } catch (caught) {
      setStatus(null);
      setStatusError(errorMessage(caught, "Could not check the Microsoft calendar connection."));
    } finally {
      setIsChecking(false);
    }
  }, []);

  const loadEvents = React.useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      setEvents(
        await fetchCalendarEvents({ startDate: range.start, endDate: range.end })
      );
    } catch (caught) {
      setEvents(null);
      setEventsError(errorMessage(caught, "Could not load the Microsoft calendar."));
    } finally {
      setIsLoadingEvents(false);
    }
  }, [range.start, range.end]);

  React.useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  React.useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events?.events ?? []) {
      const start = parseEventStart(event.start);
      if (!start) continue;
      const key = toIsoDate(start);
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
    }
    return map;
  }, [events]);

  const allEvents = useMemo(
    () => [...(events?.events ?? [])].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "")),
    [events]
  );

  const selectedDayEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];
  const canShowCalendar = status?.connected === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="calendar_month"
        title="Microsoft Calendar"
        description={
          status?.mailbox
            ? `Microsoft 365 schedule for ${status.mailbox}`
            : "The superuser's Microsoft 365 schedule"
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={() => setView("month")}
                className={`px-3 h-10 text-xs font-bold transition-colors cursor-pointer ${
                  view === "month" ? "bg-[#4B2EF5] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setView("agenda")}
                className={`px-3 h-10 text-xs font-bold transition-colors cursor-pointer ${
                  view === "agenda" ? "bg-[#4B2EF5] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Agenda
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAnchor((current) => new Date())}
              className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                void checkStatus();
                void loadEvents();
              }}
              className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Refresh calendar"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        }
      />

      {/* CONNECTION STATE */}
      {isChecking ? (
        <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
      ) : statusError ? (
        <ErrorState title="Calendar check failed" message={statusError} onRetry={checkStatus} />
      ) : status && !status.connected ? (
        <UnavailableState
          icon="calendar_month"
          title={status.configured ? "Microsoft calendar is not reachable" : "Microsoft calendar not configured"}
          message={status.message ?? "The Microsoft 365 calendar is unavailable."}
          hint={calendarHint(status.code)}
          action={
            <PrimaryButton onClick={checkStatus} icon="refresh">
              Re-check connection
            </PrimaryButton>
          }
        />
      ) : status ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-emerald-800">Microsoft 365 connected</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-mono">{status.mailbox}</span>
            {status.calendar_name && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{status.calendar_name}</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {allEvents.length} event{allEvents.length === 1 ? "" : "s"} in view
          </span>
        </div>
      ) : null}

      {/* EVENTS ERROR */}
      {eventsError && canShowCalendar && (
        <ErrorState
          title="Could not load events"
          message={eventsError}
          onRetry={loadEvents}
          retryLabel="Reload events"
        />
      )}

      {/* CALENDAR */}
      {isLoadingEvents && canShowCalendar ? (
        <LoadingState label="Loading calendar events from Microsoft Graph…" />
      ) : !canShowCalendar ? null : view === "month" ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <SectionCard
            className="lg:col-span-3"
            icon="calendar_month"
            title={`${MONTH[anchor.getMonth()]} ${anchor.getFullYear()}`}
            subtitle={events ? `${range.start} → ${range.end}` : undefined}
            action={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAnchor((current) => addMonths(current, -1))}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Previous month"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnchor((current) => addMonths(current, 1))}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Next month"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            }
          >
            <MonthGrid
              anchor={anchor}
              today={today}
              eventsByDay={eventsByDay}
              onSelectDay={(day) => setSelectedDay(toIsoDate(day))}
              selectedDay={selectedDay}
            />
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100">
              {[
                { label: "Busy", color: "bg-[#4B2EF5]" },
                { label: "Tentative", color: "bg-amber-400" },
                { label: "Out of office", color: "bg-rose-400" },
                { label: "Free", color: "bg-slate-300" },
              ].map((legend) => (
                <span key={legend.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className={`w-2.5 h-2.5 rounded-full ${legend.color}`} />
                  {legend.label}
                </span>
              ))}
            </div>
          </SectionCard>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDay ?? "agenda"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <SectionCard
                  icon="event"
                  title={selectedDay ?? "Upcoming"}
                  subtitle={
                    selectedDay
                      ? `${selectedDayEvents.length} event${selectedDayEvents.length === 1 ? "" : "s"}`
                      : "Next scheduled items in the visible window"
                  }
                >
                  <EventList
                    events={selectedDay ? selectedDayEvents : allEvents.slice(0, 12)}
                    emptyLabel={
                      selectedDay
                        ? "Nothing scheduled on this day."
                        : "No events in the visible window."
                    }
                  />
                </SectionCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <SectionCard
          icon="list"
          title="Agenda"
          subtitle={`${range.start} → ${range.end}`}
        >
          {allEvents.length === 0 ? (
            <EmptyState
              icon="event_busy"
              title="No events in this window"
              description="There is nothing scheduled on the connected Microsoft calendar for the selected months."
            />
          ) : (
            <EventList events={allEvents} emptyLabel="" />
          )}
        </SectionCard>
      )}
    </motion.div>
  );
}

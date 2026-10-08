"use client";

import { apiJson, ApiError, errorMessage } from "./apiClient";

export interface CalendarStatus {
  configured: boolean;
  connected: boolean;
  mailbox: string | null;
  calendar_name?: string | null;
  has_delegated_auth?: boolean;
  code: string | null;
  message: string | null;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  body_preview: string;
  /** ISO-8601. All-day events carry a bare date (`YYYY-MM-DD`). */
  start: string | null;
  end: string | null;
  is_all_day: boolean;
  time_zone: string;
  location: string | null;
  organizer: string | null;
  organizer_name: string | null;
  is_online_meeting: boolean;
  online_meeting_url: string | null;
  show_as: string | null;
  categories: string[];
  response_status: string | null;
  importance?: string;
  web_link?: string | null;
}

export interface CalendarEventsResponse {
  mailbox: string;
  start_date: string;
  end_date: string;
  total: number;
  events: CalendarEvent[];
}

export interface CalendarTask {
  id: string;
  title: string;
  status: string;
  is_completed: boolean;
  importance: string;
  due_date: string | null;
  created_at: string | null;
  list_name: string;
}

export interface CalendarTasksResponse {
  total: number;
  tasks: CalendarTask[];
}

export interface CreateEventPayload {
  subject: string;
  start: string;
  end: string;
  is_all_day?: boolean;
  time_zone?: string;
  location?: string;
  body?: string;
  is_online_meeting?: boolean;
  show_as?: string;
  categories?: string[];
}

export interface CreateTaskPayload {
  title: string;
  due_date?: string;
  importance?: string;
}

/** Stable, user-facing explanation for each calendar failure code. */
const STATUS_HINTS: Record<string, string> = {
  NOT_CONNECTED:
    "Connect your Microsoft 365 account to synchronize your live Outlook calendar events, Teams meetings, and To-Do tasks.",
  TOKEN_EXPIRED:
    "Your Microsoft session has expired. Re-connect to refresh calendar permissions.",
  CALENDAR_NOT_CONFIGURED:
    "Microsoft calendar is not connected yet. Click 'Connect Microsoft Calendar' to link your Microsoft 365 account.",
  GRAPH_PERMISSION_MISSING:
    "Microsoft account permissions missing. Please reconnect and ensure Calendars.Read and Tasks permissions are granted.",
  CALENDAR_NOT_FOUND:
    "The connected mailbox or calendar was not found in your Microsoft 365 tenant.",
  GRAPH_UNAUTHORIZED:
    "Microsoft rejected the credentials. Verify application registration or reconnect your account.",
  GRAPH_UNAVAILABLE:
    "Microsoft Graph service could not be reached right now. Please try again shortly.",
};

/** Human-readable next step for a calendar error code. */
export function calendarHint(code: string | null | undefined): string | null {
  if (!code) return null;
  return STATUS_HINTS[code] ?? null;
}

export function fetchCalendarStatus(): Promise<CalendarStatus> {
  return apiJson<CalendarStatus>(
    "/api/v1/microsoft/calendar/status",
    { cache: "no-store" },
    "Could not check the Microsoft calendar connection"
  );
}

export interface CalendarQuery {
  /** Inclusive window start, `YYYY-MM-DD`. */
  startDate?: string;
  /** Inclusive window end, `YYYY-MM-DD`. */
  endDate?: string;
  limit?: number;
}

export function fetchCalendarEvents(query: CalendarQuery = {}): Promise<CalendarEventsResponse> {
  const { startDate, endDate, limit } = query;
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (limit) params.append("limit", String(limit));

  const qs = params.toString();
  return apiJson<CalendarEventsResponse>(
    `/api/v1/microsoft/calendar/events${qs ? `?${qs}` : ""}`,
    { cache: "no-store" },
    "Could not load the Microsoft calendar events"
  );
}

export function createCalendarEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
  return apiJson<CalendarEvent>(
    "/api/v1/microsoft/calendar/events",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Could not create the calendar event"
  );
}

export function deleteCalendarEvent(eventId: string): Promise<{ success: boolean; event_id: string }> {
  return apiJson<{ success: boolean; event_id: string }>(
    `/api/v1/microsoft/calendar/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
    },
    "Could not delete the calendar event"
  );
}

export function fetchCalendarTasks(): Promise<CalendarTasksResponse> {
  return apiJson<CalendarTasksResponse>(
    "/api/v1/microsoft/calendar/tasks",
    { cache: "no-store" },
    "Could not load Microsoft To-Do tasks"
  );
}

export function createCalendarTask(payload: CreateTaskPayload): Promise<CalendarTask> {
  return apiJson<CalendarTask>(
    "/api/v1/microsoft/calendar/tasks",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Could not create task"
  );
}

export function updateCalendarTask(
  taskId: string,
  payload: { is_completed?: boolean; status?: string; title?: string }
): Promise<{ id: string; status?: string; is_completed?: boolean }> {
  return apiJson<{ id: string; status?: string; is_completed?: boolean }>(
    `/api/v1/microsoft/calendar/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "Could not update task"
  );
}

export function deleteCalendarTask(taskId: string): Promise<{ success: boolean; task_id: string }> {
  return apiJson<{ success: boolean; task_id: string }>(
    `/api/v1/microsoft/calendar/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE",
    },
    "Could not delete task"
  );
}

export function disconnectCalendar(): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>(
    "/api/v1/microsoft/calendar/disconnect",
    {
      method: "POST",
    },
    "Could not disconnect calendar"
  );
}

export function activateCalendar(): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>(
    "/api/v1/microsoft/calendar/activate",
    {
      method: "POST",
    },
    "Could not activate calendar"
  );
}

/** Get the OAuth connection URL for Microsoft 365 Calendar */
export function getMicrosoftConnectUrl(returnTab = "calendar"): string {
  const redirectTarget = `/dashboard/super-admin?tab=${encodeURIComponent(returnTab)}&connected=true`;
  return `http://localhost:8000/api/auth/microsoft/calendar/connect?redirect=${encodeURIComponent(redirectTarget)}`;
}

/** True when a calendar failure means "not set up" rather than "try again". */
export function isCalendarConfigError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 424;
}

export { errorMessage };

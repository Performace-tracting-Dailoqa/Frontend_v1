"use client";

import { apiJson, ApiError, errorMessage } from "./apiClient";

/**
 * Microsoft 365 Calendar client for the Superuser **Microsoft Calendar** page.
 *
 * The PMS signs users in with Microsoft identity but never stores a Microsoft
 * refresh token, so the calendar is read server-side with the Entra app-only
 * flow against one configured mailbox. That means the page has three honest
 * states, all handled here:
 *   - `configured: false`  -> no mailbox set; the user must set the env var
 *   - `configured: true, connected: false` -> set, but Graph is unreachable or
 *     the app is missing the `Calendars.Read` application permission
 *   - `connected: true`    -> events are live
 */

export interface CalendarStatus {
  configured: boolean;
  connected: boolean;
  mailbox: string | null;
  calendar_name?: string | null;
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
}

export interface CalendarEventsResponse {
  mailbox: string;
  start_date: string;
  end_date: string;
  total: number;
  events: CalendarEvent[];
}

/** Stable, user-facing explanation for each calendar failure code. */
const STATUS_HINTS: Record<string, string> = {
  CALENDAR_NOT_CONFIGURED:
    "Set MICROSOFT_CALENDAR_USER_UPN in the backend environment to the superuser's Microsoft 365 address, then restart the API.",
  GRAPH_PERMISSION_MISSING:
    "Grant the Entra application the Calendars.Read application permission and grant admin consent.",
  CALENDAR_NOT_FOUND:
    "The configured mailbox does not exist in this tenant, or the application is not provisioned in the tenant.",
  GRAPH_UNAUTHORIZED:
    "Microsoft rejected the application credentials. Verify MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET and MICROSOFT_TENANT_ID.",
  GRAPH_UNAVAILABLE: "Microsoft Graph could not be reached. Try again in a moment.",
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
    "Could not load the Microsoft calendar"
  );
}

/** True when a calendar failure means "not set up" rather than "try again". */
export function isCalendarConfigError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 424;
}

export { errorMessage };

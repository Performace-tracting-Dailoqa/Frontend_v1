"use client";

import { apiJson } from "./apiClient";

/**
 * Superuser system insight client.
 *
 * Backs the **Overview**, **Teams** and **Progress** pages. All three read the
 * same roll-up from the backend, so a team shows identical numbers on each
 * page by construction.
 *
 * Every endpoint is Super Admin only; a 403 is surfaced as an `ApiError` with
 * code `INSUFFICIENT_PERMISSIONS` so pages can show a permission state instead
 * of an empty table.
 */

export interface PersonRef {
  profile_id?: string | null;
  id?: string | null;
  name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
}

export interface TeamTaskStats {
  total: number;
  completed: number;
  submitted: number;
  in_progress: number;
  pending: number;
  overdue: number;
  completion_percentage: number;
}

export interface TeamEvaluationStats {
  count: number;
  average_percentage: number | null;
  highest_percentage: number | null;
  lowest_percentage: number | null;
}

export interface TeamRecord {
  id: string;
  name: string;
  department: string | null;
  status: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  manager: PersonRef | null;
  teacher: PersonRef | null;
  student_count: number;
  workflow_count: number;
  tasks: TeamTaskStats;
  evaluation: TeamEvaluationStats;
  has_started: boolean;
  has_finished: boolean;
}

export interface TeamTotals {
  teams: number;
  active_teams: number;
  learners: number;
  unassigned_learners: number;
  workflows: number;
  tasks: number;
  tasks_completed: number;
  tasks_overdue: number;
  evaluations: number;
  average_score: number | null;
  completion_percentage: number;
}

export interface RoleCount {
  id: string | null;
  name: string;
  description: string | null;
  count: number;
}

export interface ActivityEntry {
  id: string;
  actor_name: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  status: string | null;
  ip_address: string | null;
  created_at: string | null;
  relative_time: string | null;
}

export interface SuperuserOverview {
  generated_at: string;
  users: {
    total: number;
    active: number;
    inactive: number;
    by_role: RoleCount[];
  };
  teams: {
    total: number;
    active: number;
    learners: number;
    unassigned_learners: number;
  };
  work: {
    workflows: number;
    tasks: number;
    tasks_completed: number;
    tasks_overdue: number;
    completion_percentage: number;
  };
  evaluations: {
    total: number;
    workflow: number;
    general: number;
    finalized: number;
    average_percentage: number | null;
  };
  notifications: { unread: number };
  activity: ActivityEntry[];
}

export interface SuperuserTeamList {
  items: TeamRecord[];
  total: number;
  page: number;
  page_size: number;
  totals: TeamTotals;
}

export type ProgressSortKey = "completion" | "score" | "learners" | "overdue" | "name";

export interface SuperuserProgress {
  generated_at: string;
  sort_by: ProgressSortKey;
  overall: TeamTotals;
  at_risk_teams: number;
  teams_needing_attention: number;
  teams: TeamRecord[];
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export function fetchSuperuserOverview(): Promise<SuperuserOverview> {
  return apiJson<SuperuserOverview>(
    "/api/v1/superuser/overview",
    { cache: "no-store" },
    "Could not load the system overview"
  );
}

export interface TeamQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function fetchSuperuserTeams(query: TeamQuery = {}): Promise<SuperuserTeamList> {
  const { page = 1, pageSize = 50, search, status } = query;
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);

  return apiJson<SuperuserTeamList>(
    `/api/v1/superuser/teams?${params.toString()}`,
    { cache: "no-store" },
    "Could not load teams"
  );
}

export interface ProgressQuery {
  search?: string;
  status?: string;
  sortBy?: ProgressSortKey;
}

export function fetchSuperuserProgress(query: ProgressQuery = {}): Promise<SuperuserProgress> {
  const { search, status, sortBy = "completion" } = query;
  const params = new URLSearchParams({ sort_by: sortBy });
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);

  return apiJson<SuperuserProgress>(
    `/api/v1/superuser/progress?${params.toString()}`,
    { cache: "no-store" },
    "Could not load progress data"
  );
}

/**
 * One day of a trend line.
 *
 * `average_percentage` is `null` when no evaluations were recorded that day, so
 * the chart draws a gap rather than dropping to 0%. A day nobody was evaluated
 * is missing data, not a score of zero.
 */
export interface TrendPoint {
  date: string;
  average_percentage: number | null;
  evaluations: number;
}

/**
 * One batch in the chart's display order, whether or not it is currently plotted.
 *
 * The response carries the full catalogue even when `series` is narrowed, which
 * is what lets the filter list every batch and keeps a batch's colour fixed
 * while other batches are toggled off.
 */
export interface TrendBatch {
  batch_id: string;
  batch_name: string;
  /** Stable slot in the chart's palette; independent of the active filter. */
  series_index: number;
}

export interface TrendSeries extends TrendBatch {
  points: TrendPoint[];
}

export interface SuperuserProgressTrend {
  generated_at: string;
  days: number;
  start_date: string;
  end_date: string;
  /** Every batch, in display order — the filter's full list of choices. */
  batches: TrendBatch[];
  series: TrendSeries[];
  /**
   * Cross-batch daily mean — the mean of the per-batch means, so a 40-learner
   * batch cannot outvote a 5-learner one. Covers the *selected* batches, so it
   * moves with the filter.
   */
  average: TrendPoint[];
}

export interface ProgressTrendQuery {
  days?: number;
  /** Omit or pass an empty list for every batch. */
  batchIds?: string[];
}

/**
 * Daily average evaluation score per batch, for the Progress trend chart.
 *
 * Kept separate from `fetchSuperuserProgress` because that call is refetched on
 * every keystroke of the search box, and the chart's batch selection is
 * independent of the table's sort and status filters.
 */
export function fetchSuperuserProgressTrend(
  query: ProgressTrendQuery = {}
): Promise<SuperuserProgressTrend> {
  const { days = 30, batchIds } = query;
  const params = new URLSearchParams({ days: String(days) });
  for (const id of batchIds ?? []) {
    params.append("batch_ids", id);
  }

  return apiJson<SuperuserProgressTrend>(
    `/api/v1/superuser/progress/trend?${params.toString()}`,
    { cache: "no-store" },
    "Could not load the daily progress trend"
  );
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

export { isPermissionError, errorMessage } from "./apiClient";

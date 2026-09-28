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

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

export { isPermissionError, errorMessage } from "./apiClient";

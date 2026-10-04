"use client";

import { getAuthToken } from "@/utils/auth";

export interface HREvaluationSummary {
  total_evaluations: number;
  completed_evaluations: number;
  in_progress_evaluations: number;
  average_score_percentage: number | null;
  workflow_evaluations_count: number;
  general_evaluations_count: number;
  recent_evaluations: {
    id: string;
    type: "workflow" | "general";
    percentage?: number | null;
    status?: string | null;
    remarks?: string | null;
    evaluated_at?: string | null;
  }[];
}

export interface HRBatch {
  id: string;
  name: string;
  course?: string | null;
  department?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  description?: string | null;
  cycle_type?: string;
  start_date: string;
  end_date: string;
  evaluation_deadline: string;
  status: "Draft" | "Active" | "Under Review" | "Finalized";
  batch_ids?: string[];
  created_at?: string;
}

export interface LockedEvaluation {
  id: string;
  evaluation_type: "workflow" | "general";
  student_id: string;
  student_name: string;
  enrollment_no?: string | null;
  batch_name?: string;
  score_percentage?: number | null;
  status: string;
  evaluated_at?: string | null;
  remarks?: string | null;
}

export interface RubricTemplate {
  id: string;
  name: string;
  department?: string | null;
  rating_scale?: string;
  metrics: {
    name: string;
    weightage: number;
    description?: string;
  }[];
  is_active: boolean;
  created_at?: string;
}

export interface BellCurveLearner {
  student_id: string;
  name: string;
  enrollment_no?: string;
  batch_name: string;
  department: string;
  avg_score: number | null;
  tier: "Exceeds Expectations" | "Meets Expectations" | "Needs Improvement" | "Ungraded / Pending";
}

export interface HRAnalyticsDistribution {
  total_learners: number;
  total_graded: number;
  exceeds_count: number;
  meets_count: number;
  needs_improvement_count: number;
  exceeds_pct: number;
  meets_pct: number;
  needs_improvement_pct: number;
  learners: BellCurveLearner[];
}

export interface OverdueEvaluator {
  evaluator_id: string;
  user_id: string;
  name: string;
  email?: string;
  role: string;
  department: string;
  pending_tasks_count: number;
  earliest_due_date: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name?: string;
  enrollment_no?: string;
  track: string;
  session_date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  remarks?: string;
}

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchHREvaluationSummary(): Promise<HREvaluationSummary> {
  const res = await fetch("/api/v1/hr/evaluations/summary", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch HR evaluation summary: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchHRBatches(): Promise<HRBatch[]> {
  const res = await fetch("/api/v1/batches", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch batches: ${res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.items || [];
}

// ---------------------------------------------------------------------------
// Cycles
// ---------------------------------------------------------------------------

export async function fetchHRCycles(): Promise<PerformanceCycle[]> {
  const res = await fetch("/api/v1/hr/cycles", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch performance cycles");
  }
  return res.json();
}

export async function createHRCycle(payload: Partial<PerformanceCycle>): Promise<PerformanceCycle> {
  const res = await fetch("/api/v1/hr/cycles", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create performance cycle");
  }
  return res.json();
}

export async function updateHRCycle(cycleId: string, payload: Partial<PerformanceCycle>): Promise<PerformanceCycle> {
  const res = await fetch(`/api/v1/hr/cycles/${cycleId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update performance cycle");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Reopen Evaluation
// ---------------------------------------------------------------------------

export async function fetchLockedEvaluations(): Promise<LockedEvaluation[]> {
  const res = await fetch("/api/v1/hr/evaluations/locked", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch locked evaluations");
  }
  return res.json();
}

export async function reopenEvaluation(
  evaluationId: string,
  payload: { evaluation_type: "workflow" | "general"; reason: string; grace_period_hours?: number }
): Promise<any> {
  const res = await fetch(`/api/v1/hr/evaluations/${evaluationId}/reopen`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reopen evaluation");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Rubrics
// ---------------------------------------------------------------------------

export async function fetchRubricTemplates(): Promise<RubricTemplate[]> {
  const res = await fetch("/api/v1/hr/rubrics", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch rubrics");
  }
  return res.json();
}

export async function createRubricTemplate(payload: {
  name: string;
  department?: string;
  rating_scale?: string;
  metrics: { name: string; weightage: number; description?: string }[];
}): Promise<RubricTemplate> {
  const res = await fetch("/api/v1/hr/rubrics", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create rubric template");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Analytics Distribution & Overdue Evaluators
// ---------------------------------------------------------------------------

export async function fetchHRAnalyticsDistribution(): Promise<HRAnalyticsDistribution> {
  const res = await fetch("/api/v1/hr/analytics/distribution", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch analytics distribution");
  }
  return res.json();
}

export async function fetchOverdueEvaluators(): Promise<OverdueEvaluator[]> {
  const res = await fetch("/api/v1/hr/evaluators/overdue", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch overdue evaluators");
  }
  return res.json();
}

export async function nudgeEvaluator(receiver_user_id: string, message?: string): Promise<any> {
  const res = await fetch("/api/v1/hr/evaluators/nudge", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ receiver_user_id, message }),
  });
  if (!res.ok) {
    throw new Error("Failed to nudge evaluator");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function recordBulkAttendance(payload: {
  session_date: string;
  track: string;
  records: { student_id: string; status: string; remarks?: string }[];
}): Promise<any> {
  const res = await fetch("/api/v1/hr/attendance", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to record attendance");
  }
  return res.json();
}

export async function fetchSessionAttendance(
  sessionDate: string,
  track: string = "Japanese",
  batchId?: string
): Promise<AttendanceRecord[]> {
  const url = new URL("/api/v1/hr/attendance", window.location.origin);
  url.searchParams.set("session_date", sessionDate);
  url.searchParams.set("track", track);
  if (batchId) url.searchParams.set("batch_id", batchId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch session attendance");
  }
  return res.json();
}

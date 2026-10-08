"use client";

import { apiJson } from "./apiClient";

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

export async function fetchHREvaluationSummary(): Promise<HREvaluationSummary> {
  return apiJson<HREvaluationSummary>("/api/v1/hr/evaluations/summary", {}, "Failed to fetch HR evaluation summary");
}

export async function fetchHRBatches(): Promise<HRBatch[]> {
  const data = await apiJson<any>("/api/v1/batches", {}, "Failed to fetch batches");
  return Array.isArray(data) ? data : data.items || [];
}

// ---------------------------------------------------------------------------
// Cycles
// ---------------------------------------------------------------------------

export async function fetchHRCycles(): Promise<PerformanceCycle[]> {
  return apiJson<PerformanceCycle[]>("/api/v1/hr/cycles", {}, "Failed to fetch performance cycles");
}

export async function createHRCycle(payload: Partial<PerformanceCycle>): Promise<PerformanceCycle> {
  return apiJson<PerformanceCycle>(
    "/api/v1/hr/cycles",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to create performance cycle"
  );
}

export async function updateHRCycle(cycleId: string, payload: Partial<PerformanceCycle>): Promise<PerformanceCycle> {
  return apiJson<PerformanceCycle>(
    `/api/v1/hr/cycles/${cycleId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "Failed to update performance cycle"
  );
}

// ---------------------------------------------------------------------------
// Reopen Evaluation
// ---------------------------------------------------------------------------

export async function fetchLockedEvaluations(): Promise<LockedEvaluation[]> {
  return apiJson<LockedEvaluation[]>("/api/v1/hr/evaluations/locked", {}, "Failed to fetch locked evaluations");
}

export async function reopenEvaluation(
  evaluationId: string,
  payload: { evaluation_type: "workflow" | "general"; reason: string; grace_period_hours?: number }
): Promise<any> {
  return apiJson<any>(
    `/api/v1/hr/evaluations/${evaluationId}/reopen`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to reopen evaluation"
  );
}

// ---------------------------------------------------------------------------
// Rubrics
// ---------------------------------------------------------------------------

export async function fetchRubricTemplates(): Promise<RubricTemplate[]> {
  return apiJson<RubricTemplate[]>("/api/v1/hr/rubrics", {}, "Failed to fetch rubrics");
}

export async function createRubricTemplate(payload: {
  name: string;
  department?: string;
  rating_scale?: string;
  metrics: { name: string; weightage: number; description?: string }[];
}): Promise<RubricTemplate> {
  return apiJson<RubricTemplate>(
    "/api/v1/hr/rubrics",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to create rubric template"
  );
}

// ---------------------------------------------------------------------------
// Analytics Distribution & Overdue Evaluators
// ---------------------------------------------------------------------------

export async function fetchHRAnalyticsDistribution(): Promise<HRAnalyticsDistribution> {
  return apiJson<HRAnalyticsDistribution>("/api/v1/hr/analytics/distribution", {}, "Failed to fetch analytics distribution");
}

export async function fetchOverdueEvaluators(): Promise<OverdueEvaluator[]> {
  return apiJson<OverdueEvaluator[]>("/api/v1/hr/evaluators/overdue", {}, "Failed to fetch overdue evaluators");
}

export async function nudgeEvaluator(receiver_user_id: string, message?: string): Promise<any> {
  return apiJson<any>(
    "/api/v1/hr/evaluators/nudge",
    {
      method: "POST",
      body: JSON.stringify({ receiver_user_id, message }),
    },
    "Failed to nudge evaluator"
  );
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function recordBulkAttendance(payload: {
  session_date: string;
  track: string;
  records: { student_id: string; status: string; remarks?: string }[];
}): Promise<any> {
  return apiJson<any>(
    "/api/v1/hr/attendance",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to record attendance"
  );
}

export async function fetchSessionAttendance(
  sessionDate: string,
  track: string = "Japanese",
  batchId?: string
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams({ session_date: sessionDate, track });
  if (batchId) params.append("batch_id", batchId);
  return apiJson<AttendanceRecord[]>(`/api/v1/hr/attendance?${params.toString()}`, {}, "Failed to fetch session attendance");
}

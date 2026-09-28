"use client";

import { getAuthToken } from "@/utils/auth";

export interface WorkflowMetric {
  id: string;
  workflow_evaluation_id: string;
  name: string;
  description?: string | null;
  full_score: number;
  weightage: number;
  score?: number | null;
  student_score?: number | null;
  weighted_score?: number | null;
  remarks?: string | null;
  student_remarks?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricSubmissionInput {
  name: string;
  description?: string | null;
  score: number;
  full_score: number;
  student_score?: number | null;
  weightage?: number | null;
  remarks?: string | null;
}

export interface WorkflowEvaluation {
  id: string;
  workflow_task_id: string;
  student_id: string;
  evaluator_manager_id: string;
  max_score: number;
  total_score?: number | null;
  percentage?: number | null;
  status?: string | null;
  remarks?: string | null;
  metrics: WorkflowMetric[];
  evaluated_at?: string | null;
  finalized_at?: string | null;
  created_at: string;
  updated_at: string;
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

// ---------------------------------------------------------------------------
// Manager Evaluations (/api/v1/manager/workflows/{workflow_id}/tasks/{task_id}/evaluations)
// ---------------------------------------------------------------------------

export async function fetchTaskEvaluation(workflowId: string, taskId: string): Promise<WorkflowEvaluation | null> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch evaluation (${res.status})`);
  }
  return await res.json();
}

export async function createEvaluation(
  workflowId: string,
  taskId: string,
  payload: { student_id: string; max_score?: number; status?: string; remarks?: string }
): Promise<WorkflowEvaluation> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ max_score: 100.0, status: "draft", ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create evaluation (${res.status})`);
  }
  return await res.json();
}

export async function updateEvaluation(
  workflowId: string,
  taskId: string,
  evaluationId: string,
  payload: Partial<{ max_score: number; total_score: number; percentage: number; status: string; remarks: string }>
): Promise<WorkflowEvaluation> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations/${evaluationId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update evaluation (${res.status})`);
  }
  return await res.json();
}

export async function deleteEvaluation(workflowId: string, taskId: string, evaluationId: string): Promise<void> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations/${evaluationId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete evaluation (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Manager Evaluation Metrics (/api/v1/manager/workflows/{workflow_id}/tasks/{task_id}/evaluations/{evaluation_id}/metrics)
// ---------------------------------------------------------------------------

export async function createEvaluationMetric(
  workflowId: string,
  taskId: string,
  evaluationId: string,
  payload: { name: string; full_score: number; weightage: number; description?: string }
): Promise<WorkflowMetric> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations/${evaluationId}/metrics`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to add metric (${res.status})`);
  }
  return await res.json();
}

export async function updateEvaluationMetric(
  workflowId: string,
  taskId: string,
  evaluationId: string,
  metricId: string,
  payload: Partial<{ name: string; full_score: number; weightage: number; score: number; remarks: string; description: string }>
): Promise<WorkflowMetric> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations/${evaluationId}/metrics/${metricId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update metric (${res.status})`);
  }
  return await res.json();
}

export async function deleteEvaluationMetric(
  workflowId: string,
  taskId: string,
  evaluationId: string,
  metricId: string
): Promise<void> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations/${evaluationId}/metrics/${metricId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete metric (${res.status})`);
  }
}

export async function submitTaskEvaluation(
  workflowId: string,
  taskId: string,
  payload: {
    student_id: string;
    metrics: MetricSubmissionInput[];
    remarks?: string | null;
    status?: string;
  }
): Promise<WorkflowEvaluation> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}/evaluations/submit`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to submit evaluation (${res.status})`);
  }
  return await res.json();
}

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

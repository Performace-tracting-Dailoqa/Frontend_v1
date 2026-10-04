"use client";

import { getAuthToken } from "@/utils/auth";

export interface TeacherBatch {
  id: string;
  name: string;
  course?: string | null;
  department?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  teacher_id?: string;
  created_at?: string;
}

export interface TeacherStudent {
  id: string;
  user_id: string;
  batch_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  department?: string | null;
  status?: string;
  batch_name?: string | null;
  enrollment_no?: string | null;
}

export interface GeneralMetric {
  id: string;
  general_evaluation_id: string;
  name: string;
  description?: string | null;
  score?: number | null;
  full_score?: number | null;
  weightage?: number | null;
  weighted_score?: number | null;
  remarks?: string | null;
  created_at?: string;
}

export interface GeneralEvaluation {
  id: string;
  student_id: string;
  evaluator_teacher_id: string;
  total_score?: number | null;
  max_score?: number | null;
  percentage?: number | null;
  status?: string | null;
  evaluation_version?: number | null;
  remarks?: string | null;
  evaluated_at?: string | null;
  finalized_at?: string | null;
  created_at?: string | null;
  metrics?: GeneralMetric[];
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
// Teacher Batches (/api/v1/teacher/batches)
// ---------------------------------------------------------------------------

export async function fetchTeacherBatches(): Promise<TeacherBatch[]> {
  const res = await fetch("/api/v1/teacher/batches", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch teacher batches: ${res.statusText}`);
  }
  return res.json();
}

export async function createTeacherBatch(data: {
  name: string;
  course?: string;
  department?: string;
  start_date?: string;
  end_date?: string;
}): Promise<TeacherBatch> {
  const res = await fetch("/api/v1/teacher/batches", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail?.message || errorData?.detail || `Failed to create batch: ${res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Teacher Students (/api/v1/teacher/students)
// ---------------------------------------------------------------------------

export async function fetchTeacherStudents(): Promise<TeacherStudent[]> {
  const res = await fetch("/api/v1/teacher/students", {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch assigned students: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchUnassignedStudents(department?: string): Promise<TeacherStudent[]> {
  const url = department
    ? `/api/v1/teacher/students/unassigned?department=${encodeURIComponent(department)}`
    : "/api/v1/teacher/students/unassigned";
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch unassigned students: ${res.statusText}`);
  }
  return res.json();
}

export async function updateStudentBatch(
  studentId: string,
  batchId: string | null
): Promise<TeacherStudent> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/batch`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ batch_id: batchId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.detail?.message ||
        errorData?.detail ||
        `Failed to update student batch: ${res.statusText}`
    );
  }
  return res.json();
}

export async function removeStudentFromBatch(
  batchId: string,
  studentId: string
): Promise<TeacherStudent> {
  const res = await fetch(`/api/v1/teacher/batches/${batchId}/students/${studentId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.detail?.message ||
        errorData?.detail ||
        `Failed to remove student from batch: ${res.statusText}`
    );
  }
  return res.json();
}

export async function assignStudentsToBatch(
  batchId: string,
  studentIds: string[]
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/v1/teacher/batches/${batchId}/students`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ student_ids: studentIds }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.detail?.message ||
        errorData?.detail ||
        `Failed to assign students to batch: ${res.statusText}`
    );
  }
  return res.json();
}

export async function fetchStudentProfile(studentId: string): Promise<any> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.detail?.message ||
        errorData?.detail ||
        `Failed to fetch student profile: ${res.statusText}`
    );
  }
  return res.json();
}


// ---------------------------------------------------------------------------
// General Evaluations (/api/v1/teacher/students/{student_id}/evaluations)
// ---------------------------------------------------------------------------

export async function fetchStudentGeneralEvaluation(studentId: string): Promise<GeneralEvaluation | null> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch evaluation: ${res.statusText}`);
  }
  return res.json();
}

export async function createStudentGeneralEvaluation(
  studentId: string,
  data: {
    total_score?: number;
    max_score?: number;
    percentage?: number;
    status?: string;
    remarks?: string;
  }
): Promise<GeneralEvaluation> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail?.message || errorData?.detail || `Failed to create evaluation: ${res.statusText}`);
  }
  return res.json();
}

export async function updateStudentGeneralEvaluation(
  studentId: string,
  evaluationId: string,
  data: {
    total_score?: number;
    max_score?: number;
    percentage?: number;
    status?: string;
    remarks?: string;
  }
): Promise<GeneralEvaluation> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail?.message || errorData?.detail || `Failed to update evaluation: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteStudentGeneralEvaluation(
  studentId: string,
  evaluationId: string
): Promise<void> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete evaluation: ${res.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// General Metrics
// ---------------------------------------------------------------------------

export async function addGeneralMetric(
  studentId: string,
  evaluationId: string,
  metric: {
    name: string;
    description?: string;
    score?: number;
    full_score?: number;
    weightage?: number;
    remarks?: string;
  }
): Promise<GeneralMetric> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}/metrics`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(metric),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail?.message || errorData?.detail || `Failed to create metric: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteGeneralMetric(
  studentId: string,
  evaluationId: string,
  metricId: string
): Promise<void> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}/metrics/${metricId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete metric: ${res.statusText}`);
  }
}

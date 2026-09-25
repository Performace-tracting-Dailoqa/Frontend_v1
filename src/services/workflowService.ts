"use client";

import { getAuthToken } from "@/utils/auth";

export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  evaluator_manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTask {
  id: string;
  workflow_id: string;
  title: string;
  description?: string | null;
  status: string;
  student_id: string;
  assigned_by_manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
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
// Manager Workflows (/api/v1/manager/workflows)
// ---------------------------------------------------------------------------

export async function fetchWorkflows(page = 1, pageSize = 50): Promise<PaginatedResponse<Workflow>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  const res = await fetch(`/api/v1/manager/workflows?${params.toString()}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch workflows (${res.status})`);
  }
  return await res.json();
}

export async function getWorkflow(workflowId: string): Promise<Workflow> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch workflow (${res.status})`);
  }
  return await res.json();
}

export async function createWorkflow(payload: { name: string; description?: string; is_active?: boolean }): Promise<Workflow> {
  const res = await fetch("/api/v1/manager/workflows", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ is_active: true, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create workflow (${res.status})`);
  }
  return await res.json();
}

export async function updateWorkflow(workflowId: string, payload: Partial<{ name: string; description: string; is_active: boolean }>): Promise<Workflow> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update workflow (${res.status})`);
  }
  return await res.json();
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete workflow (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Manager Workflow Tasks (/api/v1/manager/workflows/{workflow_id}/tasks)
// ---------------------------------------------------------------------------

export async function fetchWorkflowTasks(workflowId: string, page = 1, pageSize = 50): Promise<PaginatedResponse<WorkflowTask>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks?${params.toString()}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch workflow tasks (${res.status})`);
  }
  return await res.json();
}

export async function getWorkflowTask(workflowId: string, taskId: string): Promise<WorkflowTask> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch task (${res.status})`);
  }
  return await res.json();
}

export async function createWorkflowTask(workflowId: string, payload: { title: string; description?: string; student_id: string; status?: string }): Promise<WorkflowTask> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ workflow_id: workflowId, status: "pending", ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create task (${res.status})`);
  }
  return await res.json();
}

export async function updateWorkflowTask(workflowId: string, taskId: string, payload: Partial<{ title: string; description: string; status: string; student_id: string }>): Promise<WorkflowTask> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update task (${res.status})`);
  }
  return await res.json();
}

export async function deleteWorkflowTask(workflowId: string, taskId: string): Promise<void> {
  const res = await fetch(`/api/v1/manager/workflows/${workflowId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete task (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Manager Authorized Team (/api/v1/manager/team)
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string; // student_id
  user_id?: string;
  name: string;
  email: string;
  enrollment_no?: string | null;
  department?: string | null;
  batch_id?: string | null;
  batch_name?: string | null;
  status?: string | null;
}

export async function fetchManagerTeam(): Promise<TeamMember[]> {
  const res = await fetch("/api/v1/manager/team", {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch team members (${res.status})`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// Student Workflow Tasks (/api/v1/student/tasks)
// ---------------------------------------------------------------------------

export interface StudentTaskItem {
  id: string;
  workflow_id?: string | null;
  workflow_name?: string | null;
  student_id?: string | null;
  assigned_by_manager_id?: string | null;
  assigned_by_name?: string | null;
  title: string;
  description?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  status: string;
  priority?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export async function fetchStudentTasks(
  page = 1,
  pageSize = 50,
  statusFilter?: string
): Promise<PaginatedResponse<StudentTaskItem>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (statusFilter) params.append("status", statusFilter);

  const res = await fetch(`/api/v1/student/tasks?${params.toString()}`, {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch student tasks (${res.status})`);
  }
  return await res.json();
}

export async function updateStudentTaskStatus(taskId: string, status: string): Promise<StudentTaskItem> {
  const res = await fetch(`/api/v1/student/tasks/${taskId}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update task status (${res.status})`);
  }
  return await res.json();
}


"use client";

import { getAuthToken } from "@/utils/auth";

export interface Workflow {
  id: string;
  batch_id?: string | null;
  batch_name?: string | null;
  name: string;
  description?: string | null;
  is_active: boolean;
  status?: string | null;
  evaluator_manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface MetricGradeItem {
  metric_name: string;
  score: number;
  full_score: number;
  remarks?: string;
}

export interface WorkflowTask {
  id: string;
  workflow_id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  due_date?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  student_id: string;
  assigned_by_manager_id: string;
  student_grade?: number | null;
  student_metric_grades?: MetricGradeItem[] | null;
  manager_grade?: number | null;
  final_grade?: number | null;
  submission_notes?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  enrollment_no?: string | null;
  workflow_name?: string | null;
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

export async function fetchWorkflows(page = 1, pageSize = 50, batchId?: string): Promise<PaginatedResponse<Workflow>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (batchId && batchId !== "all") params.append("batch_id", batchId);
  const res = await fetch(`/api/v1/manager/workflows?${params.toString()}`, {
    headers: getHeaders(),
    credentials: "same-origin",
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
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch workflow (${res.status})`);
  }
  return await res.json();
}

export async function createWorkflow(payload: { name: string; description?: string; is_active?: boolean; batch_id?: string }): Promise<Workflow> {
  const res = await fetch("/api/v1/manager/workflows", {
    method: "POST",
    headers: getHeaders(),
    credentials: "same-origin",
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
    credentials: "same-origin",
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
    credentials: "same-origin",
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
    credentials: "same-origin",
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
    credentials: "same-origin",
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
    credentials: "same-origin",
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

export interface ManagerTeam {
  id: string;
  name: string;
  department?: string | null;
  status?: string | null;
  member_count: number;
  active_workflows: number;
  active_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  evaluations_pending: number;
  progress_percentage: number;
  created_at?: string | null;
}

export async function fetchManagerTeams(): Promise<ManagerTeam[]> {
  const res = await fetch("/api/v1/manager/teams", {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch manager teams (${res.status})`);
  }
  return await res.json();
}

export async function createManagerTeam(payload: { name: string; department?: string; student_ids?: string[] }): Promise<ManagerTeam> {
  const res = await fetch("/api/v1/manager/teams", {
    method: "POST",
    headers: getHeaders(),
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create manager team (${res.status})`);
  }
  return await res.json();
}

export async function fetchAvailableStudents(): Promise<TeamMember[]> {
  const res = await fetch("/api/v1/manager/available-students", {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch available students (${res.status})`);
  }
  return await res.json();
}

export async function addTeamMembers(teamId: string, studentIds: string[]): Promise<{ message: string; count: number }> {
  const res = await fetch(`/api/v1/manager/teams/${teamId}/members`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({ student_ids: studentIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to add team members (${res.status})`);
  }
  return await res.json();
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
  student_grade?: number | null;
  submission_notes?: string | null;
  student_metric_grades?: MetricGradeItem[] | null;
  manager_grade?: number | null;
  final_grade?: number | null;
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

export async function updateStudentTaskStatus(
  taskId: string,
  status: string,
  data?: {
    student_grade?: number | null;
    submission_notes?: string | null;
    student_metric_grades?: MetricGradeItem[] | null;
  }
): Promise<StudentTaskItem> {
  const payload: Record<string, unknown> = { status };
  if (data?.student_grade !== undefined) payload.student_grade = data.student_grade;
  if (data?.submission_notes !== undefined) payload.submission_notes = data.submission_notes;
  if (data?.student_metric_grades !== undefined) payload.student_metric_grades = data.student_metric_grades;

  const res = await fetch(`/api/v1/student/tasks/${taskId}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update task status (${res.status})`);
  }
  return await res.json();
}


export interface StudentMetricItem {
  id: string;
  name: string;
  description?: string | null;
  score?: number | null;
  full_score?: number | null;
  max_score?: number | null;
  weightage?: number | null;
  weighted_score?: number | null;
  remarks?: string | null;
}

export interface StudentEvaluationItem {
  id: string;
  evaluation_type: string;
  task_id?: string | null;
  task_title?: string | null;
  workflow_title?: string | null;
  evaluator_name?: string | null;
  total_score?: number | null;
  max_score?: number | null;
  percentage?: number | null;
  status?: string | null;
  remarks?: string | null;
  evaluated_at?: string | null;
  finalized_at?: string | null;
  metrics: StudentMetricItem[];
}

export async function fetchStudentEvaluations(): Promise<{ total: number; items: StudentEvaluationItem[] }> {
  const res = await fetch("/api/v1/student/evaluations", {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch evaluations (${res.status})`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// Student Feedback & Comments (/api/v1/student/feedbacks)
// ---------------------------------------------------------------------------

export interface FeedbackCommentItem {
  id: string;
  feedback_id?: string;
  author_name: string;
  author_role: string;
  comment: string;
  created_at: string;
}

export interface StudentFeedbackItem {
  id: string;
  reviewer_name: string;
  reviewer_role: string;
  reviewer_type: "teacher" | "manager";
  reviewer_email?: string;
  topic: string;
  feedback: string;
  rating_score?: number | null;
  rating_badge: string;
  rating_type: "exceeds" | "on-track" | "needs-work";
  type: string;
  jlpt_level?: string;
  created_at: string;
  date: string;
  tags: string[];
  comments: FeedbackCommentItem[];
  pending_acknowledgement?: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface StudentFeedbacksResponse {
  total: number;
  feedbacks: StudentFeedbackItem[];
  stats: {
    total: number;
    teacher_feedbacks: number;
    manager_feedbacks: number;
  };
}

export async function fetchStudentFeedbacks(): Promise<StudentFeedbacksResponse> {
  const res = await fetch("/api/v1/student/feedbacks", {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch feedbacks (${res.status})`);
  }
  return await res.json();
}

export async function postStudentFeedbackComment(
  feedbackId: string,
  comment: string
): Promise<{ success: boolean; comment: FeedbackCommentItem; message: string }> {
  const res = await fetch(`/api/v1/student/feedbacks/${feedbackId}/comments`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to post feedback comment (${res.status})`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// Teacher Workflows (/api/v1/teacher)
// ---------------------------------------------------------------------------

export interface Batch {
  id: string;
  teacher_id?: string;
  manager_id?: string;
  name: string;
  department?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchTeacherBatches(): Promise<Batch[]> {
  const res = await fetch("/api/v1/teacher/batches", {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch batches (${res.status})`);
  }
  return await res.json();
}

export async function createTeacherBatch(payload: { name: string; department?: string; status?: string; student_ids?: string[] }): Promise<Batch> {
  const res = await fetch("/api/v1/teacher/batches", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create batch (${res.status})`);
  }
  return await res.json();
}

export async function fetchTeacherUnassignedStudents(department?: string): Promise<TeamMember[]> {
  const params = new URLSearchParams();
  if (department) params.append("department", department);
  const res = await fetch(`/api/v1/teacher/students/unassigned?${params.toString()}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch unassigned students (${res.status})`);
  }
  return await res.json();
}

export async function fetchTeacherStudents(): Promise<TeamMember[]> {
  const res = await fetch("/api/v1/teacher/students", {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch teacher students (${res.status})`);
  }
  return await res.json();
}

// ---------------------------------------------------------------------------
// Manager Overview, Tasks & Progress Analytics
// ---------------------------------------------------------------------------

export interface BatchProgressItem {
  batch_name: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface StatusDistributionItem {
  name: string;
  value: number;
  color?: string;
}

export interface PriorityDistributionItem {
  name: string;
  value: number;
}

export interface LearnerProgressItem {
  student_id: string;
  student_name: string;
  email: string;
  batch_name: string;
  total: number;
  completed: number;
  percentage: number;
  avg_grade: number;
}

export interface ManagerProgressSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  under_review_tasks: number;
  overall_completion_rate: number;
  batch_distribution: BatchProgressItem[];
  status_distribution: StatusDistributionItem[];
  priority_distribution: PriorityDistributionItem[];
  learner_distribution: LearnerProgressItem[];
}

export async function fetchManagerProgressSummary(): Promise<ManagerProgressSummary> {
  const res = await fetch("/api/v1/manager/progress", {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch manager progress (${res.status})`);
  }
  return await res.json();
}

export async function fetchManagerTasks(
  page = 1,
  pageSize = 100,
  status?: string
): Promise<PaginatedResponse<WorkflowTask>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status) params.append("status", status);
  const res = await fetch(`/api/v1/manager/tasks?${params.toString()}`, {
    headers: getHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch manager tasks (${res.status})`);
  }
  return await res.json();
}


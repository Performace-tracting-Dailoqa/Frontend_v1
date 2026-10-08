"use client";

import { apiJson } from "./apiClient";

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


// ---------------------------------------------------------------------------
// Teacher Batches (/api/v1/teacher/batches)
// ---------------------------------------------------------------------------

export async function fetchTeacherBatches(): Promise<TeacherBatch[]> {
  return apiJson<TeacherBatch[]>("/api/v1/teacher/batches", {}, "Failed to fetch teacher batches");
}

export async function createTeacherBatch(data: {
  name: string;
  course?: string;
  department?: string;
  start_date?: string;
  end_date?: string;
}): Promise<TeacherBatch> {
  return apiJson<TeacherBatch>(
    "/api/v1/teacher/batches",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Failed to create batch"
  );
}

// ---------------------------------------------------------------------------
// Teacher Students (/api/v1/teacher/students)
// ---------------------------------------------------------------------------

export async function fetchTeacherStudents(): Promise<TeacherStudent[]> {
  return apiJson<TeacherStudent[]>("/api/v1/teacher/students", {}, "Failed to fetch assigned students");
}

export async function fetchUnassignedStudents(department?: string): Promise<TeacherStudent[]> {
  const url = department
    ? `/api/v1/teacher/students/unassigned?department=${encodeURIComponent(department)}`
    : "/api/v1/teacher/students/unassigned";
  return apiJson<TeacherStudent[]>(url, {}, "Failed to fetch unassigned students");
}

export async function updateStudentBatch(
  studentId: string,
  batchId: string | null
): Promise<TeacherStudent> {
  return apiJson<TeacherStudent>(
    `/api/v1/teacher/students/${studentId}/batch`,
    {
      method: "PATCH",
      body: JSON.stringify({ batch_id: batchId }),
    },
    "Failed to update student batch"
  );
}

export async function removeStudentFromBatch(
  batchId: string,
  studentId: string
): Promise<TeacherStudent> {
  return apiJson<TeacherStudent>(
    `/api/v1/teacher/batches/${batchId}/students/${studentId}`,
    {
      method: "DELETE",
    },
    "Failed to remove student from batch"
  );
}

export async function assignStudentsToBatch(
  batchId: string,
  studentIds: string[]
): Promise<{ success: boolean; message: string }> {
  return apiJson<{ success: boolean; message: string }>(
    `/api/v1/teacher/batches/${batchId}/students`,
    {
      method: "POST",
      body: JSON.stringify({ student_ids: studentIds }),
    },
    "Failed to assign students to batch"
  );
}

export async function fetchStudentProfile(studentId: string): Promise<any> {
  return apiJson<any>(`/api/v1/teacher/students/${studentId}`, {}, "Failed to fetch student profile");
}


// ---------------------------------------------------------------------------
// General Evaluations (/api/v1/teacher/students/{student_id}/evaluations)
// ---------------------------------------------------------------------------

export async function fetchStudentGeneralEvaluation(studentId: string): Promise<GeneralEvaluation | null> {
  try {
    return await apiJson<GeneralEvaluation>(`/api/v1/teacher/students/${studentId}/evaluations`, {}, "Failed to fetch evaluation");
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
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
  return apiJson<GeneralEvaluation>(
    `/api/v1/teacher/students/${studentId}/evaluations`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Failed to create evaluation"
  );
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
  return apiJson<GeneralEvaluation>(
    `/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Failed to update evaluation"
  );
}

export async function deleteStudentGeneralEvaluation(
  studentId: string,
  evaluationId: string
): Promise<void> {
  return apiJson<void>(
    `/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}`,
    {
      method: "DELETE",
    },
    "Failed to delete evaluation"
  );
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
  return apiJson<GeneralMetric>(
    `/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}/metrics`,
    {
      method: "POST",
      body: JSON.stringify(metric),
    },
    "Failed to create metric"
  );
}

export async function deleteGeneralMetric(
  studentId: string,
  evaluationId: string,
  metricId: string
): Promise<void> {
  return apiJson<void>(
    `/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}/metrics/${metricId}`,
    {
      method: "DELETE",
    },
    "Failed to delete metric"
  );
}

// ---------------------------------------------------------------------------
// Japanese Dashboard & Batch/Student Analytics
// ---------------------------------------------------------------------------

export interface HistoryPoint {
  date: string;
  score: number;
  count?: number;
  label?: string;
  kanji?: number;
  vocab?: number;
  grammar?: number;
  listening?: number;
  speaking?: number;
  title?: string;
  type?: string;
}

export interface SkillBreakdownItem {
  category: string;
  average_percentage?: number;
  score?: number;
  count?: number;
  drills_count?: number;
}

export interface BatchPerformanceItem {
  batch_id: string;
  batch_name: string;
  department: string;
  student_count: number;
  average_score: number;
  evaluations_count: number;
  performance_history: HistoryPoint[];
}

export interface TeacherDashboardSummaryResponse {
  summary: {
    total_batches: number;
    total_students: number;
    overall_avg_score: number;
    chapters_completed: number;
    total_evaluations: number;
    finalized_evaluations: number;
    jlpt_target: string;
  };
  batches: BatchPerformanceItem[];
  global_history: HistoryPoint[];
  skill_breakdown: SkillBreakdownItem[];
}

export interface BatchStudentItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  enrollment_no: string;
  department: string;
  status: string;
  evaluations_count: number;
  average_score: number;
  attendance_rate: number;
  latest_score?: number | null;
  latest_feedback?: string | null;
  jlpt_level?: string;
}

export interface BatchJapaneseDetailsResponse {
  batch: TeacherBatch;
  summary: {
    batch_name: string;
    department: string;
    student_count: number;
    average_score: number;
    evaluations_count: number;
  };
  students: BatchStudentItem[];
  performance_history: HistoryPoint[];
  skill_breakdown: SkillBreakdownItem[];
}

export interface StudentJapaneseEvalItem {
  id: string;
  evaluation_title: string;
  evaluation_type: string;
  evaluation_date: string;
  jlpt_level: string;
  total_score: number | null;
  max_score: number;
  percentage: number;
  status: string;
  attendance_score: number;
  feedback: string | null;
  remarks: string | null;
  evaluated_at: string | null;
  metrics: Array<{
    id: string;
    category: string;
    name: string;
    score: number;
    full_score: number;
    proficiency_level?: string;
    remarks?: string;
  }>;
  category_scores: Record<string, number>;
}

export interface StudentJapaneseAnalyticsResponse {
  student: {
    id: string;
    name: string;
    email: string;
    enrollment_no: string;
    department: string;
    batch_id: string;
    batch_name: string;
    overall_average: number;
    attendance_rate: number;
    total_evaluations: number;
    target_jlpt: string;
  };
  performance_trend: HistoryPoint[];
  skills_breakdown: SkillBreakdownItem[];
  evaluations_history: StudentJapaneseEvalItem[];
}

export async function fetchTeacherDashboardSummary(): Promise<TeacherDashboardSummaryResponse> {
  return apiJson<TeacherDashboardSummaryResponse>("/api/v1/teacher/dashboard-summary", {}, "Failed to fetch dashboard summary");
}

export async function fetchBatchJapaneseDetails(batchId: string): Promise<BatchJapaneseDetailsResponse> {
  return apiJson<BatchJapaneseDetailsResponse>(`/api/v1/teacher/batches/${batchId}/details`, {}, "Failed to fetch batch details");
}

export async function fetchStudentJapaneseAnalytics(studentId: string): Promise<StudentJapaneseAnalyticsResponse> {
  return apiJson<StudentJapaneseAnalyticsResponse>(`/api/v1/teacher/students/${studentId}/japanese-analytics`, {}, "Failed to fetch student Japanese analytics");
}

export interface TeacherFeedbackItem {
  id: string;
  title: string;
  feedback: string;
  type: string;
  jlpt_level: string;
  percentage: number | null;
  date: string;
  created_at: string;
  student_id: string;
  student_name: string;
  student_email: string;
  enrollment_no: string;
  batch_id: string | null;
  batch_name: string;
  is_batch_feedback: boolean;
}

export interface PostFeedbackPayload {
  target_type: "batch" | "student";
  target_id: string;
  title?: string;
  feedback: string;
  rating?: number;
  jlpt_level?: string;
}

export async function fetchTeacherFeedbackFeed(batchId?: string, studentId?: string): Promise<TeacherFeedbackItem[]> {
  const params = new URLSearchParams();
  if (batchId) params.append("batch_id", batchId);
  if (studentId) params.append("student_id", studentId);

  const qs = params.toString();
  const url = `/api/v1/teacher/feedbacks${qs ? `?${qs}` : ""}`;
  return apiJson<TeacherFeedbackItem[]>(url, {}, "Failed to fetch feedback feed");
}

export async function postTeacherFeedback(payload: PostFeedbackPayload): Promise<any> {
  return apiJson<any>(
    "/api/v1/teacher/feedbacks",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to post feedback"
  );
}

export interface JapaneseMetricInput {
  category: string;
  name: string;
  score: number;
  full_score?: number;
  weightage?: number;
  proficiency_level?: string;
  remarks?: string;
}

export interface CreateJapaneseEvaluationPayload {
  evaluation_title: string;
  evaluation_type: string;
  jlpt_level: string;
  evaluation_date?: string;
  percentage?: number;
  total_score?: number;
  max_score?: number;
  attendance_score?: number;
  status?: string;
  feedback?: string;
  remarks?: string;
  batch_id?: string;
  metrics?: JapaneseMetricInput[];
}

export async function createStudentJapaneseEvaluation(
  studentId: string,
  payload: CreateJapaneseEvaluationPayload
): Promise<any> {
  return apiJson<any>(
    `/api/v1/teacher/students/${studentId}/japanese-evaluations`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to save Japanese evaluation"
  );
}

export interface TeacherEvaluationHistoryItem {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  enrollment_no: string;
  batch_id: string | null;
  batch_name: string;
  evaluation_title: string;
  evaluation_type: string;
  jlpt_level: string;
  evaluation_date: string;
  evaluated_at: string;
  total_score: number | null;
  max_score: number;
  percentage: number;
  attendance_score: number;
  status: string;
  feedback: string;
  remarks: string;
  metrics: Array<{
    id?: string;
    category: string;
    name: string;
    score: number;
    full_score: number;
    proficiency_level?: string;
    remarks?: string;
  }>;
  category_scores: Record<string, number>;
}

export async function fetchTeacherEvaluationHistory(
  batchId?: string,
  studentId?: string
): Promise<TeacherEvaluationHistoryItem[]> {
  const params = new URLSearchParams();
  if (batchId) params.append("batch_id", batchId);
  if (studentId) params.append("student_id", studentId);

  const qs = params.toString();
  const url = `/api/v1/teacher/evaluations/history${qs ? `?${qs}` : ""}`;
  return apiJson<TeacherEvaluationHistoryItem[]>(url, {}, "Failed to fetch evaluation history");
}

// ---------------------------------------------------------------------------
// Teacher Workflows & Homework/Test Assignments
// ---------------------------------------------------------------------------

export interface TeacherWorkflow {
  id: string;
  batch_id?: string | null;
  batch_name?: string | null;
  name: string;
  description?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TeacherWorkflowTask {
  id: string;
  workflow_id: string;
  workflow_name?: string | null;
  student_id: string;
  student_name?: string | null;
  student_email?: string | null;
  enrollment_no?: string | null;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedTeacherWorkflows {
  total: number;
  page: number;
  page_size: number;
  items: TeacherWorkflow[];
}

export interface PaginatedTeacherTasks {
  total: number;
  page: number;
  page_size: number;
  items: TeacherWorkflowTask[];
}

export async function fetchTeacherWorkflows(
  batchId?: string,
  page = 1,
  pageSize = 50
): Promise<PaginatedTeacherWorkflows> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (batchId && batchId !== "all") params.append("batch_id", batchId);

  return apiJson<PaginatedTeacherWorkflows>(
    `/api/v1/teacher/workflows?${params.toString()}`,
    {},
    "Failed to fetch teacher workflows"
  );
}

export async function createTeacherWorkflow(data: {
  name: string;
  description?: string;
  batch_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<TeacherWorkflow> {
  return apiJson<TeacherWorkflow>(
    "/api/v1/teacher/workflows",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Failed to create workflow"
  );
}

export async function deleteTeacherWorkflow(workflowId: string): Promise<void> {
  return apiJson<void>(
    `/api/v1/teacher/workflows/${workflowId}`,
    {
      method: "DELETE",
    },
    "Failed to delete workflow"
  );
}

export async function fetchTeacherWorkflowTasks(
  workflowId: string,
  page = 1,
  pageSize = 100
): Promise<PaginatedTeacherTasks> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return apiJson<PaginatedTeacherTasks>(
    `/api/v1/teacher/workflows/${workflowId}/tasks?${params.toString()}`,
    {},
    "Failed to fetch tasks"
  );
}

export async function createTeacherWorkflowTask(
  workflowId: string,
  data: {
    title: string;
    description?: string;
    student_id: string;
    due_date?: string;
    priority?: string;
  }
): Promise<TeacherWorkflowTask> {
  return apiJson<TeacherWorkflowTask>(
    `/api/v1/teacher/workflows/${workflowId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify({ ...data, workflow_id: workflowId }),
    },
    "Failed to create task"
  );
}

export async function bulkCreateTeacherWorkflowTasks(
  workflowId: string,
  data: {
    title: string;
    description?: string;
    due_date?: string;
    priority?: string;
    student_ids: string[];
  }
): Promise<{ success: boolean; assigned_count: number; tasks: TeacherWorkflowTask[] }> {
  return apiJson<{ success: boolean; assigned_count: number; tasks: TeacherWorkflowTask[] }>(
    `/api/v1/teacher/workflows/${workflowId}/bulk-tasks`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "Failed to bulk assign tasks"
  );
}

export async function deleteTeacherWorkflowTask(workflowId: string, taskId: string): Promise<void> {
  return apiJson<void>(
    `/api/v1/teacher/workflows/${workflowId}/tasks/${taskId}`,
    {
      method: "DELETE",
    },
    "Failed to delete task"
  );
}





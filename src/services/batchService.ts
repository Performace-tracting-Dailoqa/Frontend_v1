"use client";

import { apiJson } from "./apiClient";

/**
 * Batch roster client.
 *
 * Backs the Teams page's drill-down: clicking a batch opens the interns enrolled
 * in it, as its own page with a back button.
 *
 * Separate from `insightsService` because this reads a *different* endpoint. The
 * team roll-up in `insightsService` carries a headcount but no roster, so there
 * is nothing there to filter down to.
 */

/**
 * One intern in a batch, as `GET /api/v1/students` returns them.
 *
 * A leaner shape than the directory's `DirectoryPerson`: this list only renders
 * profile and identity fields, so it does not drag in the People page's notion of
 * a person and the two can drift apart independently.
 */
export interface BatchLearner {
  /** Primary key of the `students` profile row. */
  id: string;
  /** The `users` row this profile belongs to. */
  user_id: string;
  name: string | null;
  email: string | null;
  enrollment_no: string | null;
  department: string | null;
  /** `YYYY-MM-DD` from the API; formatted for display, never parsed as a Date. */
  joining_date: string | null;
  status: string | null;
  batch_id: string | null;
  is_active: boolean;
}

export interface BatchLearnerPage {
  items: BatchLearner[];
  total: number;
  page: number;
  page_size: number;
}

export interface BatchLearnerQuery {
  batchId: string;
  page?: number;
  /** 1-100; the endpoint rejects anything larger with a 422. */
  pageSize?: number;
}

/** Interns enrolled in one batch. */
export async function fetchBatchLearners(
  query: BatchLearnerQuery
): Promise<BatchLearnerPage> {
  const { batchId, page = 1, pageSize = 100 } = query;
  const params = new URLSearchParams({
    batch_id: batchId,
    page: String(page),
    page_size: String(pageSize),
  });

  return apiJson<BatchLearnerPage>(
    `/api/v1/students?${params.toString()}`,
    { cache: "no-store" },
    "Could not load the batch roster"
  );
}

/** The endpoint's page ceiling; a larger `page_size` is a 422, not a truncation. */
export const BATCH_PAGE_CAP = 100;

/**
 * Stop paging after this many requests.
 *
 * 20 * 100 is 2000 interns in one batch, which is past any real cohort. The cap
 * is a backstop against an endpoint that reports a `total` it never satisfies,
 * not a limit the UI is expected to reach.
 */
const MAX_ROSTER_PAGES = 20;

/**
 * Every intern in a batch, paged through to the end.
 *
 * The roster is shown as one list, so it has to be complete: truncating at the
 * page cap would make the "Interns" count disagree with the headcount the Teams
 * list shows on the button that got the user here.
 *
 * Rows are de-duplicated by id so that a page which repeats cannot inflate the
 * count or list someone twice.
 */
export async function fetchAllBatchLearners(batchId: string): Promise<BatchLearner[]> {
  const seen = new Map<string, BatchLearner>();

  for (let page = 1; page <= MAX_ROSTER_PAGES; page += 1) {
    const result = await fetchBatchLearners({ batchId, page, pageSize: BATCH_PAGE_CAP });
    for (const learner of result.items) seen.set(learner.id, learner);

    // A short page is the end. Without this, an endpoint that ignored `page`
    // would return full pages forever and never exit on its own.
    if (result.items.length < result.page_size) break;
    if (seen.size >= result.total) break;
  }

  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Batch Full Details (Workflows, Workflow Tasks, Evaluations, Students)
// ---------------------------------------------------------------------------

export interface BatchStudentItem {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  enrollment_no: string | null;
  department: string | null;
  joining_date: string | null;
  status: string | null;
  is_active: boolean;
}

export interface BatchWorkflowItem {
  id: string;
  batch_id?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  title: string;
  description?: string | null;
  status?: string | null;
  task_count: number;
  completed_task_count: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
}

export interface BatchMetricItem {
  id?: string | null;
  name: string;
  description?: string | null;
  score?: number | null;
  full_score?: number | null;
  weightage?: number | null;
  weighted_score?: number | null;
  remarks?: string | null;
}

export interface BatchTaskEvaluationItem {
  id: string;
  workflow_task_id: string;
  evaluator_name?: string | null;
  total_score?: number | null;
  max_score?: number | null;
  percentage?: number | null;
  status?: string | null;
  remarks?: string | null;
  evaluated_at?: string | null;
  metrics: BatchMetricItem[];
}

export interface BatchTaskItem {
  id: string;
  workflow_id?: string | null;
  workflow_title?: string | null;
  student_id?: string | null;
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
  created_at?: string | null;
  evaluation?: BatchTaskEvaluationItem | null;
}

export interface BatchFullDetails {
  batch: {
    id: string;
    name: string;
    department?: string | null;
    status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    manager_id?: string | null;
    teacher_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  manager?: { id?: string | null; name?: string | null; email?: string | null } | null;
  teacher?: { id?: string | null; name?: string | null; email?: string | null } | null;
  summary: {
    student_count: number;
    workflow_count: number;
    task_count: number;
    completed_tasks: number;
    in_progress_tasks: number;
    pending_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
  };
  students: BatchStudentItem[];
  workflows: BatchWorkflowItem[];
  tasks: BatchTaskItem[];
}

export async function fetchBatchFullDetails(batchId: string): Promise<BatchFullDetails> {
  return apiJson<BatchFullDetails>(
    `/api/v1/batches/${batchId}/details`,
    { cache: "no-store" },
    "Could not load batch details"
  );
}


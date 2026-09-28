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

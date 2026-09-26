export interface GeneralMetric {
  id: string;
  name: string;
  description?: string;
  score?: number;
  full_score?: number;
  weightage?: number;
  weighted_score?: number;
  remarks?: string;
  general_evaluation_id: string;
  created_at: string;
  updated_at: string;
}

export interface GeneralEvaluation {
  id: string;
  student_id: string;
  evaluator_teacher_id: string;
  evaluation_date?: string;
  total_score?: number;
  max_score?: number;
  percentage?: number;
  status?: string;
  evaluated_at?: string;
  finalized_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  metrics: GeneralMetric[];
}

export async function fetchGeneralEvaluation(studentId: string): Promise<GeneralEvaluation | null> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch evaluation (${res.status})`);
  }
  return res.json();
}

export async function createGeneralEvaluation(
  studentId: string,
  data: Partial<GeneralEvaluation>
): Promise<GeneralEvaluation> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create evaluation (${res.status})`);
  }
  return res.json();
}

export async function updateGeneralEvaluation(
  studentId: string,
  evaluationId: string,
  data: Partial<GeneralEvaluation>
): Promise<GeneralEvaluation> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update evaluation (${res.status})`);
  }
  return res.json();
}

export async function createGeneralMetric(
  studentId: string,
  evaluationId: string,
  data: Partial<GeneralMetric>
): Promise<GeneralMetric> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}/metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create metric (${res.status})`);
  }
  return res.json();
}

export async function updateGeneralMetric(
  studentId: string,
  evaluationId: string,
  metricId: string,
  data: Partial<GeneralMetric>
): Promise<GeneralMetric> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}/metrics/${metricId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update metric (${res.status})`);
  }
  return res.json();
}

export async function deleteGeneralMetric(
  studentId: string,
  evaluationId: string,
  metricId: string
): Promise<void> {
  const res = await fetch(`/api/v1/teacher/students/${studentId}/evaluations/${evaluationId}/metrics/${metricId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete metric (${res.status})`);
  }
}

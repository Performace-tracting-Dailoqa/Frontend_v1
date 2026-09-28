"use client";

import { apiFetch, apiJson } from "./apiClient";

export interface BaseUserPayload {
  email: string;
  name: string;
  department?: string;
  specialization?: string;
  enrollment_no?: string;
}

export interface UserProfileResponse {
  /** Primary key of the role profile row (hrs.id / managers.id / teachers.id / students.id). */
  id: string;
  /** Linked public.users id. */
  user_id: string;
  name?: string | null;
  email?: string | null;
  department?: string | null;
  specialization?: string | null;
  enrollment_no?: string | null;
  batch_id?: string | null;
  joining_date?: string | null;
  is_active: boolean;
  role_name?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export type UserData = UserProfileResponse;

export interface UserListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---------------------------------------------------------------------------
// HR Endpoints (/api/v1/hr)
// ---------------------------------------------------------------------------

export async function fetchHRList(page = 1, pageSize = 100, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const data = await apiJson<UserListResponse<UserProfileResponse>>(
    `/api/v1/hr?${params.toString()}`,
    { cache: "no-store" },
    "Failed to fetch HR list"
  );
  return { ...data, items: (data.items || []).map((i) => ({ ...i, role_name: "HR" })) };
}

export async function createHR(payload: { email: string; name: string; department?: string; specialization?: string }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    "/api/v1/hr",
    { method: "POST", body: JSON.stringify(payload) },
    "Failed to create HR profile"
  );
}

export async function updateHR(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    `/api/v1/hr/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "Failed to update HR profile"
  );
}

export async function deleteHR(id: string): Promise<void> {
  await apiJson<void>(`/api/v1/hr/${id}`, { method: "DELETE" }, "Failed to delete HR profile");
}

// ---------------------------------------------------------------------------
// Manager Endpoints (/api/v1/managers)
// ---------------------------------------------------------------------------

export async function fetchManagerList(page = 1, pageSize = 100, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const data = await apiJson<UserListResponse<UserProfileResponse>>(
    `/api/v1/managers?${params.toString()}`,
    { cache: "no-store" },
    "Failed to fetch manager list"
  );
  return { ...data, items: (data.items || []).map((i) => ({ ...i, role_name: "Manager" })) };
}

export async function createManager(payload: { email: string; name: string; department?: string }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    "/api/v1/managers",
    { method: "POST", body: JSON.stringify(payload) },
    "Failed to create manager profile"
  );
}

export async function updateManager(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    `/api/v1/managers/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "Failed to update manager profile"
  );
}

export async function deleteManager(id: string): Promise<void> {
  await apiJson<void>(`/api/v1/managers/${id}`, { method: "DELETE" }, "Failed to delete manager profile");
}

// ---------------------------------------------------------------------------
// Teacher Endpoints (/api/v1/teachers)
// ---------------------------------------------------------------------------

export async function fetchTeacherList(page = 1, pageSize = 100, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const data = await apiJson<UserListResponse<UserProfileResponse>>(
    `/api/v1/teachers?${params.toString()}`,
    { cache: "no-store" },
    "Failed to fetch teacher list"
  );
  return { ...data, items: (data.items || []).map((i) => ({ ...i, role_name: "Teacher" })) };
}

export async function createTeacher(payload: { email: string; name: string; department?: string; specialization?: string }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    "/api/v1/teachers",
    { method: "POST", body: JSON.stringify(payload) },
    "Failed to create teacher profile"
  );
}

export async function updateTeacher(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    `/api/v1/teachers/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "Failed to update teacher profile"
  );
}

export async function deleteTeacher(id: string): Promise<void> {
  await apiJson<void>(`/api/v1/teachers/${id}`, { method: "DELETE" }, "Failed to delete teacher profile");
}

// ---------------------------------------------------------------------------
// Student Endpoints (/api/v1/students)
//
// "Learner" and "Intern" are the same record in the PMS: both are a row in
// `public.students` linked to a `public.users` identity. The People page labels
// the bucket "Intern / Learner" rather than inventing a second entity.
// ---------------------------------------------------------------------------

export async function fetchStudentList(page = 1, pageSize = 100, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const data = await apiJson<UserListResponse<UserProfileResponse>>(
    `/api/v1/students?${params.toString()}`,
    { cache: "no-store" },
    "Failed to fetch student list"
  );
  return { ...data, items: (data.items || []).map((i) => ({ ...i, role_name: "Student" })) };
}

export async function createStudent(payload: { email: string; name: string; department?: string; enrollment_no?: string }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    "/api/v1/students",
    { method: "POST", body: JSON.stringify(payload) },
    "Failed to create student profile"
  );
}

export async function updateStudent(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>(
    `/api/v1/students/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    "Failed to update student profile"
  );
}

export async function deleteStudent(id: string): Promise<void> {
  await apiJson<void>(`/api/v1/students/${id}`, { method: "DELETE" }, "Failed to delete student profile");
}

// ---------------------------------------------------------------------------
// Re-exported for callers that build their own headers (e.g. health probes).
// ---------------------------------------------------------------------------

export { apiFetch };

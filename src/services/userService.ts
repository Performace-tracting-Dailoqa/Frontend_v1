"use client";

import { getAuthToken } from "@/utils/auth";

export interface BaseUserPayload {
  email: string;
  name: string;
  department?: string;
  specialization?: string;
  enrollment_no?: string;
}

export interface UserProfileResponse {
  id: string;
  user_id: string;
  name?: string | null;
  email?: string | null;
  department?: string | null;
  specialization?: string | null;
  enrollment_no?: string | null;
  is_active: boolean;
  role_name?: string;
}

export interface UserListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

function getHeaders(): Record<string, string> {
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

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });
}

// ---------------------------------------------------------------------------
// HR Endpoints (/api/v1/hr)
// ---------------------------------------------------------------------------

export async function fetchHRList(page = 1, pageSize = 50, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const res = await apiFetch(`/api/v1/hr?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch HR list (${res.status})`);
  }
  const data = await res.json();
  return {
    ...data,
    items: data.items.map((i: UserProfileResponse) => ({ ...i, role_name: "HR" })),
  };
}

export async function createHR(payload: { email: string; name: string; department?: string; specialization?: string }): Promise<UserProfileResponse> {
  const res = await apiFetch("/api/v1/hr", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create HR profile (${res.status})`);
  }
  return await res.json();
}

export async function updateHR(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  const res = await apiFetch(`/api/v1/hr/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update HR profile (${res.status})`);
  }
  return await res.json();
}

export async function deleteHR(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/hr/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete HR profile (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Manager Endpoints (/api/v1/managers)
// ---------------------------------------------------------------------------

export async function fetchManagerList(page = 1, pageSize = 50, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const res = await apiFetch(`/api/v1/managers?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch manager list (${res.status})`);
  }
  const data = await res.json();
  return {
    ...data,
    items: data.items.map((i: UserProfileResponse) => ({ ...i, role_name: "Manager" })),
  };
}

export async function createManager(payload: { email: string; name: string; department?: string }): Promise<UserProfileResponse> {
  const res = await apiFetch("/api/v1/managers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create manager profile (${res.status})`);
  }
  return await res.json();
}

export async function updateManager(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  const res = await apiFetch(`/api/v1/managers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update manager profile (${res.status})`);
  }
  return await res.json();
}

export async function deleteManager(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/managers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete manager profile (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Teacher Endpoints (/api/v1/teachers)
// ---------------------------------------------------------------------------

export async function fetchTeacherList(page = 1, pageSize = 50, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const res = await apiFetch(`/api/v1/teachers?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch teacher list (${res.status})`);
  }
  const data = await res.json();
  return {
    ...data,
    items: data.items.map((i: UserProfileResponse) => ({ ...i, role_name: "Teacher" })),
  };
}

export async function createTeacher(payload: { email: string; name: string; department?: string; specialization?: string }): Promise<UserProfileResponse> {
  const res = await apiFetch("/api/v1/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create teacher profile (${res.status})`);
  }
  return await res.json();
}

export async function updateTeacher(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  const res = await apiFetch(`/api/v1/teachers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update teacher profile (${res.status})`);
  }
  return await res.json();
}

export async function deleteTeacher(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/teachers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete teacher profile (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Student Endpoints (/api/v1/students)
// ---------------------------------------------------------------------------

export async function fetchStudentList(page = 1, pageSize = 50, department?: string): Promise<UserListResponse<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (department) params.append("department", department);

  const res = await apiFetch(`/api/v1/students?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to fetch student list (${res.status})`);
  }
  const data = await res.json();
  return {
    ...data,
    items: data.items.map((i: UserProfileResponse) => ({ ...i, role_name: "Student" })),
  };
}

export async function createStudent(payload: { email: string; name: string; department?: string; enrollment_no?: string }): Promise<UserProfileResponse> {
  const res = await apiFetch("/api/v1/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to create student profile (${res.status})`);
  }
  return await res.json();
}

export async function updateStudent(id: string, payload: Partial<BaseUserPayload> & { is_active?: boolean }): Promise<UserProfileResponse> {
  const res = await apiFetch(`/api/v1/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to update student profile (${res.status})`);
  }
  return await res.json();
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/students/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || err?.detail || `Failed to delete student profile (${res.status})`);
  }
}

"use client";

import { apiFetch, apiJson } from "./apiClient";
import {
  fetchMe,
  getAuthSession,
  saveProfileSession,
  UserDetail,
  UserSession,
} from "@/utils/auth";
import {
  createHR,
  createManager,
  createStudent,
  createTeacher,
  deleteHR,
  deleteManager,
  deleteStudent,
  deleteTeacher,
  fetchHRList,
  fetchManagerList,
  fetchStudentList,
  fetchTeacherList,
  updateHR,
  updateManager,
  updateStudent,
  updateTeacher,
  UserProfileResponse,
} from "./userService";

/**
 * Superuser administration client.
 *
 * Responsibilities:
 *  - Aggregate the four role directories into one searchable People list
 *  - Provision / suspend / deactivate people through the role-specific CRUD APIs
 *  - Read and update the signed-in superuser's own profile
 *
 * Role mapping used across the dashboard:
 *   HR        -> `public.hrs`       (HR Manager)
 *   Manager   -> `public.managers`
 *   Teacher   -> `public.teachers`
 *   Intern    -> `public.students`   (the PMS has no separate intern entity;
 *                                       learners and interns are the same record)
 *
 * Every mutation takes the **profile** id, which is what the list endpoints
 * return in `UserProfileResponse.id` and what the PUT/DELETE routes expect.
 */

// ---------------------------------------------------------------------------
// System health
// ---------------------------------------------------------------------------

export interface SystemTelemetryData {
  status: string;
  database_connected: boolean;
  database_latency_ms: number;
  timestamp: number;
}

export interface SystemTelemetryError {
  message: string;
}

/**
 * Probe `GET /api/v1/health` and measure the round-trip latency.
 *
 * This returns *only* what the backend can actually assert. Identity and
 * workload counts come from `GET /api/v1/superuser/overview` instead of being
 * hard-coded, so nothing on the dashboard can drift from the database.
 */
export async function fetchSystemTelemetry(): Promise<SystemTelemetryData | null> {
  try {
    const startTime = Date.now();
    const res = await apiFetch("/api/v1/health", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const latency = Date.now() - startTime;
    if (!res.ok) return null;

    const data = await res.json();
    const isDbConnected = data.database === true;

    return {
      status: isDbConnected ? "Operational" : "Degraded",
      database_connected: isDbConnected,
      database_latency_ms: latency,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn("Failed to reach the backend health endpoint:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// People directory
// ---------------------------------------------------------------------------

export type DirectoryRole = "HR Manager" | "Manager" | "Teacher" | "Intern";

export interface DirectoryPerson {
  /** Profile-table primary key — the id every PUT/DELETE endpoint expects. */
  profileId: string;
  /** Linked public.users id. */
  userId: string;
  name: string;
  email: string;
  role: DirectoryRole;
  department: string | null;
  specialization: string | null;
  enrollmentNo: string | null;
  batchId: string | null;
  isActive: boolean;
  createdAt: string | null;
}

function initialsOf(name: string, email: string): string {
  const source = (name || email || "").trim();
  if (!source) return "??";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function displayName(item: UserProfileResponse, fallback: string): string {
  return (item.name || item.email?.split("@")[0] || fallback).trim();
}

function toPerson(
  item: UserProfileResponse,
  role: DirectoryRole,
  fallback: string
): DirectoryPerson {
  return {
    profileId: item.id,
    userId: item.user_id,
    name: displayName(item, fallback),
    email: item.email || "",
    role,
    department: item.department ?? null,
    specialization: item.specialization ?? null,
    enrollmentNo: item.enrollment_no ?? null,
    batchId: item.batch_id ?? null,
    isActive: item.is_active !== false,
    createdAt: item.created_at ?? null,
  };
}

/**
 * Load every role directory in parallel and normalize it into one list.
 *
 * A directory that fails to load is reported through `failedRoles` rather than
 * silently dropped, so the People page can warn that a bucket is incomplete
 * instead of showing a confidently empty table.
 */
export async function fetchDirectory(): Promise<{
  people: DirectoryPerson[];
  failedRoles: DirectoryRole[];
}> {
  const buckets: Array<{
    role: DirectoryRole;
    fallback: string;
    load: () => Promise<{ items: UserProfileResponse[] }>;
  }> = [
    { role: "HR Manager", fallback: "HR Officer", load: () => fetchHRList() },
    { role: "Manager", fallback: "Manager", load: () => fetchManagerList() },
    { role: "Teacher", fallback: "Teacher", load: () => fetchTeacherList() },
    { role: "Intern", fallback: "Intern", load: () => fetchStudentList() },
  ];

  const results = await Promise.all(
    buckets.map((bucket) =>
      bucket
        .load()
        .then((response) => ({
          role: bucket.role,
          fallback: bucket.fallback,
          items: response.items || [],
          failed: false,
        }))
        .catch((error) => {
          console.warn(`Failed to load ${bucket.role} directory:`, error);
          return { role: bucket.role, fallback: bucket.fallback, items: [], failed: true };
        })
    )
  );

  const people: DirectoryPerson[] = [];
  const failedRoles: DirectoryRole[] = [];

  for (const result of results) {
    if (result.failed) failedRoles.push(result.role);
    for (const item of result.items) {
      people.push(toPerson(item, result.role, result.fallback));
    }
  }

  return { people, failedRoles };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type CreatePersonPayload = {
  name: string;
  email: string;
  role: DirectoryRole;
  department?: string;
  specialization?: string;
  enrollment_no?: string;
};

/** Provision a person, routing to the API that owns their role profile. */
export async function createBackendUser(payload: CreatePersonPayload): Promise<DirectoryPerson> {
  const created = await (async () => {
    switch (payload.role) {
      case "HR Manager":
        return createHR({
          name: payload.name,
          email: payload.email,
          department: payload.department,
          specialization: payload.specialization,
        });
      case "Manager":
        return createManager({
          name: payload.name,
          email: payload.email,
          department: payload.department,
        });
      case "Teacher":
        return createTeacher({
          name: payload.name,
          email: payload.email,
          department: payload.department,
          specialization: payload.specialization,
        });
      case "Intern":
        return createStudent({
          name: payload.name,
          email: payload.email,
          department: payload.department,
          enrollment_no: payload.enrollment_no,
        });
    }
  })();

  return toPerson(created, payload.role, payload.name);
}

/** Activate or suspend a person. The backend treats this as a soft state change. */
export async function setPersonActive(person: DirectoryPerson, isActive: boolean): Promise<void> {
  const { profileId, role } = person;
  switch (role) {
    case "HR Manager":
      await updateHR(profileId, { is_active: isActive });
      return;
    case "Manager":
      await updateManager(profileId, { is_active: isActive });
      return;
    case "Teacher":
      await updateTeacher(profileId, { is_active: isActive });
      return;
    case "Intern":
      await updateStudent(profileId, { is_active: isActive });
      return;
  }
}

/**
 * Deactivate a person's profile.
 *
 * The backend implements DELETE as a soft delete (`users.is_active = false`),
 * so the row and its audit trail are preserved.
 */
export async function deactivateBackendUser(person: DirectoryPerson): Promise<void> {
  const { profileId, role } = person;
  switch (role) {
    case "HR Manager":
      await deleteHR(profileId);
      return;
    case "Manager":
      await deleteManager(profileId);
      return;
    case "Teacher":
      await deleteTeacher(profileId);
      return;
    case "Intern":
      await deleteStudent(profileId);
      return;
  }
}

// ---------------------------------------------------------------------------
// Own profile
// ---------------------------------------------------------------------------

export interface CurrentProfile {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  authProvider: string | null;
  createdAt: string | null;
  lastUpdatedAt: string | null;
  role: { id: string; name: string; description?: string | null };
  roleDescription: string | null;
  profileType: string | null;
  department: string | null;
  specialization: string | null;
  enrollmentNo: string | null;
  scopeType: string | null;
  assignedBatchCount: number;
  assignedStudentCount: number;
  assignedWorkflowCount: number;
  scopeDetails: Record<string, unknown>;
  /** Sign-in timestamp recorded client-side when the session was established. */
  loginAt: string | null;
  mustChangePassword: boolean;
  /** How the current session was authenticated: "password" or "cookie"/"microsoft". */
  sessionType: string;
}

function profileFromSession(session: UserSession): CurrentProfile {
  const user: UserDetail = session.user;
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    isActive: user.is_active !== false,
    authProvider: user.auth_provider ?? null,
    createdAt: user.created_at ?? null,
    lastUpdatedAt: user.last_updated_at ?? null,
    role: { id: user.role?.id ?? "", name: user.role?.name ?? "Unassigned" },
    roleDescription: user.role?.description ?? null,
    profileType: user.profile?.profile_type ?? null,
    department: user.profile?.department ?? null,
    specialization: user.profile?.specialization ?? null,
    enrollmentNo: user.profile?.enrollment_no ?? null,
    scopeType: user.scope?.scope_type ?? null,
    assignedBatchCount: user.scope?.assigned_batch_ids?.length ?? 0,
    assignedStudentCount: user.scope?.assigned_student_ids?.length ?? 0,
    assignedWorkflowCount: user.scope?.assigned_workflow_ids?.length ?? 0,
    scopeDetails: user.scope?.details ?? {},
    loginAt: session.loginAt ?? null,
    mustChangePassword: Boolean(session.mustChangePassword),
    sessionType: session.token ? "Bearer token" : "HttpOnly session cookie",
  };
}

/**
 * Read the signed-in superuser's profile from the cached session.
 *
 * `ProtectedRoute` already resolved `GET /api/v1/auth/me` and persisted the
 * result, so this is synchronous and needs no extra request. Call
 * `refreshProfileFromServer()` to re-read it.
 */
export function getCurrentProfile(): CurrentProfile | null {
  const session = getAuthSession();
  return session ? profileFromSession(session) : null;
}

/** Re-read `GET /api/v1/auth/me` from the API and persist the refreshed session. */
export async function refreshProfileFromServer(): Promise<CurrentProfile> {
  saveProfileSession((await fetchMe()) as UserDetail);

  const session = getAuthSession();
  if (!session) {
    throw new Error("Session could not be re-established after refreshing the profile.");
  }
  return profileFromSession(session);
}

export interface ProfileUpdateResult {
  id: string;
  name: string | null;
  email: string | null;
  updated_at: string | null;
}

/**
 * Update the signed-in user's display name.
 *
 * Only `name` is self-service: `email` is the login identifier and may be bound
 * to a Microsoft object id, so changing it requires an administrator.
 */
export async function updateOwnProfile(payload: { name: string }): Promise<ProfileUpdateResult> {
  return apiJson<ProfileUpdateResult>(
    "/api/v1/auth/me",
    { method: "PUT", body: JSON.stringify(payload) },
    "Could not save your profile"
  );
}

/** Apply a saved name to the cached session so the header updates immediately. */
export function applyProfileNameToSession(name: string): void {
  const session = getAuthSession();
  if (!session) return;
  saveProfileSession({ ...session.user, name });
}

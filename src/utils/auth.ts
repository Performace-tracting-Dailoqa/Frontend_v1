"use client";

import { z } from "zod";

export const UserRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserProfileSchema = z.object({
  profile_type: z.string(),
  profile_id: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  enrollment_no: z.string().nullable().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserScopeSchema = z.object({
  scope_type: z.string(),
  assigned_batch_ids: z.array(z.string()).optional(),
  assigned_student_ids: z.array(z.string()).optional(),
  assigned_workflow_ids: z.array(z.string()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export type UserScope = z.infer<typeof UserScopeSchema>;

export const UserDetailSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  is_active: z.boolean(),
  must_change_password: z.boolean(),
  auth_provider: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  last_updated_at: z.string().nullable().optional(),
  role: UserRoleSchema,
  profile: UserProfileSchema.nullable().optional(),
  scope: UserScopeSchema.nullable().optional(),
});
export type UserDetail = z.infer<typeof UserDetailSchema>;

export const UserSessionSchema = z.object({
  token: z.string(),
  tokenType: z.string(),
  expiresIn: z.number().nullable().optional(),
  mustChangePassword: z.boolean(),
  user: UserDetailSchema,
  role: UserRoleSchema.nullable().optional(),
  profile: UserProfileSchema.nullable().optional(),
  scope: UserScopeSchema.nullable().optional(),
  loginAt: z.string(),
});
export type UserSession = z.infer<typeof UserSessionSchema>;

export const LoginResponseDataSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().nullable().optional(),
  must_change_password: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable().optional(),
    role_name: z.string(),
    is_active: z.boolean(),
  }),
});
export type LoginResponseData = z.infer<typeof LoginResponseDataSchema>;


const PROFILE_SESSION_KEY = "dailoqa_pms_profile_session";
const LEGACY_TOKEN_SESSION_KEY = "dailoqa_pms_auth_session";

export const PENDING_ROLE_CODE = "MISSING_ROLE_MAPPING";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

export function getAuthToken(): string | null {
  const session = getAuthSession();
  return session && session.token ? session.token : null;
}

export function getAuthSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const profileRaw = localStorage.getItem(PROFILE_SESSION_KEY);
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw) as UserSession;
      if (parsed && parsed.user) return parsed;
    }
    const legacyRaw = localStorage.getItem(LEGACY_TOKEN_SESSION_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as UserSession;
      if (parsed && parsed.user) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: UserSession): void {
  if (typeof window !== "undefined") {
    if (session.token) {
      localStorage.setItem(LEGACY_TOKEN_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(session));
      return;
    }
    saveProfileSession(session.user);
  }
}

export function saveProfileSession(user: UserDetail): void {
  if (typeof window === "undefined") return;
  const session: UserSession = {
    token: "",
    tokenType: "cookie",
    expiresIn: null,
    mustChangePassword: user.must_change_password,
    user,
    role: user.role,
    profile: user.profile || null,
    scope: user.scope || null,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PROFILE_SESSION_KEY);
    localStorage.removeItem(LEGACY_TOKEN_SESSION_KEY);
  }
}

export function isUserLoggedIn(): boolean {
  return getAuthSession() !== null;
}

export function startMicrosoftLogin(): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  window.location.href = "/api/auth/microsoft";
}

export function getLoginErrorMessage(code?: string | null): string {
  switch (code) {
    case "INVALID_STATE":
      return "The sign-in request could not be verified. Please try signing in again.";
    case "OAUTH_CANCELLED":
      return "The Microsoft sign-in was cancelled. No changes were made to your account.";
    case "NOT_ELIGIBLE":
      return "This Microsoft account is not eligible to access the PMS portal. Contact your HR administrator.";
    case "AUTH_SERVICE_UNAVAILABLE":
      return "Microsoft sign-in is temporarily unavailable. Please try again later or use your credentials.";
    case "SESSION_CONFIG_ERROR":
      return "Sign-in is not configured correctly. Please contact your administrator.";
    default:
      return "Unable to sign in with Microsoft. Please try again or use your credentials.";
  }
}

export function getRoleDashboardPath(roleName?: string | null): string {
  if (!roleName) return "/student/dashboard";
  const normalized = roleName.trim().toLowerCase();
  if (normalized.includes("student") || normalized.includes("employee") || normalized.includes("trainee")) {
    return "/student/dashboard";
  }
  if (normalized.includes("teacher") || normalized.includes("mentor")) {
    return "/dashboard/teacher";
  }
  if (normalized.includes("manager")) {
    return "/dashboard/manager";
  }
  if (normalized.includes("hr")) {
    return "/dashboard/hr";
  }
  if (normalized.includes("admin")) {
    return "/dashboard/super-admin";
  }
  return "/student/dashboard";
}

export class AuthError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function extractDetailMessage(data: unknown, fallback: string): { message: string; code?: string } {
  let message = fallback;
  let code: string | undefined;
  const detail = (data as Record<string, unknown>)?.detail;
  if (detail) {
    if (typeof detail === "object" && !Array.isArray(detail)) {
      const obj = detail as { message?: string; code?: string };
      message = obj.message || message;
      code = obj.code || code;
    } else if (typeof detail === "string") {
      message = detail;
    }
  }
  return { message, code };
}

export async function apiLogin(identifier: string, password: string): Promise<LoginResponseData> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/login`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
      credentials: "same-origin",
    });
  } catch {
    throw new AuthError("Unable to connect to authentication service. Please check your network or server.", 502, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const { message, code } = extractDetailMessage(data, "Invalid login credentials provided.");
    throw new AuthError(message, response.status, code || "AUTH_ERROR");
  }

  const result = LoginResponseDataSchema.safeParse(data);
  if (!result.success) {
    throw new AuthError("Invalid response format from server.", 500, "VALIDATION_ERROR");
  }

  return result.data;
}

export async function fetchMe(): Promise<UserDetail> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/me`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
  } catch {
    throw new AuthError("Failed to reach server to retrieve profile.", 502, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const { message, code } = extractDetailMessage(data, "Failed to load user profile.");
    throw new AuthError(message, response.status, code || "PROFILE_ERROR");
  }

  const result = UserDetailSchema.safeParse(data);
  if (!result.success) {
    throw new AuthError("Invalid response format from server.", 500, "VALIDATION_ERROR");
  }

  return result.data;
}

export async function apiGetMe(token?: string | null): Promise<UserDetail> {
  if (!token) {
    return fetchMe();
  }
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/me`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch {
    throw new AuthError("Failed to reach server to retrieve profile.", 502, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const { message, code } = extractDetailMessage(data, "Failed to load user profile.");
    throw new AuthError(message, response.status, code || "PROFILE_ERROR");
  }

  const result = UserDetailSchema.safeParse(data);
  if (!result.success) {
    throw new AuthError("Invalid response format from server.", 500, "VALIDATION_ERROR");
  }

  return result.data;
}

export async function apiChangePassword(
  newPassword: string,
  confirmPassword?: string,
  tokenOverride?: string
): Promise<{ success: boolean; message: string; must_change_password: boolean }> {
  const token = tokenOverride || getAuthToken();

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/change-password`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({
        new_password: newPassword,
        confirm_password: confirmPassword || newPassword,
      }),
    });
  } catch {
    throw new AuthError("Unable to connect to authentication service.", 502, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = "Failed to update password.";
    let code = "PASSWORD_CHANGE_ERROR";
    const detail = (data as Record<string, unknown>)?.detail;
    if (detail) {
      if (Array.isArray(detail) && detail.length > 0) {
        const firstErr = detail[0] as { msg?: string };
        message = firstErr.msg ? firstErr.msg.replace(/^Value error,?\s*/i, "") : message;
        code = "VALIDATION_ERROR";
      } else if (typeof detail === "object") {
        const obj = detail as { message?: string; code?: string };
        message = obj.message || message;
        code = obj.code || code;
      } else if (typeof detail === "string") {
        message = detail;
      }
    }
    if (response.status === 422) {
      if (!message || message === "Failed to update password.") {
        message = "Password must be at least 8 characters long.";
      }
    }
    throw new AuthError(message, response.status, code);
  }

  return data;
}

export async function apiLogout(): Promise<void> {
  const token = getAuthToken();
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/logout`;
  try {
    await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" },
      credentials: "same-origin",
    });
  } catch {
    // Ignore network errors during logout
  }
  clearAuthSession();
}

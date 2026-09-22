"use client";

export interface UserRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserProfile {
  profile_type: string;
  profile_id?: string | null;
  department?: string | null;
  specialization?: string | null;
  enrollment_no?: string | null;
}

export interface UserScope {
  scope_type: string;
  assigned_batch_ids?: string[];
  assigned_student_ids?: string[];
  assigned_workflow_ids?: string[];
  details?: Record<string, unknown>;
}

export interface UserDetail {
  id: string;
  email: string;
  name?: string | null;
  is_active: boolean;
  must_change_password: boolean;
  role: UserRole;
  profile?: UserProfile | null;
  scope?: UserScope | null;
}

export interface UserSession {
  token: string;
  tokenType: string;
  expiresIn?: number | null;
  mustChangePassword: boolean;
  user: UserDetail;
  role?: UserRole | null;
  profile?: UserProfile | null;
  scope?: UserScope | null;
  loginAt: string;
}

export interface LoginResponseData {
  access_token: string;
  token_type: string;
  expires_in?: number | null;
  must_change_password: boolean;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role_name: string;
    is_active: boolean;
  };
}

const STORAGE_KEY = "dailoqa_pms_auth_session";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // In browser context, relative URLs route through Next.js rewrites (zero CORS hurdles)
    return "";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

export function getAuthToken(): string | null {
  const session = getAuthSession();
  return session ? session.token : null;
}

export function getAuthSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: UserSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isUserLoggedIn(): boolean {
  const session = getAuthSession();
  return session !== null && !!session.token;
}

/**
 * Maps backend role name from /auth/me to appropriate dashboard route.
 */
export function getRoleDashboardPath(roleName?: string | null): string {
  if (!roleName) return "/dashboard/student";
  const normalized = roleName.trim().toLowerCase();
  if (normalized.includes("student") || normalized.includes("employee")) {
    return "/dashboard/student";
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
  return "/dashboard/student";
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

/**
 * Executes POST /api/v1/auth/login against backend.
 */
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
    });
  } catch {
    throw new AuthError("Unable to connect to authentication service. Please check your network or server.", 502, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = "Invalid login credentials provided.";
    let code = "AUTH_ERROR";
    if (data?.detail) {
      if (typeof data.detail === "object") {
        message = data.detail.message || message;
        code = data.detail.code || code;
      } else if (typeof data.detail === "string") {
        message = data.detail;
      }
    }
    throw new AuthError(message, response.status, code);
  }

  return data as LoginResponseData;
}

/**
 * Executes GET /api/v1/auth/me against backend.
 */
export async function apiGetMe(token: string): Promise<UserDetail> {
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
    let message = "Failed to load user profile.";
    let code = "PROFILE_ERROR";
    if (data?.detail) {
      if (typeof data.detail === "object") {
        message = data.detail.message || message;
        code = data.detail.code || code;
      } else if (typeof data.detail === "string") {
        message = data.detail;
      }
    }
    throw new AuthError(message, response.status, code);
  }

  return data as UserDetail;
}

/**
 * Executes POST /api/v1/auth/change-password against backend.
 */
export async function apiChangePassword(
  newPassword: string,
  confirmPassword?: string,
  tokenOverride?: string
): Promise<{ success: boolean; message: string; must_change_password: boolean }> {
  const token = tokenOverride || getAuthToken();
  if (!token) {
    throw new AuthError("Authentication token is missing. Please sign in again.", 401, "UNAUTHORIZED");
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/change-password`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
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
    if (data?.detail) {
      if (typeof data.detail === "object") {
        message = data.detail.message || message;
        code = data.detail.code || code;
      } else if (typeof data.detail === "string") {
        message = data.detail;
      }
    }
    throw new AuthError(message, response.status, code);
  }

  return data;
}

/**
 * Executes POST /api/v1/auth/logout against backend and clears local session.
 */
export async function apiLogout(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/v1/auth/logout`;
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
    } catch {
      // Ignore network errors during logout to guarantee client cleanup
    }
  }
  clearAuthSession();
}

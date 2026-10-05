"use client";

import { getAuthToken } from "@/utils/auth";
import { getCachedData, setCachedData, invalidateCache } from "./dataCache";

export { invalidateCache, getCachedData, setCachedData } from "./dataCache";

/**
 * Error thrown by every PMS API call.
 *
 * The backend returns `{ "code": "...", "message": "..." }` either at the top
 * level or nested under FastAPI's `detail` (the PMS wraps HTTPException details
 * in a `{code, message}` object). `ApiError` normalizes both shapes so callers
 * can rely on `message` being human-readable and `code` being the stable
 * machine-readable identifier.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "UNKNOWN_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function extractError(body: unknown, fallback: string): { message: string; code: string } {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    // FastAPI HTTPException shape: { detail: { code, message } | string }
    const detail = record.detail;
    if (detail && typeof detail === "object") {
      const d = detail as Record<string, unknown>;
      return {
        message: typeof d.message === "string" ? d.message : fallback,
        code: typeof d.code === "string" ? d.code : "API_ERROR",
      };
    }
    if (typeof detail === "string" && detail) {
      return { message: detail, code: "API_ERROR" };
    }
    // Direct shape: { code, message }
    if (typeof record.message === "string") {
      return {
        message: record.message,
        code: typeof record.code === "string" ? record.code : "API_ERROR",
      };
    }
  }
  return { message: fallback, code: "API_ERROR" };
}

export function buildHeaders(): Record<string, string> {
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

export interface ApiFetchOptions extends RequestInit {
  forceRefresh?: boolean;
  bypassCache?: boolean;
}

function resolveUrl(url: string): string {
  if (typeof window !== "undefined" || !url.startsWith("/")) {
    return url;
  }
  const base = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000"
  ).trim().replace(/\/$/, "");
  if (base.endsWith("/api") && url.startsWith("/api/")) {
    return `${base}${url.slice(4)}`;
  }
  return `${base}${url}`;
}

/**
 * Authenticated same-origin fetch against the PMS API.
 *
 * All PMS calls go through the Next.js rewrite (`/api/*` -> backend `/api/*`)
 * so credentials stay same-origin and CORS never applies.
 */
export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const targetUrl = resolveUrl(url);
  return fetch(targetUrl, {
    ...options,
    credentials: "include",
    headers: {
      ...buildHeaders(),
      ...(options.headers || {}),
    },
  });
}

/**
 * Perform a request and parse the JSON body, throwing a normalized `ApiError`
 * for any non-2xx response.
 *
 * Uses a 1-hour client cache for GET requests to provide instantaneous page navigation.
 * Mutations (POST, PUT, DELETE) automatically invalidate the cache.
 *
 * @param failureMessage Message used when the backend sends no error body.
 */
export async function apiJson<T>(
  url: string,
  options: ApiFetchOptions = {},
  failureMessage = "Request failed"
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const shouldCheckCache = isGet && !options.forceRefresh && !options.bypassCache;

  if (shouldCheckCache) {
    const cached = getCachedData<T>(url);
    if (cached !== null) {
      return cached;
    }
  }

  const res = await apiFetch(url, options);

  if (res.status === 204) {
    if (!isGet) invalidateCache();
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const { message, code } = extractError(payload, `${failureMessage} (${res.status})`);
    throw new ApiError(message, res.status, code);
  }

  // Cache successful GET responses
  if (isGet && payload !== null) {
    setCachedData(url, payload);
  } else if (!isGet) {
    // Invalidate cached data after state mutations
    invalidateCache();
  }

  return payload as T;
}

/** True when the failure is a permissions problem rather than a data problem. */
export function isPermissionError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

/** Normalize any thrown value into a message safe to render. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}


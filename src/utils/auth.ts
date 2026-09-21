"use client";

export interface UserSession {
  email: string;
  name: string;
  role: string;
  avatar: string;
  token: string;
  loginAt: string;
}

const STORAGE_KEY = "dailoqa_pms_auth_session";

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

export function saveAuthSession(email: string, role = "Teacher / Mentor"): UserSession {
  const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const session: UserSession = {
    email,
    name: name || "Teacher User",
    role,
    avatar: initials || "TU",
    token: `jwt-${Math.random().toString(36).substring(2)}-${Date.now()}`,
    loginAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isUserLoggedIn(): boolean {
  return getAuthSession() !== null;
}

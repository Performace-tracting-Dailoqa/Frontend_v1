"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuthSession,
  fetchMe,
  saveProfileSession,
  AuthError,
  PENDING_ROLE_CODE,
  UserSession,
  getRoleDashboardPath,
} from "@/utils/auth";

interface ProtectedRouteProps {
  children: (session: UserSession) => React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Client-side guard used by the role dashboards.
 *
 * Session resolution order:
 *  1. Stored session (profile metadata; token optional) — instant render.
 *  2. No stored session but the HttpOnly pms_session cookie exists (e.g. just
 *     completed a Microsoft SSO redirect): GET /api/v1/auth/me, persist the
 *     profile metadata, then render.
 *  3. /me returns 401 -> the cookie is missing/expired -> go to /login.
 *  4. /me returns 403 MISSING_ROLE_MAPPING -> first-time Microsoft user awaiting
 *     admin role assignment -> render the pending-assignment screen (no loop).
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAssignment, setPendingAssignment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const redirectToLogin = () => {
      if (!cancelled) router.replace("/login");
    };

    const handleUser = (userSession: UserSession) => {
      if (cancelled) return;

      if (userSession.mustChangePassword) {
        router.replace("/reset-password?required=true");
        return;
      }

      // Role verification (if allowedRoles specified)
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (userSession.role?.name || "").toLowerCase();
        const isAllowed = allowedRoles.some((role) =>
          userRole.includes(role.toLowerCase())
        );
        if (!isAllowed) {
          // Redirect to the user's appropriate role dashboard
          const target = getRoleDashboardPath(userSession.role?.name);
          router.replace(target);
          return;
        }
      }

      setSession(userSession);
      setIsLoading(false);
    };

    async function resolve() {
      const storedSession = getAuthSession();
      if (storedSession) {
        handleUser(storedSession);
        return;
      }

      // No stored profile — a freshly created cookie session (Microsoft SSO).
      try {
        const me = await fetchMe();
        if (cancelled) return;
        saveProfileSession(me);
        handleUser({
          token: "",
          tokenType: "cookie",
          expiresIn: null,
          mustChangePassword: me.must_change_password,
          user: me,
          role: me.role,
          profile: me.profile || null,
          scope: me.scope || null,
          loginAt: new Date().toISOString(),
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          if (err.code === PENDING_ROLE_CODE || err.statusCode === 403) {
            setPendingAssignment(true);
            setIsLoading(false);
            return;
          }
          // 401 (or any other auth failure) -> cookie missing/expired
          redirectToLogin();
          return;
        }
        // Unknown network/server failure: surface the pending screen instead of
        // a redirect loop when the backend is briefly unavailable.
        setPendingAssignment(true);
        setIsLoading(false);
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [router, allowedRoles]);

  if (isLoading || !session) {
    if (pendingAssignment) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="max-w-md w-full text-center bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-lg p-8 lg:p-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-high flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-3xl text-primary">
                manage_accounts
              </span>
            </div>
            <h1 className="text-headline-md font-headline font-bold text-on-surface mb-2 tracking-tight">
              Account pending approval
            </h1>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              You are signed in with Microsoft, but your account has not been
              assigned a role yet. An administrator needs to map your profile to
              a role before you can access the portal.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { apiLogout } = await import("@/utils/auth");
                  await apiLogout();
                } finally {
                  router.replace("/login");
                }
              }}
              className="w-full py-3 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 active:scale-[0.99] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
            <p className="mt-4 text-body-sm text-outline">
              Having trouble? Contact your HR administrator.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3 text-outline">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">
            progress_activity
          </span>
          <span className="text-body-sm font-medium">Validating authentication...</span>
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
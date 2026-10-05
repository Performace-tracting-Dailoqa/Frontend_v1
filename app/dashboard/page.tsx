"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuthSession,
  fetchMe,
  apiGetMe,
  saveAuthSession,
  saveProfileSession,
  apiLogout,
  AuthError,
  PENDING_ROLE_CODE,
  getRoleDashboardPath,
} from "@/utils/auth";

type DispatchState = "loading" | "pending-role";

/**
 * Root Dashboard router/dispatcher.
 * Redirects unauthenticated users to /login,
 * users requiring password change to /reset-password,
 * and authenticated users to their specific role dashboard based on /auth/me.
 *
 * Also the landing page after the Microsoft SSO callback — in that case
 * the session is hydrated either from the token query parameter or
 * from the HttpOnly pms_session cookie via GET /api/v1/auth/me.
 */
export default function DashboardIndex() {
  const router = useRouter();
  const [state, setState] = useState<DispatchState>("loading");

  useEffect(() => {
    let cancelled = false;

    const redirectToLogin = () => {
      if (!cancelled) router.replace("/login");
    };

    async function dispatch(roleName?: string | null) {
      if (cancelled) return;
      const target = getRoleDashboardPath(roleName);
      router.replace(target);
    }

    async function hydrateFromToken(token: string) {
      try {
        const me = await apiGetMe(token);
        if (cancelled) return;

        saveAuthSession({
          token,
          tokenType: "bearer",
          mustChangePassword: me.must_change_password,
          user: me,
          role: me.role,
          profile: me.profile || null,
          scope: me.scope || null,
          loginAt: new Date().toISOString(),
        });
        saveProfileSession(me);

        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (me.must_change_password) {
          router.replace("/reset-password?required=true");
          return;
        }

        await dispatch(me.role?.name);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          if (err.code === PENDING_ROLE_CODE || err.statusCode === 403) {
            setState("pending-role");
            return;
          }
        }
        redirectToLogin();
      }
    }

    async function hydrateFromCookie() {
      try {
        const me = await fetchMe();
        if (cancelled) return;

        if (me.must_change_password) {
          router.replace("/reset-password?required=true");
          return;
        }
        saveProfileSession(me);
        await dispatch(me.role?.name);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          if (err.code === PENDING_ROLE_CODE || err.statusCode === 403) {
            // First-time Microsoft user awaiting an admin role assignment.
            setState("pending-role");
            return;
          }
          redirectToLogin();
          return;
        }
        redirectToLogin();
      }
    }

    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const tokenFromUrl = urlParams?.get("token");
    if (tokenFromUrl) {
      hydrateFromToken(tokenFromUrl);
      return;
    }

    const session = getAuthSession();
    if (!session) {
      // Fresh cookie session (e.g. arrived from the Microsoft OAuth callback)
      hydrateFromCookie();
      return;
    }

    if (session.mustChangePassword) {
      router.replace("/reset-password?required=true");
      return;
    }

    dispatch(session.role?.name || session.user.role?.name);

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === "pending-role") {
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
            You have signed in with Microsoft, but your account has not been
            assigned a role yet. An administrator needs to map your profile to a
            role before you can access the portal.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
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
        <span className="text-body-sm font-medium">Redirecting to your dashboard...</span>
      </div>
    </div>
  );
}

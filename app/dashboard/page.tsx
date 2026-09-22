"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, getRoleDashboardPath } from "@/utils/auth";

/**
 * Root Dashboard router/dispatcher.
 * Redirects unauthenticated users to /login,
 * users requiring password change to /reset-password,
 * and authenticated users to their specific role dashboard based on /auth/me.
 */
export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !session.token) {
      router.replace("/login");
      return;
    }

    if (session.mustChangePassword) {
      router.replace("/reset-password?required=true");
      return;
    }

    const target = getRoleDashboardPath(session.role?.name || session.user.role?.name);
    router.replace(target);
  }, [router]);

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

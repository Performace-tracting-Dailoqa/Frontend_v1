"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, UserSession, getRoleDashboardPath } from "@/utils/auth";

interface ProtectedRouteProps {
  children: (session: UserSession) => React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentSession = getAuthSession();

    if (!currentSession || !currentSession.token) {
      router.replace("/login");
      return;
    }

    if (currentSession.mustChangePassword) {
      router.replace("/reset-password?required=true");
      return;
    }

    // Role verification (if allowedRoles specified)
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = (currentSession.role?.name || "").toLowerCase();
      const isAllowed = allowedRoles.some((role) =>
        userRole.includes(role.toLowerCase())
      );

      if (!isAllowed) {
        // Redirect to the user's appropriate role dashboard
        const target = getRoleDashboardPath(currentSession.role?.name);
        router.replace(target);
        return;
      }
    }

    queueMicrotask(() => {
      setSession(currentSession);
      setIsLoading(false);
    });
  }, [router, allowedRoles]);

  if (isLoading || !session) {
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

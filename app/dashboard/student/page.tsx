"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardStudentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-body-sm text-on-surface-variant font-medium">Redirecting to Student Dashboard...</span>
      </div>
    </div>
  );
}

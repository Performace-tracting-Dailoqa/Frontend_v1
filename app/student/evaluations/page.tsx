"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentEvaluationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/learning-progress");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Redirecting to Learning Progress...</p>
      </div>
    </div>
  );
}

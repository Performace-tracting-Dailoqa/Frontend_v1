"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/student/reports");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 text-xs">
      Redirecting to Student Reports...
    </div>
  );
}

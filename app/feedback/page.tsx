"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeedbackRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/student/feedback");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 text-xs">
      Redirecting to Student Feedback...
    </div>
  );
}

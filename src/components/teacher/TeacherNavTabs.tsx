"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { id: string; label: string; icon: string; path: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/dashboard/teacher" },
  { id: "learners", label: "My Learners", icon: "groups", path: "/dashboard/teacher/learners" },
  { id: "progress", label: "Learning Progress", icon: "trending_up", path: "/dashboard/teacher/progress" },
  { id: "japanese", label: "Japanese", icon: "translate", path: "/dashboard/teacher/japanese" },
  { id: "feedback", label: "Feedback", icon: "forum", path: "/dashboard/teacher/feedback" },
  { id: "evaluations", label: "Evaluations", icon: "rate_review", path: "/dashboard/teacher/evaluations" },
  { id: "reports", label: "Reports", icon: "assessment", path: "/dashboard/teacher/reports" },
  { id: "history", label: "History", icon: "history", path: "/dashboard/teacher/history" },
];

export default function TeacherNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;

        return (
          <Link
            key={tab.id}
            href={tab.path}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              isActive
                ? "bg-[#4B2EF5] text-white shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

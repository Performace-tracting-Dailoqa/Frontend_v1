"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { id: string; label: string; icon: string; path: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/dashboard/manager" },
  { id: "team", label: "My Team", icon: "group", path: "/dashboard/manager/team" },
  { id: "workflows", label: "Workflows", icon: "schema", path: "/dashboard/manager/workflows" },
  { id: "progress", label: "Progress", icon: "monitoring", path: "/dashboard/manager/progress" },
  { id: "evaluations", label: "Evaluations", icon: "assignment_turned_in", path: "/dashboard/manager/evaluations" },
  { id: "feedback", label: "Feedback", icon: "reviews", path: "/dashboard/manager/feedback" },
  { id: "reports", label: "Reports", icon: "insights", path: "/dashboard/manager/reports" },
  { id: "history", label: "History", icon: "history", path: "/dashboard/manager/history" },
];

export default function ManagerNavTabs() {
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

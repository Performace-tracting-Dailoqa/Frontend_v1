"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { TeacherTab } from "./types";

const tabs: { id: TeacherTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "attendance", label: "Attendance Marking", icon: "how_to_reg" },
  { id: "learners", label: "My Learners", icon: "groups" },
  { id: "progress", label: "Learning Progress", icon: "trending_up" },
  { id: "feedback", label: "Feedback", icon: "forum" },
  { id: "evaluations", label: "Evaluations", icon: "rate_review" },
  { id: "reports", label: "Reports", icon: "assessment" },
  { id: "history", label: "History", icon: "history" },
];

export default function TeacherNavTabs({ activeTab }: { activeTab: TeacherTab }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("tab", tab.id);

        return (
          <Link
            key={tab.id}
            href={`${pathname}?${newParams.toString()}`}
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

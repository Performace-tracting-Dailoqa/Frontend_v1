"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ManagerTab } from "./types";

const tabs: { id: ManagerTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "team", label: "My Team", icon: "group" },
  { id: "workflows", label: "Workflows", icon: "schema" },
  { id: "progress", label: "Progress", icon: "monitoring" },
  { id: "evaluations", label: "Evaluations", icon: "assignment_turned_in" },
  { id: "feedback", label: "Feedback", icon: "reviews" },
  { id: "reports", label: "Reports", icon: "insights" },
  { id: "history", label: "History", icon: "history" },
];

export default function ManagerNavTabs({ activeTab }: { activeTab: ManagerTab }) {
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

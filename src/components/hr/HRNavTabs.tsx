"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HRTab } from "./types";

const tabs: { id: HRTab; label: string; icon: string }[] = [
  { id: "employees", label: "Employees", icon: "groups" },
  { id: "cycles", label: "Performance Cycles", icon: "calendar_month" },
  { id: "evaluations", label: "Evaluation Monitoring", icon: "rule" },
  { id: "analytics", label: "Analytics", icon: "equalizer" },
  { id: "reports", label: "Reports", icon: "description" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
];

export default function HRNavTabs({ activeTab }: { activeTab: HRTab }) {
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
            href={tab.id === "employees" ? pathname : `${pathname}?${newParams.toString()}`}
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

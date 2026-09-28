"use client";

import React from "react";
import { motion } from "framer-motion";
import { SuperAdminTab } from "./types";

interface SuperAdminNavTabsProps {
  activeTab: SuperAdminTab;
  onChangeTab: (tab: SuperAdminTab) => void;
}

interface TabDef {
  key: SuperAdminTab;
  label: string;
  icon: string;
  badge?: string;
}

const TABS: TabDef[] = [
  { key: "overview", label: "Overview", icon: "dashboard" },
  { key: "teams", label: "Teams", icon: "groups" },
  { key: "users", label: "People", icon: "group" },
  { key: "progress", label: "Progress", icon: "monitoring" },
  { key: "calendar", label: "Microsoft Calendar", icon: "calendar_month" },
  { key: "add-person", label: "Add Person", icon: "person_add" },
  { key: "profile", label: "Profile", icon: "account_circle" },
];

export default function SuperAdminNavTabs({
  activeTab,
  onChangeTab,
}: SuperAdminNavTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-2 text-xs font-semibold scrollbar-none relative">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <motion.button
            key={tab.key}
            type="button"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => onChangeTab(tab.key)}
            className={`relative px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors z-10 ${
              isActive
                ? "text-white font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            {/* Sliding Active Pill Background with LayoutId */}
            {isActive && (
              <motion.div
                layoutId="activeSuperAdminTabPill"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 32,
                }}
                className="absolute inset-0 bg-[#4B2EF5] rounded-xl shadow-md -z-10"
              />
            )}

            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.badge && (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.badge}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

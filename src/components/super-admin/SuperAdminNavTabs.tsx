"use client";

import React from "react";
import { motion } from "framer-motion";
import { SUPER_ADMIN_TABS, SuperAdminTab } from "./types";

interface SuperAdminNavTabsProps {
  activeTab: SuperAdminTab;
  onChangeTab: (tab: SuperAdminTab) => void;
}

/**
 * The seven superuser pages, in order.
 *
 * The list lives in `types.ts` (`SUPER_ADMIN_TABS`) so the nav, the `?tab=` URL
 * parameter and the page shell can never disagree about what pages exist.
 */
export default function SuperAdminNavTabs({
  activeTab,
  onChangeTab,
}: SuperAdminNavTabsProps) {
  return (
    <nav
      aria-label="Superuser dashboard sections"
      className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-2 text-xs font-semibold scrollbar-none relative"
    >
      {SUPER_ADMIN_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <motion.button
            key={tab.key}
            type="button"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => onChangeTab(tab.key)}
            aria-current={isActive ? "page" : undefined}
            title={tab.description}
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

            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}

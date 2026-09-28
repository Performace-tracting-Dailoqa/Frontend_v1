"use client";

import React from "react";

export default function DashboardTab() {
  return (
    <div>
      <h3 className="text-title-lg font-headline font-bold text-on-surface mb-6">Manager Overview</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 border border-outline-variant/40 rounded-xl bg-surface-container-lowest">
          <h4 className="font-bold mb-4 text-on-surface">Recent Team Activity</h4>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-on-surface">Alice completed onboarding workflow</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-[#4B2EF5]" />
              <span className="text-on-surface">Bob submitted weekly update</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-on-surface">Charlie has a pending review</span>
            </li>
          </ul>
        </div>
        <div className="p-5 border border-outline-variant/40 rounded-xl bg-surface-container-lowest flex flex-col justify-center items-center text-center">
          <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
          <h4 className="font-bold text-on-surface">Team Productivity</h4>
          <p className="text-sm text-on-surface-variant mt-2">Your team is performing 15% better than last month across all assigned workflows.</p>
        </div>
      </div>
    </div>
  );
}

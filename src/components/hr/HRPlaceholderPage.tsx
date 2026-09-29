"use client";
import React from "react";

export default function HRPlaceholderPage({ tab }: { tab: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-3xl">hourglass_top</span>
      </div>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">
        {tab === "cycles" ? "Performance Cycle Management" : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Module`}
      </h3>
      <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
        Performance cycle configuration and organization-wide analytics are scheduled for subsequent PMS milestones.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
        <span className="material-symbols-outlined text-sm">info</span>
        <span>Performance cycle backend/database functionality is not currently implemented</span>
      </div>
    </div>
  );
}

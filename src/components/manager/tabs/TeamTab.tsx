"use client";

import React from "react";

export default function TeamTab() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-title-lg font-headline font-bold text-on-surface">My Team</h3>
      </div>
      <div className="text-center py-12 border border-dashed border-outline-variant/60 rounded-xl bg-surface-container-lowest">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">api</span>
        </div>
        <h4 className="text-title-md font-headline font-bold text-on-surface">Integration Required</h4>
        <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2 mb-4">
          Backend Developer: Integrate the direct reports list here.
        </p>
        <div className="inline-flex flex-col gap-2 text-left bg-surface-container p-4 rounded-lg border border-outline-variant/40">
          <code className="text-xs text-on-surface-variant font-mono">GET /api/v1/manager/team</code>
          <span className="text-xs text-outline mt-1 block">Expected data: Array of UserDetails mapping to assigned_student_ids.</span>
        </div>
      </div>
    </div>
  );
}

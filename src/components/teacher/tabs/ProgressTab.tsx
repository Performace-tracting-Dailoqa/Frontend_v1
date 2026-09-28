"use client";

import React from "react";

export default function ProgressTab() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-primary mb-2">trending_up</span>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">Learning Progress Tracking</h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
        Course milestone tracking and curriculum progression APIs are scheduled for upcoming sprint milestones.
      </p>
    </div>
  );
}

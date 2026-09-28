"use client";

import React from "react";

export default function LearnersTab() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-primary mb-2">groups</span>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">Learner Management</h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
        Detailed view of all assigned learners, their profiles, and current status.
      </p>
    </div>
  );
}

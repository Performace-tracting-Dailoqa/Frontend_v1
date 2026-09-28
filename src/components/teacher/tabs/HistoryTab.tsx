"use client";

import React from "react";

export default function HistoryTab() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-gray-600 mb-2">history</span>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">Evaluation Archive</h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
        Archived evaluations and historical cohort reviews.
      </p>
    </div>
  );
}

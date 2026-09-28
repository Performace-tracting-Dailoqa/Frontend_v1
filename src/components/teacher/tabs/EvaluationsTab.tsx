"use client";

import React from "react";

export default function EvaluationsTab() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-purple-600 mb-2">rate_review</span>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">Cohort Evaluations</h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
        Formal evaluation grading and rubric submissions will appear here once evaluation cycles open.
      </p>
    </div>
  );
}

"use client";

import React from "react";

export default function FeedbackTab() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-secondary mb-2">forum</span>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">Learner Feedback Queue</h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
        No pending feedback requests from assigned learners.
      </p>
    </div>
  );
}

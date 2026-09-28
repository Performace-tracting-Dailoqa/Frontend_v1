"use client";

import React from "react";

interface DashboardTabProps {
  assignedBatches: string[];
  assignedLearnerCount: number;
}

export default function DashboardTab({ assignedBatches, assignedLearnerCount }: DashboardTabProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-headline font-bold text-on-surface text-lg">
            My Learners &amp; Cohorts
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Scoped to batches: {assignedBatches.length > 0 ? assignedBatches.join(", ") : "No batches assigned yet"}
          </p>
        </div>
      </div>

      {assignedLearnerCount === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container text-outline flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl">group_off</span>
          </div>
          <h4 className="text-title-md font-headline font-semibold text-on-surface">
            No Learners Linked in Current Scope
          </h4>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
            Learner rosters are governed by backend batch assignments. Individual learner metrics and profiles will appear as learners enroll into your assigned batches.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
            <span className="material-symbols-outlined text-sm">database</span>
            <span>Source of truth: GET /api/v1/auth/me</span>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-on-surface-variant">
          Learner dashboard data goes here...
        </div>
      )}
    </div>
  );
}

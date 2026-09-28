"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherBatches,
  fetchTeacherStudents,
  TeacherBatch,
  TeacherStudent,
} from "@/services/teacherService";

export default function ProgressTab() {
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchTeacherBatches().catch(() => []),
      fetchTeacherStudents().catch(() => []),
    ])
      .then(([bList, sList]) => {
        setBatches(bList);
        setStudents(sList);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
        <h2 className="text-lg font-headline font-bold text-on-surface">Curriculum & Cohort Progress Pipeline</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Track timeline milestones, batch schedules, and learner density across training cycles.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          Loading cohort progress...
        </div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
          <span className="material-symbols-outlined text-3xl text-outline mb-2">timeline</span>
          <p className="text-xs text-on-surface-variant font-medium">No active training batches found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((b) => {
            const batchMembers = students.filter(
              (s) => s.batch_id === b.id || s.batch_name === b.name
            );

            // Compute timeline progress if dates exist
            let progressPct = 50;
            if (b.start_date && b.end_date) {
              const start = new Date(b.start_date).getTime();
              const end = new Date(b.end_date).getTime();
              const now = new Date().getTime();
              if (end > start) {
                progressPct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
              }
            }

            return (
              <div
                key={b.id}
                className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-on-surface">{b.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {b.department || "General"}
                      </span>
                    </div>
                    <p className="text-xs text-outline mt-0.5">{b.course || "Cohort Training Program"}</p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-bold text-primary">{batchMembers.length} Enrolled Learners</span>
                    <p className="text-[11px] text-outline">
                      {b.start_date ? new Date(b.start_date).toLocaleDateString() : "TBD"} –{" "}
                      {b.end_date ? new Date(b.end_date).toLocaleDateString() : "TBD"}
                    </p>
                  </div>
                </div>

                {/* Timeline Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-outline font-medium">Batch Timeline Elapsed</span>
                    <span className="font-bold text-on-surface">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Enrolled Students Roster */}
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-outline mb-2">Enrolled Learner Roster:</h4>
                  {batchMembers.length === 0 ? (
                    <p className="text-xs text-outline italic">No learners currently mapped to this batch.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {batchMembers.map((m) => (
                        <span
                          key={m.id}
                          className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/50 text-xs text-on-surface font-medium"
                        >
                          {m.full_name || m.name || "Student"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

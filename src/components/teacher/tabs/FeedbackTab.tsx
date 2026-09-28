"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherStudents,
  fetchStudentGeneralEvaluation,
  TeacherStudent,
  GeneralEvaluation,
} from "@/services/teacherService";

interface FeedbackItem {
  student: TeacherStudent;
  evaluation: GeneralEvaluation;
}

export default function FeedbackTab() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadAllFeedback() {
      setIsLoading(true);
      try {
        const students = await fetchTeacherStudents().catch(() => []);
        const items: FeedbackItem[] = [];

        await Promise.all(
          students.map(async (student) => {
            try {
              const evalRes = await fetchStudentGeneralEvaluation(student.id);
              if (evalRes && evalRes.remarks) {
                items.push({ student, evaluation: evalRes });
              }
            } catch {
              // skip if none
            }
          })
        );

        setFeedbackList(items);
      } catch (err) {
        console.warn("Failed to load feedback:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllFeedback();
  }, []);

  const filtered = feedbackList.filter((item) =>
    (item.student.full_name || item.student.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Learner Feedback & Mentorship Remarks</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Review qualitative assessments, mentorship notes, and growth recommendations across your cohort.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-lg">search</span>
          <input
            type="text"
            placeholder="Filter by learner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          Gathering feedback logs across cohort...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
          <span className="material-symbols-outlined text-3xl text-outline mb-2">comment</span>
          <p className="text-xs text-on-surface-variant font-medium">No published evaluation remarks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(({ student, evaluation }) => (
            <div
              key={evaluation.id}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {(student.full_name || student.name || "S")[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-on-surface">
                      {student.full_name || student.name || "Student"}
                    </h3>
                    <p className="text-[11px] text-outline">{student.department || "Cohort Learner"}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-primary">
                    {evaluation.percentage !== null ? `${evaluation.percentage}%` : "Scored"}
                  </span>
                  <p className="text-[10px] text-outline uppercase font-semibold">{evaluation.status || "Completed"}</p>
                </div>
              </div>

              <div className="bg-surface-container/30 p-3 rounded-xl border border-outline-variant/40 text-xs text-on-surface italic">
                &quot;{evaluation.remarks}&quot;
              </div>

              {evaluation.evaluated_at && (
                <div className="text-right text-[10px] text-outline font-medium">
                  Logged on {new Date(evaluation.evaluated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

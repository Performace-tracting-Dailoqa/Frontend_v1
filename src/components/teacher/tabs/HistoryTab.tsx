"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherStudents,
  fetchStudentGeneralEvaluation,
  TeacherStudent,
  GeneralEvaluation,
} from "@/services/teacherService";

interface HistoryRecord {
  student: TeacherStudent;
  evaluation: GeneralEvaluation;
}

export default function HistoryTab() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const students = await fetchTeacherStudents().catch(() => []);
        const records: HistoryRecord[] = [];

        await Promise.all(
          students.map(async (student) => {
            try {
              const evalRes = await fetchStudentGeneralEvaluation(student.id);
              if (evalRes) {
                records.push({ student, evaluation: evalRes });
              }
            } catch {
              // skip
            }
          })
        );

        setHistory(records);
      } catch (err) {
        console.warn("Failed to load evaluation history:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filtered = history.filter((h) =>
    (h.student.full_name || h.student.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Evaluation Audit & History Archive</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Audit trail of milestone evaluations, rubric modifications, and finalized scores.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-lg">search</span>
          <input
            type="text"
            placeholder="Search evaluation history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          Loading historical evaluation records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
          <span className="material-symbols-outlined text-3xl text-outline mb-2">history</span>
          <p className="text-xs text-on-surface-variant font-medium">No past evaluations recorded yet.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="py-3 px-4">Evaluation ID</th>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Score Attainment</th>
                  <th className="py-3 px-4">Rubric Criteria Count</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Evaluation Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {filtered.map(({ student, evaluation }) => (
                  <tr key={evaluation.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-outline text-[11px]">
                      {evaluation.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">
                      {student.full_name || student.name || "Student"}
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">
                      {evaluation.percentage !== null && evaluation.percentage !== undefined ? `${evaluation.percentage}%` : "—"}
                    </td>
                    <td className="py-3 px-4 text-outline">
                      {evaluation.metrics?.length || 0} Criteria
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container text-on-surface-variant">
                        {evaluation.status || "Completed"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-outline">
                      {evaluation.evaluated_at
                        ? new Date(evaluation.evaluated_at).toLocaleDateString()
                        : "Recent"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

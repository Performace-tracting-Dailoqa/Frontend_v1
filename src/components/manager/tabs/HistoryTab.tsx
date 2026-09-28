"use client";

import React, { useState, useMemo } from "react";
import { WorkflowTask, TeamMember } from "@/services/workflowService";
import { WorkflowEvaluation } from "@/services/evaluationService";

interface HistoryTabProps {
  tasks: WorkflowTask[];
  teamMembers: TeamMember[];
  evaluation: WorkflowEvaluation | null;
}

export default function HistoryTab({ tasks, teamMembers }: HistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<WorkflowTask | null>(null);

  const completedOrSubmitted = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status === "completed" ||
        t.status === "submitted" ||
        t.status === "done" ||
        t.manager_grade !== null ||
        t.student_grade !== null
    );
  }, [tasks]);

  const filtered = useMemo(() => {
    return completedOrSubmitted.filter((t) => {
      const student = teamMembers.find((m) => m.id === t.student_id);
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student?.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student?.batch_name && student.batch_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [completedOrSubmitted, teamMembers, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-headline font-bold text-on-surface">
            Evaluation &amp; Task Audit History
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Longitudinal audit record of student submissions, self-grades, and final manager appraisals.
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search deliverables, learners, batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container text-xs rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">history</span>
          </div>
          <h4 className="text-body-md font-bold text-on-surface">No Historical Records Found</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
            Tasks with student self-grades or manager evaluations will be recorded in this audit ledger.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-container text-outline text-xs uppercase tracking-wider font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="px-5 py-3.5">Deliverable</th>
                  <th className="px-5 py-3.5">Learner &amp; Batch</th>
                  <th className="px-5 py-3.5">Student Self-Grade</th>
                  <th className="px-5 py-3.5">Manager Grade</th>
                  <th className="px-5 py-3.5">Official Final</th>
                  <th className="px-5 py-3.5">Completed Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((task) => {
                  const student = teamMembers.find((m) => m.id === task.student_id);
                  const hasStudent = task.student_grade !== null && task.student_grade !== undefined;
                  const hasManager = task.manager_grade !== null && task.manager_grade !== undefined;
                  const hasFinal = task.final_grade !== null && task.final_grade !== undefined;

                  return (
                    <tr key={task.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-on-surface">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-on-surface-variant line-clamp-1">{task.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-on-surface">{student?.name || "Intern"}</div>
                        <div className="text-[11px] text-outline font-mono">{student?.batch_name || "Assigned Batch"}</div>
                      </td>
                      <td className="px-5 py-4">
                        {hasStudent ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                            {task.student_grade} / 100
                          </span>
                        ) : (
                          <span className="text-xs text-outline italic">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasManager ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                            {task.manager_grade} / 100
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasFinal ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                            {task.final_grade} / 100
                          </span>
                        ) : (
                          <span className="text-xs text-outline">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-on-surface-variant font-mono">
                        {task.completed_at
                          ? new Date(task.completed_at).toLocaleDateString()
                          : task.submitted_at
                          ? new Date(task.submitted_at).toLocaleDateString()
                          : "Active"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedTaskForModal(task)}
                          className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Metric Breakdown Modal */}
      {selectedTaskForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full border border-outline-variant/50 p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Deliverable Scorecard Audit
                </span>
                <h4 className="text-title-md font-bold text-on-surface font-headline mt-0.5">
                  {selectedTaskForModal.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedTaskForModal(null)}
                className="text-outline hover:text-on-surface text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Student Self-Score</span>
                <span className="text-xl font-bold font-mono text-indigo-950">
                  {selectedTaskForModal.student_grade ?? "—"} / 100
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Manager Score</span>
                <span className="text-xl font-bold font-mono text-emerald-950">
                  {selectedTaskForModal.manager_grade ?? "—"} / 100
                </span>
              </div>
              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Final Grade</span>
                <span className="text-xl font-bold font-mono text-purple-950">
                  {selectedTaskForModal.final_grade ?? selectedTaskForModal.manager_grade ?? "—"} / 100
                </span>
              </div>
            </div>

            {/* Metric Breakdown Table */}
            <div>
              <span className="text-xs font-bold text-on-surface uppercase tracking-wide block mb-2">
                Metric Level Comparison
              </span>
              {selectedTaskForModal.student_metric_grades && selectedTaskForModal.student_metric_grades.length > 0 ? (
                <div className="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-xl overflow-hidden">
                  {selectedTaskForModal.student_metric_grades.map((m) => (
                    <div key={m.metric_name} className="p-3 flex items-center justify-between text-xs bg-surface-container/20">
                      <div>
                        <span className="font-semibold text-on-surface">{m.metric_name}</span>
                        {m.remarks && <p className="text-[11px] text-outline italic mt-0.5">&quot;{m.remarks}&quot;</p>}
                      </div>
                      <span className="font-mono font-bold text-indigo-700">
                        {m.score} / {m.full_score} pts
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline italic bg-surface-container/30 p-3 rounded-xl border border-outline-variant/30">
                  Standard rubric applied: Evaluated directly at {selectedTaskForModal.manager_grade ?? selectedTaskForModal.student_grade ?? 0} pts.
                </p>
              )}
            </div>

            {/* Reflection Notes */}
            {selectedTaskForModal.submission_notes && (
              <div className="p-3 bg-surface-container/40 rounded-xl border border-outline-variant/30 text-xs text-on-surface">
                <strong className="block text-[11px] text-outline uppercase mb-1">Student Deliverable Notes:</strong>
                <p className="italic text-on-surface-variant">&quot;{selectedTaskForModal.submission_notes}&quot;</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTaskForModal(null)}
                className="px-4 py-2 bg-surface-container text-xs font-semibold rounded-lg hover:bg-surface-container-high cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

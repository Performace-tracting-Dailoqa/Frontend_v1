"use client";

import React, { useState, useMemo } from "react";
import { WorkflowTask, TeamMember } from "@/services/workflowService";
import { WorkflowEvaluation } from "@/services/evaluationService";

interface FeedbackTabProps {
  tasks: WorkflowTask[];
  teamMembers: TeamMember[];
  evaluation: WorkflowEvaluation | null;
}

export default function FeedbackTab({ tasks, teamMembers }: FeedbackTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");

  const batches = useMemo(() => {
    const set = new Set<string>();
    teamMembers.forEach((m) => {
      if (m.batch_name) set.add(m.batch_name);
    });
    return Array.from(set);
  }, [teamMembers]);

  // Tasks that have either student reflections, manager grades, or submission notes
  const feedbackItems = useMemo(() => {
    return tasks.filter((t) => {
      const hasContent =
        Boolean(t.submission_notes) ||
        Boolean(t.student_grade) ||
        Boolean(t.manager_grade) ||
        Boolean(t.final_grade) ||
        t.status === "completed" ||
        t.status === "submitted";
      return hasContent;
    });
  }, [tasks]);

  const filteredItems = useMemo(() => {
    return feedbackItems.filter((t) => {
      const student = teamMembers.find((m) => m.id === t.student_id);
      const matchesBatch =
        selectedBatch === "all" || (student?.batch_name && student.batch_name === selectedBatch);
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student?.name && student.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.submission_notes && t.submission_notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesBatch && matchesSearch;
    });
  }, [feedbackItems, teamMembers, selectedBatch, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-headline font-bold text-on-surface">
            Mentorship Remarks &amp; Feedback Center
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Learner self-reflections alongside manager evaluation commentary across all sprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-1.5 bg-surface-container text-xs font-semibold rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined text-outline text-base absolute left-2.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="pl-8 pr-3 py-1.5 bg-surface-container text-xs rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary w-48"
            />
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/50">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">chat</span>
          </div>
          <h4 className="text-body-md font-bold text-on-surface">No Feedback Entries Recorded</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
            As students submit deliverable reflections and you evaluate them in the Evaluations tab, qualitative dialogues will be catalogued here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((task) => {
            const student = teamMembers.find((m) => m.id === task.student_id);
            const hasManagerGrade = task.manager_grade !== null && task.manager_grade !== undefined;
            const hasStudentGrade = task.student_grade !== null && task.student_grade !== undefined;

            return (
              <div
                key={task.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                      {student?.batch_name || "General Batch"}
                    </span>
                    <span className="text-xs text-outline font-medium">
                      {task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() : "Active Sprint"}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-on-surface font-headline">{task.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Learner: <strong className="text-slate-800">{student?.name || "Intern"}</strong>
                  </p>

                  {/* Student Reflection */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wide">
                        Learner Reflection
                      </span>
                      {hasStudentGrade && (
                        <span className="font-mono font-bold text-indigo-700 text-xs">
                          Self: {task.student_grade}/100
                        </span>
                      )}
                    </div>
                    <p className="italic text-slate-600 leading-relaxed">
                      {task.submission_notes ? `"${task.submission_notes}"` : "No reflection provided with submission."}
                    </p>
                  </div>

                  {/* Manager Evaluated Status */}
                  <div className="mt-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wide">
                        Manager Evaluation
                      </span>
                      {hasManagerGrade ? (
                        <span className="font-mono font-bold text-emerald-700 text-xs">
                          Score: {task.manager_grade}/100
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Evaluation Pending
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-800 leading-relaxed">
                      {hasManagerGrade
                        ? `Deliverable evaluated and officially finalized with ${task.manager_grade} pts.`
                        : "Ready for manager review in the Evaluations tab."}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline">
                  <span className="capitalize">Status: {task.status?.replace("_", " ") || "Pending"}</span>
                  <span className="font-medium text-primary">
                    {hasManagerGrade ? "Evaluated ✓" : "Needs Review →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

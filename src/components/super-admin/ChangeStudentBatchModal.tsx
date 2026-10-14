"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { changeStudentBatch } from "@/services/batchService";
import { TeamRecord } from "@/services/insightsService";
import { Avatar, Pill } from "./SuperAdminUi";

export interface StudentBatchTarget {
  id: string; // student profile id
  name?: string | null;
  email?: string | null;
  enrollment_no?: string | null;
  department?: string | null;
  current_batch_id?: string | null;
  current_batch_name?: string | null;
}

interface ChangeStudentBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentBatchTarget | null;
  allTeams: TeamRecord[] | Array<{ id: string; name: string; department?: string | null; student_count?: number }>;
  onBatchChanged: () => void;
}

export default function ChangeStudentBatchModal({
  isOpen,
  onClose,
  student,
  allTeams,
  onBatchChanged,
}: ChangeStudentBatchModalProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      setSelectedBatchId(student.current_batch_id || "");
      setError(null);
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const currentBatch = allTeams.find((t) => t.id === student.current_batch_id);
  const currentBatchName =
    student.current_batch_name || currentBatch?.name || "Unassigned / No Batch";

  const isChanging = (selectedBatchId || null) !== (student.current_batch_id || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const targetId = selectedBatchId.trim() ? selectedBatchId.trim() : null;
      await changeStudentBatch(student.id, targetId);
      onBatchChanged();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update student batch assignment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Change Intern Batch Assignment"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">swap_horiz</span>
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-headline">
                Change Batch Assignment
              </h3>
              <p className="text-xs text-slate-500">
                Reassign this intern to a new cohort or move to general pool
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Intern Summary Card */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center gap-3">
            <Avatar name={student.name || "Intern"} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {student.name || "Unnamed Intern"}
              </p>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {student.email || "No email"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {student.enrollment_no && (
                  <Pill tone="slate">{student.enrollment_no}</Pill>
                )}
                {student.department && (
                  <Pill tone="slate">{student.department}</Pill>
                )}
              </div>
            </div>
          </div>

          {/* Current Batch Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
            <span className="text-indigo-900 font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#4B2EF5]">folder_shared</span>
              <span>Current Batch:</span>
            </span>
            <span className="font-bold text-[#4B2EF5] bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
              {currentBatchName}
            </span>
          </div>

          {/* New Batch Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Destination Batch / Team *
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#4B2EF5] focus:ring-2 focus:ring-[#4B2EF5]/15 transition-all text-slate-800 bg-white cursor-pointer font-medium"
            >
              <option value="">
                — Unassigned / General Pool (No Batch) —
              </option>
              {allTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.department ? `(${t.department})` : ""}
                  {"student_count" in t && t.student_count !== undefined
                    ? ` · ${t.student_count} learners`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="material-symbols-outlined text-sm text-[#4B2EF5]">info</span>
              <span>Impact of Batch Transfer</span>
            </div>
            <p>
              Reassigning this intern updates their team membership across all manager and teacher views, enabling the new batch leads to assign tasks and record evaluations immediately.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isChanging}
              className="h-9 px-4 rounded-xl bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Confirm Batch Change</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

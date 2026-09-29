"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherBatches,
  fetchTeacherStudents,
  createTeacherBatch,
  TeacherBatch,
  TeacherStudent,
} from "@/services/teacherService";

interface DashboardTabProps {
  assignedBatches?: string[];
  assignedLearnerCount?: number;
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardTab({ onNavigateTab }: DashboardTabProps) {
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: "",
    course: "Japanese & Technical Training",
    department: "Engineering",
    start_date: "",
    end_date: "",
  });
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [batchList, studentList] = await Promise.all([
        fetchTeacherBatches().catch(() => []),
        fetchTeacherStudents().catch(() => []),
      ]);
      setBatches(batchList);
      setStudents(studentList);
    } catch (err) {
      console.warn("Error loading teacher dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.name.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await createTeacherBatch({
        name: batchForm.name,
        course: batchForm.course,
        department: batchForm.department,
        start_date: batchForm.start_date || undefined,
        end_date: batchForm.end_date || undefined,
      });
      setStatusMessage({ type: "success", text: "Batch created successfully!" });
      setShowCreateBatchModal(false);
      setBatchForm({
        name: "",
        course: "Japanese & Technical Training",
        department: "Engineering",
        start_date: "",
        end_date: "",
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to create batch" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Cohort Quick Actions Bar */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Teacher & Mentor Operations Cockpit</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Monitor active batches, assess learner milestones, and track Japanese language readiness.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateBatchModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Create New Batch</span>
          </button>
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">school</span>
            <span>Your Assigned Batches ({batches.length})</span>
          </h3>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("learners")}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Learners</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-outline bg-surface-container-lowest rounded-xl border border-outline-variant/40">
            Loading assigned batches...
          </div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/60">
            <span className="material-symbols-outlined text-3xl text-outline mb-2">school</span>
            <p className="text-xs text-on-surface-variant font-medium">No batches assigned yet.</p>
            <button
              onClick={() => setShowCreateBatchModal(true)}
              className="mt-3 text-xs text-primary font-semibold hover:underline"
            >
              Create your first batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => {
              const batchStudents = students.filter(
                (s) => s.batch_id === batch.id || s.batch_name === batch.name
              );
              return (
                <div
                  key={batch.id}
                  className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                        {batch.department || "Training"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          batch.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {batch.is_active !== false ? "Active" : "Archived"}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-on-surface">{batch.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{batch.course || "Standard Cohort Track"}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm text-secondary">groups</span>
                      {batchStudents.length} Students
                    </span>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab("evaluations")}
                        className="text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Evaluate</span>
                        <span className="material-symbols-outlined text-sm">rate_review</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">add_box</span>
                <span>Create New Cohort Batch</span>
              </h3>
              <button
                onClick={() => setShowCreateBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. 2026-Cohort-A-Tokyo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course / Curriculum</label>
                <input
                  type="text"
                  value={batchForm.course}
                  onChange={(e) => setBatchForm({ ...batchForm, course: e.target.value })}
                  placeholder="e.g. Fullstack Engineering & JLPT N3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={batchForm.department}
                  onChange={(e) => setBatchForm({ ...batchForm, department: e.target.value })}
                  placeholder="e.g. Engineering"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={batchForm.start_date}
                    onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={batchForm.end_date}
                    onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherStudents,
  fetchStudentGeneralEvaluation,
  createStudentGeneralEvaluation,
  updateStudentGeneralEvaluation,
  addGeneralMetric,
  deleteGeneralMetric,
  TeacherStudent,
  GeneralEvaluation,
} from "@/services/teacherService";

interface EvaluationsTabProps {
  initialStudent?: TeacherStudent | null;
}

export default function EvaluationsTab({ initialStudent }: EvaluationsTabProps) {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [evaluation, setEvaluation] = useState<GeneralEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Metric Form State
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [metricForm, setMetricForm] = useState({
    name: "",
    score: 85,
    full_score: 100,
    remarks: "",
  });

  // Edit Remarks State
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchTeacherStudents()
      .then((res) => {
        setStudents(res);
        if (initialStudent) {
          setSelectedStudent(initialStudent);
        } else if (res.length > 0) {
          setSelectedStudent(res[0]);
        }
      })
      .catch((err) => console.warn("Failed to load students:", err));
  }, [initialStudent]);

  useEffect(() => {
    if (selectedStudent) {
      loadEvaluation(selectedStudent.id);
    } else {
      setEvaluation(null);
    }
  }, [selectedStudent]);

  const loadEvaluation = async (studentId: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetchStudentGeneralEvaluation(studentId);
      setEvaluation(res);
      setRemarks(res?.remarks || "");
    } catch (err: any) {
      console.warn("Error fetching evaluation:", err);
      setEvaluation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitEvaluation = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      const res = await createStudentGeneralEvaluation(selectedStudent.id, {
        total_score: 0,
        max_score: 100,
        percentage: 0,
        status: "in_progress",
        remarks: "Initial milestone evaluation created.",
      });
      setEvaluation(res);
      setRemarks(res.remarks || "");
      setStatusMessage({ type: "success", text: "Evaluation initialized successfully." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to initialize evaluation." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !evaluation || !metricForm.name.trim()) return;

    setIsSaving(true);
    try {
      await addGeneralMetric(selectedStudent.id, evaluation.id, {
        name: metricForm.name,
        score: Number(metricForm.score),
        full_score: Number(metricForm.full_score),
        remarks: metricForm.remarks || undefined,
      });

      // Recalculate evaluation percentage and totals
      await loadEvaluation(selectedStudent.id);
      setShowAddMetric(false);
      setMetricForm({ name: "", score: 85, full_score: 100, remarks: "" });
      setStatusMessage({ type: "success", text: "Metric criteria added successfully." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to add metric." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!selectedStudent || !evaluation) return;
    if (!confirm("Are you sure you want to delete this evaluation metric?")) return;

    setIsSaving(true);
    try {
      await deleteGeneralMetric(selectedStudent.id, evaluation.id, metricId);
      await loadEvaluation(selectedStudent.id);
      setStatusMessage({ type: "success", text: "Metric deleted." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete metric." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!selectedStudent || !evaluation) return;
    setIsSaving(true);
    try {
      const res = await updateStudentGeneralEvaluation(selectedStudent.id, evaluation.id, {
        remarks,
        status: "completed",
      });
      setEvaluation(res);
      setStatusMessage({ type: "success", text: "Evaluation finalized and saved." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update remarks." });
    } finally {
      setIsSaving(false);
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

      {/* Header and Student Selector */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Milestone & General Evaluations</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Conduct holistic appraisals, score competency rubrics, and publish mentor feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-outline">Target Learner:</label>
          <select
            value={selectedStudent?.id || ""}
            onChange={(e) => {
              const found = students.find((s) => s.id === e.target.value);
              setSelectedStudent(found || null);
            }}
            className="bg-surface-container border border-outline-variant/50 text-xs text-on-surface rounded-xl px-3.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[220px]"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.name || "Student"} ({s.department || "Cohort"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          Loading learner evaluation dossier...
        </div>
      ) : !selectedStudent ? (
        <div className="p-12 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
          Please select a learner to view or create evaluations.
        </div>
      ) : !evaluation ? (
        <div className="bg-surface-container-lowest p-10 rounded-2xl border border-dashed border-outline-variant/60 text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-3">assignment_add</span>
          <h3 className="font-bold text-sm text-on-surface">No Evaluation Record Found</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 mb-5">
            Learner <span className="font-bold text-on-surface">{selectedStudent.full_name || selectedStudent.name}</span>{" "}
            does not have an active general milestone evaluation yet.
          </p>
          <button
            onClick={handleInitEvaluation}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Initializing..." : "Initialize Milestone Evaluation"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Score Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                {evaluation.percentage !== null && evaluation.percentage !== undefined ? `${evaluation.percentage}%` : "—"}
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">
                  {selectedStudent.full_name || selectedStudent.name || "Student"}
                </h3>
                <p className="text-xs text-outline">
                  Status: <span className="font-semibold uppercase text-primary">{evaluation.status || "In Progress"}</span>
                  {evaluation.evaluated_at && ` · Last Evaluated: ${new Date(evaluation.evaluated_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddMetric(true)}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-primary">add</span>
                <span>Add Metric Criteria</span>
              </button>
            </div>
          </div>

          {/* Metric Rubrics Grid */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-on-surface flex items-center justify-between">
              <span>Rubric Metrics & Attainment Scores ({evaluation.metrics?.length || 0})</span>
            </h3>

            {!evaluation.metrics || evaluation.metrics.length === 0 ? (
              <div className="p-8 text-center text-xs text-outline bg-surface-container/50 rounded-xl">
                No individual rubric criteria added yet. Click &quot;Add Metric Criteria&quot; above to grade specific competencies.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluation.metrics.map((m) => {
                  const pct = m.full_score && m.score ? Math.round((m.score / m.full_score) * 100) : null;
                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/30 flex flex-col justify-between hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-on-surface">{m.name}</h4>
                          {m.description && <p className="text-[11px] text-outline mt-0.5">{m.description}</p>}
                          {m.remarks && (
                            <p className="text-[11px] text-primary/80 italic mt-1 font-medium">&quot;{m.remarks}&quot;</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteMetric(m.id)}
                          className="text-outline hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete metric"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>

                      <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-xs">
                        <span className="text-outline">Score Attainment:</span>
                        <span className="font-bold text-on-surface">
                          {m.score} / {m.full_score} {pct !== null && `(${pct}%)`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Qualitative Evaluator Remarks & Finalization */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-on-surface">Mentor Qualitative Remarks & Appraisal</h3>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter comprehensive qualitative appraisal feedback for this learner..."
              className="w-full p-3 bg-surface-container/30 border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleSaveRemarks}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save & Finalize Evaluation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Metric Modal */}
      {showAddMetric && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-headline font-bold text-base text-slate-900">Add Evaluation Metric</h3>
              <button
                onClick={() => setShowAddMetric(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMetric} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metric Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JLPT N3 Kanji Competency"
                  value={metricForm.name}
                  onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attained Score</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={metricForm.score}
                    onChange={(e) => setMetricForm({ ...metricForm, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Score</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={metricForm.full_score}
                    onChange={(e) => setMetricForm({ ...metricForm, full_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Criterion Feedback / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Demonstrates strong retention of N3 vocabulary"
                  value={metricForm.remarks}
                  onChange={(e) => setMetricForm({ ...metricForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMetric(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Add Criterion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

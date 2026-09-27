"use client";

import React, { useState, useEffect } from "react";
import { UserData } from "@/services/userService";
import { 
  GeneralEvaluation, 
  GeneralMetric, 
  fetchGeneralEvaluation, 
  createGeneralEvaluation, 
  updateGeneralEvaluation,
  createGeneralMetric,
  updateGeneralMetric,
  deleteGeneralMetric
} from "@/services/generalEvaluationService";

interface TeacherLearnerEvaluationModalProps {
  student: UserData;
  onClose: () => void;
}

export default function TeacherLearnerEvaluationModal({ student, onClose }: TeacherLearnerEvaluationModalProps) {
  const [evaluation, setEvaluation] = useState<GeneralEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New metric form state
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricScore, setNewMetricScore] = useState("");

  useEffect(() => {
    loadEvaluation();
  }, [student.id]);

  const loadEvaluation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let evalData = await fetchGeneralEvaluation(student.id);
      if (!evalData) {
        // Create an empty evaluation if one doesn't exist
        evalData = await createGeneralEvaluation(student.id, {
          status: "draft"
        });
        evalData.metrics = [];
      }
      setEvaluation(evalData);
    } catch (err: any) {
      setError(err.message || "Failed to load evaluation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMetric = async () => {
    if (!evaluation || !newMetricName.trim()) return;
    setIsSaving(true);
    try {
      const metric = await createGeneralMetric(student.id, evaluation.id, {
        name: newMetricName,
        score: parseFloat(newMetricScore) || 0,
        full_score: 100
      });
      setEvaluation(prev => prev ? {
        ...prev,
        metrics: [...(prev.metrics || []), metric]
      } : prev);
      setIsAddingMetric(false);
      setNewMetricName("");
      setNewMetricScore("");
    } catch (err: any) {
      setError(err.message || "Failed to add metric");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!evaluation) return;
    setIsSaving(true);
    try {
      await deleteGeneralMetric(student.id, evaluation.id, metricId);
      setEvaluation(prev => prev ? {
        ...prev,
        metrics: prev.metrics.filter(m => m.id !== metricId)
      } : prev);
    } catch (err: any) {
      setError(err.message || "Failed to delete metric");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRemarks = async (remarks: string) => {
    if (!evaluation) return;
    setIsSaving(true);
    try {
      const updated = await updateGeneralEvaluation(student.id, evaluation.id, { remarks });
      setEvaluation(prev => prev ? { ...prev, remarks: updated.remarks } : prev);
    } catch (err: any) {
      setError(err.message || "Failed to update remarks");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/50">
          <div>
            <h2 className="text-title-lg font-headline font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">assessment</span>
              Evaluate {student.name}
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8 text-on-surface-variant animate-pulse">Loading evaluation data...</div>
          ) : error ? (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-sm mb-4">
              {error}
            </div>
          ) : evaluation ? (
            <div className="space-y-6">
              
              {/* Metrics Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-title-md font-medium text-on-surface">Metrics</h3>
                  {!isAddingMetric && (
                    <button
                      onClick={() => setIsAddingMetric(true)}
                      className="text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Metric
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {evaluation.metrics?.length === 0 && !isAddingMetric ? (
                    <div className="text-center py-6 text-on-surface-variant bg-surface-container/30 rounded-xl border border-dashed border-outline-variant/50 text-sm">
                      No metrics added yet.
                    </div>
                  ) : (
                    evaluation.metrics?.map(metric => (
                      <div key={metric.id} className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex justify-between items-center group">
                        <div>
                          <div className="font-medium text-on-surface">{metric.name}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-primary font-bold">{metric.score} / {metric.full_score || 100}</div>
                          <button
                            onClick={() => handleDeleteMetric(metric.id)}
                            className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Metric"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {isAddingMetric && (
                    <div className="p-4 rounded-xl bg-surface-container-high border border-primary/30 flex flex-col gap-3">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Metric Name (e.g. Participation)"
                          value={newMetricName}
                          onChange={(e) => setNewMetricName(e.target.value)}
                          className="flex-1 bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-primary outline-none text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Score"
                          value={newMetricScore}
                          onChange={(e) => setNewMetricScore(e.target.value)}
                          className="w-24 bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-primary outline-none text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsAddingMetric(false)}
                          className="text-xs px-3 py-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddMetric}
                          disabled={isSaving || !newMetricName.trim()}
                          className="text-xs px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md font-medium disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save Metric"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks Section */}
              <div>
                <h3 className="text-title-md font-medium text-on-surface mb-3">Overall Remarks</h3>
                <textarea
                  defaultValue={evaluation.remarks || ""}
                  onBlur={(e) => handleUpdateRemarks(e.target.value)}
                  placeholder="Add overall feedback or remarks for the student..."
                  className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface text-sm min-h-[100px] resize-y"
                />
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

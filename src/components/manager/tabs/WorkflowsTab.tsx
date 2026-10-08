"use client";

import React, { useState, useMemo } from "react";
import { Workflow, ManagerTeam, WorkflowTask, TeamMember } from "@/services/workflowService";
import WorkflowTasksView from "./WorkflowTasksView";

interface WorkflowsTabProps {
  workflows: Workflow[];
  isLoading: boolean;
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (wf: Workflow) => void;
  onCreateWorkflow: (data: { name: string; description?: string; batch_id?: string }) => Promise<void>;
  onDeleteWorkflow: (id: string) => Promise<void>;
  onNavigateToProgress?: () => void;
  teams?: ManagerTeam[];
  selectedTeam?: ManagerTeam | null;
  onSelectTeam?: (team: ManagerTeam | null) => void;
  tasks?: WorkflowTask[];
  isLoadingTasks?: boolean;
  teamMembers?: TeamMember[];
  onCreateTask?: (data: {
    title: string;
    description?: string;
    student_id: string;
    due_date?: string;
    priority?: string;
    workflow_id?: string;
  }) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onNavigateToEvaluations?: (workflow: Workflow, task?: WorkflowTask) => void;
}

export interface RubricMetricItem {
  id: string;
  name: string;
  full_score: number;
  weightage: number;
  description?: string;
}

const DEFAULT_RUBRIC_METRICS: RubricMetricItem[] = [
  { id: "1", name: "Code Architecture & Modularity", full_score: 25, weightage: 0.25 },
  { id: "2", name: "Implementation Completeness & Quality", full_score: 25, weightage: 0.25 },
  { id: "3", name: "Unit & Integration Testing", full_score: 25, weightage: 0.25 },
  { id: "4", name: "Documentation & Clean Code", full_score: 25, weightage: 0.25 },
];

export default function WorkflowsTab({
  workflows,
  isLoading,
  selectedWorkflow,
  onSelectWorkflow,
  onCreateWorkflow,
  onDeleteWorkflow,
  teams = [],
  selectedTeam = null,
  onSelectTeam,
  tasks = [],
  isLoadingTasks = false,
  teamMembers = [],
  onCreateTask,
  onDeleteTask,
  onNavigateToEvaluations,
}: WorkflowsTabProps) {
  // Active workflow being viewed in detail/tasks page
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // Workflow Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [batchId, setBatchId] = useState(selectedTeam?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rubric Metrics State inside Create Modal
  const [rubricMetrics, setRubricMetrics] = useState<RubricMetricItem[]>(DEFAULT_RUBRIC_METRICS);
  const [showAddMetricInput, setShowAddMetricInput] = useState(false);
  const [customMetricName, setCustomMetricName] = useState("");
  const [customMetricScore, setCustomMetricScore] = useState("25");

  // Find currently opened workflow object
  const activeWorkflow = useMemo(() => {
    if (!activeWorkflowId) return null;
    return workflows.find((w) => w.id === activeWorkflowId) || null;
  }, [activeWorkflowId, workflows]);

  const totalRubricScore = useMemo(() => {
    return rubricMetrics.reduce((sum, m) => sum + (Number(m.full_score) || 0), 0);
  }, [rubricMetrics]);

  const handleAddCustomMetric = () => {
    if (!customMetricName.trim()) return;
    const scoreVal = Number(customMetricScore) || 25;
    const newMetric: RubricMetricItem = {
      id: "metric-" + Date.now(),
      name: customMetricName.trim(),
      full_score: scoreVal,
      weightage: 0.25,
    };
    setRubricMetrics((prev) => [...prev, newMetric]);
    setCustomMetricName("");
    setCustomMetricScore("25");
    setShowAddMetricInput(false);
  };

  const handleRemoveMetric = (metricId: string) => {
    setRubricMetrics((prev) => prev.filter((m) => m.id !== metricId));
  };

  const handleUpdateMetricScore = (metricId: string, newScore: number) => {
    setRubricMetrics((prev) =>
      prev.map((m) => (m.id === metricId ? { ...m, full_score: Math.max(1, newScore) } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const selectedBatchId = batchId || selectedTeam?.id || undefined;
      await onCreateWorkflow({
        name: name.trim(),
        description: description.trim() || undefined,
        batch_id: selectedBatchId,
      });

      // Persist the defined rubric metrics for this workflow and batch so evaluations immediately use them
      if (typeof window !== "undefined") {
        const formattedMetrics = rubricMetrics.map((m) => ({
          name: m.name,
          full_score: m.full_score,
          weightage: m.weightage,
        }));
        
        // Save as default for this batch
        if (selectedBatchId) {
          localStorage.setItem(`manager_shared_batch_metrics_${selectedBatchId}`, JSON.stringify(formattedMetrics));
        }
        localStorage.setItem(`manager_latest_custom_rubric`, JSON.stringify(formattedMetrics));
      }

      setName("");
      setDescription("");
      setRubricMetrics(DEFAULT_RUBRIC_METRICS);
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a specific workflow tasks page is open, render WorkflowTasksView
  if (activeWorkflow) {
    return (
      <WorkflowTasksView
        workflow={activeWorkflow}
        tasks={tasks}
        isLoadingTasks={isLoadingTasks}
        teams={teams}
        teamMembers={teamMembers}
        onBack={() => setActiveWorkflowId(null)}
        onCreateTask={
          onCreateTask ||
          (async () => {
            console.warn("onCreateTask handler not provided");
          })
        }
        onDeleteTask={
          onDeleteTask ||
          (async () => {
            console.warn("onDeleteTask handler not provided");
          })
        }
        onNavigateToEvaluations={onNavigateToEvaluations}
        onDeleteWorkflow={async (id) => {
          await onDeleteWorkflow(id);
          setActiveWorkflowId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Team Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-headline font-bold text-on-surface">Workflows &amp; Projects</h3>
          <p className="text-body-sm text-on-surface-variant">
            Create structured operational tracks, configure evaluation rubric criteria, and manage task assignments.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {teams.length > 0 && onSelectTeam && (
            <select
              value={selectedTeam?.id || "all"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") onSelectTeam(null);
                else {
                  const t = teams.find((item) => item.id === val);
                  if (t) onSelectTeam(t);
                }
              }}
              className="px-3 py-2 bg-surface-container text-body-sm rounded-xl border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
            >
              <option value="all">All Teams ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setBatchId(selectedTeam?.id || (teams.length > 0 ? teams[0].id : ""));
              setRubricMetrics(DEFAULT_RUBRIC_METRICS);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white text-body-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">account_tree</span>
          </div>
          <h4 className="text-body-md font-bold text-on-surface">No Workflows Established</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-4">
            Initialize your team&apos;s first workflow track and configure its evaluation rubric metrics.
          </p>
          <button
            onClick={() => {
              setRubricMetrics(DEFAULT_RUBRIC_METRICS);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
          >
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => {
            const isSelected = selectedWorkflow?.id === wf.id;
            const assignedTeam = teams.find((t) => t.id === wf.batch_id);
            const displayBatchName = wf.batch_name || assignedTeam?.name || (wf.batch_id ? "Assigned Cohort" : "General Track");

            return (
              <div
                key={wf.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary"
                    : "bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">groups</span>
                        <span>{displayBatchName}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                        {wf.status || "Active"}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteWorkflow(wf.id)}
                      className="text-outline hover:text-red-600 transition-colors p-1 cursor-pointer"
                      title="Delete workflow"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                  <h4 className="text-title-md font-bold text-on-surface font-headline mb-1">{wf.name}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                    {wf.description || "No description provided for this workflow track."}
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-xs text-outline font-medium">
                    {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : "Active Track"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectWorkflow(wf);
                        setActiveWorkflowId(wf.id);
                      }}
                      className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>Open Tasks</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Workflow Modal with Rubric & Metrics Builder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full border border-outline-variant/50 p-6 shadow-2xl animate-fade-in max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0 pb-3 border-b border-outline-variant/30">
              <div>
                <h3 className="text-title-md font-bold text-on-surface font-headline">Create New Workflow Track</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Define workflow details and set the evaluation rubric criteria for all tasks.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-surface text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl shrink-0">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto flex-1 pr-1">
              {/* Basic Workflow Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Assign to Team / Cohort
                    </label>
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-xl border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs"
                    >
                      <option value="">Select Team (Optional)</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.department || "General"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={teams.length > 0 ? "" : "sm:col-span-2"}>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Workflow Track Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sprint 3 — Cloud Infrastructure & Microservices"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-xl border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Track Description &amp; Objectives
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize the core requirements, deliverables, or milestones for this workflow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-xl border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary resize-none text-xs"
                />
              </div>

              {/* ========================================================= */}
              {/* EVALUATION RUBRIC & METRICS BUILDER                       */}
              {/* ========================================================= */}
              <div className="p-4 bg-surface-container/40 rounded-2xl border border-outline-variant/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">fact_check</span>
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider font-headline">
                        Evaluation Rubric &amp; Scoring Metrics
                      </h4>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      These criteria will automatically configure the grading rubric for every student task under this workflow.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-bold rounded-lg shrink-0">
                    Total: {totalRubricScore} Marks ({rubricMetrics.length} Criteria)
                  </span>
                </div>

                {/* Metrics List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {rubricMetrics.map((metric, idx) => (
                    <div
                      key={metric.id}
                      className="p-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex items-center justify-between gap-2 text-xs hover:border-outline-variant transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-on-surface truncate">{metric.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-lg border border-outline-variant/40">
                          <span className="text-[10px] text-outline font-semibold">Max:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={metric.full_score}
                            onChange={(e) => handleUpdateMetricScore(metric.id, Number(e.target.value))}
                            className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none text-primary"
                          />
                          <span className="text-[10px] text-outline">pts</span>
                        </div>

                        {rubricMetrics.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMetric(metric.id)}
                            className="p-1 text-outline hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove metric"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Metric Form / Button */}
                {showAddMetricInput ? (
                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-primary/30 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Add Custom Rubric Metric</span>
                      <button
                        type="button"
                        onClick={() => setShowAddMetricInput(false)}
                        className="text-outline hover:text-on-surface text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="e.g. API Security, Test Coverage, Responsive Design..."
                        value={customMetricName}
                        onChange={(e) => setCustomMetricName(e.target.value)}
                        className="sm:col-span-8 px-3 py-1.5 bg-surface-container text-xs rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                      />
                      <div className="sm:col-span-4 flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="Marks (25)"
                          min="1"
                          max="100"
                          value={customMetricScore}
                          onChange={(e) => setCustomMetricScore(e.target.value)}
                          className="w-20 px-2 py-1.5 bg-surface-container text-xs rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary font-mono text-center"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomMetric}
                          disabled={!customMetricName.trim()}
                          className="flex-1 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddMetricInput(true)}
                    className="w-full py-2 bg-surface-container-lowest hover:bg-surface-container text-primary rounded-xl border border-dashed border-primary/40 hover:border-primary text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>+ Add Custom Metric Criteria</span>
                  </button>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/30 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Create Workflow ({rubricMetrics.length} Metrics)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

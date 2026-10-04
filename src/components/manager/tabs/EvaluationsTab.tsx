"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Workflow, WorkflowTask, TeamMember, ManagerTeam } from "@/services/workflowService";
import {
  WorkflowEvaluation,
  MetricSubmissionInput,
  submitTaskEvaluation,
} from "@/services/evaluationService";

interface EvaluationsTabProps {
  teams?: ManagerTeam[];
  selectedTeam?: ManagerTeam | null;
  onSelectTeam?: (team: ManagerTeam | null) => void;
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (wf: Workflow) => void;
  tasks: WorkflowTask[];
  selectedTask: WorkflowTask | null;
  onSelectTask: (t: WorkflowTask) => void;
  evaluation: WorkflowEvaluation | null;
  isLoadingEvaluation: boolean;
  teamMembers: TeamMember[];
  onCreateEvaluation?: (maxScore: number) => Promise<void>;
  onDeleteEvaluation?: () => Promise<void>;
  onCreateMetric?: (data: {
    name: string;
    full_score: number;
    weightage: number;
    description?: string;
  }) => Promise<void>;
  onDeleteMetric?: (metricId: string) => Promise<void>;
}

interface MetricRowState {
  id?: string;
  name: string;
  student_score: number;
  manager_score: number;
  full_score: number;
  weightage: number;
  student_remarks?: string;
  manager_remarks?: string;
}

export default function EvaluationsTab({
  teams = [],
  selectedTeam,
  onSelectTeam,
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  tasks,
  selectedTask,
  onSelectTask,
  evaluation,
  isLoadingEvaluation,
  teamMembers,
  onCreateMetric,
  onDeleteMetric,
}: EvaluationsTabProps) {
  const [activeTeamId, setActiveTeamId] = useState<string>(selectedTeam?.id || "");
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>("");

  useEffect(() => {
    if (selectedTeam) {
      setActiveTeamId(selectedTeam.id);
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedTask) {
      setSelectedTaskTitle(selectedTask.title);
    }
  }, [selectedTask]);

  // Filter workflows by selected team
  const availableWorkflows = useMemo(() => {
    if (!activeTeamId) return workflows;
    return workflows.filter((w) => w.batch_id === activeTeamId);
  }, [workflows, activeTeamId]);

  // Distinct task titles in current workflow
  const distinctTaskTitles = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.title)));
  }, [tasks]);

  // Tasks for current workflow and selected title
  const currentTitleTasks = useMemo(() => {
    if (!selectedTaskTitle) return tasks;
    return tasks.filter((t) => t.title === selectedTaskTitle);
  }, [tasks, selectedTaskTitle]);

  const [metricRows, setMetricRows] = useState<MetricRowState[]>([]);
  const [managerRemarks, setManagerRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Metric Modal State
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricFullScore, setNewMetricFullScore] = useState("25");
  const [newMetricWeightage, setNewMetricWeightage] = useState("0.25");
  const [newMetricDesc, setNewMetricDesc] = useState("");
  const [isAddingMetric, setIsAddingMetric] = useState(false);

  // Sync metric rows whenever selectedTask or evaluation changes
  useEffect(() => {
    if (!selectedTask) {
      setMetricRows([]);
      setManagerRemarks("");
      return;
    }

    const studentMetricMap = new Map<string, { score: number; remarks?: string }>();
    if (selectedTask.student_metric_grades && Array.isArray(selectedTask.student_metric_grades)) {
      selectedTask.student_metric_grades.forEach((sm) => {
        studentMetricMap.set(sm.metric_name.toLowerCase(), {
          score: Number(sm.score) || 0,
          remarks: sm.remarks,
        });
      });
    }

    let rows: MetricRowState[] = [];

    if (evaluation?.metrics && evaluation.metrics.length > 0) {
      rows = evaluation.metrics.map((m) => {
        const studentInfo = studentMetricMap.get(m.name.toLowerCase());
        const studentScore = studentInfo ? studentInfo.score : (m.student_score ?? 0);
        const managerScore = m.score !== null && m.score !== undefined ? Number(m.score) : 0;
        return {
          id: m.id,
          name: m.name,
          student_score: studentScore,
          manager_score: managerScore,
          full_score: Number(m.full_score) || 25,
          weightage: Number(m.weightage) || 0.25,
          student_remarks: studentInfo?.remarks || m.student_remarks || undefined,
          manager_remarks: m.remarks || undefined,
        };
      });
    } else if (selectedTask.student_metric_grades && selectedTask.student_metric_grades.length > 0) {
      rows = selectedTask.student_metric_grades.map((sm) => {
        const studentScore = Number(sm.score) || 0;
        return {
          name: sm.metric_name,
          student_score: studentScore,
          manager_score: 0,
          full_score: Number(sm.full_score) || 25,
          weightage: 0.25,
          student_remarks: sm.remarks || undefined,
          manager_remarks: "",
        };
      });
    } else {
      rows = [];
    }

    setMetricRows(rows);
    setManagerRemarks(evaluation?.remarks || "");
    setSubmissionSuccess(false);
    setError(null);
  }, [selectedTask, evaluation]);

  // Live Auto-Calculated Totals
  const totalStudentScore = useMemo(
    () => metricRows.reduce((acc, r) => acc + (Number(r.student_score) || 0), 0),
    [metricRows]
  );

  const totalManagerScore = useMemo(
    () => metricRows.reduce((acc, r) => acc + (Number(r.manager_score) || 0), 0),
    [metricRows]
  );

  const totalMaxScore = useMemo(
    () => metricRows.reduce((acc, r) => acc + (Number(r.full_score) || 25), 0),
    [metricRows]
  );

  const managerPercentage = totalMaxScore > 0 ? Math.round((totalManagerScore / totalMaxScore) * 100) : 0;

  const handleManagerScoreChange = (idx: number, val: number) => {
    setMetricRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const clamped = Math.max(0, Math.min(row.full_score, val));
        return { ...row, manager_score: clamped };
      })
    );
  };

  const handleManagerRemarksChange = (idx: number, text: string) => {
    setMetricRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, manager_remarks: text } : row))
    );
  };

  const handleAddMetricSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim() || !onCreateMetric) return;

    setIsAddingMetric(true);
    setError(null);
    try {
      await onCreateMetric({
        name: newMetricName.trim(),
        full_score: Number(newMetricFullScore) || 25,
        weightage: Number(newMetricWeightage) || 0.25,
        description: newMetricDesc.trim() || undefined,
      });
      setNewMetricName("");
      setNewMetricDesc("");
      setIsAddMetricOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add evaluation metric");
    } finally {
      setIsAddingMetric(false);
    }
  };

  const handleDeleteMetric = async (row: MetricRowState, idx: number) => {
    if (row.id && onDeleteMetric) {
      try {
        await onDeleteMetric(row.id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete metric");
      }
    } else {
      setMetricRows((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !selectedTask) return;

    if (metricRows.length === 0) {
      setError("Please add at least one evaluation metric before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payloadMetrics: MetricSubmissionInput[] = metricRows.map((r) => ({
        name: r.name,
        score: r.manager_score,
        full_score: r.full_score,
        weightage: r.weightage,
        student_score: r.student_score,
        student_remarks: r.student_remarks || null,
        remarks: r.manager_remarks || null,
      }));

      await submitTaskEvaluation(selectedWorkflow.id, selectedTask.id, {
        student_id: selectedTask.student_id,
        metrics: payloadMetrics,
        remarks: managerRemarks.trim() || undefined,
        status: "completed",
      });

      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const student = selectedTask
    ? teamMembers.find((m) => m.id === selectedTask.student_id) || {
        id: selectedTask.student_id,
        name: selectedTask.student_name || "Assigned Learner",
        email: selectedTask.student_email || "",
        enrollment_no: selectedTask.enrollment_no || null,
        batch_name: null,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* 4-Step Cascading Selector: Team -> Workflow -> Task -> Employee */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <span className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">filter_list</span>
            <span>Evaluation Cascade Navigator</span>
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Team → Workflow → Task → Employee
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1: Select Team */}
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
              1. Select Team:
            </label>
            <select
              value={activeTeamId}
              onChange={(e) => {
                const tid = e.target.value;
                setActiveTeamId(tid);
                if (onSelectTeam) {
                  const found = teams.find((t) => t.id === tid) || null;
                  onSelectTeam(found);
                }
              }}
              className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
            >
              <option value="">All Teams ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.member_count} mem)
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Workflow */}
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
              2. Select Workflow:
            </label>
            <select
              value={selectedWorkflow?.id || ""}
              onChange={(e) => {
                const wf = availableWorkflows.find((w) => w.id === e.target.value);
                if (wf) onSelectWorkflow(wf);
              }}
              className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
            >
              <option value="">Choose a workflow track...</option>
              {availableWorkflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.batch_name ? `(${w.batch_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Task */}
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
              3. Select Task:
            </label>
            <select
              value={selectedTaskTitle}
              disabled={!selectedWorkflow || distinctTaskTitles.length === 0}
              onChange={(e) => {
                const title = e.target.value;
                setSelectedTaskTitle(title);
                const matching = tasks.filter((t) => t.title === title);
                if (matching.length > 0) {
                  onSelectTask(matching[0]);
                }
              }}
              className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium disabled:opacity-50"
            >
              <option value="">Choose task deliverable...</option>
              {distinctTaskTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Step 4: Select Employee / Student [Batch X] */}
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
              4. Select Employee / Student:
            </label>
            <select
              value={selectedTask?.id || ""}
              disabled={!selectedWorkflow || currentTitleTasks.length === 0}
              onChange={(e) => {
                const t = tasks.find((tk) => tk.id === e.target.value);
                if (t) onSelectTask(t);
              }}
              className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium disabled:opacity-50"
            >
              <option value="">Choose employee / student...</option>
              {currentTitleTasks.map((t) => {
                const member = teamMembers.find((m) => m.id === t.student_id);
                const learnerName = t.student_name || member?.name || "Learner";
                const batchBadge = member?.batch_name ? ` [${member.batch_name}]` : "";
                const isEval =
                  (t.manager_grade !== null && t.manager_grade !== undefined) ||
                  (t.final_grade !== null && t.final_grade !== undefined);
                const evalLabel = isEval ? ` • Grade: ${t.manager_grade ?? t.final_grade}` : " • [PENDING]";
                return (
                  <option key={t.id} value={t.id}>
                    {learnerName}{batchBadge}{evalLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grading Canvas */}
      {!selectedTask ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">rate_review</span>
          <h4 className="text-body-md font-bold text-on-surface">No Task Selected</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
            Pick a workflow and task above to view student self-grade metrics and evaluate performance.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitEvaluation} className="space-y-6">
          {/* Deliverable Header Banner */}
          <div className="p-6 bg-gradient-to-r from-indigo-50/80 via-white to-surface-container-lowest rounded-2xl border border-indigo-200/80 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                  Deliverable Review
                </span>

                {/* Team Context */}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Team: {selectedWorkflow?.batch_name || student?.batch_name || "Assigned Team"}
                </span>

                {/* GREEN / RED Evaluation Status Indicator */}
                {((selectedTask.manager_grade !== null && selectedTask.manager_grade !== undefined) ||
                  (evaluation && evaluation.status === "completed") ||
                  metricRows.some((r) => (Number(r.manager_score) || 0) > 0)) ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>EVALUATED</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>NOT EVALUATED</span>
                  </span>
                )}

                <span className="text-xs text-on-surface-variant font-medium">
                  Learner: <strong className="text-slate-900">{student?.name || "Learner"}</strong>
                  {student?.enrollment_no ? ` • ID: ${student.enrollment_no}` : ""}
                </span>
              </div>
              <h3 className="text-xl font-bold font-headline text-slate-900">
                {selectedTask.title}
              </h3>
              {selectedTask.description && (
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  <strong>Requirements:</strong> {selectedTask.description}
                </p>
              )}
              {selectedTask.submission_notes ? (
                <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-100 text-xs text-slate-800 shadow-2xs">
                  <span className="font-bold text-indigo-950 block mb-0.5">Learner Submission Notes &amp; Reflections:</span>
                  <p className="text-slate-700 italic">{selectedTask.submission_notes}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No deliverable notes submitted yet.</p>
              )}
            </div>

            {/* Current Grade Comparison Card */}
            {metricRows.length > 0 && (
              <div className="shrink-0 bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs text-center min-w-[200px]">
                <div className="grid grid-cols-2 divide-x divide-slate-100 text-center gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Student Self-Grade</span>
                    <span className="text-2xl font-bold font-headline text-indigo-700">
                      {totalStudentScore}
                    </span>
                    <span className="text-[11px] text-slate-500 block">/ {totalMaxScore} pts</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Manager Score</span>
                    <span className="text-2xl font-bold font-headline text-emerald-600">
                      {totalManagerScore}
                    </span>
                    <span className="text-[11px] text-slate-500 block">/ {totalMaxScore} pts</span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {managerPercentage}% ({managerPercentage >= 90 ? "Exceeds Expectations" : managerPercentage >= 75 ? "Meets Standards" : "Needs Support"})
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="font-bold cursor-pointer">✕</button>
            </div>
          )}

          {submissionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span>
              <span className="font-bold">Evaluation successfully submitted and grade saved to database!</span>
            </div>
          )}

          {/* Metric-by-Metric Grading Table */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
              <div>
                <h4 className="text-title-md font-bold text-on-surface font-headline">
                  Metric-Based Scorecard &amp; Rubric
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Evaluate each dynamic metric individually. Total score and final percentage are calculated automatically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {metricRows.length} {metricRows.length === 1 ? "Metric" : "Metrics"}
                </span>
                {onCreateMetric && (
                  <button
                    type="button"
                    onClick={() => setIsAddMetricOpen(true)}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Add Metric</span>
                  </button>
                )}
              </div>
            </div>

            {isLoadingEvaluation ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : metricRows.length === 0 ? (
              <div className="text-center py-12 px-4 bg-surface-container/30 rounded-xl border border-dashed border-outline-variant/60 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">playlist_add</span>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-on-surface">No Evaluation Metrics Configured</h5>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                    Add custom evaluation metrics (e.g. Code Quality, Problem Solving, Timeliness) to evaluate this task.
                  </p>
                </div>
                {onCreateMetric && (
                  <button
                    type="button"
                    onClick={() => setIsAddMetricOpen(true)}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Create First Metric</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {metricRows.map((row, idx) => (
                  <div key={row.id || `${row.name}-${idx}`} className="py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{row.name}</span>
                          {onDeleteMetric && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMetric(row, idx)}
                              title="Delete this metric"
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 block font-mono">
                          Weight: {Math.round(row.weightage * 100)}% • Scale: 0 to {row.full_score} pts
                        </span>
                      </div>

                      {/* Score comparison pill */}
                      <div className="flex items-center gap-3">
                        {/* Student's Grade */}
                        {row.student_score > 0 && (
                          <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
                            <span className="text-[10px] text-indigo-500 font-bold block uppercase">Student Self-Score</span>
                            <span className="text-sm font-bold font-mono text-indigo-900">
                              {row.student_score} <span className="text-xs font-normal text-indigo-400">/ {row.full_score}</span>
                            </span>
                          </div>
                        )}

                        {/* Manager's Input */}
                        <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                          <span className="text-[10px] text-emerald-700 font-bold block uppercase">Your Grade</span>
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={row.full_score}
                              step="1"
                              value={row.manager_score}
                              onChange={(e) => handleManagerScoreChange(idx, Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-bold font-mono text-sm text-emerald-900 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-normal text-emerald-600">/ {row.full_score}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slider control for manager */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-8 flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={row.full_score}
                          value={row.manager_score}
                          onChange={(e) => handleManagerScoreChange(idx, Number(e.target.value))}
                          className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 shrink-0 w-8 text-right">
                          {row.manager_score}
                        </span>
                      </div>

                      <div className="md:col-span-4">
                        <input
                          type="text"
                          placeholder="Manager notes on this metric..."
                          value={row.manager_remarks || ""}
                          onChange={(e) => handleManagerRemarksChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-surface-container rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {row.student_remarks && (
                      <div className="text-[11px] text-indigo-700 bg-indigo-50/50 p-2 rounded-lg italic">
                        Learner remarks: &quot;{row.student_remarks}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Total Calculation Row */}
            {metricRows.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                    Automatically Calculated Total Grade
                  </span>
                  <span className="text-xs text-emerald-700">
                    Aggregated from your individual metric evaluations
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-3xl font-bold font-headline text-emerald-900 font-mono">
                      {totalManagerScore}
                    </span>
                    <span className="text-sm font-semibold text-emerald-700"> / {totalMaxScore} pts</span>
                    <span className="block text-xs font-mono text-emerald-600 font-bold">
                      {managerPercentage}% Total
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Qualitative Overall Feedback */}
          {metricRows.length > 0 && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
              <label className="block text-title-sm font-bold text-on-surface font-headline">
                Overall Manager Remarks &amp; Growth Guidance
              </label>
              <p className="text-xs text-on-surface-variant">
                Provide comprehensive qualitative commentary that will appear in the learner&apos;s Feedback tab and performance dossiers.
              </p>
              <textarea
                rows={3}
                value={managerRemarks}
                onChange={(e) => setManagerRemarks(e.target.value)}
                placeholder="e.g. Excellent attention to test coverage and modular architecture. Focus next sprint on reducing edge-case latency..."
                className="w-full p-3 bg-surface-container text-body-sm rounded-xl border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Submit Actions */}
          {metricRows.length > 0 && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                <span>{isSubmitting ? "Saving Grade..." : "Submit Evaluation & Finalize Grade"}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Add Metric Modal */}
      {isAddMetricOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setIsAddMetricOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_chart</span>
                <span>Add Evaluation Metric</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure a dynamic competency metric for &quot;{selectedTask?.title}&quot;.
              </p>
            </div>

            <form onSubmit={handleAddMetricSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metric Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. API Integration Quality, Code Design"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Score <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="25"
                    value={newMetricFullScore}
                    onChange={(e) => setNewMetricFullScore(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weightage (0.0 to 1.0)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    placeholder="0.25"
                    value={newMetricWeightage}
                    onChange={(e) => setNewMetricWeightage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Guidelines (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Criteria for scoring this metric..."
                  value={newMetricDesc}
                  onChange={(e) => setNewMetricDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMetricOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMetric}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isAddingMetric ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Save Metric</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

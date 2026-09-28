"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Workflow,
  WorkflowTask,
  TeamMember,
  fetchWorkflows,
  createWorkflow,
  deleteWorkflow,
  fetchWorkflowTasks,
  createWorkflowTask,
  deleteWorkflowTask,
  fetchManagerTeam,
} from "@/services/workflowService";
import {
  WorkflowEvaluation,
  fetchTaskEvaluation,
  createEvaluation,
  deleteEvaluation,
  createEvaluationMetric,
  deleteEvaluationMetric,
} from "@/services/evaluationService";

export default function ManagerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "team" | "workflows" | "progress" | "evaluations" | "feedback" | "reports" | "history">("dashboard");

  // Team Member State (Authorized Scope)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamBatchFilter, setTeamBatchFilter] = useState("all");

  // Workflow & Task State
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);

  // Evaluation & Metric State
  const [evaluation, setEvaluation] = useState<WorkflowEvaluation | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);

  // Modals & Form State
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDesc, setWorkflowDesc] = useState("");
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStudentId, setTaskStudentId] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalMaxScore, setEvalMaxScore] = useState("100");
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);

  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [metricName, setMetricName] = useState("");
  const [metricFullScore, setMetricFullScore] = useState("50");
  const [metricWeightage, setMetricWeightage] = useState("0.5");
  const [metricDesc, setMetricDesc] = useState("");
  const [isSubmittingMetric, setIsSubmittingMetric] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  // Sync with URL hash (e.g. #workflows, #evaluations)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["team", "workflows", "progress", "evaluations", "feedback", "reports", "history"].includes(hash)) {
        setActiveTab(hash as "dashboard" | "team" | "workflows" | "progress" | "evaluations" | "feedback" | "reports" | "history");
      }
    }
  }, []);

  // Load Authorized Team Members
  const loadTeamMembers = useCallback(async () => {
    try {
      setIsLoadingTeam(true);
      const data = await fetchManagerTeam();
      setTeamMembers(data || []);
    } catch (err) {
      console.warn("Failed to load manager team members:", err);
    } finally {
      setIsLoadingTeam(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  // Load Workflows
  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoadingWorkflows(true);
      const res = await fetchWorkflows(1, 100);
      setWorkflows(res.items || []);
    } catch (err) {
      console.warn("Failed to load workflows:", err);
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Load Tasks when a workflow is selected
  const loadTasks = useCallback(async (workflowId: string) => {
    try {
      setIsLoadingTasks(true);
      const res = await fetchWorkflowTasks(workflowId, 1, 100);
      setTasks(res.items || []);
    } catch (err) {
      console.warn("Failed to load tasks:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      loadTasks(selectedWorkflow.id);
    } else {
      setTasks([]);
      setSelectedTask(null);
    }
  }, [selectedWorkflow, loadTasks]);

  // Load Evaluation when task is selected
  const loadEvaluation = useCallback(async (workflowId: string, taskId: string) => {
    try {
      setIsLoadingEvaluation(true);
      const res = await fetchTaskEvaluation(workflowId, taskId);
      setEvaluation(res);
    } catch (err) {
      console.warn("Failed to load evaluation:", err);
      setEvaluation(null);
    } finally {
      setIsLoadingEvaluation(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkflow && selectedTask) {
      loadEvaluation(selectedWorkflow.id, selectedTask.id);
    } else {
      setEvaluation(null);
    }
  }, [selectedWorkflow, selectedTask, loadEvaluation]);

  // Handlers
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowName.trim()) return;
    setIsSubmittingWorkflow(true);
    setActionError(null);
    try {
      const created = await createWorkflow({
        name: workflowName.trim(),
        description: workflowDesc.trim() || undefined,
        is_active: true,
      });
      setWorkflowName("");
      setWorkflowDesc("");
      setIsWorkflowModalOpen(false);
      await loadWorkflows();
      setSelectedWorkflow(created);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to create workflow");
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this workflow? All associated tasks will be removed.")) return;
    setActionError(null);
    try {
      await deleteWorkflow(id);
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
        setSelectedTask(null);
      }
      await loadWorkflows();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete workflow");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !taskTitle.trim() || !taskStudentId.trim()) return;
    setIsSubmittingTask(true);
    setActionError(null);
    try {
      if (taskStudentId === "ALL") {
        await Promise.all(
          teamMembers.map((m) =>
            createWorkflowTask(selectedWorkflow.id, {
              title: taskTitle.trim(),
              description: taskDesc.trim() || undefined,
              student_id: m.id,
            })
          )
        );
      } else {
        await createWorkflowTask(selectedWorkflow.id, {
          title: taskTitle.trim(),
          description: taskDesc.trim() || undefined,
          student_id: taskStudentId.trim(),
        });
      }
      setTaskTitle("");
      setTaskDesc("");
      setTaskStudentId("");
      setIsTaskModalOpen(false);
      await loadTasks(selectedWorkflow.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedWorkflow || !window.confirm("Are you sure you want to delete this task?")) return;
    setActionError(null);
    try {
      await deleteWorkflowTask(selectedWorkflow.id, taskId);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setEvaluation(null);
      }
      await loadTasks(selectedWorkflow.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !selectedTask) return;
    setIsSubmittingEval(true);
    setActionError(null);
    try {
      await createEvaluation(selectedWorkflow.id, selectedTask.id, {
        student_id: selectedTask.student_id,
        max_score: parseFloat(evalMaxScore) || 100,
      });
      setIsEvalModalOpen(false);
      await loadEvaluation(selectedWorkflow.id, selectedTask.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to create evaluation matrix");
    } finally {
      setIsSubmittingEval(false);
    }
  };

  const handleDeleteEvaluation = async () => {
    if (!selectedWorkflow || !selectedTask || !evaluation) return;
    if (!window.confirm("Are you sure you want to delete this evaluation matrix? All metrics will be removed.")) return;
    setActionError(null);
    try {
      await deleteEvaluation(selectedWorkflow.id, selectedTask.id, evaluation.id);
      setEvaluation(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete evaluation");
    }
  };

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !selectedTask || !evaluation || !metricName.trim()) return;
    setIsSubmittingMetric(true);
    setActionError(null);
    try {
      await createEvaluationMetric(selectedWorkflow.id, selectedTask.id, evaluation.id, {
        name: metricName.trim(),
        full_score: parseFloat(metricFullScore) || 50,
        weightage: parseFloat(metricWeightage) || 0.5,
        description: metricDesc.trim() || undefined,
      });
      setMetricName("");
      setMetricDesc("");
      setIsMetricModalOpen(false);
      await loadEvaluation(selectedWorkflow.id, selectedTask.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to add metric");
    } finally {
      setIsSubmittingMetric(false);
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!selectedWorkflow || !selectedTask || !evaluation) return;
    if (!window.confirm("Are you sure you want to delete this metric?")) return;
    setActionError(null);
    try {
      await deleteEvaluationMetric(selectedWorkflow.id, selectedTask.id, evaluation.id, metricId);
      await loadEvaluation(selectedWorkflow.id, selectedTask.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete metric");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      {(session) => {
        const managerProfile = session.profile;
        const managerScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">

              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
                    <span className="material-symbols-outlined text-lg">supervisor_account</span>
                    <span>Manager Operations &amp; Team Oversight</span>
                  </div>
                  <h1 className="text-headline-md font-headline font-bold text-on-surface">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    Department: <span className="font-medium text-on-surface">{managerProfile?.department || "Engineering Management"}</span>
                    {" "}• Scope Type: <span className="font-medium text-on-surface">{managerScope?.scope_type || "assigned_team"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/50 text-on-surface">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Active Session</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "dashboard"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab("workflows")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "workflows"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">account_tree</span>
                  <span>Workflows (SCRUM-42)</span>
                </button>

                <button
                  onClick={() => setActiveTab("evaluations")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "evaluations"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">rate_review</span>
                  <span>Evaluations (SCRUM-43)</span>
                </button>

                <button
                  onClick={() => setActiveTab("team")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "team"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">groups</span>
                  <span>My Team</span>
                </button>

                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "reports"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">assessment</span>
                  <span>Reports</span>
                </button>
              </div>

              {/* Action Error Notification */}
              {actionError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    <span>{actionError}</span>
                  </div>
                  <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-800 text-xs font-bold cursor-pointer">
                    Dismiss
                  </button>
                </div>
              )}

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Workflows Managed</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {workflows.length} Total
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Live database records</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Assigned Team</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1 truncate">
                    {teamMembers.length} Members
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Authorized scope</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Selected Workflow Tasks</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1 truncate">
                    {tasks.length} Active Tasks
                  </p>
                  <p className="text-[11px] text-outline mt-1">{selectedWorkflow ? selectedWorkflow.name : "Select a workflow"}</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Evaluation Matrices</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {evaluation ? `${evaluation.metrics.length} Metrics` : "0 Matrices"}
                  </p>
                  <p className="text-[11px] text-outline mt-1">{selectedTask ? `Task: ${selectedTask.title}` : "Select a task"}</p>
                </div>
              </div>

              {/* TAB 1: WORKFLOWS (SCRUM-42) */}
              {activeTab === "workflows" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Workflow List */}
                  <div className="lg:col-span-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-title-md font-bold text-on-surface">Workflows</h2>
                      <button
                        onClick={() => setIsWorkflowModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-semibold rounded-lg cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>New</span>
                      </button>
                    </div>

                    {isLoadingWorkflows ? (
                      <div className="text-center py-8 text-on-surface-variant text-xs">Loading workflows...</div>
                    ) : workflows.length === 0 ? (
                      <div className="text-center py-8 text-on-surface-variant text-xs">
                        No workflows created yet. Click &quot;New&quot; to create your first workflow.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {workflows.map((wf) => {
                          const isSelected = selectedWorkflow?.id === wf.id;
                          return (
                            <div
                              key={wf.id}
                              onClick={() => {
                                setSelectedWorkflow(wf);
                                setSelectedTask(null);
                              }}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? "bg-[#4B2EF5]/10 border-[#4B2EF5] text-on-surface shadow-xs"
                                  : "bg-surface-container-low border-outline-variant/40 hover:bg-surface-container text-on-surface"
                              }`}
                            >
                              <div className="space-y-1 overflow-hidden">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm truncate">{wf.name}</span>
                                  {wf.is_active && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {wf.description && (
                                  <p className="text-[11px] text-on-surface-variant line-clamp-1">{wf.description}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorkflow(wf.id);
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                title="Delete Workflow"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Tasks for Selected Workflow */}
                  <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-title-md font-bold text-on-surface">
                          {selectedWorkflow ? `Tasks: ${selectedWorkflow.name}` : "Workflow Tasks"}
                        </h2>
                        <p className="text-body-xs text-on-surface-variant">
                          {selectedWorkflow ? "Manage task assignments and link to evaluation matrices" : "Select a workflow from the left to view tasks"}
                        </p>
                      </div>
                      {selectedWorkflow && (
                        <button
                          onClick={() => setIsTaskModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-semibold rounded-lg cursor-pointer transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">add_task</span>
                          <span>Add Task</span>
                        </button>
                      )}
                    </div>

                    {!selectedWorkflow ? (
                      <div className="text-center py-16 text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-4xl text-outline mb-2">arrow_back</span>
                        <p>Select a workflow from the left list to view or add tasks.</p>
                      </div>
                    ) : isLoadingTasks ? (
                      <div className="text-center py-12 text-on-surface-variant text-xs">Loading tasks...</div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-12 text-on-surface-variant text-xs">
                        No tasks in this workflow yet. Click &quot;Add Task&quot; to assign a student task.
                      </div>
                    ) : (
                      <div className="divide-y divide-outline-variant/30">
                        {tasks.map((task) => {
                          const isSelected = selectedTask?.id === task.id;
                          return (
                            <div
                              key={task.id}
                              className={`py-3.5 px-3 flex items-center justify-between rounded-xl transition-all ${
                                isSelected ? "bg-primary/5" : "hover:bg-surface-container/50"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-on-surface">{task.title}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface border border-outline-variant/40">
                                    {task.status}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-on-surface-variant">{task.description}</p>
                                )}
                                {(() => {
                                  const member = teamMembers.find((m) => m.id === task.student_id);
                                  return (
                                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium pt-0.5">
                                      <span className="material-symbols-outlined text-sm text-[#4B2EF5]">person</span>
                                      <span className="text-on-surface font-semibold">{member?.name || "Assigned Team Member"}</span>
                                      {member?.batch_name && (
                                        <span className="text-outline">({member.batch_name})</span>
                                      )}
                                      {member?.email && (
                                        <span className="text-outline/70">• {member.email}</span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setActiveTab("evaluations");
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-[#4B2EF5] hover:bg-surface-container-high text-xs font-semibold cursor-pointer border border-outline-variant/40"
                                >
                                  <span className="material-symbols-outlined text-sm">rate_review</span>
                                  <span>Matrix</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 cursor-pointer"
                                  title="Delete Task"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: EVALUATIONS (SCRUM-43) */}
              {activeTab === "evaluations" && (
                <div className="space-y-6">
                  {/* Selector Bar */}
                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant mb-1">Select Workflow</label>
                        <select
                          value={selectedWorkflow?.id || ""}
                          onChange={(e) => {
                            const found = workflows.find((w) => w.id === e.target.value);
                            setSelectedWorkflow(found || null);
                            setSelectedTask(null);
                          }}
                          className="h-10 px-3 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none bg-surface-container"
                        >
                          <option value="">-- Choose Workflow --</option>
                          {workflows.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedWorkflow && (
                        <div>
                          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Select Task</label>
                          <select
                            value={selectedTask?.id || ""}
                            onChange={(e) => {
                              const found = tasks.find((t) => t.id === e.target.value);
                              setSelectedTask(found || null);
                            }}
                            className="h-10 px-3 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none bg-surface-container"
                          >
                            <option value="">-- Choose Task --</option>
                            {tasks.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {selectedWorkflow && selectedTask && !evaluation && (
                      <button
                        onClick={() => setIsEvalModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add_box</span>
                        <span>Configure Evaluation Matrix</span>
                      </button>
                    )}
                  </div>

                  {/* Main Evaluation View */}
                  {!selectedWorkflow || !selectedTask ? (
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">fact_check</span>
                      <h3 className="font-bold text-base text-on-surface">Select a Workflow and Task</h3>
                      <p className="text-xs text-outline max-w-sm mx-auto mt-1">
                        Choose a workflow and one of its tasks to configure or view its evaluation matrix and scoring metrics.
                      </p>
                    </div>
                  ) : isLoadingEvaluation ? (
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-12 text-center text-on-surface-variant text-xs">
                      Loading evaluation configuration...
                    </div>
                  ) : !evaluation ? (
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">assignment_late</span>
                      <h3 className="font-bold text-base text-on-surface">No Evaluation Matrix Configured</h3>
                      <p className="text-xs text-outline max-w-md mx-auto mt-1">
                        This task has not yet been assigned an evaluation matrix. Click &quot;Configure Evaluation Matrix&quot; above to initialize metrics scoring.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-6">
                      {/* Evaluation Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/30 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                              Max Score: {evaluation.max_score} pts
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface">
                              Status: {evaluation.status || "draft"}
                            </span>
                          </div>
                          <h2 className="text-title-lg font-bold text-on-surface mt-2">
                            Evaluation Matrix: {selectedTask.title}
                          </h2>
                          <p className="text-xs text-outline font-mono mt-0.5">
                            Target Student: {evaluation.student_id}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsMetricModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Add Metric</span>
                          </button>
                          <button
                            onClick={handleDeleteEvaluation}
                            className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-all border border-rose-200"
                          >
                            Delete Matrix
                          </button>
                        </div>
                      </div>

                      {/* Metrics Table */}
                      <div>
                        <h3 className="text-title-sm font-bold text-on-surface mb-3">Scoring Metrics Breakdown</h3>
                        {evaluation.metrics.length === 0 ? (
                          <div className="p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs text-outline">
                            No metrics added yet. Click &quot;Add Metric&quot; to configure scoring dimensions (e.g. Code Quality, Communication).
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-surface-container text-on-surface font-semibold border-b border-outline-variant/40">
                                <tr>
                                  <th className="py-3 px-4">Metric Name</th>
                                  <th className="py-3 px-4">Full Score</th>
                                  <th className="py-3 px-4">Weightage</th>
                                  <th className="py-3 px-4">Description</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                                {evaluation.metrics.map((metric) => (
                                  <tr key={metric.id} className="hover:bg-surface-container/50">
                                    <td className="py-3 px-4 font-semibold text-sm">{metric.name}</td>
                                    <td className="py-3 px-4">{metric.full_score} pts</td>
                                    <td className="py-3 px-4 font-mono">{(metric.weightage * 100).toFixed(0)}% ({metric.weightage})</td>
                                    <td className="py-3 px-4 text-on-surface-variant">{metric.description || "-"}</td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMetric(metric.id)}
                                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                        title="Delete Metric"
                                      >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TEAM / SCOPE */}
              {activeTab === "team" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-4">
                  <h2 className="text-title-lg font-bold text-on-surface">Assigned Team Scope</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Team members, students, and active workflow task assignees under your manager jurisdiction.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    {(managerScope?.assigned_student_ids || []).length > 0 ? (
                      managerScope?.assigned_student_ids?.map((sId) => (
                        <div key={sId} className="p-4 rounded-xl bg-surface-container border border-outline-variant/40">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            <span className="font-semibold text-xs text-on-surface">Assigned Student</span>
                          </div>
                          <p className="font-mono text-[11px] text-outline mt-1 truncate">{sId}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-xs text-outline">
                        No individual student IDs directly locked to scope. Workflows can be assigned to all active students in your department.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MY TEAM (Authorized Scope) */}
              {activeTab === "team" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-title-lg font-bold text-on-surface">My Team</h2>
                      <p className="text-body-sm text-on-surface-variant">
                        Authorized team members and learners assigned to your cohorts &amp; department.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4B2EF5]/10 text-[#4B2EF5] border border-[#4B2EF5]/20">
                        {teamMembers.length} Authorized Members
                      </span>
                    </div>
                  </div>

                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search team member by name, email, department, or enrollment #..."
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <select
                      value={teamBatchFilter}
                      onChange={(e) => setTeamBatchFilter(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Batches</option>
                      {Array.from(new Set(teamMembers.map((m) => m.batch_name).filter(Boolean))).map((batchName) => (
                        <option key={batchName} value={batchName!}>{batchName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Team Members List */}
                  {isLoadingTeam ? (
                    <div className="text-center py-12 text-on-surface-variant text-xs">
                      Loading authorized team members...
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-12 text-on-surface-variant text-xs space-y-2">
                      <span className="material-symbols-outlined text-4xl text-outline mb-1">group_off</span>
                      <p className="font-semibold text-sm text-on-surface">No team members assigned yet</p>
                      <p className="text-outline max-w-sm mx-auto">
                        Super Admin or HR establishes organizational assignments and cohorts. Once assigned to your scope, members will automatically appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers
                        .filter((m) => {
                          const query = teamSearchQuery.toLowerCase();
                          const matchesQuery =
                            !query ||
                            m.name.toLowerCase().includes(query) ||
                            m.email.toLowerCase().includes(query) ||
                            (m.department && m.department.toLowerCase().includes(query)) ||
                            (m.enrollment_no && m.enrollment_no.toLowerCase().includes(query)) ||
                            (m.batch_name && m.batch_name.toLowerCase().includes(query));
                          const matchesBatch =
                            teamBatchFilter === "all" || m.batch_name === teamBatchFilter;
                          return matchesQuery && matchesBatch;
                        })
                        .map((member) => (
                          <div
                            key={member.id}
                            className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4 space-y-3 hover:border-primary/40 transition-all shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center font-bold text-sm">
                                  {member.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-on-surface">{member.name}</h4>
                                  <p className="text-[11px] text-outline truncate max-w-[180px]">{member.email}</p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                                {member.status || "Active"}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs pt-1 border-t border-outline-variant/20">
                              <div className="flex justify-between">
                                <span className="text-outline">Department:</span>
                                <span className="font-medium text-on-surface">{member.department || "General"}</span>
                              </div>
                              {member.batch_name && (
                                <div className="flex justify-between">
                                  <span className="text-outline">Cohort / Batch:</span>
                                  <span className="font-medium text-on-surface">{member.batch_name}</span>
                                </div>
                              )}
                              {member.enrollment_no && (
                                <div className="flex justify-between">
                                  <span className="text-outline">Enrollment:</span>
                                  <span className="font-mono text-[11px] text-outline">{member.enrollment_no}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                              <button
                                type="button"
                                onClick={() => {
                                  setTaskStudentId(member.id);
                                  if (!selectedWorkflow && workflows.length > 0) {
                                    setSelectedWorkflow(workflows[0]);
                                  }
                                  setIsTaskModalOpen(true);
                                  setActiveTab("workflows");
                                }}
                                className="w-full py-1.5 px-3 rounded-lg bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <span className="material-symbols-outlined text-sm">add_task</span>
                                <span>Assign Task</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DASHBOARD / DEFAULT OVERVIEW */}
              {activeTab === "dashboard" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-title-lg font-bold text-on-surface">Workflows &amp; Performance Overview</h2>
                      <p className="text-body-sm text-on-surface-variant">
                        Summary of workflows, assigned team members, and evaluation configurations under your management.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("team")}
                        className="px-3.5 py-2 bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold rounded-xl cursor-pointer border border-outline-variant/40 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">groups</span>
                        <span>My Team</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("workflows")}
                        className="px-4 py-2 bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">account_tree</span>
                        <span>Go to Workflows</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <span className="material-symbols-outlined">groups</span>
                          <span>Assigned Team Members</span>
                        </div>
                        <button
                          onClick={() => setActiveTab("team")}
                          className="text-xs text-[#4B2EF5] hover:underline font-semibold cursor-pointer"
                        >
                          View All
                        </button>
                      </div>
                      {teamMembers.length === 0 ? (
                        <p className="text-xs text-outline">No team members assigned to your scope.</p>
                      ) : (
                        <ul className="divide-y divide-outline-variant/30 text-xs">
                          {teamMembers.slice(0, 5).map((m) => (
                            <li key={m.id} className="py-2 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-on-surface">{m.name}</span>
                              </div>
                              <span className="text-outline text-[11px]">{m.batch_name || m.department || "Member"}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <span className="material-symbols-outlined">account_tree</span>
                          <span>Recent Workflows</span>
                        </div>
                        <button
                          onClick={() => setActiveTab("workflows")}
                          className="text-xs text-[#4B2EF5] hover:underline font-semibold cursor-pointer"
                        >
                          View All
                        </button>
                      </div>
                      {workflows.length === 0 ? (
                        <p className="text-xs text-outline">No workflows created yet.</p>
                      ) : (
                        <ul className="divide-y divide-outline-variant/30 text-xs">
                          {workflows.slice(0, 5).map((w) => (
                            <li key={w.id} className="py-2 flex justify-between items-center">
                              <span className="font-semibold text-on-surface">{w.name}</span>
                              <span className="text-outline text-[11px]">{new Date(w.created_at).toLocaleDateString()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: REPORTS & OTHERS */}
              {activeTab === "reports" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">assessment</span>
                  <h3 className="font-bold text-base text-on-surface">Reports Engine</h3>
                  <p className="text-xs text-outline max-w-sm mx-auto mt-1">
                    Formal PDF and spreadsheet export reports will be generated once full evaluation cycle grades are locked.
                  </p>
                </div>
              )}

              {/* MODAL 1: CREATE WORKFLOW */}
              {isWorkflowModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-base">Create New Workflow</h3>
                      <button
                        type="button"
                        onClick={() => setIsWorkflowModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                    <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Workflow Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Q4 Web Development Milestone"
                          value={workflowName}
                          onChange={(e) => setWorkflowName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Description</label>
                        <textarea
                          rows={3}
                          placeholder="Brief description of this workflow's objectives..."
                          value={workflowDesc}
                          onChange={(e) => setWorkflowDesc(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsWorkflowModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingWorkflow}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingWorkflow ? "Creating..." : "Create Workflow"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 2: ADD TASK */}
              {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-base">Add Workflow Task</h3>
                      <button
                        type="button"
                        onClick={() => setIsTaskModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                    <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Implement REST Authentication API"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Assign To (Team Member) *</label>
                        <select
                          required
                          value={taskStudentId}
                          onChange={(e) => setTaskStudentId(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none bg-white cursor-pointer font-medium"
                        >
                          <option value="">-- Select Assignee --</option>
                          {teamMembers.length > 0 && (
                            <option value="ALL" className="font-bold text-primary">
                              ⭐ Assign to All Team Members / Students ({teamMembers.length})
                            </option>
                          )}
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} {member.batch_name ? `(${member.batch_name})` : member.department ? `(${member.department})` : ""} - {member.email}
                            </option>
                          ))}
                        </select>
                        {teamMembers.length === 0 && !isLoadingTeam && (
                          <p className="text-[11px] text-amber-600 mt-1">
                            No team members found in your assigned cohort/department. Ensure HR/Super Admin has assigned learners to your scope.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Description</label>
                        <textarea
                          rows={3}
                          placeholder="Task details and deliverables expected..."
                          value={taskDesc}
                          onChange={(e) => setTaskDesc(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsTaskModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingTask}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingTask ? "Adding..." : "Add Task"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 3: CONFIGURE EVALUATION */}
              {isEvalModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-base">Configure Evaluation Matrix</h3>
                      <button
                        type="button"
                        onClick={() => setIsEvalModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                    <form onSubmit={handleCreateEvaluation} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Task</label>
                        <p className="font-semibold text-slate-800">{selectedTask?.title}</p>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Maximum Score (Points) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="1000"
                          value={evalMaxScore}
                          onChange={(e) => setEvalMaxScore(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsEvalModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingEval}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingEval ? "Initializing..." : "Create Matrix"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 4: ADD METRIC */}
              {isMetricModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-base">Add Scoring Metric</h3>
                      <button
                        type="button"
                        onClick={() => setIsMetricModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                    <form onSubmit={handleCreateMetric} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Metric Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Code Quality, Delivery Time, Communication"
                          value={metricName}
                          onChange={(e) => setMetricName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Full Score *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={metricFullScore}
                            onChange={(e) => setMetricFullScore(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Weightage (0 - 1.0) *</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            required
                            value={metricWeightage}
                            onChange={(e) => setMetricWeightage(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Evaluation criteria and standards..."
                          value={metricDesc}
                          onChange={(e) => setMetricDesc(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsMetricModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingMetric}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingMetric ? "Adding..." : "Add Metric"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

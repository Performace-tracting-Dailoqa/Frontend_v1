"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ManagerDataProvider, useManagerData } from "@/context/ManagerDataContext";
import { ManagerTab } from "@/components/manager/types";
import {
  Workflow,
  WorkflowTask,
  ManagerTeam,
  createManagerTeam,
  createWorkflow,
  deleteWorkflow,
  fetchWorkflowTasks,
  createWorkflowTask,
  deleteWorkflowTask,
} from "@/services/workflowService";
import {
  WorkflowEvaluation,
  fetchTaskEvaluation,
  createEvaluation,
  deleteEvaluation,
  createEvaluationMetric,
  deleteEvaluationMetric,
} from "@/services/evaluationService";

import DashboardTab from "@/components/manager/tabs/DashboardTab";
import TeamTab from "@/components/manager/tabs/TeamTab";
import WorkflowsTab from "@/components/manager/tabs/WorkflowsTab";
import ProgressTab from "@/components/manager/tabs/ProgressTab";
import EvaluationsTab from "@/components/manager/tabs/EvaluationsTab";
import FeedbackTab from "@/components/manager/tabs/FeedbackTab";
import ReportsTab from "@/components/manager/tabs/ReportsTab";
import HistoryTab from "@/components/manager/tabs/HistoryTab";

function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function ManagerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ManagerTab | null;
  const activeTab: ManagerTab = tabParam || "dashboard";

  // Global Cached Context (Fetched once per hour or on force refresh)
  const {
    teams,
    teamMembers,
    workflows,
    allTasks: allManagerTasks,
    isLoading: isContextLoading,
    isRefreshing,
    lastFetchedAt,
    refreshData,
    removeWorkflowFromState,
  } = useManagerData();

  // Selected Scope States
  const [selectedTeam, setSelectedTeam] = useState<ManagerTeam | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);

  // Evaluation & Metric State
  const [evaluation, setEvaluation] = useState<WorkflowEvaluation | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);

  // Action error state
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync with URL hash (e.g. #workflows, #evaluations)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["team", "workflows", "progress", "evaluations", "feedback", "reports", "history"].includes(hash)) {
        router.push(`/dashboard/manager?tab=${hash}`);
      }
    }
  }, [router]);

  // Keep selected workflow valid when workflows list updates
  useEffect(() => {
    if (workflows.length > 0) {
      setSelectedWorkflow((prev) => (prev && workflows.some((w) => w.id === prev.id) ? prev : workflows[0]));
    } else {
      setSelectedWorkflow(null);
    }
  }, [workflows]);

  // Scoped Team Members based on team filter
  const effectiveTeamMembers = useMemo(() => {
    if (!selectedTeam) return teamMembers;
    return teamMembers.filter((m) => m.batch_id === selectedTeam.id);
  }, [teamMembers, selectedTeam]);

  // Load Tasks for Selected Workflow
  const loadTasks = useCallback(
    async (workflowId: string) => {
      // First check if tasks already exist in allManagerTasks cache
      const cachedWorkflowTasks = allManagerTasks.filter((t) => t.workflow_id === workflowId);
      if (cachedWorkflowTasks.length > 0) {
        setTasks(cachedWorkflowTasks);
        setSelectedTask((prev) => (prev && cachedWorkflowTasks.some((t) => t.id === prev.id) ? prev : cachedWorkflowTasks[0]));
      }

      try {
        setIsLoadingTasks(true);
        const res = await fetchWorkflowTasks(workflowId, 1, 100);
        const fetched = res.items || [];
        setTasks(fetched);
        if (fetched.length > 0) {
          setSelectedTask((prev) => (prev && fetched.some((t) => t.id === prev.id) ? prev : fetched[0]));
        }
      } catch (err) {
        console.warn("Failed to load workflow tasks:", err);
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [allManagerTasks]
  );

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
  const handleDeleteWorkflow = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this workflow? All associated tasks will be removed.")) return;
    setActionError(null);
    try {
      await deleteWorkflow(id);
      removeWorkflowFromState(id);
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
        setSelectedTask(null);
      }
      await refreshData({ force: true });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete workflow");
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
      await Promise.all([loadTasks(selectedWorkflow.id), refreshData({ force: true })]);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete task");
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

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      {(session) => {
        const managerProfile = session.profile;
        const managerScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">

              {/* Sync Status & Refresh Bar (Visible across all tabs) */}
              <div className="flex items-center justify-between bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-xs text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${isRefreshing ? "animate-spin text-primary" : "text-emerald-500"}`}>
                    {isRefreshing ? "sync" : "cloud_done"}
                  </span>
                  <span>
                    {isRefreshing
                      ? "Fetching latest dashboard data..."
                      : lastFetchedAt
                      ? `Context cached • Synced ${formatTimeAgo(lastFetchedAt)} (Auto-syncs hourly)`
                      : "Connecting to manager cache..."}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => refreshData({ force: true })}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Force fetch latest data from backend"
                >
                  <span className={`material-symbols-outlined text-sm ${isRefreshing ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                  <span>{isRefreshing ? "Syncing..." : "Refresh Now"}</span>
                </button>
              </div>

              {/* Welcome Header - Only on Dashboard */}
              {activeTab === "dashboard" && (
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

                  <div className="flex flex-wrap items-center gap-3 z-10">
                    <div className="flex items-center gap-2 bg-surface-container-lowest px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/60 text-on-surface shadow-2xs">
                      <span className="material-symbols-outlined text-primary text-base">groups</span>
                      <select
                        value={selectedTeam?.id || "all"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "all") setSelectedTeam(null);
                          else {
                            const t = teams.find((item) => item.id === val);
                            if (t) setSelectedTeam(t);
                          }
                        }}
                        className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Teams ({teams.length})</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.member_count} members)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/50 text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Active Session</span>
                    </div>
                  </div>
                </div>
              )}

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

              {/* KPI Summary Cards - Only on Dashboard */}
              {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                    <span className="text-label-sm text-outline font-medium">Teams Managed</span>
                    <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                      {teams.length}
                    </p>
                    <p className="text-[11px] text-primary mt-1 font-medium">
                      {selectedTeam ? `Selected: ${selectedTeam.name}` : "All Assigned Teams"}
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                    <span className="text-label-sm text-outline font-medium">Total Team Members</span>
                    <p className="text-headline-sm font-headline font-bold text-on-surface mt-1 truncate">
                      {teamMembers.length > 0 ? teamMembers.length : teams.reduce((acc, t) => acc + (t.member_count || 0), 0)}
                    </p>
                    <p className="text-[11px] text-outline mt-1">
                      Across all {teams.length} teams
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                    <span className="text-label-sm text-outline font-medium">Total Workflows</span>
                    <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                      {workflows.length}
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-1 font-medium">Active &amp; Completed</p>
                  </div>

                  <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                    <span className="text-label-sm text-outline font-medium">Total Tasks</span>
                    <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                      {allManagerTasks.length}
                    </p>
                    <p className="text-[11px] text-outline mt-1">
                      {allManagerTasks.filter((t) => t.status === "completed").length} completed
                    </p>
                  </div>
                </div>
              )}

              {/* Content Panel */}
              <div className={activeTab === "dashboard" ? "rounded-2xl" : "bg-surface-container-lowest rounded-2xl p-8"}>
                {activeTab === "dashboard" && (
                  <DashboardTab
                    teams={teams}
                    teamMembers={effectiveTeamMembers}
                    workflows={workflows}
                    tasks={allManagerTasks.length > 0 ? allManagerTasks : tasks}
                    evaluation={evaluation}
                    onNavigateTab={(tab) => router.push(`/dashboard/manager?tab=${tab}`)}
                  />
                )}
                {activeTab === "team" && (
                  <TeamTab
                    teams={teams}
                    selectedTeam={selectedTeam}
                    onSelectTeam={(t) => setSelectedTeam(t)}
                    onCreateTeam={async (data) => {
                      await createManagerTeam(data);
                      await refreshData({ force: true });
                    }}
                    teamMembers={teamMembers}
                    isLoading={isContextLoading}
                    onAssignTask={() => {
                      router.push("/dashboard/manager?tab=progress");
                    }}
                    onCreateWorkflowForTeam={(team) => {
                      setSelectedTeam(team);
                      router.push("/dashboard/manager?tab=workflows");
                    }}
                    onRefreshData={async () => {
                      await refreshData({ force: true });
                    }}
                  />
                )}
                {activeTab === "workflows" && (
                  <WorkflowsTab
                    workflows={workflows}
                    isLoading={isContextLoading}
                    selectedWorkflow={selectedWorkflow}
                    onSelectWorkflow={(wf) => {
                      setSelectedWorkflow(wf);
                      loadTasks(wf.id);
                    }}
                    onCreateWorkflow={async (data) => {
                      await createWorkflow(data);
                      await refreshData({ force: true });
                    }}
                    onDeleteWorkflow={handleDeleteWorkflow}
                    teams={teams}
                    selectedTeam={selectedTeam}
                    onSelectTeam={(t) => setSelectedTeam(t)}
                    tasks={allManagerTasks.length > 0 ? allManagerTasks : tasks}
                    isLoadingTasks={isLoadingTasks}
                    teamMembers={teamMembers}
                    onCreateTask={async (data) => {
                      if (!selectedWorkflow) return;
                      await createWorkflowTask(selectedWorkflow.id, data);
                      await Promise.all([loadTasks(selectedWorkflow.id), refreshData({ force: true })]);
                    }}
                    onDeleteTask={async (taskId) => {
                      await handleDeleteTask(taskId);
                    }}
                    onNavigateToEvaluations={(wf, task) => {
                      setSelectedWorkflow(wf);
                      if (task) setSelectedTask(task);
                      router.push("/dashboard/manager?tab=evaluations");
                    }}
                  />
                )}
                {activeTab === "progress" && (
                  <ProgressTab
                    workflows={workflows}
                    selectedWorkflow={selectedWorkflow}
                    onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
                    tasks={tasks}
                    isLoadingTasks={isLoadingTasks}
                    teamMembers={effectiveTeamMembers}
                    selectedTask={selectedTask}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onCreateTask={async (data) => {
                      if (!selectedWorkflow) return;
                      if (data.student_id === "ALL") {
                        await Promise.all(
                          effectiveTeamMembers.map((m) =>
                            createWorkflowTask(selectedWorkflow.id, {
                              ...data,
                              student_id: m.id,
                            })
                          )
                        );
                      } else {
                        await createWorkflowTask(selectedWorkflow.id, data);
                      }
                      await Promise.all([loadTasks(selectedWorkflow.id), refreshData({ force: true })]);
                    }}
                    onDeleteTask={handleDeleteTask}
                    onNavigateToEvaluations={() => router.push("/dashboard/manager?tab=evaluations")}
                  />
                )}
                {activeTab === "evaluations" && (
                  <EvaluationsTab
                    teams={teams}
                    selectedTeam={selectedTeam}
                    onSelectTeam={(t) => setSelectedTeam(t)}
                    workflows={workflows}
                    selectedWorkflow={selectedWorkflow}
                    onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
                    tasks={tasks}
                    selectedTask={selectedTask}
                    onSelectTask={(t) => setSelectedTask(t)}
                    evaluation={evaluation}
                    isLoadingEvaluation={isLoadingEvaluation}
                    teamMembers={effectiveTeamMembers}
                    onCreateEvaluation={async (maxScore) => {
                      if (!selectedWorkflow || !selectedTask) return;
                      await createEvaluation(selectedWorkflow.id, selectedTask.id, {
                        student_id: selectedTask.student_id,
                        max_score: maxScore,
                      });
                      await loadEvaluation(selectedWorkflow.id, selectedTask.id);
                    }}
                    onDeleteEvaluation={handleDeleteEvaluation}
                    onCreateMetric={async (data) => {
                      if (!selectedWorkflow || !selectedTask) return;
                      let evalId = evaluation?.id;
                      if (!evalId) {
                        const newEval = await createEvaluation(selectedWorkflow.id, selectedTask.id, {
                          student_id: selectedTask.student_id,
                          max_score: 100,
                        });
                        evalId = newEval.id;
                      }
                      await createEvaluationMetric(selectedWorkflow.id, selectedTask.id, evalId, data);
                      await Promise.all([
                        loadEvaluation(selectedWorkflow.id, selectedTask.id),
                        refreshData({ force: true }),
                      ]);
                    }}
                    onDeleteMetric={async (metricId) => {
                      if (!selectedWorkflow || !selectedTask || !evaluation) return;
                      await deleteEvaluationMetric(selectedWorkflow.id, selectedTask.id, evaluation.id, metricId);
                      await Promise.all([
                        loadEvaluation(selectedWorkflow.id, selectedTask.id),
                        refreshData({ force: true }),
                      ]);
                    }}
                  />
                )}
                {activeTab === "feedback" && (
                  <FeedbackTab
                    teams={teams}
                    tasks={allManagerTasks.length > 0 ? allManagerTasks : tasks}
                    teamMembers={effectiveTeamMembers}
                    evaluation={evaluation}
                  />
                )}
                {activeTab === "reports" && (
                  <ReportsTab
                    teams={teams}
                    workflows={workflows}
                    tasks={allManagerTasks.length > 0 ? allManagerTasks : tasks}
                    teamMembers={teamMembers}
                  />
                )}
                {activeTab === "history" && (
                  <HistoryTab
                    tasks={allManagerTasks.length > 0 ? allManagerTasks : tasks}
                    teamMembers={effectiveTeamMembers}
                    evaluation={evaluation}
                  />
                )}
              </div>

            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

export default function ManagerDashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <ManagerDataProvider>
        <ManagerDashboardContent />
      </ManagerDataProvider>
    </Suspense>
  );
}

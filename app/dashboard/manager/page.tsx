"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ManagerTab } from "@/components/manager/types";
import ManagerNavTabs from "@/components/manager/ManagerNavTabs";
import {
  Workflow,
  WorkflowTask,
  TeamMember,
  fetchManagerTeam,
  fetchWorkflows,
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

function ManagerDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as ManagerTab | null;
  const activeTab: ManagerTab = tabParam || "dashboard";

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
        router.replace(`?tab=${hash}`);
      }
    }
  }, [router]);

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
              <ManagerNavTabs activeTab={activeTab} />

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
                    {managerScope?.assigned_workflow_ids?.length || 3}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Active Projects</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Team Size</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1 truncate">
                    {managerScope?.assigned_student_ids?.length || 8}
                  </p>
                  <p className="text-[11px] text-outline mt-1">Direct reports</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Pending Reviews</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">2</p>
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">Requires attention</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Evaluation Matrices</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {evaluation ? `${evaluation.metrics.length} Metrics` : "0 Matrices"}
                  </p>
                  <p className="text-[11px] text-outline mt-1">{selectedTask ? `Task: ${selectedTask.title}` : "Select a task"}</p>
                </div>
              </div>

              {/* Content Panel */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8">
                {activeTab === "dashboard" && <DashboardTab />}
                {activeTab === "team" && <TeamTab />}
                {activeTab === "workflows" && <WorkflowsTab />}
                {activeTab === "progress" && <ProgressTab />}
                {activeTab === "evaluations" && <EvaluationsTab />}
                {activeTab === "feedback" && <FeedbackTab />}
                {activeTab === "reports" && <ReportsTab />}
                {activeTab === "history" && <HistoryTab />}
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
      <ManagerDashboardContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { Workflow, WorkflowTask, TeamMember, ManagerTeam } from "@/services/workflowService";
import { WorkflowEvaluation } from "@/services/evaluationService";

interface DashboardTabProps {
  teams?: ManagerTeam[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  tasks: WorkflowTask[];
  evaluation: WorkflowEvaluation | null;
  onNavigateTab: (tab: "team" | "workflows" | "progress" | "evaluations" | "reports") => void;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#10B981",
  in_progress: "#3B82F6",
  submitted: "#8B5CF6",
  under_review: "#8B5CF6",
  pending: "#F59E0B",
  todo: "#94A3B8",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#10B981",
};

export default function DashboardTab({
  teams = [],
  teamMembers,
  workflows,
  tasks,
  onNavigateTab,
}: DashboardTabProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Drill-down State
  const [drillTeam, setDrillTeam] = useState<ManagerTeam | null>(null);
  const [drillWorkflow, setDrillWorkflow] = useState<Workflow | null>(null);
  const [drillTask, setDrillTask] = useState<WorkflowTask | null>(null);
  const [drillEmployee, setDrillEmployee] = useState<TeamMember | null>(null);

  // Filter workflows by drilled team
  const scopedWorkflows = useMemo(() => {
    if (!drillTeam) return workflows;
    return workflows.filter((w) => w.batch_id === drillTeam.id);
  }, [workflows, drillTeam]);

  // Filter tasks by drilled team/workflow
  const scopedTasks = useMemo(() => {
    let list = tasks;
    if (drillTeam) {
      const teamStudentIds = new Set(
        teamMembers.filter((m) => m.batch_id === drillTeam.id).map((m) => m.id)
      );
      const teamWorkflowIds = new Set(
        workflows.filter((w) => w.batch_id === drillTeam.id).map((w) => w.id)
      );
      list = list.filter((t) => teamWorkflowIds.has(t.workflow_id) || teamStudentIds.has(t.student_id));
    }
    if (drillWorkflow) {
      list = list.filter((t) => t.workflow_id === drillWorkflow.id);
    }
    if (drillTask) {
      list = list.filter((t) => t.id === drillTask.id);
    }
    if (drillEmployee) {
      list = list.filter((t) => t.student_id === drillEmployee.id);
    }
    return list;
  }, [tasks, drillTeam, drillWorkflow, drillTask, drillEmployee, workflows, teamMembers]);

  // Metric aggregates
  const totalTasks = scopedTasks.length;
  const completedTasks = scopedTasks.filter((t) => ["completed", "done"].includes((t.status || "").toLowerCase())).length;
  const pendingReviews = scopedTasks.filter((t) => ["submitted", "under_review"].includes((t.status || "").toLowerCase())).length;
  const inProgressTasks = scopedTasks.filter((t) => (t.status || "").toLowerCase() === "in_progress").length;
  const todoTasks = scopedTasks.filter((t) => ["pending", "todo"].includes((t.status || "").toLowerCase())).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Pie chart for status distribution
  const statusChartData = useMemo(() => {
    const counts = {
      completed: completedTasks,
      under_review: pendingReviews,
      in_progress: inProgressTasks,
      pending: todoTasks,
    };
    return Object.entries(counts)
      .filter(([, val]) => val > 0)
      .map(([key, val], idx) => ({
        id: idx,
        value: val,
        label: key.replace("_", " ").toUpperCase(),
        color: STATUS_COLORS[key] || "#94A3B8",
      }));
  }, [completedTasks, pendingReviews, inProgressTasks, todoTasks]);

  // Priority chart data
  const priorityChartData = useMemo(() => {
    const counts: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    scopedTasks.forEach((t) => {
      const p = (t.priority || "medium").toLowerCase();
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, val]) => val > 0)
      .map(([key, val], idx) => ({
        id: idx,
        value: val,
        label: key.toUpperCase(),
        color: PRIORITY_COLORS[key] || "#94A3B8",
      }));
  }, [scopedTasks]);

  // Reset drill-downs
  const handleResetToAll = () => {
    setDrillTeam(null);
    setDrillWorkflow(null);
    setDrillTask(null);
    setDrillEmployee(null);
  };

  const handleSelectTeam = (team: ManagerTeam) => {
    setDrillTeam(team);
    setDrillWorkflow(null);
    setDrillTask(null);
    setDrillEmployee(null);
  };

  const handleSelectWorkflow = (wf: Workflow) => {
    setDrillWorkflow(wf);
    setDrillTask(null);
    setDrillEmployee(null);
  };

  const handleSelectTask = (tk: WorkflowTask) => {
    setDrillTask(tk);
    setDrillEmployee(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Notice: NO CREATE WORKFLOW BUTTON */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">analytics</span>
            <span>Managerial Analytics Cockpit</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Performance Intelligence &amp; Graphs</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Click on any team, workflow, task, or employee below to interactively drill down into localized performance metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigateTab("team")}
            className="px-4 py-2 bg-surface-container text-on-surface rounded-xl text-body-sm font-semibold hover:bg-surface-container-high transition-all border border-outline-variant/60 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">groups</span>
            <span>Teams &amp; Roster</span>
          </button>
          <button
            onClick={() => onNavigateTab("evaluations")}
            className="px-4 py-2 bg-surface-container text-on-surface rounded-xl text-body-sm font-semibold hover:bg-surface-container-high transition-all border border-outline-variant/60 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">rate_review</span>
            <span>Evaluations</span>
          </button>
        </div>
      </div>

      {/* Interactive Breadcrumb Drill-Down Navigator */}
      <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/50 flex items-center justify-between gap-2 overflow-x-auto text-xs font-medium">
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            onClick={handleResetToAll}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              !drillTeam ? "bg-primary text-white font-bold" : "text-outline hover:text-primary hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-sm">domain</span>
            <span>All Teams ({teams.length})</span>
          </button>

          {drillTeam && (
            <>
              <span className="text-outline">/</span>
              <button
                onClick={() => {
                  setDrillWorkflow(null);
                  setDrillTask(null);
                  setDrillEmployee(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  !drillWorkflow ? "bg-primary text-white font-bold" : "text-outline hover:text-primary hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">groups</span>
                <span>Team: {drillTeam.name}</span>
              </button>
            </>
          )}

          {drillWorkflow && (
            <>
              <span className="text-outline">/</span>
              <button
                onClick={() => {
                  setDrillTask(null);
                  setDrillEmployee(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  !drillTask ? "bg-primary text-white font-bold" : "text-outline hover:text-primary hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">alt_route</span>
                <span>Workflow: {drillWorkflow.name}</span>
              </button>
            </>
          )}

          {drillTask && (
            <>
              <span className="text-outline">/</span>
              <button
                onClick={() => setDrillEmployee(null)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  !drillEmployee ? "bg-primary text-white font-bold" : "text-outline hover:text-primary hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">assignment</span>
                <span>Task: {drillTask.title}</span>
              </button>
            </>
          )}

          {drillEmployee && (
            <>
              <span className="text-outline">/</span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-white font-bold">
                <span className="material-symbols-outlined text-sm">person</span>
                <span>Emp: {drillEmployee.name}</span>
              </span>
            </>
          )}
        </div>

        {(drillTeam || drillWorkflow || drillTask || drillEmployee) && (
          <button
            onClick={handleResetToAll}
            className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <span>Reset View</span>
            <span className="material-symbols-outlined text-xs">restart_alt</span>
          </button>
        )}
      </div>

      {/* Snapshot Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-[11px] font-semibold text-outline uppercase">Active Scope</span>
          <div className="text-xl font-bold font-headline text-on-surface mt-1 truncate">
            {drillEmployee ? drillEmployee.name : drillTask ? drillTask.title : drillWorkflow ? drillWorkflow.name : drillTeam ? drillTeam.name : "All Portfolios"}
          </div>
          <span className="text-[11px] text-on-surface-variant">
            {drillTeam ? `Length: ${drillTeam.member_count} Members` : `${teams.length} Teams`}
          </span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-[11px] font-semibold text-outline uppercase">Scope Deliverables</span>
          <div className="text-xl font-bold font-headline text-on-surface mt-1">{totalTasks}</div>
          <span className="text-[11px] text-on-surface-variant">{completedTasks} Completed</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-[11px] font-semibold text-outline uppercase">Completion Rate</span>
          <div className="text-xl font-bold font-headline text-primary font-mono mt-1">{completionRate}%</div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1.5">
            <div className="bg-primary h-full rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-[11px] font-semibold text-outline uppercase">Pending Reviews</span>
          <div className="text-xl font-bold font-headline text-amber-600 font-mono mt-1">{pendingReviews}</div>
          <span className="text-[11px] text-on-surface-variant">Awaiting evaluation</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: TEAM-WISE GRAPHS & DRILL-DOWN (Shown when no team is drilled into) */}
      {/* ========================================================================= */}
      {!drillTeam && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">groups</span>
              <h3 className="text-base font-bold font-headline text-on-surface">
                1. Team-Wise Performance Comparison
              </h3>
            </div>
            <span className="text-xs text-outline font-medium">Click any team below to drill into its workflows</span>
          </div>

          {teams.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
              <p className="text-sm font-semibold text-on-surface">No teams configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className="p-5 rounded-2xl border border-outline-variant/40 hover:border-primary hover:shadow-md bg-surface-container-lowest transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold rounded-md">
                        {team.department || "General"}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                        Length: {team.member_count}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-on-surface font-headline group-hover:text-primary transition-colors">
                      {team.name}
                    </h4>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-outline">Completion</span>
                        <span className="font-bold text-primary font-mono">{team.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, team.progress_percentage)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-outline-variant/20 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-outline block">Workflows</span>
                        <span className="font-bold text-on-surface">{team.active_workflows}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">Tasks</span>
                        <span className="font-bold text-on-surface">{team.active_tasks}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">Pending Eval</span>
                        <span className="font-bold text-amber-600">{team.evaluations_pending}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-semibold">
                    <span>Explore Team Workflows</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bar Chart comparing teams if >= 2 teams */}
          {teams.length >= 2 && isMounted && (
            <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs">
              <h4 className="text-sm font-bold text-on-surface mb-1">Team Completion Rate (%) Comparison</h4>
              <p className="text-xs text-on-surface-variant mb-4">Benchmarking progress across all teams</p>
              <div className="h-64">
                <BarChart
                  xAxis={[{ scaleType: "band", data: teams.map((t) => t.name) }]}
                  series={[
                    {
                      data: teams.map((t) => t.progress_percentage),
                      color: "#4B2EF5",
                      label: "Completion %",
                    },
                  ]}
                  height={240}
                  margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: WORKFLOW-WISE GRAPHS (Shown when a team is drilled into)         */}
      {/* ========================================================================= */}
      {drillTeam && !drillWorkflow && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">alt_route</span>
              <h3 className="text-base font-bold font-headline text-on-surface">
                2. Workflows inside {drillTeam.name}
              </h3>
            </div>
            <span className="text-xs text-outline font-medium">Click any workflow to inspect its tasks</span>
          </div>

          {scopedWorkflows.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
              <span className="material-symbols-outlined text-3xl text-outline mb-2">alt_route</span>
              <p className="text-sm font-semibold text-on-surface">No workflows created for {drillTeam.name} yet</p>
              <p className="text-xs text-on-surface-variant mt-1 mb-3">
                Go to the Workflows tab or Team tab to create a workflow for this team.
              </p>
              <button
                onClick={() => onNavigateTab("workflows")}
                className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
              >
                Go to Workflows
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scopedWorkflows.map((wf) => {
                const wfTasks = tasks.filter((t) => t.workflow_id === wf.id);
                const wfDone = wfTasks.filter((t) => ["completed", "done"].includes((t.status || "").toLowerCase())).length;
                const wfRate = wfTasks.length > 0 ? Math.round((wfDone / wfTasks.length) * 100) : 0;
                return (
                  <div
                    key={wf.id}
                    onClick={() => handleSelectWorkflow(wf)}
                    className="p-5 rounded-2xl border border-outline-variant/40 hover:border-primary hover:shadow-md bg-surface-container-lowest transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold rounded-md">
                          Workflow Track
                        </span>
                        <span className="text-xs font-bold text-primary font-mono">{wfRate}% Done</span>
                      </div>

                      <h4 className="text-base font-bold text-on-surface font-headline group-hover:text-primary transition-colors">
                        {wf.name}
                      </h4>
                      {wf.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">{wf.description}</p>
                      )}

                      <div className="mt-3 space-y-1">
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${wfRate}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-outline-variant/20 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-outline block">Total Tasks</span>
                          <span className="font-bold text-on-surface">{wfTasks.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-outline block">Completed</span>
                          <span className="font-bold text-emerald-600">{wfDone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-semibold">
                      <span>Inspect Tasks</span>
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: TASK-WISE GRAPHS & DRILL-DOWN (Shown when workflow is drilled into)*/}
      {/* ========================================================================= */}
      {drillWorkflow && !drillTask && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">assignment</span>
              <h3 className="text-base font-bold font-headline text-on-surface">
                3. Tasks in {drillWorkflow.name}
              </h3>
            </div>
            <span className="text-xs text-outline font-medium">Click any task to inspect student grading</span>
          </div>

          {scopedTasks.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
              <p className="text-sm font-semibold text-on-surface">No tasks assigned to this workflow yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedTasks.map((tk) => {
                const member = teamMembers.find((m) => m.id === tk.student_id);
                const isEval = tk.manager_grade !== null && tk.manager_grade !== undefined;
                return (
                  <div
                    key={tk.id}
                    onClick={() => handleSelectTask(tk)}
                    className="p-4 rounded-xl border border-outline-variant/40 hover:border-primary hover:shadow-xs bg-surface-container-lowest transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded uppercase">
                          Priority: {tk.priority || "Medium"}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isEval
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isEval ? `Grade: ${tk.manager_grade}` : "Not Evaluated"}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {tk.title}
                      </h4>
                      {tk.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{tk.description}</p>
                      )}

                      <div className="mt-3 p-2 bg-surface-container/30 rounded-lg flex items-center justify-between text-xs">
                        <span className="text-outline">Assigned Employee:</span>
                        <span className="font-semibold text-on-surface">
                          {tk.student_name || member?.name || "Learner"}
                          {member?.batch_name && (
                            <span className="text-[10px] text-primary ml-1 font-mono">[{member.batch_name}]</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-primary font-semibold">
                      <span>View Employee Performance</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 4: EMPLOYEE-WISE PERFORMANCE DETAIL (Shown when a task is drilled into)*/}
      {/* ========================================================================= */}
      {drillTask && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
              <h3 className="text-base font-bold font-headline text-on-surface">
                4. Employee Performance for: {drillTask.title}
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("evaluations")}
              className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">edit_note</span>
              <span>Grade in Evaluations</span>
            </button>
          </div>

          <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
            {/* Student Info Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container/30 rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {(drillTask.student_name || "L").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-on-surface">{drillTask.student_name || "Assigned Learner"}</h4>
                  <div className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                    {drillTask.student_email && <span>{drillTask.student_email}</span>}
                    {drillTask.enrollment_no && <span className="font-mono">ID: {drillTask.enrollment_no}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">
                  Batch: {drillTeam?.name || "Assigned Batch"}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    drillTask.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  Status: {drillTask.status}
                </span>
              </div>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-surface-container/20 rounded-xl">
                <span className="text-[11px] text-outline uppercase font-semibold block">Student Self Grade</span>
                <span className="text-xl font-bold font-mono text-on-surface mt-1 block">
                  {drillTask.student_grade !== null && drillTask.student_grade !== undefined ? drillTask.student_grade : "—"}
                </span>
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <span className="text-[11px] text-primary uppercase font-semibold block">Manager Evaluated Grade</span>
                <span className="text-xl font-bold font-mono text-primary mt-1 block">
                  {drillTask.manager_grade !== null && drillTask.manager_grade !== undefined ? drillTask.manager_grade : "Pending"}
                </span>
              </div>
              <div className="p-3 bg-surface-container/20 rounded-xl">
                <span className="text-[11px] text-outline uppercase font-semibold block">Final Percentage</span>
                <span className="text-xl font-bold font-mono text-on-surface mt-1 block">
                  {drillTask.final_grade !== null && drillTask.final_grade !== undefined ? `${drillTask.final_grade}%` : "—"}
                </span>
              </div>
            </div>

            {/* Submission Notes */}
            {drillTask.submission_notes && (
              <div className="p-3.5 bg-surface-container/30 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-on-surface block">Employee Submission Notes:</span>
                <p className="text-on-surface-variant italic">&quot;{drillTask.submission_notes}&quot;</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE VISUAL PERFORMANCE GRAPHS (Always visible below active scope) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Graph 1: Status Distribution */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-title-md font-headline font-bold text-on-surface">Deliverable Status Distribution</h3>
              <p className="text-xs text-on-surface-variant">
                Breakdown for {drillWorkflow ? drillWorkflow.name : drillTeam ? drillTeam.name : "all teams"}
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">donut_large</span>
          </div>

          {totalTasks === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-body-sm">
              <span className="material-symbols-outlined text-3xl text-outline mb-2">assignment_late</span>
              <p>No tasks found for current scope.</p>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              {isMounted && statusChartData.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: statusChartData,
                      innerRadius: 55,
                      outerRadius: 90,
                      paddingAngle: 3,
                      cornerRadius: 5,
                      highlightScope: { highlight: "item", fade: "global" },
                    },
                  ]}
                  height={240}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  hideLegend
                />
              ) : (
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-outline-variant/20 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-outline mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.completed }} />
                <span>Completed</span>
              </div>
              <span className="text-sm font-bold text-on-surface font-mono">{completedTasks}</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-outline mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.under_review }} />
                <span>Under Review</span>
              </div>
              <span className="text-sm font-bold text-on-surface font-mono">{pendingReviews}</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-outline mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.in_progress }} />
                <span>In Progress</span>
              </div>
              <span className="text-sm font-bold text-on-surface font-mono">{inProgressTasks}</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-outline mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.pending }} />
                <span>Pending</span>
              </div>
              <span className="text-sm font-bold text-on-surface font-mono">{todoTasks}</span>
            </div>
          </div>
        </div>

        {/* Graph 2: Priority Breakdown */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-title-md font-headline font-bold text-on-surface">Urgency &amp; Priority Allocation</h3>
              <p className="text-xs text-on-surface-variant">Task urgency distribution across active scope</p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
          </div>

          {totalTasks === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-body-sm">
              <span className="material-symbols-outlined text-3xl text-outline mb-2">flag</span>
              <p>No priority assignments recorded.</p>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              {isMounted && priorityChartData.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: priorityChartData,
                      innerRadius: 55,
                      outerRadius: 90,
                      paddingAngle: 3,
                      cornerRadius: 5,
                      highlightScope: { highlight: "item", fade: "global" },
                    },
                  ]}
                  height={240}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  hideLegend
                />
              ) : (
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-outline-variant/20 text-center">
            {["urgent", "high", "medium", "low"].map((p) => {
              const count = scopedTasks.filter((t) => (t.priority || "medium").toLowerCase() === p).length;
              return (
                <div key={p}>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-outline mb-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
                    <span className="capitalize">{p}</span>
                  </div>
                  <span className="text-sm font-bold text-on-surface font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

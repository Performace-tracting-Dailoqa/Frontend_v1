"use client";

import React from "react";
import { Workflow, WorkflowTask, TeamMember } from "@/services/workflowService";
import { WorkflowEvaluation } from "@/services/evaluationService";

interface DashboardTabProps {
  teamMembers: TeamMember[];
  workflows: Workflow[];
  tasks: WorkflowTask[];
  evaluation: WorkflowEvaluation | null;
  onNavigateTab: (tab: "team" | "workflows" | "progress" | "evaluations") => void;
}

export default function DashboardTab({
  teamMembers,
  workflows,
  tasks,
  evaluation,
  onNavigateTab,
}: DashboardTabProps) {
  const activeWorkflows = workflows.filter((w) => w.status !== "archived");
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const pendingReviews = tasks.filter((t) => t.status === "submitted").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Quick Action & Summary Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Team Management Cockpit</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Supervise assigned learners, allocate workflow tasks, and record rubric-based performance evaluations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigateTab("workflows")}
            className="px-4 py-2 bg-primary text-white rounded-xl text-body-sm font-semibold hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>New Workflow</span>
          </button>
          <button
            onClick={() => onNavigateTab("team")}
            className="px-4 py-2 bg-surface-container text-on-surface rounded-xl text-body-sm font-semibold hover:bg-surface-container-high transition-all border border-outline-variant/60 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">groups</span>
            <span>View Roster</span>
          </button>
        </div>
      </div>

      {/* Snapshot Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-label-sm font-semibold text-outline">Task Completion</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-200">
              {completionRate}% Complete
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-on-surface">{completedTasks}</span>
            <span className="text-body-sm text-on-surface-variant font-medium">/ {totalTasks} Tasks</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-label-sm font-semibold text-outline">Submissions Pending</span>
            <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-amber-200">
              Review Queue
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-on-surface">{pendingReviews}</span>
            <span className="text-body-sm text-on-surface-variant font-medium">Require Grading</span>
          </div>
          <p className="text-xs text-outline mt-3">
            Tasks flagged by students ready for rubric evaluation.
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-label-sm font-semibold text-outline">Active Cohorts</span>
            <span className="text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-indigo-200">
              {teamMembers.length} Learners
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-on-surface">{activeWorkflows.length}</span>
            <span className="text-body-sm text-on-surface-variant font-medium">Running Workflows</span>
          </div>
          <p className="text-xs text-outline mt-3">
            Distributed across assigned manager cohorts.
          </p>
        </div>
      </div>

      {/* Active Workflows Preview */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-title-md font-headline font-bold text-on-surface">Recent Workflows</h3>
          <button
            onClick={() => onNavigateTab("workflows")}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            View All ({workflows.length}) →
          </button>
        </div>

        {workflows.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant text-body-sm">
            <span className="material-symbols-outlined text-3xl text-outline mb-2">account_tree</span>
            <p>No active workflows yet. Create your first workflow to assign tasks.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {workflows.slice(0, 5).map((wf) => (
              <div key={wf.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-body-md font-semibold text-on-surface">{wf.name}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-1">{wf.description || "No description provided."}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                    {wf.status || "active"}
                  </span>
                  <button
                    onClick={() => onNavigateTab("progress")}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Manage Tasks →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

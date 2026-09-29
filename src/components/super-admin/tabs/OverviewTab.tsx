"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  fetchSuperuserOverview,
  isPermissionError,
  SuperuserOverview,
} from "@/services/insightsService";
import { SystemTelemetryData } from "@/services/adminService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Pill,
  ProgressBar,
  SectionCard,
  StatCard,
  UnavailableState,
} from "../SuperAdminUi";
import { SuperAdminTab } from "../types";

interface OverviewTabProps {
  telemetry: SystemTelemetryData | null;
  onNavigateTab: (tab: SuperAdminTab) => void;
  onRefresh: () => void;
}

function formatScore(value: number | null | undefined): string {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "—";
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function severityTone(status: string | null | undefined): "emerald" | "amber" | "rose" | "slate" {
  const normalized = (status || "").toLowerCase();
  if (["success", "completed", "ok", "allowed"].includes(normalized)) return "emerald";
  if (["failed", "denied", "error", "blocked"].includes(normalized)) return "rose";
  if (["warning", "pending"].includes(normalized)) return "amber";
  return "slate";
}

export default function OverviewTab({ telemetry, onNavigateTab, onRefresh }: OverviewTabProps) {
  const {
    data: overview,
    isInitialLoading,
    error,
    reload,
  } = useAsyncData<SuperuserOverview>(() => fetchSuperuserOverview(), []);

  if (isInitialLoading) {
    return <LoadingState label="Assembling system-wide insights from the database…" />;
  }

  if (error) {
    return isPermissionError(error) ? (
      <UnavailableState
        icon="lock"
        title="Super Admin access required"
        message={error}
        hint="The /api/v1/superuser/* endpoints are restricted to the Super Admin role."
      />
    ) : (
      <ErrorState title="Could not load the overview" message={error} onRetry={reload} />
    );
  }

  if (!overview) {
    return (
      <EmptyState
        title="No overview data"
        description="The backend returned an empty response. Refresh to try again."
        action={
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Refresh</span>
          </button>
        }
      />
    );
  }

  const dbOnline = telemetry?.database_connected ?? false;
  const latency = telemetry?.database_latency_ms ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="dashboard"
        title="System Overview"
        description={`Live counters read from the PMS database at ${formatTimestamp(overview.generated_at)}`}
        action={
          <button
            type="button"
            onClick={() => {
              onRefresh();
              reload();
            }}
            className="h-10 px-4 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>Refresh</span>
          </button>
        }
      />

      {/* CONNECTION BANNER */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl border text-xs ${
          dbOnline
            ? "bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border-emerald-500/20"
            : "bg-rose-50 border-rose-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                dbOnline ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                dbOnline ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
          <span className={dbOnline ? "font-bold text-emerald-800" : "font-bold text-rose-800"}>
            {dbOnline ? "Backend connected" : "Backend unreachable"}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">
            Supabase PostgreSQL {dbOnline ? "Online" : "Unreachable"}
            {latency !== null ? ` · ${latency} ms round trip` : ""}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Snapshot {formatTimestamp(overview.generated_at)}
        </span>
      </div>

      {/* KPI GRID */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } }}
        >
          <StatCard
            label="Identities"
            value={overview.users.total}
            hint={`${overview.users.active} active`}
            icon="badge"
            tone="primary"
            onClick={() => onNavigateTab("users")}
          />
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } }}
        >
          <StatCard
            label="Teams"
            value={overview.teams.total}
            hint={`${overview.teams.active} running`}
            icon="groups"
            tone="indigo"
            onClick={() => onNavigateTab("teams")}
          />
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } }}
        >
          <StatCard
            label="Learners & Interns"
            value={overview.teams.learners}
            hint={
              overview.teams.unassigned_learners > 0
                ? `${overview.teams.unassigned_learners} unassigned`
                : "All assigned"
            }
            hintTone={overview.teams.unassigned_learners > 0 ? "warning" : "positive"}
            icon="school"
            tone="teal"
            onClick={() => onNavigateTab("users")}
          />
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } }}
        >
          <StatCard
            label="Task Completion"
            value={`${overview.work.completion_percentage}%`}
            hint={`${overview.work.tasks_completed} of ${overview.work.tasks} tasks`}
            hintTone={overview.work.completion_percentage >= 50 ? "positive" : "warning"}
            icon="task_alt"
            tone="emerald"
            onClick={() => onNavigateTab("progress")}
          />
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } }}
        >
          <StatCard
            label="Evaluations"
            value={overview.evaluations.total}
            hint={`avg ${formatScore(overview.evaluations.average_percentage)}`}
            icon="assignment_turned_in"
            tone="violet"
            onClick={() => onNavigateTab("progress")}
          />
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } }}
        >
          <StatCard
            label="Overdue Tasks"
            value={overview.work.tasks_overdue}
            hint={overview.work.tasks_overdue > 0 ? "Needs attention" : "None overdue"}
            hintTone={overview.work.tasks_overdue > 0 ? "critical" : "positive"}
            icon="running_with_errors"
            tone={overview.work.tasks_overdue > 0 ? "rose" : "slate"}
            onClick={() => onNavigateTab("progress")}
          />
        </motion.div>
      </motion.div>

      {/* ROLES + WORKLOAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard
          title="People by Role"
          subtitle={`${overview.users.inactive} account${overview.users.inactive === 1 ? "" : "s"} currently deactivated`}
          icon="manage_accounts"
          className="lg:col-span-1"
          action={
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="text-xs font-bold text-[#4B2EF5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          }
        >
          {overview.users.by_role.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No roles are defined in the database.</p>
          ) : (
            <ul className="space-y-2.5">
              {overview.users.by_role.map((role) => {
                const share =
                  overview.users.total > 0 ? (role.count / overview.users.total) * 100 : 0;
                return (
                  <li key={role.id ?? role.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 truncate pr-2">{role.name}</span>
                      <span className="font-bold text-slate-900 font-mono shrink-0">{role.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Workflow Workload"
          subtitle="Tasks across every batch in the platform"
          icon="account_tree"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Workflows", value: overview.work.workflows, tone: "text-slate-900" },
              { label: "Tasks", value: overview.work.tasks, tone: "text-slate-900" },
              { label: "Completed", value: overview.work.tasks_completed, tone: "text-emerald-600" },
              { label: "Overdue", value: overview.work.tasks_overdue, tone: "text-rose-600" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <ProgressBar
            value={overview.work.completion_percentage}
            label="Overall task completion"
            className="mb-4"
          />
          <div className="flex flex-wrap gap-2">
            <Pill tone="primary">
              <span className="material-symbols-outlined text-[13px]">mark_email_unread</span>
              {overview.notifications.unread} unread notification
              {overview.notifications.unread === 1 ? "" : "s"}
            </Pill>
            <Pill tone="violet">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              {overview.evaluations.finalized} finalized evaluation
              {overview.evaluations.finalized === 1 ? "" : "s"}
            </Pill>
            <Pill tone="slate">
              <span className="material-symbols-outlined text-[13px]">grading</span>
              {overview.evaluations.workflow} workflow · {overview.evaluations.general} general
            </Pill>
          </div>
        </SectionCard>
      </div>

      {/* AUDIT STREAM */}
      <SectionCard
        title="Recent Audit Activity"
        subtitle="Latest entries from the immutable audit_logs table"
        icon="history"
        action={
          <button
            type="button"
            onClick={() => onNavigateTab("progress")}
            className="text-xs font-bold text-[#4B2EF5] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Team progress</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        }
      >
        {overview.activity.length === 0 ? (
          <EmptyState
            icon="history_toggle_off"
            title="No audit entries yet"
            description="Actions performed in the PMS will be recorded here automatically."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {overview.activity.map((entry) => (
              <li key={entry.id} className="py-2.5 flex flex-wrap items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">bolt</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {entry.actor_name}
                    <span className="font-medium text-slate-500"> · {entry.action}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {entry.entity_type ? `${entry.entity_type} · ` : ""}
                    {entry.ip_address ?? "no IP recorded"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Pill tone={severityTone(entry.status)}>{entry.status ?? "logged"}</Pill>
                  <span className="text-[11px] text-slate-400">{entry.relative_time}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </motion.div>
  );
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  fetchSuperuserProgress,
  isPermissionError,
  ProgressSortKey,
  SuperuserProgress,
  TeamRecord,
} from "@/services/insightsService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Pill,
  ProgressBar,
  SearchInput,
  SectionCard,
  Select,
  StatCard,
  UnavailableState,
} from "../SuperAdminUi";

const SORT_OPTIONS: Array<{ value: ProgressSortKey; label: string }> = [
  { value: "completion", label: "Sort: Completion" },
  { value: "score", label: "Sort: Evaluation Score" },
  { value: "overdue", label: "Sort: Overdue Tasks" },
  { value: "learners", label: "Sort: Headcount" },
  { value: "name", label: "Sort: Name" },
];

function formatScore(value: number | null): string {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "No scores";
}

function scoreTone(value: number | null): "emerald" | "amber" | "rose" | "slate" {
  if (value === null) return "slate";
  if (value >= 75) return "emerald";
  if (value >= 50) return "amber";
  return "rose";
}

function attentionLevel(team: TeamRecord): "critical" | "warning" | "good" | "idle" {
  if (team.tasks.overdue > 0) return "critical";
  if (team.tasks.total === 0) return "idle";
  if (team.tasks.completion_percentage < 50) return "warning";
  return "good";
}

const ATTENTION_COPY: Record<
  ReturnType<typeof attentionLevel>,
  { label: string; tone: "rose" | "amber" | "emerald" | "slate" }
> = {
  critical: { label: "Overdue work", tone: "rose" },
  warning: { label: "Behind schedule", tone: "amber" },
  good: { label: "On track", tone: "emerald" },
  idle: { label: "No tasks yet", tone: "slate" },
};

function TeamProgressRow({ team }: { team: TeamRecord }) {
  const [expanded, setExpanded] = useState(false);
  const level = attentionLevel(team);
  const attention = ATTENTION_COPY[level];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="w-full text-left p-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
              <Pill tone={attention.tone}>{attention.label}</Pill>
              {team.department && <Pill tone="slate">{team.department}</Pill>}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {team.manager?.name ?? "No manager"} · {team.teacher?.name ?? "No teacher"} ·{" "}
              {team.student_count} learner{team.student_count === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Completion</p>
              <p className="text-lg font-bold text-slate-900 font-mono leading-tight">
                {team.tasks.completion_percentage}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Avg Score</p>
              <p
                className={`text-lg font-bold font-mono leading-tight ${
                  scoreTone(team.evaluation.average_percentage) === "emerald"
                    ? "text-emerald-600"
                    : scoreTone(team.evaluation.average_percentage) === "amber"
                      ? "text-amber-600"
                      : scoreTone(team.evaluation.average_percentage) === "rose"
                        ? "text-rose-600"
                        : "text-slate-400"
                }`}
              >
                {formatScore(team.evaluation.average_percentage)}
              </p>
            </div>
            <span
              className={`material-symbols-outlined text-slate-400 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </div>
        </div>

        <ProgressBar value={team.tasks.completion_percentage} showValue={false} className="mt-3" />
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
        >
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Tasks", value: team.tasks.total, tone: "text-slate-900" },
              { label: "Completed", value: team.tasks.completed, tone: "text-emerald-600" },
              { label: "Submitted", value: team.tasks.submitted, tone: "text-teal-600" },
              { label: "In Progress", value: team.tasks.in_progress, tone: "text-indigo-600" },
              { label: "Pending", value: team.tasks.pending, tone: "text-slate-600" },
              { label: "Overdue", value: team.tasks.overdue, tone: "text-rose-600" },
            ].map((item) => (
              <div key={item.label} className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                <p className="text-[10px] font-semibold text-slate-500">{item.label}</p>
                <p className={`text-base font-bold mt-0.5 ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {team.evaluation.count > 0 && (
            <div className="px-4 pb-4">
              <ProgressBar
                value={team.evaluation.average_percentage ?? 0}
                label={`Average evaluation across ${team.evaluation.count} scored learner${team.evaluation.count === 1 ? "" : "s"}`}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Range {formatScore(team.evaluation.lowest_percentage)} –{" "}
                {formatScore(team.evaluation.highest_percentage)}
              </p>
            </div>
          )}

          {team.evaluation.count === 0 && (
            <p className="px-4 pb-4 text-[11px] text-slate-400">
              No evaluations have been recorded for this team yet.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function ProgressTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState<ProgressSortKey>("completion");

  const { data, isInitialLoading, isLoading, error, reload } = useAsyncData<SuperuserProgress>(
    () => fetchSuperuserProgress({ search: search || undefined, status, sortBy }),
    [search, status, sortBy],
    { toMessage: (caught) => (caught instanceof Error ? caught.message : String(caught)) }
  );

  if (isInitialLoading) {
    return <LoadingState label="Calculating team progress…" />;
  }

  if (error) {
    return isPermissionError(error) ? (
      <UnavailableState
        icon="lock"
        title="Super Admin access required"
        message={error}
        hint="GET /api/v1/superuser/progress is restricted to the Super Admin role."
      />
    ) : (
      <ErrorState title="Could not load progress" message={error} onRetry={reload} />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No progress data"
        description="The backend returned no progress data. Refresh to try again."
      />
    );
  }

  const needsAttention = data.teams.filter((team) => attentionLevel(team) !== "good" && attentionLevel(team) !== "idle");

  // The ranking below narrows to the filter, but the headline counters are
  // platform-wide roll-ups. Say so, rather than letting a filtered view appear
  // to contradict the totals.
  const isFiltered = search.trim().length > 0 || status !== "all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="monitoring"
        title="Progress"
        description="Task completion and evaluation scores rolled up from every batch"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search teams or leads…"
              className="w-full sm:w-56"
            />
            <Select
              ariaLabel="Filter teams by status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active only" },
              ]}
            />
            <Select
              ariaLabel="Sort teams"
              value={sortBy}
              onChange={(value) => setSortBy(value as ProgressSortKey)}
              options={SORT_OPTIONS}
            />
            {isLoading && (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        }
      />

      {isFiltered && (
        <p className="text-[11px] text-slate-500 -mt-2">
          Showing <span className="font-semibold text-slate-700">{data.teams.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{data.overall.teams}</span> teams. The
          counters below stay platform-wide so the totals never shift with the filter.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Teams Tracked"
          value={data.overall.teams}
          hint={`${data.overall.active_teams} running`}
          icon="groups"
          tone="primary"
        />
        <StatCard
          label="Learners"
          value={data.overall.learners}
          hint={
            data.overall.unassigned_learners > 0
              ? `${data.overall.unassigned_learners} unassigned`
              : "All in a team"
          }
          hintTone={data.overall.unassigned_learners > 0 ? "warning" : "positive"}
          icon="school"
          tone="teal"
        />
        <StatCard
          label="Completion"
          value={`${data.overall.completion_percentage}%`}
          hint={`${data.overall.tasks_completed} of ${data.overall.tasks}`}
          hintTone={data.overall.completion_percentage >= 50 ? "positive" : "warning"}
          icon="task_alt"
          tone="emerald"
        />
        <StatCard
          label="Avg Score"
          value={formatScore(data.overall.average_score)}
          hint={`${data.overall.evaluations} evaluations`}
          icon="grading"
          tone="violet"
        />
        <StatCard
          label="Teams At Risk"
          value={data.at_risk_teams}
          hint="Have overdue tasks"
          hintTone={data.at_risk_teams > 0 ? "critical" : "positive"}
          icon="running_with_errors"
          tone={data.at_risk_teams > 0 ? "rose" : "slate"}
        />
        <StatCard
          label="Needs Attention"
          value={data.teams_needing_attention}
          hint="Under 50% complete"
          hintTone={data.teams_needing_attention > 0 ? "warning" : "positive"}
          icon="pending_actions"
          tone={data.teams_needing_attention > 0 ? "amber" : "slate"}
        />
      </div>

      <SectionCard title="Overall completion" subtitle="Every workflow task across all batches" icon="donut_large">
        <ProgressBar value={data.overall.completion_percentage} />
        <div className="flex flex-wrap gap-2 mt-4">
          <Pill tone="emerald">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            {data.overall.tasks_completed} done
          </Pill>
          <Pill tone="slate">
            <span className="material-symbols-outlined text-[13px]">list_alt</span>
            {data.overall.tasks - data.overall.tasks_completed} outstanding
          </Pill>
          <Pill tone={data.overall.tasks_overdue > 0 ? "rose" : "slate"}>
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            {data.overall.tasks_overdue} overdue
          </Pill>
        </div>
      </SectionCard>

      {data.teams.length === 0 ? (
        <EmptyState
          icon="monitoring"
          title="No teams to report on"
          description="Progress is derived from batches, workflows and their tasks. Create a batch and assign workflows to see it here."
        />
      ) : (
        <div className="space-y-3">
          {needsAttention.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <span className="material-symbols-outlined text-base text-amber-600">warning</span>
              <p className="text-amber-900">
                <strong className="font-bold">{needsAttention.length}</strong> team
                {needsAttention.length === 1 ? "" : "s"} need attention:{" "}
                {needsAttention.map((team) => team.name).join(", ")}.
              </p>
            </div>
          )}

          {data.teams.map((team) => (
            <TeamProgressRow key={team.id} team={team} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

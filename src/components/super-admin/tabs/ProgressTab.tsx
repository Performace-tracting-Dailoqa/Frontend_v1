"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  fetchSuperuserProgress,
  fetchSuperuserProgressTrend,
  isPermissionError,
  ProgressSortKey,
  SuperuserProgress,
  SuperuserProgressTrend,
  TeamRecord,
  TrendBatch,
} from "@/services/insightsService";
import TrendChart, { trendSeriesColor } from "../TrendChart";
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

/**
 * Trend window choices, all inside the 7-365 range the endpoint accepts.
 *
 * 30 days is the default: long enough for a trend to be a trend, short enough
 * that individual evaluation days are still identifiable.
 */
const TREND_WINDOW_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
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

/**
 * Multi-select for the trend chart's batch lines.
 *
 * Each chip is a toggle carrying the same colour swatch the line it controls is
 * drawn in, so the mapping is obvious at a glance.
 *
 * An empty selection means "every batch" -- the same thing the API means by an
 * omitted filter, and why the chips read as all-on in that state. That alias is
 * also why the last remaining chip cannot be switched off: with nothing left to
 * plot there would be no chart, and no way back from an empty selection. So the
 * final chip is disabled rather than silently reinterpreting itself as "all".
 */
function BatchFilter({
  batches,
  selected,
  onToggle,
  onShowAll,
}: {
  batches: TrendBatch[];
  selected: string[];
  onToggle: (batchId: string) => void;
  onShowAll: () => void;
}) {
  const everyBatchShown = selected.length === 0;
  const lastOneShown = everyBatchShown ? null : selected.length === 1 ? selected[0] : null;
  const shownCount = everyBatchShown ? batches.length : selected.length;

  if (batches.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Batches</span>

      {batches.map((batch) => {
        const on = everyBatchShown || selected.includes(batch.batch_id);
        const locked = on && batch.batch_id === lastOneShown;
        return (
          <button
            key={batch.batch_id}
            type="button"
            aria-pressed={on}
            disabled={locked}
            onClick={() => onToggle(batch.batch_id)}
            title={locked ? "The chart always keeps at least one batch" : undefined}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
              locked
                ? "cursor-not-allowed border-primary/30 bg-primary/5 text-slate-900 opacity-60"
                : on
                  ? "cursor-pointer border-primary/30 bg-primary/5 text-slate-900 hover:bg-primary/10"
                  : "cursor-pointer border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: trendSeriesColor(batch.series_index),
                opacity: on ? 1 : 0.3,
              }}
            />
            {batch.batch_name}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onShowAll}
        disabled={everyBatchShown}
        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
      >
        Show all
      </button>

      <span className="ml-auto text-[11px] text-slate-400">
        {shownCount} of {batches.length} plotted
      </span>
    </div>
  );
}

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

  // The trend is fetched on its own, with its own request. Sharing the roll-up's
  // request would redraw the chart on every keystroke of the search box above,
  // which has nothing to do with the chart's window or batch selection.
  const [trendWindow, setTrendWindow] = useState(30);
  // Empty means "every batch". `toggleTrendBatch` keeps this in catalogue order,
  // so the joined string below is a faithful key for the request: two selections
  // holding the same batches always produce the same key, and therefore the same
  // request, no matter which order the user arrived at them in.
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const selectedBatchKey = selectedBatches.join(",");

  const {
    data: trend,
    isLoading: trendLoading,
    isInitialLoading: trendInitialLoading,
    error: trendError,
    reload: reloadTrend,
  } = useAsyncData<SuperuserProgressTrend>(
    () => fetchSuperuserProgressTrend({ days: trendWindow, batchIds: selectedBatches }),
    [trendWindow, selectedBatchKey],
    { toMessage: (caught) => (caught instanceof Error ? caught.message : String(caught)) }
  );

  /**
   * Adds or removes one batch from the plotted set.
   *
   * Operates on the *effective* set, so a toggle behaves the same whether the
   * selection is empty (all batches) or explicit. Two canonicalisations keep the
   * state a proper set rather than one state per ordering: selecting everything
   * collapses to the empty selection, which means the same thing to the server,
   * and the result is stored in catalogue order so toggling a batch off and back
   * on does not refetch a chart identical to the one already on screen.
   */
  const toggleTrendBatch = (batchId: string) => {
    const everyId = (trend?.batches ?? []).map((batch) => batch.batch_id);
    const current = selectedBatches.length > 0 ? selectedBatches : everyId;
    const next = current.includes(batchId)
      ? current.filter((id) => id !== batchId)
      : [...current, batchId];

    // The chart has to have a line to draw; the last chip is disabled for this.
    if (next.length === 0) return;

    // Filtering by the catalogue also drops any id that no longer exists.
    const ordered = everyId.filter((id) => next.includes(id));
    setSelectedBatches(ordered.length === everyId.length ? [] : ordered);
  };

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

      <SectionCard
        title="Daily average progress"
        subtitle="Mean evaluation score per day, one line per batch. A break in a line is a day with no evaluations, not a score of zero."
        icon="show_chart"
        action={
          <div className="flex items-center gap-2">
            {trendLoading && !trendInitialLoading && (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            <Select
              ariaLabel="Trend time window"
              value={String(trendWindow)}
              onChange={(value) => setTrendWindow(Number(value))}
              options={TREND_WINDOW_OPTIONS}
            />
          </div>
        }
      >
        {trendInitialLoading ? (
          <LoadingState label="Loading the daily trend…" compact />
        ) : trendError ? (
          <ErrorState
            title="Could not load the daily trend"
            message={trendError}
            onRetry={reloadTrend}
          />
        ) : !trend ? null : (
          <>
            <BatchFilter
              batches={trend.batches}
              selected={selectedBatches}
              onToggle={toggleTrendBatch}
              onShowAll={() => setSelectedBatches([])}
            />
            <div className="mt-4">
              <TrendChart series={trend.series} average={trend.average} />
            </div>
          </>
        )}
      </SectionCard>

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

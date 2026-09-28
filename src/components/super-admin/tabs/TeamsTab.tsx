"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  fetchSuperuserTeams,
  isPermissionError,
  SuperuserTeamList,
  TeamRecord,
} from "@/services/insightsService";
import {
  fetchAllBatchLearners,
  BatchLearner,
} from "@/services/batchService";
import { shortDate } from "@/utils/date";
import {
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Pill,
  PrimaryButton,
  ProgressBar,
  SearchInput,
  SectionCard,
  Select,
  StatCard,
  UnavailableState,
} from "../SuperAdminUi";
import BatchDetailPage from "../BatchDetailPage";

interface TeamsTabProps {
  onOpenAddPerson: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

/**
 * The status of a learner, as a tone for the list.
 *
 * `is_active` is the account flag and is the one that decides: a suspended
 * account shows as inactive even if the profile's own `status` column still says
 * "active", which is the common case after a deactivation.
 */
function learnerTone(learner: BatchLearner): "emerald" | "rose" | "slate" {
  if (!learner.is_active) return "rose";
  if (learner.status && learner.status.toLowerCase() !== "active") return "slate";
  return "emerald";
}

function learnerStatusLabel(learner: BatchLearner): string {
  if (!learner.is_active) return "Deactivated";
  return learner.status ?? "Active";
}

/** Learners per page inside a batch. Matches the People directory's page size. */
const LEARNER_PAGE_SIZE = 10;

/** Page numbers to render, pinning the first and last page either side of current. */
function paginationItems(current: number, total: number, span = 1): Array<number | "gap"> {
  if (total <= 1) return total === 1 ? [1] : [];
  const wanted = new Set<number>([1, total]);
  for (let offset = 1; offset <= span; offset += 1) {
    if (current - offset >= 1) wanted.add(current - offset);
    if (current + offset <= total) wanted.add(current + offset);
  }
  const pages = [...wanted].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) out.push("gap");
    out.push(page);
    previous = page;
  }
  return out;
}

/**
 * The batch's roster: every intern enrolled in it, as its own page.
 *
 * Fetched from the student's own endpoint rather than derived from the team list,
 * because the roll-up the Teams page reads only carries a headcount. Dates are
 * formatted by hand for the same reason as the trend chart: `toLocaleDateString`
 * resolves differently in Node and the browser, which shows up as a hydration
 * mismatch.
 */
function BatchLearnersPage({ team, onBack }: { team: TeamRecord; onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isInitialLoading, isLoading, error, reload } = useAsyncData<BatchLearner[]>(
    () => fetchAllBatchLearners(team.id),
    [team.id],
    { toMessage: (caught) => (caught instanceof Error ? caught.message : String(caught)) }
  );

  // The whole roster is fetched once, then filtered and paged on the client. A
  // batch holds tens of interns, not thousands, and this keeps typing in the
  // search box from refetching on every keystroke.
  const all = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((learner) =>
      [learner.name, learner.email, learner.enrollment_no, learner.department]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .some((value) => value.toLowerCase().includes(needle))
    );
  }, [all, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LEARNER_PAGE_SIZE));
  // Clamped rather than trusted: narrowing the search can leave the current page
  // past the end, and a blank table would look like data loss.
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * LEARNER_PAGE_SIZE, current * LEARNER_PAGE_SIZE);
  const firstShown = filtered.length === 0 ? 0 : (current - 1) * LEARNER_PAGE_SIZE + 1;
  const lastShown = Math.min(current * LEARNER_PAGE_SIZE, filtered.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="arrow_back"
        title={team.name}
        description={`Every intern enrolled in this batch${
          team.department ? ` · ${team.department}` : ""
        }`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search interns…"
              className="w-full sm:w-56"
            />
            <button
              type="button"
              onClick={onBack}
              className="h-10 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base text-slate-500">arrow_back</span>
              <span>Back to teams</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Interns"
          value={all.length}
          hint={search.trim() ? `${filtered.length} matching` : "Enrolled in this batch"}
          icon="school"
          tone="teal"
        />
        <StatCard
          label="Active"
          value={all.filter((learner) => learner.is_active).length}
          hint={`${all.length - all.filter((learner) => learner.is_active).length} deactivated`}
          hintTone={all.some((learner) => !learner.is_active) ? "warning" : "positive"}
          icon="person_check"
          tone="emerald"
        />
        <StatCard
          label="Workflows"
          value={team.workflow_count}
          icon="account_tree"
          tone="indigo"
        />
        <StatCard
          label="Completion"
          value={`${team.tasks.completion_percentage}%`}
          hint={`${team.tasks.completed} of ${team.tasks.total} tasks`}
          icon="task_alt"
          tone="violet"
        />
      </div>

      {isInitialLoading ? (
        <LoadingState label={`Loading the ${team.name} roster…`} />
      ) : error ? (
        isPermissionError(error) ? (
          <UnavailableState
            icon="lock"
            title="Super Admin access required"
            message={error}
            hint="GET /api/v1/students is restricted to the Super Admin role."
          />
        ) : (
          <ErrorState title="Could not load the roster" message={error} onRetry={reload} />
        )
      ) : all.length === 0 ? (
        <EmptyState
          icon="school"
          title="No interns in this batch yet"
          description="This batch has no learners assigned. Add a person and place them in this batch to see them listed here."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="No interns match that search"
          description={`No one in ${team.name} matches "${search.trim()}". Try a different name, email or enrollment number.`}
        />
      ) : (
        <SectionCard
          title="Interns"
          subtitle="Everyone enrolled in this batch"
          icon="groups"
          action={
            isLoading ? (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : undefined
          }
        >
          <div className="space-y-2">
            {visible.map((learner) => (
              <div
                key={learner.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200/80"
              >
                {learner.name ? (
                  <Avatar name={learner.name} size="sm" />
                ) : (
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base">person_off</span>
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {learner.name ?? "Unnamed intern"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {learner.email ?? "No email"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {learner.enrollment_no && <Pill tone="slate">{learner.enrollment_no}</Pill>}
                  {learner.department && <Pill tone="slate">{learner.department}</Pill>}
                  {learner.joining_date && (
                    <Pill tone="slate">Joined {shortDate(learner.joining_date)}</Pill>
                  )}
                  <Pill tone={learnerTone(learner)}>{learnerStatusLabel(learner)}</Pill>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="text-[11px] text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {firstShown}–{lastShown}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{filtered.length}</span>
              </p>

              <nav className="flex items-center gap-1" aria-label="Roster pages">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={current === 1}
                  aria-label="Previous page"
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Prev
                </button>

                {paginationItems(current, totalPages).map((item, index) =>
                  item === "gap" ? (
                    <span key={`gap-${index}`} className="px-1 text-xs text-slate-300">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      aria-current={item === current ? "page" : undefined}
                      className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-semibold transition-colors ${
                        item === current
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={current === totalPages}
                  aria-label="Next page"
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </SectionCard>
      )}
    </motion.div>
  );
}

function formatScore(value: number | null): string {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "—";
}

function teamStatusTone(team: TeamRecord): "emerald" | "slate" | "amber" {
  if (team.is_active) return "emerald";
  if (team.has_finished) return "slate";
  return "amber";
}

function teamStatusLabel(team: TeamRecord): string {
  if (team.is_active) return "Active";
  if (team.has_finished) return "Completed";
  return team.status ?? "Scheduled";
}

/** Left/right rail layout: the team list with a detail panel for the selection. */
function TeamsTabContent({
  data,
  onOpenAddPerson,
  onOpenBatchDetail,
}: {
  data: SuperuserTeamList;
  onOpenAddPerson: () => void;
  onOpenBatchDetail: (team: TeamRecord) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(data.items[0]?.id ?? null);

  const selected =
    data.items.find((team) => team.id === selectedId) ?? data.items[0] ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-3">
        {data.items.length === 0 ? (
          <EmptyState
            icon="groups"
            title="No teams match your filters"
            description="Adjust the search or status filter, or create the first batch from the Teams module."
          />
        ) : (
          data.items.map((team) => {
            const isSelected = team.id === selected?.id;
            return (
              <motion.button
                key={team.id}
                type="button"
                onClick={() => setSelectedId(team.id)}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`w-full text-left bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                  isSelected
                    ? "border-[#4B2EF5] ring-2 ring-[#4B2EF5]/15"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBatchDetail(team);
                        }}
                        className="text-sm font-bold text-slate-900 hover:text-[#4B2EF5] hover:underline cursor-pointer"
                        title="Click to open batch workflows, tasks and students"
                      >
                        {team.name}
                      </span>
                      <Pill tone={teamStatusTone(team)}>{teamStatusLabel(team)}</Pill>
                      {team.tasks.overdue > 0 && (
                        <Pill tone="rose">
                          <span className="material-symbols-outlined text-[13px]">running_with_errors</span>
                          {team.tasks.overdue} overdue
                        </Pill>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {team.department ?? "No department"} · {formatDate(team.start_date)} →{" "}
                      {formatDate(team.end_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-slate-900 font-mono">
                      {team.tasks.completion_percentage}%
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">completion</p>
                  </div>
                </div>

                <ProgressBar value={team.tasks.completion_percentage} showValue={false} className="mt-3" />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    {team.student_count} learner{team.student_count === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">account_tree</span>
                    {team.workflow_count} workflow{team.workflow_count === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">grading</span>
                    avg {formatScore(team.evaluation.average_percentage)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">badge</span>
                    {team.manager?.name ?? "No manager"}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBatchDetail(team);
                    }}
                    className="ml-auto text-[11px] font-bold text-[#4B2EF5] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Workflows & tasks</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 lg:sticky lg:top-4"
            >
              <SectionCard title={selected.name} subtitle={selected.department ?? "No department"} icon="groups">
                <div className="space-y-4">
                  {/* The drill-down entry point to open Batch Hub */}
                  <button
                    type="button"
                    onClick={() => onOpenBatchDetail(selected)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 hover:border-[#4B2EF5]/40 text-left transition-colors cursor-pointer group shadow-2xs"
                  >
                    <span className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-[#4B2EF5] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#4B2EF5] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">account_tree</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-[#4B2EF5] transition-colors">
                        Open {selected.name} Batch Hub
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Workflows ({selected.workflow_count}) · Tasks ({selected.tasks.total}) · Students ({selected.student_count})
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-[#4B2EF5] group-hover:translate-x-0.5 transition-all shrink-0">
                      arrow_forward
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      label="Learners"
                      value={selected.student_count}
                      icon="school"
                      tone="teal"
                    />
                    <StatCard
                      label="Workflows"
                      value={selected.workflow_count}
                      icon="account_tree"
                      tone="indigo"
                    />
                  </div>

                  <ProgressBar
                    value={selected.tasks.completion_percentage}
                    label="Task completion"
                  />

                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Task breakdown
                    </p>
                    <ul className="space-y-1.5 text-xs">
                      {[
                        { label: "Completed", value: selected.tasks.completed, tone: "text-emerald-600" },
                        { label: "Submitted", value: selected.tasks.submitted, tone: "text-teal-600" },
                        { label: "In progress", value: selected.tasks.in_progress, tone: "text-indigo-600" },
                        { label: "Pending", value: selected.tasks.pending, tone: "text-slate-600" },
                        { label: "Overdue", value: selected.tasks.overdue, tone: "text-rose-600" },
                      ].map((row) => (
                        <li
                          key={row.label}
                          className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                        >
                          <span className="text-slate-600">{row.label}</span>
                          <span className={`font-bold font-mono ${row.tone}`}>{row.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Evaluations
                    </p>
                    <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scored</span>
                        <span className="font-bold text-slate-800">{selected.evaluation.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Average</span>
                        <span className="font-bold text-slate-800">
                          {formatScore(selected.evaluation.average_percentage)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Range</span>
                        <span className="font-bold text-slate-800">
                          {formatScore(selected.evaluation.lowest_percentage)} –{" "}
                          {formatScore(selected.evaluation.highest_percentage)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Team leads
                    </p>
                    <div className="space-y-2">
                      {[
                        { role: "Manager", person: selected.manager },
                        { role: "Teacher", person: selected.teacher },
                      ].map(({ role, person }) => (
                        <div
                          key={role}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80"
                        >
                          {person?.name ? (
                            <Avatar name={person.name} size="sm" />
                          ) : (
                            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-base">person_off</span>
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{role}</p>
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {person?.name ?? "Unassigned"}
                            </p>
                            {person?.email && (
                              <p className="text-[11px] text-slate-400 font-mono truncate">{person.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500 mb-2">
                      Teams are created from the batch module. To staff a team, add the people first.
                    </p>
                    <PrimaryButton onClick={onOpenAddPerson} icon="person_add" className="w-full justify-center">
                      Add a team member
                    </PrimaryButton>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon="groups"
                title="Select a team"
                description="Choose a team on the left to see its leads, task breakdown and evaluation scores."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TeamsTab({ onOpenAddPerson }: TeamsTabProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  /**
   * The batch whose full detail view (workflows, tasks, evaluations, students) is open.
   */
  const [detailBatch, setDetailBatch] = useState<TeamRecord | null>(null);

  // 100 is the endpoint's hard cap — ask for the most the API will return so the
  // list is only ever short when a filter is genuinely hiding teams.
  const { data, isInitialLoading, isLoading, error, reload } = useAsyncData<SuperuserTeamList>(
    () => fetchSuperuserTeams({ search: search || undefined, status, pageSize: 100 }),
    [search, status],
    { toMessage: (caught) => (caught instanceof Error ? caught.message : String(caught)) }
  );

  const isFiltered = search.trim().length > 0 || status !== "all";

  /**
   * When a batch is selected, render the dedicated BatchDetailPage which shows
   * workflows, workflow tasks, evaluation metrics, and enrolled students.
   */
  if (detailBatch) {
    return (
      <BatchDetailPage
        team={detailBatch}
        onBack={() => setDetailBatch(null)}
        onOpenAddPerson={onOpenAddPerson}
      />
    );
  }

  const body = () => {
    if (isInitialLoading) return <LoadingState label="Loading teams…" />;
    if (error) {
      return isPermissionError(error) ? (
        <UnavailableState
          icon="lock"
          title="Super Admin access required"
          message={error}
          hint="GET /api/v1/superuser/teams is restricted to the Super Admin role."
        />
      ) : (
        <ErrorState title="Could not load teams" message={error} onRetry={reload} />
      );
    }
    if (!data) {
      return <EmptyState title="No team data" description="The backend returned no data. Refresh to retry." />;
    }
    return (
      <TeamsTabContent
        data={data}
        onOpenAddPerson={onOpenAddPerson}
        onOpenBatchDetail={setDetailBatch}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="groups"
        title="Teams"
        description="Every batch with its manager, teacher, headcount, task progress and evaluation scores"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search teams, departments, leads…"
              className="w-full sm:w-64"
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
            {isLoading && (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        }
      />

      {data && (
        <>
          <p className="text-[11px] text-slate-500 -mt-2">
            Showing{" "}
            <span className="font-semibold text-slate-700">{data.items.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{data.total}</span> team
            {data.total === 1 ? "" : "s"}
            {isFiltered && " matching your filters"} — the counters below stay platform-wide.
            {data.total > data.items.length && " Narrow the search to see the rest."}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Teams" value={data.totals.teams} icon="groups" tone="primary" />
            <StatCard label="Active" value={data.totals.active_teams} icon="play_circle" tone="emerald" />
            <StatCard label="Learners" value={data.totals.learners} icon="school" tone="teal" />
            <StatCard
              label="Completion"
              value={`${data.totals.completion_percentage}%`}
              icon="task_alt"
              tone="indigo"
            />
            <StatCard
              label="Overdue"
              value={data.totals.tasks_overdue}
              icon="running_with_errors"
              tone={data.totals.tasks_overdue > 0 ? "rose" : "slate"}
            />
            <StatCard
              label="Avg Score"
              value={formatScore(data.totals.average_score)}
              icon="grading"
              tone="violet"
            />
          </div>
        </>
      )}

      {body()}
    </motion.div>
  );
}

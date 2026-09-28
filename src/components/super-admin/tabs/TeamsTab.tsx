"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  fetchSuperuserTeams,
  isPermissionError,
  SuperuserTeamList,
  TeamRecord,
} from "@/services/insightsService";
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

interface TeamsTabProps {
  onOpenAddPerson: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
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
function TeamsTabContent({ data, onOpenAddPerson }: { data: SuperuserTeamList; onOpenAddPerson: () => void }) {
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
                      <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
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

  // 100 is the endpoint's hard cap — ask for the most the API will return so the
  // list is only ever short when a filter is genuinely hiding teams.
  const { data, isInitialLoading, isLoading, error, reload } = useAsyncData<SuperuserTeamList>(
    () => fetchSuperuserTeams({ search: search || undefined, status, pageSize: 100 }),
    [search, status],
    { toMessage: (caught) => (caught instanceof Error ? caught.message : String(caught)) }
  );

  const isFiltered = search.trim().length > 0 || status !== "all";

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
    return <TeamsTabContent data={data} onOpenAddPerson={onOpenAddPerson} />;
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

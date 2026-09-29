"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  deactivateBackendUser,
  DirectoryPerson,
  DirectoryRole,
  fetchDirectory,
  fetchStudentReport,
  setPersonActive,
  StudentReportData,
} from "@/services/adminService";
import {
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Pill,
  PrimaryButton,
  SearchInput,
  SectionCard,
  Select,
  StatCard,
  StatusDot,
} from "../SuperAdminUi";
import InternEvaluationTrendChart from "../InternEvaluationTrendChart";

interface PeopleTabProps {
  /**
   * Opens the Add Person flow. Optional because this directory is shared with the
   * HR dashboard, which has no provisioning page of its own — when it is omitted
   * the "Add Person" actions are hidden rather than linked to a route that would
   * bounce the user out of their dashboard.
   */
  onOpenAddPerson?: () => void;

  /**
   * Reports the directory after every load, so an embedding page (the HR
   * dashboard's headcount card) can share this fetch instead of issuing a second
   * identical request just to derive a number.
   */
  onDirectoryLoaded?: (people: DirectoryPerson[]) => void;
}

/** Display metadata for the four role buckets the People page groups by. */
const ROLE_META: Record<DirectoryRole, { label: string; plural: string; icon: string; pill: "violet" | "amber" | "teal" | "indigo" }> = {
  "HR Manager": { label: "HR", plural: "HR", icon: "manage_accounts", pill: "violet" },
  Manager: { label: "Manager", plural: "Managers", icon: "badge", pill: "amber" },
  Teacher: { label: "Teacher", plural: "Teachers", icon: "history_edu", pill: "teal" },
  Intern: { label: "Intern", plural: "Interns", icon: "school", pill: "indigo" },
};

const ROLE_ORDER: DirectoryRole[] = ["HR Manager", "Manager", "Teacher", "Intern"];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
}

function getTaskStatusPill(
  status: string,
  dueDate: string | null | undefined
): { label: string; tone: "emerald" | "amber" | "slate" | "rose" } {
  const s = (status || "").toLowerCase();
  const isOverdue =
    Boolean(dueDate) &&
    new Date(dueDate!).getTime() < Date.now() &&
    s !== "completed" &&
    s !== "done" &&
    s !== "evaluated";
  if (isOverdue) return { label: "Overdue", tone: "rose" };
  if (s === "completed" || s === "done" || s === "evaluated") return { label: "Completed", tone: "emerald" };
  if (s === "in_progress" || s === "submitted" || s === "review" || s === "under_review") {
    return { label: "In Progress", tone: "amber" };
  }
  return { label: "Pending", tone: "slate" };
}

function getPriorityBadge(priority: string | null | undefined) {
  const p = (priority || "medium").toLowerCase();
  if (p === "high") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        High
      </span>
    );
  }
  if (p === "low") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        Low
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      Medium
    </span>
  );
}

/**
 * Case-insensitive search across every field a superuser would search by:
 * name, email, department, specialization and enrollment number.
 */
function matchesSearch(person: DirectoryPerson, needle: string): boolean {
  if (!needle) return true;
  return [person.name, person.email, person.department, person.specialization, person.enrollmentNo]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .some((value) => value.toLowerCase().includes(needle));
}

/** Directory rows rendered per page. */
const PAGE_SIZE = 10;

/**
 * Page numbers to render, with `null` standing in for an ellipsis.
 *
 * The first and last page are always shown, plus `span` neighbours on each side
 * of the current one. Pinning both ends keeps the control the same width as you
 * page through a long directory, instead of the buttons reflowing every click.
 */
function paginationItems(current: number, total: number, span = 1): Array<number | null> {
  if (total <= 0) return [];
  if (total === 1) return [1];

  const wanted = new Set<number>([1, total, current]);
  for (let offset = 1; offset <= span; offset += 1) {
    if (current - offset >= 1) wanted.add(current - offset);
    if (current + offset <= total) wanted.add(current + offset);
  }

  const pages = [...wanted].sort((a, b) => a - b);
  const items: Array<number | null> = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) items.push(null);
    items.push(page);
    previous = page;
  }
  return items;
}

export default function PeopleTab({ onOpenAddPerson, onDirectoryLoaded }: PeopleTabProps) {
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [failedRoles, setFailedRoles] = useState<DirectoryRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DirectoryPerson | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Student Individual Report state
  const [studentReport, setStudentReport] = useState<StudentReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "tasks" | "evaluations" | "profile">("overview");

  const loadStudentReport = React.useCallback(async (profileId: string) => {
    setIsReportLoading(true);
    setReportError(null);
    try {
      const data = await fetchStudentReport(profileId);
      setStudentReport(data);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Failed to load individual intern report.");
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selected && selected.role === "Intern") {
      setDrawerTab("overview");
      void loadStudentReport(selected.profileId);
    } else {
      setStudentReport(null);
      setIsReportLoading(false);
      setReportError(null);
    }
  }, [selected, loadStudentReport]);

  // `load` is memoised with no dependencies, so the notify callback is held in a
  // ref. That lets a parent pass a fresh inline function every render without
  // re-running the initial fetch.
  const notifyRef = React.useRef(onDirectoryLoaded);
  notifyRef.current = onDirectoryLoaded;

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { people: loaded, failedRoles: failed } = await fetchDirectory();
      setPeople(loaded);
      setFailedRoles(failed);
      notifyRef.current?.(loaded);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the people directory.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return people.filter((person) => {
      if (!matchesSearch(person, needle)) return false;
      if (roleFilter !== "all" && person.role !== roleFilter) return false;
      if (statusFilter === "active" && !person.isActive) return false;
      if (statusFilter === "inactive" && person.isActive) return false;
      return true;
    });
  }, [people, search, roleFilter, statusFilter]);

  // Changing what is being looked at invalidates the page number: a reader on
  // page 7 who narrows the search should see the top of the new results, not an
  // empty page 7 with no obvious way back.
  //
  // Done while rendering rather than in an effect, per React's "adjust state when
  // a prop changes" guidance — the page is derived from these filters, so it is
  // corrected in the same render that changes them, with no second pass. The key
  // is compared rather than the three values watched separately so a filter that
  // happens to keep the same page count still resets.
  const filterKey = `${search}\u0000${roleFilter}\u0000${statusFilter}`;
  const [pageForFilters, setPageForFilters] = useState(filterKey);
  if (pageForFilters !== filterKey) {
    setPageForFilters(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Clamp rather than trust `page`. Deactivating or refreshing a person can
  // shrink the directory under the reader's feet, and an out-of-range page would
  // otherwise render as a blank table that looks like a failed load.
  const currentPage = Math.min(page, totalPages);

  const visible = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const firstRow = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const pageItems = paginationItems(currentPage, totalPages);

  const counts = useMemo(() => {
    const base: Record<DirectoryRole, number> = {
      "HR Manager": 0,
      Manager: 0,
      Teacher: 0,
      Intern: 0,
    };
    for (const person of people) base[person.role] += 1;
    return base;
  }, [people]);

  const activeCount = useMemo(() => people.filter((person) => person.isActive).length, [people]);

  const runAction = async (person: DirectoryPerson, action: () => Promise<void>) => {
    setPendingId(person.profileId);
    setActionError(null);
    try {
      await action();
      // Re-read rather than patching local state, so the drawer and the table
      // both reflect exactly what the database now holds.
      const { people: fresh, failedRoles: failed } = await fetchDirectory();
      setPeople(fresh);
      setFailedRoles(failed);
      notifyRef.current?.(fresh);
      setSelected((current) => {
        if (!current || current.profileId !== person.profileId) return current;
        return fresh.find((entry) => entry.profileId === person.profileId) ?? current;
      });
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The action could not be completed.");
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleActive = (person: DirectoryPerson) => {
    const nextActive = !person.isActive;
    void runAction(person, async () => {
      await setPersonActive(person, nextActive);
    });
  };

  const handleDeactivate = (person: DirectoryPerson) => {
    if (
      !window.confirm(
        `Deactivate ${person.name}? Their account stays in the database but can no longer sign in.`
      )
    ) {
      return;
    }
    void runAction(person, async () => {
      await deactivateBackendUser(person);
    });
  };

  // The drawer is modal, so Escape should close it. Registered only while it is
  // open so it cannot shadow keyboard shortcuts elsewhere on the page.
  React.useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="group"
        title="People"
        description="Every HR officer, manager, teacher and intern provisioned in the PMS"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, department, ID…"
              className="w-full sm:w-72"
            />
            <Select
              ariaLabel="Filter by role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "all", label: "All Roles" },
                ...ROLE_ORDER.map((role) => ({ value: role, label: ROLE_META[role].plural })),
              ]}
            />
            <Select
              ariaLabel="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Deactivated" },
              ]}
            />
            {onOpenAddPerson && (
              <PrimaryButton onClick={onOpenAddPerson} icon="person_add">
                Add Person
              </PrimaryButton>
            )}
          </div>
        }
      />

      {/* COUNTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total People"
          value={people.length}
          hint={`${activeCount} active`}
          icon="groups"
          tone="primary"
        />
        {ROLE_ORDER.map((role) => (
          <StatCard
            key={role}
            label={ROLE_META[role].plural}
            value={counts[role]}
            hint={failedRoles.includes(role) ? "Failed to load" : "In directory"}
            hintTone={failedRoles.includes(role) ? "critical" : "neutral"}
            icon={ROLE_META[role].icon}
            tone={ROLE_META[role].pill}
            onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
          />
        ))}
        <StatCard
          label="Deactivated"
          value={people.length - activeCount}
          hint={people.length - activeCount > 0 ? "Cannot sign in" : "None"}
          hintTone={people.length - activeCount > 0 ? "warning" : "positive"}
          icon="block"
          tone={people.length - activeCount > 0 ? "rose" : "slate"}
        />
      </div>

      {failedRoles.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
          <span className="material-symbols-outlined text-base text-amber-600">warning</span>
          <p className="text-amber-900">
            These directories could not be loaded, so their counts are incomplete:{" "}
            <strong className="font-bold">{failedRoles.map((role) => ROLE_META[role].plural).join(", ")}</strong>.
          </p>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-2.5 p-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
          <span className="material-symbols-outlined text-base text-rose-600">error</span>
          <p className="text-rose-800">{actionError}</p>
        </div>
      )}

      {/* DIRECTORY TABLE */}
      <SectionCard
        title="Directory"
        subtitle={`${filtered.length} of ${people.length} people`}
        icon="table_rows"
        action={
          isLoading ? (
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <button
              type="button"
              onClick={load}
              className="text-xs font-bold text-[#4B2EF5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Refresh</span>
            </button>
          )
        }
      >
        {isLoading ? (
          <LoadingState label="Syncing identities from the database…" />
        ) : error ? (
          <ErrorState title="Could not load people" message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="person_search"
            title="No people match your filters"
            description={
              people.length === 0
                ? "No accounts have been provisioned yet. Use Add Person to create the first one."
                : "Try a different search term, role or status."
            }
            action={
              people.length === 0 && onOpenAddPerson ? (
                <PrimaryButton onClick={onOpenAddPerson} icon="person_add">
                  Add Person
                </PrimaryButton>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left text-xs min-w-[840px]">
                <thead>
                  <tr className="bg-slate-50/80 border-y border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5 font-semibold">Person</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Identifier</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((person) => {
                    const isPending = pendingId === person.profileId;
                    const identifier = person.enrollmentNo ?? person.specialization;

                    return (
                      <tr key={`${person.role}-${person.profileId}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-5">
                          <button
                            type="button"
                            onClick={() => setSelected(person)}
                            className="flex items-center gap-3 text-left cursor-pointer"
                          >
                            <Avatar name={person.name} />
                            <span className="min-w-0">
                              <span className="font-bold text-slate-900 hover:text-primary transition-colors block truncate">
                                {person.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 block truncate">
                                {person.email}
                              </span>
                            </span>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <Pill tone={ROLE_META[person.role].pill}>{ROLE_META[person.role].label}</Pill>
                        </td>

                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {person.department ?? <span className="text-slate-300">—</span>}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {identifier ?? <span className="text-slate-300 font-sans">—</span>}
                        </td>

                        <td className="py-3 px-4">
                          <StatusDot isActive={person.isActive} />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(person)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  {person.isActive ? "Suspend" : "Activate"}
                                </button>
                                {person.isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeactivate(person)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    Deactivate
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-semibold text-slate-500">
                  Showing{" "}
                  <span className="text-slate-800">
                    {`${firstRow}–${lastRow}`}
                  </span>{" "}
                  of {filtered.length}
                </p>

                <nav aria-label="Directory pages" className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>

                  {pageItems.map((item, index) =>
                    item === null ? (
                      <span
                        key={`gap-${index}`}
                        aria-hidden="true"
                        className="px-1 text-[11px] font-bold text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        aria-current={item === currentPage ? "page" : undefined}
                        className={`h-8 min-w-8 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          item === currentPage
                            ? "bg-[#4B2EF5] text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* PROFILE & REPORT DRAWER */}
      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
            onClick={() => setSelected(null)}
            role="presentation"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Record for ${selected.name}`}
              className={`w-full ${
                selected.role === "Intern" ? "max-w-2xl" : "max-w-md"
              } bg-white h-full shadow-2xl flex flex-col`}
            >
              {/* Drawer Top Sticky Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/90 backdrop-blur-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {selected.role === "Intern" ? "Intern Performance & Record" : "Person Record"}
                  </span>
                  {selected.role === "Intern" && studentReport?.batch_name && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4B2EF5]/10 text-[#4B2EF5]">
                      {studentReport.batch_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {selected.role === "Intern" && (
                    <button
                      type="button"
                      onClick={() => void loadStudentReport(selected.profileId)}
                      disabled={isReportLoading}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Refresh report"
                    >
                      <span className={`material-symbols-outlined text-lg ${isReportLoading ? "animate-spin" : ""}`}>
                        refresh
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Person Basic Identity Header */}
                <div className="flex items-start gap-4">
                  <Avatar name={selected.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-slate-900 truncate">{selected.name}</h3>
                      <StatusDot isActive={selected.isActive} />
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate mt-0.5">{selected.email}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Pill tone={ROLE_META[selected.role].pill}>{ROLE_META[selected.role].label}</Pill>
                      {selected.enrollmentNo && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                          {selected.enrollmentNo}
                        </span>
                      )}
                      {selected.department && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          {selected.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selected.role === "Intern" ? (
                  <>
                    {/* KPI Quick Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Completion</span>
                          <span className="material-symbols-outlined text-sm text-emerald-600">task_alt</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 mt-1">
                          {studentReport?.summary.completion_rate ?? 0}%
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {studentReport?.summary.completed_tasks ?? 0} of {studentReport?.summary.total_tasks ?? 0} tasks
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Avg Score</span>
                          <span className="material-symbols-outlined text-sm text-[#4B2EF5]">star</span>
                        </div>
                        <p className="text-lg font-bold text-[#4B2EF5] mt-1">
                          {studentReport?.summary.average_score ?? 0}%
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {studentReport?.summary.total_evaluations ?? 0} evaluations
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">In Progress</span>
                          <span className="material-symbols-outlined text-sm text-amber-600">timelapse</span>
                        </div>
                        <p className="text-lg font-bold text-amber-600 mt-1">
                          {studentReport?.summary.in_progress_tasks ?? 0}
                        </p>
                        <p className="text-[10px] text-slate-400">active assignments</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Overdue</span>
                          <span className="material-symbols-outlined text-sm text-rose-600">warning</span>
                        </div>
                        <p className="text-lg font-bold text-rose-600 mt-1">
                          {studentReport?.summary.overdue_tasks ?? 0}
                        </p>
                        <p className="text-[10px] text-slate-400">past deadline</p>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-1">
                      {[
                        { id: "overview", label: "Overview", icon: "dashboard" },
                        { id: "tasks", label: `Tasks (${studentReport?.tasks.length ?? 0})`, icon: "assignment" },
                        { id: "evaluations", label: `Evaluations (${studentReport?.evaluations.length ?? 0})`, icon: "rate_review" },
                        { id: "profile", label: "Profile & Actions", icon: "badge" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDrawerTab(tab.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            drawerTab === tab.id
                              ? "bg-[#4B2EF5] text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    {isReportLoading ? (
                      <LoadingState label="Loading detailed intern report…" compact />
                    ) : reportError ? (
                      <ErrorState
                        title="Could not load intern report"
                        message={reportError}
                        onRetry={() => void loadStudentReport(selected.profileId)}
                      />
                    ) : (
                      <>
                        {/* TAB: OVERVIEW */}
                        {drawerTab === "overview" && (
                          <div className="space-y-5">
                            {/* Evaluation Score Trend Line Graph */}
                            <InternEvaluationTrendChart
                              evaluations={studentReport?.evaluations ?? []}
                              height={200}
                            />

                            {/* Workload Progress Card */}
                            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                  Task Completion Health
                                </h4>
                                <span className="text-xs font-bold font-mono text-[#4B2EF5]">
                                  {studentReport?.summary.completion_rate ?? 0}%
                                </span>
                              </div>
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{
                                    width: `${
                                      studentReport?.summary.total_tasks
                                        ? ((studentReport.summary.completed_tasks / studentReport.summary.total_tasks) * 100)
                                        : 0
                                    }%`,
                                  }}
                                  title="Completed"
                                />
                                <div
                                  className="h-full bg-amber-400"
                                  style={{
                                    width: `${
                                      studentReport?.summary.total_tasks
                                        ? ((studentReport.summary.in_progress_tasks / studentReport.summary.total_tasks) * 100)
                                        : 0
                                    }%`,
                                  }}
                                  title="In Progress"
                                />
                                <div
                                  className="h-full bg-rose-400"
                                  style={{
                                    width: `${
                                      studentReport?.summary.total_tasks
                                        ? ((studentReport.summary.overdue_tasks / studentReport.summary.total_tasks) * 100)
                                        : 0
                                    }%`,
                                  }}
                                  title="Overdue"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>{studentReport?.summary.completed_tasks ?? 0} Completed</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  <span>{studentReport?.summary.in_progress_tasks ?? 0} In Progress</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                                  <span>{studentReport?.summary.pending_tasks ?? 0} Pending</span>
                                </span>
                                {Boolean(studentReport?.summary.overdue_tasks) && (
                                  <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span>{studentReport?.summary.overdue_tasks} Overdue</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Recent Evaluations Preview */}
                            <div>
                              <div className="flex items-center justify-between mb-2.5">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                  Latest Evaluation Scores
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setDrawerTab("evaluations")}
                                  className="text-[11px] font-bold text-[#4B2EF5] hover:underline cursor-pointer"
                                >
                                  View all ({studentReport?.evaluations.length ?? 0})
                                </button>
                              </div>
                              {studentReport?.evaluations.length === 0 ? (
                                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                  No evaluations recorded yet.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {studentReport?.evaluations.slice(0, 3).map((ev) => (
                                    <div
                                      key={ev.id}
                                      className="p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-colors"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                ev.evaluation_type === "workflow"
                                                  ? "bg-violet-50 text-violet-700 border border-violet-200"
                                                  : "bg-teal-50 text-teal-700 border border-teal-200"
                                              }`}
                                            >
                                              {ev.evaluation_type === "workflow" ? "Workflow Eval" : "Daily Eval"}
                                            </span>
                                            {ev.task_title && (
                                              <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                                                {ev.task_title}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[11px] text-slate-400 mt-1">
                                            Evaluator: {ev.evaluator_name || "Assigned Evaluator"} · {formatDate(ev.evaluation_date)}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <span
                                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                                              (ev.percentage ?? 0) >= 80
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : (ev.percentage ?? 0) >= 60
                                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                            }`}
                                          >
                                            {ev.percentage !== null && ev.percentage !== undefined
                                              ? `${Math.round(ev.percentage)}%`
                                              : "Pending"}
                                          </span>
                                          {ev.total_score !== null && (
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                              {ev.total_score} / {ev.max_score ?? 100} pts
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {ev.remarks && (
                                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                          &ldquo;{ev.remarks}&rdquo;
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Recent Tasks Preview */}
                            <div>
                              <div className="flex items-center justify-between mb-2.5">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                  Assigned Tasks Preview
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setDrawerTab("tasks")}
                                  className="text-[11px] font-bold text-[#4B2EF5] hover:underline cursor-pointer"
                                >
                                  View all ({studentReport?.tasks.length ?? 0})
                                </button>
                              </div>
                              {studentReport?.tasks.length === 0 ? (
                                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                  No tasks currently assigned to this student.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {studentReport?.tasks.slice(0, 3).map((task) => {
                                    const statusInfo = getTaskStatusPill(task.status, task.due_date);
                                    return (
                                      <div
                                        key={task.id}
                                        className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-900 truncate">{task.title}</p>
                                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                            {task.workflow_title ? `Workflow: ${task.workflow_title}` : "Standalone Task"}
                                            {task.due_date ? ` · Due ${formatDate(task.due_date)}` : ""}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {getPriorityBadge(task.priority)}
                                          <Pill tone={statusInfo.tone}>{statusInfo.label}</Pill>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TAB: TASKS */}
                        {drawerTab === "tasks" && (
                          <div className="space-y-3">
                            {studentReport?.tasks.length === 0 ? (
                              <EmptyState
                                icon="task"
                                title="No tasks assigned"
                                description="This intern has not been assigned any workflow tasks yet."
                              />
                            ) : (
                              studentReport?.tasks.map((task) => {
                                const statusInfo = getTaskStatusPill(task.status, task.due_date);
                                return (
                                  <div
                                    key={task.id}
                                    className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5 shadow-2xs hover:border-[#4B2EF5]/40 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <h5 className="text-sm font-bold text-slate-900">{task.title}</h5>
                                        {task.workflow_title && (
                                          <p className="text-xs text-[#4B2EF5] font-semibold mt-0.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">account_tree</span>
                                            <span>{task.workflow_title}</span>
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {getPriorityBadge(task.priority)}
                                        <Pill tone={statusInfo.tone}>{statusInfo.label}</Pill>
                                      </div>
                                    </div>

                                    {task.description && (
                                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        {task.description}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                                      <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        <span>Due: {formatDate(task.due_date)}</span>
                                      </span>
                                      {task.completed_at && (
                                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                          <span className="material-symbols-outlined text-sm">check_circle</span>
                                          <span>Completed {formatDate(task.completed_at)}</span>
                                        </span>
                                      )}
                                      {task.submitted_at && !task.completed_at && (
                                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                                          <span className="material-symbols-outlined text-sm">schedule</span>
                                          <span>Submitted {formatDate(task.submitted_at)}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* TAB: EVALUATIONS */}
                        {drawerTab === "evaluations" && (
                          <div className="space-y-4">
                            {studentReport?.evaluations.length === 0 ? (
                              <EmptyState
                                icon="rate_review"
                                title="No evaluations yet"
                                description="No daily or workflow evaluations have been submitted for this intern."
                              />
                            ) : (
                              studentReport?.evaluations.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3 shadow-2xs"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            ev.evaluation_type === "workflow"
                                              ? "bg-violet-50 text-violet-700 border border-violet-200"
                                              : "bg-teal-50 text-teal-700 border border-teal-200"
                                          }`}
                                        >
                                          {ev.evaluation_type === "workflow"
                                            ? "Workflow Evaluation"
                                            : "Daily Evaluation"}
                                        </span>
                                        {ev.task_title && (
                                          <span className="text-xs font-bold text-slate-800">
                                            {ev.task_title}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                        <span>Evaluator: <strong>{ev.evaluator_name || "Manager / Instructor"}</strong></span>
                                        <span>·</span>
                                        <span>{formatDate(ev.evaluation_date)}</span>
                                      </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <div
                                        className={`inline-block px-3 py-1 rounded-xl text-sm font-bold font-mono ${
                                          (ev.percentage ?? 0) >= 80
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : (ev.percentage ?? 0) >= 60
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}
                                      >
                                        {ev.percentage !== null && ev.percentage !== undefined
                                          ? `${Math.round(ev.percentage)}%`
                                          : "Pending"}
                                      </div>
                                      {ev.total_score !== null && (
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                          Score: {ev.total_score} / {ev.max_score ?? 100}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {ev.remarks && (
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-700 space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Feedback & Remarks
                                      </span>
                                      <p className="italic text-slate-700">&ldquo;{ev.remarks}&rdquo;</p>
                                    </div>
                                  )}

                                  {ev.metrics && ev.metrics.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        Criteria Breakdown
                                      </span>
                                      <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden">
                                        {ev.metrics.map((m, mIdx) => (
                                          <div
                                            key={m.id || mIdx}
                                            className="p-2.5 flex items-center justify-between text-xs"
                                          >
                                            <div className="min-w-0 pr-2">
                                              <p className="font-semibold text-slate-800">{m.name}</p>
                                              {m.remarks && (
                                                <p className="text-[11px] text-slate-500 italic mt-0.5">{m.remarks}</p>
                                              )}
                                            </div>
                                            <div className="text-right shrink-0 font-mono text-[11px]">
                                              <span className="font-bold text-slate-900">
                                                {m.score ?? "—"}
                                              </span>
                                              {m.full_score && (
                                                <span className="text-slate-400"> / {m.full_score}</span>
                                              )}
                                              {m.weightage ? (
                                                <span className="text-slate-400 block text-[10px]">
                                                  weight: {m.weightage}%
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* TAB: PROFILE & ACTIONS */}
                        {drawerTab === "profile" && (
                          <div className="space-y-5">
                            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                              {[
                                { label: "Department", value: selected.department ?? "—" },
                                { label: "Specialization", value: selected.specialization ?? "—" },
                                { label: "Enrollment No", value: selected.enrollmentNo ?? "—" },
                                { label: "Batch", value: studentReport?.batch_name || selected.batchId || "Unassigned" },
                                { label: "Joining Date", value: formatDate(studentReport?.student?.joining_date || selected.createdAt) },
                                { label: "Profile ID", value: selected.profileId, mono: true },
                                { label: "User ID", value: selected.userId, mono: true },
                              ].map((row) => (
                                <div key={row.label} className="flex justify-between gap-3">
                                  <span className="text-slate-400 shrink-0">{row.label}</span>
                                  <span
                                    className={`font-semibold text-slate-800 text-right truncate ${
                                      row.mono ? "font-mono text-[11px]" : ""
                                    }`}
                                  >
                                    {row.value}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <PrimaryButton
                                onClick={() => handleToggleActive(selected)}
                                icon={selected.isActive ? "block" : "check_circle"}
                                className="flex-1 justify-center"
                              >
                                {selected.isActive ? "Suspend account" : "Activate account"}
                              </PrimaryButton>
                              {selected.isActive && (
                                <PrimaryButton
                                  onClick={() => handleDeactivate(selected)}
                                  tone="slate"
                                  icon="person_off"
                                >
                                  Deactivate
                                </PrimaryButton>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  /* Standard Staff Role View */
                  <>
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      {[
                        { label: "Department", value: selected.department ?? "—" },
                        { label: "Specialization", value: selected.specialization ?? "—" },
                        { label: "Enrollment No", value: selected.enrollmentNo ?? "—" },
                        { label: "Team (batch)", value: selected.batchId ?? "Unassigned" },
                        { label: "Provisioned", value: formatDate(selected.createdAt) },
                        { label: "Profile ID", value: selected.profileId, mono: true },
                        { label: "User ID", value: selected.userId, mono: true },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between gap-3">
                          <span className="text-slate-400 shrink-0">{row.label}</span>
                          <span
                            className={`font-semibold text-slate-800 text-right truncate ${
                              row.mono ? "font-mono text-[11px]" : ""
                            }`}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <PrimaryButton
                        onClick={() => handleToggleActive(selected)}
                        icon={selected.isActive ? "block" : "check_circle"}
                        className="flex-1 justify-center"
                      >
                        {selected.isActive ? "Suspend account" : "Activate account"}
                      </PrimaryButton>
                      {selected.isActive && (
                        <PrimaryButton
                          onClick={() => handleDeactivate(selected)}
                          tone="slate"
                          icon="person_off"
                        >
                          Deactivate
                        </PrimaryButton>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

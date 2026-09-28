"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  deactivateBackendUser,
  DirectoryPerson,
  DirectoryRole,
  fetchDirectory,
  setPersonActive,
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

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
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

      {/* PROFILE DRAWER */}
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
              className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Person Record
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <Avatar name={selected.name} size="lg" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{selected.name}</h3>
                  <p className="text-xs font-mono text-slate-400 truncate">{selected.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Pill tone={ROLE_META[selected.role].pill}>{ROLE_META[selected.role].label}</Pill>
                    <StatusDot isActive={selected.isActive} />
                  </div>
                </div>
              </div>

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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

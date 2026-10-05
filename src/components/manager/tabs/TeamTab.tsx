"use client";

import React, { useState } from "react";
import { TeamMember, ManagerTeam, fetchAvailableStudents, addTeamMembers } from "@/services/workflowService";

interface TeamTabProps {
  teams: ManagerTeam[];
  selectedTeam: ManagerTeam | null;
  onSelectTeam: (team: ManagerTeam | null) => void;
  onCreateTeam: (data: { name: string; department?: string; student_ids?: string[] }) => Promise<void>;
  teamMembers: TeamMember[];
  isLoading: boolean;
  onAssignTask: (studentId: string) => void;
  onCreateWorkflowForTeam?: (team: ManagerTeam) => void;
  onRefreshData?: () => Promise<void>;
}

export default function TeamTab({
  teams,
  selectedTeam,
  onSelectTeam,
  onCreateTeam,
  teamMembers,
  isLoading,
  onAssignTask,
  onCreateWorkflowForTeam,
  onRefreshData,
}: TeamTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Create Team Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDept, setNewTeamDept] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Available students for assignment
  const [availableStudents, setAvailableStudents] = useState<TeamMember[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // Add Members to Existing Team Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [teamToAddMembersTo, setTeamToAddMembersTo] = useState<ManagerTeam | null>(null);
  const [addMemberSelectedIds, setAddMemberSelectedIds] = useState<string[]>([]);
  const [isSubmittingAddMembers, setIsSubmittingAddMembers] = useState(false);
  const [addMembersError, setAddMembersError] = useState<string | null>(null);

  // Load available students when opening modals
  const loadAvailableStudents = async () => {
    try {
      setIsLoadingAvailable(true);
      const data = await fetchAvailableStudents();
      setAvailableStudents(data || []);
    } catch (err) {
      console.warn("Failed to load available students:", err);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedStudentIds([]);
    setCreateError(null);
    setStudentSearch("");
    setIsCreateModalOpen(true);
    loadAvailableStudents();
  };

  const handleOpenAddMembersModal = (team: ManagerTeam, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeamToAddMembersTo(team);
    setAddMemberSelectedIds([]);
    setAddMembersError(null);
    setStudentSearch("");
    setIsAddMemberModalOpen(true);
    loadAvailableStudents();
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleToggleAddMember = (studentId: string) => {
    setAddMemberSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsSubmittingTeam(true);
    setCreateError(null);
    try {
      await onCreateTeam({
        name: newTeamName.trim(),
        department: newTeamDept.trim() || undefined,
        student_ids: selectedStudentIds,
      });
      setNewTeamName("");
      setNewTeamDept("");
      setSelectedStudentIds([]);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleAddMembersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamToAddMembersTo || addMemberSelectedIds.length === 0) return;
    setIsSubmittingAddMembers(true);
    setAddMembersError(null);
    try {
      await addTeamMembers(teamToAddMembersTo.id, addMemberSelectedIds);
      setIsAddMemberModalOpen(false);
      setTeamToAddMembersTo(null);
      setAddMemberSelectedIds([]);
      if (onRefreshData) await onRefreshData();
    } catch (err: unknown) {
      setAddMembersError(err instanceof Error ? err.message : "Failed to add members");
    } finally {
      setIsSubmittingAddMembers(false);
    }
  };

  const departments = Array.from(new Set(teamMembers.map((m) => m.department).filter(Boolean)));

  // Filter members across all teams by search/dept
  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.enrollment_no && m.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = departmentFilter === "all" || m.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Filter available students for modal
  const filteredAvailableStudents = availableStudents.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.enrollment_no && s.enrollment_no.toLowerCase().includes(q)) ||
      (s.batch_name && s.batch_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner & Create Team Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20">
        <div>
          <h3 className="text-xl font-headline font-bold text-on-surface">Teams &amp; Cohorts Cockpit</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Create teams, assign employees/learners from any batch, and initialize workflows.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-primary text-white text-body-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span className="material-symbols-outlined text-lg">group_add</span>
          <span>Create Team</span>
        </button>
      </div>

      {/* Team Distribution Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-outline">
            Your Teams ({teams.length})
          </h4>
        </div>

        {teams.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
            <span className="material-symbols-outlined text-3xl text-outline mb-2">groups</span>
            <p className="text-sm font-semibold text-on-surface">No teams configured yet</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Click &quot;Create Team&quot; to form a team and add employees or students.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">group_add</span>
              <span>Create Team</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              const membersInTeam = teamMembers.filter((m) => m.batch_id === team.id);
              const progressPct = Math.min(100, Math.max(0, team.progress_percentage || 0));

              return (
                <div
                  key={team.id}
                  className="p-4 lg:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Team Avatar + Name + Badges + Member Previews */}
                  <div className="flex items-center gap-3.5 min-w-[240px] lg:w-1/4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#4B2EF5] flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold rounded">
                          {team.department || "General"}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold rounded">
                          {team.status || "Active"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 font-headline truncate">
                        {team.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span>{team.member_count ?? membersInTeam.length} members</span>
                        {membersInTeam.length > 0 && (
                          <div className="flex items-center -space-x-1 ml-1">
                            {membersInTeam.slice(0, 3).map((m, idx) => (
                              <div
                                key={m.id || idx}
                                title={m.name}
                                className="w-4 h-4 rounded-full bg-indigo-100 text-[#4B2EF5] text-[8px] font-bold flex items-center justify-center uppercase border border-white"
                              >
                                {m.name.charAt(0)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-2/5 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-100 pt-2 lg:pt-0 lg:px-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Team Length</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">{team.member_count}</span>
                      <span className="text-[10px] text-slate-400 block">Members</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Workflows</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">{team.active_workflows}</span>
                      <span className="text-[10px] text-slate-400 block">Tracks</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Tasks</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">{team.active_tasks}</span>
                      <span className="text-[10px] text-slate-400 block">Assigned</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Pending Eval</span>
                      <span className="text-sm font-bold text-amber-600 font-mono">{team.evaluations_pending}</span>
                      <span className="text-[10px] text-slate-400 block">Awaiting</span>
                    </div>
                  </div>

                  {/* Right Column: Progress Bar & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center justify-between lg:justify-end gap-3 lg:w-1/3 border-t lg:border-t-0 border-slate-100 pt-2 lg:pt-0">
                    <div className="w-full sm:w-32 lg:w-32 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">Completion</span>
                        <span className="font-bold text-[#4B2EF5] font-mono text-[11px]">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4B2EF5] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleOpenAddMembersModal(team, e)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        <span>+ Member</span>
                      </button>

                      {onCreateWorkflowForTeam && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateWorkflowForTeam(team);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4B2EF5] rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">alt_route</span>
                          <span>+ Workflow</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Roster Controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search all learners by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d!}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">person_off</span>
          </div>
          <h4 className="text-body-md font-bold text-on-surface">No Team Members Found</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
            {searchQuery || departmentFilter !== "all"
              ? "No team members matched your active filters."
              : selectedTeam
              ? `No learners currently belong to ${selectedTeam.name}. Click "+ Member" above to add learners.`
              : "No learners are assigned to your management cohort currently."}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-surface-container/40 border-b border-outline-variant/30 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
              Member Roster — All Teams ({filteredMembers.length})
            </h4>
            <span className="text-xs font-semibold text-slate-500">
              Total {filteredMembers.length} learners
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-container text-outline text-xs uppercase tracking-wider font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="px-5 py-3.5">Learner / Employee</th>
                  <th className="px-5 py-3.5">Enrollment No</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Assigned Team / Batch</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredMembers.map((member) => {
                  const teamName =
                    member.batch_name ||
                    teams.find((t) => t.id === member.batch_id)?.name ||
                    "Assigned Team";

                  return (
                    <tr key={member.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface">{member.name}</div>
                            <div className="text-xs text-on-surface-variant">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">
                        {member.enrollment_no || "—"}
                      </td>
                      <td className="px-5 py-4 text-on-surface">
                        {member.department || "General"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                          {teamName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            member.status?.toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {member.status || "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => onAssignTask(member.id)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">add_task</span>
                          <span>Assign Task</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-surface-container/30 border-t border-outline-variant/30 text-xs text-outline text-right font-medium">
            Showing {filteredMembers.length} of {teamMembers.length} team members
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL with Student Picker & Batch Identification */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full border border-outline-variant/50 p-6 shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="text-title-md font-bold text-on-surface font-headline">Create New Team</h3>
                <p className="text-xs text-on-surface-variant">Name your team and pick employees/students to assign.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-outline hover:text-on-surface text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg shrink-0">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Team Alpha / Engineering"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Product"
                    value={newTeamDept}
                    onChange={(e) => setNewTeamDept(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Student Picker with Batch Labels */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface">
                    Assign Students / Employees ({selectedStudentIds.length} selected)
                  </label>
                  {selectedStudentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                <div className="relative mb-2">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Filter students by name, email, or batch..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-container rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="border border-outline-variant/50 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-outline-variant/20 bg-surface-container/20">
                  {isLoadingAvailable ? (
                    <div className="py-8 text-center">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-outline mt-2">Loading students...</p>
                    </div>
                  ) : filteredAvailableStudents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-on-surface-variant">
                      No matching students found.
                    </div>
                  ) : (
                    filteredAvailableStudents.map((s) => {
                      const isChecked = selectedStudentIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-2.5 text-xs hover:bg-surface-container/70 cursor-pointer transition-colors ${
                            isChecked ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStudent(s.id)}
                              className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <div className="font-semibold text-on-surface">{s.name}</div>
                              <div className="text-[11px] text-on-surface-variant">{s.email}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-[10px] font-semibold">
                              Batch: {s.batch_name || "Unassigned"}
                            </span>
                            {s.enrollment_no && (
                              <div className="text-[10px] text-outline font-mono mt-0.5">
                                {s.enrollment_no}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/30 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingTeam && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Create Team ({selectedStudentIds.length} members)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBERS TO EXISTING TEAM MODAL */}
      {isAddMemberModalOpen && teamToAddMembersTo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full border border-outline-variant/50 p-6 shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="text-title-md font-bold text-on-surface font-headline">
                  Add Members to {teamToAddMembersTo.name}
                </h3>
                <p className="text-xs text-on-surface-variant">Select employees/students to add to this team.</p>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-outline hover:text-on-surface text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addMembersError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg shrink-0">
                {addMembersError}
              </div>
            )}

            <form onSubmit={handleAddMembersSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <div className="relative mb-2">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search by student name, email, or current batch..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-container rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="border border-outline-variant/50 rounded-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-outline-variant/20 bg-surface-container/20">
                  {isLoadingAvailable ? (
                    <div className="py-8 text-center">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-outline mt-2">Loading students...</p>
                    </div>
                  ) : filteredAvailableStudents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-on-surface-variant">
                      No matching students found.
                    </div>
                  ) : (
                    filteredAvailableStudents.map((s) => {
                      const isChecked = addMemberSelectedIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-2.5 text-xs hover:bg-surface-container/70 cursor-pointer transition-colors ${
                            isChecked ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleAddMember(s.id)}
                              className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <div className="font-semibold text-on-surface">{s.name}</div>
                              <div className="text-[11px] text-on-surface-variant">{s.email}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-[10px] font-semibold">
                              Current Batch: {s.batch_name || "Unassigned"}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/30 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAddMembers || addMemberSelectedIds.length === 0}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAddMembers && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Add {addMemberSelectedIds.length} Members</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

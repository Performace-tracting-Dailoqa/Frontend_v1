import React, { useState } from "react";
import {
  TeamMember,
  ManagerTeam,
  WorkflowTask,
  ManagerStudentDetails,
  fetchAvailableStudents,
  addTeamMembers,
  fetchManagerStudentDetails,
} from "@/services/workflowService";

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

  // Team Details / Members Popup State
  const [teamDetailModal, setTeamDetailModal] = useState<ManagerTeam | null>(null);
  const [teamDetailSearch, setTeamDetailSearch] = useState("");

  // Student Detail & Task History Modal State (When clicking a student in the popup or roster)
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<TeamMember | null>(null);
  const [studentTaskData, setStudentTaskData] = useState<ManagerStudentDetails | null>(null);
  const [isLoadingStudentDetails, setIsLoadingStudentDetails] = useState(false);
  const [studentTaskFilter, setStudentTaskFilter] = useState<"all" | "completed" | "in_progress" | "pending">("all");
  const [studentTaskSearch, setStudentTaskSearch] = useState("");

  const handleOpenStudentDetails = async (member: TeamMember) => {
    setSelectedStudentDetail(member);
    setStudentTaskData(null);
    setStudentTaskFilter("all");
    setStudentTaskSearch("");
    setIsLoadingStudentDetails(true);
    try {
      const data = await fetchManagerStudentDetails(member.id);
      setStudentTaskData(data);
    } catch (err) {
      console.warn("Failed to fetch student details:", err);
    } finally {
      setIsLoadingStudentDetails(false);
    }
  };

  // Create Team Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDept, setNewTeamDept] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Available students for assignment & roster fallback
  const [availableStudents, setAvailableStudents] = useState<TeamMember[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // Add Members to Existing Team Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [teamToAddMembersTo, setTeamToAddMembersTo] = useState<ManagerTeam | null>(null);
  const [addMemberSelectedIds, setAddMemberSelectedIds] = useState<string[]>([]);
  const [isSubmittingAddMembers, setIsSubmittingAddMembers] = useState(false);
  const [addMembersError, setAddMembersError] = useState<string | null>(null);

  // Load available students when opening modals or on component mount
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

  // Ensure full member pool is loaded on initial render
  React.useEffect(() => {
    loadAvailableStudents();
  }, []);

  // Merge teamMembers and availableStudents so all members under manager irrespective of batch are present
  const allMembers = React.useMemo(() => {
    const memberMap = new Map<string, TeamMember>();
    (availableStudents || []).forEach((s) => {
      if (s.id) memberMap.set(s.id, s);
    });
    (teamMembers || []).forEach((m) => {
      if (m.id) {
        const existing = memberMap.get(m.id);
        memberMap.set(m.id, { ...existing, ...m });
      }
    });
    return Array.from(memberMap.values());
  }, [teamMembers, availableStudents]);

  const handleOpenCreateModal = () => {
    setSelectedStudentIds([]);
    setCreateError(null);
    setStudentSearch("");
    setIsCreateModalOpen(true);
    loadAvailableStudents();
  };

  const handleOpenAddMembersModal = (team: ManagerTeam, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTeamToAddMembersTo(team);
    setAddMemberSelectedIds([]);
    setAddMembersError(null);
    setStudentSearch("");
    setIsAddMemberModalOpen(true);
    loadAvailableStudents();
  };

  const handleOpenTeamDetailsModal = (team: ManagerTeam) => {
    setTeamDetailModal(team);
    setTeamDetailSearch("");
    onSelectTeam(team);
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
      loadAvailableStudents();
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
      loadAvailableStudents();
    } catch (err: unknown) {
      setAddMembersError(err instanceof Error ? err.message : "Failed to add members");
    } finally {
      setIsSubmittingAddMembers(false);
    }
  };

  const departments = Array.from(new Set(allMembers.map((m) => m.department).filter(Boolean)));

  // Filter members across all teams by search/dept irrespective of batch
  const filteredMembers = allMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.enrollment_no && m.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.batch_name && m.batch_name.toLowerCase().includes(searchQuery.toLowerCase()));
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

  // Filter members belonging to the clicked team in the popup
  const teamSpecificMembers = teamDetailModal
    ? allMembers.filter((m) => {
        const isMatchTeam = m.batch_id === teamDetailModal.id || m.batch_name === teamDetailModal.name;
        if (!isMatchTeam) return false;
        if (!teamDetailSearch.trim()) return true;
        const q = teamDetailSearch.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.enrollment_no && m.enrollment_no.toLowerCase().includes(q))
        );
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner & Create Team Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20">
        <div>
          <h3 className="text-xl font-headline font-bold text-on-surface">Teams &amp; Cohorts Cockpit</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Create teams, click any team to inspect all assigned members, and initialize workflows.
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
            Your Teams ({teams.length}) — Click on any team to view all members
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
              const membersInTeam = teamMembers.filter((m) => m.batch_id === team.id || m.batch_name === team.name);
              const progressPct = Math.min(100, Math.max(0, team.progress_percentage || 0));

              return (
                <div
                  key={team.id}
                  onClick={() => handleOpenTeamDetailsModal(team)}
                  className="p-4 lg:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-primary/50 hover:shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left Column: Team Avatar + Name + Badges + Member Previews */}
                  <div className="flex items-center gap-3.5 min-w-[240px] lg:w-1/4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#4B2EF5] group-hover:bg-[#4B2EF5] group-hover:text-white transition-colors flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
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
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors font-headline truncate">
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
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Team Size</span>
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

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
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

                      <button
                        onClick={() => handleOpenTeamDetailsModal(team)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                        title="View Team Members"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
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
            placeholder="Search all learners across teams by name, email, or ID..."
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
              ? "No team members matched your active search or department filter."
              : "No learners are registered under your management cohort yet."}
          </p>
          {(searchQuery || departmentFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDepartmentFilter("all");
              }}
              className="mt-4 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              <span>Clear Search &amp; Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-surface-container/40 border-b border-outline-variant/30 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
                All Members &amp; Learners ({filteredMembers.length})
              </h4>
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold rounded-md">
                Click any member to view details popup
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total {allMembers.length} learners
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
                    "General Pool";

                  return (
                    <tr
                      key={member.id}
                      onClick={() => handleOpenStudentDetails(member)}
                      className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                      title="Click row to open student tasks and completion history popup"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white text-primary flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                              <span>{member.name}</span>
                              <span className="material-symbols-outlined text-xs text-outline group-hover:text-primary">open_in_new</span>
                            </div>
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          teamName === "General Pool"
                            ? "bg-slate-100 border border-slate-200 text-slate-700"
                            : "bg-indigo-50 border border-indigo-100 text-indigo-700"
                        }`}>
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
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentDetails(member)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-primary text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 border border-slate-200/60"
                            title="View student tasks and performance popup"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Tasks &amp; Profile</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAssignTask(member.id)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">add_task</span>
                            <span>Assign Task</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-surface-container/30 border-t border-outline-variant/30 text-xs text-outline text-right font-medium">
            Showing {filteredMembers.length} of {allMembers.length} total members
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: TEAM MEMBERS & DETAILS                      */}
      {/* ========================================================= */}
      {teamDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 p-6 sm:p-7 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4B2EF5] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs border border-indigo-100">
                  {teamDetailModal.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase rounded-md">
                      {teamDetailModal.department || "Engineering"}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase rounded-md">
                      {teamDetailModal.status || "Active"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      {teamSpecificMembers.length} Members
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-headline">
                    {teamDetailModal.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddMembersModal(teamDetailModal)}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 border border-primary/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span>+ Member</span>
                </button>

                {onCreateWorkflowForTeam && (
                  <button
                    type="button"
                    onClick={() => {
                      const t = teamDetailModal;
                      setTeamDetailModal(null);
                      onCreateWorkflowForTeam(t);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4B2EF5] rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">alt_route</span>
                    <span>+ Workflow</span>
                  </button>
                )}

                <button
                  onClick={() => setTeamDetailModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ml-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Team Metrics Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 shrink-0 bg-slate-50/60 -mx-6 sm:-mx-7 px-6 sm:px-7">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Members</span>
                <span className="text-base font-bold text-slate-900 font-mono">{teamDetailModal.member_count}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Workflows</span>
                <span className="text-base font-bold text-slate-900 font-mono">{teamDetailModal.active_workflows}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned Tasks</span>
                <span className="text-base font-bold text-slate-900 font-mono">{teamDetailModal.active_tasks}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Progress</span>
                <span className="text-base font-bold text-[#4B2EF5] font-mono">{teamDetailModal.progress_percentage}%</span>
              </div>
            </div>

            {/* Search Bar within popup */}
            <div className="pt-4 pb-2 shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter team members by name, email, or ID..."
                  value={teamDetailSearch}
                  onChange={(e) => setTeamDetailSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Members List within Popup */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-2">
              {teamSpecificMembers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-2xl">group_off</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No members in this team</h4>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">
                    {teamDetailSearch
                      ? "No team members matched your search."
                      : "Add employees or learners to assign workflows and tasks."}
                  </p>
                  <button
                    onClick={() => handleOpenAddMembersModal(teamDetailModal)}
                    className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    <span>Add Members</span>
                  </button>
                </div>
              ) : (
                teamSpecificMembers.map((member) => (
                  <div
                    key={member.id}
                    className="py-3 px-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-2xl transition-all border border-transparent hover:border-slate-200 group"
                  >
                    <div
                      onClick={() => handleOpenStudentDetails(member)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      title="Click to view student profile, tasks and completion history"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-[#4B2EF5] group-hover:text-white text-[#4B2EF5] font-bold text-sm flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-primary transition-colors truncate">
                            {member.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              member.status?.toLowerCase() === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {member.status || "Active"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                          <span>{member.email}</span>
                          {member.enrollment_no && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600">{member.enrollment_no}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenStudentDetails(member)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-primary rounded-xl text-xs font-semibold transition-all border border-slate-200/60 flex items-center gap-1 cursor-pointer"
                        title="View student tasks and completed work"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span className="hidden sm:inline">Tasks &amp; Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTeamDetailModal(null);
                          onAssignTask(member.id);
                        }}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition-all border border-primary/20 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add_task</span>
                        <span>Assign Task</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-500">
              <span>Showing {teamSpecificMembers.length} team members</span>
              <button
                type="button"
                onClick={() => setTeamDetailModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: STUDENT DETAILS & TASK PROGRESS             */}
      {/* ========================================================= */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 p-6 sm:p-7 shadow-2xl animate-fade-in max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0 gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4B2EF5] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs border border-indigo-100">
                  {selectedStudentDetail.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase rounded-md">
                      {selectedStudentDetail.department || "Engineering"}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-md">
                      Batch: {selectedStudentDetail.batch_name || "General Pool"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      selectedStudentDetail.status?.toLowerCase() === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {selectedStudentDetail.status || "Active"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-headline truncate">
                    {selectedStudentDetail.name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                    <span>{selectedStudentDetail.email}</span>
                    {selectedStudentDetail.enrollment_no && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-700 font-medium">ID: {selectedStudentDetail.enrollment_no}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const sid = selectedStudentDetail.id;
                    setSelectedStudentDetail(null);
                    setTeamDetailModal(null);
                    onAssignTask(sid);
                  }}
                  className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add_task</span>
                  <span>Assign New Task</span>
                </button>

                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Close popup"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {isLoadingStudentDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-700">Loading student tasks &amp; performance details...</p>
                <p className="text-xs text-slate-400 mt-1">Fetching assignments and competency evaluations</p>
              </div>
            ) : (
              <>
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 shrink-0 bg-slate-50/70 -mx-6 sm:-mx-7 px-6 sm:px-7">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Assigned</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {studentTaskData?.stats.total_tasks ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Tasks</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Completed</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-emerald-700 font-mono">
                        {studentTaskData?.stats.completed_tasks ?? 0}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">
                        ({studentTaskData?.stats.completion_rate ?? 0}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Finished</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">In Progress</span>
                    <span className="text-lg font-bold text-amber-700 font-mono">
                      {studentTaskData?.stats.in_progress_tasks ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Active / Submitted</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pending / Todo</span>
                    <span className="text-lg font-bold text-slate-700 font-mono">
                      {studentTaskData?.stats.pending_tasks ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Awaiting start</span>
                  </div>
                </div>

                {/* Filter Tabs & Search Controls */}
                <div className="pt-4 pb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "all"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({studentTaskData?.stats.total_tasks ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("completed")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "completed"
                          ? "bg-white text-emerald-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Completed ({studentTaskData?.stats.completed_tasks ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("in_progress")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "in_progress"
                          ? "bg-white text-amber-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      In Progress ({studentTaskData?.stats.in_progress_tasks ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentTaskFilter("pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        studentTaskFilter === "pending"
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Pending ({studentTaskData?.stats.pending_tasks ?? 0})
                    </button>
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search tasks by title or workflow..."
                      value={studentTaskSearch}
                      onChange={(e) => setStudentTaskSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {(() => {
                    const allTasks = studentTaskData?.tasks || [];
                    const filtered = allTasks.filter((t) => {
                      const st = (t.status || "").toLowerCase();
                      if (studentTaskFilter === "completed" && !["completed", "done"].includes(st)) return false;
                      if (studentTaskFilter === "in_progress" && !["in_progress", "in progress", "submitted"].includes(st)) return false;
                      if (studentTaskFilter === "pending" && !["pending", "todo", "assigned"].includes(st)) return false;

                      if (studentTaskSearch.trim()) {
                        const q = studentTaskSearch.toLowerCase();
                        const titleMatch = (t.title || "").toLowerCase().includes(q);
                        const descMatch = (t.description || "").toLowerCase().includes(q);
                        const wfMatch = (t.workflow_name || "").toLowerCase().includes(q);
                        if (!titleMatch && !descMatch && !wfMatch) return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                            <span className="material-symbols-outlined text-2xl">assignment_late</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">No tasks found</h4>
                          <p className="text-xs text-slate-500 mt-0.5 mb-3 max-w-sm mx-auto">
                            {studentTaskSearch || studentTaskFilter !== "all"
                              ? "No tasks match your active filter or search."
                              : "No workflow tasks have been assigned to this student yet."}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const sid = selectedStudentDetail.id;
                              setSelectedStudentDetail(null);
                              setTeamDetailModal(null);
                              onAssignTask(sid);
                            }}
                            className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-sm">add_task</span>
                            <span>Assign First Task</span>
                          </button>
                        </div>
                      );
                    }

                    return filtered.map((task) => {
                      const st = (task.status || "pending").toLowerCase();
                      const isCompleted = ["completed", "done"].includes(st);
                      const isInProgress = ["in_progress", "in progress", "submitted"].includes(st);

                      return (
                        <div
                          key={task.id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-3"
                        >
                          {/* Task Top Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isInProgress
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {isCompleted ? "check_circle" : isInProgress ? "pending" : "radio_button_unchecked"}
                                </span>
                                <span className="capitalize">{task.status || "Pending"}</span>
                              </span>

                              {task.workflow_name && (
                                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-md">
                                  Track: {task.workflow_name}
                                </span>
                              )}

                              {task.priority && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  task.priority.toLowerCase() === "high"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : task.priority.toLowerCase() === "medium"
                                    ? "bg-orange-50 text-orange-700 border border-orange-100"
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {task.priority} Priority
                                </span>
                              )}
                            </div>

                            {/* Scores & Completion info */}
                            <div className="flex items-center gap-2">
                              {task.student_grade !== null && task.student_grade !== undefined && (
                                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-lg font-mono">
                                  Self-Grade: {task.student_grade}/10
                                </span>
                              )}
                              {task.manager_grade !== null && task.manager_grade !== undefined && (
                                <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold rounded-lg font-mono">
                                  Manager Grade: {task.manager_grade}/10
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 font-headline">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Submission notes if any */}
                          {task.submission_notes && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                              <span className="font-semibold text-slate-800 block text-[11px] uppercase mb-0.5">Learner Submission Notes:</span>
                              <p className="italic text-slate-600">{task.submission_notes}</p>
                            </div>
                          )}

                          {/* Task Bottom Dates & Metadata */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                            <div className="flex items-center gap-3 flex-wrap">
                              {task.start_date && (
                                <span>Start: <span className="font-mono text-slate-700">{task.start_date.split("T")[0]}</span></span>
                              )}
                              {task.due_date && (
                                <span>Due: <span className="font-mono text-slate-700">{task.due_date.split("T")[0]}</span></span>
                              )}
                              {task.completed_at && (
                                <span className="text-emerald-700">Completed: <span className="font-mono">{task.completed_at.split("T")[0]}</span></span>
                              )}
                            </div>
                            {task.assigned_by_name && (
                              <span>Assigned by: <span className="text-slate-700 font-semibold">{task.assigned_by_name}</span></span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-500 mt-2">
              <span>
                {studentTaskData ? `${studentTaskData.tasks.length} total tasks on record` : ""}
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

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

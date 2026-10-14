"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  fetchManagerList,
  fetchTeacherList,
  UserProfileResponse,
} from "@/services/userService";
import { updateBatch, UpdateBatchPayload } from "@/services/batchService";
import { TeamRecord } from "@/services/insightsService";
import { Avatar, Pill } from "./SuperAdminUi";

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamRecord | null;
  onTeamUpdated: () => void;
  existingTeams: TeamRecord[];
}

const COMMON_DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Operations",
  "Quality Assurance",
  "Japanese Language",
  "Analytics",
  "Marketing",
];

export default function EditTeamModal({
  isOpen,
  onClose,
  team,
  onTeamUpdated,
  existingTeams,
}: EditTeamModalProps) {
  // Form fields
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // People data from backend
  const [managers, setManagers] = useState<UserProfileResponse[]>([]);
  const [teachers, setTeachers] = useState<UserProfileResponse[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dropdown open states for rich select
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  // Initialize form when modal opens or team changes
  useEffect(() => {
    if (isOpen && team) {
      setName(team.name || "");
      setDepartment(team.department || "");
      setStatus(team.status || (team.is_active ? "active" : "scheduled"));
      setStartDate(team.start_date ? String(team.start_date).slice(0, 10) : "");
      setEndDate(team.end_date ? String(team.end_date).slice(0, 10) : "");
      setSelectedManagerId(team.manager?.profile_id || team.manager?.id || "");
      setSelectedTeacherId(team.teacher?.profile_id || team.teacher?.id || "");
      setSubmitError(null);
      setManagerSearch("");
      setTeacherSearch("");
      setManagerDropdownOpen(false);
      setTeacherDropdownOpen(false);

      // Fetch all managers and teachers
      setIsLoadingPeople(true);
      setPeopleError(null);
      Promise.all([
        fetchManagerList(1, 100),
        fetchTeacherList(1, 100),
      ])
        .then(([mgrRes, tchrRes]) => {
          setManagers(mgrRes.items || []);
          setTeachers(tchrRes.items || []);
        })
        .catch((err) => {
          setPeopleError(err instanceof Error ? err.message : "Failed to load team leads.");
        })
        .finally(() => {
          setIsLoadingPeople(false);
        });
    }
  }, [isOpen, team]);

  // Compute map of manager -> list of assigned teams (excluding this team)
  const otherTeams = useMemo(() => {
    return existingTeams.filter((t) => t.id !== team?.id);
  }, [existingTeams, team?.id]);

  const managerTeamsMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    for (const t of otherTeams) {
      if (t.manager?.profile_id) {
        const list = map.get(t.manager.profile_id) || [];
        list.push({ id: t.id, name: t.name });
        map.set(t.manager.profile_id, list);
      }
      if (t.manager?.id) {
        const list = map.get(t.manager.id) || [];
        if (!list.some((x) => x.id === t.id)) list.push({ id: t.id, name: t.name });
        map.set(t.manager.id, list);
      }
      if (t.manager?.email) {
        const key = t.manager.email.toLowerCase();
        const list = map.get(key) || [];
        if (!list.some((x) => x.id === t.id)) list.push({ id: t.id, name: t.name });
        map.set(key, list);
      }
    }
    return map;
  }, [otherTeams]);

  // Compute map of teacher -> list of assigned teams (excluding this team)
  const teacherTeamsMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    for (const t of otherTeams) {
      if (t.teacher?.profile_id) {
        const list = map.get(t.teacher.profile_id) || [];
        list.push({ id: t.id, name: t.name });
        map.set(t.teacher.profile_id, list);
      }
      if (t.teacher?.id) {
        const list = map.get(t.teacher.id) || [];
        if (!list.some((x) => x.id === t.id)) list.push({ id: t.id, name: t.name });
        map.set(t.teacher.id, list);
      }
      if (t.teacher?.email) {
        const key = t.teacher.email.toLowerCase();
        const list = map.get(key) || [];
        if (!list.some((x) => x.id === t.id)) list.push({ id: t.id, name: t.name });
        map.set(key, list);
      }
    }
    return map;
  }, [otherTeams]);

  // Find currently selected objects
  const selectedManager = useMemo(() => {
    if (!selectedManagerId) return null;
    return managers.find(
      (m) => m.id === selectedManagerId || m.user_id === selectedManagerId
    ) || (team?.manager ? {
      id: team.manager.profile_id || team.manager.id || selectedManagerId,
      user_id: team.manager.id || selectedManagerId,
      name: team.manager.name,
      email: team.manager.email,
      department: team.department,
      is_active: true,
    } : null);
  }, [selectedManagerId, managers, team?.manager, team?.department]);

  const selectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return teachers.find(
      (t) => t.id === selectedTeacherId || t.user_id === selectedTeacherId
    ) || (team?.teacher ? {
      id: team.teacher.profile_id || team.teacher.id || selectedTeacherId,
      user_id: team.teacher.id || selectedTeacherId,
      name: team.teacher.name,
      email: team.teacher.email,
      department: team.department,
      is_active: true,
    } : null);
  }, [selectedTeacherId, teachers, team?.teacher, team?.department]);

  // Filtered lists for dropdowns
  const filteredManagers = useMemo(() => {
    const q = managerSearch.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q))
    );
  }, [managers, managerSearch]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q))
    );
  }, [teachers, teacherSearch]);

  const getManagerTeamCount = (m: UserProfileResponse) => {
    const byProfileId = managerTeamsMap.get(m.id) || [];
    const byUserId = m.user_id ? managerTeamsMap.get(m.user_id) || [] : [];
    const byEmail = m.email ? managerTeamsMap.get(m.email.toLowerCase()) || [] : [];
    const set = new Set([...byProfileId, ...byUserId, ...byEmail].map((x) => x.id));
    return set.size;
  };

  const getTeacherTeamCount = (t: UserProfileResponse) => {
    const byProfileId = teacherTeamsMap.get(t.id) || [];
    const byUserId = t.user_id ? teacherTeamsMap.get(t.user_id) || [] : [];
    const byEmail = t.email ? teacherTeamsMap.get(t.email.toLowerCase()) || [] : [];
    const set = new Set([...byProfileId, ...byUserId, ...byEmail].map((x) => x.id));
    return set.size;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    if (!name.trim()) {
      setSubmitError("Please enter a team name.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: UpdateBatchPayload = {
        name: name.trim(),
        department: department.trim() || null,
        status: status || "active",
        start_date: startDate ? startDate : null,
        end_date: endDate ? endDate : null,
        manager_id: selectedManagerId ? selectedManagerId : null,
        teacher_id: selectedTeacherId ? selectedTeacherId : null,
      };

      await updateBatch(team.id, payload);
      onTeamUpdated();
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update team. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit Team & Leadership"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-headline">
                Edit Team &amp; Leadership
              </h3>
              <p className="text-xs text-slate-500">
                Change team manager, teacher lead, status and batch details for{" "}
                <span className="font-semibold text-slate-800">{team.name}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{submitError}</span>
            </div>
          )}

          {peopleError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">warning</span>
              <span>{peopleError}</span>
            </div>
          )}

          {/* SECTION 1: TEAM DETAILS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#4B2EF5]">groups</span>
              <span>Team Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Team / Batch Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engineering Cohort 2026-A"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#4B2EF5] focus:ring-2 focus:ring-[#4B2EF5]/15 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering, Design..."
                    list="dept-options-edit"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#4B2EF5] focus:ring-2 focus:ring-[#4B2EF5]/15 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                  <datalist id="dept-options-edit">
                    {COMMON_DEPARTMENTS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#4B2EF5] focus:ring-2 focus:ring-[#4B2EF5]/15 transition-all text-slate-800 bg-white cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#4B2EF5] focus:ring-2 focus:ring-[#4B2EF5]/15 transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#4B2EF5] focus:ring-2 focus:ring-[#4B2EF5]/15 transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: LEADERSHIP ASSIGNMENT */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#4B2EF5]">badge</span>
                <span>Team Leads Assignment</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select a manager and teacher lead. Leaders already supervising other teams show an indicator tag (e.g. +1, +2).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MANAGER PICKER */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Lead
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setManagerDropdownOpen(!managerDropdownOpen);
                    setTeacherDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 bg-white cursor-pointer ${
                    managerDropdownOpen
                      ? "border-[#4B2EF5] ring-2 ring-[#4B2EF5]/15"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedManager ? (
                      <>
                        <Avatar name={selectedManager.name || "Manager"} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {selectedManager.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {selectedManager.email}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">person_off</span>
                        </span>
                        <span className="text-xs text-slate-400 italic">No Manager Assigned</span>
                      </>
                    )}
                  </div>

                  <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">
                    {managerDropdownOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {/* Manager Dropdown Menu */}
                <AnimatePresence>
                  {managerDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-60"
                    >
                      <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <input
                          type="text"
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                          placeholder="Search managers…"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#4B2EF5]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="overflow-y-auto divide-y divide-slate-50 p-1">
                        {/* Option: Unassign */}
                        <div
                          onClick={() => {
                            setSelectedManagerId("");
                            setManagerDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                            !selectedManagerId ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-xs">
                            ✕
                          </span>
                          <span className="text-xs text-slate-500 italic">Unassigned (None)</span>
                        </div>

                        {filteredManagers.map((m) => {
                          const count = getManagerTeamCount(m);
                          const isSelected =
                            selectedManagerId === m.id || selectedManagerId === m.user_id;

                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                setSelectedManagerId(m.id);
                                setManagerDropdownOpen(false);
                              }}
                              className={`p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                isSelected ? "bg-[#4B2EF5]/10" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar name={m.name || "Manager"} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">
                                    {m.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                                </div>
                              </div>

                              {count > 0 && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
                                  title={`Supervises ${count} other team${count === 1 ? "" : "s"}`}
                                >
                                  +{count} team{count === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {filteredManagers.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400 italic">
                            No managers found
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TEACHER PICKER */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teacher Lead
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setTeacherDropdownOpen(!teacherDropdownOpen);
                    setManagerDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 bg-white cursor-pointer ${
                    teacherDropdownOpen
                      ? "border-[#4B2EF5] ring-2 ring-[#4B2EF5]/15"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedTeacher ? (
                      <>
                        <Avatar name={selectedTeacher.name || "Teacher"} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {selectedTeacher.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {selectedTeacher.email}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">person_off</span>
                        </span>
                        <span className="text-xs text-slate-400 italic">No Teacher Assigned</span>
                      </>
                    )}
                  </div>

                  <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">
                    {teacherDropdownOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {/* Teacher Dropdown Menu */}
                <AnimatePresence>
                  {teacherDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-60"
                    >
                      <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <input
                          type="text"
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                          placeholder="Search teachers…"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#4B2EF5]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="overflow-y-auto divide-y divide-slate-50 p-1">
                        {/* Option: Unassign */}
                        <div
                          onClick={() => {
                            setSelectedTeacherId("");
                            setTeacherDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                            !selectedTeacherId ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-xs">
                            ✕
                          </span>
                          <span className="text-xs text-slate-500 italic">Unassigned (None)</span>
                        </div>

                        {filteredTeachers.map((t) => {
                          const count = getTeacherTeamCount(t);
                          const isSelected =
                            selectedTeacherId === t.id || selectedTeacherId === t.user_id;

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setSelectedTeacherId(t.id);
                                setTeacherDropdownOpen(false);
                              }}
                              className={`p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                isSelected ? "bg-[#4B2EF5]/10" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar name={t.name || "Teacher"} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">
                                    {t.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">{t.email}</p>
                                </div>
                              </div>

                              {count > 0 && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
                                  title={`Leads ${count} other team${count === 1 ? "" : "s"}`}
                                >
                                  +{count} team{count === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {filteredTeachers.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400 italic">
                            No teachers found
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="h-10 px-5 rounded-xl bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

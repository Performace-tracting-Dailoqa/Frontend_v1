"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  fetchManagerList,
  fetchTeacherList,
  fetchStudentList,
  UserProfileResponse,
} from "@/services/userService";
import { createBatch } from "@/services/batchService";
import { TeamRecord } from "@/services/insightsService";
import { Avatar, Pill } from "./SuperAdminUi";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (newTeamId?: string) => void;
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

export default function CreateTeamModal({
  isOpen,
  onClose,
  onTeamCreated,
  existingTeams,
}: CreateTeamModalProps) {
  // Form fields
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // People data from backend
  const [managers, setManagers] = useState<UserProfileResponse[]>([]);
  const [teachers, setTeachers] = useState<UserProfileResponse[]>([]);
  const [students, setStudents] = useState<UserProfileResponse[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  // Filter/search states for students
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "unassigned" | "selected">("all");

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dropdown open states for rich select
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDepartment("");
      setStartDate("");
      setEndDate("");
      setSelectedManagerId("");
      setSelectedTeacherId("");
      setSelectedStudentIds(new Set());
      setSubmitError(null);
      setStudentSearch("");
      setStudentFilter("all");
      setManagerSearch("");
      setTeacherSearch("");
      setManagerDropdownOpen(false);
      setTeacherDropdownOpen(false);

      // Fetch all managers, teachers, and students
      setIsLoadingPeople(true);
      setPeopleError(null);
      Promise.all([
        fetchManagerList(1, 100),
        fetchTeacherList(1, 100),
        fetchStudentList({ pageSize: 100 }),
      ])
        .then(([mgrRes, tchrRes, stdRes]) => {
          setManagers(mgrRes.items || []);
          setTeachers(tchrRes.items || []);
          setStudents(stdRes.items || []);
        })
        .catch((err) => {
          setPeopleError(err instanceof Error ? err.message : "Failed to load team members.");
        })
        .finally(() => {
          setIsLoadingPeople(false);
        });
    }
  }, [isOpen]);

  // Compute map of manager -> list of assigned teams
  const managerTeamsMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    for (const team of existingTeams) {
      if (team.manager?.profile_id) {
        const list = map.get(team.manager.profile_id) || [];
        list.push({ id: team.id, name: team.name });
        map.set(team.manager.profile_id, list);
      }
      if (team.manager?.id) {
        const list = map.get(team.manager.id) || [];
        if (!list.some((x) => x.id === team.id)) list.push({ id: team.id, name: team.name });
        map.set(team.manager.id, list);
      }
      if (team.manager?.email) {
        const key = team.manager.email.toLowerCase();
        const list = map.get(key) || [];
        if (!list.some((x) => x.id === team.id)) list.push({ id: team.id, name: team.name });
        map.set(key, list);
      }
    }
    return map;
  }, [existingTeams]);

  // Compute map of teacher -> list of assigned teams
  const teacherTeamsMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    for (const team of existingTeams) {
      if (team.teacher?.profile_id) {
        const list = map.get(team.teacher.profile_id) || [];
        list.push({ id: team.id, name: team.name });
        map.set(team.teacher.profile_id, list);
      }
      if (team.teacher?.id) {
        const list = map.get(team.teacher.id) || [];
        if (!list.some((x) => x.id === team.id)) list.push({ id: team.id, name: team.name });
        map.set(team.teacher.id, list);
      }
      if (team.teacher?.email) {
        const key = team.teacher.email.toLowerCase();
        const list = map.get(key) || [];
        if (!list.some((x) => x.id === team.id)) list.push({ id: team.id, name: team.name });
        map.set(key, list);
      }
    }
    return map;
  }, [existingTeams]);

  // Helper to get assigned teams for a manager
  const getManagerAssignedTeams = (mgr: UserProfileResponse) => {
    const byProfile = managerTeamsMap.get(mgr.id) || [];
    if (byProfile.length > 0) return byProfile;
    const byUser = managerTeamsMap.get(mgr.user_id) || [];
    if (byUser.length > 0) return byUser;
    if (mgr.email) return managerTeamsMap.get(mgr.email.toLowerCase()) || [];
    return [];
  };

  // Helper to get assigned teams for a teacher
  const getTeacherAssignedTeams = (tchr: UserProfileResponse) => {
    const byProfile = teacherTeamsMap.get(tchr.id) || [];
    if (byProfile.length > 0) return byProfile;
    const byUser = teacherTeamsMap.get(tchr.user_id) || [];
    if (byUser.length > 0) return byUser;
    if (tchr.email) return teacherTeamsMap.get(tchr.email.toLowerCase()) || [];
    return [];
  };

  // Selected manager & teacher details
  const selectedManager = useMemo(
    () => managers.find((m) => m.id === selectedManagerId || m.user_id === selectedManagerId) || null,
    [managers, selectedManagerId]
  );
  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId || t.user_id === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  // Filtered managers for picker
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

  // Filtered teachers for picker
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.specialization && t.specialization.toLowerCase().includes(q))
    );
  }, [teachers, teacherSearch]);

  // Filtered students for list
  const filteredStudents = useMemo(() => {
    let list = students;

    // Apply category tab filter
    if (studentFilter === "unassigned") {
      list = list.filter((s) => !s.batch_id);
    } else if (studentFilter === "selected") {
      list = list.filter((s) => selectedStudentIds.has(s.id) || selectedStudentIds.has(s.user_id));
    }

    // Apply text search
    const q = studentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.enrollment_no && s.enrollment_no.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q))
      );
    }

    return list;
  }, [students, studentFilter, studentSearch, selectedStudentIds]);

  // Toggle student selection
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all unassigned students
  const selectAllUnassigned = () => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      for (const s of students) {
        if (!s.batch_id) {
          next.add(s.id);
        }
      }
      return next;
    });
  };

  // Clear student selection
  const clearStudentSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError("Team name is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createBatch({
        name: name.trim(),
        department: department.trim() || null,
        status: "active",
        start_date: startDate || null,
        end_date: endDate || null,
        manager_id: selectedManagerId || null,
        teacher_id: selectedTeacherId || null,
        student_ids: Array.from(selectedStudentIds),
      });

      onTeamCreated(res.id);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create team. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        onClick={() => {
          setManagerDropdownOpen(false);
          setTeacherDropdownOpen(false);
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
            <div className="flex items-center gap-3.5">
              <span className="w-11 h-11 rounded-2xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-2xl">groups_3</span>
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Create New Team
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#4B2EF5]/10 text-[#4B2EF5]">
                    Batch
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up a new team, assign manager & teacher leads, and enroll interns.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-rose-500 text-lg shrink-0">error</span>
                <span className="flex-1 font-medium">{submitError}</span>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-rose-400 hover:text-rose-700 font-bold ml-auto"
                >
                  ✕
                </button>
              </div>
            )}

            {peopleError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">warning</span>
                <span className="flex-1 font-medium">{peopleError}</span>
              </div>
            )}

            {/* Section 1: Team Essentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-md bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center text-xs">
                  1
                </span>
                <span>Team Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Team Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Engineering Cohort Beta"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 focus:border-[#4B2EF5] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                  <div className="relative">
                    <input
                      type="text"
                      list="department-suggestions"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Engineering, Design..."
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 focus:border-[#4B2EF5] transition-all"
                    />
                    <datalist id="department-suggestions">
                      {COMMON_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Start Date <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 focus:border-[#4B2EF5] transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    End Date <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 focus:border-[#4B2EF5] transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Leadership Assignment */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Assign Leadership</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Badges like <span className="font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">+1, +2</span> show existing team assignments
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manager Selector */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Assign Manager</span>
                    {selectedManager && (
                      <button
                        type="button"
                        onClick={() => setSelectedManagerId("")}
                        className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear selection
                      </button>
                    )}
                  </label>

                  <div
                    onClick={() => {
                      setManagerDropdownOpen(!managerDropdownOpen);
                      setTeacherDropdownOpen(false);
                    }}
                    className={`min-h-11 px-3.5 py-2 rounded-xl border bg-slate-50 cursor-pointer flex items-center justify-between transition-all ${
                      managerDropdownOpen
                        ? "border-[#4B2EF5] ring-2 ring-[#4B2EF5]/15 bg-white"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {selectedManager ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={selectedManager.name || "Manager"} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {selectedManager.name}
                            </span>
                            {(() => {
                              const teams = getManagerAssignedTeams(selectedManager);
                              return teams.length > 0 ? (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200 shrink-0"
                                  title={`Already in ${teams.length} team(s): ${teams.map((t) => t.name).join(", ")}`}
                                >
                                  +{teams.length}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  Available
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {selectedManager.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-slate-400">badge</span>
                        <span>Select a manager (optional)</span>
                      </span>
                    )}

                    <span className="material-symbols-outlined text-slate-400 text-lg shrink-0 ml-2">
                      {managerDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </div>

                  {/* Manager Dropdown Panel */}
                  <AnimatePresence>
                    {managerDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden max-h-64 flex flex-col"
                      >
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <input
                            type="text"
                            value={managerSearch}
                            onChange={(e) => setManagerSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Search managers…"
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B2EF5]"
                            autoFocus
                          />
                        </div>

                        <div className="overflow-y-auto divide-y divide-slate-50 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedManagerId("");
                              setManagerDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                              !selectedManagerId ? "bg-[#4B2EF5]/5 text-[#4B2EF5] font-bold" : "text-slate-600"
                            }`}
                          >
                            <span>No manager (Leave unassigned)</span>
                            {!selectedManagerId && (
                              <span className="material-symbols-outlined text-base">check</span>
                            )}
                          </button>

                          {filteredManagers.map((mgr) => {
                            const isSelected = selectedManagerId === mgr.id || selectedManagerId === mgr.user_id;
                            const assignedTeams = getManagerAssignedTeams(mgr);
                            const count = assignedTeams.length;

                            return (
                              <button
                                key={mgr.id}
                                type="button"
                                onClick={() => {
                                  setSelectedManagerId(mgr.id);
                                  setManagerDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2.5 cursor-pointer ${
                                  isSelected ? "bg-[#4B2EF5]/5" : ""
                                }`}
                              >
                                <Avatar name={mgr.name || "Manager"} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-xs truncate ${
                                        isSelected ? "font-bold text-[#4B2EF5]" : "font-semibold text-slate-900"
                                      }`}
                                    >
                                      {mgr.name}
                                    </span>

                                    {/* The +1, +2 indicator right beside the name */}
                                    {count > 0 ? (
                                      <span
                                        className="inline-flex items-center px-1.5 py-0.2 rounded font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200 shrink-0"
                                        title={`Already in ${count} team(s): ${assignedTeams.map((t) => t.name).join(", ")}`}
                                      >
                                        +{count}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                        Available
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-mono truncate">
                                    {mgr.email} {mgr.department ? `· ${mgr.department}` : ""}
                                  </p>
                                  {count > 0 && (
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                      In: {assignedTeams.map((t) => t.name).join(", ")}
                                    </p>
                                  )}
                                </div>

                                {isSelected && (
                                  <span className="material-symbols-outlined text-[#4B2EF5] text-base shrink-0">
                                    check
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          {filteredManagers.length === 0 && (
                            <p className="p-3 text-center text-xs text-slate-400">
                              {isLoadingPeople ? "Loading managers…" : "No managers found."}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Teacher Selector */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Assign Teacher</span>
                    {selectedTeacher && (
                      <button
                        type="button"
                        onClick={() => setSelectedTeacherId("")}
                        className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear selection
                      </button>
                    )}
                  </label>

                  <div
                    onClick={() => {
                      setTeacherDropdownOpen(!teacherDropdownOpen);
                      setManagerDropdownOpen(false);
                    }}
                    className={`min-h-11 px-3.5 py-2 rounded-xl border bg-slate-50 cursor-pointer flex items-center justify-between transition-all ${
                      teacherDropdownOpen
                        ? "border-[#4B2EF5] ring-2 ring-[#4B2EF5]/15 bg-white"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {selectedTeacher ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={selectedTeacher.name || "Teacher"} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {selectedTeacher.name}
                            </span>
                            {(() => {
                              const teams = getTeacherAssignedTeams(selectedTeacher);
                              return teams.length > 0 ? (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded font-bold text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0"
                                  title={`Already in ${teams.length} team(s): ${teams.map((t) => t.name).join(", ")}`}
                                >
                                  +{teams.length}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  Available
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {selectedTeacher.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-slate-400">history_edu</span>
                        <span>Select a teacher (optional)</span>
                      </span>
                    )}

                    <span className="material-symbols-outlined text-slate-400 text-lg shrink-0 ml-2">
                      {teacherDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </div>

                  {/* Teacher Dropdown Panel */}
                  <AnimatePresence>
                    {teacherDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden max-h-64 flex flex-col"
                      >
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <input
                            type="text"
                            value={teacherSearch}
                            onChange={(e) => setTeacherSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Search teachers…"
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B2EF5]"
                            autoFocus
                          />
                        </div>

                        <div className="overflow-y-auto divide-y divide-slate-50 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeacherId("");
                              setTeacherDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                              !selectedTeacherId ? "bg-[#4B2EF5]/5 text-[#4B2EF5] font-bold" : "text-slate-600"
                            }`}
                          >
                            <span>No teacher (Leave unassigned)</span>
                            {!selectedTeacherId && (
                              <span className="material-symbols-outlined text-base">check</span>
                            )}
                          </button>

                          {filteredTeachers.map((tchr) => {
                            const isSelected = selectedTeacherId === tchr.id || selectedTeacherId === tchr.user_id;
                            const assignedTeams = getTeacherAssignedTeams(tchr);
                            const count = assignedTeams.length;

                            return (
                              <button
                                key={tchr.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTeacherId(tchr.id);
                                  setTeacherDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2.5 cursor-pointer ${
                                  isSelected ? "bg-[#4B2EF5]/5" : ""
                                }`}
                              >
                                <Avatar name={tchr.name || "Teacher"} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-xs truncate ${
                                        isSelected ? "font-bold text-[#4B2EF5]" : "font-semibold text-slate-900"
                                      }`}
                                    >
                                      {tchr.name}
                                    </span>

                                    {/* The +1, +2 indicator right beside the name */}
                                    {count > 0 ? (
                                      <span
                                        className="inline-flex items-center px-1.5 py-0.2 rounded font-bold text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0"
                                        title={`Already in ${count} team(s): ${assignedTeams.map((t) => t.name).join(", ")}`}
                                      >
                                        +{count}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                        Available
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-mono truncate">
                                    {tchr.email} {tchr.specialization ? `· ${tchr.specialization}` : ""}
                                  </p>
                                  {count > 0 && (
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                      In: {assignedTeams.map((t) => t.name).join(", ")}
                                    </p>
                                  )}
                                </div>

                                {isSelected && (
                                  <span className="material-symbols-outlined text-[#4B2EF5] text-base shrink-0">
                                    check
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          {filteredTeachers.length === 0 && (
                            <p className="p-3 text-center text-xs text-slate-400">
                              {isLoadingPeople ? "Loading teachers…" : "No teachers found."}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Section 3: Add Students / Learners */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-md bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Add Students / Interns</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 normal-case">
                    {selectedStudentIds.size} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllUnassigned}
                    className="text-[11px] font-semibold text-[#4B2EF5] hover:underline cursor-pointer"
                  >
                    Select unassigned
                  </button>
                  {selectedStudentIds.size > 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={clearStudentSelection}
                        className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear selected
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Filter pills & search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search interns by name, email, enrollment…"
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4B2EF5]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
                  {(["all", "unassigned", "selected"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStudentFilter(tab)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                        studentFilter === tab
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab === "selected" ? `Selected (${selectedStudentIds.size})` : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Students Scrollable Card List */}
              <div className="border border-slate-200/80 rounded-2xl bg-slate-50/50 p-2 max-h-56 overflow-y-auto space-y-1.5">
                {isLoadingPeople ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#4B2EF5] border-t-transparent rounded-full animate-spin" />
                    <span>Loading interns…</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No interns match your search or filter.
                  </div>
                ) : (
                  filteredStudents.map((std) => {
                    const isChecked = selectedStudentIds.has(std.id) || selectedStudentIds.has(std.user_id);
                    const isUnassigned = !std.batch_id;
                    const assignedTeam = std.batch_id
                      ? existingTeams.find((t) => t.id === std.batch_id)
                      : null;

                    return (
                      <div
                        key={std.id}
                        onClick={() => toggleStudent(std.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "border-[#4B2EF5] bg-white ring-1 ring-[#4B2EF5]/20 shadow-2xs"
                            : "border-slate-200/70 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="w-4 h-4 rounded text-[#4B2EF5] focus:ring-[#4B2EF5]/20 cursor-pointer accent-[#4B2EF5]"
                        />

                        <Avatar name={std.name || "Intern"} size="sm" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {std.name || "Unnamed intern"}
                            </span>
                            {std.enrollment_no && (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {std.enrollment_no}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {std.email || "No email"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          {isUnassigned ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Unassigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              In {assignedTeam?.name || "Another Team"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="h-10 px-5 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold transition-all shadow-md shadow-[#4B2EF5]/20 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating team…</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">group_add</span>
                    <span>Create Team</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

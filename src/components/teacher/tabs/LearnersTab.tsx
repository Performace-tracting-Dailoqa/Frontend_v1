"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherStudents,
  fetchUnassignedStudents,
  fetchTeacherBatches,
  updateStudentBatch,
  fetchStudentProfile,
  TeacherStudent,
  TeacherBatch,
} from "@/services/teacherService";

interface LearnersTabProps {
  onSelectStudent?: (student: TeacherStudent) => void;
}

export default function LearnersTab({ onSelectStudent }: LearnersTabProps) {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [unassigned, setUnassigned] = useState<TeacherStudent[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"assigned" | "unassigned" | "all">("assigned");

  // Profile modal state
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<TeacherStudent | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assignedList, unassignedList, batchList] = await Promise.all([
        fetchTeacherStudents().catch(() => []),
        fetchUnassignedStudents().catch(() => []),
        fetchTeacherBatches().catch(() => []),
      ]);
      setStudents(assignedList);
      setUnassigned(unassignedList);
      setBatches(batchList);
    } catch (err) {
      console.warn("Failed to load learners or batches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignBatch = async (studentId: string, newBatchId: string | null) => {
    setActionLoadingId(studentId);
    try {
      await updateStudentBatch(studentId, newBatchId);
      showToast(
        newBatchId ? "Learner successfully assigned to batch!" : "Learner removed from batch.",
        "success"
      );
      await loadData();
      if (selectedProfileStudent && selectedProfileStudent.id === studentId) {
        handleViewProfile({ ...selectedProfileStudent, batch_id: newBatchId });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update batch assignment";
      showToast(msg, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewProfile = async (student: TeacherStudent) => {
    setSelectedProfileStudent(student);
    setIsLoadingProfile(true);
    try {
      const details = await fetchStudentProfile(student.id);
      setProfileData(details);
    } catch (err) {
      console.warn("Failed to load profile details:", err);
      setProfileData(student);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const allStudents = [...students, ...unassigned.filter(u => !students.some(s => s.id === u.id))];

  const activeList =
    viewMode === "assigned"
      ? students
      : viewMode === "unassigned"
      ? unassigned
      : allStudents;

  const departments = Array.from(
    new Set(
      allStudents
        .map((s) => s.department)
        .filter((d): d is string => Boolean(d))
    )
  );

  const filteredStudents = activeList.filter((s) => {
    const nameMatch =
      (s.full_name || s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department || "").toLowerCase().includes(searchQuery.toLowerCase());
    const deptMatch =
      departmentFilter === "all" || s.department === departmentFilter;
    return nameMatch && deptMatch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {toastMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-sm font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header and Toggle */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Cohort Learner Directory</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Manage student cohort allocations, view comprehensive learner profiles, and launch appraisals.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-container p-1 rounded-xl border border-outline-variant/50 text-xs font-semibold flex-wrap">
          <button
            onClick={() => setViewMode("assigned")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "assigned"
                ? "bg-primary text-white shadow-2xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Assigned ({students.length})
          </button>
          <button
            onClick={() => setViewMode("unassigned")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "unassigned"
                ? "bg-primary text-white shadow-2xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Unassigned ({unassigned.length})
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "all"
                ? "bg-primary text-white shadow-2xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All Learners ({allStudents.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
          <input
            type="text"
            placeholder="Search learners by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-outline font-medium">Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-outline">Loading learners...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-outline mb-2">person_search</span>
            <p className="text-xs text-on-surface-variant font-medium">No learners found matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="py-3 px-4">Learner Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Batch Allocation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {filteredStudents.map((student) => {
                  const isActionLoading = actionLoadingId === student.id;
                  const currentBatch = batches.find((b) => b.id === student.batch_id);

                  return (
                    <tr key={student.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-on-surface flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {(student.full_name || student.name || "S")[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{student.full_name || student.name || "Student"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {student.id.slice(0, 8)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-outline">{student.email || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium">
                          {student.department || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={isActionLoading}
                            value={student.batch_id || ""}
                            onChange={(e) => handleAssignBatch(student.id, e.target.value || null)}
                            className="bg-surface-container border border-outline-variant/50 text-[11px] text-on-surface font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50"
                          >
                            <option value="">(Unassigned)</option>
                            {batches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                          {student.batch_id && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleAssignBatch(student.id, null)}
                              title="Remove from batch"
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {student.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewProfile(student)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface text-[11px] font-semibold border border-outline-variant/40 transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Profile</span>
                          </button>
                          {onSelectStudent && (
                            <button
                              onClick={() => onSelectStudent(student)}
                              className="px-3 py-1 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">rate_review</span>
                              <span>Evaluate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {selectedProfileStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full border border-outline-variant/50 p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-outline-variant/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase shadow-2xs">
                  {(selectedProfileStudent.full_name || selectedProfileStudent.name || "S")[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface font-headline">
                    {selectedProfileStudent.full_name || selectedProfileStudent.name || "Student Profile"}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {selectedProfileStudent.email || "No email available"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProfileStudent(null);
                  setProfileData(null);
                }}
                className="text-outline hover:text-on-surface text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {isLoadingProfile ? (
              <div className="py-12 text-center text-xs text-outline">Loading full profile details...</div>
            ) : (
              <div className="py-4 space-y-5">
                {/* Basic Meta Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/30">
                    <span className="text-[10px] text-outline font-semibold uppercase block">Enrollment No</span>
                    <span className="font-bold text-on-surface mt-0.5 block">
                      {profileData?.enrollment_no || "—"}
                    </span>
                  </div>
                  <div className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/30">
                    <span className="text-[10px] text-outline font-semibold uppercase block">Department</span>
                    <span className="font-bold text-on-surface mt-0.5 block">
                      {profileData?.department || "General"}
                    </span>
                  </div>
                  <div className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/30">
                    <span className="text-[10px] text-outline font-semibold uppercase block">Status</span>
                    <span className="font-bold text-emerald-700 capitalize mt-0.5 block">
                      {profileData?.status || "Active"}
                    </span>
                  </div>
                  <div className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/30">
                    <span className="text-[10px] text-outline font-semibold uppercase block">Batch Assigned</span>
                    <span className="font-bold text-primary mt-0.5 block">
                      {profileData?.batch_name || "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Batch Change Control inside Profile */}
                <div className="p-4 bg-surface-container/40 rounded-xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Batch Allocation</h4>
                    <p className="text-[11px] text-on-surface-variant">Change this student&apos;s batch directly</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedProfileStudent.batch_id || ""}
                      onChange={(e) => handleAssignBatch(selectedProfileStudent.id, e.target.value || null)}
                      className="bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="">(Unassigned)</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {selectedProfileStudent.batch_id && (
                      <button
                        onClick={() => handleAssignBatch(selectedProfileStudent.id, null)}
                        className="px-2.5 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* General Evaluations History */}
                <div>
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">analytics</span>
                    <span>Teacher Evaluations &amp; Appraisals</span>
                  </h4>
                  {profileData?.general_evaluations && profileData.general_evaluations.length > 0 ? (
                    <div className="space-y-2">
                      {profileData.general_evaluations.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-on-surface">
                              Score: {ev.total_score ?? "—"} / {ev.max_score ?? 100} ({ev.percentage ?? 0}%)
                            </div>
                            <div className="text-[11px] text-outline mt-0.5">
                              {ev.remarks || "No remarks entered"}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                            {ev.status || "Finalized"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-outline italic p-3 bg-surface-container/20 rounded-xl border border-dashed border-outline-variant/40">
                      No general evaluations recorded for this learner yet.
                    </p>
                  )}
                </div>

                {/* Workflow Tasks & Self-Grades */}
                <div>
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-indigo-600">assignment</span>
                    <span>Recent Assigned Tasks &amp; Submissions</span>
                  </h4>
                  {profileData?.workflow_tasks && profileData.workflow_tasks.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {profileData.workflow_tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40 text-xs flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-on-surface">{task.title}</div>
                            {task.submission_notes && (
                              <p className="text-[11px] text-indigo-700 bg-indigo-50/70 p-1.5 rounded mt-1">
                                <strong>Submission:</strong> {task.submission_notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {task.student_grade !== null && task.student_grade !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] block mb-1">
                                Self-Grade: {task.student_grade}/100
                              </span>
                            )}
                            <span className="capitalize text-[10px] font-semibold text-outline">
                              {task.status || "pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-outline italic p-3 bg-surface-container/20 rounded-xl border border-dashed border-outline-variant/40">
                      No workflow deliverables logged.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-outline-variant/40 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedProfileStudent(null);
                  setProfileData(null);
                }}
                className="px-4 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                Close
              </button>
              {onSelectStudent && (
                <button
                  onClick={() => {
                    const s = selectedProfileStudent;
                    setSelectedProfileStudent(null);
                    setProfileData(null);
                    onSelectStudent(s);
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">rate_review</span>
                  <span>Evaluate Learner</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

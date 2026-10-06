"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherStudents,
  fetchUnassignedStudents,
  fetchTeacherBatches,
  updateStudentBatch,
  TeacherStudent,
  TeacherBatch,
} from "@/services/teacherService";
import TeacherStudentAnalyticsModal from "../TeacherStudentAnalyticsModal";

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
  const [batchFilter, setBatchFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"all" | "assigned" | "unassigned">("all");

  // Selected student for full details dossier modal
  const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = useState<string | null>(null);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update batch assignment";
      showToast(msg, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Combine assigned and unassigned students without duplicates
  const allStudents = [...students, ...unassigned.filter((u) => !students.some((s) => s.id === u.id))];

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
    const q = searchQuery.toLowerCase();
    const nameMatch =
      (s.full_name || s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.enrollment_no || "").toLowerCase().includes(q) ||
      (s.department || "").toLowerCase().includes(q);

    const deptMatch = departmentFilter === "all" || s.department === departmentFilter;
    const batchMatch =
      batchFilter === "all" ||
      (batchFilter === "unassigned" ? !s.batch_id : s.batch_id === batchFilter);

    return nameMatch && deptMatch && batchMatch;
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
          <button onClick={() => setToastMessage(null)} className="text-sm font-bold opacity-60 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header and KPI Overview */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-xs mb-1">
            <span className="material-symbols-outlined text-base">groups</span>
            <span>STUDENT DIRECTORY &amp; PERFORMANCE</span>
          </div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Cohort Learner Directory ({allStudents.length})</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Click on any student to view their Japanese evaluation graphs, daily drills, attendance, and linguistic dossiers.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/50 text-xs font-semibold flex-wrap">
          <button
            onClick={() => setViewMode("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "all"
                ? "bg-[#4B2EF5] text-white shadow-2xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All Students ({allStudents.length})
          </button>
          <button
            onClick={() => setViewMode("assigned")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "assigned"
                ? "bg-[#4B2EF5] text-white shadow-2xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Assigned ({students.length})
          </button>
          <button
            onClick={() => setViewMode("unassigned")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "unassigned"
                ? "bg-[#4B2EF5] text-white shadow-2xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Unassigned ({unassigned.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
          <input
            type="text"
            placeholder="Search student by name, email, or enrollment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Batch Filter Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface">
            <span className="material-symbols-outlined text-sm text-[#4B2EF5]">school</span>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="bg-transparent text-xs text-on-surface font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              <option value="unassigned">Unassigned Only</option>
            </select>
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface">
            <span className="material-symbols-outlined text-sm text-[#4B2EF5]">domain</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-xs text-on-surface font-medium focus:outline-none cursor-pointer"
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
      </div>

      {/* Learners List Cards / Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-outline">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin mb-2">sync</span>
            <p>Loading students directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">person_search</span>
            <p className="text-sm font-semibold text-on-surface">No students found</p>
            <p className="text-xs text-on-surface-variant mt-1">Try clearing or adjusting your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="py-3.5 px-4">Learner</th>
                  <th className="py-3.5 px-4">Enrollment ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Cohort Batch</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {filteredStudents.map((student) => {
                  const isActionLoading = actionLoadingId === student.id;
                  const studentName = student.full_name || student.name || "Student";
                  const currentBatch = batches.find((b) => b.id === student.batch_id);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentForAnalytics(student.id)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#4B2EF5]/15 text-[#4B2EF5] flex items-center justify-center font-bold text-xs uppercase shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                            {studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#4B2EF5] transition-colors flex items-center gap-1.5">
                              <span>{studentName}</span>
                              <span className="material-symbols-outlined text-xs text-slate-400 group-hover:text-[#4B2EF5] opacity-0 group-hover:opacity-100 transition-opacity">
                                open_in_new
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{student.email || "No email"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-semibold text-slate-700 px-2 py-0.5 rounded bg-slate-100">
                          {student.enrollment_no || student.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-medium">
                          {student.department || "General"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
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

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          {student.status || "Active"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForAnalytics(student.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#4B2EF5]/10 hover:bg-[#4B2EF5] hover:text-white text-[#4B2EF5] text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">analytics</span>
                            <span>View Dossier</span>
                          </button>

                          {onSelectStudent && (
                            <button
                              type="button"
                              onClick={() => onSelectStudent(student)}
                              className="px-3 py-1.5 rounded-xl bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
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

      {/* Student Japanese Analytics & Full Particular Information Modal */}
      {selectedStudentForAnalytics && (
        <TeacherStudentAnalyticsModal
          studentId={selectedStudentForAnalytics}
          onClose={() => setSelectedStudentForAnalytics(null)}
          onNavigateToEvaluations={(studentId) => {
            setSelectedStudentForAnalytics(null);
            const found = allStudents.find((s) => s.id === studentId);
            if (found && onSelectStudent) {
              onSelectStudent(found);
            }
          }}
        />
      )}
    </div>
  );
}

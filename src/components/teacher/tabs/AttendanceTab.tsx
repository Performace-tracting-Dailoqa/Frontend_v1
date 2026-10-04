"use client";

import React, { useState, useEffect } from "react";
import { getAuthToken } from "@/utils/auth";
import { fetchTeacherBatches, fetchTeacherStudents, TeacherStudent, TeacherBatch } from "@/services/teacherService";

export default function AttendanceTab() {
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [track, setTrack] = useState<string>("Japanese");
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: "Present" | "Absent" | "Late" | "Excused"; remarks: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchTeacherBatches().catch(() => []),
      fetchTeacherStudents().catch(() => []),
    ])
      .then(([bList, sList]) => {
        setBatches(bList);
        setStudents(sList);

        // Initialize all learners as Present by default
        const initialMap: Record<string, { status: "Present" | "Absent" | "Late" | "Excused"; remarks: string }> = {};
        sList.forEach((s) => {
          initialMap[s.id] = { status: "Present", remarks: "" };
        });
        setAttendanceMap(initialMap);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredStudents =
    selectedBatchId === "all"
      ? students
      : students.filter((s) => s.batch_id === selectedBatchId);

  const handleStatusChange = (studentId: string, status: "Present" | "Absent" | "Late" | "Excused") => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || "",
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || "Present",
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: "Present" | "Absent") => {
    const updated = { ...attendanceMap };
    filteredStudents.forEach((s) => {
      updated[s.id] = {
        status,
        remarks: updated[s.id]?.remarks || "",
      };
    });
    setAttendanceMap(updated);
    showToast(`Marked all ${filteredStudents.length} learners as ${status}.`);
  };

  const handleSaveAttendance = async () => {
    if (filteredStudents.length === 0) {
      showToast("No learners to record attendance for.", "error");
      return;
    }

    setIsSaving(true);
    const token = getAuthToken();

    const records = filteredStudents.map((s) => ({
      student_id: s.id,
      status: attendanceMap[s.id]?.status || "Present",
      remarks: attendanceMap[s.id]?.remarks || "",
    }));

    try {
      const res = await fetch("/api/v1/teacher/attendance", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_date: sessionDate,
          track,
          records,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to record attendance");
      }

      showToast(`Successfully recorded attendance for ${records.length} learners on ${sessionDate}!`);
    } catch (err: any) {
      showToast(err.message || "Failed to save attendance", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {notice.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-500 hover:text-slate-800">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-title-lg font-bold text-on-surface">Daily Attendance Marking</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Record session presence, lates, and excused absences for your assigned Japanese and milestone learners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAll("Present")}
            className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/30 text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            <span>{isSaving ? "Saving..." : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* Filter / Session Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs text-xs">
        <div>
          <label className="font-semibold text-on-surface block mb-1">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
          />
        </div>

        <div>
          <label className="font-semibold text-on-surface block mb-1">Learning Track</label>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
          >
            <option value="Japanese">Japanese Language Track (JLPT/Speaking)</option>
            <option value="General">General Milestone Track</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-on-surface block mb-1">Cohort Batch</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
          >
            <option value="all">All Assigned Cohorts ({students.length} Learners)</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between font-bold text-sm text-on-surface">
          <span>Learner Roster</span>
          <span className="text-xs text-outline font-medium">{filteredStudents.length} Assigned Learners</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-outline">Loading learners...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-outline">No learners found in this batch.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="py-3 px-4">Learner Name</th>
                  <th className="py-3 px-4">Enrollment No</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {filteredStudents.map((s) => {
                  const currentRecord = attendanceMap[s.id] || { status: "Present", remarks: "" };
                  return (
                    <tr key={s.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-on-surface">{s.name}</div>
                        <div className="text-[10px] text-outline">{s.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-outline">{s.enrollment_no || "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(["Present", "Absent", "Late", "Excused"] as const).map((status) => {
                            const isSelected = currentRecord.status === status;
                            const colors: Record<string, string> = {
                              Present: isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                              Absent: isSelected
                                ? "bg-rose-600 text-white"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100",
                              Late: isSelected
                                ? "bg-amber-600 text-white"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100",
                              Excused: isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                            };
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(s.id, status)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${colors[status]}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={currentRecord.remarks}
                          onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                          placeholder="Optional remarks (e.g. excused doctor note)"
                          className="w-full max-w-xs px-2.5 py-1 rounded-lg border border-outline-variant bg-surface-container/20 text-on-surface text-[11px] focus:outline-primary"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

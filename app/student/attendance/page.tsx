"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import BorderBeam from "@/components/animations/BorderBeam";
import { apiJson } from "@/services/apiClient";

interface AttendanceRecord {
  id: string;
  student_id: string;
  track: string;
  session_date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  remarks?: string;
  created_at?: string;
}

interface AttendanceSummaryResponse {
  student_id: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
  records: AttendanceRecord[];
}

export default function StudentAttendancePage() {
  const [data, setData] = useState<AttendanceSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState<string>("All");

  useEffect(() => {
    apiJson<AttendanceSummaryResponse>("/api/v1/student/attendance")
      .then((resData) => setData(resData))
      .catch((err) => console.warn("Attendance fetch error:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const records = data?.records || [];
  const filteredRecords = trackFilter === "All" ? records : records.filter((r) => r.track === trackFilter);

  const statusBadges: Record<string, string> = {
    Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Absent: "bg-rose-50 text-rose-700 border-rose-200",
    Late: "bg-amber-50 text-amber-700 border-amber-200",
    Excused: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wider">
              Attendance &amp; Punctuality
            </span>
            <span className="text-body-sm text-slate-500 font-medium">Session Ledger</span>
          </div>
          <h1 className="font-headline font-bold text-3xl text-slate-900">
            My Attendance History
          </h1>
          <p className="text-body-md text-slate-600 max-w-2xl leading-relaxed mt-1">
            Official attendance records recorded by your Japanese and general mentors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center min-w-[130px] overflow-hidden">
            <BorderBeam size={100} duration={8} colorFrom="#10b981" colorTo="#06b6d4" borderWidth={1.5} />
            <span className="text-xs text-slate-500 block font-medium">Attendance Rate</span>
            <strong className="text-2xl font-mono font-bold text-emerald-700">
              {data ? <CountUp to={data.attendance_rate} decimals={1} duration={1.5} /> : "—"}%
            </strong>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center min-w-[120px]">
            <span className="text-xs text-slate-500 block font-medium">Total Sessions</span>
            <strong className="text-2xl font-mono font-bold text-slate-900">
              {data?.total_sessions ?? 0}
            </strong>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Present Sessions</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{data?.present_count ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Late Sessions</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{data?.late_count ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Excused Leaves</span>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">{data?.excused_count ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Unexcused Absences</span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{data?.absent_count ?? 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["All", "Japanese", "General"].map((track) => (
          <button
            key={track}
            onClick={() => setTrackFilter(track)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              trackFilter === track
                ? "bg-primary text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {track} Sessions
          </button>
        ))}
      </div>

      {/* Attendance Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Session Attendance Roster</h3>
          <span className="text-xs text-slate-500">{filteredRecords.length} Entries</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">event_busy</span>
            <p className="text-xs text-slate-500">No attendance sessions recorded yet for this track.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Mentor Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.session_date}</td>
                    <td className="py-3 px-4 font-semibold text-primary">{r.track} Track</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[r.status] || "bg-slate-100 text-slate-700"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-sm truncate">{r.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

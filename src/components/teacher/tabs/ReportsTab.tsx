"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherStudents,
  fetchStudentGeneralEvaluation,
  fetchTeacherBatches,
  TeacherStudent,
  GeneralEvaluation,
  TeacherBatch,
} from "@/services/teacherService";

interface StudentReportRow {
  student: TeacherStudent;
  evaluation: GeneralEvaluation | null;
}

export default function ReportsTab() {
  const [rows, setRows] = useState<StudentReportRow[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadReportData() {
      setIsLoading(true);
      try {
        const [studentList, batchList] = await Promise.all([
          fetchTeacherStudents().catch(() => []),
          fetchTeacherBatches().catch(() => []),
        ]);
        setBatches(batchList);

        const rowData: StudentReportRow[] = await Promise.all(
          studentList.map(async (student) => {
            const evaluation = await fetchStudentGeneralEvaluation(student.id).catch(() => null);
            return { student, evaluation };
          })
        );
        setRows(rowData);
      } catch (err) {
        console.warn("Failed to compile teacher reports:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReportData();
  }, []);

  const handleExportCSV = () => {
    if (rows.length === 0) {
      setExportNotice("No learner records available to export.");
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    let csv = "data:text/csv;charset=utf-8,";
    csv += "Student ID,Full Name,Email,Department,Batch,Evaluation Percentage,Status,Evaluated Date\n";

    rows.forEach(({ student, evaluation }) => {
      const name = (student.full_name || student.name || "Student").replace(/,/g, " ");
      const email = student.email || "";
      const dept = student.department || "";
      const batch = student.batch_name || student.batch_id || "";
      const pct = evaluation?.percentage !== null && evaluation?.percentage !== undefined ? `${evaluation.percentage}%` : "Pending";
      const status = evaluation?.status || "Unevaluated";
      const date = evaluation?.evaluated_at || "";

      csv += `"${student.id}","${name}","${email}","${dept}","${batch}","${pct}","${status}","${date}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `teacher_cohort_evaluation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("CSV report exported successfully.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  const scoredCount = rows.filter((r) => r.evaluation?.percentage !== null && r.evaluation?.percentage !== undefined).length;
  const avgCohortScore =
    scoredCount > 0
      ? Math.round(
          rows.reduce((acc, curr) => acc + (curr.evaluation?.percentage || 0), 0) / scoredCount
        )
      : 0;

  return (
    <div className="space-y-6">
      {exportNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-slate-500 hover:text-slate-800">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header and Export Action */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Cohort Reports & Analytics Exporter</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Export comprehensive learner evaluation scores, attainment percentages, and batch metrics.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span>Download Cohort CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Total Learners</span>
          <div className="text-2xl font-bold font-headline text-on-surface mt-2">{rows.length}</div>
          <p className="text-[11px] text-outline mt-1">Across {batches.length} batches</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Evaluated Learners</span>
          <div className="text-2xl font-bold font-headline text-primary mt-2">{scoredCount}</div>
          <p className="text-[11px] text-outline mt-1">
            {rows.length > 0 ? Math.round((scoredCount / rows.length) * 100) : 0}% completion
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Cohort Mean Attainment</span>
          <div className="text-2xl font-bold font-headline text-emerald-600 mt-2">
            {avgCohortScore > 0 ? `${avgCohortScore}%` : "Pending"}
          </div>
          <p className="text-[11px] text-outline mt-1">Average milestone score</p>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-outline">Compiling report table...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-outline">No cohort data available to report.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="py-3 px-4">Learner Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Attainment</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {rows.map(({ student, evaluation }) => (
                  <tr key={student.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-on-surface">
                      {student.full_name || student.name || "Student"}
                    </td>
                    <td className="py-3 px-4 text-outline">{student.email || "—"}</td>
                    <td className="py-3 px-4">{student.department || "General"}</td>
                    <td className="py-3 px-4 text-primary font-medium">{student.batch_name || "Assigned"}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">
                      {evaluation?.percentage !== null && evaluation?.percentage !== undefined ? `${evaluation.percentage}%` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          evaluation?.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {evaluation?.status || "Pending"}
                      </span>
                    </td>
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

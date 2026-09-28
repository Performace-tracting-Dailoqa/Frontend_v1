"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import Magnet from "@/components/animations/Magnet";
import { getAuthSession, fetchMe, UserDetail } from "@/utils/auth";
import {
  fetchStudentTasks,
  fetchStudentEvaluations,
  StudentTaskItem,
  StudentEvaluationItem,
} from "@/services/workflowService";

export default function StudentReportsPage() {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [tasks, setTasks] = useState<StudentTaskItem[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState("Current Cycle (2026)");
  const [reportType, setReportType] = useState("full");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [me, taskList, evalRes] = await Promise.all([
          fetchMe().catch(() => getAuthSession()?.user || null),
          fetchStudentTasks().catch(() => ({ items: [], total: 0, page: 1, page_size: 50 })),
          fetchStudentEvaluations().catch(() => ({ items: [], total: 0 })),
        ]);
        if (me) setUser(me);
        setTasks(taskList.items || []);
        setEvaluations(evalRes.items || []);
      } catch (err) {
        console.warn("Failed to load student report data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "todo");

  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const scoredEvaluations = evaluations.filter((e) => e.percentage !== null && e.percentage !== undefined);
  const compositeScore =
    scoredEvaluations.length > 0
      ? (
          scoredEvaluations.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
          scoredEvaluations.length /
          20
        ).toFixed(2)
      : null;

  const handleExportCSV = () => {
    if (tasks.length === 0 && evaluations.length === 0) {
      setExportNotice("No task or evaluation records available to export.");
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,ID,Title / Evaluation,Status,Score / Details,Date\n";

    tasks.forEach((t) => {
      const cleanTitle = (t.title || "").replace(/,/g, " ");
      csvContent += `Task,${t.id},"${cleanTitle}",${t.status},${t.priority || "Normal"},${t.created_at || ""}\n`;
    });

    evaluations.forEach((e) => {
      const cleanTitle = (e.task_title || e.workflow_title || "General Milestone").replace(/,/g, " ");
      const scoreStr = e.percentage !== null ? `${e.percentage}%` : "Pending";
      csvContent += `Evaluation,${e.id},"${cleanTitle}",${e.evaluation_type},${scoreStr},${e.evaluated_at || ""}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `performance_report_${(user?.name || "student").toLowerCase().replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("CSV report generated and downloaded successfully.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="w-full pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline font-bold text-3xl text-slate-900">Performance Reports</h1>
          <p className="text-body-md text-slate-600 mt-1">
            Generate, inspect, and export your dynamic performance dossier and task milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Magnet padding={20} magnetStrength={3}>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-slate-500">download</span>
              Export CSV
            </button>
          </Magnet>
          <Magnet padding={20} magnetStrength={3}>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-primary hover:bg-[#4326dd] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Print / Save PDF
            </button>
          </Magnet>
        </div>
      </div>

      {/* Export Notification Banner */}
      {exportNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Control Bar Card */}
      <div className="bg-white border border-surface-container-highest/60 rounded-2xl p-6 mb-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-5 flex-1">
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Evaluation Cycle
              </label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="Current Cycle (2026)">Active Cohort Cycle (2026)</option>
                <option value="All Time">All Active Records</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Report Scope
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="full">Full Appraisal Dossier</option>
                <option value="tasks">Assigned Task Deliverables</option>
                <option value="evaluations">Evaluation Rubrics & Feedback</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-on-surface-variant self-end md:self-center">
            Active Student: <span className="font-bold text-on-surface">{user?.name || "Student"}</span> (
            {user?.email || "Authenticated"})
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            <CountUp to={tasks.length} duration={1} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Live sprint deliverables</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            <CountUp to={completedTasks.length} duration={1} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{taskCompletionRate}% completion rate</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluations Logged</span>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            <CountUp to={evaluations.length} duration={1} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{scoredEvaluations.length} scored with rubrics</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Composite Index</span>
          <div className="text-2xl font-bold text-primary mt-2">
            {compositeScore ? `${compositeScore} / 5.0` : "Pending"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Average evaluation performance</p>
        </div>
      </div>

      {/* Printable Report Dossier Card */}
      <div className="bg-white border border-surface-container-highest/60 rounded-2xl p-8 shadow-xs">
        {/* Printable Report Header */}
        <div className="border-b pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              alt="Dailoqa"
              src="/dailoqa_logo.png"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <div className="border-l border-slate-300 pl-3">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                Trainee Performance Report
              </span>
              <p className="text-[11px] text-slate-500">Official Appraisal Dossier · Live Dynamic Record</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <p className="font-bold text-on-surface">Student: {user?.name || "Student Trainee"}</p>
            <p className="text-slate-500">Email: {user?.email || "Authenticated"}</p>
            <p className="text-slate-500">Cycle: {selectedQuarter}</p>
          </div>
        </div>

        {/* Section A: Task Deliverables Summary */}
        <div className="mb-8">
          <h3 className="font-headline font-bold text-base text-on-surface mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs flex items-center justify-center font-bold">
              A
            </span>
            Task Deliverables & Milestone Pipeline
          </h3>

          {tasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">assignment_late</span>
              <p className="text-xs text-slate-600 font-medium">No tasks currently assigned to your profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Task Title</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Created Date</th>
                    <th className="py-2.5 px-4 text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{task.title}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            task.priority === "urgent" || task.priority === "high"
                              ? "bg-rose-50 text-rose-700"
                              : task.priority === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority || "Normal"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            task.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : task.status === "in_progress"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {task.created_at ? new Date(task.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-slate-900">
                      Total Deliverables Completion
                    </td>
                    <td colSpan={3} className="py-3 px-4 text-right text-primary text-sm">
                      {completedTasks.length} / {tasks.length} Completed ({taskCompletionRate}%)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Section B: Official Evaluations & Rubrics */}
        <div>
          <h3 className="font-headline font-bold text-base text-on-surface mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs flex items-center justify-center font-bold">
              B
            </span>
            Official Evaluations & Qualitative Feedback
          </h3>

          {evaluations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">rate_review</span>
              <p className="text-xs text-slate-600 font-medium">No formal evaluations have been published yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((ev) => (
                <div key={ev.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {ev.task_title || ev.workflow_title || "General Milestone Evaluation"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Evaluator: {ev.evaluator_name || "Manager / Mentor"} · Type: {ev.evaluation_type}
                        {ev.evaluated_at && ` · ${new Date(ev.evaluated_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary">
                        {ev.percentage !== null && ev.percentage !== undefined ? `${ev.percentage}%` : "Pending"}
                      </span>
                    </div>
                  </div>

                  {ev.remarks && (
                    <div className="mb-3 text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-700">
                      <span className="font-semibold text-slate-900">Evaluator Remarks: </span>
                      {ev.remarks}
                    </div>
                  )}

                  {ev.metrics && ev.metrics.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {ev.metrics.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-600 truncate max-w-[150px]">{m.name}</span>
                          <span className="font-bold text-slate-900">
                            {m.score} / {m.max_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

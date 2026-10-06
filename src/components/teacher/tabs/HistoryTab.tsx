"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  fetchTeacherEvaluationHistory,
  fetchTeacherBatches,
  TeacherEvaluationHistoryItem,
  TeacherBatch,
} from "@/services/teacherService";
import { shortDate } from "@/utils/date";

export default function HistoryTab() {
  const [history, setHistory] = useState<TeacherEvaluationHistoryItem[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedJlpt, setSelectedJlpt] = useState<string>("all");

  // Audit Modal State
  const [selectedEvalForModal, setSelectedEvalForModal] = useState<TeacherEvaluationHistoryItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [historyData, batchList] = await Promise.all([
        fetchTeacherEvaluationHistory(),
        fetchTeacherBatches().catch(() => []),
      ]);
      setHistory(historyData);
      setBatches(batchList);
    } catch (err) {
      console.warn("Failed to load evaluation history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered evaluation history records
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch = search.trim()
        ? item.student_name.toLowerCase().includes(search.toLowerCase()) ||
          item.student_email.toLowerCase().includes(search.toLowerCase()) ||
          (item.enrollment_no && item.enrollment_no.toLowerCase().includes(search.toLowerCase())) ||
          item.evaluation_title.toLowerCase().includes(search.toLowerCase()) ||
          (item.feedback && item.feedback.toLowerCase().includes(search.toLowerCase()))
        : true;

      const matchesBatch = selectedBatchId === "all" ? true : item.batch_id === selectedBatchId;
      const matchesType = selectedType === "all" ? true : item.evaluation_type === selectedType;
      const matchesJlpt = selectedJlpt === "all" ? true : item.jlpt_level === selectedJlpt;

      return matchesSearch && matchesBatch && matchesType && matchesJlpt;
    });
  }, [history, search, selectedBatchId, selectedType, selectedJlpt]);

  // KPI calculations
  const totalSessions = history.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(history.reduce((acc, h) => acc + (h.percentage || 0), 0) / totalSessions)
      : 0;
  const totalRubrics = history.reduce((acc, h) => acc + (h.metrics?.length || 0), 0);

  const getGradePill = (pct: number) => {
    if (pct >= 90) return { label: "Grade S / 優", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (pct >= 80) return { label: "Grade A / 良", color: "bg-teal-50 text-teal-700 border-teal-200" };
    if (pct >= 70) return { label: "Grade B / 可", color: "bg-blue-50 text-blue-700 border-blue-200" };
    if (pct >= 60) return { label: "Grade C / 合格", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Grade D / 要復習", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] tracking-wide uppercase">
              Audit &amp; Compliance Ledger
            </span>
            <span className="text-xs text-outline font-medium">評価履歴・監査台帳</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">
            Japanese Evaluation Audit History
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Complete longitudinal audit ledger of Japanese language assessments, category rubric metrics, and finalized scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Total Recorded Evals</span>
          <div className="text-2xl font-bold font-headline text-on-surface mt-2">{totalSessions}</div>
          <p className="text-[11px] text-outline mt-1">Across all learner cohorts</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Average Cohort Attainment</span>
          <div className="text-2xl font-bold font-headline text-primary mt-2">{avgScore}%</div>
          <p className="text-[11px] text-emerald-600 font-medium">Mean Japanese Score</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Rubric Criteria Audited</span>
          <div className="text-2xl font-bold font-headline text-indigo-600 mt-2">{totalRubrics}</div>
          <p className="text-[11px] text-outline mt-1">Granular competency points</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Active JLPT Curriculum</span>
          <div className="text-2xl font-bold font-headline text-emerald-600 mt-2">JLPT N5 - N3</div>
          <p className="text-[11px] text-outline mt-1">Japanese Track Cohorts</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
              search
            </span>
            <input
              type="text"
              placeholder="Search evaluation records by learner name, email, ID, or assessment title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Batch Filter */}
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Cohort Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Assessment Types</option>
              <option value="daily">Daily Drill (日々のドリル)</option>
              <option value="milestone">Milestone Exam (中間・期末試験)</option>
              <option value="oral">Oral / Keigo (口頭試問)</option>
              <option value="quiz">Speed Quiz (小テスト)</option>
            </select>

            {/* JLPT Level Filter */}
            <select
              value={selectedJlpt}
              onChange={(e) => setSelectedJlpt(e.target.value)}
              className="px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All JLPT Levels</option>
              <option value="N5">JLPT N5</option>
              <option value="N4">JLPT N4</option>
              <option value="N3">JLPT N3</option>
              <option value="N2">JLPT N2</option>
              <option value="N1">JLPT N1</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Records Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-outline">
            <span className="material-symbols-outlined text-3xl animate-spin mb-2">progress_activity</span>
            <p>Loading Japanese evaluation audit ledger...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-16 text-center text-xs text-outline border-dashed">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">history_edu</span>
            <h4 className="font-bold text-sm text-on-surface">No Evaluation Records Found</h4>
            <p className="mt-1">
              {history.length === 0
                ? "No Japanese evaluations recorded yet. Evaluate learners in the Evaluations Tab to populate this ledger."
                : "No records match the active filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="py-3.5 px-4">Learner &amp; Cohort</th>
                  <th className="py-3.5 px-4">Assessment Title</th>
                  <th className="py-3.5 px-4">Level &amp; Type</th>
                  <th className="py-3.5 px-4">Skill Category Attainment</th>
                  <th className="py-3.5 px-4 text-right">Score &amp; Grade</th>
                  <th className="py-3.5 px-4">Date Evaluated</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {filteredHistory.map((item) => {
                  const grade = getGradePill(item.percentage);
                  const initials = (item.student_name || "ST")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={item.id} className="hover:bg-surface-container/40 transition-colors">
                      {/* Learner & Cohort */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{item.student_name}</p>
                            <p className="text-[11px] text-outline font-mono">
                              {item.enrollment_no ? `ID: ${item.enrollment_no} • ` : ""}
                              {item.batch_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Assessment Title */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-bold text-on-surface truncate">{item.evaluation_title}</p>
                        {item.feedback ? (
                          <p className="text-[11px] text-outline italic truncate">&quot;{item.feedback}&quot;</p>
                        ) : (
                          <p className="text-[11px] text-outline">Standard drill rubric</p>
                        )}
                      </td>

                      {/* Level & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                            {item.jlpt_level || "N5"}
                          </span>
                          <span className="text-[11px] text-on-surface capitalize">
                            {item.evaluation_type}
                          </span>
                        </div>
                      </td>

                      {/* Skill Category Breakdown */}
                      <td className="py-3.5 px-4">
                        {item.category_scores && Object.keys(item.category_scores).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(item.category_scores).map(([cat, score]) => (
                              <span
                                key={cat}
                                className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-medium text-on-surface border border-outline-variant/30"
                              >
                                {cat}: <strong>{Math.round(score)}%</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-outline text-[11px]">
                            {item.metrics?.length || 5} rubric criteria
                          </span>
                        )}
                      </td>

                      {/* Score & Grade */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-sm text-primary">
                          {item.percentage}%
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${grade.color}`}>
                          {grade.label}
                        </span>
                      </td>

                      {/* Date Evaluated */}
                      <td className="py-3.5 px-4 text-outline font-mono text-[11px]">
                        {shortDate(item.evaluation_date)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedEvalForModal(item)}
                          className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-xl border border-outline-variant/40 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                          <span>Scorecard</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Scorecard Detail Modal */}
      {selectedEvalForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedEvalForModal.jlpt_level} Japanese Assessment
                  </span>
                  <span className="text-xs text-slate-400 capitalize">• {selectedEvalForModal.evaluation_type} Drill</span>
                </div>
                <h3 className="text-lg font-bold font-headline text-slate-900 mt-1">
                  {selectedEvalForModal.evaluation_title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Learner: <strong className="text-slate-800">{selectedEvalForModal.student_name}</strong> ({selectedEvalForModal.batch_name}) • Evaluated on: {selectedEvalForModal.evaluation_date}
                </p>
              </div>

              <button
                onClick={() => setSelectedEvalForModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Score Overview Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-indigo-700">Attained Percentage</span>
                <p className="text-2xl font-bold font-mono text-indigo-950 mt-0.5">{selectedEvalForModal.percentage}%</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Total Points</span>
                <p className="text-2xl font-bold font-mono text-emerald-950 mt-0.5">
                  {selectedEvalForModal.total_score ?? selectedEvalForModal.percentage} / {selectedEvalForModal.max_score || 100}
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-[10px] uppercase font-bold text-purple-700">Attendance Score</span>
                <p className="text-2xl font-bold font-mono text-purple-950 mt-0.5">
                  {selectedEvalForModal.attendance_score}%
                </p>
              </div>
            </div>

            {/* Rubric Criteria Breakdown */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Granular Rubric Criteria ({selectedEvalForModal.metrics?.length || 0})
              </h4>

              {selectedEvalForModal.metrics && selectedEvalForModal.metrics.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {selectedEvalForModal.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{m.category}:</span>
                          <span className="text-slate-700 font-medium">{m.name}</span>
                          {m.proficiency_level && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                              {m.proficiency_level}
                            </span>
                          )}
                        </div>
                        {m.remarks && <p className="text-[11px] text-slate-500 italic mt-0.5">&quot;{m.remarks}&quot;</p>}
                      </div>

                      <div className="font-mono font-bold text-indigo-700 text-xs shrink-0">
                        {m.score} / {m.full_score} pts ({Math.round((m.score / m.full_score) * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Standard rubric applied: {selectedEvalForModal.percentage}% total attainment.
                </div>
              )}
            </div>

            {/* Mentor Feedback */}
            {selectedEvalForModal.feedback && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-[10px] uppercase text-slate-400 block tracking-wider">Mentor Qualitative Feedback:</span>
                <p className="italic text-slate-800 leading-relaxed">&quot;{selectedEvalForModal.feedback}&quot;</p>
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                Audit Record ID: {selectedEvalForModal.id.slice(0, 8).toUpperCase()}
              </span>

              <button
                type="button"
                onClick={() => setSelectedEvalForModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

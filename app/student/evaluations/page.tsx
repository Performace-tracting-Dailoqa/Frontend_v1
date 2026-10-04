"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import BorderBeam from "@/components/animations/BorderBeam";
import { fetchStudentEvaluations, StudentEvaluationItem } from "@/services/workflowService";

export default function StudentEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<StudentEvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<StudentEvaluationItem | null>(null);

  useEffect(() => {
    fetchStudentEvaluations()
      .then((res) => {
        setEvaluations(res.items || []);
        if (res.items && res.items.length > 0) {
          setSelectedEvaluation(res.items[0]);
        }
      })
      .catch((err) => console.warn("Failed to load student evaluations:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const scoredEvaluations = evaluations.filter((e) => e.percentage !== null && e.percentage !== undefined);
  const avgPercentage =
    scoredEvaluations.length > 0
      ? Math.round(
          scoredEvaluations.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / scoredEvaluations.length
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">
              Performance Dossier
            </span>
            <span className="text-body-sm text-slate-500 font-medium">Evaluations &amp; Feedback</span>
          </div>
          <h1 className="font-headline font-bold text-3xl text-slate-900">
            My Performance Evaluations
          </h1>
          <p className="text-body-md text-slate-600 max-w-2xl leading-relaxed mt-1">
            Review detailed rubrics, manager task reviews, Japanese language appraisals, and mentor feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center min-w-[130px] overflow-hidden">
            <BorderBeam size={100} duration={8} colorFrom="#10b981" colorTo="#3b82f6" borderWidth={1.5} />
            <span className="text-xs text-slate-500 block font-medium">Average Score</span>
            <strong className="text-2xl font-mono font-bold text-emerald-700">
              {avgPercentage !== null ? (
                <>
                  <CountUp to={avgPercentage} decimals={0} duration={1.5} />%
                </>
              ) : (
                "—"
              )}
            </strong>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center min-w-[130px]">
            <span className="text-xs text-slate-500 block font-medium">Total Appraisals</span>
            <strong className="text-2xl font-mono font-bold text-primary">
              {evaluations.length}
            </strong>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : evaluations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">verified</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-headline">No Evaluations Recorded Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Once your manager or teacher evaluates your submitted tasks and language milestones, your scorecards will be published here.
          </p>
          <Link
            href="/student/dashboard"
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
          >
            <span>View Assigned Tasks</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evaluations List (Left Column) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Scorecards ({evaluations.length})
            </h3>
            {evaluations.map((ev) => {
              const isSelected = selectedEvaluation?.id === ev.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvaluation(ev)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-primary shadow-sm ring-1 ring-primary"
                      : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ev.evaluation_type === "workflow"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {ev.evaluation_type === "workflow" ? "Manager Task" : "Language & Milestone"}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {ev.percentage !== null && ev.percentage !== undefined ? `${ev.percentage}%` : "Pending"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{ev.task_title}</h4>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>Evaluator: {ev.evaluator_name}</span>
                    <span>{ev.evaluated_at ? new Date(ev.evaluated_at).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evaluation Details & Rubrics (Right Column) */}
          {/* Evaluation Details & Side-by-Side Comparison (Right Column) */}
          <div className="lg:col-span-2">
            {selectedEvaluation && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                      {selectedEvaluation.evaluation_type === "workflow"
                        ? "Workflow Deliverable Review"
                        : "Milestone Assessment"}
                    </span>
                    <h2 className="text-2xl font-bold font-headline text-slate-900">
                      {selectedEvaluation.task_title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Evaluated by <strong className="text-slate-800">{selectedEvaluation.evaluator_name}</strong>
                      {selectedEvaluation.evaluated_at && (
                        <> on {new Date(selectedEvaluation.evaluated_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      <span>Print Scorecard</span>
                    </button>
                    <div className="text-right p-3.5 bg-emerald-50 border border-emerald-200/60 rounded-2xl shrink-0">
                      <span className="text-[11px] text-emerald-800 block font-medium">Final Attainment</span>
                      <div className="text-2xl font-bold font-headline text-emerald-700">
                        {selectedEvaluation.percentage !== null && selectedEvaluation.percentage !== undefined
                          ? `${selectedEvaluation.percentage}%`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BRD §7.3: Side-by-Side Self vs Evaluator Score Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Self-Evaluation */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span>My Self-Evaluation</span>
                      </span>
                      <span className="text-xs font-bold text-indigo-900">
                        {selectedEvaluation.total_score !== null ? `${Math.min(100, Math.round(Number(selectedEvaluation.total_score)))}%` : "Submitted"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1 font-medium">Self-Reflections &amp; Notes:</span>
                      <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-indigo-100">
                        &quot;Submitted all deliverables adhering to task criteria and standards.&quot;
                      </p>
                    </div>
                  </div>

                  {/* Right: Evaluator Review */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>{selectedEvaluation.evaluator_name}&apos;s Review</span>
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {selectedEvaluation.percentage !== null ? `${selectedEvaluation.percentage}%` : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1 font-medium">Evaluator Feedback:</span>
                      <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200/60">
                        {selectedEvaluation.remarks ? `"${selectedEvaluation.remarks}"` : "No written remarks recorded."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rubric Metrics Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Evaluation Criteria &amp; Metric Rubrics
                  </h4>

                  {selectedEvaluation.metrics.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Overall score assigned directly without sub-metric weightages.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-2xl overflow-hidden">
                      {selectedEvaluation.metrics.map((metric) => (
                        <div key={metric.id} className="p-4 bg-white flex items-center justify-between gap-4">
                          <div>
                            <div className="font-semibold text-sm text-slate-900">{metric.name}</div>
                            {metric.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{metric.description}</p>
                            )}
                            {metric.weightage && (
                              <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                                Weight: {metric.weightage}%
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold font-mono text-slate-900">
                              {metric.score !== null && metric.score !== undefined ? metric.score : "—"}
                            </span>
                            <span className="text-xs text-slate-400 font-mono"> / {metric.full_score} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import BorderBeam from "@/components/animations/BorderBeam";
import Magnet from "@/components/animations/Magnet";

interface RubricItem {
  id: string;
  name: string;
  desc: string;
  score: number;
}

export default function StudentEvaluationsPage() {
  const [rubrics, setRubrics] = useState<RubricItem[]>([]);

  const [reflectionText, setReflectionText] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const handleScoreChange = (id: string, newScore: number) => {
    setRubrics((prev) => prev.map((r) => (r.id === id ? { ...r, score: newScore } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-space-lg">
      
      {/* ========================================================= */}
      {/* BANNER                                                    */}
      {/* ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md bg-white p-6 sm:p-space-xl rounded-3xl border border-slate-200/80 shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-label-sm font-bold rounded-lg uppercase tracking-wider">
              Formal Appraisal Gate
            </span>
            <span className="text-body-sm text-slate-500 font-medium">Q3 2026 Cycle</span>
          </div>
          <h1 className="font-headline font-bold text-headline-lg text-slate-900">
            Performance Evaluations &amp; Dossier
          </h1>
          <p className="text-body-md text-slate-600 max-w-2xl leading-relaxed mt-1">
            Review mentor rubrics, submit your formal quarterly self-reflection, and monitor institutional accreditation eligibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-center overflow-hidden">
            <BorderBeam size={100} duration={8} colorFrom="#10b981" colorTo="#3b82f6" borderWidth={1.5} />
            <span className="text-xs text-slate-500 block font-medium">Composite Score</span>
            <strong className="text-headline-sm font-mono font-bold text-emerald-700">
              <CountUp to={96.4} decimals={1} duration={1.8} /> / 100
            </strong>
          </div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-center"
          >
            <span className="text-xs text-slate-500 block font-medium">Accreditation Tier</span>
            <strong className="text-headline-sm font-mono font-bold text-primary">NAAC A++</strong>
          </motion.div>
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* EVALUATION CYCLE STATUS BAR                               */}
      {/* ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-dashed border-outline-variant/60 shadow-xs text-center flex flex-col justify-center items-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">api</span>
        </div>
        <h2 className="text-headline-sm font-bold text-slate-900 mb-2">Appraisal Lifecycle</h2>
        <p className="text-body-sm text-slate-500 max-w-sm mb-4">
          Backend Developer: Integrate the student's evaluation stages and mentor approval status here.
        </p>
        <div className="inline-flex flex-col gap-2 text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
          <code className="text-xs text-slate-600 font-mono">GET /api/v1/student/evaluations/stages</code>
          <span className="text-[11px] text-slate-500 mt-1 block">Expected data: Stages with completion status and mentor notes.</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SELF EVALUATION FORM                                      */}
      {/* ========================================================= */}
      <div className="bg-white p-6 sm:p-space-lg rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <h2 className="font-headline font-bold text-headline-sm text-slate-900">
              Self Evaluation Rubrics
            </h2>
            <p className="text-body-sm text-slate-500">
              Rate your own performance against institutional standards before final appraisal sign-off
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-primary bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Rubric Cycle 2026
          </span>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3"
            >
              <span className="material-symbols-outlined text-5xl text-emerald-700 animate-bounce">verified</span>
              <h3 className="text-headline-md font-bold text-emerald-900">Self Evaluation Submitted!</h3>
              <p className="text-body-md text-emerald-800 max-w-lg mx-auto">
                Your self-appraisal score and reflection dossier have been locked and submitted to the Academic Dean and Department Review Committee.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSubmitted(false)}
                className="mt-4 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-label-md font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Modify Submission
              </motion.button>
            </motion.div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {rubrics.map((r) => (
                <div
                  key={r.id}
                  className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-surface-container-highest/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex-1">
                    <h4 className="text-body-md font-bold text-on-surface mb-1">{r.name}</h4>
                    <p className="text-body-sm text-on-surface-variant">{r.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleScoreChange(r.id, star)}
                        className={`w-9 h-9 rounded-xl border text-sm font-bold font-mono transition-all flex items-center justify-center ${
                          star <= r.score
                            ? "bg-primary text-on-primary border-primary shadow-xs"
                            : "bg-surface-container text-on-surface-variant border-surface-container-highest hover:bg-surface-container-high"
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                    <span className="text-xs font-mono text-on-surface font-bold ml-2">
                      {r.score} / 5
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reflection Textarea */}
            <div>
              <label className="text-body-md font-bold text-on-surface block mb-2">
                Detailed Self Reflection &amp; Next-Cycle Milestones
              </label>
              <textarea
                rows={4}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Elaborate on your key achievements, challenges solved, and focus areas for next quarter..."
                className="w-full p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                required
              />
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">
                Submission locks upon sending. Mentors will be notified automatically.
              </span>
              <Magnet padding={25} magnetStrength={3}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-[#4326dd] text-white rounded-xl text-label-md font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  <span>Submit Final Self Evaluation</span>
                </motion.button>
              </Magnet>
            </div>
          </form>
        )}
        </AnimatePresence>
      </div>

    </div>
  );
}

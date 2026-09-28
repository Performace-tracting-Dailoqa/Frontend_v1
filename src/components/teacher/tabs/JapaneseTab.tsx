"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTeacherStudents,
  fetchStudentGeneralEvaluation,
  addGeneralMetric,
  createStudentGeneralEvaluation,
  TeacherStudent,
  GeneralEvaluation,
} from "@/services/teacherService";

export default function JapaneseTab() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [evaluation, setEvaluation] = useState<GeneralEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTeacherStudents()
      .then((res) => {
        setStudents(res);
        if (res.length > 0) setSelectedStudent(res[0]);
      })
      .catch((err) => console.warn("Failed to load students:", err));
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentEval(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudentEval = async (studentId: string) => {
    setIsLoading(true);
    try {
      const res = await fetchStudentGeneralEvaluation(studentId);
      setEvaluation(res);
    } catch (err) {
      console.warn("Error fetching student eval:", err);
      setEvaluation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAddJapaneseMetric = async (name: string, defaultScore: number) => {
    if (!selectedStudent) return;
    setIsGrading(true);
    setStatusMessage(null);
    try {
      let activeEval = evaluation;
      if (!activeEval) {
        activeEval = await createStudentGeneralEvaluation(selectedStudent.id, {
          total_score: 0,
          max_score: 100,
          percentage: 0,
          status: "in_progress",
          remarks: "Japanese Language Tracking Dossier",
        });
      }

      await addGeneralMetric(selectedStudent.id, activeEval.id, {
        name,
        score: defaultScore,
        full_score: 100,
        remarks: "Evaluated during Japanese linguistic milestone drill",
      });

      await loadStudentEval(selectedStudent.id);
      setStatusMessage({ type: "success", text: `Graded "${name}" successfully!` });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to add Japanese metric." });
    } finally {
      setIsGrading(false);
    }
  };

  const japaneseMetrics = evaluation?.metrics?.filter(
    (m) =>
      m.name.toLowerCase().includes("japanese") ||
      m.name.toLowerCase().includes("jlpt") ||
      m.name.toLowerCase().includes("kanji") ||
      m.name.toLowerCase().includes("keigo") ||
      m.name.toLowerCase().includes("linguistic") ||
      m.name.toLowerCase().includes("nihongo")
  ) || [];

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">translate</span>
            <span>JLPT & Japanese Track</span>
          </div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Japanese Language Proficiency Console</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Monitor Kanji retention, business dialogue competency, and JLPT exam readiness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-outline">Target Learner:</label>
          <select
            value={selectedStudent?.id || ""}
            onChange={(e) => {
              const found = students.find((s) => s.id === e.target.value);
              setSelectedStudent(found || null);
            }}
            className="bg-surface-container border border-outline-variant/50 text-xs text-on-surface rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[200px]"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.name || "Student"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Grading Presets */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-on-surface">Standard JLPT Competency Rubric Presets</h3>
        <p className="text-xs text-on-surface-variant">
          Click any preset below to directly log a competency assessment for{" "}
          <span className="font-bold text-on-surface">{selectedStudent?.full_name || selectedStudent?.name}</span>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickAddJapaneseMetric("JLPT N3 Kanji Mastery", 88)}
            disabled={isGrading || !selectedStudent}
            className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/30 hover:border-primary text-left transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-on-surface">Kanji Mastery</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">N3 Target</span>
            </div>
            <p className="text-[11px] text-outline">Radical recognition & stroke order</p>
            <div className="mt-3 text-[11px] font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Log Grade (88%)</span>
            </div>
          </button>

          <button
            onClick={() => handleQuickAddJapaneseMetric("Keigo & Business Dialogue", 90)}
            disabled={isGrading || !selectedStudent}
            className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/30 hover:border-primary text-left transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-on-surface">Keigo & Dialogue</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Oral Drill</span>
            </div>
            <p className="text-[11px] text-outline">Sonkeigo, Kenjougo & polite email writing</p>
            <div className="mt-3 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Log Grade (90%)</span>
            </div>
          </button>

          <button
            onClick={() => handleQuickAddJapaneseMetric("Listening Comprehension (Chokai)", 82)}
            disabled={isGrading || !selectedStudent}
            className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/30 hover:border-primary text-left transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-on-surface">Listening (Chokai)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">Audio Lab</span>
            </div>
            <p className="text-[11px] text-outline">Native audio & workplace discussion</p>
            <div className="mt-3 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Log Grade (82%)</span>
            </div>
          </button>

          <button
            onClick={() => handleQuickAddJapaneseMetric("Technical Specs Reading (Dokkai)", 85)}
            disabled={isGrading || !selectedStudent}
            className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/30 hover:border-primary text-left transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-on-surface">Technical Reading</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">Documentation</span>
            </div>
            <p className="text-[11px] text-outline">Interpreting Jira tickets and design docs</p>
            <div className="mt-3 text-[11px] font-bold text-amber-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Log Grade (85%)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Current Japanese Scores for Selected Student */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-on-surface">
          Recorded Linguistic Competencies for {selectedStudent?.full_name || selectedStudent?.name || "Student"}
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-outline">Loading competencies...</div>
        ) : japaneseMetrics.length === 0 ? (
          <div className="p-8 text-center text-xs text-outline bg-surface-container/40 rounded-xl">
            No specific Japanese rubrics recorded for this learner yet. Use the presets above to grade.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {japaneseMetrics.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/20 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-on-surface">{m.name}</h4>
                  {m.remarks && <p className="text-[11px] text-outline mt-1">{m.remarks}</p>}
                </div>
                <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-xs">
                  <span className="text-outline">Score:</span>
                  <span className="font-bold text-primary">
                    {m.score} / {m.full_score} ({Math.round(((m.score || 0) / (m.full_score || 100)) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

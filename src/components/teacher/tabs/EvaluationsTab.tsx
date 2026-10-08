"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  fetchTeacherBatches,
  fetchTeacherStudents,
  fetchStudentJapaneseAnalytics,
  createStudentJapaneseEvaluation,
  TeacherBatch,
  TeacherStudent,
  StudentJapaneseAnalyticsResponse,
  StudentJapaneseEvalItem,
} from "@/services/teacherService";

interface EvaluationsTabProps {
  initialStudent?: TeacherStudent | null;
  initialStudentId?: string | null;
}

interface JapaneseCategoryMetric {
  category: string;
  jpName: string;
  name: string;
  score: number;
  full_score: number;
  weightage: number;
  remarks: string;
  color: string;
  icon: string;
}

const DEFAULT_METRICS: JapaneseCategoryMetric[] = [
  {
    category: "Kanji",
    jpName: "漢字 (Kanji & Radicals)",
    name: "Kanji Recognition & Stroke Order",
    score: 85,
    full_score: 100,
    weightage: 1.0,
    remarks: "Good radical recognition and stroke accuracy.",
    color: "from-rose-500 to-pink-600",
    icon: "edit_note",
  },
  {
    category: "Vocabulary",
    jpName: "語彙 (Vocabulary)",
    name: "Vocabulary & Daily Expressions",
    score: 90,
    full_score: 100,
    weightage: 1.0,
    remarks: "Strong retention of lesson flashcard vocabulary.",
    color: "from-amber-500 to-orange-600",
    icon: "translate",
  },
  {
    category: "Grammar",
    jpName: "文法 (Grammar & Particles)",
    name: "Sentence Patterns & Particle Accuracy",
    score: 80,
    full_score: 100,
    weightage: 1.0,
    remarks: "Proper use of particles (は, が, を, に, で).",
    color: "from-emerald-500 to-teal-600",
    icon: "psychology",
  },
  {
    category: "Listening",
    jpName: "聴解 (Listening Comprehension)",
    name: "Audio Comprehension & Dialogue Speed",
    score: 75,
    full_score: 100,
    weightage: 1.0,
    remarks: "Understands standard native pacing with slight hesitation.",
    color: "from-sky-500 to-blue-600",
    icon: "hearing",
  },
  {
    category: "Speaking",
    jpName: "会話・敬語 (Speaking & Keigo)",
    name: "Oral Fluency & Honorific Speech",
    score: 80,
    full_score: 100,
    weightage: 1.0,
    remarks: "Good conversational confidence and respectful phrasing.",
    color: "from-violet-500 to-purple-600",
    icon: "record_voice_over",
  },
];

export default function EvaluationsTab({ initialStudent, initialStudentId }: EvaluationsTabProps) {
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  // Student analytics & history state
  const [studentAnalytics, setStudentAnalytics] = useState<StudentJapaneseAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Evaluation Form State (Strictly Japanese Evaluation)
  const [evalTitle, setEvalTitle] = useState("JLPT N5 Daily Drill Assessment");
  const [evalType, setEvalType] = useState<"daily" | "milestone" | "oral" | "quiz">("daily");
  const [jlptLevel, setJlptLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [evalDate, setEvalDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [attendanceScore, setAttendanceScore] = useState<number>(100);
  const [feedback, setFeedback] = useState("");
  const [remarks, setRemarks] = useState("");
  const [metrics, setMetrics] = useState<JapaneseCategoryMetric[]>(DEFAULT_METRICS);
  const [activeWorkflowContext, setActiveWorkflowContext] = useState<{
    workflowId?: string;
    workflowName?: string;
    batchName?: string;
  } | null>(null);

  // Track submitted student IDs so the submit button grays out for only that student right after giving marks
  const [submittedStudentIds, setSubmittedStudentIds] = useState<Set<string>>(new Set());

  const markStudentDirty = () => {
    if (selectedStudent && submittedStudentIds.has(selectedStudent.id)) {
      setSubmittedStudentIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedStudent.id);
        return next;
      });
    }
  };

  // Check if navigating from a workflow with scoped metrics
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("teacher_active_eval_metrics");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed?.selectedMetrics &&
          Array.isArray(parsed.selectedMetrics) &&
          parsed.selectedMetrics.length > 0
        ) {
          setActiveWorkflowContext({
            workflowId: parsed.workflowId,
            workflowName: parsed.workflowName,
            batchName: parsed.batchName,
          });
          if (parsed.workflowName) {
            setEvalTitle(`${parsed.workflowName} Assessment`);
          }

          const mappedMetrics: JapaneseCategoryMetric[] = parsed.selectedMetrics.map((sm: any) => ({
            category: sm.category || "Japanese",
            jpName: sm.jpName || `${sm.category} (日本語)`,
            name: sm.name || `${sm.category} Proficiency`,
            score: Math.round((sm.full_score || 20) * 0.8),
            full_score: sm.full_score || 20,
            weightage: sm.weightage || 1.0,
            remarks: `Evaluation for ${sm.name || sm.category}.`,
            color: sm.color || "from-indigo-500 to-purple-600",
            icon: sm.icon || "spellcheck",
          }));
          setMetrics(mappedMetrics);
        }
      } catch (e) {
        console.warn("Failed to parse workflow active eval metrics:", e);
      }
    }
  }, []);

  const handleResetToStandardRubric = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("teacher_active_eval_metrics");
    }
    setActiveWorkflowContext(null);
    setMetrics(DEFAULT_METRICS);
    setEvalTitle(`JLPT ${jlptLevel} ${evalType.toUpperCase()}`);
  };

  // Load batches and students
  useEffect(() => {
    Promise.all([fetchTeacherBatches(), fetchTeacherStudents()])
      .then(([batchesRes, studentsRes]) => {
        setBatches(batchesRes);
        setStudents(studentsRes);

        if (initialStudent) {
          setSelectedStudent(initialStudent);
          if (initialStudent.batch_id) {
            setSelectedBatchId(initialStudent.batch_id);
          } else if (batchesRes.length > 0) {
            setSelectedBatchId(batchesRes[0].id);
          }
        } else if (initialStudentId) {
          const match = studentsRes.find((s) => s.id === initialStudentId);
          if (match) {
            setSelectedStudent(match);
            if (match.batch_id) {
              setSelectedBatchId(match.batch_id);
            } else if (batchesRes.length > 0) {
              setSelectedBatchId(batchesRes[0].id);
            }
          } else if (batchesRes.length > 0) {
            setSelectedBatchId(batchesRes[0].id);
          }
        } else if (batchesRes.length > 0) {
          setSelectedBatchId(batchesRes[0].id);
          const firstBatchStudents = studentsRes.filter((s) => s.batch_id === batchesRes[0].id);
          if (firstBatchStudents.length > 0) {
            setSelectedStudent(firstBatchStudents[0]);
          } else if (studentsRes.length > 0) {
            setSelectedStudent(studentsRes[0]);
          }
        }
      })
      .catch((err) => console.warn("Failed to load batches or students:", err));
  }, [initialStudent, initialStudentId]);

  // When selectedBatchId changes, pick the first student in that batch if current student is not in it
  const handleBatchSelect = (batchId: string) => {
    setSelectedBatchId(batchId);
    setStudentSearch("");
    const batchStudents = students.filter((s) => s.batch_id === batchId);
    if (batchStudents.length > 0) {
      setSelectedStudent(batchStudents[0]);
    } else {
      setSelectedStudent(null);
    }
  };

  // Filtered students in current batch
  const batchStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesBatch = selectedBatchId ? s.batch_id === selectedBatchId : true;
      const matchesSearch = studentSearch.trim()
        ? (s.full_name || s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
          (s.enrollment_no || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
          (s.email || "").toLowerCase().includes(studentSearch.toLowerCase())
        : true;
      return matchesBatch && matchesSearch;
    });
  }, [students, selectedBatchId, studentSearch]);

  // Load student Japanese history whenever selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      loadStudentJapaneseHistory(selectedStudent.id);
      // Auto-update assessment title
      if (!activeWorkflowContext) {
        setEvalTitle(`JLPT ${jlptLevel} ${evalType.toUpperCase()} - ${selectedStudent.full_name || selectedStudent.name}`);
      }
    } else {
      setStudentAnalytics(null);
    }
  }, [selectedStudent]);

  const loadStudentJapaneseHistory = async (studentId: string) => {
    setIsLoadingAnalytics(true);
    setStatusMessage(null);
    try {
      const data = await fetchStudentJapaneseAnalytics(studentId);
      setStudentAnalytics(data);
      if (data?.student?.target_jlpt) {
        setJlptLevel((data.student.target_jlpt as any) || "N5");
      }
    } catch (err: any) {
      console.warn("Failed to fetch student Japanese history:", err);
      setStudentAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Metric update handler
  const handleMetricScoreChange = (index: number, newScore: number) => {
    markStudentDirty();
    const updated = [...metrics];
    const maxScore = updated[index].full_score || 100;
    updated[index].score = Math.max(0, Math.min(maxScore, newScore));
    setMetrics(updated);
  };

  const handleMetricRemarkChange = (index: number, newRemark: string) => {
    markStudentDirty();
    const updated = [...metrics];
    updated[index].remarks = newRemark;
    setMetrics(updated);
  };

  // Real-time score calculations
  const totalScore = useMemo(() => {
    return metrics.reduce((acc, m) => acc + (m.score || 0), 0);
  }, [metrics]);

  const maxTotalScore = useMemo(() => {
    return metrics.reduce((acc, m) => acc + (m.full_score || 100), 0);
  }, [metrics]);

  const computedPercentage = useMemo(() => {
    if (maxTotalScore === 0) return 0;
    return Math.round((totalScore / maxTotalScore) * 1000) / 10;
  }, [totalScore, maxTotalScore]);

  const gradeLetter = useMemo(() => {
    if (computedPercentage >= 90) return { grade: "S / 優 (Excellent)", color: "text-emerald-700 bg-emerald-50 border-emerald-300" };
    if (computedPercentage >= 80) return { grade: "A / 良 (Very Good)", color: "text-teal-700 bg-teal-50 border-teal-300" };
    if (computedPercentage >= 70) return { grade: "B / 可 (Good)", color: "text-blue-700 bg-blue-50 border-blue-300" };
    if (computedPercentage >= 60) return { grade: "C / 合格 (Pass)", color: "text-amber-700 bg-amber-50 border-amber-300" };
    return { grade: "D / 要復習 (Needs Review)", color: "text-rose-700 bg-rose-50 border-rose-300" };
  }, [computedPercentage]);

  // Check if learner already has an evaluation recorded on the selected date
  const existingEvalForDate = useMemo(() => {
    if (!studentAnalytics?.evaluations_history || !evalDate) return null;
    return studentAnalytics.evaluations_history.find(
      (e) =>
        e.evaluation_date === evalDate &&
        e.evaluation_type !== "batch_feedback" &&
        e.evaluation_type !== "student_feedback"
    );
  }, [studentAnalytics, evalDate]);

  // Synchronize form values when an existing evaluation exists on the selected date
  useEffect(() => {
    if (existingEvalForDate) {
      if (existingEvalForDate.evaluation_title) {
        setEvalTitle(existingEvalForDate.evaluation_title);
      }
      if (existingEvalForDate.evaluation_type) {
        setEvalType(existingEvalForDate.evaluation_type as any);
      }
      if (existingEvalForDate.jlpt_level) {
        setJlptLevel(existingEvalForDate.jlpt_level as any);
      }
      if (existingEvalForDate.feedback) {
        setFeedback(existingEvalForDate.feedback);
      }
      if (existingEvalForDate.remarks) {
        setRemarks(existingEvalForDate.remarks);
      }
      if (existingEvalForDate.attendance_score !== undefined) {
        setAttendanceScore(existingEvalForDate.attendance_score);
      }
      if (existingEvalForDate.metrics && existingEvalForDate.metrics.length > 0) {
        setMetrics((prev) =>
          prev.map((m) => {
            const found = existingEvalForDate.metrics.find(
              (em) =>
                em.category.toLowerCase() === m.category.toLowerCase() ||
                em.name.toLowerCase() === m.name.toLowerCase()
            );
            if (found) {
              return {
                ...m,
                score: found.score,
                full_score: found.full_score || m.full_score,
                remarks: found.remarks || m.remarks,
              };
            }
            return m;
          })
        );
      }
    }
  }, [existingEvalForDate]);

  // Save Japanese Evaluation to PostgreSQL
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setStatusMessage({ type: "error", text: "Please select a student to evaluate." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        evaluation_title: evalTitle.trim() || `Japanese ${evalType.toUpperCase()} Evaluation`,
        evaluation_type: evalType,
        jlpt_level: jlptLevel,
        evaluation_date: evalDate,
        total_score: totalScore,
        max_score: maxTotalScore,
        percentage: computedPercentage,
        attendance_score: attendanceScore,
        status: "finalized",
        feedback: feedback.trim() || `Performance grade ${computedPercentage}% recorded for ${jlptLevel} track.`,
        remarks: remarks.trim() || undefined,
        batch_id: selectedStudent.batch_id || selectedBatchId || undefined,
        metrics: metrics.map((m) => ({
          category: m.category,
          name: m.name,
          score: m.score,
          full_score: m.full_score,
          weightage: m.weightage,
          proficiency_level: `${jlptLevel} ${m.score >= 80 ? "Mastered" : m.score >= 60 ? "Proficient" : "Developing"}`,
          remarks: m.remarks,
        })),
      };

      await createStudentJapaneseEvaluation(selectedStudent.id, payload);

      // Gray out submit button for only this student
      setSubmittedStudentIds((prev) => new Set(prev).add(selectedStudent.id));

      setStatusMessage({
        type: "success",
        text: existingEvalForDate
          ? `Updated Japanese evaluation for ${selectedStudent.full_name || selectedStudent.name}! Score: ${computedPercentage}%.`
          : `Japanese evaluation saved to database for ${selectedStudent.full_name || selectedStudent.name}! Grade: ${computedPercentage}%.`,
      });

      // Reload student Japanese analytics
      await loadStudentJapaneseHistory(selectedStudent.id);
    } catch (err: any) {
      console.error("Failed to save Japanese evaluation:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to save Japanese evaluation to database.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const isStudentSubmitted = selectedStudent ? submittedStudentIds.has(selectedStudent.id) : false;

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] tracking-wide uppercase">
              Japanese Track Evaluation
            </span>
            <span className="text-xs text-outline font-medium">日本語評価システム</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Japanese Language Evaluations</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Select any cohort batch to inspect learners, grade Japanese proficiency rubrics (Kanji, Vocabulary, Grammar, Listening, Speaking), and save grades directly to the database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">groups</span>
            <span>{batches.length} Cohort Batches</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">school</span>
            <span>{students.length} Learners Enrolled</span>
          </div>
        </div>
      </div>

      {/* STEP 1: All Batches Selector */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-outline">
              Step 1: Select Cohort Batch ({batches.length})
            </h3>
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Active: <span className="font-bold text-primary">{selectedBatch?.name || "None"}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {batches.map((batch) => {
            const isSelected = batch.id === selectedBatchId;
            const count = students.filter((s) => s.batch_id === batch.id).length;

            return (
              <button
                key={batch.id}
                onClick={() => handleBatchSelect(batch.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/5 border-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-surface-container/30 border-outline-variant/40 hover:bg-surface-container hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-headline font-bold text-xs text-on-surface line-clamp-1">
                    {batch.name}
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary text-sm shrink-0">check_circle</span>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-outline font-medium">{batch.department || "Japanese"}</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container font-bold text-on-surface">
                    {count} {count === 1 ? "student" : "students"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Students List (Left) & Japanese Evaluation Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Students in Batch */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-outline">
                  Step 2: Select Learner
                </h3>
                <p className="text-xs font-bold text-on-surface mt-0.5">
                  {selectedBatch?.name || "Batch"} Learners ({batchStudents.length})
                </p>
              </div>
            </div>

            {/* Student Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                search
              </span>
              <input
                type="text"
                placeholder="Search learner by name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline"
              />
            </div>

            {/* Students List Scrollable */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {batchStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-outline bg-surface-container/30 rounded-xl border border-dashed border-outline-variant/40">
                  <span className="material-symbols-outlined text-2xl text-outline mb-1">person_search</span>
                  <p>No learners found in this batch matching criteria.</p>
                </div>
              ) : (
                batchStudents.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  const initials = (student.full_name || student.name || "ST")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-xs ring-2 ring-primary/20"
                          : "bg-surface-container/30 border-outline-variant/40 hover:bg-surface-container hover:border-primary/40 text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-xs truncate ${isSelected ? "text-white" : "text-on-surface"}`}>
                            {student.full_name || student.name || "Student"}
                          </p>
                          <p className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-outline"}`}>
                            {student.enrollment_no || student.email || "No ID"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-surface-container text-on-surface-variant border border-outline-variant/40"
                          }`}
                        >
                          Evaluate
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dedicated Japanese Evaluation Form */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedStudent ? (
            <div className="p-16 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
              <span className="material-symbols-outlined text-4xl text-primary/60 mb-2">school</span>
              <h3 className="font-bold text-sm text-on-surface">No Learner Selected</h3>
              <p className="mt-1">Please select a cohort batch and click on a learner to conduct their Japanese evaluation.</p>
            </div>
          ) : (
            <form onSubmit={handleSaveEvaluation} className="space-y-6">
              {/* Learner Dossier Header */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                    {(selectedStudent.full_name || selectedStudent.name || "ST")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline font-bold text-base text-on-surface">
                        {selectedStudent.full_name || selectedStudent.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {selectedBatch?.name || "Cohort"}
                      </span>
                    </div>
                    <p className="text-xs text-outline mt-0.5">
                      Enrollment: <span className="font-semibold text-on-surface">{selectedStudent.enrollment_no || "N/A"}</span> · 
                      Email: <span className="font-semibold text-on-surface">{selectedStudent.email}</span>
                    </p>
                  </div>
                </div>

                {/* Score Summary Badge */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-outline">Computed Grade</p>
                    <p className="text-2xl font-bold font-headline text-primary">
                      {computedPercentage}%
                    </p>
                  </div>
                  <div className={`px-3 py-2 rounded-xl border text-xs font-bold ${gradeLetter.color}`}>
                    {gradeLetter.grade}
                  </div>
                </div>
              </div>

              {/* Assessment Parameters Setup */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">tune</span>
                    <span>Assessment Parameters</span>
                  </h3>
                </div>

                {existingEvalForDate && (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#4B2EF5] text-xl shrink-0">edit_note</span>
                      <div>
                        <p className="font-bold text-[#4B2EF5]">Viewing &amp; Editing Recorded Evaluation on {evalDate}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {selectedStudent.full_name || selectedStudent.name} has a recorded assessment ({existingEvalForDate.percentage}% - &quot;{existingEvalForDate.evaluation_title}&quot;). Modifying marks and saving will update this evaluation in-place.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-[#4B2EF5] font-bold text-[10px] uppercase shrink-0 border border-indigo-200">
                      Update Mode
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Evaluation Title *</label>
                    <input
                      type="text"
                      required
                      value={evalTitle}
                      onChange={(e) => {
                        markStudentDirty();
                        setEvalTitle(e.target.value);
                      }}
                      placeholder="e.g. JLPT N5 Daily Drill - Week 4"
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Assessment Type</label>
                    <select
                      value={evalType}
                      onChange={(e) => {
                        markStudentDirty();
                        setEvalType(e.target.value as any);
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium cursor-pointer"
                    >
                      <option value="daily">Daily Drill (日々のドリル)</option>
                      <option value="milestone">Milestone Exam (中間・期末試験)</option>
                      <option value="oral">Oral / Keigo Interview (口頭試問)</option>
                      <option value="quiz">Speed Quiz (小テスト)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Target JLPT Level</label>
                    <select
                      value={jlptLevel}
                      onChange={(e) => {
                        markStudentDirty();
                        setJlptLevel(e.target.value as any);
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-primary cursor-pointer"
                    >
                      <option value="N5">JLPT N5 (Basic)</option>
                      <option value="N4">JLPT N4 (Elementary)</option>
                      <option value="N3">JLPT N3 (Intermediate)</option>
                      <option value="N2">JLPT N2 (Pre-Advanced)</option>
                      <option value="N1">JLPT N1 (Advanced)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Evaluation Date</label>
                    <input
                      type="date"
                      value={evalDate}
                      onChange={(e) => {
                        markStudentDirty();
                        setEvalDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Japanese Category Skill Rubrics */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                {activeWorkflowContext && (
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs text-indigo-900 animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[#4B2EF5] text-lg shrink-0">account_tree</span>
                      <div className="min-w-0">
                        <span className="font-bold text-[#4B2EF5]">Workflow Scoped Rubric: </span>
                        <span className="font-semibold text-slate-800">{activeWorkflowContext.workflowName}</span>
                        <span className="text-slate-500 ml-1">
                          — Showing only the {metrics.length} selected Japanese metrics for this workflow.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetToStandardRubric}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-indigo-200 text-[#4B2EF5] text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs"
                    >
                      Reset to Standard Rubric
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">spellcheck</span>
                      <span>
                        {activeWorkflowContext ? "Workflow Japanese Rubric" : "Japanese Skill Competency Rubrics"} ({metrics.length} Metrics)
                      </span>
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {activeWorkflowContext
                        ? "Grading learner on the specific Japanese metrics configured for this workflow."
                        : "Score learner performance for each core Japanese language pillar."}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    Total: {totalScore} / {maxTotalScore} pts
                  </span>
                </div>

                <div className="space-y-4">
                  {metrics.map((metric, idx) => {
                    const maxScore = metric.full_score || 100;
                    return (
                      <div
                        key={metric.category + idx}
                        className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/20 hover:border-primary/40 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${metric.color} text-white flex items-center justify-center shrink-0`}>
                              <span className="material-symbols-outlined text-base">{metric.icon}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-on-surface">{metric.jpName}</h4>
                              <p className="text-[11px] text-outline">{metric.name}</p>
                            </div>
                          </div>

                          {/* Interactive Score & Slider */}
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max={maxScore}
                              value={metric.score}
                              onChange={(e) => handleMetricScoreChange(idx, Number(e.target.value))}
                              className="w-32 accent-primary cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max={maxScore}
                                value={metric.score}
                                onChange={(e) => handleMetricScoreChange(idx, Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-surface-container border border-outline-variant/50 rounded-lg text-center font-bold text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <span className="text-xs font-semibold text-outline">/ {maxScore}</span>
                            </div>
                          </div>
                        </div>

                        {/* Criterion Remarks */}
                        <div>
                          <input
                            type="text"
                            value={metric.remarks}
                            onChange={(e) => handleMetricRemarkChange(idx, e.target.value)}
                            placeholder={`Mentor note for ${metric.category}...`}
                            className="w-full px-3 py-1.5 bg-surface-container/60 border border-outline-variant/30 rounded-lg text-[11px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qualitative Mentor Remarks & Feedback */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">forum</span>
                  <span>Mentor Qualitative Feedback & Study Recommendation</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Learner Feedback (Visible to student in their portal)
                    </label>
                    <textarea
                      rows={2}
                      value={feedback}
                      onChange={(e) => {
                        markStudentDirty();
                        setFeedback(e.target.value);
                      }}
                      placeholder="e.g. Excellent progress in Kanji recognition this week. Recommend practicing particle drills for に vs で..."
                      className="w-full p-3 bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Internal Teacher Remarks / Action Plan (Optional)
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => {
                        markStudentDirty();
                        setRemarks(e.target.value);
                      }}
                      placeholder="e.g. Student is ready for JLPT N5 mock exam on Friday."
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Save Button Bar */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-outline-variant/30">
                  <div className="text-xs text-outline">
                    {isStudentSubmitted ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Marks submitted for {selectedStudent.full_name || selectedStudent.name}.</span>
                      </span>
                    ) : existingEvalForDate ? (
                      <span className="text-indigo-700 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">sync</span>
                        <span>Saving will update this learner&apos;s evaluation for {evalDate} with new score ({computedPercentage}%).</span>
                      </span>
                    ) : (
                      <span>
                        Grade <span className="font-bold text-primary">{computedPercentage}%</span> will be permanently saved to database.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving || isStudentSubmitted}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 ${
                      isStudentSubmitted
                        ? "bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none"
                        : "bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white cursor-pointer disabled:opacity-50"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : isStudentSubmitted ? (
                      <>
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Marks Submitted</span>
                      </>
                    ) : existingEvalForDate ? (
                      <>
                        <span className="material-symbols-outlined text-base">edit</span>
                        <span>Update Japanese Evaluation ({computedPercentage}%)</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">save</span>
                        <span>Save Japanese Evaluation to Database</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Student's Past Japanese Evaluation History */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">history_edu</span>
                      <span>
                        Past Japanese Evaluations History ({studentAnalytics?.evaluations_history?.length || 0})
                      </span>
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Review previous Japanese drills, milestone exams, and mentor feedback for this learner.
                    </p>
                  </div>
                </div>

                {isLoadingAnalytics ? (
                  <div className="p-8 text-center text-xs text-outline bg-surface-container/30 rounded-xl">
                    Loading learner evaluation history...
                  </div>
                ) : !studentAnalytics?.evaluations_history || studentAnalytics.evaluations_history.length === 0 ? (
                  <div className="p-8 text-center text-xs text-outline bg-surface-container/30 rounded-xl border border-dashed border-outline-variant/40">
                    No recorded Japanese evaluations found for this student yet. Use the form above to record their first grade.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentAnalytics.evaluations_history.map((evalItem: StudentJapaneseEvalItem) => (
                      <div
                        key={evalItem.id}
                        className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/20 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                              {evalItem.jlpt_level || "N5"}
                            </span>
                            <h4 className="font-bold text-xs text-on-surface">{evalItem.evaluation_title}</h4>
                            <span className="text-[11px] text-outline capitalize">({evalItem.evaluation_type})</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-outline">{evalItem.evaluation_date}</span>
                            <span className="font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                              {evalItem.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Category Score Pills */}
                        {evalItem.category_scores && Object.keys(evalItem.category_scores).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {Object.entries(evalItem.category_scores).map(([cat, score]) => (
                              <span
                                key={cat}
                                className="px-2 py-0.5 rounded-lg bg-surface-container text-[11px] font-medium text-on-surface border border-outline-variant/30"
                              >
                                {cat}: <span className="font-bold text-primary">{Math.round(score)}%</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {evalItem.feedback && (
                          <p className="text-[11px] text-on-surface-variant italic bg-surface-container/40 p-2.5 rounded-lg">
                            &quot;{evalItem.feedback}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

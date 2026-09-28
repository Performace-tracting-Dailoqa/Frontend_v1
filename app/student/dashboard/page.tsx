"use client";

import { getAuthSession, fetchMe, UserSession } from "@/utils/auth";
import {
  fetchStudentTasks,
  updateStudentTaskStatus,
  StudentTaskItem,
} from "@/services/workflowService";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import SpotlightCard from "@/components/animations/SpotlightCard";
import BorderBeam from "@/components/animations/BorderBeam";
import DecryptedText from "@/components/animations/DecryptedText";
import Magnet from "@/components/animations/Magnet";

interface MetricCardProps {
  title: string;
  value: string;
  badge: string;
  badgeType: "success" | "neutral" | "warning";
  progress: number;
  icon: string;
  colorClass: string;
  bgClass: string;
  subtitle?: string;
  numValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
}

function MetricCard({
  title,
  value,
  badge,
  badgeType,
  progress,
  icon,
  colorClass,
  bgClass,
  subtitle,
  numValue,
  prefix = "",
  suffix = "",
  decimals = 0,
  delay = 0,
}: MetricCardProps) {
  const badgeColors = {
    success: "text-emerald-700 bg-emerald-50 border-emerald-200",
    neutral: "text-slate-600 bg-slate-100 border-slate-200",
    warning: "text-amber-700 bg-amber-50 border-amber-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <SpotlightCard
        spotlightColor="rgba(75, 46, 245, 0.08)"
        className="bg-white p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow border border-slate-200/80 group h-full"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500">{title}</span>
            <div className={`w-9 h-9 rounded-xl ${bgClass} flex items-center justify-center ${colorClass} transition-transform group-hover:scale-110 duration-300`}>
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight font-headline">
              {numValue !== undefined ? (
                <CountUp to={numValue} prefix={prefix} suffix={suffix} decimals={decimals} duration={1.5} />
              ) : (
                value
              )}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeColors[badgeType]}`}>
              {badge}
            </span>
          </div>
        </div>
        {subtitle ? (
          <div className="text-xs text-slate-500 font-medium">{subtitle}</div>
        ) : (
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, delay: delay + 0.2, ease: "easeOut" }}
              className={`${colorClass.replace("text-", "bg-")} h-full rounded-full`}
            />
          </div>
        )}
      </SpotlightCard>
    </motion.div>
  );
}

export default function StudentDashboardPage() {
  const [velocityTimeframe, setVelocityTimeframe] = useState<"weekly" | "monthly">("weekly");
  const [actionDone, setActionDone] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState<string>("Student");
  const [realTasks, setRealTasks] = useState<StudentTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const [mentors, setMentors] = useState<{ id: string; name: string; role: string }[]>([]);

  // Self-grading and deliverable submission modal state
  interface StudentMetricState {
    metric_name: string;
    score: number;
    full_score: number;
    remarks?: string;
  }

  const DEFAULT_METRIC_RUBRICS: StudentMetricState[] = [
    { metric_name: "Code & Implementation Quality", score: 23, full_score: 25, remarks: "" },
    { metric_name: "Problem Solving & Logic", score: 22, full_score: 25, remarks: "" },
    { metric_name: "Timeliness & Sprint Delivery", score: 24, full_score: 25, remarks: "" },
    { metric_name: "Documentation & Clean Code", score: 21, full_score: 25, remarks: "" },
  ];

  const [selectedGradingTask, setSelectedGradingTask] = useState<StudentTaskItem | null>(null);
  const [metricGrades, setMetricGrades] = useState<StudentMetricState[]>(DEFAULT_METRIC_RUBRICS);
  const [submissionNotes, setSubmissionNotes] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<"submitted" | "completed">("submitted");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState<boolean>(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const loadStudentTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const res = await fetchStudentTasks();
      if (res && res.items) {
        setRealTasks(res.items);
      }
    } catch (err) {
      console.warn("Failed to load student workflow tasks:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchMe().then((me) => {
      const name = me.name || me.email.split("@")[0];
      setUserName(name);
      if (me.scope?.details?.mentors && Array.isArray(me.scope.details.mentors)) {
        setMentors(me.scope.details.mentors as any);
      }
    }).catch(() => {});
    loadStudentTasks();
  }, []);

  const handleOpenGradingModal = (task: StudentTaskItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedGradingTask(task);
    if (task.student_metric_grades && task.student_metric_grades.length > 0) {
      setMetricGrades(
        task.student_metric_grades.map((m) => ({
          metric_name: m.metric_name,
          score: Number(m.score) || 0,
          full_score: Number(m.full_score) || 25,
          remarks: m.remarks || "",
        }))
      );
    } else {
      setMetricGrades(DEFAULT_METRIC_RUBRICS);
    }
    setSubmissionNotes(task.submission_notes || "");
    setSubmissionStatus(task.status === "completed" ? "completed" : "submitted");
    setGradeError(null);
  };

  const handleMetricScoreChange = (index: number, newScore: number) => {
    setMetricGrades((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const clamped = Math.max(0, Math.min(item.full_score, newScore));
        return { ...item, score: clamped };
      })
    );
  };

  const handleMetricRemarksChange = (index: number, remarks: string) => {
    setMetricGrades((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, remarks } : item))
    );
  };

  const totalCalculatedGrade = metricGrades.reduce((acc, m) => acc + (Number(m.score) || 0), 0);
  const totalMaxGrade = metricGrades.reduce((acc, m) => acc + (Number(m.full_score) || 25), 0);

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradingTask) return;

    setIsSubmittingGrade(true);
    setGradeError(null);
    try {
      const updated = await updateStudentTaskStatus(selectedGradingTask.id, submissionStatus, {
        student_grade: totalCalculatedGrade,
        submission_notes: submissionNotes.trim() || undefined,
        student_metric_grades: metricGrades,
      });

      // Update state locally in real time
      setRealTasks((prev) =>
        prev.map((t) =>
          t.id === selectedGradingTask.id
            ? {
                ...t,
                ...updated,
                status: submissionStatus,
                student_grade: totalCalculatedGrade,
                submission_notes: submissionNotes.trim(),
                student_metric_grades: metricGrades,
              }
            : t
        )
      );
      setSelectedGradingTask(null);
    } catch (err: unknown) {
      setGradeError(err instanceof Error ? err.message : "Failed to submit grade and deliverable");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    setRealTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );
    try {
      await updateStudentTaskStatus(taskId, nextStatus);
    } catch (err) {
      console.warn("Failed to update task status in DB:", err);
      loadStudentTasks();
    }
  };




  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyData = days.map((day, idx) => {
    const slice = realTasks.filter((_, i) => i % 7 === idx);
    const completed = slice.filter((t) => t.status === "completed" || t.status === "done").length;
    const pct = slice.length > 0 ? Math.round((completed / slice.length) * 100) : 0;
    return { day, pct, tasks: slice.length };
  });

  const weeks = ["W1", "W2", "W3", "W4"];
  const monthlyData = weeks.map((w, idx) => {
    const slice = realTasks.filter((_, i) => i % 4 === idx);
    const completed = slice.filter((t) => t.status === "completed" || t.status === "done").length;
    const pct = slice.length > 0 ? Math.round((completed / slice.length) * 100) : 0;
    return { day: w, pct, tasks: slice.length };
  });

  const chartData = velocityTimeframe === "weekly" ? weeklyData : monthlyData;

  const toggleAction = (id: string) => {
    setActionDone((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-space-lg">
      
      {/* ========================================================= */}
      {/* WELCOME BANNER                                            */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider">
              PMS Q3 2026 Cycle
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Updated 10 mins ago
            </span>
          </div>
          <h1 className="font-headline font-bold text-3xl text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>Good morning,</span>
            <DecryptedText
              text={userName}
              speed={35}
              maxIterations={6}
              sequential={true}
              animateOn="hover"
              className="text-primary font-bold"
              encryptedClassName="text-indigo-400"
            />
            <span>👋</span>
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Here&apos;s your performance overview for Q3 2026. You are currently{" "}
            <strong className="text-emerald-600 font-semibold">on track</strong> with your internship milestones and systems engineering curriculum.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Magnet padding={20} magnetStrength={3}>
            <Link
              href="/student/reports"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-200/80 shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export Report</span>
            </Link>
          </Magnet>
          <Magnet padding={20} magnetStrength={3}>
            <Link
              href="/student/learning-progress"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-500/20"
            >
              <span className="material-symbols-outlined text-base">trending_up</span>
              <span>Learning Goals</span>
            </Link>
          </Magnet>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 CORE KPI METRICS                                       */}
      {/* ========================================================= */}
      {(() => {
        const totalTasks = realTasks.length;
        const completedTasks = realTasks.filter((t) => t.status === "completed").length;
        const pendingTasks = totalTasks - completedTasks;
        const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Overall Progress"
              value={`${progressPct}%`}
              numValue={progressPct}
              suffix="%"
              badge={progressPct >= 80 ? "On Track" : "In Progress"}
              badgeType="success"
              progress={progressPct}
              icon="trending_up"
              colorClass="text-indigo-600"
              bgClass="bg-indigo-50"
              delay={0}
            />
            <MetricCard
              title="Assigned Tasks"
              value={`${pendingTasks} / ${totalTasks}`}
              numValue={pendingTasks}
              suffix={` / ${totalTasks}`}
              badge={`${completedTasks} completed`}
              badgeType="neutral"
              progress={totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}
              icon="task_alt"
              colorClass="text-slate-600"
              bgClass="bg-slate-100"
              delay={0.08}
            />
            <MetricCard
              title="Active Workflows"
              value={`${new Set(realTasks.map((t) => t.workflow_id).filter(Boolean)).size || 1}`}
              numValue={new Set(realTasks.map((t) => t.workflow_id).filter(Boolean)).size || 1}
              badge="Enrolled"
              badgeType="success"
              progress={100}
              icon="account_tree"
              colorClass="text-purple-600"
              bgClass="bg-purple-50"
              delay={0.16}
            />
            <MetricCard
              title="Performance Status"
              value={progressPct >= 80 ? "On Track" : "Action Required"}
              badge="Tier 1"
              badgeType={progressPct >= 80 ? "success" : "warning"}
              progress={progressPct}
              icon="verified"
              colorClass="text-emerald-600"
              bgClass="bg-emerald-50"
              subtitle="Live status from manager workflows"
              delay={0.24}
            />
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* YOUR MENTORS                                              */}
      {/* ========================================================= */}
      {mentors && mentors.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <span className="material-symbols-outlined text-xl">supervisor_account</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-headline">Your Mentors</h2>
              <p className="text-sm text-slate-500">People assigned to guide you</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="h-10 w-10 bg-indigo-100 text-indigo-700 flex items-center justify-center rounded-full font-bold uppercase text-sm">
                  {m.name ? m.name.charAt(0) : "M"}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{m.name || "Unknown"}</div>
                  <div className="text-xs text-slate-500 capitalize">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MIDDLE SECTION: VELOCITY CHART & NEXT ACTIONS            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Task Velocity Interactive Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-dashed border-outline-variant/60 flex flex-col justify-center items-center shadow-xs text-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">api</span>
          </div>
          <h2 className="font-headline font-bold text-lg text-slate-900 mb-2">
            Performance &amp; Task Velocity
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mb-4">
            Backend Developer: Integrate student task velocity and performance chart data here.
          </p>
          <div className="inline-flex flex-col gap-2 text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
            <code className="text-xs text-slate-600 font-mono">GET /api/v1/student/velocity</code>
            <span className="text-[11px] text-slate-500 mt-1 block">Expected data: Weekly/Monthly points and progress percentages.</span>
          </div>
        </div>

        {/* Right: Next Actions / Assigned Workflow Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-headline font-bold text-base text-slate-900">Assigned Workflow Tasks</h2>
              <p className="text-[11px] text-slate-500">Live deliverables from your manager &amp; workflows</p>
            </div>
            <span className="text-[11px] font-bold text-primary bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              {realTasks.filter(t => t.status !== "completed").length} Pending
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px]">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center p-8 text-slate-400">
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-xs">Loading assigned tasks...</span>
              </div>
            ) : realTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <span className="material-symbols-outlined text-2xl text-slate-300 mb-1">task</span>
                <p className="text-xs font-medium">No assigned tasks yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tasks assigned by your manager in workflows will appear here.</p>
              </div>
            ) : (
              realTasks.map((task) => {
                const isDone = task.status === "completed" || task.status === "done";
                const isSubmitted = task.status === "submitted";
                const hasGrade = task.student_grade !== null && task.student_grade !== undefined;
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                      isDone
                        ? "bg-slate-50/80 border-slate-200"
                        : isSubmitted
                        ? "bg-indigo-50/30 border-indigo-200/80 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-primary/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTaskStatus(task.id, task.status)}
                        title={`Click to mark ${isDone ? "pending" : "completed"}`}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          isDone ? "bg-primary border-primary text-white" : "border-slate-300 bg-white hover:border-primary"
                        }`}
                      >
                        {isDone && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                      </button>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-bold text-slate-900 truncate ${isDone ? "line-through text-slate-500" : ""}`}>{task.title}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 capitalize ${
                              isDone
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : isSubmitted
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {task.status || "Pending"}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                        )}

                        {/* Self-Grade and submission remarks display */}
                        {(hasGrade || task.submission_notes) && (
                          <div className="mt-2 p-2 bg-indigo-50/40 border border-indigo-100 rounded-lg text-[11px] space-y-1">
                            {hasGrade && (
                              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                                <span className="material-symbols-outlined text-sm">stars</span>
                                <span>Self Grade: {task.student_grade} / 100</span>
                              </div>
                            )}
                            {task.submission_notes && (
                              <p className="text-slate-600 text-[10px] leading-relaxed line-clamp-2">
                                <strong className="text-slate-700">Deliverable:</strong> {task.submission_notes}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 flex-wrap">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {task.workflow_name && (
                              <span className="font-semibold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded">
                                {task.workflow_name}
                              </span>
                            )}
                            {task.assigned_by_name && (
                              <span>Manager: {task.assigned_by_name}</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleOpenGradingModal(task, e)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">edit_note</span>
                            <span>{hasGrade ? "Update Grade" : "Grade & Submit"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            href="/student/learning-progress"
            className="mt-4 pt-3 border-t border-surface-container-highest/60 text-center text-label-sm font-bold text-primary hover:underline block"
          >
            View all 8 active tasks →
          </Link>
        </div>

      </div>

      {/* ========================================================= */}
      {/* BOTTOM SECTION: FEEDBACK & JAPANESE MODULE PREVIEW        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md sm:gap-space-lg">
        
        {/* Recent Feedback & Evaluations (Span 2) */}
        <div className="lg:col-span-2 bg-surface-container-low p-6 sm:p-space-lg rounded-2xl border border-dashed border-outline-variant/60 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">api</span>
          </div>
          <h2 className="font-headline font-bold text-headline-sm text-on-surface mb-2">
            Recent Feedback &amp; Evaluations
          </h2>
          <p className="text-body-sm text-on-surface-variant max-w-sm mb-4">
            Backend Developer: Integrate recent feedback from mentors and evaluators here.
          </p>
          <div className="inline-flex flex-col gap-2 text-left bg-surface-container p-4 rounded-lg border border-outline-variant/40">
            <code className="text-xs text-on-surface-variant font-mono">GET /api/v1/student/feedback/recent</code>
            <span className="text-[11px] text-outline mt-1 block">Expected data: Array of feedback objects with ratings and comments.</span>
          </div>
        </div>

        {/* Curriculum & Skills Snapshot Widget */}
        <div className="relative bg-white p-6 sm:p-space-lg rounded-2xl border border-dashed border-slate-200/80 flex flex-col justify-center items-center text-center overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">api</span>
          </div>
          <h2 className="font-headline font-bold text-headline-sm text-on-surface mb-2">
            Curriculum Roadmap
          </h2>
          <p className="text-body-sm text-on-surface-variant max-w-xs mb-4">
            Backend Developer: Integrate the student's curriculum and skill progression roadmap.
          </p>
          <div className="inline-flex flex-col gap-2 text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
            <code className="text-xs text-slate-600 font-mono">GET /api/v1/student/curriculum/progress</code>
            <span className="text-[11px] text-slate-500 mt-1 block">Expected data: Milestones, sprints, and current progression metrics.</span>
          </div>
        </div>

      </div>

      {/* Student Self-Grade & Deliverable Modal */}
      {selectedGradingTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 shadow-2xl animate-fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded uppercase tracking-wider">
                  Work Assigned By Manager
                </span>
                <h3 className="text-base font-bold text-slate-900 font-headline mt-1">
                  {selectedGradingTask.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workflow: {selectedGradingTask.workflow_name || "Assigned Task"} • Manager: {selectedGradingTask.assigned_by_name || "Manager"}
                </p>
              </div>
              <button
                onClick={() => setSelectedGradingTask(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {gradeError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {gradeError}
              </div>
            )}

            <form onSubmit={handleSubmitGrade} className="mt-4 space-y-4">
              {selectedGradingTask.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <strong className="block text-slate-800 mb-0.5">Task Requirements:</strong>
                  {selectedGradingTask.description}
                </div>
              )}

              {selectedGradingTask.manager_grade !== null && selectedGradingTask.manager_grade !== undefined && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div>
                    <span className="font-bold">Manager Grade on Record: {selectedGradingTask.manager_grade}/100</span>
                    {selectedGradingTask.final_grade !== null && selectedGradingTask.final_grade !== undefined && (
                      <span className="block text-[11px] text-emerald-700">Official Final Grade: {selectedGradingTask.final_grade}/100</span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">Evaluated</span>
                </div>
              )}

              {/* Rubric Metrics Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Self-Grade by Metrics
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">Rate each competency</span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {metricGrades.map((metric, idx) => (
                    <div key={metric.metric_name} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate">{metric.metric_name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={metric.full_score}
                            step="1"
                            value={metric.score}
                            onChange={(e) => handleMetricScoreChange(idx, Number(e.target.value))}
                            className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-[11px] font-semibold text-slate-500">/ {metric.full_score}</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max={metric.full_score}
                        value={metric.score}
                        onChange={(e) => handleMetricScoreChange(idx, Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />

                      <input
                        type="text"
                        value={metric.remarks || ""}
                        onChange={(e) => handleMetricRemarksChange(idx, e.target.value)}
                        placeholder="Optional metric notes or self-reflection..."
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Live Auto-Calculated Total */}
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-950 block">Auto-Calculated Total Grade</span>
                    <span className="text-[11px] text-indigo-600">Sum of your individual metric ratings</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-bold text-indigo-700">{totalCalculatedGrade}</span>
                    <span className="text-xs text-indigo-600 font-semibold"> / {totalMaxGrade} pts</span>
                    <span className="block text-[10px] text-indigo-500 font-mono">
                      ({Math.round((totalCalculatedGrade / (totalMaxGrade || 100)) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable Notes &amp; Reflections
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Summarize your implementation, key accomplishments, repository links, or PR notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Status
                </label>
                <select
                  value={submissionStatus}
                  onChange={(e) => setSubmissionStatus(e.target.value as "submitted" | "completed")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="submitted">Submitted (Ready for Manager Evaluation)</option>
                  <option value="completed">Completed &amp; Finalized</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGradingTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isSubmittingGrade ? "Submitting..." : "Submit Self-Grade & Deliverable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { getAuthToken, fetchMe } from "@/utils/auth";
import { apiJson } from "@/services/apiClient";
import {
  fetchStudentTasks,
  updateStudentTaskStatus,
  StudentTaskItem,
} from "@/services/workflowService";
import CountUp from "@/components/animations/CountUp";
import SpotlightCard from "@/components/animations/SpotlightCard";
import DecryptedText from "@/components/animations/DecryptedText";
import Magnet from "@/components/animations/Magnet";
import { shortDate } from "@/utils/date";

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

export default function StudentDashboardPage() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [userName, setUserName] = useState<string>("Learner");
  const [realTasks, setRealTasks] = useState<StudentTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Student Profile, Batch, Manager & Teacher context
  const [cohortContext, setCohortContext] = useState<{
    student?: { enrollment_no?: string; department?: string; status?: string };
    batch?: { id?: string; name?: string; department?: string; start_date?: string; end_date?: string };
    manager?: { name?: string; email?: string; department?: string };
    teacher?: { name?: string; email?: string; specialization?: string };
  } | null>(null);

  // Japanese Analytics & Progress
  const [japaneseData, setJapaneseData] = useState<{
    student?: {
      overall_average?: number;
      attendance_rate?: number;
      total_evaluations?: number;
      target_jlpt?: string;
    };
    performance_trend?: Array<{ date: string; score: number; title?: string }>;
    skills_breakdown?: Array<{ category: string; score?: number; average_percentage?: number; drills_count?: number }>;
    evaluations_history?: Array<{
      id: string;
      evaluation_title: string;
      evaluation_type: string;
      evaluation_date: string;
      jlpt_level: string;
      percentage: number;
      feedback: string;
    }>;
  } | null>(null);

  // Modal State for task self-grading
  const [selectedGradingTask, setSelectedGradingTask] = useState<StudentTaskItem | null>(null);
  const [metricGrades, setMetricGrades] = useState<StudentMetricState[]>(DEFAULT_METRIC_RUBRICS);
  const [submissionNotes, setSubmissionNotes] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<"submitted" | "completed">("submitted");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState<boolean>(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const loadStudentData = async () => {
    try {
      setIsLoadingTasks(true);
      const token = getAuthToken();
      const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Fetch user session
      fetchMe()
        .then((me) => {
          const name = me.name || me.email.split("@")[0];
          setUserName(name);
        })
        .catch(() => {});

      // 2. Fetch student profile overview (Batch, Manager, Teacher) with cache
      apiJson<any>("/api/v1/student/profile/overview")
        .then((data) => {
          if (data) setCohortContext(data);
        })
        .catch(() => {});

      // 3. Fetch Japanese analytics with cache
      apiJson<any>("/api/v1/student/japanese-analytics")
        .then((data) => {
          if (data) setJapaneseData(data);
        })
        .catch(() => {});

      // 4. Fetch workflow tasks with cache
      const taskRes = await fetchStudentTasks();
      if (taskRes && taskRes.items) {
        setRealTasks(taskRes.items);
      }
    } catch (err) {
      console.warn("Failed to load student dashboard data:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  // Task computations
  const totalTasks = realTasks.length;
  const completedTasks = realTasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Workflows count
  const workflowNames = useMemo(() => {
    return Array.from(new Set(realTasks.map((t) => t.workflow_name || t.workflow_id).filter(Boolean)));
  }, [realTasks]);
  const workflowsCount = workflowNames.length > 0 ? workflowNames.length : 1;

  // Japanese Progress computations
  const jpAvgScore = useMemo(() => {
    if (japaneseData?.student?.overall_average !== undefined) {
      return Math.round(japaneseData.student.overall_average);
    }
    return 88;
  }, [japaneseData]);

  const jpAttendance = useMemo(() => {
    if (japaneseData?.student?.attendance_rate !== undefined) {
      return Math.round(japaneseData.student.attendance_rate);
    }
    return 98;
  }, [japaneseData]);

  const targetJlpt = japaneseData?.student?.target_jlpt || "JLPT N5";
  const totalJpEvaluations = japaneseData?.student?.total_evaluations ?? (japaneseData?.evaluations_history?.length || 0);

  // Velocity / Trend chart data
  const chartTrajectory = useMemo(() => {
    if (japaneseData?.performance_trend && japaneseData.performance_trend.length >= 2) {
      return {
        labels: japaneseData.performance_trend.map((pt) => shortDate(pt.date)),
        scores: japaneseData.performance_trend.map((pt) => Math.round(pt.score)),
      };
    }
    return {
      labels: ["Drill 1", "Drill 2", "Drill 3", "Mid-Exam", "Drill 4", "Drill 5"],
      scores: [78, 82, 85, 89, 91, 94],
    };
  }, [japaneseData]);

  // Skill Pillars Breakdown
  const skillPillars = useMemo(() => {
    if (japaneseData?.skills_breakdown && japaneseData.skills_breakdown.length > 0) {
      return japaneseData.skills_breakdown.map((sb) => ({
        category: sb.category,
        jpName:
          sb.category === "Kanji"
            ? "漢字 (Kanji & Radicals)"
            : sb.category === "Vocabulary"
            ? "語彙 (Vocabulary)"
            : sb.category === "Grammar"
            ? "文法 (Grammar & Particles)"
            : sb.category === "Listening"
            ? "聴解 (Listening)"
            : "会話・敬語 (Oral & Keigo)",
        score: Math.round(sb.average_percentage || sb.score || 85),
        color:
          sb.category === "Kanji"
            ? "bg-rose-500"
            : sb.category === "Vocabulary"
            ? "bg-amber-500"
            : sb.category === "Grammar"
            ? "bg-emerald-500"
            : sb.category === "Listening"
            ? "bg-sky-500"
            : "bg-purple-500",
      }));
    }

    return [
      { category: "Kanji", jpName: "漢字 (Kanji & Radicals)", score: 88, color: "bg-rose-500" },
      { category: "Vocabulary", jpName: "語彙 (Vocabulary)", score: 92, color: "bg-amber-500" },
      { category: "Grammar", jpName: "文法 (Grammar & Particles)", score: 84, color: "bg-emerald-500" },
      { category: "Listening", jpName: "聴解 (Listening Comprehension)", score: 80, color: "bg-sky-500" },
      { category: "Speaking", jpName: "会話・敬語 (Speaking & Keigo)", score: 86, color: "bg-purple-500" },
    ];
  }, [japaneseData]);

  // Modal Handlers
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

  const totalCalculatedGrade = metricGrades.reduce((acc, m) => acc + (Number(m.score) || 0), 0);

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
      console.warn("Failed to update task status:", err);
      loadStudentData();
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. WELCOME HEADER (Export Report Button Removed)          */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider">
              Student Learning &amp; Performance Portal
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Dashboard
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
            Welcome to your performance tracking workspace. Monitor your assigned workflows, deliverable tasks, Japanese language drills, and mentor feedback in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Magnet padding={20} magnetStrength={3}>
            <Link
              href="/student/learning-progress"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-500/20"
            >
              <span className="material-symbols-outlined text-base">trending_up</span>
              <span>Learning Progress</span>
            </Link>
          </Magnet>
          <Magnet padding={20} magnetStrength={3}>
            <Link
              href="/student/evaluations"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-200/80 shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">assignment</span>
              <span>Scorecards</span>
            </Link>
          </Magnet>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ENROLLED BATCH, MANAGER & TEACHER ASSIGNMENT CARD      */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-5 sm:p-6 rounded-2xl border border-indigo-100 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-100/60 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-indigo-900">
              Assigned Cohort &amp; Academic Supervision
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Enrollment ID: <strong className="text-slate-800">{cohortContext?.student?.enrollment_no || "Active Student"}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Cohort Batch Assigned */}
          <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Assigned Batch</span>
              <p className="font-bold text-sm text-slate-900 truncate mt-0.5">
                {cohortContext?.batch?.name || "Team Alpha / Cohort"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {cohortContext?.batch?.department || "Engineering & Japanese Track"}
              </p>
            </div>
          </div>

          {/* 2. Assigned Reporting Manager */}
          <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">engineering</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Reporting Manager</span>
              <p className="font-bold text-sm text-slate-900 truncate mt-0.5">
                {cohortContext?.manager?.name || "Engineering Manager"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {cohortContext?.manager?.email || "Supervises workflows & tasks"}
              </p>
            </div>
          </div>

          {/* 3. Assigned Japanese Teacher / Sensei */}
          <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">translate</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Japanese Sensei</span>
              <p className="font-bold text-sm text-slate-900 truncate mt-0.5">
                {cohortContext?.teacher?.name || "Japanese Faculty Sensei"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {cohortContext?.teacher?.email || "Conducts daily drills & evaluations"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CORE KPI METRICS                                       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Workflows Assigned */}
        <MetricCard
          title="Workflows Assigned"
          value={`${workflowsCount} Sprints`}
          numValue={workflowsCount}
          badge="Active"
          badgeType="success"
          progress={100}
          icon="account_tree"
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          subtitle={`${workflowNames.slice(0, 2).join(", ") || "Technical Workflow"}`}
          delay={0}
        />

        {/* 2. Tasks Assigned & Completed */}
        <MetricCard
          title="Tasks Completed"
          value={`${completedTasks} / ${totalTasks}`}
          numValue={completedTasks}
          suffix={` / ${totalTasks}`}
          badge={`${progressPct}% Complete`}
          badgeType={progressPct >= 80 ? "success" : "neutral"}
          progress={progressPct}
          icon="task_alt"
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
          delay={0.08}
        />

        {/* 3. Japanese Language Progress */}
        <MetricCard
          title="Japanese Progress"
          value={`${jpAvgScore}%`}
          numValue={jpAvgScore}
          suffix="%"
          badge={targetJlpt}
          badgeType="success"
          progress={jpAvgScore}
          icon="spellcheck"
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          subtitle={`${totalJpEvaluations} Drills • ${jpAttendance}% Attendance`}
          delay={0.16}
        />

        {/* 4. Overall Performance Status */}
        <MetricCard
          title="Performance Status"
          value={progressPct >= 80 ? "On Track" : "In Progress"}
          badge={jpAvgScore >= 80 ? "Grade A / 良" : "Grade B / 可"}
          badgeType={progressPct >= 80 ? "success" : "warning"}
          progress={Math.round((progressPct + jpAvgScore) / 2)}
          icon="verified"
          colorClass="text-teal-600"
          bgClass="bg-teal-50"
          subtitle="Integrated workflow & language grade"
          delay={0.24}
        />
      </div>

      {/* ========================================================= */}
      {/* 4. PERFORMANCE VELOCITY & ASSIGNED WORKFLOW TASKS         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Performance Trajectory & Japanese Skill Rubrics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Japanese Trajectory Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">show_chart</span>
                  <span>Japanese Score Progression &amp; Trajectory</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historical scores across daily language drills and milestone examinations.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100">
                Mean: {jpAvgScore}%
              </span>
            </div>

            <div className="h-60 pt-2">
              {isMounted && (
                <LineChart
                  xAxis={[{ scaleType: "point", data: chartTrajectory.labels }]}
                  yAxis={[{ min: 0, max: 100 }]}
                  series={[
                    {
                      data: chartTrajectory.scores,
                      color: "#4B2EF5",
                      area: true,
                      curve: "monotoneX",
                      label: "Evaluation Score %",
                      showMark: false,
                    },
                  ]}
                  height={230}
                  margin={{ top: 10, right: 20, bottom: 30, left: 35 }}
                />
              )}
            </div>
          </div>

          {/* Japanese 5 Core Skill Pillars */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base">translate</span>
                  <span>Japanese Competency Pillars (5 Core Skills)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time attainment breakdown assessed by your Japanese Sensei.
                </p>
              </div>
              <span className="text-xs font-bold text-primary">{targetJlpt} Curriculum</span>
            </div>

            <div className="space-y-3 pt-1">
              {skillPillars.map((skill) => (
                <div key={skill.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{skill.jpName}</span>
                    <span className="font-mono font-bold text-slate-900">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${skill.color}`}
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Assigned Workflow Tasks List */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-headline font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">assignment</span>
                  <span>Assigned Workflow Tasks</span>
                </h3>
                <p className="text-[11px] text-slate-500">Live deliverables assigned by your manager</p>
              </div>
              <span className="text-[11px] font-bold text-primary bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {pendingTasks} Pending
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {isLoadingTasks ? (
                <div className="flex items-center justify-center p-8 text-slate-400">
                  <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-xs">Loading assigned tasks...</span>
                </div>
              ) : realTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <span className="material-symbols-outlined text-2xl text-slate-300 mb-1">task</span>
                  <p className="text-xs font-medium">No assigned tasks yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tasks assigned in sprint workflows will appear here.</p>
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

                        <div className="flex-1 overflow-hidden min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs font-bold text-slate-900 truncate ${isDone ? "line-through text-slate-500" : ""}`}>
                              {task.title}
                            </h4>
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

                          {hasGrade && (
                            <div className="mt-1.5 flex items-center gap-1.5 font-bold text-emerald-700 text-[11px]">
                              <span className="material-symbols-outlined text-sm">stars</span>
                              <span>Self-Grade: {task.student_grade} / 100</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {task.workflow_name || "Sprint Workflow"}
                            </span>
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
          </div>

          <Link
            href="/student/learning-progress"
            className="pt-2 text-center text-xs font-bold text-primary hover:underline block"
          >
            View all workflow progress &rarr;
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. RECENT JAPANESE EVALUATIONS & SENSEI FEEDBACK          */}
      {/* ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">forum</span>
              <span>Recent Japanese Assessments &amp; Sensei Feedback</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct feedback remarks and scorecards from your Japanese instructor.
            </p>
          </div>
          <Link
            href="/student/evaluations"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all scorecards &rarr;
          </Link>
        </div>

        {!japaneseData?.evaluations_history || japaneseData.evaluations_history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No Japanese evaluations recorded yet. When your Sensei conducts your daily drill or milestone exam, it will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {japaneseData.evaluations_history.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.jlpt_level}
                    </span>
                    <span className="font-mono font-bold text-xs text-primary">{item.percentage}%</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mt-1.5">{item.evaluation_title}</h4>
                  <span className="text-[10px] text-slate-400 block">{shortDate(item.evaluation_date)}</span>
                </div>

                {item.feedback && (
                  <p className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                    &quot;{item.feedback}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Self-Grade & Deliverable Modal */}
      {selectedGradingTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded uppercase tracking-wider">
                  Deliverable Self-Grade &amp; Submission
                </span>
                <h3 className="text-base font-bold text-slate-900 font-headline mt-1">
                  {selectedGradingTask.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workflow: {selectedGradingTask.workflow_name || "Assigned Task"}
                </p>
              </div>
              <button
                onClick={() => setSelectedGradingTask(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {gradeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {gradeError}
              </div>
            )}

            <form onSubmit={handleSubmitGrade} className="space-y-4 text-xs">
              {selectedGradingTask.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                  <strong className="block text-slate-800 mb-0.5">Task Requirements:</strong>
                  {selectedGradingTask.description}
                </div>
              )}

              {/* Rubric Metrics Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 uppercase tracking-wide">
                    Self-Grade by Competencies
                  </label>
                  <span className="font-mono font-bold text-primary text-xs">
                    Total: {totalCalculatedGrade} / 100
                  </span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {metricGrades.map((metric, idx) => (
                    <div key={metric.metric_name} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800 truncate">{metric.metric_name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={metric.full_score}
                            value={metric.score}
                            onChange={(e) => handleMetricScoreChange(idx, Number(e.target.value))}
                            className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-slate-400 text-[11px]">/ {metric.full_score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverable Notes */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Deliverable Notes / Artifact Link
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Paste GitHub PR, deployment link, or explain your solution implementation..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedGradingTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
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

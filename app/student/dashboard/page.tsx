"use client";

import { getAuthSession, fetchMe, UserSession } from "@/utils/auth";

import React, { useState } from "react";
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

  React.useEffect(() => {
    const s = getAuthSession();
    if (s && s.user) {
      const name = s.user.name || s.user.email.split("@")[0];
      setUserName(name);
    } else {
      fetchMe().then((me) => {
        const name = me.name || me.email.split("@")[0];
        setUserName(name);
      }).catch(() => {});
    }
  }, []);


  const weeklyData = [
    { day: "Mon", pct: 72, tasks: 4 },
    { day: "Tue", pct: 85, tasks: 6 },
    { day: "Wed", pct: 90, tasks: 7 },
    { day: "Thu", pct: 68, tasks: 3 },
    { day: "Fri", pct: 94, tasks: 8 },
    { day: "Sat", pct: 80, tasks: 5 },
    { day: "Sun", pct: 76, tasks: 4 },
  ];

  const monthlyData = [
    { day: "W1", pct: 78, tasks: 22 },
    { day: "W2", pct: 88, tasks: 29 },
    { day: "W3", pct: 92, tasks: 31 },
    { day: "W4", pct: 84, tasks: 26 },
  ];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Overall Progress"
          value="86%"
          numValue={86}
          suffix="%"
          badge="+4.2% MoM"
          badgeType="success"
          progress={86}
          icon="trending_up"
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
          delay={0}
        />
        <MetricCard
          title="Active Tasks"
          value="8 / 10"
          numValue={8}
          suffix=" / 10"
          badge="2 due today"
          badgeType="neutral"
          progress={80}
          icon="task_alt"
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
          delay={0.08}
        />
        <MetricCard
          title="Learning Hours"
          value="74 hrs"
          numValue={74}
          suffix=" hrs"
          badge="Goal: 90 hrs"
          badgeType="success"
          progress={82}
          icon="school"
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          delay={0.16}
        />
        <MetricCard
          title="Performance Status"
          value="On Track"
          badge="Tier 1"
          badgeType="success"
          progress={100}
          icon="verified"
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          subtitle="Next evaluation review in 14 days"
          delay={0.24}
        />
      </div>

      {/* ========================================================= */}
      {/* MIDDLE SECTION: VELOCITY CHART & NEXT ACTIONS            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Task Velocity Interactive Chart (Span 2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="font-headline font-bold text-lg text-slate-900">
                Performance &amp; Task Velocity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Weekly task completion velocity vs. milestone benchmarks
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
              <button
                onClick={() => setVelocityTimeframe("weekly")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  velocityTimeframe === "weekly"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setVelocityTimeframe("monthly")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  velocityTimeframe === "monthly"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 justify-between pt-4 px-2 sm:px-4 border-b border-slate-100">
            {chartData.map((item, idx) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <span className="text-[11px] font-mono text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.pct}%
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${item.pct}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.06, ease: "easeOut" }}
                  className="w-full max-w-[48px] bg-indigo-100/80 rounded-t-lg group-hover:bg-indigo-600 transition-colors duration-300 relative shadow-2xs"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-t-lg pointer-events-none" />
                </motion.div>
                <span className="text-xs text-slate-500 group-hover:text-slate-900 font-medium pt-1">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          {/* Chart Insights Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 mt-2 text-xs">
            <div>
              <span className="text-slate-500 block">Current Velocity</span>
              <strong className="text-slate-900 font-semibold text-sm">18.4 pts / wk</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Quarterly Benchmark</span>
              <strong className="text-slate-900 font-semibold text-sm">16.0 pts / wk</strong>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block">Efficiency Index</span>
              <strong className="text-emerald-600 font-semibold text-sm">+15% ahead</strong>
            </div>
          </div>
        </motion.div>

        {/* Right: Next Actions Checklist */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-space-md">
            <h2 className="font-headline font-bold text-headline-sm text-on-surface">Next Actions</h2>
            <span className="text-label-sm text-primary font-bold">3 Pending</span>
          </div>

          <div className="space-y-3 flex-1">
            
            {/* Action 1 */}
            <div
              onClick={() => toggleAction("act1")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                actionDone["act1"]
                  ? "bg-surface-container/50 border-surface-container-highest/40 opacity-60 line-through"
                  : "bg-surface-container-lowest border-surface-container-highest hover:border-primary/40 shadow-2xs"
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                actionDone["act1"] ? "bg-primary border-primary text-on-primary" : "border-slate-300 bg-white"
              }`}>
                {actionDone["act1"] && <span className="material-symbols-outlined text-sm">check</span>}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-body-md font-semibold text-on-surface">Complete Self Evaluation</h4>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Due Fri</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Submit personal reflection for Q3 rubrics.
                </p>
              </div>
            </div>

            {/* Action 2 */}
            <div
              onClick={() => toggleAction("act2")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                actionDone["act2"]
                  ? "bg-surface-container/50 border-surface-container-highest/40 opacity-60 line-through"
                  : "bg-surface-container-lowest border-surface-container-highest hover:border-primary/40 shadow-2xs"
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                actionDone["act2"] ? "bg-primary border-primary text-on-primary" : "border-slate-300 bg-white"
              }`}>
                {actionDone["act2"] && <span className="material-symbols-outlined text-sm">check</span>}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-body-md font-semibold text-on-surface">Review Mentor Feedback</h4>
                  <span className="text-[10px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-md">Dr. Tanaka</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Check comments on Cloud Microservices architecture PR.
                </p>
              </div>
            </div>

            {/* Action 3 */}
            <div
              onClick={() => toggleAction("act3")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                actionDone["act3"]
                  ? "bg-surface-container/50 border-surface-container-highest/40 opacity-60 line-through"
                  : "bg-surface-container-lowest border-surface-container-highest hover:border-primary/40 shadow-2xs"
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                actionDone["act3"] ? "bg-primary border-primary text-on-primary" : "border-slate-300 bg-white"
              }`}>
                {actionDone["act3"] && <span className="material-symbols-outlined text-sm">check</span>}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-body-md font-semibold text-on-surface">Japanese N3 Kanji Review</h4>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">Daily 20</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Complete today&apos;s JLPT Kanji flashcard deck.
                </p>
              </div>
            </div>

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
        <div className="lg:col-span-2 bg-surface-container-low p-6 sm:p-space-lg rounded-2xl border border-surface-container-highest/60 shadow-xs">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <h2 className="font-headline font-bold text-headline-sm text-on-surface">
                Recent Feedback &amp; Evaluations
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Evaluator ratings and rubric notes from assigned mentors
              </p>
            </div>
            <Link
              href="/student/evaluations"
              className="text-label-sm font-bold text-primary hover:underline"
            >
              View History
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feedback Card 1 */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest/80 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-primary uppercase">Internship Domain</span>
                  <div className="flex items-center text-amber-500 text-xs">
                    {"★".repeat(5)}
                    <span className="ml-1 text-on-surface font-bold">4.9</span>
                  </div>
                </div>
                <h4 className="text-body-md font-bold text-on-surface mb-1">
                  Mid-Quarter Performance Review
                </h4>
                <p className="text-body-sm text-on-surface-variant line-clamp-3">
                  &ldquo;Kanishka demonstrated remarkable speed in adopting our Next.js App Router and Next Auth architecture. Clean TypeScript typing and enthusiastic team collaboration.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-medium text-on-surface">Dr. Tanaka • Lead Architect</span>
                <span>Sep 18, 2026</span>
              </div>
            </div>

            {/* Feedback Card 2 */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest/80 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-purple-600 uppercase">Japanese Language</span>
                  <div className="flex items-center text-amber-500 text-xs">
                    {"★".repeat(4)}
                    <span className="ml-1 text-on-surface font-bold">4.7</span>
                  </div>
                </div>
                <h4 className="text-body-md font-bold text-on-surface mb-1">
                  Business Keigo &amp; Dialogue
                </h4>
                <p className="text-body-sm text-on-surface-variant line-clamp-3">
                  &ldquo;Excellent pronunciation during our standup rehearsal. Grammar is sound; recommend focusing on polite email conventions (Sonkeigo/Kenjougo) next week.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-medium text-on-surface">Yuki Sato • Language Mentor</span>
                <span>Sep 15, 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum & Skills Snapshot Widget */}
        <div className="relative bg-white p-6 sm:p-space-lg rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-xs overflow-hidden">
          <BorderBeam size={220} duration={12} colorFrom="#4B2EF5" colorTo="#a855f7" borderWidth={1.5} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                CURRICULUM ROADMAP
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                Sprint 6 of 8
              </span>
            </div>
            <h2 className="font-headline font-bold text-headline-sm text-on-surface mb-1">
              Learning Trajectory
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Your weekly task progress and technical milestone completion.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-sm font-semibold text-on-surface">Active Sprint</span>
                <span className="text-body-sm font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  On Schedule
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                <span>Technical Milestones</span>
                <span className="font-bold text-on-surface">88%</span>
              </div>
              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "88%" }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
              <span>Next Evaluation Cycle</span>
              <strong className="text-on-surface">End of Quarter (Q3)</strong>
            </div>
          </div>

          <div className="mt-6 w-full">
            <Magnet padding={20} magnetStrength={3} className="w-full">
              <Link
                href="/student/learning-progress"
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-label-md flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-2xs"
              >
                <span>View Full Learning Roadmap</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </Magnet>
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import Magnet from "@/components/animations/Magnet";

interface GanttTrack {
  id: string;
  name: string;
  category: string;
  days: {
    day: number;
    status: "completed" | "in-progress" | "blocked" | "weekend" | "planned";
    taskName?: string;
    hours?: number;
  }[];
}

const DAYS_IN_MONTH = 30;

// Generate simulated Gantt data for 30 days
const GANTT_TRACKS: GanttTrack[] = [
  {
    id: "track-1",
    name: "API Integration & Endpoints",
    category: "Technical Internship",
    days: Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
      const day = i + 1;
      const isWeekend = day % 7 === 6 || day % 7 === 0;
      if (isWeekend) return { day, status: "weekend" };
      if (day <= 14) return { day, status: "completed", taskName: "Auth Middleware & Route Handlers", hours: 6 };
      if (day <= 20) return { day, status: "in-progress", taskName: "Async Session Management", hours: 5.5 };
      return { day, status: "planned", taskName: "Performance Caching Benchmarks", hours: 0 };
    }),
  },
  {
    id: "track-2",
    name: "System Documentation & Tests",
    category: "Technical Internship",
    days: Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
      const day = i + 1;
      const isWeekend = day % 7 === 6 || day % 7 === 0;
      if (isWeekend) return { day, status: "weekend" };
      if (day <= 8) return { day, status: "completed", taskName: "Playwright E2E Spec Setup", hours: 4 };
      if (day <= 16) return { day, status: "completed", taskName: "Vitest Unit Test Suite", hours: 5 };
      if (day <= 22) return { day, status: "in-progress", taskName: "API Swagger OpenAPI Specs", hours: 4 };
      return { day, status: "planned", taskName: "Architecture Runbook", hours: 0 };
    }),
  },
  {
    id: "track-3",
    name: "Japanese Learning (JLPT N3)",
    category: "Linguistic Track",
    days: Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
      const day = i + 1;
      const isWeekend = day % 7 === 6 || day % 7 === 0;
      if (isWeekend) return { day, status: "weekend" };
      if (day <= 18) return { day, status: "completed", taskName: "Kanji Radicals & Passive Grammar", hours: 2.5 };
      if (day <= 24) return { day, status: "in-progress", taskName: "Keigo Business Dialogue Simulation", hours: 2 };
      return { day, status: "planned", taskName: "JLPT N3 Mock Exam Preparation", hours: 0 };
    }),
  },
  {
    id: "track-4",
    name: "Evaluation & Portfolio Assembly",
    category: "Appraisal Cycle",
    days: Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
      const day = i + 1;
      const isWeekend = day % 7 === 6 || day % 7 === 0;
      if (isWeekend) return { day, status: "weekend" };
      if (day <= 12) return { day, status: "planned" };
      if (day <= 19) return { day, status: "in-progress", taskName: "Self-Appraisal Draft Synthesis", hours: 2 };
      if (day <= 25) return { day, status: "planned", taskName: "Mentor Feedback Consolidation", hours: 0 };
      return { day, status: "planned", taskName: "Final Sign-off Packet", hours: 0 };
    }),
  },
  {
    id: "track-5",
    name: "Coursera Cloud Native Specialization",
    category: "External Certifications",
    days: Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
      const day = i + 1;
      const isWeekend = day % 7 === 6 || day % 7 === 0;
      if (isWeekend) return { day, status: "weekend" };
      if (day <= 16) return { day, status: "completed", taskName: "Module 3: Containerization & Pods", hours: 3 };
      if (day <= 22) return { day, status: "in-progress", taskName: "Module 4: CI/CD Pipeline Automation", hours: 3 };
      return { day, status: "planned", taskName: "Capstone Deployment Project", hours: 0 };
    }),
  },
];

export default function StudentReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState("Q3-2026");
  const [reportType, setReportType] = useState("full");
  const [activeView, setActiveView] = useState<"month" | "week">("month");
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    trackName: string;
    day: number;
    taskName?: string;
    status: string;
    hours?: number;
  } | null>(null);

  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = (type: "pdf" | "csv") => {
    setExportNotice(`Exporting ${type.toUpperCase()} report for ${selectedQuarter}...`);
    setTimeout(() => {
      setExportNotice(null);
    }, 3000);
  };

  return (
    <div className="w-full pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline font-bold text-3xl text-slate-900">Reports</h1>
          <p className="text-body-md text-slate-600 mt-1">
            Generate, inspect, and download your performance and daily Gantt reports for any quarter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Magnet padding={20} magnetStrength={3}>
            <button
              onClick={() => handleExport("csv")}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-slate-500">download</span>
              Export CSV
            </button>
          </Magnet>
          <Magnet padding={20} magnetStrength={3}>
            <button
              onClick={() => handleExport("pdf")}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-primary hover:bg-[#4326dd] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Export PDF
            </button>
          </Magnet>
        </div>
      </div>

      {/* Temporary Export Notification Banner */}
      {exportNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
            <span>{exportNotice} Your download will begin momentarily.</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Row 1: Control Bar Card */}
      <div className="bg-white border border-surface-container-highest/60 rounded-2xl p-6 mb-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-5 flex-1">
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Quarter / Range
              </label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="Q3-2026">Q3 2026 (Jul - Sep)</option>
                <option value="Q2-2026">Q2 2026 (Apr - Jun)</option>
                <option value="Q1-2026">Q1 2026 (Jan - Mar)</option>
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
                <option value="full">Full Quarter Appraisal Dossier</option>
                <option value="summary">Performance KPI Summary</option>
                <option value="gantt">Daily Progress Gantt</option>
                <option value="learning">Japanese & Learning Track</option>
              </select>
            </div>

            <div className="flex items-end self-end">
              <button
                onClick={() => handleExport("pdf")}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-on-primary bg-primary hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">autorenew</span>
                Generate Preview
              </button>
            </div>
          </div>

          <div className="text-xs text-on-surface-variant self-end md:self-center">
            Last generated: <span className="font-bold text-on-surface">18 Sep 2026, 09:12 AM</span>
          </div>
        </div>
      </div>

      {/* Row 2: Daily Performance Gantt Chart Card */}
      <div className="bg-white border border-surface-container-highest/60 rounded-2xl p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">
              Daily Performance Gantt — Kanishka Sharma / {selectedQuarter}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Visual distribution of daily goals and task completion cadence across September (Day 01 - 30).
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <span className="text-on-surface-variant px-2">View:</span>
            <button
              onClick={() => setActiveView("month")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeView === "month"
                  ? "bg-primary text-on-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setActiveView("week")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeView === "week"
                  ? "bg-primary text-on-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Gantt Chart Container with Horizontal Scroll */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[1020px] bg-slate-50/50 border border-slate-200 rounded-xl p-4">
            {/* Header Dates Row */}
            <div className="grid grid-cols-[240px_repeat(30,minmax(24px,1fr))] gap-1 pb-3 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-500 flex items-center uppercase tracking-wider">
                Workstream / Task
              </div>
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
                const dayLabel = daysOfWeek[i % 7];
                const isWeekend = i % 7 === 5 || i % 7 === 6;
                return (
                  <div
                    key={day}
                    className={`text-center text-[10px] font-bold ${
                      isWeekend ? "text-slate-400 bg-slate-200/50 rounded" : "text-slate-700"
                    }`}
                  >
                    <span>{dayLabel}</span>
                    <br />
                    <span>{day < 10 ? `0${day}` : day}</span>
                  </div>
                );
              })}
            </div>

            {/* Gantt Rows */}
            <div className="divide-y divide-slate-200/70">
              {GANTT_TRACKS.map((track) => (
                <div
                  key={track.id}
                  className="grid grid-cols-[240px_repeat(30,minmax(24px,1fr))] gap-1 py-3 items-center hover:bg-white transition-colors rounded-lg"
                >
                  <div className="pr-2">
                    <p className="text-xs font-bold text-on-surface truncate">{track.name}</p>
                    <span className="text-[10px] text-primary font-medium">{track.category}</span>
                  </div>

                  {track.days.map((d) => {
                    let cellColor = "bg-slate-100";
                    if (d.status === "completed") cellColor = "bg-emerald-500 hover:bg-emerald-600";
                    if (d.status === "in-progress") cellColor = "bg-indigo-600 hover:bg-indigo-700";
                    if (d.status === "blocked") cellColor = "bg-amber-500 hover:bg-amber-600";
                    if (d.status === "weekend") cellColor = "bg-slate-200/60";

                    return (
                      <button
                        key={d.day}
                        onClick={() =>
                          setSelectedDayDetail({
                            trackName: track.name,
                            day: d.day,
                            taskName: d.taskName,
                            status: d.status,
                            hours: d.hours,
                          })
                        }
                        title={`Day ${d.day}: ${d.taskName || d.status}`}
                        className={`h-7 rounded-sm transition-all flex items-center justify-center cursor-pointer ${cellColor}`}
                      >
                        {d.status === "completed" && (
                          <span className="material-symbols-outlined text-[12px] text-white">check</span>
                        )}
                        {d.status === "in-progress" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Daily Status Footer Row */}
            <div className="grid grid-cols-[240px_repeat(30,minmax(24px,1fr))] gap-1 pt-3 border-t border-slate-200 items-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Logged Effort (Hours)
              </div>
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const isWeekend = i % 7 === 5 || i % 7 === 6;
                const hours = isWeekend ? "-" : day <= 20 ? "7.5" : "-";
                return (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-600">
                    {hours}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend Bar & Quick Detail */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-2 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-500 font-medium">Status Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-700 font-medium">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600" />
              <span className="text-slate-700 font-medium">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-700 font-medium">Attention Needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200" />
              <span className="text-slate-700 font-medium">Weekend / Off</span>
            </div>
          </div>

          <div className="text-xs text-primary font-semibold">
            Click any cell in the chart to inspect daily deliverables
          </div>
        </div>

        {/* Selected Day Inspect Card */}
        {selectedDayDetail && (
          <div className="mt-5 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {selectedDayDetail.day}
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">
                  {selectedDayDetail.trackName} — Day {selectedDayDetail.day}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Task: <span className="font-medium text-indigo-900">{selectedDayDetail.taskName || "General Sprint Roadmap"}</span> · Status:{" "}
                  <span className="font-semibold uppercase text-indigo-700">{selectedDayDetail.status}</span>
                  {selectedDayDetail.hours ? ` · Logged: ${selectedDayDetail.hours} hrs` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDayDetail(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Row 3: Report Preview Card (Printable Document Style) */}
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
                MiRai Trainee Performance Report
              </span>
              <p className="text-[11px] text-slate-500">Official Appraisal Cycle Document · confidential</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <p className="font-bold text-on-surface">Student: Kanishka Sharma</p>
            <p className="text-slate-500">ID: DIL-TR-2026-088 · Cohort: 2026-A</p>
            <p className="text-slate-500">Appraisal Period: Q3 2026 (July - September)</p>
          </div>
        </div>

        {/* Section A: Performance Summary */}
        <div className="mb-8">
          <h3 className="font-headline font-bold text-base text-on-surface mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs flex items-center justify-center font-bold">
              A
            </span>
            Performance & Milestone Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Evaluation Dimension</th>
                  <th className="py-2.5 px-4">Target Benchmark</th>
                  <th className="py-2.5 px-4">Actual Attainment</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Weighted Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Technical Task Completion</td>
                  <td className="py-3 px-4">75% Sprint Tasks</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">78% Achieved</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      Exceeds
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">4.9 / 5.0</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Japanese Language Progress</td>
                  <td className="py-3 px-4">60% JLPT N3 Target</td>
                  <td className="py-3 px-4 font-bold text-blue-600">64% Mastery</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                      On Track
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">4.8 / 5.0</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Mentor & Team Feedback</td>
                  <td className="py-3 px-4">4.5 / 5.0 Satisfaction</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">4.9 / 5.0 Avg</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      Exceeds
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">4.9 / 5.0</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Attendance & Punctuality</td>
                  <td className="py-3 px-4">90% Live Sessions</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">94% Attended</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      Exceeds
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">4.8 / 5.0</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-slate-900">
                    Aggregate Composite Performance Index
                  </td>
                  <td className="py-3 px-4 text-right text-primary text-sm">4.85 / 5.0</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section B & C in 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Section B: Daily Progress Summary */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
            <h3 className="font-headline font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs flex items-center justify-center font-bold">
                B
              </span>
              Daily Cadence Highlights
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">check_circle</span>
                <span><strong>48 of 52</strong> planned sprint daily tasks completed on schedule.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">check_circle</span>
                <span>Zero major blockages reported; average resolution time under 4 hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">trending_up</span>
                <span>Consistent velocity of 7.5 logged productive hours per business day.</span>
              </li>
            </ul>
          </div>

          {/* Section C: Learning & Japanese Attributes */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
            <h3 className="font-headline font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs flex items-center justify-center font-bold">
                C
              </span>
              Linguistic & Certifications
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">translate</span>
                <span><strong>280 of 300</strong> JLPT N3 Target Kanji memorized and verified.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">verified</span>
                <span>Coursera: Cloud Native Specialization (Modules 1-3 certified 100%).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-sm mt-0.5">record_voice_over</span>
                <span>Business oral simulation rating: <strong>4.8 / 5.0</strong> from Yuki Sato sensei.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section D: Historical Quarters Comparison */}
        <div>
          <h3 className="font-headline font-bold text-base text-on-surface mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-xs flex items-center justify-center font-bold">
              D
            </span>
            Historical Quarters Record
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Q1 2026</span>
                <span className="text-[11px] text-emerald-600 font-semibold">Completed</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1">4.70 <span className="text-xs font-normal text-slate-500">/ 5.0</span></p>
              <p className="text-[11px] text-slate-500 mt-1">Foundational Onboarding & N4 Prep</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Q2 2026</span>
                <span className="text-[11px] text-emerald-600 font-semibold">Completed</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1">4.80 <span className="text-xs font-normal text-slate-500">/ 5.0</span></p>
              <p className="text-[11px] text-slate-500 mt-1">Full-stack Feature Delivery & N3 Start</p>
            </div>

            <div className="p-4 rounded-xl border-2 border-primary bg-indigo-50/40">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-primary">Q3 2026 (Active)</span>
                <span className="text-[11px] text-primary font-semibold">Current Cycle</span>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">4.85 <span className="text-xs font-normal text-slate-500">/ 5.0</span></p>
              <p className="text-[11px] text-slate-600 mt-1">Advanced Architecture & Keigo Mastery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

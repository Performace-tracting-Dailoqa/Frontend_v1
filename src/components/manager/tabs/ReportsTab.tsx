"use client";

import React, { useState, useMemo } from "react";
import { WorkflowTask, TeamMember } from "@/services/workflowService";
import CountUp from "@/components/animations/CountUp";

interface ReportsTabProps {
  tasks: WorkflowTask[];
  teamMembers: TeamMember[];
}

export default function ReportsTab({ tasks, teamMembers }: ReportsTabProps) {
  const [downloading, setDownloading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("all");

  const batches = useMemo(() => {
    const set = new Set<string>();
    teamMembers.forEach((m) => {
      if (m.batch_name) set.add(m.batch_name);
    });
    return Array.from(set);
  }, [teamMembers]);

  // Evaluated tasks
  const evaluatedTasks = useMemo(() => {
    return tasks.filter((t) => t.manager_grade !== null && t.manager_grade !== undefined);
  }, [tasks]);

  const avgCohortGrade = useMemo(() => {
    if (evaluatedTasks.length === 0) return 0;
    const sum = evaluatedTasks.reduce((acc, t) => acc + (t.manager_grade || 0), 0);
    return Math.round(sum / evaluatedTasks.length);
  }, [evaluatedTasks]);

  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.status === "completed" || t.status === "done").length;
  }, [tasks]);

  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Performance Tiers
  const tierExceeds = evaluatedTasks.filter((t) => (t.manager_grade || 0) >= 90).length;
  const tierMeets = evaluatedTasks.filter((t) => (t.manager_grade || 0) >= 75 && (t.manager_grade || 0) < 90).length;
  const tierNeedsHelp = evaluatedTasks.filter((t) => (t.manager_grade || 0) < 75).length;

  const handleExportCSV = () => {
    setDownloading(true);
    try {
      const headers = [
        "Task Title",
        "Workflow",
        "Learner Name",
        "Enrollment No",
        "Batch",
        "Priority",
        "Status",
        "Student Self Grade",
        "Manager Evaluated Grade",
        "Final Grade",
        "Due Date",
        "Submitted At",
        "Completed At",
        "Learner Notes",
      ];

      const rows = tasks.map((t) => {
        const student = teamMembers.find((m) => m.id === t.student_id);
        return [
          `"${(t.title || "").replace(/"/g, '""')}"`,
          `"${(t.workflow_id || "Sprint Deliverable").replace(/"/g, '""')}"`,
          `"${(student?.name || "Intern").replace(/"/g, '""')}"`,
          `"${student?.enrollment_no || ""}"`,
          `"${student?.batch_name || ""}"`,
          `"${t.priority || "medium"}"`,
          `"${t.status || "pending"}"`,
          t.student_grade !== null && t.student_grade !== undefined ? t.student_grade : "",
          t.manager_grade !== null && t.manager_grade !== undefined ? t.manager_grade : "",
          t.final_grade !== null && t.final_grade !== undefined ? t.final_grade : "",
          `"${t.due_date || ""}"`,
          `"${t.submitted_at || ""}"`,
          `"${t.completed_at || ""}"`,
          `"${(t.submission_notes || "").replace(/"/g, '""')}"`,
        ].join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `manager_cohort_evaluation_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-headline font-bold text-on-surface">
            Team Performance &amp; Evaluation Reports
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Live cohort diagnostics, rubric tier analytics, and institutional dossier exports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={tasks.length === 0 || downloading}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          <span>{downloading ? "Compiling Dossier..." : "Export Cohort CSV"}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">Total Tasks Tracked</span>
          <div className="text-3xl font-bold font-headline text-on-surface mt-2">
            <CountUp to={tasks.length} duration={1.2} />
          </div>
          <p className="text-[11px] text-outline mt-1">{teamMembers.length} monitored interns</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Avg Cohort Grade</span>
          <div className="text-3xl font-bold font-headline text-emerald-700 mt-2">
            <CountUp to={avgCohortGrade} suffix=" / 100" duration={1.2} />
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Across {evaluatedTasks.length} evaluated tasks</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Completion Velocity</span>
          <div className="text-3xl font-bold font-headline text-primary mt-2">
            <CountUp to={completionRate} suffix="%" duration={1.2} />
          </div>
          <p className="text-[11px] text-primary font-medium mt-1">{completedCount} of {tasks.length} completed</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Active Batches</span>
          <div className="text-3xl font-bold font-headline text-amber-700 mt-2">
            <CountUp to={batches.length || 1} duration={1.2} />
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Institutional cohorts</p>
        </div>
      </div>

      {/* Performance Tiers Breakdown */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
        <h4 className="text-title-md font-bold text-on-surface font-headline mb-1">
          Performance Tier Classification
        </h4>
        <p className="text-xs text-on-surface-variant mb-4">
          Distribution of evaluated deliverables based on manager scores and rubric criteria.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Exceeds (90 - 100)</span>
              <span className="material-symbols-outlined text-emerald-600 text-lg">star</span>
            </div>
            <div className="text-2xl font-bold font-headline text-emerald-900 font-mono">
              {tierExceeds} <span className="text-xs font-normal text-emerald-700">tasks</span>
            </div>
            <p className="text-[11px] text-emerald-700">Exceptional code quality &amp; architecture</p>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Meets (75 - 89)</span>
              <span className="material-symbols-outlined text-indigo-600 text-lg">check_circle</span>
            </div>
            <div className="text-2xl font-bold font-headline text-indigo-900 font-mono">
              {tierMeets} <span className="text-xs font-normal text-indigo-700">tasks</span>
            </div>
            <p className="text-[11px] text-indigo-700">High technical delivery standard</p>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">Needs Support (&lt;75)</span>
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
            </div>
            <div className="text-2xl font-bold font-headline text-amber-900 font-mono">
              {tierNeedsHelp} <span className="text-xs font-normal text-amber-700">tasks</span>
            </div>
            <p className="text-[11px] text-amber-700">Requires targeted 1-on-1 mentorship</p>
          </div>
        </div>
      </div>
    </div>
  );
}

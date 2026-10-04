"use client";

import React, { useState, useMemo } from "react";
import { WorkflowTask, TeamMember, ManagerTeam, Workflow } from "@/services/workflowService";

interface ReportsTabProps {
  teams?: ManagerTeam[];
  teamMembers: TeamMember[];
  workflows?: Workflow[];
  tasks: WorkflowTask[];
}

type ReportViewLevel = "workflow" | "task" | "employee";

export default function ReportsTab({
  teams = [],
  teamMembers,
  workflows = [],
  tasks,
}: ReportsTabProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  // Filter workflows by selected team
  const availableWorkflows = useMemo(() => {
    if (!selectedTeamId) return workflows;
    return workflows.filter((w) => w.batch_id === selectedTeamId);
  }, [workflows, selectedTeamId]);

  const selectedWorkflow = useMemo(
    () => availableWorkflows.find((w) => w.id === selectedWorkflowId) || null,
    [availableWorkflows, selectedWorkflowId]
  );

  // Tasks in selected workflow
  const workflowTasks = useMemo(() => {
    if (!selectedWorkflowId) return [];
    return tasks.filter((t) => t.workflow_id === selectedWorkflowId);
  }, [tasks, selectedWorkflowId]);

  // Distinct tasks titles in this workflow
  const distinctTaskTitles = useMemo(() => {
    return Array.from(new Set(workflowTasks.map((t) => t.title)));
  }, [workflowTasks]);

  // Tasks for selected title
  const titleTasks = useMemo(() => {
    if (!selectedTaskTitle) return workflowTasks;
    return workflowTasks.filter((t) => t.title === selectedTaskTitle);
  }, [workflowTasks, selectedTaskTitle]);

  // Students in this workflow
  const workflowStudents = useMemo(() => {
    const sids = new Set(workflowTasks.map((t) => t.student_id));
    return teamMembers.filter((m) => sids.has(m.id));
  }, [workflowTasks, teamMembers]);

  const selectedStudent = useMemo(
    () => teamMembers.find((m) => m.id === selectedStudentId) || null,
    [teamMembers, selectedStudentId]
  );

  // Active Report Level
  const activeReportLevel: ReportViewLevel = useMemo(() => {
    if (selectedStudentId) return "employee";
    if (selectedTaskTitle) return "task";
    return "workflow";
  }, [selectedStudentId, selectedTaskTitle]);

  // Metrics for current workflow
  const evaluatedWfTasks = useMemo(
    () => workflowTasks.filter((t) => t.manager_grade !== null && t.manager_grade !== undefined),
    [workflowTasks]
  );

  const avgWorkflowScore = useMemo(() => {
    if (evaluatedWfTasks.length === 0) return 0;
    const sum = evaluatedWfTasks.reduce((acc, t) => acc + (t.manager_grade || 0), 0);
    return Math.round(sum / evaluatedWfTasks.length);
  }, [evaluatedWfTasks]);

  const completedWfTasks = useMemo(
    () => workflowTasks.filter((t) => ["completed", "done"].includes((t.status || "").toLowerCase())),
    [workflowTasks]
  );

  const completionRate =
    workflowTasks.length > 0 ? Math.round((completedWfTasks.length / workflowTasks.length) * 100) : 0;

  // Single student metrics
  const studentTasks = useMemo(() => {
    if (!selectedStudentId) return [];
    return workflowTasks.filter((t) => t.student_id === selectedStudentId);
  }, [workflowTasks, selectedStudentId]);

  const studentAvgGrade = useMemo(() => {
    const ev = studentTasks.filter((t) => t.manager_grade !== null && t.manager_grade !== undefined);
    if (ev.length === 0) return 0;
    const sum = ev.reduce((acc, t) => acc + (t.manager_grade || 0), 0);
    return Math.round(sum / ev.length);
  }, [studentTasks]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-Printable Controls Banner */}
      <div className="print:hidden space-y-4">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-base">description</span>
              <span>Managerial Report Generator</span>
            </div>
            <h2 className="text-xl font-headline font-bold text-on-surface">Hierarchical Reports &amp; Transcripts</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Generate executive reports for a Team Workflow, drill into a specific Task, or create a Single Employee Report Card.
            </p>
          </div>
          {selectedWorkflow && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary text-white text-body-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              <span>Print / Save PDF Report</span>
            </button>
          )}
        </div>

        {/* 4-Level Report Scope Selector */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <span className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">account_tree</span>
              <span>1. Choose Report Scope</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-on-surface-variant">
                Active Report:{" "}
                <strong className="text-primary font-bold uppercase">{activeReportLevel} Report</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Select Team */}
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                1. Select Team *
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setSelectedWorkflowId("");
                  setSelectedTaskTitle("");
                  setSelectedStudentId("");
                }}
                className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="">Choose a team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.member_count} members)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Select Workflow */}
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                2. Select Workflow *
              </label>
              <select
                value={selectedWorkflowId}
                disabled={!selectedTeamId || availableWorkflows.length === 0}
                onChange={(e) => {
                  setSelectedWorkflowId(e.target.value);
                  setSelectedTaskTitle("");
                  setSelectedStudentId("");
                }}
                className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium disabled:opacity-50"
              >
                <option value="">Choose team workflow...</option>
                {availableWorkflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Optional: Select Task */}
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                3. Select Task (Optional)
              </label>
              <select
                value={selectedTaskTitle}
                disabled={!selectedWorkflowId || distinctTaskTitles.length === 0}
                onChange={(e) => {
                  setSelectedTaskTitle(e.target.value);
                  setSelectedStudentId("");
                }}
                className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium disabled:opacity-50"
              >
                <option value="">All Tasks (Workflow Summary)</option>
                {distinctTaskTitles.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Optional: Select Employee */}
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                4. Select Employee (Optional)
              </label>
              <select
                value={selectedStudentId}
                disabled={!selectedWorkflowId || workflowStudents.length === 0}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium disabled:opacity-50"
              >
                <option value="">All Employees / Learners</option>
                {workflowStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} [Batch: {s.batch_name || "Assigned"}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope Indicator Pill Bar */}
          <div className="flex items-center gap-2 pt-2 text-xs flex-wrap">
            <span className="text-outline">Active Report Filters:</span>
            {selectedTeam && (
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                Team: {selectedTeam.name}
              </span>
            )}
            {selectedWorkflow && (
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full font-semibold">
                Workflow: {selectedWorkflow.name}
              </span>
            )}
            {selectedTaskTitle && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold">
                Task: {selectedTaskTitle}
              </span>
            )}
            {selectedStudent && (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                Employee: {selectedStudent.name} (Batch: {selectedStudent.batch_name || "Cohort"})
              </span>
            )}
            {(selectedTaskTitle || selectedStudentId) && (
              <button
                onClick={() => {
                  setSelectedTaskTitle("");
                  setSelectedStudentId("");
                }}
                className="text-primary hover:underline font-semibold ml-2 cursor-pointer"
              >
                Reset to Workflow Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REPORT CONTENT CANVAS (Formatted for web view and clean print export)    */}
      {/* ========================================================================= */}
      {!selectedWorkflow ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl">summarize</span>
          </div>
          <h3 className="text-base font-bold text-on-surface font-headline">Select a Team &amp; Workflow</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
            Choose a Team and Workflow from the selector above to preview the executive performance report and export it as a clean printable PDF.
          </p>
        </div>
      ) : activeReportLevel === "employee" && selectedStudent ? (
        /* ========================================================================= */
        /* OPTION C: SINGLE EMPLOYEE / STUDENT REPORT CARD                           */
        /* ========================================================================= */
        <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Official Report Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
                <span>Enterprise Performance Management</span>
              </div>
              <h1 className="text-2xl font-black font-headline text-slate-900 tracking-tight">
                Learner Evaluation Transcript
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official employee/intern assessment record for {selectedWorkflow.name}
              </p>
            </div>
            <div className="text-right sm:self-auto">
              <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-mono font-bold block sm:inline-block">
                Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Student Profile & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Student / Intern</span>
              <strong className="text-slate-900 text-sm">{selectedStudent.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Batch / Cohort</span>
              <strong className="text-indigo-600 font-semibold">{selectedStudent.batch_name || "Assigned Cohort"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Enrollment / ID</span>
              <strong className="font-mono text-slate-700">{selectedStudent.enrollment_no || "N/A"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Assigned Team</span>
              <strong className="text-slate-900">{selectedTeam?.name || "Manager Team"}</strong>
            </div>
          </div>

          {/* Student Overall Score Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center p-5 bg-gradient-to-r from-primary/5 via-indigo-50/50 to-transparent rounded-xl border border-primary/20">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Assigned Tasks in Workflow</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{studentTasks.length}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Completed Deliverables</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                {studentTasks.filter((t) => ["completed", "done"].includes((t.status || "").toLowerCase())).length}
              </span>
            </div>
            <div>
              <span className="text-xs text-primary font-bold uppercase block tracking-wider">Average Evaluated Grade</span>
              <span className="text-3xl font-black text-primary font-mono mt-1 block">{studentAvgGrade} / 100</span>
            </div>
          </div>

          {/* Task-by-Task Transcript Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Deliverable Evaluation Breakdown
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              <thead className="bg-slate-100 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Task Deliverable</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Self Grade</th>
                  <th className="p-3 text-center">Manager Grade</th>
                  <th className="p-3">Submission Notes &amp; Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{t.title}</div>
                      {t.description && <div className="text-[11px] text-slate-400 font-normal">{t.description}</div>}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] uppercase bg-slate-100 text-slate-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-600">
                      {t.student_grade ?? "—"}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-primary text-sm">
                      {t.manager_grade !== null && t.manager_grade !== undefined ? t.manager_grade : "Pending"}
                    </td>
                    <td className="p-3 text-slate-600 italic">
                      {t.submission_notes ? `"${t.submission_notes}"` : "No notes submitted"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sign-off footer */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-800">Evaluator / Manager</p>
              <div className="h-10 border-b border-slate-300 mb-1"></div>
              <p>Manager Signature &amp; Date</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Department Oversight</p>
              <div className="h-10 border-b border-slate-300 mb-1"></div>
              <p>Authorized Reviewer Signature</p>
            </div>
          </div>
        </div>
      ) : activeReportLevel === "task" && selectedTaskTitle ? (
        /* ========================================================================= */
        /* OPTION B: TASK-SPECIFIC DELIVERABLE REPORT                                */
        /* ========================================================================= */
        <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-1">
                Workflow Deliverable Audit
              </span>
              <h1 className="text-2xl font-black font-headline text-slate-900 tracking-tight">
                Task Report: {selectedTaskTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Team: {selectedTeam?.name} • Workflow: {selectedWorkflow.name}
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-mono font-bold sm:self-auto self-start">
              Learners: {titleTasks.length}
            </span>
          </div>

          {/* Submissions Table for this Task */}
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Assigned Learner</th>
                <th className="p-3">Batch / Cohort</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Student Self Grade</th>
                <th className="p-3 text-center">Manager Evaluated Grade</th>
                <th className="p-3">Learner Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {titleTasks.map((t) => {
                const member = teamMembers.find((m) => m.id === t.student_id);
                return (
                  <tr key={t.id}>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{t.student_name || member?.name || "Learner"}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.student_email || member?.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[11px]">
                        {member?.batch_name || "Assigned"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] uppercase bg-slate-100 text-slate-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-600">
                      {t.student_grade ?? "—"}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-primary text-sm">
                      {t.manager_grade !== null && t.manager_grade !== undefined ? t.manager_grade : "Pending"}
                    </td>
                    <td className="p-3 text-slate-600 italic">
                      {t.submission_notes ? `"${t.submission_notes}"` : "No notes"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ========================================================================= */
        /* OPTION A: TEAM WORKFLOW COMPREHENSIVE REPORT                             */
        /* ========================================================================= */
        <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-1">
                Executive Performance Summary
              </span>
              <h1 className="text-2xl font-black font-headline text-slate-900 tracking-tight">
                Workflow Report: {selectedWorkflow.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Team: {selectedTeam?.name} ({selectedTeam?.member_count} Members) • Department: {selectedTeam?.department || "General"}
              </p>
            </div>
            <div className="text-right sm:self-auto">
              <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-mono font-bold block sm:inline-block">
                Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">Total Deliverables</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{workflowTasks.length}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">Completion Rate</span>
              <span className="text-2xl font-black text-primary font-mono mt-1 block">{completionRate}%</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">Evaluated Tasks</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{evaluatedWfTasks.length}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">Cohort Average Grade</span>
              <span className="text-2xl font-black text-indigo-600 font-mono mt-1 block">{avgWorkflowScore} / 100</span>
            </div>
          </div>

          {/* Workflow Tasks Summary Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              All Deliverables &amp; Learner Performance
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              <thead className="bg-slate-100 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Task Title</th>
                  <th className="p-3">Assigned Learner</th>
                  <th className="p-3">Batch / Cohort</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Student Self Grade</th>
                  <th className="p-3 text-center">Manager Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {workflowTasks.map((t) => {
                  const member = teamMembers.find((m) => m.id === t.student_id);
                  return (
                    <tr key={t.id}>
                      <td className="p-3 font-semibold text-slate-900">{t.title}</td>
                      <td className="p-3 text-slate-800">
                        {t.student_name || member?.name || "Learner"}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[11px]">
                          {member?.batch_name || "Assigned"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-semibold text-[10px] uppercase bg-slate-100 text-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-600">
                        {t.student_grade ?? "—"}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-primary">
                        {t.manager_grade !== null && t.manager_grade !== undefined ? t.manager_grade : "Pending"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

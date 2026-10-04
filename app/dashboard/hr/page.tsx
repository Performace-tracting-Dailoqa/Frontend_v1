"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PeopleTab from "@/components/super-admin/tabs/PeopleTab";
import {
  fetchHREvaluationSummary,
  fetchHRBatches,
  fetchHRCycles,
  createHRCycle,
  updateHRCycle,
  fetchLockedEvaluations,
  reopenEvaluation,
  fetchRubricTemplates,
  createRubricTemplate,
  fetchHRAnalyticsDistribution,
  fetchOverdueEvaluators,
  nudgeEvaluator,
  HREvaluationSummary,
  HRBatch,
  PerformanceCycle,
  LockedEvaluation,
  RubricTemplate,
  HRAnalyticsDistribution,
  OverdueEvaluator,
} from "@/services/hrService";

export default function HRDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "employees" | "cycles" | "evaluations" | "rubrics" | "analytics" | "reports" | "notifications"
  >("employees");

  const [personnelCount, setPersonnelCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<HREvaluationSummary | null>(null);
  const [batches, setBatches] = useState<HRBatch[]>([]);
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [lockedEvals, setLockedEvals] = useState<LockedEvaluation[]>([]);
  const [rubrics, setRubrics] = useState<RubricTemplate[]>([]);
  const [analyticsDist, setAnalyticsDist] = useState<HRAnalyticsDistribution | null>(null);
  const [overdueEvaluators, setOverdueEvaluators] = useState<OverdueEvaluator[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const [newCycle, setNewCycle] = useState({
    name: "",
    cycle_type: "Quarterly",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    evaluation_deadline: new Date(Date.now() + 100 * 86400000).toISOString().slice(0, 10),
    description: "",
  });

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedEvalToReopen, setSelectedEvalToReopen] = useState<LockedEvaluation | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenGraceHours, setReopenGraceHours] = useState(24);

  const [showCreateRubricModal, setShowCreateRubricModal] = useState(false);
  const [newRubricName, setNewRubricName] = useState("");
  const [newRubricDepartment, setNewRubricDepartment] = useState("Engineering");
  const [newRubricScale, setNewRubricScale] = useState("1-5");
  const [rubricMetrics, setRubricMetrics] = useState<Array<{ name: string; weightage: number; description: string }>>([
    { name: "Technical Deliverables & Code Quality", weightage: 40, description: "Accuracy and robustness of tasks" },
    { name: "Domain Knowledge & Architecture", weightage: 30, description: "Understanding of patterns and systems" },
    { name: "Professional Skills & Teamwork", weightage: 30, description: "Collaboration and communication" },
  ]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (
        hash &&
        ["employees", "cycles", "evaluations", "rubrics", "analytics", "reports", "notifications"].includes(hash)
      ) {
        setActiveTab(hash as typeof activeTab);
      }
    }
  }, []);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetchHREvaluationSummary().catch(() => null),
      fetchHRBatches().catch(() => []),
      fetchHRCycles().catch(() => []),
      fetchLockedEvaluations().catch(() => []),
      fetchRubricTemplates().catch(() => []),
      fetchHRAnalyticsDistribution().catch(() => null),
      fetchOverdueEvaluators().catch(() => []),
    ])
      .then(([summaryData, batchData, cyclesData, lockedData, rubricData, analyticsData, overdueData]) => {
        setSummary(summaryData);
        setBatches(batchData);
        setCycles(cyclesData);
        setLockedEvals(lockedData);
        setRubrics(rubricData);
        setAnalyticsDist(analyticsData);
        setOverdueEvaluators(overdueData);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycle.name.trim()) {
      showToast("Cycle name is required", "error");
      return;
    }
    try {
      await createHRCycle(newCycle);
      showToast("Performance cycle created successfully!");
      setShowCreateCycleModal(false);
      const updated = await fetchHRCycles();
      setCycles(updated);
    } catch (err: any) {
      showToast(err.message || "Failed to create cycle", "error");
    }
  };

  const handleUpdateCycleStatus = async (cycleId: string, newStatus: PerformanceCycle["status"]) => {
    try {
      await updateHRCycle(cycleId, { status: newStatus });
      showToast(`Cycle status transitioned to ${newStatus}`);
      const updated = await fetchHRCycles();
      setCycles(updated);
    } catch (err: any) {
      showToast(err.message || "Failed to update cycle", "error");
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvalToReopen) return;
    if (reopenReason.trim().length < 5) {
      showToast("Please provide a valid audit reason (min 5 characters)", "error");
      return;
    }
    try {
      await reopenEvaluation(selectedEvalToReopen.id, {
        evaluation_type: selectedEvalToReopen.evaluation_type,
        reason: reopenReason.trim(),
        grace_period_hours: Number(reopenGraceHours),
      });
      showToast(`Evaluation for ${selectedEvalToReopen.student_name} reopened for ${reopenGraceHours}h grace period.`);
      setShowReopenModal(false);
      setSelectedEvalToReopen(null);
      setReopenReason("");
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to reopen evaluation", "error");
    }
  };

  const handleCreateRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    const sum = rubricMetrics.reduce((acc, m) => acc + Number(m.weightage || 0), 0);
    if (Math.abs(sum - 100) > 0.1) {
      showToast(`Total weightage must equal 100%. Current sum: ${sum}%`, "error");
      return;
    }
    try {
      await createRubricTemplate({
        name: newRubricName.trim(),
        department: newRubricDepartment,
        rating_scale: newRubricScale,
        metrics: rubricMetrics,
      });
      showToast("Rubric template created successfully!");
      setShowCreateRubricModal(false);
      const updated = await fetchRubricTemplates();
      setRubrics(updated);
    } catch (err: any) {
      showToast(err.message || "Failed to create rubric", "error");
    }
  };

  const handleNudge = async (evaluator: OverdueEvaluator) => {
    try {
      await nudgeEvaluator(evaluator.user_id, `Reminder from HR: You have ${evaluator.pending_tasks_count} pending evaluations to complete.`);
      showToast(`Nudge notification sent to ${evaluator.name}`);
    } catch (err: any) {
      showToast(err.message || "Failed to send nudge", "error");
    }
  };

  const handleExportInstitutionalCSV = () => {
    if (!summary || !summary.recent_evaluations || summary.recent_evaluations.length === 0) {
      showToast("No evaluation records available to export.", "error");
      return;
    }

    let csv = "data:text/csv;charset=utf-8,";
    csv += "Evaluation ID,Type,Status,Attainment Percentage,Remarks,Evaluation Date\n";

    summary.recent_evaluations.forEach((ev) => {
      const remarks = (ev.remarks || "").replace(/,/g, " ");
      const pct = ev.percentage !== null && ev.percentage !== undefined ? `${ev.percentage}%` : "Pending";
      csv += `"${ev.id}","${ev.type}","${ev.status || "Completed"}","${pct}","${remarks}","${ev.evaluated_at || ""}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `institutional_evaluation_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Institutional audit CSV generated and downloaded.");
  };

  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      {(session) => {
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
              {/* Toast Message */}
              {toastMessage && (
                <div
                  className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
                    toastMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      {toastMessage.type === "success" ? "check_circle" : "error"}
                    </span>
                    <span>{toastMessage.text}</span>
                  </div>
                  <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-800">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    <span>Institutional Performance &amp; Governance Center</span>
                  </div>
                  <h1 className="text-headline-md font-headline font-bold text-on-surface">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    Performance appraisal cycles, evaluation unlock governance, scoring rubrics, and organizational analytics.
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/50 text-on-surface">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>HR Administrator Session</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
                {[
                  { key: "employees", label: "Personnel", icon: "groups" },
                  { key: "cycles", label: "Appraisal Cycles", icon: "calendar_month" },
                  { key: "evaluations", label: "Evaluation Governance", icon: "lock_open" },
                  { key: "rubrics", label: "Scoring Rubrics", icon: "balance" },
                  { key: "analytics", label: "Bell-Curve Analytics", icon: "equalizer" },
                  { key: "reports", label: "Dossiers & Reports", icon: "description" },
                  { key: "notifications", label: "Evaluator Reminders", icon: "notifications_active" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as any)}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      activeTab === t.key
                        ? "bg-[#4B2EF5] text-white shadow-xs font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Total Personnel</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {personnelCount === null ? "—" : personnelCount} Enrolled
                  </p>
                  <p className="text-[11px] text-outline mt-1">Live directory records</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Appraisal Cycles</span>
                  <p className="text-headline-sm font-headline font-bold text-primary mt-1">
                    {cycles.length > 0 ? `${cycles.length} Cycles` : `${batches.length} Batches`}
                  </p>
                  <p className="text-[11px] text-outline mt-1">Configured review windows</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Evaluations Completed</span>
                  <p className="text-headline-sm font-headline font-bold text-emerald-600 mt-1">
                    {summary?.completed_evaluations ?? "—"}
                  </p>
                  <p className="text-[11px] text-outline mt-1">
                    Of {summary?.total_evaluations ?? 0} total evaluations
                  </p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Institutional Mean</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {summary?.average_score_percentage ? `${summary.average_score_percentage}%` : "Pending"}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Cohort attainment</p>
                </div>
              </div>

              {/* 1. Personnel Tab */}
              {activeTab === "employees" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6">
                  <div className="mb-4">
                    <h2 className="text-title-lg font-bold text-on-surface">Personnel Directory &amp; Roles</h2>
                    <p className="text-body-sm text-on-surface-variant">
                      Manage HR, Managers, Teachers, and Learners across the organization.
                    </p>
                  </div>
                  <PeopleTab onDirectoryLoaded={(loaded) => setPersonnelCount(loaded.length)} />
                </div>
              )}

              {/* 2. Appraisal Cycles Tab (BRD §7.2) */}
              {activeTab === "cycles" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-title-lg font-bold text-on-surface">Appraisal Cycles &amp; Timelines</h2>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        Configure quarterly and mid-term appraisal windows with automated deadline enforcement.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateCycleModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer w-fit"
                    >
                      <span className="material-symbols-outlined text-base">add_circle</span>
                      <span>Create Appraisal Cycle</span>
                    </button>
                  </div>

                  {cycles.length === 0 ? (
                    <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
                      <span className="material-symbols-outlined text-3xl text-outline mb-2">calendar_month</span>
                      <p className="text-xs text-on-surface-variant font-medium">No performance cycles configured yet.</p>
                      <button
                        onClick={() => setShowCreateCycleModal(true)}
                        className="mt-3 text-primary font-bold text-xs hover:underline cursor-pointer"
                      >
                        + Create your first cycle
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cycles.map((c) => {
                        const statusColors: Record<string, string> = {
                          Draft: "bg-slate-100 text-slate-700 border-slate-300",
                          Active: "bg-emerald-50 text-emerald-700 border-emerald-300",
                          "Under Review": "bg-amber-50 text-amber-700 border-amber-300",
                          Finalized: "bg-indigo-50 text-indigo-700 border-indigo-300",
                        };
                        return (
                          <div
                            key={c.id}
                            className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                  {c.cycle_type || "Quarterly"}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    statusColors[c.status] || "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm text-on-surface">{c.name}</h3>
                              <p className="text-xs text-on-surface-variant mt-1">
                                {c.description || "Official evaluation appraisal cycle"}
                              </p>
                              <div className="mt-3 space-y-1 text-[11px] text-outline">
                                <div>
                                  <span className="font-semibold text-on-surface">Window:</span> {c.start_date} → {c.end_date}
                                </div>
                                <div>
                                  <span className="font-semibold text-rose-600">Appraisal Deadline:</span>{" "}
                                  <span className="font-bold text-on-surface">{c.evaluation_deadline}</span>
                                </div>
                              </div>
                            </div>

                            {/* Lifecycle Stage Controls */}
                            <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-outline font-semibold uppercase">Transition Stage:</span>
                              <div className="flex items-center gap-1.5">
                                {c.status === "Draft" && (
                                  <button
                                    onClick={() => handleUpdateCycleStatus(c.id, "Active")}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer"
                                  >
                                    Activate
                                  </button>
                                )}
                                {c.status === "Active" && (
                                  <button
                                    onClick={() => handleUpdateCycleStatus(c.id, "Under Review")}
                                    className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10px] hover:bg-amber-700 cursor-pointer"
                                  >
                                    Review
                                  </button>
                                )}
                                {c.status === "Under Review" && (
                                  <button
                                    onClick={() => handleUpdateCycleStatus(c.id, "Finalized")}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">lock</span>
                                    <span>Lock Cycle</span>
                                  </button>
                                )}
                                {c.status === "Finalized" && (
                                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">lock</span>
                                    <span>Locked &amp; Historical</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Evaluation Governance & Reopen Tab (BRD §7.12) */}
              {activeTab === "evaluations" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                    <h2 className="text-title-lg font-bold text-on-surface">Evaluation Governance &amp; Unlock Authority</h2>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      HR-authorized unlocking of finalized appraisals for score corrections with mandatory audit reasoning.
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
                      <span className="font-bold text-sm text-on-surface">Finalized Evaluations Subject to Governance</span>
                      <span className="text-xs text-outline font-medium">{lockedEvals.length} Records</span>
                    </div>

                    {lockedEvals.length === 0 ? (
                      <div className="p-8 text-center text-xs text-outline">No locked or finalized evaluations found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                            <tr>
                              <th className="py-3 px-4">Learner</th>
                              <th className="py-3 px-4">Batch</th>
                              <th className="py-3 px-4">Stream</th>
                              <th className="py-3 px-4">Score</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4 text-right">Governance Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                            {lockedEvals.map((ev) => (
                              <tr key={ev.id} className="hover:bg-surface-container/40 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-on-surface">{ev.student_name}</div>
                                  <div className="text-[10px] text-outline">{ev.enrollment_no || "Intern"}</div>
                                </td>
                                <td className="py-3 px-4 text-outline">{ev.batch_name || "General"}</td>
                                <td className="py-3 px-4 font-semibold uppercase text-primary text-[11px]">{ev.evaluation_type}</td>
                                <td className="py-3 px-4 font-bold text-on-surface">
                                  {ev.score_percentage !== null && ev.score_percentage !== undefined
                                    ? `${ev.score_percentage}%`
                                    : "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      ev.status === "Reopened"
                                        ? "bg-amber-50 text-amber-700 border border-amber-300"
                                        : "bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {ev.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-outline">
                                  {ev.evaluated_at ? new Date(ev.evaluated_at).toLocaleDateString() : "Recent"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {ev.status === "Reopened" ? (
                                    <span className="text-[11px] font-bold text-amber-600 flex items-center justify-end gap-1">
                                      <span className="material-symbols-outlined text-sm">lock_open</span>
                                      <span>Unlocked for Grace Period</span>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedEvalToReopen(ev);
                                        setShowReopenModal(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">lock_open</span>
                                      <span>Reopen with Reason</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Scoring Rubrics Tab (BRD §7.4) */}
              {activeTab === "rubrics" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-title-lg font-bold text-on-surface">Configurable Scoring Models &amp; Rubrics</h2>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        Define institutional evaluation parameters and ensure weightage balances total 100%.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateRubricModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer w-fit"
                    >
                      <span className="material-symbols-outlined text-base">add_circle</span>
                      <span>New Rubric Model</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Default Institutional Model */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          Active System Default
                        </span>
                        <span className="text-xs font-semibold text-outline">Scale: 1–5</span>
                      </div>
                      <h3 className="font-bold text-base text-on-surface">Standard Engineering Task Rubric</h3>
                      <p className="text-xs text-on-surface-variant mt-1">Institutional 40/30/30 weightage distribution.</p>

                      <div className="mt-4 space-y-2">
                        {[
                          { name: "Technical / Code Quality", weight: 40 },
                          { name: "Task Completion & Architecture", weight: 30 },
                          { name: "Team & Communication Skills", weight: 30 },
                        ].map((m) => (
                          <div key={m.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container/30">
                            <span className="text-on-surface font-medium">{m.name}</span>
                            <span className="font-bold text-primary">{m.weight}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rubrics.map((r) => (
                      <div key={r.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary/10 text-secondary uppercase">
                            {r.department || "Organization"}
                          </span>
                          <span className="text-xs font-semibold text-outline">Scale: {r.rating_scale}</span>
                        </div>
                        <h3 className="font-bold text-base text-on-surface">{r.name}</h3>

                        <div className="mt-4 space-y-2">
                          {(r.metrics || []).map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container/30">
                              <span className="text-on-surface font-medium">{m.name}</span>
                              <span className="font-bold text-primary">{m.weightage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Analytics & Bell Curve Tab (BRD §7.7) */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                    <h2 className="text-title-lg font-bold text-on-surface">Bell-Curve Grading &amp; Performance Distribution</h2>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      Cohort-wide performance stratification across high performers, average attainment, and learners requiring intervention.
                    </p>
                  </div>

                  {/* Bell Curve Stratification Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-emerald-200 shadow-xs">
                      <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                        Exceeds Expectations (≥85%)
                      </span>
                      <div className="text-3xl font-bold font-headline text-emerald-600 mt-2">
                        {analyticsDist?.exceeds_count ?? 0}{" "}
                        <span className="text-xs font-normal text-outline">({analyticsDist?.exceeds_pct ?? 0}%)</span>
                      </div>
                      <p className="text-[11px] text-outline mt-1">Top tier achievers</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-indigo-200 shadow-xs">
                      <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">
                        Meets Expectations (65%–84.9%)
                      </span>
                      <div className="text-3xl font-bold font-headline text-[#4B2EF5] mt-2">
                        {analyticsDist?.meets_count ?? 0}{" "}
                        <span className="text-xs font-normal text-outline">({analyticsDist?.meets_pct ?? 0}%)</span>
                      </div>
                      <p className="text-[11px] text-outline mt-1">Solid institutional benchmark</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-rose-200 shadow-xs">
                      <span className="text-xs text-rose-700 font-bold uppercase tracking-wider">
                        Needs Improvement (&lt;65%)
                      </span>
                      <div className="text-3xl font-bold font-headline text-rose-600 mt-2">
                        {analyticsDist?.needs_improvement_count ?? 0}{" "}
                        <span className="text-xs font-normal text-outline">({analyticsDist?.needs_improvement_pct ?? 0}%)</span>
                      </div>
                      <p className="text-[11px] text-outline mt-1">Requires mentor &amp; manager support</p>
                    </div>
                  </div>

                  {/* Learner Performance Tier Breakdown */}
                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-outline-variant/30 font-bold text-sm text-on-surface">
                      Learner Bell-Curve Cohort Roster
                    </div>
                    {!analyticsDist?.learners || analyticsDist.learners.length === 0 ? (
                      <div className="p-8 text-center text-xs text-outline">No learner grades registered yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                            <tr>
                              <th className="py-3 px-4">Learner</th>
                              <th className="py-3 px-4">Cohort Batch</th>
                              <th className="py-3 px-4">Department</th>
                              <th className="py-3 px-4">Mean Score</th>
                              <th className="py-3 px-4">Performance Stratification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                            {analyticsDist.learners.map((l) => {
                              const tierBadge: Record<string, string> = {
                                "Exceeds Expectations": "bg-emerald-50 text-emerald-700 border-emerald-300",
                                "Meets Expectations": "bg-indigo-50 text-[#4B2EF5] border-indigo-200",
                                "Needs Improvement": "bg-rose-50 text-rose-700 border-rose-200",
                                "Ungraded / Pending": "bg-slate-100 text-slate-600 border-slate-200",
                              };
                              return (
                                <tr key={l.student_id} className="hover:bg-surface-container/40 transition-colors">
                                  <td className="py-3 px-4 font-bold text-on-surface">{l.name}</td>
                                  <td className="py-3 px-4 text-outline">{l.batch_name}</td>
                                  <td className="py-3 px-4 text-outline">{l.department}</td>
                                  <td className="py-3 px-4 font-bold text-on-surface">
                                    {l.avg_score !== null ? `${l.avg_score}%` : "—"}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierBadge[l.tier]}`}>
                                      {l.tier}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Reports Tab */}
              {activeTab === "reports" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-title-lg font-bold text-on-surface">Executive Dossiers &amp; Compliance Reports</h2>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        Download institutional audit spreadsheets and annual consolidated evaluation records.
                      </p>
                    </div>

                    <button
                      onClick={handleExportInstitutionalCSV}
                      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer w-fit"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Export Full Audit CSV</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <h4 className="font-bold text-sm text-on-surface">Institutional Audit Ledger</h4>
                      <p className="text-xs text-outline mt-1">Complete log of all manager and teacher evaluations with attainment %.</p>
                      <button
                        onClick={handleExportInstitutionalCSV}
                        className="mt-4 px-3 py-2 rounded-xl bg-surface-container font-bold text-xs text-primary hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>Download Audit CSV</span>
                      </button>
                    </div>

                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <h4 className="font-bold text-sm text-on-surface">Annual Consolidated Dossiers</h4>
                      <p className="text-xs text-outline mt-1">Quarterly cycle progression and composite scores for annual review.</p>
                      <button
                        onClick={() => window.print()}
                        className="mt-4 px-3 py-2 rounded-xl bg-surface-container font-bold text-xs text-primary hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">print</span>
                        <span>Print Executive Dossier</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Evaluator Reminders & Nudging Tab (BRD §7.10) */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                    <h2 className="text-title-lg font-bold text-on-surface">Delinquent Evaluator Tracker &amp; Reminders</h2>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      Identify managers and mentors with overdue evaluation tasks and dispatch immediate reminders.
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-outline-variant/30 font-bold text-sm text-on-surface">
                      Evaluators with Pending Task Submissions
                    </div>
                    {overdueEvaluators.length === 0 ? (
                      <div className="p-8 text-center text-xs text-outline">
                        All evaluators have submitted their appraisals on time!
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                            <tr>
                              <th className="py-3 px-4">Evaluator</th>
                              <th className="py-3 px-4">Role</th>
                              <th className="py-3 px-4">Department</th>
                              <th className="py-3 px-4">Pending Evaluations</th>
                              <th className="py-3 px-4">Earliest Due</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                            {overdueEvaluators.map((ev) => (
                              <tr key={ev.evaluator_id} className="hover:bg-surface-container/40 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-on-surface">{ev.name}</div>
                                  <div className="text-[10px] text-outline">{ev.email || "Evaluator"}</div>
                                </td>
                                <td className="py-3 px-4 font-semibold text-primary">{ev.role}</td>
                                <td className="py-3 px-4 text-outline">{ev.department}</td>
                                <td className="py-3 px-4 font-bold text-rose-600">{ev.pending_tasks_count} Pending</td>
                                <td className="py-3 px-4 text-outline">{ev.earliest_due_date}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleNudge(ev)}
                                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">send</span>
                                    <span>Send Reminder</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* MODAL 1: Create Performance Cycle */}
              {/* ----------------------------------------------------------------- */}
              {showCreateCycleModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl border border-outline-variant/40 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                      <h3 className="font-bold text-base text-on-surface">Create Appraisal Performance Cycle</h3>
                      <button onClick={() => setShowCreateCycleModal(false)} className="text-outline hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <form onSubmit={handleCreateCycle} className="space-y-4 text-xs">
                      <div>
                        <label className="font-semibold text-on-surface block mb-1">Cycle Name *</label>
                        <input
                          type="text"
                          required
                          value={newCycle.name}
                          onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                          placeholder="e.g. Q1 2026 Appraisal Window"
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-on-surface block mb-1">Cycle Type</label>
                          <select
                            value={newCycle.cycle_type}
                            onChange={(e) => setNewCycle({ ...newCycle, cycle_type: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                          >
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annual">Annual</option>
                            <option value="Mid-Term">Mid-Term</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-rose-600 block mb-1">Appraisal Deadline *</label>
                          <input
                            type="date"
                            required
                            value={newCycle.evaluation_deadline}
                            onChange={(e) => setNewCycle({ ...newCycle, evaluation_deadline: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-on-surface block mb-1">Start Date *</label>
                          <input
                            type="date"
                            required
                            value={newCycle.start_date}
                            onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-on-surface block mb-1">End Date *</label>
                          <input
                            type="date"
                            required
                            value={newCycle.end_date}
                            onChange={(e) => setNewCycle({ ...newCycle, end_date: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateCycleModal(false)}
                          className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-2xs"
                        >
                          Create Cycle
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* MODAL 2: Reopen Evaluation with Mandatory Audit Reason */}
              {/* ----------------------------------------------------------------- */}
              {showReopenModal && selectedEvalToReopen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-outline-variant/40 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                      <h3 className="font-bold text-base text-on-surface">Reopen Evaluation (HR Authority)</h3>
                      <button onClick={() => setShowReopenModal(false)} className="text-outline hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <p className="text-xs text-on-surface-variant">
                      Reopening appraisal for <span className="font-bold text-on-surface">{selectedEvalToReopen.student_name}</span>.
                      This grants evaluators a temporary grace window to revise or resubmit grades.
                    </p>

                    <form onSubmit={handleReopenSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="font-semibold text-rose-600 block mb-1">
                          Mandatory Audit Justification *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="e.g. Medical leave proof approved by manager; rubric resubmission permitted."
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-on-surface block mb-1">Grace Period Window (Hours)</label>
                        <select
                          value={reopenGraceHours}
                          onChange={(e) => setReopenGraceHours(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                        >
                          <option value={24}>24 Hours</option>
                          <option value={48}>48 Hours</option>
                          <option value={72}>72 Hours</option>
                          <option value={168}>1 Week</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowReopenModal(false)}
                          className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 shadow-2xs"
                        >
                          Authorize &amp; Reopen
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* MODAL 3: Create Rubric Template with 100% Validation */}
              {/* ----------------------------------------------------------------- */}
              {showCreateRubricModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl border border-outline-variant/40 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                      <h3 className="font-bold text-base text-on-surface">Create Scoring Rubric Model</h3>
                      <button onClick={() => setShowCreateRubricModal(false)} className="text-outline hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <form onSubmit={handleCreateRubric} className="space-y-4 text-xs">
                      <div>
                        <label className="font-semibold text-on-surface block mb-1">Model Name *</label>
                        <input
                          type="text"
                          required
                          value={newRubricName}
                          onChange={(e) => setNewRubricName(e.target.value)}
                          placeholder="e.g. AI & Cloud Engineering Appraisal Rubric"
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-on-surface block mb-1">Department</label>
                          <input
                            type="text"
                            value={newRubricDepartment}
                            onChange={(e) => setNewRubricDepartment(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-on-surface block mb-1">Scale</label>
                          <select
                            value={newRubricScale}
                            onChange={(e) => setNewRubricScale(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container/20 text-on-surface focus:outline-primary"
                          >
                            <option value="1-5">1–5 Rating Scale</option>
                            <option value="1-10">1–10 Scale</option>
                            <option value="0-100">0–100 Percentage</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-semibold text-on-surface">Metrics &amp; Weightages (Sum to 100%)</label>
                          <span
                            className={`font-bold ${
                              rubricMetrics.reduce((a, b) => a + Number(b.weightage || 0), 0) === 100
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            Total: {rubricMetrics.reduce((a, b) => a + Number(b.weightage || 0), 0)}%
                          </span>
                        </div>

                        <div className="space-y-2">
                          {rubricMetrics.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => {
                                  const updated = [...rubricMetrics];
                                  updated[idx].name = e.target.value;
                                  setRubricMetrics(updated);
                                }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container/20 text-on-surface"
                                placeholder="Metric name"
                              />
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={m.weightage}
                                onChange={(e) => {
                                  const updated = [...rubricMetrics];
                                  updated[idx].weightage = Number(e.target.value);
                                  setRubricMetrics(updated);
                                }}
                                className="w-16 px-2 py-1.5 rounded-lg border border-outline-variant bg-surface-container/20 text-on-surface text-center font-bold"
                              />
                              <span className="text-outline font-bold">%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateRubricModal(false)}
                          className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-2xs"
                        >
                          Save Rubric
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}
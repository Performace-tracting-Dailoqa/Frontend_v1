"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PeopleTab from "@/components/super-admin/tabs/PeopleTab";
import {
  fetchHREvaluationSummary,
  fetchHRBatches,
  HREvaluationSummary,
  HRBatch,
} from "@/services/hrService";

export default function HRDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "employees" | "cycles" | "evaluations" | "analytics" | "reports" | "notifications"
  >("employees");

  const [personnelCount, setPersonnelCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<HREvaluationSummary | null>(null);
  const [batches, setBatches] = useState<HRBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (
        hash &&
        ["employees", "cycles", "evaluations", "analytics", "reports", "notifications"].includes(hash)
      ) {
        setActiveTab(hash as typeof activeTab);
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchHREvaluationSummary().catch(() => null),
      fetchHRBatches().catch(() => []),
    ])
      .then(([summaryData, batchData]) => {
        setSummary(summaryData);
        setBatches(batchData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleExportInstitutionalCSV = () => {
    if (!summary || !summary.recent_evaluations || summary.recent_evaluations.length === 0) {
      setExportNotice("No institutional evaluation records available to export.");
      setTimeout(() => setExportNotice(null), 3000);
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

    setExportNotice("Institutional audit CSV generated and downloaded.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      {(session) => {
        const hrScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
              {/* Toast Export Notice */}
              {exportNotice && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>{exportNotice}</span>
                  </div>
                  <button onClick={() => setExportNotice(null)} className="text-slate-500 hover:text-slate-800">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
                    <span className="material-symbols-outlined text-lg">badge</span>
                    <span>Human Resources &amp; People Operations</span>
                  </div>
                  <h1 className="text-headline-md font-headline font-bold text-on-surface">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    Organizational Authority • Scope:{" "}
                    <span className="font-medium text-on-surface">
                      {hrScope?.scope_type || "organization"}
                    </span>
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
                <button
                  onClick={() => setActiveTab("employees")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "employees"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">groups</span>
                  <span>Employees</span>
                </button>

                <button
                  onClick={() => setActiveTab("cycles")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "cycles"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  <span>Performance Cycles</span>
                </button>

                <button
                  onClick={() => setActiveTab("evaluations")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "evaluations"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">rule</span>
                  <span>Evaluation Monitoring</span>
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "analytics"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">equalizer</span>
                  <span>Analytics</span>
                </button>

                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "reports"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">description</span>
                  <span>Reports</span>
                </button>

                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "notifications"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">notifications</span>
                  <span>Notifications</span>
                </button>
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
                  <span className="text-label-sm text-outline font-medium">Active Cycles</span>
                  <p className="text-headline-sm font-headline font-bold text-primary mt-1">
                    {batches.length} Batches
                  </p>
                  <p className="text-[11px] text-outline mt-1">Ongoing training tracks</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Completed Appraisals</span>
                  <p className="text-headline-sm font-headline font-bold text-emerald-600 mt-1">
                    {summary?.completed_evaluations ?? "—"}
                  </p>
                  <p className="text-[11px] text-outline mt-1">
                    Of {summary?.total_evaluations ?? 0} total evaluations
                  </p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Average Attainment</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {summary?.average_score_percentage ? `${summary.average_score_percentage}%` : "Pending"}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Institutional mean</p>
                </div>
              </div>

              {/* Main Content Area */}
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

              {/* Performance Cycles Tab */}
              {activeTab === "cycles" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                    <h2 className="text-title-lg font-bold text-on-surface">Cohort Performance Cycles</h2>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      Monitor ongoing cohort appraisal windows, start/end timelines, and departmental alignment.
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="p-8 text-center text-xs text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
                      Loading performance cycles...
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
                      <span className="material-symbols-outlined text-3xl text-outline mb-2">calendar_month</span>
                      <p className="text-xs text-on-surface-variant font-medium">No performance cycles currently configured.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {batches.map((batch) => {
                        let pct = 60;
                        if (batch.start_date && batch.end_date) {
                          const s = new Date(batch.start_date).getTime();
                          const e = new Date(batch.end_date).getTime();
                          const now = new Date().getTime();
                          if (e > s) {
                            pct = Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
                          }
                        }
                        return (
                          <div
                            key={batch.id}
                            className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                  {batch.department || "Training Track"}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                  Active Cycle
                                </span>
                              </div>
                              <h3 className="font-bold text-sm text-on-surface">{batch.name}</h3>
                              <p className="text-xs text-on-surface-variant mt-1">{batch.course || "Cohort Curriculum"}</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-outline-variant/30 space-y-2">
                              <div className="flex justify-between text-xs text-outline">
                                <span>Cycle Elapsed</span>
                                <span className="font-bold text-on-surface">{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-[10px] text-outline text-right mt-1">
                                {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : "Active"} –{" "}
                                {batch.end_date ? new Date(batch.end_date).toLocaleDateString() : "Ongoing"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation Monitoring Tab */}
              {activeTab === "evaluations" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                    <h2 className="text-title-lg font-bold text-on-surface">Institutional Evaluation Monitoring</h2>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      Cross-departmental monitoring of manager task deliverables and mentor milestone appraisals.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm text-on-surface">Manager Workflow Appraisals</span>
                        <span className="text-primary font-bold text-lg">{summary?.workflow_evaluations_count ?? 0}</span>
                      </div>
                      <p className="text-xs text-outline">
                        Technical deliverable evaluations scored against task deliverables.
                      </p>
                    </div>

                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm text-on-surface">Teacher Milestone Evaluations</span>
                        <span className="text-secondary font-bold text-lg">{summary?.general_evaluations_count ?? 0}</span>
                      </div>
                      <p className="text-xs text-outline">
                        Linguistic, soft-skill, and holistic milestone assessments.
                      </p>
                    </div>
                  </div>

                  {/* Recent Evaluations Table */}
                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-outline-variant/30 font-bold text-sm text-on-surface">
                      Recent Institutional Evaluation Activity
                    </div>
                    {isLoading ? (
                      <div className="p-8 text-center text-xs text-outline">Loading evaluations...</div>
                    ) : !summary?.recent_evaluations || summary.recent_evaluations.length === 0 ? (
                      <div className="p-8 text-center text-xs text-outline">No evaluation activity recorded yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface-container/60 text-on-surface-variant font-semibold border-b border-outline-variant/40">
                            <tr>
                              <th className="py-3 px-4">Evaluation ID</th>
                              <th className="py-3 px-4">Appraisal Stream</th>
                              <th className="py-3 px-4">Attainment</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Remarks</th>
                              <th className="py-3 px-4 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                            {summary.recent_evaluations.map((ev) => (
                              <tr key={ev.id} className="hover:bg-surface-container/40 transition-colors">
                                <td className="py-3 px-4 font-mono text-outline text-[11px]">{ev.id.slice(0, 8)}...</td>
                                <td className="py-3 px-4 font-semibold uppercase text-primary text-[11px]">{ev.type}</td>
                                <td className="py-3 px-4 font-bold text-on-surface">
                                  {ev.percentage !== null && ev.percentage !== undefined ? `${ev.percentage}%` : "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                                    {ev.status || "Completed"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-outline max-w-xs truncate">{ev.remarks || "—"}</td>
                                <td className="py-3 px-4 text-right text-outline">
                                  {ev.evaluated_at ? new Date(ev.evaluated_at).toLocaleDateString() : "Recent"}
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

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                    <h2 className="text-title-lg font-bold text-on-surface">Performance Analytics & Intelligence</h2>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      Organization-wide evaluation distribution, completion metrics, and cohort benchmarks.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <span className="text-xs text-outline font-semibold uppercase tracking-wider">Evaluation Completion</span>
                      <div className="text-3xl font-bold font-headline text-emerald-600 mt-2">
                        {summary?.total_evaluations
                          ? `${Math.round(((summary.completed_evaluations || 0) / summary.total_evaluations) * 100)}%`
                          : "100%"}
                      </div>
                      <p className="text-[11px] text-outline mt-1">Of active evaluation requests</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <span className="text-xs text-outline font-semibold uppercase tracking-wider">Institutional Mean</span>
                      <div className="text-3xl font-bold font-headline text-primary mt-2">
                        {summary?.average_score_percentage ? `${summary.average_score_percentage}%` : "—"}
                      </div>
                      <p className="text-[11px] text-outline mt-1">Average attainment across rubrics</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
                      <span className="text-xs text-outline font-semibold uppercase tracking-wider">Evaluation Velocity</span>
                      <div className="text-3xl font-bold font-headline text-on-surface mt-2">
                        {summary?.total_evaluations ?? 0}
                      </div>
                      <p className="text-[11px] text-outline mt-1">Evaluations registered to date</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === "reports" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-title-lg font-bold text-on-surface">Institutional Compliance & Appraisal Reports</h2>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        Download comprehensive evaluation dossiers and audit summaries.
                      </p>
                    </div>

                    <button
                      onClick={handleExportInstitutionalCSV}
                      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Export Full Audit CSV</span>
                    </button>
                  </div>

                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
                    <h3 className="font-bold text-sm text-on-surface mb-2">Available Report Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/30">
                        <h4 className="font-bold text-on-surface">Institutional Evaluation Audit</h4>
                        <p className="text-outline mt-1">Complete log of all manager and teacher evaluations with attainment %.</p>
                        <button
                          onClick={handleExportInstitutionalCSV}
                          className="mt-3 text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Download CSV</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container/30">
                        <h4 className="font-bold text-on-surface">Cohort Batch Lifecycle Report</h4>
                        <p className="text-outline mt-1">Batch timelines, duration, department distribution, and headcount.</p>
                        <button
                          onClick={() => setActiveTab("cycles")}
                          className="mt-3 text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect Cycles</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/40 shadow-xs text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">notifications_active</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface">Institutional Notifications & Alerts</h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 mb-4">
                    All appraisal cycles and manager evaluation submission deadlines are currently on schedule.
                  </p>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    System Operating Normally
                  </span>
                </div>
              )}
            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}
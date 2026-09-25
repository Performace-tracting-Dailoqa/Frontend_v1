"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "learners" | "progress" | "japanese" | "feedback" | "evaluations" | "reports" | "history">("dashboard");
  const [exportNotice, setExportNotice] = useState(false);

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={["teacher", "mentor", "instructor"]}>
      {(session) => {
        const teacherProfile = session.profile;
        const teacherScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];
        const assignedBatches = teacherScope?.assigned_batch_ids || [];
        const assignedLearnerCount = teacherScope?.assigned_student_ids?.length || 0;

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">

              {/* Export Toast Notification */}
              {exportNotice && (
                <div className="fixed top-20 right-8 z-50 bg-[#0B0B12] text-white px-4 py-3 rounded-xl shadow-lg border border-white/10 flex items-center gap-3 animate-fade-in">
                  <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                  <span className="text-body-sm font-medium">Cohort report export requested.</span>
                </div>
              )}

              {/* Welcome & Overview Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
                    <span className="material-symbols-outlined text-lg">co_present</span>
                    <span>Teacher / Mentor Operations</span>
                  </div>
                  <h1 className="text-headline-md font-headline font-bold text-on-surface">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    Department: <span className="font-medium text-on-surface">{teacherProfile?.department || "Language & Training"}</span>
                    {teacherProfile?.specialization && (
                      <> • Specialization: <span className="font-medium text-on-surface">{teacherProfile.specialization}</span></>
                    )}
                    {" "}• Assigned Batches: <span className="font-medium text-on-surface">{assignedBatches.length}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 z-10">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-surface-container px-4 py-2.5 rounded-xl text-body-md text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/50 font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>Export Reports</span>
                  </button>
                  <button
                    onClick={() => alert("Evaluation creation will be enabled when evaluation APIs are integrated.")}
                    className="flex items-center gap-2 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white px-4 py-2.5 rounded-xl text-body-md font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>New Evaluation</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs per Teacher Spec */}
              <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "dashboard"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab("learners")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "learners"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">groups</span>
                  <span>My Learners</span>
                </button>

                <button
                  onClick={() => setActiveTab("progress")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "progress"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">trending_up</span>
                  <span>Learning Progress</span>
                </button>

                <button
                  onClick={() => setActiveTab("japanese")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "japanese"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">translate</span>
                  <span>Japanese</span>
                </button>

                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "feedback"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">forum</span>
                  <span>Feedback</span>
                </button>

                <button
                  onClick={() => setActiveTab("evaluations")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "evaluations"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">rate_review</span>
                  <span>Evaluations</span>
                </button>

                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "reports"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">assessment</span>
                  <span>Reports</span>
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "history"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">history</span>
                  <span>History</span>
                </button>
              </div>

              {/* KPI Cards Grid Grounded in Real /auth/me Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-outline mb-2">
                    <span className="text-label-sm font-medium">Assigned Batches</span>
                    <span className="material-symbols-outlined text-primary">school</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-headline text-on-surface">{assignedBatches.length}</span>
                    <div className="text-[11px] text-outline font-medium mt-1">From backend scope</div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-outline mb-2">
                    <span className="text-label-sm font-medium">Assigned Learners</span>
                    <span className="material-symbols-outlined text-secondary">groups</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-headline text-on-surface">{assignedLearnerCount}</span>
                    <div className="text-[11px] text-outline font-medium mt-1">Based on batch membership</div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-outline mb-2">
                    <span className="text-label-sm font-medium">Specialization</span>
                    <span className="material-symbols-outlined text-[#a44100]">psychology</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold font-headline text-on-surface truncate block">
                      {teacherProfile?.specialization || "General Mentor"}
                    </span>
                    <div className="text-[11px] text-outline font-medium mt-1">Profile specialty</div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-outline mb-2">
                    <span className="text-label-sm font-medium">Authority Scope</span>
                    <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold font-headline text-on-surface">
                      {teacherScope?.scope_type || "assigned_learners"}
                    </span>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified /auth/me</div>
                  </div>
                </div>
              </div>

              {/* Active Tab Content */}
              {(activeTab === "dashboard" || activeTab === "learners") && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-headline font-bold text-on-surface text-lg">
                        My Learners &amp; Cohorts
                      </h3>
                      <p className="text-body-sm text-on-surface-variant">
                        Scoped to batches: {assignedBatches.length > 0 ? assignedBatches.join(", ") : "No batches assigned yet"}
                      </p>
                    </div>
                  </div>

                  {assignedLearnerCount === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container text-outline flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-3xl">group_off</span>
                      </div>
                      <h4 className="text-title-md font-headline font-semibold text-on-surface">
                        No Learners Linked in Current Scope
                      </h4>
                      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                        Learner rosters are governed by backend batch assignments. Individual learner metrics and profiles will appear as learners enroll into your assigned batches.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                        <span className="material-symbols-outlined text-sm">database</span>
                        <span>Source of truth: GET /api/v1/auth/me</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === "progress" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-primary mb-2">trending_up</span>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">Learning Progress Tracking</h3>
                  <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                    Course milestone tracking and curriculum progression APIs are scheduled for upcoming sprint milestones.
                  </p>
                </div>
              )}

              {activeTab === "japanese" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-[#a44100] mb-2">translate</span>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">Japanese Language Diagnostics</h3>
                  <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                    JLPT N5 curriculum assessments and Kanji drill monitoring modules.
                  </p>
                </div>
              )}

              {activeTab === "feedback" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-secondary mb-2">forum</span>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">Learner Feedback Queue</h3>
                  <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                    No pending feedback requests from assigned learners.
                  </p>
                </div>
              )}

              {activeTab === "evaluations" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-purple-600 mb-2">rate_review</span>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">Cohort Evaluations</h3>
                  <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                    Formal evaluation grading and rubric submissions will appear here once evaluation cycles open.
                  </p>
                </div>
              )}

              {activeTab === "reports" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-emerald-600 mb-2">assessment</span>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">Performance Reports</h3>
                  <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                    Exportable summaries across learner attendance, scores, and exam readiness.
                  </p>
                </div>
              )}

              {activeTab === "history" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-gray-600 mb-2">history</span>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">Evaluation Archive</h3>
                  <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                    Archived evaluations and historical cohort reviews.
                  </p>
                </div>
              )}

            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

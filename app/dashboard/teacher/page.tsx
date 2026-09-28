"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TeacherTab } from "@/components/teacher/types";
import TeacherNavTabs from "@/components/teacher/TeacherNavTabs";

import DashboardTab from "@/components/teacher/tabs/DashboardTab";
import LearnersTab from "@/components/teacher/tabs/LearnersTab";
import ProgressTab from "@/components/teacher/tabs/ProgressTab";
import JapaneseTab from "@/components/teacher/tabs/JapaneseTab";
import FeedbackTab from "@/components/teacher/tabs/FeedbackTab";
import EvaluationsTab from "@/components/teacher/tabs/EvaluationsTab";
import ReportsTab from "@/components/teacher/tabs/ReportsTab";
import HistoryTab from "@/components/teacher/tabs/HistoryTab";

function TeacherDashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TeacherTab | null;
  const activeTab: TeacherTab = tabParam || "dashboard";

  const [exportNotice, setExportNotice] = useState(false);

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={["teacher", "mentor"]}>
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
              <TeacherNavTabs activeTab={activeTab} />

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
              {activeTab === "dashboard" && (
                <DashboardTab assignedBatches={assignedBatches} assignedLearnerCount={assignedLearnerCount} />
              )}
              {activeTab === "learners" && <LearnersTab />}
              {activeTab === "progress" && <ProgressTab />}
              {activeTab === "japanese" && <JapaneseTab />}
              {activeTab === "feedback" && <FeedbackTab />}
              {activeTab === "evaluations" && <EvaluationsTab />}
              {activeTab === "reports" && <ReportsTab />}
              {activeTab === "history" && <HistoryTab />}
            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}

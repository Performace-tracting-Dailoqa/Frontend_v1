"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function StudentDashboardPage() {
  const [activeTab, setActiveTab] = useState<"performance" | "tasks" | "learning" | "evaluation" | "feedback" | "history">("performance");

  return (
    <ProtectedRoute allowedRoles={["student", "employee"]}>
      {(session) => {
        const studentProfile = session.profile;
        const studentScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
              
              {/* Header Card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
                    <span className="material-symbols-outlined text-lg">school</span>
                    <span>Student / Trainee Portal</span>
                  </div>
                  <h1 className="text-headline-md font-headline font-bold text-on-surface">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    Department: <span className="font-medium text-on-surface">{studentProfile?.department || "General Engineering"}</span>
                    {studentProfile?.enrollment_no && (
                      <> • Enrollment No: <span className="font-medium text-on-surface">{studentProfile.enrollment_no}</span></>
                    )}
                    {Boolean(studentScope?.details?.batch_id) && (
                      <> • Batch ID: <span className="font-medium text-on-surface">{String(studentScope?.details?.batch_id)}</span></>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/50 text-on-surface">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{session.user.is_active ? "Active Status" : "Inactive"}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for BRD modules */}
              <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
                <button
                  onClick={() => setActiveTab("performance")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "performance"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">monitoring</span>
                  <span>My Performance</span>
                </button>

                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "tasks"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">task_alt</span>
                  <span>My Tasks</span>
                </button>

                <button
                  onClick={() => setActiveTab("learning")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "learning"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">menu_book</span>
                  <span>Learning Pathways</span>
                </button>

                <button
                  onClick={() => setActiveTab("evaluation")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "evaluation"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">rate_review</span>
                  <span>Self Evaluation</span>
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

              {/* Tab 1: My Performance */}
              {activeTab === "performance" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                      <span className="text-label-sm text-outline font-medium">Evaluation Cycle</span>
                      <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">Pending Cycle</p>
                      <p className="text-[11px] text-outline mt-1">Cycle awaiting HR setup</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                      <span className="text-label-sm text-outline font-medium">Internship Track</span>
                      <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                        {studentProfile?.department || "Active"}
                      </p>
                      <p className="text-[11px] text-outline mt-1">Technical Internship Pathway</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                      <span className="text-label-sm text-outline font-medium">Japanese Track</span>
                      <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">JLPT N5</p>
                      <p className="text-[11px] text-outline mt-1">Language Cohort Curriculum</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                      <span className="text-label-sm text-outline font-medium">Account Authority</span>
                      <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                        {session.role?.name || "Student"}
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-1 font-medium">Verified by Backend /auth/me</p>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl">analytics</span>
                    </div>
                    <h3 className="text-title-lg font-headline font-bold text-on-surface">
                      Performance Evaluation Metrics
                    </h3>
                    <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                      Formal performance scorecards, evaluations, and target reviews will be populated once the performance cycle backend APIs are activated.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                      <span className="material-symbols-outlined text-sm">info</span>
                      <span>Empty state • Backend performance cycle APIs not yet implemented</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: My Tasks */}
              {activeTab === "tasks" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">checklist</span>
                  </div>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">
                    No Pending Tasks Assigned
                  </h3>
                  <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                    Action items, deliverables, and assignments dispatched by mentors or managers will appear here.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>Awaiting task distribution from management</span>
                  </div>
                </div>
              )}

              {/* Tab 3: Learning Pathways (2 separate paths per BRD) */}
              {activeTab === "learning" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Path 1: Internship / Learning Journey */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">laptop_mac</span>
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-on-surface text-base">
                            1. Internship &amp; Learning Journey
                          </h3>
                          <p className="text-body-xs text-on-surface-variant">
                            Technical curriculum, milestones, and project sprints
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant/30 space-y-2">
                        <div className="flex items-center justify-between text-body-sm font-medium">
                          <span className="text-on-surface">Curriculum Status</span>
                          <span className="text-outline text-xs">Pending Enrollment</span>
                        </div>
                        <p className="text-body-xs text-on-surface-variant">
                          Department: {studentProfile?.department || "Software Engineering Trainee"}
                        </p>
                      </div>

                      <div className="py-6 text-center text-outline text-body-sm">
                        <span className="material-symbols-outlined text-2xl mb-1 text-outline">hourglass_empty</span>
                        <p>No active internship modules synced yet</p>
                      </div>
                    </div>

                    {/* Path 2: Japanese Learning */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#ffdbcc] text-[#7e3000] flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">translate</span>
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-on-surface text-base">
                            2. Japanese Language Journey
                          </h3>
                          <p className="text-body-xs text-on-surface-variant">
                            JLPT N5 curriculum, Kanji mastery, and conversational drills
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant/30 space-y-2">
                        <div className="flex items-center justify-between text-body-sm font-medium">
                          <span className="text-on-surface">Target Certification</span>
                          <span className="text-[#4B2EF5] font-semibold text-xs">JLPT N5</span>
                        </div>
                        <p className="text-body-xs text-on-surface-variant">
                          Cohort Level: Foundation Japanese Language
                        </p>
                      </div>

                      <div className="py-6 text-center text-outline text-body-sm">
                        <span className="material-symbols-outlined text-2xl mb-1 text-outline">language</span>
                        <p>Language learning records will sync upon teacher assignment</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Self Evaluation */}
              {activeTab === "evaluation" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">fact_check</span>
                  </div>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">
                    No Self-Evaluation Open
                  </h3>
                  <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                    Self-evaluations become active during designated evaluation windows configured by HR operations.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>Window currently closed</span>
                  </div>
                </div>
              )}

              {/* Tab 5: Feedback */}
              {activeTab === "feedback" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">reviews</span>
                  </div>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">
                    No Feedback Entries Recorded
                  </h3>
                  <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                    Direct feedback and 1-on-1 review notes from your assigned mentor and manager will be archived here.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                    <span className="material-symbols-outlined text-sm">chat</span>
                    <span>No feedback submissions available yet</span>
                  </div>
                </div>
              )}

              {/* Tab 6: History */}
              {activeTab === "history" && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-500/10 text-gray-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">manage_history</span>
                  </div>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">
                    Historical Evaluation Records
                  </h3>
                  <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                    Prior quarter review scores, historical appraisals, and milestone certificates will appear here once cycles conclude.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                    <span className="material-symbols-outlined text-sm">folder_open</span>
                    <span>Archive is currently empty</span>
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

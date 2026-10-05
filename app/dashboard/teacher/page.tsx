"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TeacherTab } from "@/components/teacher/types";
import { TeacherStudent } from "@/services/teacherService";

import DashboardTab from "@/components/teacher/tabs/DashboardTab";
import LearnersTab from "@/components/teacher/tabs/LearnersTab";
import ProgressTab from "@/components/teacher/tabs/ProgressTab";
import JapaneseTab from "@/components/teacher/tabs/JapaneseTab";
import FeedbackTab from "@/components/teacher/tabs/FeedbackTab";
import EvaluationsTab from "@/components/teacher/tabs/EvaluationsTab";
import ReportsTab from "@/components/teacher/tabs/ReportsTab";
import HistoryTab from "@/components/teacher/tabs/HistoryTab";
import AttendanceTab from "@/components/teacher/tabs/AttendanceTab";

function TeacherDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TeacherTab | null;
  const activeTab: TeacherTab = tabParam || "dashboard";

  const [selectedStudentForEval, setSelectedStudentForEval] = useState<TeacherStudent | null>(null);

  const handleNavigateTab = (tab: string) => {
    router.push(`/dashboard/teacher?tab=${tab}`);
  };

  const handleSelectStudentForEval = (student: TeacherStudent) => {
    setSelectedStudentForEval(student);
    router.push("/dashboard/teacher?tab=evaluations");
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
              {/* Welcome & Overview Header */}
              {activeTab === "dashboard" && (
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
                      onClick={() => handleNavigateTab("reports")}
                      className="flex items-center gap-2 bg-surface-container px-4 py-2.5 rounded-xl text-body-md text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/50 font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                      <span>Export Reports</span>
                    </button>
                    <button
                      onClick={() => handleNavigateTab("evaluations")}
                      className="flex items-center gap-2 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white px-4 py-2.5 rounded-xl text-body-md font-medium transition-all shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      <span>New Evaluation</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Tab Content */}
              {activeTab === "dashboard" && (
                <DashboardTab
                  assignedBatches={assignedBatches}
                  assignedLearnerCount={assignedLearnerCount}
                  onNavigateTab={handleNavigateTab}
                />
              )}
              {activeTab === "attendance" && <AttendanceTab />}
              {activeTab === "learners" && (
                <LearnersTab onSelectStudent={handleSelectStudentForEval} />
              )}
              {activeTab === "progress" && <ProgressTab />}
              {activeTab === "japanese" && <JapaneseTab />}
              {activeTab === "feedback" && <FeedbackTab />}
              {activeTab === "evaluations" && (
                <EvaluationsTab initialStudent={selectedStudentForEval} />
              )}
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

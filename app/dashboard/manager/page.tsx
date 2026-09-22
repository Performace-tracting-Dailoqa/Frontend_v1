"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ManagerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "team" | "workflows" | "progress" | "evaluations" | "feedback" | "reports" | "history">("dashboard");

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      {(session) => {
        const managerProfile = session.profile;
        const managerScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">

              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
                    <span className="material-symbols-outlined text-lg">supervisor_account</span>
                    <span>Manager Operations &amp; Team Oversight</span>
                  </div>
                  <h1 className="text-headline-md font-headline font-bold text-on-surface">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    Department: <span className="font-medium text-on-surface">{managerProfile?.department || "Engineering Management"}</span>
                    {" "}• Scope Type: <span className="font-medium text-on-surface">{managerScope?.scope_type || "assigned_team"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/50 text-on-surface">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Active Session</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
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
                  onClick={() => setActiveTab("team")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "team"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">groups</span>
                  <span>My Team</span>
                </button>

                <button
                  onClick={() => setActiveTab("workflows")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "workflows"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">account_tree</span>
                  <span>Workflows</span>
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
                  <span>Progress</span>
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

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Assigned Workflows</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {managerScope?.assigned_workflow_ids?.length || 0}
                  </p>
                  <p className="text-[11px] text-outline mt-1">From backend scope</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Department</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1 truncate">
                    {managerProfile?.department || "General"}
                  </p>
                  <p className="text-[11px] text-outline mt-1">Organizational unit</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Pending Reviews</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">0</p>
                  <p className="text-[11px] text-outline mt-1">Awaiting cycle activation</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Authority Level</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">Manager</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Verified /auth/me</p>
                </div>
              </div>

              {/* Content Panel (Empty states as backend APIs are not implemented) */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">account_tree</span>
                </div>
                <h3 className="text-title-lg font-headline font-bold text-on-surface">
                  Manager Workflow &amp; Team Operations
                </h3>
                <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                  Team workflows, project task assignments, and direct subordinate reviews will become available once backend workflow APIs are deployed.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span>Empty state • Backend workflow APIs not part of SCRUM-31</span>
                </div>
              </div>

            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

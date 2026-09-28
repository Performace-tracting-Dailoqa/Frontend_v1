"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PeopleTab from "@/components/super-admin/tabs/PeopleTab";

export default function HRDashboardPage() {
  const [activeTab, setActiveTab] = useState<"employees" | "cycles" | "evaluations" | "analytics" | "reports" | "notifications">("employees");

  // Populated by PeopleTab's own fetch, so the headcount card and the directory
  // always agree without a second round-trip. Null means "not loaded yet", which
  // renders as a dash rather than a misleading zero.
  const [personnelCount, setPersonnelCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["employees", "cycles", "evaluations", "analytics", "reports", "notifications"].includes(hash)) {
        setActiveTab(hash as typeof activeTab);
      }
    }
  }, []);

  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      {(session) => {
        const hrScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">

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
                    Organizational Authority • Scope: <span className="font-medium text-on-surface">{hrScope?.scope_type || "organization"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/50 text-on-surface">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>HR Administrator Session</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs per HR Spec */}
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
                  <p className="text-[11px] text-outline mt-1">Live database records</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Evaluation State</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">Ready</p>
                  <p className="text-[11px] text-outline mt-1">Workflow evaluations active</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Scope</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">Organization</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Verified /auth/me</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Role Identity</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">HR</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Strict Supabase JWT</p>
                </div>
              </div>

              {/* Main Content Area */}
              {activeTab === "employees" ? (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6">
                  <div className="mb-4">
                    <h2 className="text-title-lg font-bold text-on-surface">Personnel Directory &amp; Roles</h2>
                    <p className="text-body-sm text-on-surface-variant">
                      Manage HR, Managers, Teachers, and Learners across the organization.
                    </p>
                  </div>
                  {/* The directory loads and paginates itself, so HR gets the same
                      live data as the superuser without owning any fetch state. */}
                  <PeopleTab onDirectoryLoaded={(loaded) => setPersonnelCount(loaded.length)} />
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">hourglass_top</span>
                  </div>
                  <h3 className="text-title-lg font-headline font-bold text-on-surface">
                    {activeTab === "cycles" ? "Performance Cycle Management" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module`}
                  </h3>
                  <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                    Performance cycle configuration and organization-wide analytics are scheduled for subsequent PMS milestones.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span>Performance cycle backend/database functionality is not currently implemented</span>
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
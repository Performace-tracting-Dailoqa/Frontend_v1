"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { HRTab } from "@/components/hr/types";
import HRNavTabs from "@/components/hr/HRNavTabs";

import EmployeesTab from "@/components/hr/tabs/EmployeesTab";
import CyclesTab from "@/components/hr/tabs/CyclesTab";
import EvaluationsTab from "@/components/hr/tabs/EvaluationsTab";
import AnalyticsTab from "@/components/hr/tabs/AnalyticsTab";
import ReportsTab from "@/components/hr/tabs/ReportsTab";
import NotificationsTab from "@/components/hr/tabs/NotificationsTab";

function HRDashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as HRTab | null;
  const activeTab: HRTab = tabParam || "employees";

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

              {/* Navigation Tabs */}
              <HRNavTabs activeTab={activeTab} />

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Active Cycles</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">2 Active</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Q3 Review in progress</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Employees</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">124</p>
                  <p className="text-[11px] text-outline mt-1">Total managed workforce</p>
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

              {/* Dynamic Content Panel */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8">
                {activeTab === "employees" && <EmployeesTab />}
                {activeTab === "cycles" && <CyclesTab />}
                {activeTab === "evaluations" && <EvaluationsTab />}
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "reports" && <ReportsTab />}
                {activeTab === "notifications" && <NotificationsTab />}
              </div>

            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

export default function HRDashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <HRDashboardContent />
    </Suspense>
  );
}

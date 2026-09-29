"use client";

import React, { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ManagerNavTabs from "@/components/manager/ManagerNavTabs";
import { useManagerDashboardData } from "@/hooks/useManagerDashboardData";

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
  const { session, workflowsQuery, teamQuery } = useManagerDashboardData();

  const managerProfile = session?.profile;
  const managerScope = session?.scope;
  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || "Manager";

  const workflowCount = workflowsQuery.data?.total || managerScope?.assigned_workflow_ids?.length || 0;
  const teamSize = teamQuery.data?.length || managerScope?.assigned_student_ids?.length || 0;

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
        <ManagerNavTabs />

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-label-sm text-outline font-medium">Workflows Managed</span>
            <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
              {workflowCount}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Active Projects</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-label-sm text-outline font-medium">Team Size</span>
            <p className="text-headline-sm font-headline font-bold text-on-surface mt-1 truncate">
              {teamSize}
            </p>
            <p className="text-[11px] text-outline mt-1">Direct reports</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-label-sm text-outline font-medium">Pending Reviews</span>
            <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">2</p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Requires attention</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
            <span className="text-label-sm text-outline font-medium">Evaluation Matrices</span>
            <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
              0
            </p>
            <p className="text-[11px] text-outline mt-1">Tracked across tasks</p>
          </div>
        </div>

        {/* Content Panel */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      {() => (
        <Suspense fallback={<div>Loading manager dashboard...</div>}>
          <ManagerLayoutContent>{children}</ManagerLayoutContent>
        </Suspense>
      )}
    </ProtectedRoute>
  );
}

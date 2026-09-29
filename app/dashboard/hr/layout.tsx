"use client";

import React, { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";

function HRNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { id: "employees", label: "Employees", icon: "groups", path: "/dashboard/hr" },
    { id: "cycles", label: "Performance Cycles", icon: "calendar_month", path: "/dashboard/hr/cycles" },
    { id: "evaluations", label: "Evaluation Monitoring", icon: "rule", path: "/dashboard/hr/evaluations" },
    { id: "analytics", label: "Analytics", icon: "equalizer", path: "/dashboard/hr/analytics" },
    { id: "reports", label: "Reports", icon: "description", path: "/dashboard/hr/reports" },
    { id: "notifications", label: "Notifications", icon: "notifications", path: "/dashboard/hr/notifications" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.path === "/dashboard/hr" && pathname === "/dashboard/hr/employees");

        return (
          <Link
            key={tab.id}
            href={tab.path}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              isActive
                ? "bg-[#4B2EF5] text-white shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function HRLayoutContent({ children }: { children: React.ReactNode }) {
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
              <HRNavTabs />

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Total Personnel</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    Directory Live
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
              {children}

            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading HR dashboard...</div>}>
      <HRLayoutContent>{children}</HRLayoutContent>
    </Suspense>
  );
}

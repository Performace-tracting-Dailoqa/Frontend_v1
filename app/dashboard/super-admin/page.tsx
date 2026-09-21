"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SuperAdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "roles" | "audit" | "settings">("overview");

  return (
    <ProtectedRoute allowedRoles={["admin", "super admin"]}>
      {(session) => {
        const adminScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0];

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">

              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    <span>System Administration &amp; Governance</span>
                  </div>
                  <h1 className="text-headline-md font-headline font-bold text-on-surface">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    System-wide Scope: <span className="font-medium text-on-surface">{adminScope?.scope_type || "system_wide"}</span>
                    {" "}• Authentication Provider: <span className="font-medium text-on-surface">Supabase Auth (FastAPI Bearer)</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl text-body-sm font-medium border border-outline-variant/50 text-on-surface">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Super Admin Mode</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2 text-body-sm font-medium">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "overview"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>System Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "users"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">manage_accounts</span>
                  <span>User Provisioning</span>
                </button>

                <button
                  onClick={() => setActiveTab("roles")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "roles"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">security</span>
                  <span>Roles &amp; Scopes</span>
                </button>

                <button
                  onClick={() => setActiveTab("audit")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "audit"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">receipt_long</span>
                  <span>Audit Logs</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "settings"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">settings</span>
                  <span>System Settings</span>
                </button>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Session Identity</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1 truncate">
                    {session.user.id.slice(0, 8)}...
                  </p>
                  <p className="text-[11px] text-outline mt-1">public.users UUID</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">RBAC Role</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">
                    {session.role?.name || "Super Admin"}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Verified /auth/me</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">Scope Boundary</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">System Wide</p>
                  <p className="text-[11px] text-outline mt-1">Full institutional scope</p>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
                  <span className="text-label-sm text-outline font-medium">API Contract</span>
                  <p className="text-headline-sm font-headline font-bold text-on-surface mt-1">SCRUM-31</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">FastAPI v1 Auth</p>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                </div>
                <h3 className="text-title-lg font-headline font-bold text-on-surface">
                  Administrative Governance Scaffolding
                </h3>
                <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
                  System user provisioning and detailed audit logs will connect to respective administrative endpoints in upcoming platform iterations.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs font-medium border border-outline-variant/40">
                  <span className="material-symbols-outlined text-sm">security</span>
                  <span>Administrative visibility shell active • No unauthenticated access</span>
                </div>
              </div>

            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

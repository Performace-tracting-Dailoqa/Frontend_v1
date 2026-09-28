"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import { motion, AnimatePresence } from "framer-motion";
import { isSuperAdminTab, SuperAdminTab, SUPER_ADMIN_TABS } from "@/components/super-admin/types";
import {
  fetchSystemTelemetry,
  getCurrentProfile,
  CurrentProfile,
  SystemTelemetryData,
} from "@/services/adminService";
import SuperAdminHeader from "@/components/super-admin/SuperAdminHeader";

import OverviewTab from "@/components/super-admin/tabs/OverviewTab";
import TeamsTab from "@/components/super-admin/tabs/TeamsTab";
import PeopleTab from "@/components/super-admin/tabs/PeopleTab";
import ProgressTab from "@/components/super-admin/tabs/ProgressTab";
import CalendarTab from "@/components/super-admin/tabs/CalendarTab";
import AddPersonTab from "@/components/super-admin/tabs/AddPersonTab";
import ProfileSettingsTab from "@/components/super-admin/tabs/ProfileSettingsTab";

function SuperAdminDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(
    isSuperAdminTab(tabParam) ? tabParam : "overview"
  );

  const [telemetry, setTelemetry] = useState<SystemTelemetryData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profile, setProfile] = useState<CurrentProfile | null>(() => getCurrentProfile());

  // An unknown ?tab= value is corrected to Overview so a stale bookmark cannot
  // land on a page that no longer exists.
  useEffect(() => {
    if (isSuperAdminTab(tabParam)) {
      setActiveTab(tabParam);
    } else if (tabParam !== null) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "overview");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [tabParam, pathname, router, searchParams]);

  const loadTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setTelemetry(await fetchSystemTelemetry());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTelemetry();
  }, [loadTelemetry]);

  const handleTabChange = (tab: SuperAdminTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeMeta = SUPER_ADMIN_TABS.find((tab) => tab.key === activeTab);

  return (
    <ProtectedRoute allowedRoles={["admin", "super admin"]}>
      {(session) => {
        // `ProtectedRoute` resolves GET /auth/me and persists it before
        // rendering, so the session is already authoritative here. Reading it
        // directly (rather than through state) keeps the header in sync with a
        // just-saved profile without an extra render pass.
        const current = profile ?? getCurrentProfile() ?? null;

        const displayName =
          current?.name || session.user.name || session.user.email.split("@")[0] || "Superuser";

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
              <SuperAdminHeader
                displayName={displayName}
                roleName={current?.role.name || session.role?.name || "Super Admin"}
                scopeType={current?.scopeType || session.scope?.scope_type || "system_wide"}
                authProvider={current?.authProvider ?? session.user.auth_provider ?? null}
                telemetry={telemetry}
                isRefreshing={isRefreshing}
                onRefresh={loadTelemetry}
              />

              {/* Navigation lives in the sidebar only. This heading exists purely
                  so a deep-linked or refreshed page still says which of the seven
                  sections is open, which the removed tab bar used to provide. */}
              {activeMeta && (
                <div className="pt-1">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    {activeMeta.label}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">{activeMeta.description}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.995 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
                  className="pt-1"
                >
                  {activeTab === "overview" && (
                    <OverviewTab
                      telemetry={telemetry}
                      onNavigateTab={handleTabChange}
                      onRefresh={loadTelemetry}
                    />
                  )}

                  {activeTab === "teams" && (
                    <TeamsTab onOpenAddPerson={() => handleTabChange("add-person")} />
                  )}

                  {activeTab === "users" && (
                    <PeopleTab onOpenAddPerson={() => handleTabChange("add-person")} />
                  )}

                  {activeTab === "progress" && <ProgressTab />}

                  {activeTab === "calendar" && <CalendarTab />}

                  {activeTab === "add-person" && (
                    <AddPersonTab
                      onNavigateTab={handleTabChange}
                      onPersonCreated={() => void loadTelemetry()}
                    />
                  )}

                  {activeTab === "profile" && (
                    <ProfileSettingsTab
                      profile={current}
                      onProfileUpdated={(updated) => setProfile(updated)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </DashboardLayout>
        );
      }}
    </ProtectedRoute>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SuperAdminDashboardContent />
    </Suspense>
  );
}

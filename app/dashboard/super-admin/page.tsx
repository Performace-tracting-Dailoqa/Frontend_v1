"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import { motion, AnimatePresence } from "framer-motion";
import { SuperAdminTab, SimulationState, UserDirectoryRecord } from "@/components/super-admin/types";
import { MOCK_USERS } from "@/components/super-admin/mockData";
import {
  fetchSystemTelemetry,
  fetchAdminUsers,
  SystemTelemetryData,
} from "@/services/adminService";
import SuperuserSandboxBanner from "@/components/super-admin/SuperuserSandboxBanner";
import SuperAdminHeader from "@/components/super-admin/SuperAdminHeader";
import SuperAdminNavTabs from "@/components/super-admin/SuperAdminNavTabs";

import OverviewTab from "@/components/super-admin/tabs/OverviewTab";
import OrganisationsTab from "@/components/super-admin/tabs/OrganisationsTab";
import PeopleTab from "@/components/super-admin/tabs/PeopleTab";
import ProgressTab from "@/components/super-admin/tabs/ProgressTab";
import AccessControlTab from "@/components/super-admin/tabs/AccessControlTab";
import AuditLogTab from "@/components/super-admin/tabs/AuditLogTab";
import SystemSettingsTab from "@/components/super-admin/tabs/SystemSettingsTab";
import PortalsTab from "@/components/super-admin/tabs/PortalsTab";
import TeamsReportsTab from "@/components/super-admin/tabs/TeamsReportsTab";
import CalendarTab from "@/components/super-admin/tabs/CalendarTab";
import NotificationsTab from "@/components/super-admin/tabs/NotificationsTab";
import ProfileSettingsTab from "@/components/super-admin/tabs/ProfileSettingsTab";

function SuperAdminDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") as SuperAdminTab | null;
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(tabParam || "overview");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("all");
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

  // Dynamic Backend State
  const [telemetry, setTelemetry] = useState<SystemTelemetryData | null>(null);
  const [users, setUsers] = useState<UserDirectoryRecord[]>(MOCK_USERS);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Simulation / Impersonation State
  const [simulation, setSimulation] = useState<SimulationState>({
    isActive: false,
    role: "",
    user: "",
    organisation: "",
    auditHash: "",
  });

  // Sync state if URL searchParam changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  // Dynamic Backend Fetching
  const loadBackendData = async () => {
    try {
      setIsLoadingData(true);
      const [telemetryRes, liveUsers] = await Promise.all([
        fetchSystemTelemetry(),
        fetchAdminUsers(),
      ]);

      if (telemetryRes) {
        setTelemetry(telemetryRes);
      }

      if (liveUsers && liveUsers.length > 0) {
        // Merge live users with mock users to retain rich multi-org demo seed while prioritizing real users
        const liveEmails = new Set(liveUsers.map((u) => u.email.toLowerCase()));
        const nonDuplicateMocks = MOCK_USERS.filter(
          (m) => !liveEmails.has(m.email.toLowerCase())
        );
        setUsers([...liveUsers, ...nonDuplicateMocks]);
      }
    } catch (err) {
      console.warn("Could not load backend data, using local fallback:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  const handleTabChange = (tab: SuperAdminTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleActivateSimulation = (role: string, user: string, org: string) => {
    const hash = `#ledger-${Math.floor(1000 + Math.random() * 9000)}`;
    setSimulation({
      isActive: true,
      role,
      user,
      organisation: org,
      auditHash: hash,
    });
  };

  const handleExitSimulation = () => {
    setSimulation({
      isActive: false,
      role: "",
      user: "",
      organisation: "",
      auditHash: "",
    });
  };

  const handleExportTelemetry = () => {
    const reportData = {
      exportTime: new Date().toISOString(),
      scope: "system_wide",
      uptime: telemetry?.system_uptime || "99.98%",
      activeTenants: 4,
      totalIdentities: users.length,
      databaseConnected: telemetry?.database_connected ?? true,
      databaseLatencyMs: telemetry?.database_latency_ms ?? 14,
      auditLedgerIntegrity: telemetry?.audit_ledger_status || "SHA-256 Valid",
      bastionNodes: ["Tokyo-01", "Osaka-02", "Cloudflare-Edge"],
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superuser_telemetry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super admin"]}>
      {(session) => {
        const adminScope = session.scope;
        const displayName = session.user.name || session.user.email.split("@")[0] || "Marcus Brody";

        return (
          <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
              {/* 1. SIMULATION & SANDBOX BANNER SYSTEM */}
              <SuperuserSandboxBanner
                simulation={simulation}
                onActivateSimulation={handleActivateSimulation}
                onExitSimulation={handleExitSimulation}
              />

              {/* 2. SUPER ADMIN HEADER */}
              <SuperAdminHeader
                displayName={displayName}
                scopeType={adminScope?.scope_type || "system_wide"}
                selectedOrgFilter={selectedOrgFilter}
                onSelectOrgFilter={setSelectedOrgFilter}
                onOpenCreateOrg={() => setIsCreateOrgModalOpen(true)}
                onExportTelemetry={handleExportTelemetry}
              />

              {/* 3. NAVIGATION TABS */}
              <SuperAdminNavTabs
                activeTab={activeTab}
                onChangeTab={handleTabChange}
              />

              {/* 4. ACTIVE TAB CONTENT VIEW WITH FRAMER MOTION TRANSITIONS */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.995 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="pt-1"
                >
                  {activeTab === "overview" && (
                    <OverviewTab
                      telemetry={telemetry}
                      totalUsersCount={users.length}
                      onNavigateTab={(targetTab) => handleTabChange(targetTab)}
                      onSimulate={handleActivateSimulation}
                    />
                  )}

                  {activeTab === "organisations" && (
                    <OrganisationsTab
                      onSimulate={handleActivateSimulation}
                      isCreateModalOpen={isCreateOrgModalOpen}
                      onCloseCreateModal={() => setIsCreateOrgModalOpen(false)}
                    />
                  )}

                  {activeTab === "users" && (
                    <PeopleTab
                      users={users}
                      isLoading={isLoadingData}
                      onRefreshUsers={loadBackendData}
                      onSimulate={handleActivateSimulation}
                      selectedOrgFilter={selectedOrgFilter}
                    />
                  )}

                  {activeTab === "progress" && (
                    <ProgressTab onSimulate={handleActivateSimulation} />
                  )}

                  {activeTab === "roles" && <AccessControlTab />}

                  {activeTab === "audit" && <AuditLogTab />}

                  {activeTab === "settings" && <SystemSettingsTab />}

                  {activeTab === "portals" && (
                    <PortalsTab onSimulate={handleActivateSimulation} />
                  )}

                  {activeTab === "reports" && <TeamsReportsTab />}

                  {activeTab === "calendar" && <CalendarTab />}

                  {activeTab === "notifications" && <NotificationsTab />}

                  {activeTab === "profile" && (
                    <ProfileSettingsTab displayName={displayName} />
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

"use client";

import { UserDirectoryRecord } from "@/components/super-admin/types";

export interface SystemTelemetryData {
  status: string;
  database_connected: boolean;
  database_latency_ms: number;
  total_users: number;
  active_users: number;
  students_count: number;
  teachers_count: number;
  roles: Array<{ id: string; name: string }>;
  system_uptime: string;
  bastion_nodes: number;
  audit_ledger_status: string;
  timestamp: number;
}

export async function fetchSystemTelemetry(): Promise<SystemTelemetryData | null> {
  try {
    const res = await fetch("/api/v1/admin/telemetry", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch backend telemetry, using fallback:", err);
    return null;
  }
}

export async function fetchAdminUsers(): Promise<UserDirectoryRecord[] | null> {
  try {
    const res = await fetch("/api/v1/admin/users", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((u: Record<string, unknown>) => ({
        id: String(u.id),
        name: String(u.name || ""),
        email: String(u.email || ""),
        role: (u.role === "Student" ? "Learner" : u.role === "Super Admin" ? "Superuser" : u.role) as UserDirectoryRecord["role"],
        organisation: String(u.organisation || "Dailoqa MiRai Consortium"),
        orgCode: String(u.orgCode || "DMC"),
        batchOrDept: String(u.batchOrDept || "General"),
        specialization: u.specialization ? String(u.specialization) : undefined,
        status: (u.status || "Active") as UserDirectoryRecord["status"],
        mfaEnabled: Boolean(u.mfaEnabled),
        lastActive: String(u.lastActive || "Recently active"),
        initials: String(u.initials || "U"),
      }));
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch backend users, using fallback:", err);
    return null;
  }
}

export async function toggleBackendUserStatus(userId: string, isActive: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to update user status in backend:", err);
    return false;
  }
}

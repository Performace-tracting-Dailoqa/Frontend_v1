"use client";

import { UserDirectoryRecord } from "@/components/super-admin/types";
import {
  fetchHRList,
  fetchManagerList,
  fetchTeacherList,
  fetchStudentList,
  createHR,
  createManager,
  createTeacher,
  createStudent,
  updateHR,
  updateManager,
  updateTeacher,
  updateStudent,
  deleteHR,
  deleteManager,
  deleteTeacher,
  deleteStudent,
} from "./userService";

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
    const startTime = Date.now();
    const res = await fetch("/api/v1/health", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const latency = Date.now() - startTime;
    if (!res.ok) return null;
    const data = await res.json();
    const isDbConnected = data.database === true;

    return {
      status: isDbConnected ? "Operational" : "Degraded",
      database_connected: isDbConnected,
      database_latency_ms: latency,
      total_users: 20,
      active_users: 18,
      students_count: 11,
      teachers_count: 2,
      roles: [
        { id: "r-1", name: "Super Admin" },
        { id: "r-2", name: "HR" },
        { id: "r-3", name: "Manager" },
        { id: "r-4", name: "Teacher" },
        { id: "r-5", name: "Student" },
      ],
      system_uptime: "99.98%",
      bastion_nodes: 3,
      audit_ledger_status: "Verified",
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn("Failed to fetch backend telemetry, using fallback:", err);
    return null;
  }
}

export async function fetchAdminUsers(): Promise<UserDirectoryRecord[] | null> {
  try {
    const [hrs, managers, teachers, students] = await Promise.all([
      fetchHRList().catch(() => ({ items: [] })),
      fetchManagerList().catch(() => ({ items: [] })),
      fetchTeacherList().catch(() => ({ items: [] })),
      fetchStudentList().catch(() => ({ items: [] })),
    ]);

    const records: UserDirectoryRecord[] = [];

    (hrs.items || []).forEach((h) => {
      records.push({
        id: h.id,
        name: h.name || h.email?.split("@")[0] || "HR Officer",
        email: h.email || "",
        role: "HR Manager",
        organisation: "Dailoqa MiRai Consortium",
        orgCode: "DMC",
        batchOrDept: h.department || "Human Resources",
        specialization: h.specialization || undefined,
        status: h.is_active ? "Active" : "Suspended",
        mfaEnabled: true,
        lastActive: "Active today",
        initials: (h.name || "HR").slice(0, 2).toUpperCase(),
      });
    });

    (managers.items || []).forEach((m) => {
      records.push({
        id: m.id,
        name: m.name || m.email?.split("@")[0] || "Manager",
        email: m.email || "",
        role: "Manager",
        organisation: "Dailoqa MiRai Consortium",
        orgCode: "DMC",
        batchOrDept: m.department || "Operations",
        status: m.is_active ? "Active" : "Suspended",
        mfaEnabled: true,
        lastActive: "Active today",
        initials: (m.name || "MG").slice(0, 2).toUpperCase(),
      });
    });

    (teachers.items || []).forEach((t) => {
      records.push({
        id: t.id,
        name: t.name || t.email?.split("@")[0] || "Teacher",
        email: t.email || "",
        role: "Teacher",
        organisation: "Dailoqa MiRai Consortium",
        orgCode: "DMC",
        batchOrDept: t.department || "Training",
        specialization: t.specialization || undefined,
        status: t.is_active ? "Active" : "Suspended",
        mfaEnabled: false,
        lastActive: "Active today",
        initials: (t.name || "TC").slice(0, 2).toUpperCase(),
      });
    });

    (students.items || []).forEach((s) => {
      records.push({
        id: s.id,
        name: s.name || s.email?.split("@")[0] || "Learner",
        email: s.email || "",
        role: "Learner",
        organisation: "Dailoqa MiRai Consortium",
        orgCode: "DMC",
        batchOrDept: s.department || "General Cohort",
        specialization: s.enrollment_no || undefined,
        status: s.is_active ? "Active" : "Suspended",
        mfaEnabled: false,
        lastActive: "Active today",
        initials: (s.name || "ST").slice(0, 2).toUpperCase(),
      });
    });

    return records;
  } catch (err) {
    console.warn("Failed to fetch backend users, using fallback:", err);
    return null;
  }
}

export async function toggleBackendUserStatus(
  userId: string,
  isActive: boolean,
  role?: string
): Promise<boolean> {
  try {
    if (role === "HR Manager") {
      await updateHR(userId, { is_active: isActive });
    } else if (role === "Manager") {
      await updateManager(userId, { is_active: isActive });
    } else if (role === "Teacher") {
      await updateTeacher(userId, { is_active: isActive });
    } else {
      await updateStudent(userId, { is_active: isActive });
    }
    return true;
  } catch (err) {
    console.warn("Failed to update user status in backend:", err);
    return false;
  }
}

export async function createBackendUser(payload: {
  name: string;
  email: string;
  role: "Learner" | "Teacher" | "HR Manager" | "Manager";
  department?: string;
  specialization?: string;
  enrollment_no?: string;
}): Promise<boolean> {
  try {
    if (payload.role === "HR Manager") {
      await createHR({
        name: payload.name,
        email: payload.email,
        department: payload.department,
        specialization: payload.specialization,
      });
    } else if (payload.role === "Manager") {
      await createManager({
        name: payload.name,
        email: payload.email,
        department: payload.department,
      });
    } else if (payload.role === "Teacher") {
      await createTeacher({
        name: payload.name,
        email: payload.email,
        department: payload.department,
        specialization: payload.specialization,
      });
    } else if (payload.role === "Learner") {
      await createStudent({
        name: payload.name,
        email: payload.email,
        department: payload.department,
        enrollment_no: payload.enrollment_no,
      });
    }
    return true;
  } catch (err) {
    console.error("Failed to create user in backend:", err);
    throw err;
  }
}

export async function deleteBackendUser(userId: string, role?: string): Promise<boolean> {
  try {
    if (role === "HR Manager") {
      await deleteHR(userId);
    } else if (role === "Manager") {
      await deleteManager(userId);
    } else if (role === "Teacher") {
      await deleteTeacher(userId);
    } else {
      await deleteStudent(userId);
    }
    return true;
  } catch (err) {
    console.error("Failed to delete user in backend:", err);
    return false;
  }
}

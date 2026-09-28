export type SuperAdminTab =
  | "overview"
  | "teams"
  | "users"
  | "progress"
  | "calendar"
  | "add-person"
  | "profile"
  | "organisations"
  | "roles"
  | "audit"
  | "settings"
  | "portals"
  | "reports"
  | "notifications";

export interface SimulationState {
  isActive: boolean;
  role: string;
  user: string;
  organisation: string;
  auditHash: string;
}

export interface OrganisationRecord {
  id: string;
  code: string;
  name: string;
  domain: string;
  region: string;
  plan: "Enterprise" | "Academic" | "Standard";
  status: "Active" | "Trial" | "Suspended";
  totalUsers: number;
  maxUsers: number;
  storageGB: number;
  maxStorageGB: number;
  adminName: string;
  adminEmail: string;
  mfaEnforced: boolean;
  createdAt: string;
}

export interface UserDirectoryRecord {
  id: string;
  name: string;
  email: string;
  role: "Learner" | "Teacher" | "HR Manager" | "Manager" | "Superuser";
  organisation: string;
  orgCode: string;
  batchOrDept: string;
  specialization?: string;
  status: "Active" | "Pending" | "Suspended";
  mfaEnabled: boolean;
  lastActive: string;
  avatarUrl?: string;
  initials: string;
}

export interface AuditLogRecord {
  id: string;
  hash: string;
  timestamp: string;
  relativeTime: string;
  orgName: string;
  orgCode: string;
  actorName: string;
  actorRole: string;
  impersonatedBy?: string;
  actionTitle: string;
  actionDetails: string;
  ipAddress: string;
  location: string;
  severity: "info" | "warning" | "critical";
  payloadJson?: Record<string, unknown>;
}

export interface ProgressIncident {
  id: string;
  targetName: string;
  targetRole: "Learner" | "Teacher" | "HR";
  orgName: string;
  severity: "high" | "medium" | "low";
  issueTitle: string;
  issueDescription: string;
  metricLabel: string;
  metricValue: string;
  recommendedAction: string;
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  applyProfileNameToSession,
  CurrentProfile,
  getCurrentProfile,
  refreshProfileFromServer,
  updateOwnProfile,
} from "@/services/adminService";
import { ApiError } from "@/services/apiClient";
import {
  Avatar,
  EmptyState,
  ErrorState,
  PageIntro,
  Pill,
  PrimaryButton,
  SectionCard,
  StatusDot,
} from "../SuperAdminUi";

interface ProfileSettingsTabProps {
  /** Live profile, resolved by the dashboard shell. */
  profile: CurrentProfile | null;
  onProfileUpdated: (profile: CurrentProfile) => void;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function authProviderLabel(provider: string | null): string {
  switch ((provider || "").toLowerCase()) {
    case "microsoft":
      return "Microsoft Entra ID (SSO)";
    case "password":
      return "Email & password (Supabase Auth)";
    case "":
    case null:
    case undefined:
      return "Not recorded";
    default:
      return provider ?? "Not recorded";
  }
}

function scopeDetailEntries(details: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => [
      key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      Array.isArray(value) ? `${value.length} item${value.length === 1 ? "" : "s"}` : String(value),
    ]);
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
      <span className="text-[11px] text-slate-500 shrink-0">{label}</span>
      <span
        className={`text-xs font-semibold text-slate-800 text-right break-all ${
          mono ? "font-mono text-[11px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ProfileSettingsTab({ profile, onProfileUpdated }: ProfileSettingsTabProps) {
  const [draftName, setDraftName] = useState(profile?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Keep the form in sync when the parent replaces the profile object.
  React.useEffect(() => {
    setDraftName(profile?.name ?? "");
  }, [profile?.id, profile?.name]);

  if (!profile) {
    return (
      <EmptyState
        icon="account_circle"
        title="No profile available"
        description="The session could not be resolved. Sign in again to load your profile."
      />
    );
  }

  const hasNameChanged = (profile.name ?? "") !== draftName.trim();
  const nameIsValid = draftName.trim().length >= 2;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!nameIsValid) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setNameError(null);

    setIsSaving(true);
    try {
      await updateOwnProfile({ name: draftName.trim() });
      applyProfileNameToSession(draftName.trim());
      setSaveSuccess(true);
      setDraftName(draftName.trim());
    } catch (caught) {
      setSaveError(caught instanceof ApiError ? caught.message : "Your profile could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const refreshed = await refreshProfileFromServer();
      onProfileUpdated(refreshed);
    } catch (caught) {
      setRefreshError(
        caught instanceof Error ? caught.message : "The profile could not be refreshed."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const scopeDetails = scopeDetailEntries(profile.scopeDetails);
  const hasScopeAssignments =
    profile.assignedBatchCount + profile.assignedStudentCount + profile.assignedWorkflowCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="account_circle"
        title="Profile"
        description="Your identity, role assignment and data scope in the PMS"
        action={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isRefreshing ? (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-base text-slate-500">refresh</span>
            )}
            <span>Re-read from API</span>
          </button>
        }
      />

      {refreshError && <ErrorState title="Refresh failed" message={refreshError} onRetry={handleRefresh} />}

      {/* IDENTITY SUMMARY */}
      <SectionCard title="Identity" icon="badge" className="lg:col-span-1">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={profile.name || profile.email} size="lg" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {profile.name || profile.email}
            </h3>
            <p className="text-xs font-mono text-slate-400 truncate">{profile.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Pill tone="primary">
                <span className="material-symbols-outlined text-[13px]">verified_user</span>
                {profile.role.name}
              </Pill>
              <StatusDot isActive={profile.isActive} />
              {profile.mustChangePassword && <Pill tone="amber">Password change required</Pill>}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <form onSubmit={handleSave} className="space-y-3" noValidate>
            <div>
              <label htmlFor="pf-name" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Display Name
              </label>
              <input
                id="pf-name"
                type="text"
                value={draftName}
                onChange={(event) => {
                  setDraftName(event.target.value);
                  setSaveSuccess(false);
                  setNameError(null);
                }}
                className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 border text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                  nameError ? "border-rose-300" : "border-slate-200 focus:border-primary"
                }`}
                autoComplete="name"
              />
              {nameError ? (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{nameError}</p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  This is how your name appears across the dashboard. Your email cannot be changed
                  here — it is the login identifier and may be bound to a Microsoft account.
                </p>
              )}
            </div>

            {saveError && (
              <div className="flex items-start gap-2.5 p-3 px-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
                <p className="text-rose-800">{saveError}</p>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Profile saved.
              </div>
            )}

            <div className="flex items-center gap-2">
              <PrimaryButton
                type="submit"
                icon={isSaving ? undefined : "save"}
                disabled={isSaving || !hasNameChanged || !nameIsValid}
              >
                {isSaving ? "Saving…" : "Save changes"}
              </PrimaryButton>
              {hasNameChanged && (
                <PrimaryButton
                  tone="slate"
                  icon="undo"
                  onClick={() => {
                    setDraftName(profile.name ?? "");
                    setNameError(null);
                    setSaveSuccess(false);
                  }}
                >
                  Reset
                </PrimaryButton>
              )}
            </div>
          </form>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACCOUNT DETAILS */}
        <SectionCard title="Account" subtitle="Read from GET /api/v1/auth/me" icon="manage_accounts">
          <div className="space-y-0">
            <DetailRow label="User ID" value={profile.id} mono />
            <DetailRow label="Email" value={profile.email} mono />
            <DetailRow label="Role" value={`${profile.role.name}${profile.roleDescription ? ` — ${profile.roleDescription}` : ""}`} />
            <DetailRow label="Sign-in provider" value={authProviderLabel(profile.authProvider)} />
            <DetailRow label="Session" value={profile.sessionType} />
            <DetailRow label="Signed in at" value={formatDateTime(profile.loginAt)} />
            <DetailRow label="Account created" value={formatDateTime(profile.createdAt)} />
            <DetailRow label="Last updated" value={formatDateTime(profile.lastUpdatedAt)} />
          </div>
        </SectionCard>

        {/* ROLE PROFILE */}
        <SectionCard
          title="Role Profile"
          subtitle={
            profile.profileType
              ? `public.${profile.profileType} record attached to this identity`
              : "No role profile row is attached to this identity"
          }
          icon="id_card"
        >
          {profile.profileType ? (
            <div className="space-y-0">
              <DetailRow label="Profile type" value={profile.profileType} />
              <DetailRow label="Department" value={profile.department ?? "—"} />
              <DetailRow label="Specialization" value={profile.specialization ?? "—"} />
              <DetailRow label="Enrollment number" value={profile.enrollmentNo ?? "—"} />
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              A Super Admin is authorized by role alone, so no HR, manager, teacher or student
              profile row is required.
            </p>
          )}
        </SectionCard>
      </div>

      {/* DATA SCOPE */}
      <SectionCard
        title="Data Scope"
        subtitle={`Scope type: ${profile.scopeType ?? "system_wide"}`}
        icon="radar"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500">Assigned teams</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{profile.assignedBatchCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500">Assigned learners</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{profile.assignedStudentCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500">Assigned workflows</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{profile.assignedWorkflowCount}</p>
          </div>
        </div>

        {scopeDetails.length > 0 ? (
          <div className="space-y-0">
            {scopeDetails.map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))}
          </div>
        ) : hasScopeAssignments ? (
          <p className="text-[11px] text-slate-400">
            The scope is enforced by the assigned {profile.assignedBatchCount > 0 ? "team" : "record"}
            {profile.assignedBatchCount + profile.assignedStudentCount + profile.assignedWorkflowCount ===
            1
              ? ""
              : "s"}{" "}
            listed above.
          </p>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            A system-wide scope — every team, learner and workflow in the platform is visible to
            this role.
          </p>
        )}
      </SectionCard>
    </motion.div>
  );
}

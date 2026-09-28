"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createBackendUser,
  DirectoryPerson,
  DirectoryRole,
} from "@/services/adminService";
import { ApiError } from "@/services/apiClient";
import { PageIntro, Pill, PrimaryButton, SectionCard } from "../SuperAdminUi";
import { SuperAdminTab } from "../types";

interface AddPersonTabProps {
  onNavigateTab: (tab: SuperAdminTab) => void;
  /** Called after a successful create so the People page can re-read the directory. */
  onPersonCreated?: (person: DirectoryPerson) => void;
}

/**
 * The four account types a superuser can provision, and which fields each one
 * actually stores.
 *
 * "Intern" maps to `public.students`: the PMS has no separate intern table, so
 * an intern is a learner record with an enrollment number. The label is the UI's
 * choice; the record is a student.
 */
const ROLE_OPTIONS: Array<{
  role: DirectoryRole;
  label: string;
  description: string;
  icon: string;
  endpoint: string;
  needsSpecialization: boolean;
  needsEnrollment: boolean;
  tone: "violet" | "amber" | "teal" | "indigo";
}> = [
  {
    role: "HR Manager",
    label: "HR",
    description: "People operations. Can also manage the role directories.",
    icon: "manage_accounts",
    endpoint: "POST /api/v1/hr",
    needsSpecialization: true,
    needsEnrollment: false,
    tone: "violet",
  },
  {
    role: "Manager",
    label: "Manager",
    description: "Owns a team, its workflows and the tasks inside them.",
    icon: "badge",
    endpoint: "POST /api/v1/managers",
    needsSpecialization: false,
    needsEnrollment: false,
    tone: "amber",
  },
  {
    role: "Teacher",
    label: "Teacher",
    description: "Delivers training and scores workflow and general evaluations.",
    icon: "history_edu",
    endpoint: "POST /api/v1/teachers",
    needsSpecialization: true,
    needsEnrollment: false,
    tone: "teal",
  },
  {
    role: "Intern",
    label: "Intern",
    description: "Learner record. Optionally linked to a batch by the team module.",
    icon: "school",
    endpoint: "POST /api/v1/students",
    needsSpecialization: false,
    needsEnrollment: true,
    tone: "indigo",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CreatedRecord {
  person: DirectoryPerson;
}

export default function AddPersonTab({ onNavigateTab, onPersonCreated }: AddPersonTabProps) {
  const [selectedRole, setSelectedRole] = useState<DirectoryRole>("Intern");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<CreatedRecord | null>(null);

  const activeRole = useMemo(
    () => ROLE_OPTIONS.find((option) => option.role === selectedRole) ?? ROLE_OPTIONS[3],
    [selectedRole]
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setDepartment("");
    setSpecialization("");
    setEnrollmentNo("");
    setFieldErrors({});
    setError(null);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) {
      next.name = "Name is required.";
    } else if (name.trim().length < 2) {
      next.name = "Name must be at least 2 characters.";
    }

    if (!email.trim()) {
      next.email = "Email is required — it is the login identifier.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = "Enter a valid email address.";
    } else if (email.trim().toLowerCase() !== email.trim()) {
      next.email = "Email must be lowercase.";
    }

    if (activeRole.needsSpecialization && !specialization.trim()) {
      next.specialization = `Specialization is required for the ${activeRole.label} role.`;
    }

    if (activeRole.needsEnrollment && !enrollmentNo.trim()) {
      next.enrollmentNo = "Enrollment number is required for interns.";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setCreated(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const person = await createBackendUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole,
        department: department.trim() || undefined,
        specialization: activeRole.needsSpecialization ? specialization.trim() || undefined : undefined,
        enrollment_no: activeRole.needsEnrollment ? enrollmentNo.trim() || undefined : undefined,
      });

      setCreated({ person });
      onPersonCreated?.(person);
      resetForm();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else if (caught instanceof Error) {
        setError(caught.message);
      } else {
        setError("The account could not be provisioned.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (key: string) =>
    `w-full h-11 px-3.5 rounded-xl bg-slate-50 border text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
      fieldErrors[key]
        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
        : "border-slate-200 focus:border-primary"
    }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageIntro
        icon="person_add"
        title="Add Person"
        description="Provision a new HR officer, manager, teacher or intern account"
        action={
          <button
            type="button"
            onClick={() => onNavigateTab("users")}
            className="h-10 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-base text-slate-500">group</span>
            <span>View all people</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ROLE PICKER */}
        <SectionCard
          title="Account Type"
          subtitle="Pick the role to provision"
          icon="account_tree"
          className="lg:col-span-2 self-start"
        >
          <div className="space-y-2">
            {ROLE_OPTIONS.map((option) => {
              const isActive = option.role === selectedRole;
              return (
                <motion.button
                  key={option.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(option.role);
                    setFieldErrors({});
                    setError(null);
                  }}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "border-[#4B2EF5] bg-primary/5 ring-2 ring-[#4B2EF5]/15"
                      : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-[#4B2EF5] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{option.icon}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{option.label}</span>
                        <Pill tone={option.tone}>{option.role}</Pill>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {option.description}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1.5">{option.endpoint}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </SectionCard>

        {/* FORM */}
        <SectionCard
          title={`New ${activeRole.label} account`}
          subtitle="Creates the user identity and its role profile"
          icon="person_add"
          className="lg:col-span-3"
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ap-name" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ap-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Priya Raghunathan"
                  className={fieldClass("name")}
                  autoComplete="off"
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="ap-email" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ap-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className={fieldClass("email")}
                  autoComplete="off"
                />
                {fieldErrors.email ? (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Used as the login identifier.</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="ap-department"
                  className="block text-[11px] font-bold text-slate-700 mb-1.5"
                >
                  Department
                </label>
                <input
                  id="ap-department"
                  type="text"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  placeholder="e.g. Engineering"
                  className={fieldClass("department")}
                  autoComplete="off"
                />
              </div>

              {activeRole.needsSpecialization && (
                <div>
                  <label
                    htmlFor="ap-specialization"
                    className="block text-[11px] font-bold text-slate-700 mb-1.5"
                  >
                    Specialization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="ap-specialization"
                    type="text"
                    value={specialization}
                    onChange={(event) => setSpecialization(event.target.value)}
                    placeholder={
                      selectedRole === "Teacher" ? "e.g. IELTS Preparation" : "e.g. Talent Operations"
                    }
                    className={fieldClass("specialization")}
                    autoComplete="off"
                  />
                  {fieldErrors.specialization && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.specialization}
                    </p>
                  )}
                </div>
              )}

              {activeRole.needsEnrollment && (
                <div>
                  <label
                    htmlFor="ap-enrollment"
                    className="block text-[11px] font-bold text-slate-700 mb-1.5"
                  >
                    Enrollment Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="ap-enrollment"
                    type="text"
                    value={enrollmentNo}
                    onChange={(event) => setEnrollmentNo(event.target.value)}
                    placeholder="e.g. INT-2026-014"
                    className={fieldClass("enrollmentNo")}
                    autoComplete="off"
                  />
                  {fieldErrors.enrollmentNo ? (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.enrollmentNo}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Must be unique across interns.</p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
                <p className="text-rose-800">{error}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <PrimaryButton type="submit" icon={isSubmitting ? undefined : "how_to_reg"} disabled={isSubmitting}>
                {isSubmitting ? "Provisioning…" : `Create ${activeRole.label} account`}
              </PrimaryButton>
              <PrimaryButton tone="slate" onClick={resetForm} icon="clear">
                Clear
              </PrimaryButton>
              <p className="text-[11px] text-slate-400 ml-auto">
                The account is created active and can sign in immediately.
              </p>
            </div>
          </form>

          <AnimatePresence>
            {created && (
              <motion.div
                key={created.person.profileId}
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-xl text-emerald-600 shrink-0">
                      check_circle
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-emerald-900">
                        {created.person.name} was provisioned as {created.person.role}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-700 mt-0.5 truncate">
                        {created.person.email}
                      </p>
                      <p className="text-[11px] text-emerald-700/80 mt-1">
                        Profile ID <span className="font-mono">{created.person.profileId}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <PrimaryButton
                      onClick={() => onNavigateTab("users")}
                      icon="group"
                      className="text-[11px]"
                    >
                      View in People
                    </PrimaryButton>
                    <PrimaryButton
                      tone="slate"
                      onClick={() => setCreated(null)}
                      icon="close"
                      className="text-[11px]"
                    >
                      Dismiss
                    </PrimaryButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BatchOption,
  createBackendUser,
  createBatch,
  DirectoryPerson,
  DirectoryRole,
  fetchBatchOptions,
} from "@/services/adminService";
import { ApiError } from "@/services/apiClient";
import { useAsyncData } from "@/hooks/useAsyncData";
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
 *
 * `supportsBatch` is true for every role except HR. Managers, teachers and
 * students each carry their own `batch_id` (added to the first two in migration
 * 0003), which records the batch a person *belongs to*. That is deliberately
 * separate from `batches.teacher_id` / `batches.manager_id`, which record the
 * batch a person *leads* — picking a batch here never overwrites a lead.
 */
const ROLE_OPTIONS: Array<{
  role: DirectoryRole;
  label: string;
  description: string;
  icon: string;
  endpoint: string;
  needsSpecialization: boolean;
  needsEnrollment: boolean;
  supportsBatch: boolean;
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
    supportsBatch: false,
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
    supportsBatch: true,
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
    supportsBatch: true,
    tone: "teal",
  },
  {
    role: "Intern",
    label: "Intern",
    description: "Learner record. Optionally assigned to an existing batch.",
    icon: "school",
    endpoint: "POST /api/v1/students",
    needsSpecialization: false,
    needsEnrollment: true,
    supportsBatch: true,
    tone: "indigo",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sentinel for "no batch chosen" — never sent to the API. */
const NO_BATCH = "";

/** `Engineering · Cohort A` when the batch names a department, else just the name. */
function batchLabel(batch: BatchOption): string {
  return batch.department ? `${batch.name} · ${batch.department}` : batch.name;
}

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
  const [batchId, setBatchId] = useState<string>(NO_BATCH);

  // Inline "new batch" mini-form, shown behind the button beside the dropdown.
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDepartment, setNewBatchDepartment] = useState("");
  const [newBatchError, setNewBatchError] = useState<string | null>(null);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<CreatedRecord | null>(null);

  const activeRole = useMemo(
    () => ROLE_OPTIONS.find((option) => option.role === selectedRole) ?? ROLE_OPTIONS[3],
    [selectedRole]
  );

  // HR has no batch column, so the list is fetched for the other three roles.
  const {
    data: batches,
    setData: setBatches,
    isInitialLoading: isLoadingBatches,
    error: batchesError,
    reload: reloadBatches,
  } = useAsyncData<BatchOption[]>(() => fetchBatchOptions(), [], {
    enabled: activeRole.supportsBatch,
    toMessage: (caught) => (caught instanceof Error ? caught.message : String(caught)),
  });

  const closeBatchForm = () => {
    setIsCreatingBatch(false);
    setNewBatchName("");
    setNewBatchDepartment("");
    setNewBatchError(null);
  };

  /**
   * Create a batch and select it, so the person in the form lands in a team
   * rather than the two-step "make a team, then re-pick it" dance.
   */
  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      setNewBatchError("Give the batch a name.");
      return;
    }

    setIsSavingBatch(true);
    setNewBatchError(null);
    try {
      const batch = await createBatch({
        name: newBatchName.trim(),
        // Fall back to the person's own department so the batch is not left blank
        // when the operator only typed a name.
        department: newBatchDepartment.trim() || department.trim() || undefined,
      });
      // Keep the list alphabetical to match the server's ordering, without a
      // refetch that would flash the dropdown back to a loading state.
      setBatches((current) =>
        [...(current ?? []), batch].sort((a, b) => a.name.localeCompare(b.name))
      );
      setBatchId(batch.id);
      closeBatchForm();
    } catch (caught) {
      setNewBatchError(
        caught instanceof Error ? caught.message : "The batch could not be created."
      );
    } finally {
      setIsSavingBatch(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setDepartment("");
    setSpecialization("");
    setEnrollmentNo("");
    setBatchId(NO_BATCH);
    closeBatchForm();
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
        batch_id: activeRole.supportsBatch && batchId ? batchId : undefined,
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
                    // The chosen batch is meaningless for a role that has no
                    // batch column, so don't carry it across the switch.
                    if (!option.supportsBatch) {
                      setBatchId(NO_BATCH);
                      closeBatchForm();
                    }
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

            {/* BATCH — full width because it carries the inline create-batch form */}
            {activeRole.supportsBatch && (
              <div className="pt-1">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <label htmlFor="ap-batch" className="block text-[11px] font-bold text-slate-700">
                    Batch
                  </label>
                  <button
                    type="button"
                    onClick={() => (isCreatingBatch ? closeBatchForm() : setIsCreatingBatch(true))}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isCreatingBatch ? "close" : "add"}
                    </span>
                    <span>{isCreatingBatch ? "Cancel" : "New batch"}</span>
                  </button>
                </div>

                <select
                  id="ap-batch"
                  value={batchId}
                  onChange={(event) => setBatchId(event.target.value)}
                  disabled={isLoadingBatches || Boolean(batchesError) || (batches?.length ?? 0) === 0}
                  className={`${fieldClass(
                    "batchId"
                  )} cursor-pointer appearance-none pr-8 disabled:cursor-not-allowed disabled:text-slate-400`}
                >
                  {isLoadingBatches ? (
                    <option value={NO_BATCH}>Loading batches…</option>
                  ) : batchesError ? (
                    <option value={NO_BATCH}>Batches unavailable</option>
                  ) : (batches?.length ?? 0) === 0 ? (
                    <option value={NO_BATCH}>No batch (unassigned)</option>
                  ) : (
                    <>
                      <option value={NO_BATCH}>No batch (unassigned)</option>
                      {/* Optional-chained rather than `batches.map`: the branch is
                          only reached when the list is non-empty, but that
                          narrowing does not survive `(batches?.length ?? 0)`, so
                          the compiler still sees `batches` as possibly null. */}
                      {batches?.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batchLabel(batch)}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                {batchesError ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-[11px] text-rose-600 font-medium">
                      The batch list could not be loaded.
                    </p>
                    <button
                      type="button"
                      onClick={reloadBatches}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : isLoadingBatches ? (
                  <p className="text-[11px] text-slate-400 mt-1">Loading existing batches…</p>
                ) : (batches?.length ?? 0) === 0 ? (
                  <p className="text-[11px] text-slate-400 mt-1">
                    No batches exist yet — create one below, or add this {activeRole.label.toLowerCase()} unassigned.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Optional. The {activeRole.label.toLowerCase()} is placed in the selected batch on
                    creation. This does not change who leads it.
                  </p>
                )}

                <AnimatePresence initial={false}>
                  {isCreatingBatch && (
                    <motion.div
                      key="new-batch"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-slate-400">
                            groups
                          </span>
                          <p className="text-[11px] font-bold text-slate-700">
                            Create a new team
                          </p>
                          <p className="text-[11px] text-slate-500">
                            It becomes a team on the Teams page and is selected here automatically.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="ap-new-batch-name"
                              className="block text-[11px] font-bold text-slate-700 mb-1.5"
                            >
                              Batch Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id="ap-new-batch-name"
                              type="text"
                              value={newBatchName}
                              onChange={(event) => setNewBatchName(event.target.value)}
                              placeholder="e.g. Engineering Cohort A"
                              className={fieldClass("newBatchName")}
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="ap-new-batch-department"
                              className="block text-[11px] font-bold text-slate-700 mb-1.5"
                            >
                              Department
                            </label>
                            <input
                              id="ap-new-batch-department"
                              type="text"
                              value={newBatchDepartment}
                              onChange={(event) => setNewBatchDepartment(event.target.value)}
                              placeholder={
                                department.trim() || "Defaults to the person's department"
                              }
                              className={fieldClass("newBatchDepartment")}
                              autoComplete="off"
                            />
                          </div>
                        </div>

                        {newBatchError && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                            <span className="material-symbols-outlined text-base text-rose-600 shrink-0">
                              error
                            </span>
                            <p className="text-[11px] text-rose-800">{newBatchError}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <PrimaryButton
                            onClick={handleCreateBatch}
                            icon={isSavingBatch ? undefined : "add"}
                            disabled={isSavingBatch}
                          >
                            {isSavingBatch ? "Creating…" : "Create & select batch"}
                          </PrimaryButton>
                          <PrimaryButton tone="slate" onClick={closeBatchForm} icon="clear">
                            Cancel
                          </PrimaryButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

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

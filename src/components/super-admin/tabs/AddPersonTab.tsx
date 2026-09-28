"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { createBackendUser } from "@/services/adminService";
import { SuperAdminTab } from "../types";

interface AddPersonTabProps {
  onNavigateTab: (tab: SuperAdminTab) => void;
  onRefreshUsers?: () => void;
}

type RoleType = "HR Manager" | "Manager" | "Teacher" | "Learner";

export default function AddPersonTab({ onNavigateTab, onRefreshUsers }: AddPersonTabProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType>("Learner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ name: string; role: string; email: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Name and Email are required fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createBackendUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole,
        department: department.trim() || undefined,
        specialization: (selectedRole === "HR Manager" || selectedRole === "Teacher") ? (specialization.trim() || undefined) : undefined,
        enrollment_no: selectedRole === "Learner" ? (enrollmentNo.trim() || undefined) : undefined,
      });

      setSuccessData({
        name: name.trim(),
        role: selectedRole === "Learner" ? "Learner (Student/Intern)" : selectedRole,
        email: email.trim().toLowerCase(),
      });
      onRefreshUsers?.();

      // Reset form fields
      setName("");
      setEmail("");
      setDepartment("");
      setSpecialization("");
      setEnrollmentNo("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create user record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setErrorMsg(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* HEADER CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">person_add</span>
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Platform User</h2>
            <p className="text-xs text-slate-500">
              Provision HR, Manager, Teacher, or Learner/Intern accounts with backend API integration
            </p>
          </div>
        </div>
      </div>

      {successData ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-xs text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">User Successfully Provisioned</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Created account for <strong className="text-slate-900">{successData.name}</strong> ({successData.email}) as <strong className="text-primary">{successData.role}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="px-5 py-2.5 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">group</span>
              <span>View in People Directory</span>
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Add Another Person</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {/* ROLE SELECTOR CARDS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Select Account Type / Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Learner */}
              <button
                type="button"
                onClick={() => setSelectedRole("Learner")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === "Learner"
                    ? "border-[#4B2EF5] bg-purple-50/50 ring-2 ring-[#4B2EF5]/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-indigo-600 text-xl">school</span>
                  {selectedRole === "Learner" && (
                    <span className="w-2 h-2 rounded-full bg-[#4B2EF5]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Learner / Intern</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Student database record</div>
                </div>
              </button>

              {/* Teacher */}
              <button
                type="button"
                onClick={() => setSelectedRole("Teacher")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === "Teacher"
                    ? "border-[#4B2EF5] bg-purple-50/50 ring-2 ring-[#4B2EF5]/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-teal-600 text-xl">history_edu</span>
                  {selectedRole === "Teacher" && (
                    <span className="w-2 h-2 rounded-full bg-[#4B2EF5]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Teacher / Faculty</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Evaluator authority profile</div>
                </div>
              </button>

              {/* Manager */}
              <button
                type="button"
                onClick={() => setSelectedRole("Manager")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === "Manager"
                    ? "border-[#4B2EF5] bg-purple-50/50 ring-2 ring-[#4B2EF5]/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-amber-600 text-xl">badge</span>
                  {selectedRole === "Manager" && (
                    <span className="w-2 h-2 rounded-full bg-[#4B2EF5]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Department Manager</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Operations management profile</div>
                </div>
              </button>

              {/* HR Manager */}
              <button
                type="button"
                onClick={() => setSelectedRole("HR Manager")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === "HR Manager"
                    ? "border-[#4B2EF5] bg-purple-50/50 ring-2 ring-[#4B2EF5]/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-violet-600 text-xl">manage_accounts</span>
                  {selectedRole === "HR Manager" && (
                    <span className="w-2 h-2 rounded-full bg-[#4B2EF5]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">HR Manager</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Human resources profile</div>
                </div>
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Enter Person Details
              </label>
              {selectedRole === "Learner" && (
                <p className="text-[11px] text-slate-500 italic">
                  Note: Learners and Interns map directly to the existing student account model (`students` table).
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenji Tanaka"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kenji.tanaka@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Unit
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering, Human Resources, Academic Cohort"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {(selectedRole === "HR Manager" || selectedRole === "Teacher") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialization / Track
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Talent Acquisition, Japanese Keigo Mentor"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}

              {selectedRole === "Learner" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enrollment No / Intern ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ENR-2026-8801"
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab("users")}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Provisioning Account...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">person_add</span>
                    <span>Provision User</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}

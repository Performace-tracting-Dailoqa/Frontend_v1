"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_ORGANISATIONS } from "../mockData";

export default function AccessControlTab() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([
    {
      id: "inv-1",
      email: "yuki.sato@mirai.ac.jp",
      role: "Teacher / Evaluator",
      org: "MiRai Language Institute",
      sentAt: "Oct 22, 2026",
      expiresIn: "4 days",
    },
    {
      id: "inv-2",
      email: "hr-recruit@globaltech.io",
      role: "Tenant HR Manager",
      org: "Global Tech Innovations",
      sentAt: "Oct 23, 2026",
      expiresIn: "5 days",
    },
    {
      id: "inv-3",
      email: "c.tanaka@kyotodigital.edu",
      role: "Learner",
      org: "Kyoto Digital Academy",
      sentAt: "Oct 24, 2026",
      expiresIn: "6 days",
    },
  ]);

  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("Teacher");
  const [invOrg, setInvOrg] = useState(MOCK_ORGANISATIONS[0].name);

  const handleCreateInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invEmail) return;

    setPendingInvitations((prev) => [
      {
        id: `inv-${Date.now()}`,
        email: invEmail,
        role: invRole,
        org: invOrg,
        sentAt: "Just now",
        expiresIn: "7 days",
      },
      ...prev,
    ]);

    setInvEmail("");
    setIsInviteModalOpen(false);
  };

  const handleRevoke = (id: string) => {
    setPendingInvitations((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ROW 1: FOUR COMPACT STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Root Superusers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">2 Keys</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Hardware FIDO2 bound</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Tenant HR Admins</p>
            <h3 className="text-2xl font-bold text-violet-600 mt-1">4 Delegated</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Scoped to tenant domain</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">badge</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Faculty Leads</p>
            <h3 className="text-2xl font-bold text-teal-600 mt-1">18 Scoped</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Evaluation authority</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">school</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pending Invitations</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {pendingInvitations.length} Unclaimed
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Expires in 7 days</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">mark_email_unread</span>
          </span>
        </div>
      </div>

      {/* ROW 2: ROLE PERMISSION MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Global Role &amp; Capability Matrix (RBAC)
            </h2>
            <p className="text-xs text-slate-500">
              Enforced across FastAPI backend routers and Supabase RLS security policies
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            <span>Issue Identity Invitation</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Capability / Permission Scope</th>
                <th className="py-3 px-4 text-center font-semibold text-primary">Super Admin (Root)</th>
                <th className="py-3 px-4 text-center font-semibold text-violet-700">Tenant HR Admin</th>
                <th className="py-3 px-4 text-center font-semibold text-teal-700">Teacher / Evaluator</th>
                <th className="py-3 px-4 text-center font-semibold text-indigo-700">Student / Learner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Cross-Tenant Telemetry &amp; Bastion Override
                </td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  &quot;View As&quot; Impersonation Sandbox
                </td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Tenant Org Provisioning &amp; Quotas
                </td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  User Account Provisioning &amp; Batch Assignment
                </td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓ (Tenant)</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Evaluation Rubric Scoring &amp; Feedback Sign-off
                </td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓ (Audit)</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓ (Review)</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Self-Performance Evaluation &amp; Goals Submission
                </td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold text-base">✕</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold text-base">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 3: ACTIVE PENDING INVITATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Pending Invitations</h3>
            <p className="text-xs text-slate-500">Unclaimed tokens will auto-expire after 7 days</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {pendingInvitations.length} Active tokens
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th className="pb-2 font-semibold">Recipient Email</th>
                <th className="pb-2 font-semibold">Target Organisation</th>
                <th className="pb-2 font-semibold">Role Authority</th>
                <th className="pb-2 font-semibold">Sent At</th>
                <th className="pb-2 font-semibold">Expires</th>
                <th className="pb-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingInvitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 font-mono text-[11px]">
                    {inv.email}
                  </td>
                  <td className="py-3 text-slate-700">{inv.org}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {inv.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{inv.sentAt}</td>
                  <td className="py-3 text-amber-600 font-semibold">{inv.expiresIn}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(inv.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISSUE INVITATION MODAL WITH ANIMATE PRESENCE */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Issue Identity Invitation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateInvitation} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="faculty@mirai.ac.jp"
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Organisation</label>
                  <select
                    value={invOrg}
                    onChange={(e) => setInvOrg(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {MOCK_ORGANISATIONS.map((org) => (
                      <option key={org.id} value={org.name}>
                        {org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Authority Level</label>
                  <select
                    value={invRole}
                    onChange={(e) => setInvRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Learner">Student / Scholar</option>
                    <option value="Teacher">Teacher / Faculty Evaluator</option>
                    <option value="HR Manager">Tenant HR Administrator</option>
                    <option value="Manager">Department Manager</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Issue Token
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

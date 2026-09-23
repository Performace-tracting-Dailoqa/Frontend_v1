"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_ORGANISATIONS } from "../mockData";
import { UserDirectoryRecord } from "../types";
import { toggleBackendUserStatus } from "@/services/adminService";

interface PeopleTabProps {
  users: UserDirectoryRecord[];
  isLoading?: boolean;
  onRefreshUsers?: () => void;
  onSimulate: (role: string, user: string, org: string) => void;
  selectedOrgFilter?: string;
}

export default function PeopleTab({
  users,
  isLoading = false,
  onRefreshUsers,
  onSimulate,
  selectedOrgFilter = "all",
}: PeopleTabProps) {
  const [localUsers, setLocalUsers] = useState<UserDirectoryRecord[]>(users);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<UserDirectoryRecord | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Keep local users synced if parent users change
  React.useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Invite form state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrg, setInviteOrg] = useState(MOCK_ORGANISATIONS[0].name);
  const [inviteRole, setInviteRole] = useState<"Learner" | "Teacher" | "HR Manager" | "Manager">("Learner");

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const orgRecord = MOCK_ORGANISATIONS.find((o) => o.name === inviteOrg);

    const newUser: UserDirectoryRecord = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      organisation: inviteOrg,
      orgCode: orgRecord?.code || "ORG",
      batchOrDept: "General Intake",
      status: "Pending",
      mfaEnabled: false,
      lastActive: "Invited just now",
      initials:
        inviteName
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "U",
    };

    setLocalUsers((prev) => [newUser, ...prev]);
    setInviteName("");
    setInviteEmail("");
    setIsInviteModalOpen(false);
  };

  const handleToggleSuspendUser = async (id: string) => {
    const target = localUsers.find((u) => u.id === id);
    if (!target) return;

    const nextStatus = target.status === "Suspended" ? "Active" : "Suspended";
    const isActiveBool = nextStatus === "Active";

    // Optimistically update UI
    setLocalUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    if (selectedUserForDrawer?.id === id) {
      setSelectedUserForDrawer((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    setActiveMenuId(null);

    // Call backend API to persist
    await toggleBackendUserStatus(id, isActiveBool);
    onRefreshUsers?.();
  };

  const filteredUsers = localUsers.filter((u) => {
    const matchesOrgGlobal =
      selectedOrgFilter === "all" || u.organisation === selectedOrgFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.organisation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesOrgGlobal && matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ROW 1: DIRECTORY TELEMETRY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Live DB Identities</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{localUsers.length} Users</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Synced from Supabase</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">group</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Learners &amp; Interns</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {localUsers.filter((u) => u.role === "Learner").length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">JLPT Cohorts</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">school</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Faculty &amp; Evaluators</p>
            <h3 className="text-2xl font-bold text-teal-600 mt-1">
              {localUsers.filter((u) => u.role === "Teacher").length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Evaluator authority</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">history_edu</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Admins &amp; HR</p>
            <h3 className="text-2xl font-bold text-violet-600 mt-1">
              {localUsers.filter((u) => u.role === "HR Manager" || u.role === "Manager" || (u.role as string) === "Superuser" || (u.role as string) === "Super Admin").length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Privileged scopes</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">badge</span>
          </span>
        </motion.div>
      </div>

      {/* ROW 2: SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search people by name, email, organisation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="Learner">Learners</option>
            <option value="Teacher">Faculty / Teachers</option>
            <option value="HR Manager">HR Managers</option>
            <option value="Manager">Department Managers</option>
            <option value="Superuser">Superusers</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Invite Platform User</span>
        </button>
      </div>

      {/* ROW 3: PEOPLE DIRECTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">User Identity</th>
                <th className="py-3.5 px-4 font-semibold">Organisation</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Track / Batch</th>
                <th className="py-3.5 px-4 font-semibold">Security (MFA)</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Last Active</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Syncing real identities from Supabase database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No users match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isMenuOpen = activeMenuId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#4B2EF5] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {user.initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedUserForDrawer(user)}
                              className="font-bold text-slate-900 hover:text-primary transition-colors block truncate text-left cursor-pointer"
                            >
                              {user.name}
                            </button>
                            <span className="font-mono text-[11px] text-slate-400 block truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Org */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-primary/10 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
                            {user.orgCode}
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {user.organisation}
                          </span>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            user.role === "Learner"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : user.role === "Teacher"
                              ? "bg-teal-50 text-teal-700 border border-teal-100"
                              : user.role === "HR Manager"
                              ? "bg-violet-50 text-violet-700 border border-violet-100"
                              : user.role === "Manager"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-purple-50 text-purple-700 border border-purple-100"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Batch / Dept */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{user.batchOrDept}</div>
                        {user.specialization && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {user.specialization}
                          </div>
                        )}
                      </td>

                      {/* MFA */}
                      <td className="py-3.5 px-4">
                        {user.mfaEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <span className="material-symbols-outlined text-[13px]">shield</span>
                            2FA Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <span className="material-symbols-outlined text-[13px]">no_encryption</span>
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            user.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : user.status === "Pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === "Active"
                                ? "bg-emerald-500"
                                : user.status === "Pending"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {user.status}
                        </span>
                      </td>

                      {/* Last active */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {user.lastActive}
                      </td>

                      {/* Action dropdown */}
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : user.id)
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-xl border border-slate-200/80 z-30 py-1 text-left flex flex-col animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={() => {
                                onSimulate(user.role, user.name, user.organisation);
                                setActiveMenuId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                              <span>View As {user.role}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForDrawer(user);
                                setActiveMenuId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">account_circle</span>
                              <span>View Full Profile</span>
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button
                              type="button"
                              onClick={() => handleToggleSuspendUser(user.id)}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">block</span>
                              <span>
                                {user.status === "Suspended" ? "Activate User" : "Suspend Account"}
                              </span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER PROFILE SLIDE-OVER DRAWER WITH ANIMATE PRESENCE */}
      <AnimatePresence>
        {selectedUserForDrawer && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  User Profile Dossier
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUserForDrawer(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Profile Avatar & Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {selectedUserForDrawer.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedUserForDrawer.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    {selectedUserForDrawer.email}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {selectedUserForDrawer.role}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSimulate(
                      selectedUserForDrawer.role,
                      selectedUserForDrawer.name,
                      selectedUserForDrawer.organisation
                    );
                    setSelectedUserForDrawer(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  <span>Launch View As</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSuspendUser(selectedUserForDrawer.id)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-98 transition-all"
                >
                  {selectedUserForDrawer.status === "Suspended" ? "Activate" : "Suspend"}
                </button>
              </div>

              {/* Scope Details */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Organisation</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserForDrawer.organisation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch / Dept</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserForDrawer.batchOrDept}
                  </span>
                </div>
                {selectedUserForDrawer.specialization && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Identifier / Specialization</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedUserForDrawer.specialization}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Credentials</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserForDrawer.mfaEnabled ? "FIDO2 / 2FA Enforced" : "Password Authenticated"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span
                    className={`font-bold ${
                      selectedUserForDrawer.status === "Active"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {selectedUserForDrawer.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INVITE USER MODAL WITH ANIMATE PRESENCE */}
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
                    <span className="material-symbols-outlined text-lg">person_add</span>
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Invite Platform User</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleInviteUser} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenji Tanaka"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="k.tanaka@mirai.ac.jp"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenant Organisation</label>
                  <select
                    value={inviteOrg}
                    onChange={(e) => setInviteOrg(e.target.value)}
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
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "Learner" | "Teacher" | "HR Manager" | "Manager")
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Learner">Learner (Intern/Student)</option>
                    <option value="Teacher">Faculty / Evaluator (Teacher)</option>
                    <option value="HR Manager">Tenant HR Manager</option>
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
                    Send Invitation
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

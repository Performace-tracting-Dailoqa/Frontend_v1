"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_ORGANISATIONS } from "../mockData";
import { OrganisationRecord } from "../types";

interface OrganisationsTabProps {
  onSimulate: (role: string, user: string, org: string) => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export default function OrganisationsTab({
  onSimulate,
  isCreateModalOpen = false,
  onCloseCreateModal,
}: OrganisationsTabProps) {
  const [organisations, setOrganisations] = useState<OrganisationRecord[]>(MOCK_ORGANISATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [localModalOpen, setLocalModalOpen] = useState(false);

  // New org form state
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState<"Enterprise" | "Academic" | "Standard">("Enterprise");
  const [newOrgAdminEmail, setNewOrgAdminEmail] = useState("");
  const [newOrgSeats, setNewOrgSeats] = useState(250);

  const showModal = isCreateModalOpen || localModalOpen;
  const closeModal = () => {
    setLocalModalOpen(false);
    onCloseCreateModal?.();
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgDomain) return;

    const newRecord: OrganisationRecord = {
      id: `org-${Date.now()}`,
      code: newOrgName.substring(0, 3).toUpperCase(),
      name: newOrgName,
      domain: newOrgDomain,
      region: "Tokyo, JP",
      plan: newOrgPlan,
      status: "Active",
      totalUsers: 1,
      maxUsers: newOrgSeats,
      storageGB: 5,
      maxStorageGB: 200,
      adminName: newOrgAdminEmail.split("@")[0] || "Admin",
      adminEmail: newOrgAdminEmail,
      mfaEnforced: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setOrganisations((prev) => [newRecord, ...prev]);
    setNewOrgName("");
    setNewOrgDomain("");
    setNewOrgAdminEmail("");
    closeModal();
  };

  const handleToggleSuspend = (orgId: string) => {
    setOrganisations((prev) =>
      prev.map((org) => {
        if (org.id === orgId) {
          return {
            ...org,
            status: org.status === "Suspended" ? "Active" : "Suspended",
          };
        }
        return org;
      })
    );
  };

  const filteredOrgs = organisations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === "all" || org.plan === planFilter;
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ROW 1: KPI METRIC ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Organisations</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{organisations.length}</h3>
          </div>
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">corporate_fare</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Tenants</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {organisations.filter((o) => o.status === "Active").length}
            </h3>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Trial / Review</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {organisations.filter((o) => o.status === "Trial").length}
            </h3>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">pending</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Suspended</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">
              {organisations.filter((o) => o.status === "Suspended").length}
            </h3>
          </div>
          <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">block</span>
          </span>
        </motion.div>
      </div>

      {/* ROW 2: SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by organisation name, domain, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Academic">Academic</option>
            <option value="Standard">Standard</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setLocalModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Provision Tenant</span>
        </button>
      </div>

      {/* ROW 3: ORGANISATIONS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Tenant Organisation</th>
                <th className="py-3.5 px-4 font-semibold">Domain &amp; Region</th>
                <th className="py-3.5 px-4 font-semibold">Tier Plan</th>
                <th className="py-3.5 px-4 font-semibold">Seat Utilization</th>
                <th className="py-3.5 px-4 font-semibold">Cloud Storage</th>
                <th className="py-3.5 px-4 font-semibold">Security</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 text-right font-semibold">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.map((org) => {
                const userPct = Math.round((org.totalUsers / org.maxUsers) * 100);
                const storagePct = Math.round((org.storageGB / org.maxStorageGB) * 100);

                return (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Code */}
                    <td className="py-4 px-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {org.code}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{org.name}</div>
                          <div className="text-[11px] text-slate-400">Admin: {org.adminName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Domain & Region */}
                    <td className="py-4 px-4">
                      <div className="font-mono text-[11px] text-slate-700">{org.domain}</div>
                      <div className="text-[11px] text-slate-400">{org.region}</div>
                    </td>

                    {/* Plan */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {org.plan}
                      </span>
                    </td>

                    {/* Seat Gauge */}
                    <td className="py-4 px-4">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">
                            {org.totalUsers} / {org.maxUsers}
                          </span>
                          <span className="text-slate-500">{userPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              userPct > 90 ? "bg-amber-500" : "bg-primary"
                            }`}
                            style={{ width: `${userPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Storage */}
                    <td className="py-4 px-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">{org.storageGB} GB</span>
                          <span className="text-slate-400 text-[10px]">of {org.maxStorageGB}GB</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-400 rounded-full transition-all duration-500"
                            style={{ width: `${storagePct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Security MFA */}
                    <td className="py-4 px-4">
                      {org.mfaEnforced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          MFA Enforced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <span className="material-symbols-outlined text-[14px]">lock_open</span>
                          Optional
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          org.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : org.status === "Trial"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            org.status === "Active"
                              ? "bg-emerald-500"
                              : org.status === "Trial"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {org.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSimulate("Tenant Admin", org.adminName, org.name)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#4B2EF5] hover:text-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          View As
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(org.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            org.status === "Suspended"
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700"
                          }`}
                        >
                          {org.status === "Suspended" ? "Activate" : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROVISION ORGANISATION MODAL WITH ANIMATE PRESENCE */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">add_business</span>
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Provision New Organisation</h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Organisation Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Waseda Global Academy"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Domain / FQDN</label>
                    <input
                      type="text"
                      required
                      placeholder="waseda-global.ac.jp"
                      value={newOrgDomain}
                      onChange={(e) => setNewOrgDomain(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">License Tier</label>
                    <select
                      value={newOrgPlan}
                      onChange={(e) =>
                        setNewOrgPlan(e.target.value as "Enterprise" | "Academic" | "Standard")
                      }
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="Enterprise">Enterprise (500+ seats)</option>
                      <option value="Academic">Academic (Higher Ed)</option>
                      <option value="Standard">Standard SME</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Primary Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="dean@waseda-global.ac.jp"
                    value={newOrgAdminEmail}
                    onChange={(e) => setNewOrgAdminEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Seat Quota
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={newOrgSeats}
                    onChange={(e) => setNewOrgSeats(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Deploy Tenant
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

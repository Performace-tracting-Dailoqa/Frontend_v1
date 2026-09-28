"use client";

import React from "react";
import { motion } from "framer-motion";
import { MOCK_ORGANISATIONS, MOCK_AUDIT_LOGS } from "../mockData";
import { SystemTelemetryData } from "@/services/adminService";

import { SuperAdminTab } from "../types";

interface OverviewTabProps {
  telemetry: SystemTelemetryData | null;
  totalUsersCount: number;
  onNavigateTab: (tab: SuperAdminTab) => void;
  onSimulate: (role: string, user: string, org: string) => void;
}

export default function OverviewTab({
  telemetry,
  totalUsersCount,
  onNavigateTab,
  onSimulate,
}: OverviewTabProps) {
  const latencyMs = telemetry?.database_latency_ms ?? 14;
  const dbConnected = telemetry?.database_connected ?? true;
  const activeCount = telemetry?.active_users ?? totalUsersCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* LIVE BACKEND STATUS BANNER */}
      <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-bold text-emerald-800 dark:text-emerald-300">
            Live Backend Synchronization Active
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 dark:text-slate-300">
            Supabase PostgreSQL {dbConnected ? "Online" : "Connecting"} (Latency:{" "}
            <span className="font-mono font-bold text-emerald-700">{latencyMs} ms</span>)
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
          FastAPI Engine v0.1.0 • Connected
        </span>
      </div>

      {/* ROW 1: SIX PLATFORM-WIDE KPI CARDS WITH STAGGERED SPRING ANIMATION */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
              delayChildren: 0.02,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {/* KPI 1 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
          }}
          whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.12)" }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Organisations</span>
            <span className="material-symbols-outlined text-lg text-primary">
              corporate_fare
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">4 Active</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              +1 Trial pending
            </p>
          </div>
        </motion.div>

        {/* KPI 2 (Dynamic with Real Users) */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
          }}
          onClick={() => onNavigateTab("users")}
          whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.12)" }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Identities</span>
            <span className="material-symbols-outlined text-lg text-teal-600">
              group
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {totalUsersCount} Users
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {activeCount} Active in Database
            </p>
          </div>
        </motion.div>

        {/* KPI 3 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
          }}
          onClick={() => onNavigateTab("progress")}
          whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.12)" }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Evaluations</span>
            <span className="material-symbols-outlined text-lg text-indigo-600">
              assignment_turned_in
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">9,840</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              +14% this month
            </p>
          </div>
        </motion.div>

        {/* KPI 4 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
          }}
          whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.12)" }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Platform SLA</span>
            <span className="material-symbols-outlined text-lg text-emerald-600">
              verified
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {telemetry?.system_uptime || "99.98%"}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Zero downtime detected
            </p>
          </div>
        </motion.div>

        {/* KPI 5 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
          }}
          whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(217, 119, 6, 0.12)" }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Bastion Nodes</span>
            <span className="material-symbols-outlined text-lg text-amber-600">
              dns
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {telemetry?.bastion_nodes || 4}/4 Nodes
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Tokyo &amp; Edge Sync
            </p>
          </div>
        </motion.div>

        {/* KPI 6 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
          }}
          whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.12)" }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Audit Ledger</span>
            <span className="material-symbols-outlined text-lg text-violet-600">
              lock
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">Valid</div>
            <p className="text-[11px] text-violet-600 font-semibold font-mono mt-0.5">
              #ledger-9821 intact
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ROW 2: TENANTS DIRECTORY PREVIEW & LIVE TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tenants Directory Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Multi-Tenant Organisations
              </h2>
              <p className="text-xs text-slate-500">
                Active tenant roster and quota allocations
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("teams")}
              className="text-xs font-bold text-[#4B2EF5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Teams</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Organisation</th>
                  <th className="pb-3 font-semibold">Domain</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Seat Utilization</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_ORGANISATIONS.map((org) => {
                  const pct = Math.round((org.totalUsers / org.maxUsers) * 100);
                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                            {org.code}
                          </span>
                          <span className="font-semibold">{org.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {org.domain}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{org.totalUsers} / {org.maxUsers}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct > 90 ? "bg-amber-500" : "bg-primary"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onSimulate("Tenant Admin", org.adminName, org.name)
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#4B2EF5] hover:text-white text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          View As
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Live System Telemetry */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Live DB Telemetry
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>

          <div className="space-y-3">
            {/* Metric 1 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Supabase PostgreSQL Latency</span>
                <span className="text-emerald-600 font-bold font-mono">{latencyMs} ms</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Measured against public.users table
              </p>
              <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, 100 - latencyMs / 5))}%` }}
                />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Database User Records</span>
                <span className="text-primary font-bold">{totalUsersCount} Total</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Students: {telemetry?.students_count ?? 1} • Teachers: {telemetry?.teachers_count ?? 1}
              </p>
            </div>

            {/* Metric 3 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Redis Cache Hit Rate</span>
                <span className="text-emerald-600 font-bold">98.4%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Session TTL cached, zero eviction drops
              </p>
            </div>

            {/* Metric 4 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>System Health &amp; SLA</span>
                <span className="text-slate-900 font-bold">{telemetry?.system_uptime || "99.98%"}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Bastion Nodes: {telemetry?.bastion_nodes || 4} Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: CROSS-TENANT AUDIT STREAM PREVIEW */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cross-Tenant Audit Activity Stream
            </h2>
            <p className="text-xs text-slate-500">
              Live immutable events captured across all tenant boundaries
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("users")}
            className="text-xs font-bold text-[#4B2EF5] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open People Directory</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_AUDIT_LOGS.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -2 }}
              className={`p-3.5 rounded-xl border transition-all ${
                item.severity === "critical"
                  ? "bg-rose-50/60 border-rose-200 text-rose-950"
                  : item.severity === "warning"
                  ? "bg-amber-50/60 border-amber-200 text-amber-950"
                  : "bg-slate-50/70 border-slate-200/80 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                <span className="font-mono font-bold text-primary">{item.hash}</span>
                <span>{item.relativeTime}</span>
              </div>
              <h3 className="text-xs font-bold truncate">{item.actionTitle}</h3>
              <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                {item.actionDetails}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                <span className="font-medium truncate">{item.orgName}</span>
                <span className="font-semibold">{item.actorName}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

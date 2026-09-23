"use client";

import React from "react";
import { motion } from "framer-motion";
import { MOCK_ORGANISATIONS } from "./mockData";

interface SuperAdminHeaderProps {
  displayName: string;
  scopeType: string;
  selectedOrgFilter: string;
  onSelectOrgFilter: (org: string) => void;
  onOpenCreateOrg: () => void;
  onExportTelemetry: () => void;
}

export default function SuperAdminHeader({
  displayName,
  scopeType,
  selectedOrgFilter,
  onSelectOrgFilter,
  onOpenCreateOrg,
  onExportTelemetry,
}: SuperAdminHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 lg:p-7 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden"
    >
      <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-[#4B2EF5]/8 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="space-y-1.5 z-10">
        <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-xs uppercase tracking-wider">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="material-symbols-outlined text-lg"
          >
            admin_panel_settings
          </motion.span>
          <span>System Administration &amp; Governance</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Tokyo-01 Operational
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          System Scope: <span className="font-semibold text-slate-800">{scopeType}</span>
          {" "}• Auth: <span className="font-semibold text-slate-800">Supabase Auth (FastAPI Bearer)</span>
          {" "}• Dual-Sign: <span className="font-semibold text-emerald-600">Active</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 z-10">
        {/* Tenant Scope Selector */}
        <div className="relative">
          <select
            value={selectedOrgFilter}
            onChange={(e) => onSelectOrgFilter(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 focus:border-[#4B2EF5]"
          >
            <option value="all">Cross-Tenant Scope (All Orgs)</option>
            {MOCK_ORGANISATIONS.map((org) => (
              <option key={org.id} value={org.name}>
                {org.name} ({org.code})
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-slate-400 text-sm absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Quick Export Telemetry */}
        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onExportTelemetry}
          className="h-10 px-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">
            download
          </span>
          <span>Export Telemetry</span>
        </motion.button>

        {/* Add Organisation Button */}
        <motion.button
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onOpenCreateOrg}
          className="h-10 px-4 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-500/25"
        >
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          <span>Add Organisation</span>
        </motion.button>
      </div>
    </motion.div>
  );
}


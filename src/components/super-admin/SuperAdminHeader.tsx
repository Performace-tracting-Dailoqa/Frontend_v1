"use client";

import React from "react";
import { motion } from "framer-motion";
import { SystemTelemetryData } from "@/services/adminService";

interface SuperAdminHeaderProps {
  displayName: string;
  roleName: string;
  scopeType: string;
  authProvider: string | null;
  telemetry: SystemTelemetryData | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

/** Short label for the sign-in provider shown on the identity line. */
function authLabel(provider: string | null): string {
  switch ((provider || "").toLowerCase()) {
    case "microsoft":
      return "Microsoft Entra ID";
    case "password":
      return "Password (Supabase Auth)";
    case "":
    case null:
    case undefined:
      return "Session cookie";
    default:
      return provider ?? "Unknown";
  }
}

export default function SuperAdminHeader({
  displayName,
  roleName,
  scopeType,
  authProvider,
  telemetry,
  isRefreshing,
  onRefresh,
}: SuperAdminHeaderProps) {
  const isOnline = telemetry?.database_connected ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 lg:p-7 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden"
    >
      <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-[#4B2EF5]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-xs uppercase tracking-wider flex-wrap">
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            <span>System Administration &amp; Governance</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {isOnline === null ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-slate-500 bg-slate-100">Checking backend…</span>
                </>
              ) : isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 bg-emerald-50">
                    Operational · {telemetry?.database_latency_ms ?? 0} ms
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-700 bg-rose-50">Database unreachable</span>
                </>
              )}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {displayName}
          </h1>

          <p className="text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Role:{" "}
              <span className="font-semibold text-slate-800">{roleName}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Scope: <span className="font-semibold text-slate-800">{scopeType}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Auth: <span className="font-semibold text-slate-800">{authLabel(authProvider)}</span>
            </span>
          </p>
        </div>

        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="self-start lg:self-auto h-10 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[16px] text-slate-500">refresh</span>
          )}
          <span>{isRefreshing ? "Refreshing" : "Refresh data"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

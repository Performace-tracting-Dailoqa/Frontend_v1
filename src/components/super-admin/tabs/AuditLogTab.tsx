"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_AUDIT_LOGS, MOCK_ORGANISATIONS } from "../mockData";
import { AuditLogRecord } from "../types";

export default function AuditLogTab() {
  const [logs] = useState<AuditLogRecord[]>(MOCK_AUDIT_LOGS);
  const [orgFilter, setOrgFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLogRecord | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesOrg = orgFilter === "all" || log.orgName.toLowerCase().includes(orgFilter.toLowerCase());
    const matchesSev = severityFilter === "all" || log.severity === severityFilter;
    const matchesSearch =
      log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);
    return matchesOrg && matchesSev && matchesSearch;
  });

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Hash,Timestamp,Org,Actor,Action,Severity,IP"]
        .concat(
          filteredLogs.map(
            (l) =>
              `"${l.hash}","${l.timestamp}","${l.orgName}","${l.actorName}","${l.actionTitle}","${l.severity}","${l.ipAddress}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pms_audit_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ROW 1: TELEMETRY SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Ledger Ingestion</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">4,921 Events</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Immutable append-only</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">receipt_long</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Hash Integrity</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">100% Intact</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">SHA-256 Merkle chain verified</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Simulations Logged</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">12 Sessions</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Superuser View As events</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">visibility</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Security Interceptions</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">4 Blocked</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Policy violations prevented</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">gpp_maybe</span>
          </span>
        </motion.div>
      </div>

      {/* ROW 2: CONTROLS & FILTER CLUSTER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by hash, action, actor, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Org Filter */}
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Organisations</option>
            {MOCK_ORGANISATIONS.map((org) => (
              <option key={org.id} value={org.name}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="h-10 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* ROW 3: AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Timestamp &amp; Hash</th>
                <th className="py-3.5 px-4 font-semibold">Organisation</th>
                <th className="py-3.5 px-4 font-semibold">Actor &amp; Impersonation</th>
                <th className="py-3.5 px-4 font-semibold">Action &amp; Target</th>
                <th className="py-3.5 px-4 font-semibold">Origin IP &amp; Node</th>
                <th className="py-3.5 px-4 text-right font-semibold">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    log.severity === "critical"
                      ? "bg-rose-50/20"
                      : log.severity === "warning"
                      ? "bg-amber-50/20"
                      : ""
                  }`}
                >
                  {/* Timestamp & Hash */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-mono text-slate-900 font-bold text-xs">
                      {log.timestamp}
                    </div>
                    <div className="text-[11px] text-slate-400">{log.relativeTime}</div>
                    <span className="font-mono text-[10px] text-primary font-semibold block mt-0.5">
                      {log.hash}
                    </span>
                  </td>

                  {/* Organisation */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary/10 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
                        {log.orgCode}
                      </span>
                      <span className="font-semibold text-slate-800">{log.orgName}</span>
                    </div>
                  </td>

                  {/* Actor */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-900">{log.actorName}</div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold uppercase inline-block mt-0.5">
                      {log.actorRole}
                    </span>
                    {log.impersonatedBy && (
                      <div className="text-[10px] text-primary font-medium mt-1">
                        Viewing as: {log.impersonatedBy}
                      </div>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-900">{log.actionTitle}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {log.actionDetails}
                    </div>
                  </td>

                  {/* Origin IP */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-mono text-[11px] text-slate-800 font-medium">
                      {log.ipAddress}
                    </div>
                    <div className="text-[10px] text-slate-400">{log.location}</div>
                  </td>

                  {/* Button */}
                  <td className="py-3.5 px-4 align-top text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLogForModal(log)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#4B2EF5] hover:text-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Diff &amp; Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIFF & PAYLOAD INSPECTOR MODAL WITH ANIMATE PRESENCE */}
      <AnimatePresence>
        {selectedLogForModal && (
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
                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Cryptographic Event Dossier
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      Hash {selectedLogForModal.hash}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLogForModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action:</span>
                    <span className="font-bold text-slate-800">{selectedLogForModal.actionTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Actor:</span>
                    <span className="font-semibold text-slate-800">{selectedLogForModal.actorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Organisation:</span>
                    <span className="font-semibold text-slate-800">{selectedLogForModal.orgName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client IP &amp; Node:</span>
                    <span className="font-mono text-slate-800">{selectedLogForModal.ipAddress}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    JSON Raw Payload
                  </label>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLogForModal.payloadJson, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLogForModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-black transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

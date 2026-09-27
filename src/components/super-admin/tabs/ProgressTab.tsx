"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MOCK_INCIDENTS } from "../mockData";

interface ProgressTabProps {
  onSimulate: (role: string, user: string, org: string) => void;
}

export default function ProgressTab({ onSimulate }: ProgressTabProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | "Learner" | "Teacher" | "HR">("all");

  const filteredIncidents = MOCK_INCIDENTS.filter(
    (inc) => roleFilter === "all" || inc.targetRole === roleFilter
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* HEADER & FILTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Cross-Role Progress &amp; Telemetry Oversight
          </h2>
          <p className="text-xs text-slate-500">
            Real-time evaluation velocities, milestones, and automated anomaly detection
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              roleFilter === "all"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Roles
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("Learner")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              roleFilter === "Learner"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Learners
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("Teacher")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              roleFilter === "Teacher"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Teachers / Evaluators
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("HR")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              roleFilter === "HR"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            HR Governance
          </button>
        </div>
      </div>

      {/* SUPERUSER INCIDENT SENTINEL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Superuser Incident Sentinel: Flagged for Review</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                inc.severity === "high"
                  ? "bg-rose-50/70 border-rose-200 text-rose-950"
                  : "bg-amber-50/70 border-amber-200 text-amber-950"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      inc.severity === "high"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {inc.severity} priority
                  </span>
                  <span className="font-semibold text-slate-600">{inc.targetRole}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold">{inc.issueTitle}</h3>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {inc.targetName} • <span className="font-normal text-slate-600">{inc.orgName}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {inc.issueDescription}
                </p>

                <div className="p-2.5 rounded-xl bg-white/70 border border-black/5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">{inc.metricLabel}:</span>
                    <span className={inc.severity === "high" ? "text-rose-600 font-bold" : "text-amber-700 font-bold"}>
                      {inc.metricValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Action: {inc.recommendedAction}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-black/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onSimulate(inc.targetRole, inc.targetName, inc.orgName)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Investigate (View As)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HISTOGRAM & CROSS-ORG FACULTY BENCHMARK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Distribution Histogram */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Progress Distribution Histogram (Learners)
            </h3>
            <span className="text-xs text-slate-400">Total: 480 Learners</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 font-medium mb-1">
                <span>Advanced / On Pace (76% - 100%)</span>
                <span className="font-bold text-slate-900">242 learners (50%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[50%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 font-medium mb-1">
                <span>Moderate Pace (51% - 75%)</span>
                <span className="font-bold text-slate-900">144 learners (30%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[30%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 font-medium mb-1">
                <span>Lagging Milestone (26% - 50%)</span>
                <span className="font-bold text-slate-900">68 learners (14%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[14%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 font-medium mb-1">
                <span>Critically At-Risk (&lt; 25%)</span>
                <span className="font-bold text-rose-600">26 learners (6%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full w-[6%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Org Comparative Faculty Analytics */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Cross-Org Comparative Faculty Analytics
            </h3>
            <span className="text-xs text-slate-400">Turnaround SLA</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-2 font-semibold">Faculty Cohort</th>
                  <th className="pb-2 font-semibold">Org</th>
                  <th className="pb-2 font-semibold">Avg SLA</th>
                  <th className="pb-2 font-semibold">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 font-semibold text-slate-900">Engineering Faculty</td>
                  <td className="py-2.5 text-slate-500">MiRai</td>
                  <td className="py-2.5">1.8 days</td>
                  <td className="py-2.5 text-emerald-600 font-bold">96% On-time</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold text-slate-900">Business Japanese Faculty</td>
                  <td className="py-2.5 text-slate-500">Global Tech</td>
                  <td className="py-2.5">2.4 days</td>
                  <td className="py-2.5 text-emerald-600 font-bold">92% On-time</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold text-slate-900">Curriculum Evaluators</td>
                  <td className="py-2.5 text-slate-500">Kyoto Digital</td>
                  <td className="py-2.5">4.2 days</td>
                  <td className="py-2.5 text-amber-600 font-bold">78% Lagging</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

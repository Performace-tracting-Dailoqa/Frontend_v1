"use client";

import React from "react";
import { motion } from "framer-motion";
import { MOCK_TEAMS_MEETINGS } from "../mockData";

export default function TeamsReportsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* 4 TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Sync Calls</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">142 Calls</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">+18% this month</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">video_camera_front</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Average Duration</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">42.5 Mins</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Optimal evaluation window</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">timer</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Cloud Recording</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">98.2%</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Stream compliance</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">cloud_done</span>
          </span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Live Panels</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">1 In Progress</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Global Tech Yokohama</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">sensors</span>
          </span>
        </motion.div>
      </div>

      {/* GANTT TIMELINE SCHEDULE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cross-Tenant Meeting Schedule &amp; Session Gantt
            </h3>
            <p className="text-xs text-slate-500">Live Microsoft Teams synchronization telemetry</p>
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Teams Sync Online
          </span>
        </div>

        {/* Visual Gantt Bar Track */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
          <div className="grid grid-cols-6 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 pb-2">
            <div>09:00 AM</div>
            <div>11:00 AM</div>
            <div>01:00 PM</div>
            <div>03:00 PM</div>
            <div>05:00 PM</div>
            <div>07:00 PM</div>
          </div>

          <div className="space-y-2 pt-1">
            {/* Track 1 */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-semibold text-slate-700 truncate">
                MiRai Tokyo
              </span>
              <div className="flex-1 bg-slate-200 h-6 rounded-lg relative overflow-hidden">
                <div className="absolute left-[10%] w-[25%] h-full bg-primary text-white text-[10px] font-bold flex items-center px-2 rounded truncate shadow-xs">
                  JLPT N2 Oral (Completed)
                </div>
              </div>
            </div>

            {/* Track 2 */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-semibold text-slate-700 truncate">
                Global Tech
              </span>
              <div className="flex-1 bg-slate-200 h-6 rounded-lg relative overflow-hidden">
                <div className="absolute left-[45%] w-[35%] h-full bg-amber-500 text-white text-[10px] font-bold flex items-center px-2 rounded truncate animate-pulse shadow-xs">
                  Weekly Sync (Live Now)
                </div>
              </div>
            </div>

            {/* Track 3 */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-semibold text-slate-700 truncate">
                Kyoto Digital
              </span>
              <div className="flex-1 bg-slate-200 h-6 rounded-lg relative overflow-hidden">
                <div className="absolute left-[70%] w-[20%] h-full bg-teal-600 text-white text-[10px] font-bold flex items-center px-2 rounded truncate shadow-xs">
                  Curriculum Review (Tomorrow)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MASTER MEETING ROSTER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Teams Meeting Master Roster</h3>
          <span className="text-xs text-slate-400 font-medium">Total 3 Sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Session Title</th>
                <th className="py-3 px-4 font-semibold">Organisation</th>
                <th className="py-3 px-4 font-semibold">Lead Evaluator</th>
                <th className="py-3 px-4 font-semibold">Participants</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Teams Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_TEAMS_MEETINGS.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{m.title}</td>
                  <td className="py-3.5 px-4 text-slate-700">{m.org}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{m.mentor}</td>
                  <td className="py-3.5 px-4">{m.participants} attendees</td>
                  <td className="py-3.5 px-4">{m.duration}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : m.status === "In Progress"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={m.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#505F76]/10 text-[#505F76] hover:bg-[#505F76] hover:text-white font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">videocam</span>
                      <span>Open Teams</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

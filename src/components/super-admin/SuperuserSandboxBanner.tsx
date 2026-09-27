import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SimulationState } from "./types";

interface SuperuserSandboxBannerProps {
  simulation: SimulationState;
  onActivateSimulation: (role: string, user: string, org: string) => void;
  onExitSimulation: () => void;
}

export default function SuperuserSandboxBanner({
  simulation,
  onActivateSimulation,
  onExitSimulation,
}: SuperuserSandboxBannerProps) {
  return (
    <div className="space-y-2">
      {/* Superuser Sandbox Master Pill Bar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full bg-slate-900 text-white rounded-2xl p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-3 border border-slate-800 overflow-hidden"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2.5 min-w-0 relative z-10">
          <motion.span
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#4B2EF5] text-white shrink-0 shadow-md shadow-primary/30"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </motion.span>
          <div className="flex flex-wrap items-center gap-x-2 text-xs">
            <span className="font-bold text-[#818cf8]">Superuser Sandbox Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 truncate">
              Full unredacted cross-tenant telemetry &amp; kernel override
            </span>
          </div>
        </div>

        {/* Quick 'View As' Impersonation Triggers */}
        <div className="flex items-center gap-2 flex-wrap text-xs relative z-10">
          <span className="text-slate-400 font-medium hidden sm:inline">
            Test Simulation:
          </span>
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() =>
              onActivateSimulation(
                "HR Manager",
                "Elena Rostova",
                "Global Tech Innovations & Academy"
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#4B2EF5] text-slate-200 hover:text-white font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">badge</span>
            <span>View as HR Manager</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() =>
              onActivateSimulation(
                "Teacher / Evaluator",
                "Prof. Arthur Vance",
                "MiRai Language Institute"
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#4B2EF5] text-slate-200 hover:text-white font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">school</span>
            <span>View as Teacher</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() =>
              onActivateSimulation(
                "Student / Scholar",
                "Kanishka Sharma",
                "MiRai Language Institute"
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#4B2EF5] text-slate-200 hover:text-white font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">person</span>
            <span>View as Student</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Active Impersonation Alert Banner (Simulated Mode) */}
      <AnimatePresence>
        {simulation.isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.96 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 rounded-2xl p-3 px-4 shadow-sm flex items-center justify-between gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <div className="flex flex-wrap items-center gap-x-2 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-100">
                  Viewing as {simulation.role}
                </span>
                <span className="text-amber-400">•</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {simulation.user} ({simulation.organisation})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold tracking-wide uppercase">
                  Read-Only Enforced
                </span>
                <span className="text-slate-500 dark:text-slate-400 hidden md:inline">
                  (Superuser session logged into audit hash {simulation.auditHash})
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onExitSimulation}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              Exit View As
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

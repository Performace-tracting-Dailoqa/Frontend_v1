"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SystemStatusPillProps {
  className?: string;
}

export default function SystemStatusPill({ className = "" }: SystemStatusPillProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest/70 hover:bg-surface-container-highest border border-outline-variant/60 backdrop-blur-md text-xs font-medium text-on-surface-variant hover:text-on-surface transition-all shadow-xs cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>Operational</span>
        <span className="text-[10px] text-outline font-mono hidden sm:inline">24ms</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/80 shadow-xl backdrop-blur-xl z-50 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40">
              <span className="font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
                System Health
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-medium">99.99%</span>
            </div>
            <div className="space-y-1.5 pt-2 text-[11px] text-on-surface-variant">
              <div className="flex justify-between">
                <span>Auth Cluster</span>
                <span className="text-emerald-600 font-medium">Healthy</span>
              </div>
              <div className="flex justify-between">
                <span>Database Sync</span>
                <span className="text-emerald-600 font-medium">Synchronized</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption</span>
                <span className="text-primary font-medium">AES-256 GCM</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

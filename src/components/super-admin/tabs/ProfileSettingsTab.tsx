"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileSettingsTabProps {
  displayName?: string;
}

export type ProfileSubTab =
  | "root-profile"
  | "hardware-auth"
  | "active-sessions"
  | "notifications"
  | "developer-keys";

export default function ProfileSettingsTab({ displayName = "Marcus Brody" }: ProfileSettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTab>("root-profile");

  const [fullName, setFullName] = useState(displayName);
  const [email, setEmail] = useState("admin@dailoqa.com");
  const [timezone, setTimezone] = useState("Asia/Tokyo (JST, UTC+9)");
  const [language, setLanguage] = useState("English (US) / Japanese (日本語)");
  const [pgpKey, setPgpKey] = useState("4A8F 90C1 22E0 BC45 77F8 D912");
  const [showToast, setShowToast] = useState(false);

  // Active Sessions State
  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "MacBook Pro 16\" (macOS Sequoia) - Chrome 129",
      ip: "153.120.45.18 (Tokyo, Japan)",
      status: "Current Session",
      isCurrent: true,
      lastActive: "Active now",
    },
    {
      id: "sess-2",
      device: "Admin Bastion Workstation - Firefox Enterprise",
      ip: "133.242.18.90 (Osaka Datacenter, Japan)",
      status: "Authenticated",
      isCurrent: false,
      lastActive: "14 mins ago",
    },
    {
      id: "sess-3",
      device: "SRE Emergency Terminal - Cloudflare Worker Edge",
      ip: "104.28.19.4 (Cloudflare Anycast)",
      status: "Authenticated",
      isCurrent: false,
      lastActive: "2 hours ago",
    },
  ]);

  // API Tokens State
  const [tokens, setTokens] = useState([
    {
      id: "tok-1",
      name: "SRE_AUTOMATION_PIPELINE",
      scopes: ["telemetry:read", "audit:write", "tenant:inspect"],
      created: "2026-08-15",
      expires: "2027-08-15",
      prefix: "dqa_live_9a7f...",
    },
    {
      id: "tok-2",
      name: "SUPABASE_MIGRATION_RUNNER",
      scopes: ["db:migrate", "users:sync"],
      created: "2026-09-01",
      expires: "2026-12-01",
      prefix: "dqa_live_33bc...",
    },
  ]);

  const [isGenerateTokenModalOpen, setIsGenerateTokenModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName) return;

    setTokens((prev) => [
      {
        id: `tok-${Date.now()}`,
        name: newTokenName.toUpperCase().replace(/\s+/g, "_"),
        scopes: ["tenant:read", "audit:read"],
        created: "2026-10-23",
        expires: "2027-10-23",
        prefix: `dqa_live_${Math.random().toString(36).substring(2, 6)}...`,
      },
      ...prev,
    ]);
    setIsGenerateTokenModalOpen(false);
    setNewTokenName("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* 1. TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
            <span>Changes synchronized across root registry.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PAGE HEADER CONTAINER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profile &amp; Account Settings</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              <span className="material-symbols-outlined text-xs">security</span>
              Root Authority · Tier-0 Hardware Key Enforced
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Superuser Sandbox Active
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-4xl">
            Manage your superuser credentials, master cryptographic session policies, hardware FIDO2 passkeys, system notifications, and multi-tenant operational preferences.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Discard Changes
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Save Changes</span>
          </motion.button>
        </div>
      </div>

      {/* 3. SEGMENTED SUBNAV TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto text-xs font-semibold scrollbar-none">
        {[
          { id: "root-profile", label: "Root Profile & Identity", icon: "badge" },
          { id: "hardware-auth", label: "Hardware & Authentication", icon: "passkey" },
          { id: "active-sessions", label: "Privileged Audit & Active Sessions", icon: "devices" },
          { id: "notifications", label: "Cross-Tenant Alerts & Pagers", icon: "notifications_active" },
          { id: "developer-keys", label: "Developer & API Tokens", icon: "terminal" },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as ProfileSubTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#4B2EF5] text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. SUBTAB CONTENT PANELS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: ROOT PROFILE */}
          {activeSubTab === "root-profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Bento Card: Avatar & Identity Badge */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center justify-between space-y-5">
                <div className="w-full flex flex-col items-center">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white text-2xl font-bold flex items-center justify-center shadow-md ring-4 ring-primary/20">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "MB"}
                    </div>
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-md">
                      <span className="material-symbols-outlined text-sm">shield</span>
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{fullName}</h2>
                  <p className="text-[11px] font-bold text-primary tracking-wider uppercase mt-0.5">
                    Chief Platform Architect
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Global Superuser &amp; Cryptographic Officer</p>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      <span className="material-symbols-outlined text-xs text-primary">verified_user</span>
                      Level-0 Root Authority
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold">
                      ID: 0x9AF012
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 w-full">
                    <button
                      type="button"
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Change Avatar
                    </button>
                    <button
                      type="button"
                      className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Telemetry Snapshot */}
                <div className="w-full pt-3 bg-slate-50 p-3 rounded-xl text-left border border-slate-200/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Root Credential Health</span>
                    <span className="text-emerald-600 font-bold">100% SECURE</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full w-full" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Audit Key Expiry</span>
                    <span className="font-semibold text-slate-700">280 Days Remaining</span>
                  </div>
                </div>
              </div>

              {/* Right: Form Configuration */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Primary System Profile</h3>
                      <p className="text-slate-500">Global attributes broadcast to audit telemetry and multi-tenant ledger logs.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold text-[10px]">
                      Tenant Scope: Global Master
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Platform Handle / Root UID</label>
                        <span className="text-[10px] font-mono text-slate-400">Immutable</span>
                      </div>
                      <input
                        type="text"
                        disabled
                        value="root.marcus.brody"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Root Notification Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">PGP Signing Key Fingerprint</label>
                      <input
                        type="text"
                        value={pgpKey}
                        onChange={(e) => setPgpKey(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">System Timezone</label>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Preferred Language Locales</label>
                      <input
                        type="text"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Update Identity Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE & AUTHENTICATION */}
          {activeSubTab === "hardware-auth" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900">FIDO2 Hardware Passkeys &amp; MFA Policies</h3>
                <p className="text-slate-500">Tier-0 root privilege requires registered cryptographic security keys.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-lg">passkey</span>
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">YubiKey 5C NFC (Primary Key)</div>
                      <p className="text-[11px] text-slate-500">Hardware ID: YUBI-5C-9021 • Enrolled 2026-03-12</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                    Active Primary
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-lg">key</span>
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">Titan Security Key (Backup Hardware)</div>
                      <p className="text-[11px] text-slate-500">Hardware ID: TITAN-USB-1104 • Enrolled 2026-05-18</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Deregister
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Enforce WebAuthn PIN requirement on every session elevation</span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-[#3d24c8] cursor-pointer"
                >
                  Register New Hardware Key
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVILEGED SESSIONS */}
          {activeSubTab === "active-sessions" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active Cryptographic Sessions</h3>
                  <p className="text-slate-500">Real-time JWT authorizations currently authenticated against root authority.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSessions((prev) => prev.filter((s) => s.isCurrent))}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer transition-colors"
                >
                  Revoke All Other Sessions
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {sessions.map((sess) => (
                  <div key={sess.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl text-slate-400">laptop_mac</span>
                      <div>
                        <div className="font-bold text-slate-900">{sess.device}</div>
                        <div className="text-[11px] text-slate-500">IP: {sess.ip} • {sess.lastActive}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sess.isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Current Session
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-[11px] transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CROSS-TENANT ALERTS */}
          {activeSubTab === "notifications" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Alert Routing &amp; Pager Integration</h3>
                <p className="text-slate-500">Direct notifications when multi-tenant thresholds or SLA limits are compromised.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">PagerDuty SRE Escalation Policy</div>
                    <p className="text-[11px] text-slate-500">Triggers on severity P0 &amp; P1 platform incidents (database latency &gt; 500ms)</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary accent-primary" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Slack Webhook Cross-Tenant Broadcast</div>
                    <p className="text-[11px] text-slate-500">Posts to #internal-ops on new tenant onboarding or evaluation cycle closure</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary accent-primary" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEVELOPER API TOKENS */}
          {activeSubTab === "developer-keys" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Developer &amp; Root API Keys</h3>
                  <p className="text-slate-500">Programmatic master tokens for automated CI/CD and telemetry ingestion.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGenerateTokenModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Generate Root Token</span>
                </button>
              </div>

              <div className="space-y-3">
                {tokens.map((tok) => (
                  <div key={tok.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{tok.name}</span>
                        <code className="bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-mono text-[10px]">
                          {tok.prefix}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {tok.scopes.map((sc, i) => (
                          <span key={i} className="text-[9px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                            {sc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTokens((prev) => prev.filter((t) => t.id !== tok.id))}
                      className="text-xs text-rose-600 font-semibold hover:underline"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* GENERATE TOKEN MODAL */}
      <AnimatePresence>
        {isGenerateTokenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGenerateTokenModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Generate Master API Token</h3>
                <button
                  type="button"
                  onClick={() => setIsGenerateTokenModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Token Identifier / Purpose</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SRE_GRAFANA_INGESTION"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                  This token will be granted cryptographic read access across all tenant telemetry streams.
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGenerateTokenModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white font-bold shadow-xs cursor-pointer"
                  >
                    Create Token
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

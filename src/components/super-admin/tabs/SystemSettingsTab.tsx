"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SystemSection = "general" | "security" | "sessions" | "mfa" | "sso";

export default function SystemSettingsTab() {
  const [activeSection, setActiveSection] = useState<SystemSection>("general");

  const [platformName, setPlatformName] = useState("Dailoqa PMS");
  const [defaultDomain, setDefaultDomain] = useState("app.dailoqa.com");
  const [minPasswordLength, setMinPasswordLength] = useState(12);
  const [requireSymbols, setRequireSymbols] = useState(true);
  const [idleTimeoutMins, setIdleTimeoutMins] = useState(60);
  const [enforceMfaAllAdmins, setEnforceMfaAllAdmins] = useState(true);
  const [entraSsoEnabled, setEntraSsoEnabled] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Platform Governance &amp; Global System Settings
          </h2>
          <p className="text-xs text-slate-500">
            Root configuration controlling multi-tenant security policies, session TTLs, and SSO
          </p>
        </div>

        <AnimatePresence>
          {showSavedToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Settings saved successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side Subnav */}
        <div className="space-y-1">
          {[
            { id: "general", label: "Platform Metadata", icon: "tune" },
            { id: "security", label: "Password Complexity", icon: "lock" },
            { id: "sessions", label: "Session Lifetimes", icon: "timer" },
            { id: "mfa", label: "MFA & Privileged Access", icon: "security" },
            { id: "sso", label: "SSO & Microsoft Entra", icon: "cloud_sync" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as SystemSection)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeSection === item.id
                  ? "bg-[#4B2EF5] text-white shadow-xs font-bold translate-x-1"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Form Container */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {/* SECTION 1: GENERAL */}
                {activeSection === "general" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Platform Metadata &amp; Core Defaults</h3>
                      <p className="text-slate-500">Root identifier shown across all tenant sub-domains</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Platform Brand Name</label>
                        <input
                          type="text"
                          value={platformName}
                          onChange={(e) => setPlatformName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Default Base FQDN</label>
                        <input
                          type="text"
                          value={defaultDomain}
                          onChange={(e) => setDefaultDomain(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-[11px]">
                      White-label branding is automatically injected for enterprise tenants with custom domain CNAME records.
                    </div>
                  </div>
                )}

                {/* SECTION 2: PASSWORD COMPLEXITY */}
                {activeSection === "security" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Credential &amp; Password Complexity</h3>
                      <p className="text-slate-500">Enforced by Supabase Auth and FastAPI password validator</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Minimum Characters</label>
                        <input
                          type="number"
                          min={8}
                          max={32}
                          value={minPasswordLength}
                          onChange={(e) => setMinPasswordLength(Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-5">
                        <input
                          type="checkbox"
                          id="symbolsCheck"
                          checked={requireSymbols}
                          onChange={(e) => setRequireSymbols(e.target.checked)}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                        />
                        <label htmlFor="symbolsCheck" className="font-semibold text-slate-700 cursor-pointer">
                          Require mixed case, numbers &amp; special symbols
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: SESSIONS */}
                {activeSection === "sessions" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Session Lifetimes &amp; Idle Invalidation</h3>
                      <p className="text-slate-500">Controls cookie lifetime and Redis JWT revocation intervals</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Idle Invalidation Timeout (Minutes)</label>
                      <input
                        type="number"
                        min={15}
                        max={480}
                        value={idleTimeoutMins}
                        onChange={(e) => setIdleTimeoutMins(Number(e.target.value))}
                        className="w-48 h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Users inactive for 60 minutes will be gracefully redirected to sign-in.
                      </p>
                    </div>
                  </div>
                )}

                {/* SECTION 4: MFA */}
                {activeSection === "mfa" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Multi-Factor Authentication &amp; Hardware Keys</h3>
                      <p className="text-slate-500">Zero-Trust policies across all privileged administrative roles</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">Enforce MFA on all Tenant Admins &amp; HR</div>
                          <p className="text-[11px] text-slate-500">Requires TOTP or WebAuthn hardware passkeys upon login</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={enforceMfaAllAdmins}
                          onChange={(e) => setEnforceMfaAllAdmins(e.target.checked)}
                          className="w-5 h-5 rounded text-primary accent-primary cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 5: SSO */}
                {activeSection === "sso" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Microsoft Entra ID &amp; SAML 2.0 Integration</h3>
                      <p className="text-slate-500">Direct federation with enterprise organizational directories</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">cloud_done</span>
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">Microsoft Entra Single Sign-On</div>
                          <p className="text-[11px] text-slate-500">Allows @mirai.ac.jp and @globaltech.io Microsoft 365 logins</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={entraSsoEnabled}
                        onChange={(e) => setEntraSsoEnabled(e.target.checked)}
                        className="w-5 h-5 rounded text-primary accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Platform Policies
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

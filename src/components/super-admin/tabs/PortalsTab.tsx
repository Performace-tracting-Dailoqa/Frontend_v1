"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBackendUser } from "@/services/adminService";

interface PortalsTabProps {
  onSimulate: (role: string, user: string, org: string) => void;
}

interface UserCandidate {
  id: string;
  name: string;
  role: "Student" | "Teacher" | "HR Manager";
  org: string;
  detail: string;
  badge: string;
  initials: string;
  avatarBg: string;
}

const CANDIDATE_USERS: UserCandidate[] = [
  {
    id: "ks-1",
    name: "Kanishka Sharma",
    role: "Student",
    org: "MiRai Language Institute",
    detail: "k.sharma@mirai.ac.jp · Cohort JLPT-N2 #04",
    badge: "On Track (98%)",
    initials: "KS",
    avatarBg: "bg-primary text-white",
  },
  {
    id: "pv-1",
    name: "Prof. Vance",
    role: "Teacher",
    org: "MiRai Language Institute",
    detail: "vance@mirai.ac.jp · Faculty Lead",
    badge: "Active",
    initials: "PV",
    avatarBg: "bg-[#505F76] text-white",
  },
  {
    id: "er-1",
    name: "Elena Rostova",
    role: "HR Manager",
    org: "MiRai Language Institute",
    detail: "rostova@mirai.ac.jp · People & Ops",
    badge: "Active Cycle",
    initials: "ER",
    avatarBg: "bg-slate-900 text-white",
  },
  {
    id: "ks-2",
    name: "Kenji Sato",
    role: "Student",
    org: "Kyoto Digital Campus",
    detail: "kenji@kyoto.edu · Cohort JLPT-N1 #01",
    badge: "On Track (91%)",
    initials: "KS",
    avatarBg: "bg-primary text-white",
  },
  {
    id: "dt-1",
    name: "Dr. Tanaka",
    role: "Teacher",
    org: "Global Tech Innovations",
    detail: "tanaka@globaltech.io · Software & Kanji Lead",
    badge: "Active",
    initials: "DT",
    avatarBg: "bg-[#505F76] text-white",
  },
  {
    id: "sv-1",
    name: "Samantha Vance",
    role: "HR Manager",
    org: "Global Tech Innovations",
    detail: "svance@globaltech.io · Operations",
    badge: "Audited",
    initials: "SV",
    avatarBg: "bg-slate-900 text-white",
  },
];

interface SessionAuditLog {
  id: string;
  actor: string;
  actorId: string;
  actorInitials: string;
  enteredAsName: string;
  enteredAsRole: string;
  enteredAsInitials: string;
  org: string;
  duration: string;
  actionsAllowed: boolean;
  sessionHash: string;
  timestamp: string;
}

const INITIAL_SESSIONS: SessionAuditLog[] = [
  {
    id: "log-1",
    actor: "Marcus Brody",
    actorId: "ID #SU-01",
    actorInitials: "MB",
    enteredAsName: "Kanishka Sharma",
    enteredAsRole: "Student",
    enteredAsInitials: "KS",
    org: "MiRai Language Inst.",
    duration: "14 mins",
    actionsAllowed: false,
    sessionHash: "Block #419,818",
    timestamp: "25 mins ago",
  },
  {
    id: "log-2",
    actor: "Marcus Brody",
    actorId: "ID #SU-01",
    actorInitials: "MB",
    enteredAsName: "Elena Rostova",
    enteredAsRole: "HR",
    enteredAsInitials: "ER",
    org: "MiRai Language Inst.",
    duration: "42 mins",
    actionsAllowed: true,
    sessionHash: "Block #419,795",
    timestamp: "2 hrs ago",
  },
  {
    id: "log-3",
    actor: "Elena Rostova",
    actorId: "Temp Scope #SU-04",
    actorInitials: "ER",
    enteredAsName: "Dr. Tanaka",
    enteredAsRole: "Teacher",
    enteredAsInitials: "DT",
    org: "Global Tech",
    duration: "8 mins",
    actionsAllowed: false,
    sessionHash: "Block #419,742",
    timestamp: "Yesterday",
  },
  {
    id: "log-4",
    actor: "Marcus Brody",
    actorId: "ID #SU-01",
    actorInitials: "MB",
    enteredAsName: "Liam Chen",
    enteredAsRole: "Student",
    enteredAsInitials: "LC",
    org: "Kyoto Digital",
    duration: "19 mins",
    actionsAllowed: false,
    sessionHash: "Block #419,701",
    timestamp: "2 days ago",
  },
];

export default function PortalsTab({ onSimulate }: PortalsTabProps) {
  // Global filter dropdown
  const [selectedFleetScope, setSelectedFleetScope] = useState("All Organisations (18 Active, 2 Suspended)");
  const [isFleetScopeOpen, setIsFleetScopeOpen] = useState(false);

  // Quarter Selector
  const [selectedQuarter, setSelectedQuarter] = useState("Q3 2026");
  const [isQuarterOpen, setIsQuarterOpen] = useState(false);

  // Audit Ledger Global Overview Modal
  const [isAuditLedgerOpen, setIsAuditLedgerOpen] = useState(false);

  // Dynamic Candidates & Sessions
  const [candidateUsers, setCandidateUsers] = useState<UserCandidate[]>(CANDIDATE_USERS);
  const [sessions, setSessions] = useState<SessionAuditLog[]>(INITIAL_SESSIONS);
  const [timeFilter, setTimeFilter] = useState<string>("Last 48 Hours");
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);

  // Configuration Console state
  const [targetOrg, setTargetOrg] = useState("MiRai Language Institute (HQ)");
  const [targetRole, setTargetRole] = useState<"Student" | "Teacher" | "HR Manager">("Student");
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCandidate>(CANDIDATE_USERS[2]); // Elena Rostova by default
  const [allowMutations, setAllowMutations] = useState(false);

  // Live Simulation Workbench state
  const [simMode, setSimMode] = useState<"Student" | "Teacher" | "HR">("HR");
  const [workbenchHighlighted, setWorkbenchHighlighted] = useState(false);

  // Interactive Live Metrics
  const [exceptionsCount, setExceptionsCount] = useState(3);
  const [cycleProgress, setCycleProgress] = useState(64);
  const [rosterCertified, setRosterCertified] = useState(true);
  const [gradeLockouts, setGradeLockouts] = useState(true);
  const [pendingEvaluations, setPendingEvaluations] = useState(18);
  const [evaluationsCount, setEvaluationsCount] = useState(142);
  const [kanjiCount, setKanjiCount] = useState(480);
  const [jlptProgress, setJlptProgress] = useState(78);

  // Provisioning Modal State
  const [provisionModalRole, setProvisionModalRole] = useState<"Student" | "Teacher" | "HR Manager" | null>(null);
  const [provName, setProvName] = useState("");
  const [provEmail, setProvEmail] = useState("");
  const [provDetail, setProvDetail] = useState("");
  const [provOrg, setProvOrg] = useState("MiRai Language Institute");

  // Selected audit inspection modal
  const [inspectSession, setInspectSession] = useState<SessionAuditLog | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  const filteredCandidates = candidateUsers.filter((c) => {
    // Org filter if specific org selected
    if (selectedFleetScope.includes("MiRai") && !c.org.includes("MiRai")) return false;
    if (selectedFleetScope.includes("Global Tech") && !c.org.includes("Global Tech")) return false;
    if (selectedFleetScope.includes("Kyoto") && !c.org.includes("Kyoto")) return false;

    if (searchUserQuery) {
      const q = searchUserQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.detail.toLowerCase().includes(q) ||
        c.org.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredSessions = sessions.filter((s) => {
    if (timeFilter === "Last 24 Hours") {
      return s.timestamp.includes("mins") || s.timestamp.includes("hrs") || s.timestamp.includes("Just now");
    }
    if (timeFilter === "Actions Permitted Only") {
      return s.actionsAllowed;
    }
    if (timeFilter === "Sandbox Only") {
      return !s.actionsAllowed;
    }
    return true; // Last 48 Hours & All Time shows current items
  });

  const handleLaunchSimulation = (user: UserCandidate) => {
    setSelectedUser(user);
    setTargetRole(user.role);
    setSimMode(user.role === "HR Manager" ? "HR" : user.role);
    onSimulate(user.role, user.name, user.org);
    showToast(`Entered portal as ${user.name} (${user.role}) - Simulation Active`);
  };

  const handleEnterPortal = () => {
    onSimulate(selectedUser.role, selectedUser.name, targetOrg);
    const newLog: SessionAuditLog = {
      id: `log-${Date.now()}`,
      actor: "Marcus Brody",
      actorId: "ID #SU-01",
      actorInitials: "MB",
      enteredAsName: selectedUser.name,
      enteredAsRole: selectedUser.role === "HR Manager" ? "HR" : selectedUser.role,
      enteredAsInitials: selectedUser.initials,
      org: targetOrg.replace(" (HQ)", ""),
      duration: "Active now",
      actionsAllowed: allowMutations,
      sessionHash: `Block #${Math.floor(419820 + Math.random() * 80)}`,
      timestamp: "Just now",
    };
    setSessions([newLog, ...sessions]);
    showToast(`View-As session launched for ${selectedUser.name} (${selectedUser.role})`);
  };

  const handlePreviewHighlight = () => {
    setSimMode(selectedUser.role === "HR Manager" ? "HR" : selectedUser.role);
    setWorkbenchHighlighted(true);
    setTimeout(() => setWorkbenchHighlighted(false), 900);
    showToast(`Live sandbox preview updated for ${selectedUser.name}`);
  };

  const handleExportLedger = () => {
    const csvHeader = "Actor,Actor ID,Entered As,Role,Organisation,Duration,Actions Allowed,Session Hash,Timestamp\n";
    const csvRows = sessions
      .map(
        (s) =>
          `"${s.actor}","${s.actorId}","${s.enteredAsName}","${s.enteredAsRole}","${s.org}","${s.duration}","${
            s.actionsAllowed ? "Actions Permitted" : "Read-Only Sandbox"
          }","${s.sessionHash}","${s.timestamp}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `impersonation_audit_ledger_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Audit ledger exported to CSV file successfully.");
  };

  const handleConfirmProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName || !provEmail) {
      showToast("Please provide a name and email.");
      return;
    }

    const initials = provName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const role = provisionModalRole || "Student";
    const newUser: UserCandidate = {
      id: `user-${Date.now()}`,
      name: provName,
      role: role,
      org: provOrg,
      detail: `${provEmail} · ${provDetail || "Newly Provisioned"}`,
      badge: "Provisioned (Active)",
      initials: initials || "NU",
      avatarBg: role === "Student" ? "bg-primary text-white" : role === "Teacher" ? "bg-[#505F76] text-white" : "bg-slate-900 text-white",
    };

    setCandidateUsers([newUser, ...candidateUsers]);
    setSelectedUser(newUser);
    setTargetRole(newUser.role);
    setSimMode(newUser.role === "HR Manager" ? "HR" : newUser.role);
    onSimulate(newUser.role, newUser.name, newUser.org);

    // Also record initial session
    const newLog: SessionAuditLog = {
      id: `log-${Date.now()}`,
      actor: "Marcus Brody",
      actorId: "ID #SU-01",
      actorInitials: "MB",
      enteredAsName: newUser.name,
      enteredAsRole: newUser.role === "HR Manager" ? "HR" : newUser.role,
      enteredAsInitials: newUser.initials,
      org: newUser.org,
      duration: "Active now",
      actionsAllowed: allowMutations,
      sessionHash: `Block #${Math.floor(419830 + Math.random() * 50)}`,
      timestamp: "Just now",
    };
    // Call backend API to provision real database record
    const backendRole = role === "Student" ? "Learner" : role;
    createBackendUser({
      name: provName.trim(),
      email: provEmail.trim().toLowerCase(),
      role: backendRole as "Learner" | "Teacher" | "HR Manager" | "Manager",
      department: provOrg || "General",
      specialization: provDetail || undefined,
    })
      .then(() => {
        showToast(`${role} ${newUser.name} provisioned in database & session launched!`);
      })
      .catch((err) => {
        console.warn("Backend user creation error:", err);
        showToast(`Provisioned in UI (${err instanceof Error ? err.message : "check server logs"})`);
      });

    setProvisionModalRole(null);
    setProvName("");
    setProvEmail("");
    setProvDetail("");
  };

  const handleRevokeSession = (logId: string) => {
    setSessions(sessions.filter((s) => s.id !== logId));
    setInspectSession(null);
    showToast("Cryptographic session revoked and token purged from active routing.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto relative"
    >
      {/* 1. TOP HEADER & OPERATIONAL GOVERNANCE SCOPE */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Superuser Console · Portals Hub
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
              Live Fleet Routing
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Open any portal as a specific user for tier-3 support, QA verification, or governance oversight.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Org Selector Filter */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsFleetScopeOpen(!isFleetScopeOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-xs font-medium shadow-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
              <span className="font-semibold">{selectedFleetScope}</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400">arrow_drop_down</span>
            </button>

            <AnimatePresence>
              {isFleetScopeOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-30 text-xs"
                >
                  <div className="px-3 py-1.5 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Scope Context
                  </div>
                  {[
                    { label: "All Organisations (18 Active, 2 Suspended)", count: "Fleetwide" },
                    { label: "MiRai Language Institute", count: "1,240 users" },
                    { label: "Global Tech Innovations", count: "880 users" },
                    { label: "Kyoto Digital Campus", count: "612 users" },
                  ].map((orgItem) => (
                    <button
                      key={orgItem.label}
                      type="button"
                      onClick={() => {
                        setSelectedFleetScope(orgItem.label);
                        setIsFleetScopeOpen(false);
                        showToast(`Scope shifted to: ${orgItem.label}`);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-slate-800">{orgItem.label}</span>
                      <span className="text-[11px] text-slate-400">{orgItem.count}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quarter Badge / Dropdown */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsQuarterOpen(!isQuarterOpen)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">date_range</span>
              <span>{selectedQuarter}</span>
              <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
            </button>

            <AnimatePresence>
              {isQuarterOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-200 p-1.5 z-30 text-xs"
                >
                  {["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setSelectedQuarter(q);
                        setIsQuarterOpen(false);
                        showToast(`Evaluation cycle switched to ${q}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedQuarter === q ? "bg-primary/10 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Link to Audit Ledger */}
          <button
            type="button"
            onClick={() => setIsAuditLedgerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
            <span>Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. ROW 1: THREE LARGE PORTAL CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Portal Card */}
        <motion.div
          whileHover={{ y: -3, scale: 1.008 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                99.98% uptime
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1.5">Student Portal</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Learner-facing interface for course progress, milestone tracking, Japanese language practice, and self-evaluations.
            </p>

            {/* Stats Pill */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-5 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">analytics</span>
              <div className="text-xs text-slate-700">
                <strong className="font-bold text-primary">12,480 Active Scholars</strong> across 24 tenants · 94.8% completion velocity
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setProvisionModalRole("Student")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <span>Add Student</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </motion.button>
            </div>

            {/* Quick-pick Pills */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[0])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Kanishka Sharma
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[3] || candidateUsers[0])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Kenji Sato
              </button>
              <button
                type="button"
                onClick={() => {
                  const amelia: UserCandidate = {
                    id: "ae-1",
                    name: "Amelia Earhart",
                    role: "Student",
                    org: "MiRai Language Institute",
                    detail: "amelia@mirai.ac.jp · Cohort JLPT-N3 #02",
                    badge: "On Track (95%)",
                    initials: "AE",
                    avatarBg: "bg-primary text-white",
                  };
                  handleLaunchSimulation(amelia);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Amelia E.
              </button>
            </div>
          </div>
        </motion.div>

        {/* Teacher Portal Card */}
        <motion.div
          whileHover={{ y: -3, scale: 1.008 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#D6E6FF] text-[#1E3A8A] flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  contact_page
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Synchronized
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1.5">Teacher Portal</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Faculty operations console for learner rosters, grading, attendance tracking, and micro-feedback submission.
            </p>

            {/* Stats Pill */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-5 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-slate-600 shrink-0 mt-0.5">groups</span>
              <div className="text-xs text-slate-700">
                <strong className="font-bold text-slate-900">1,840 Faculty Instructors</strong> · 142 Active Batches on pace
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setProvisionModalRole("Teacher")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2A3447] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <span>Add Teacher</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </motion.button>
            </div>

            {/* Quick-pick Pills */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[1])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Prof. Vance
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[4] || candidateUsers[1])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Dr. Tanaka
              </button>
              <button
                type="button"
                onClick={() => {
                  const sato: UserCandidate = {
                    id: "ksato-1",
                    name: "Prof. K. Sato",
                    role: "Teacher",
                    org: "Kyoto Digital Campus",
                    detail: "k.sato@kyoto.edu · Kanji Master",
                    badge: "Active",
                    initials: "KS",
                    avatarBg: "bg-[#505F76] text-white",
                  };
                  handleLaunchSimulation(sato);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Prof. K. Sato
              </button>
            </div>
          </div>
        </motion.div>

        {/* HR Portal Card */}
        <motion.div
          whileHover={{ y: -3, scale: 1.008 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1A1648] text-[#C4B5FD] flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  admin_panel_settings
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                Governed
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1.5">HR Portal</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Institutional oversight dashboard for evaluation cycles, weightage exception governance, batch assignments, and audit controls.
            </p>

            {/* Stats Pill */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-5 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-slate-600 shrink-0 mt-0.5">policy</span>
              <div className="text-xs text-slate-700">
                <strong className="font-bold text-slate-900">560 HR Managers</strong> · 38 Active Cycles · 14.2d avg cycle completion
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setProvisionModalRole("HR Manager")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2A3447] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <span>Add HR / Manager</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </motion.button>
            </div>

            {/* Quick-pick Pills */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[2])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Elena Rostova
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[5] || candidateUsers[2])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Samantha Vance
              </button>
              <button
                type="button"
                onClick={() => {
                  const brody: UserCandidate = {
                    id: "mb-audit",
                    name: "M. Brody (Audit)",
                    role: "HR Manager",
                    org: "MiRai Language Institute",
                    detail: "m.brody@superuser.corp · Root Audit",
                    badge: "Superuser Privileged",
                    initials: "MB",
                    avatarBg: "bg-slate-900 text-white",
                  };
                  handleLaunchSimulation(brody);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                M. Brody (Audit)
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. ROW 2 & 2b: IMPERSONATION CONFIGURATION & LIVE SIMULATION WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Configuration Console */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">tune</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configure View-As Session</h3>
                  <p className="text-xs text-slate-500">Set target tenant, user identity, and privilege boundary</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-[10px] font-bold uppercase tracking-wider">
                Protocol #SU-IMPERSONATE
              </span>
            </div>

            {/* Tenant & Role Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Organisation</label>
                <div className="relative">
                  <select
                    value={targetOrg}
                    onChange={(e) => {
                      setTargetOrg(e.target.value);
                      showToast(`Target organisation updated to ${e.target.value}`);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none pr-9 cursor-pointer"
                  >
                    <option value="MiRai Language Institute (HQ)">MiRai Language Institute (HQ)</option>
                    <option value="Global Tech Innovations">Global Tech Innovations</option>
                    <option value="Kyoto Digital Campus">Kyoto Digital Campus</option>
                    <option value="Osaka Vocational School">Osaka Vocational School</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-slate-400 pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Portal Role</label>
                <div className="relative">
                  <select
                    value={targetRole}
                    onChange={(e) => {
                      const newRole = e.target.value as "Student" | "Teacher" | "HR Manager";
                      setTargetRole(newRole);
                      setSimMode(newRole === "HR Manager" ? "HR" : newRole);
                      const matchingCandidate = candidateUsers.find((c) => c.role === newRole);
                      if (matchingCandidate) {
                        setSelectedUser(matchingCandidate);
                      }
                      showToast(`Role set to: ${newRole}`);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none pr-9 cursor-pointer"
                  >
                    <option value="Student">Student / Scholar Portal</option>
                    <option value="Teacher">Teacher / Faculty Portal</option>
                    <option value="HR Manager">HR / Executive Portal</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-slate-400 pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Searchable User Identity Picker Box */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Select User Identity</label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="relative mb-2">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* User list stack */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {filteredCandidates.map((user) => {
                  const isSelected = selectedUser.id === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSimMode(user.role === "HR Manager" ? "HR" : user.role);
                        showToast(`Selected persona: ${user.name} (${user.role})`);
                      }}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
                          : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full ${user.avatarBg} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                        >
                          {user.initials}
                        </div>
                        <div className="flex flex-col min-w-0 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{user.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 text-[10px] font-semibold">
                              {user.role}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 truncate">{user.detail}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {user.badge}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-[18px]">
                            check_circle
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Governance Toggle Switch */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">lock_reset</span>
                    <span className="text-xs font-bold text-slate-900">Allow actions in this session</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong className="font-semibold text-slate-800">SANDBOX MODE (Default):</strong> Actions are simulated or disabled. When enabled, mutations are permitted and every write operation will be cryptographically signed and logged to the Audit Ledger with both your Superuser identity (<span className="font-semibold text-primary">#SU-01 Marcus Brody</span>) and the impersonated user&apos;s identity.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={allowMutations}
                    onChange={(e) => {
                      setAllowMutations(e.target.checked);
                      showToast(
                        e.target.checked
                          ? "Caution: Active mutation mode enabled (Production Write)"
                          : "Sandbox mode restored: Safe read-only execution"
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-amber-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner" />
                </label>
              </div>

              {allowMutations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 pt-3 flex items-center gap-2 text-amber-800 text-[11px] bg-amber-500/15 p-2.5 rounded-lg border border-amber-300"
                >
                  <span className="material-symbols-outlined text-base text-amber-700">warning</span>
                  <span>Caution: Active mutations enabled. Any grading, cycle status, or course progress altered will persist in production.</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Selected: <strong className="font-bold text-slate-900">{selectedUser.name} ({selectedUser.role})</strong>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handlePreviewHighlight}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">play_circle</span>
                <span>Launch Sandbox Preview</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleEnterPortal}
                className="px-5 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">input</span>
                <span>Enter Portal</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Portal Simulation Workbench */}
        <motion.div
          animate={{
            borderColor: workbenchHighlighted ? "#4F46E5" : "rgba(226, 232, 240, 0.8)",
            boxShadow: workbenchHighlighted ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">preview</span>
                <h3 className="text-base font-bold text-slate-900">Live Portal Simulation</h3>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {(["Student", "Teacher", "HR"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSimMode(m);
                      showToast(`Workbench preview shifted to ${m} mode`);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      simMode === m
                        ? "bg-slate-900 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Preview Container Screen */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/70 shadow-inner space-y-3">
              {/* Top mini bar of simulated portal */}
              <div className="flex items-center justify-between pb-2 mb-1 bg-white px-3 py-2 rounded-lg border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {simMode === "HR" ? "shield_person" : simMode === "Teacher" ? "co_present" : "school"}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {simMode === "HR"
                      ? "Institutional Governance"
                      : simMode === "Teacher"
                      ? "Faculty Assessment Roster"
                      : "Scholar Learning Journey"}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px]">
                  Tenant: MiRai HQ
                </span>
              </div>

              {/* Dynamic Content based on Simulated Mode */}
              {simMode === "HR" && (
                <div className="space-y-3 text-xs">
                  {/* Progress Bar Card with Interactive Click */}
                  <div
                    onClick={() => {
                      setCycleProgress((p) => (p >= 100 ? 64 : p + 12));
                      showToast("Appraisal cycle timeline advanced");
                    }}
                    className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs cursor-pointer hover:border-primary/40 transition-colors"
                    title="Click to advance cycle progress"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold text-slate-500">Quarterly Appraisal Cycle ({selectedQuarter})</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        {cycleProgress >= 100 ? "Completed 100%" : "In Progress"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1.5">
                      <div
                        className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${cycleProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => {
                        setExceptionsCount((prev) => (prev > 0 ? 0 : 3));
                        showToast(exceptionsCount > 0 ? "Exceptions signed off by Superuser" : "Reset test exceptions to 3");
                      }}
                      className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
                      title="Click to resolve/toggle exceptions"
                    >
                      <div className="text-slate-400 text-[10px] font-semibold">Weightage Exceptions</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{exceptionsCount} Active</div>
                      <div className="text-amber-600 font-semibold text-[10px] mt-0.5">
                        {exceptionsCount > 0 ? "Needs Superuser OK (Click)" : "All Certified ✓"}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="text-slate-400 text-[10px] font-semibold">Total Headcount</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">1,240 Enrolled</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">Across 3 branches</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-slate-800 block">Policy Compliance Ledger</span>
                    <div
                      onClick={() => {
                        setRosterCertified(!rosterCertified);
                        showToast(`Faculty roster verification set to ${!rosterCertified ? 'Certified' : 'Pending'}`);
                      }}
                      className="flex items-center justify-between text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                    >
                      <span>Faculty Roster Verification</span>
                      <span className={`font-bold text-[11px] ${rosterCertified ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {rosterCertified ? "Certified 100%" : "Under Review"}
                      </span>
                    </div>
                    <div
                      onClick={() => {
                        setGradeLockouts(!gradeLockouts);
                        showToast(`Grade mutation lockouts ${!gradeLockouts ? 'Enforced' : 'Relaxed'}`);
                      }}
                      className="flex items-center justify-between text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                    >
                      <span>Grade Mutation Lockouts</span>
                      <span className={`font-semibold text-[11px] ${gradeLockouts ? 'text-slate-500' : 'text-amber-600 font-bold'}`}>
                        {gradeLockouts ? "Enforced" : "Override Active"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {simMode === "Teacher" && (
                <div className="space-y-3 text-xs">
                  <div
                    onClick={() => {
                      if (pendingEvaluations > 0) {
                        setPendingEvaluations((p) => p - 1);
                        setEvaluationsCount((c) => c + 1);
                        showToast("Scored batch rubric item (1 evaluation verified)");
                      } else {
                        setPendingEvaluations(18);
                        showToast("Queue reloaded with 18 evaluations");
                      }
                    }}
                    className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs cursor-pointer hover:border-teal-400 transition-colors"
                    title="Click to score an evaluation"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold text-slate-500">Batch Evaluation Queue</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                        {pendingEvaluations} Pending (Click to Score)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1.5">
                      <div className="bg-teal-600 h-2 rounded-full w-[82%]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="text-slate-400 text-[10px] font-semibold">Rubrics Scored</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{evaluationsCount} Evaluations</div>
                      <div className="text-emerald-600 font-semibold text-[10px] mt-0.5">On pace (+14%)</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="text-slate-400 text-[10px] font-semibold">Oral Fluency Track</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">JLPT N2 Alpha</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">32 Scholars active</div>
                    </div>
                  </div>
                </div>
              )}

              {simMode === "Student" && (
                <div className="space-y-3 text-xs">
                  <div
                    onClick={() => {
                      setJlptProgress((p) => (p >= 100 ? 78 : p + 4));
                      setKanjiCount((k) => (k >= 600 ? 480 : k + 8));
                      showToast("Flashcard drill completed: +8 Kanji mastered!");
                    }}
                    className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs cursor-pointer hover:border-primary/40 transition-colors"
                    title="Click to simulate learning drill"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold text-slate-500">JLPT N2 Mastery Track</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {jlptProgress}% Complete (Drill)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1.5">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${jlptProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="text-slate-400 text-[10px] font-semibold">Kanji Memorized</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{kanjiCount} / 600</div>
                      <div className="text-primary font-semibold text-[10px] mt-0.5">Quiz Mastery 96%</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="text-slate-400 text-[10px] font-semibold">Teacher Feedback</div>
                      <div className="text-sm font-bold text-emerald-600 mt-0.5">Grade A (Exemplary)</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">Prof. Vance Verified</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Launch Trigger from Preview */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/70 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">devices</span>
              <span className="font-semibold">Instant Switcher:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[0])}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-[#4B2EF5] hover:text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
              >
                Simulate Student View
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[1])}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
              >
                Simulate Teacher View
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSimulation(candidateUsers[2])}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
              >
                Simulate HR View
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. ROW 3: RECENT VIEW-AS SESSIONS AUDIT TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">history</span>
              <h3 className="text-base font-bold text-slate-900">Recent View-As Sessions</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable administrative log of all impersonation events across tenants
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Filter Dropdown */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium flex items-center gap-1 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>Filtered by: <strong className="text-slate-900">{timeFilter}</strong></span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
              </button>

              <AnimatePresence>
                {isTimeFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-200 p-1.5 z-30 text-xs"
                  >
                    {["Last 48 Hours", "Last 24 Hours", "Actions Permitted Only", "Sandbox Only"].map((filterOpt) => (
                      <button
                        key={filterOpt}
                        type="button"
                        onClick={() => {
                          setTimeFilter(filterOpt);
                          setIsTimeFilterOpen(false);
                          showToast(`Filter: ${filterOpt}`);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          timeFilter === filterOpt ? "bg-primary/10 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {filterOpt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export Ledger Button */}
            <button
              type="button"
              onClick={handleExportLedger}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-600 transition-colors cursor-pointer"
              title="Export Ledger to CSV"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <th className="py-3 px-4 rounded-l-xl">Superuser Actor</th>
                <th className="py-3 px-4">Entered As</th>
                <th className="py-3 px-4">Organisation</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Actions Allowed?</th>
                <th className="py-3 px-4">Session Hash</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Superuser Actor */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          sess.actorInitials === "ER" ? "bg-slate-800 text-white" : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {sess.actorInitials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{sess.actor}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sess.actorId}</div>
                      </div>
                    </div>
                  </td>

                  {/* Entered As */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white ${
                          sess.enteredAsRole === "Student"
                            ? "bg-[#4B2EF5]"
                            : sess.enteredAsRole === "HR"
                            ? "bg-slate-900"
                            : "bg-slate-500"
                        }`}
                      >
                        {sess.enteredAsInitials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs leading-tight">{sess.enteredAsName}</span>
                        <span
                          className={`text-[11px] font-semibold leading-tight ${
                            sess.enteredAsRole === "Student"
                              ? "text-primary"
                              : sess.enteredAsRole === "HR"
                              ? "text-slate-700"
                              : "text-slate-500"
                          }`}
                        >
                          ({sess.enteredAsRole})
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Organisation */}
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {sess.org}
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 text-slate-600">
                    {sess.duration}
                  </td>

                  {/* Actions Allowed? */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                        sess.actionsAllowed
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sess.actionsAllowed ? "bg-amber-500" : "bg-primary"}`} />
                      {sess.actionsAllowed ? "Actions Permitted" : "Read-Only Sandbox"}
                    </span>
                  </td>

                  {/* Session Hash */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {sess.sessionHash}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3.5 px-4 text-slate-500">
                    {sess.timestamp}
                  </td>

                  {/* Audit Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setInspectSession(sess)}
                      className="text-primary hover:text-indigo-800 font-bold text-xs transition-colors cursor-pointer hover:underline"
                    >
                      Inspect Ledger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. AUDIT INSPECTION MODAL */}
      <AnimatePresence>
        {inspectSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectSession(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4 text-xs z-10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-primary">
                      {inspectSession.sessionHash}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      SHA-256 Validated
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">Impersonation Cryptographic Proof</h3>
                  <p className="text-slate-500">Audited session between root superuser and tenant identity</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectSession(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Root Superuser</span>
                  <span className="font-bold text-slate-900">{inspectSession.actor} ({inspectSession.actorId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Impersonated Persona</span>
                  <span className="font-bold text-primary">{inspectSession.enteredAsName} ({inspectSession.enteredAsRole})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Organisation</span>
                  <span className="font-semibold text-slate-800">{inspectSession.org}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session Mode</span>
                  <span className="font-bold text-slate-900">{inspectSession.actionsAllowed ? "Actions Permitted (Signed)" : "Read-Only Sandbox"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration & Elapsed</span>
                  <span className="font-semibold text-slate-800">{inspectSession.duration} ({inspectSession.timestamp})</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 font-mono text-[10px] text-slate-500 break-all flex items-center justify-between">
                  <span>SHA256: 8f3c7e09b114d5e89a3f2010cfa09822a149bde7c104230198deacfb023e9812</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("8f3c7e09b114d5e89a3f2010cfa09822a149bde7c104230198deacfb023e9812");
                      setCopiedHash(true);
                      setTimeout(() => setCopiedHash(false), 2000);
                      showToast("Hash copied to clipboard");
                    }}
                    className="ml-2 text-primary font-bold hover:underline shrink-0"
                  >
                    {copiedHash ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleRevokeSession(inspectSession.id)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer text-xs"
                >
                  Revoke Session
                </button>
                <button
                  type="button"
                  onClick={() => setInspectSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PROVISIONING MODAL ("Add Student / Teacher / HR") */}
      <AnimatePresence>
        {provisionModalRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProvisionModalRole(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4 text-xs z-10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Provision New {provisionModalRole}</h3>
                  <p className="text-slate-500">Instantly create persona and enter simulated portal</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProvisionModalRole(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <form onSubmit={handleConfirmProvision} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenji Tanaka"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. k.tanaka@mirai.ac.jp"
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {provisionModalRole === "Student"
                      ? "Cohort & JLPT Level"
                      : provisionModalRole === "Teacher"
                      ? "Faculty Lead / Subject"
                      : "Department & Scope"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      provisionModalRole === "Student"
                        ? "e.g. Cohort JLPT-N2 #05"
                        : provisionModalRole === "Teacher"
                        ? "e.g. Oral Fluency Lead"
                        : "e.g. People & Operations"
                    }
                    value={provDetail}
                    onChange={(e) => setProvDetail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Organisation</label>
                  <select
                    value={provOrg}
                    onChange={(e) => setProvOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="MiRai Language Institute">MiRai Language Institute</option>
                    <option value="Global Tech Innovations">Global Tech Innovations</option>
                    <option value="Kyoto Digital Campus">Kyoto Digital Campus</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProvisionModalRole(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white font-bold cursor-pointer shadow-xs"
                  >
                    Provision & Launch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. AUDIT LEDGER OVERVIEW MODAL */}
      <AnimatePresence>
        {isAuditLedgerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuditLedgerOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4 text-xs z-10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform Audit Ledger</h3>
                  <p className="text-slate-500">Real-time immutable records of superuser view-as sessions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuditLedgerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-slate-500 text-[11px]">Total Events</div>
                  <div className="text-lg font-bold text-slate-900">{sessions.length + 124}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-slate-500 text-[11px]">Integrity</div>
                  <div className="text-lg font-bold text-emerald-600">100%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-slate-500 text-[11px]">Chain Status</div>
                  <div className="text-lg font-bold text-primary">Synced</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div>• All impersonation tokens require cryptographic dual-signing.</div>
                <div>• Read-only sandbox mode prevents unauthorized database mutations.</div>
                <div>• Root superuser Marcus Brody (#SU-01) actively holds governance scope.</div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAuditLedgerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. FLOATING INTERACTIVE TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs border border-slate-700"
          >
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Scroll Controls matching Screenshot */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            showToast("Scrolled to top");
          }}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 shadow-md text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          title="Scroll to Top"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
        </button>
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
            showToast("Scrolled to bottom");
          }}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 shadow-md text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          title="Scroll to Bottom"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
        </button>
      </div>
    </motion.div>
  );
}

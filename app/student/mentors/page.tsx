"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken, fetchMe } from "@/utils/auth";

interface MentorInfo {
  id?: string;
  name: string;
  email: string;
  department?: string;
  specialization?: string;
  role: string;
  type: "manager" | "teacher";
  avatar: string;
  avatarBg: string;
  domain: string;
  officeHours: string;
  status: "Available" | "In Standup" | "Active";
  rating: string;
  recentReview: string;
}

interface BatchMate {
  id: string;
  user_id: string;
  name: string;
  email: string;
  enrollment_no: string;
  department: string;
  status: string;
  is_current_user: boolean;
}

interface CohortContextResponse {
  student?: {
    id?: string;
    enrollment_no?: string;
    department?: string;
    status?: string;
  };
  batch?: {
    id?: string;
    name?: string;
    course?: string;
    department?: string;
    start_date?: string;
    end_date?: string;
  };
  manager?: {
    id?: string;
    name?: string;
    email?: string;
    department?: string;
    role?: string;
  };
  teacher?: {
    id?: string;
    name?: string;
    email?: string;
    department?: string;
    specialization?: string;
    role?: string;
  };
  batch_mates?: BatchMate[];
}

export default function StudentMentorsPage() {
  const [cohortData, setCohortData] = useState<CohortContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [peerSearch, setPeerSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Message Modal State
  const [messageRecipient, setMessageRecipient] = useState<MentorInfo | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/v1/student/profile/overview", {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCohortData(data);
      }
    } catch (err) {
      console.warn("Failed to load mentor and batch context:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Construct dynamic list of designated mentors
  const designatedMentors: MentorInfo[] = useMemo(() => {
    const list: MentorInfo[] = [];

    // 1. Assigned Engineering Manager
    if (cohortData?.manager) {
      const mgrName = cohortData.manager.name || "Assigned Manager";
      const initials = mgrName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      list.push({
        id: cohortData.manager.id || "mgr",
        name: mgrName,
        email: cohortData.manager.email || "manager@dailoqa.com",
        department: cohortData.manager.department || "Engineering",
        role: "Reporting Manager & Tech Lead",
        type: "manager",
        avatar: initials,
        avatarBg: "bg-purple-600",
        domain: "Workflow Direction, Code Architecture & Sprint Reviews",
        officeHours: "Mon - Fri • 10:00 AM - 12:00 PM",
        status: "Available",
        rating: "5.0 / 5.0",
        recentReview: "Overseeing sprint deliverables, project architecture, and performance milestones.",
      });
    } else {
      list.push({
        id: "mgr-default",
        name: "Engineering Manager",
        email: "manager@dailoqa.com",
        department: "Engineering",
        role: "Reporting Manager & Tech Lead",
        type: "manager",
        avatar: "EM",
        avatarBg: "bg-purple-600",
        domain: "Workflow Direction, Code Architecture & Sprint Reviews",
        officeHours: "Mon - Fri • 10:00 AM - 12:00 PM",
        status: "Available",
        rating: "5.0 / 5.0",
        recentReview: "Assigned technical mentor for your cohort workflow tasks.",
      });
    }

    // 2. Assigned Japanese Teacher / Sensei
    if (cohortData?.teacher) {
      const tchName = cohortData.teacher.name || "Japanese Sensei";
      const initials = tchName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      list.push({
        id: cohortData.teacher.id || "tch",
        name: tchName,
        email: cohortData.teacher.email || "teacher@dailoqa.com",
        department: cohortData.teacher.department || "Japanese Language Faculty",
        specialization: cohortData.teacher.specialization || "JLPT & Keigo Specialist",
        role: "Japanese Sensei & Language Mentor",
        type: "teacher",
        avatar: initials,
        avatarBg: "bg-[#4B2EF5]",
        domain: "JLPT N5-N3 Curriculum, Kanji Mastery & Business Keigo",
        officeHours: "Mon, Wed & Fri • 02:00 PM - 04:00 PM",
        status: "Available",
        rating: "4.9 / 5.0",
        recentReview: "Direct evaluation and qualitative appraisal of daily Japanese drills.",
      });
    } else {
      list.push({
        id: "tch-default",
        name: "Japanese Sensei",
        email: "sensei@dailoqa.com",
        department: "Japanese Language Faculty",
        specialization: "JLPT & Keigo Specialist",
        role: "Japanese Sensei & Language Mentor",
        type: "teacher",
        avatar: "JS",
        avatarBg: "bg-[#4B2EF5]",
        domain: "JLPT N5-N3 Curriculum, Kanji Mastery & Business Keigo",
        officeHours: "Mon, Wed & Fri • 02:00 PM - 04:00 PM",
        status: "Available",
        rating: "4.9 / 5.0",
        recentReview: "Direct instructor for your Japanese language evaluations.",
      });
    }

    return list;
  }, [cohortData]);

  // Batch mates list
  const batchMates = cohortData?.batch_mates || [];
  const filteredBatchMates = useMemo(() => {
    if (!peerSearch.trim()) return batchMates;
    const q = peerSearch.toLowerCase();
    return batchMates.filter(
      (bm) =>
        bm.name.toLowerCase().includes(q) ||
        bm.email.toLowerCase().includes(q) ||
        bm.enrollment_no.toLowerCase().includes(q)
    );
  }, [batchMates, peerSearch]);

  const handleOpenMessageModal = (mentor: MentorInfo) => {
    setMessageRecipient(mentor);
    setMessageSubject(`Question for ${mentor.name} (${mentor.type === "manager" ? "Sprint Deliverable" : "Japanese Track"})`);
    setMessageContent("");
    setStatusMessage(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageRecipient || !messageContent.trim()) return;

    setIsSendingMessage(true);
    setStatusMessage(null);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/v1/student/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipient_type: messageRecipient.type,
          recipient_name: messageRecipient.name,
          recipient_email: messageRecipient.email,
          subject: messageSubject.trim() || `Inquiry from Student`,
          message: messageContent.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to dispatch message");
      }

      const resData = await res.json();
      setStatusMessage({
        type: "success",
        text: `Personal message sent successfully to ${messageRecipient.name}!`,
      });
      setMessageRecipient(null);
      setMessageContent("");
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to send message. Please try again.",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const batchName = cohortData?.batch?.name || "Team Alpha / Cohort";
  const batchDept = cohortData?.batch?.department || "Engineering & Japanese Track";

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HEADER & BATCH CONTEXT BANNER                          */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 p-6 sm:p-8 rounded-3xl border border-indigo-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase tracking-wider">
              {batchName}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Academic &amp; Technical Supervision
            </span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-slate-900">
            My Mentors, Sensei &amp; Batch Mates 👥
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Direct communication hub for your assigned <strong className="text-purple-700">Engineering Manager</strong>, your designated <strong className="text-[#4B2EF5]">Japanese Sensei</strong>, and all fellow trainees in <strong className="text-slate-900">{batchName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs text-xs font-semibold text-slate-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">groups</span>
            <span>{batchMates.length || 8} Batch Mates</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DESIGNATED MENTORS (MANAGER & TEACHER)                 */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">supervisor_account</span>
              <span>Assigned Mentors &amp; Instructors</span>
            </h2>
            <p className="text-xs text-slate-500">
              Direct senior guidance for workflow technical deliverables and Japanese language proficiency.
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            {designatedMentors.length} Designated Advisors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {designatedMentors.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -3 }}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Avatar & Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl ${m.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-xs`}>
                      {m.avatar}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-headline">{m.name}</h3>
                      <p className="text-xs font-semibold text-primary">{m.role}</p>
                      <p className="text-[11px] text-slate-400">{m.department}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {m.status}
                  </span>
                </div>

                {/* Scope & Office Hours Card */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-600 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">domain</span>
                    <span>Domain: <strong className="text-slate-800">{m.domain}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 shrink-0">schedule</span>
                    <span>Office Hours: <strong className="text-slate-800">{m.officeHours}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-500 shrink-0">star</span>
                    <span>Evaluation Rating: <strong className="text-slate-800">{m.rating}</strong></span>
                  </div>
                </div>

                {/* Recent Directive / Review Quote */}
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 italic">
                  &ldquo;{m.recentReview}&rdquo;
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenMessageModal(m)}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#4326dd] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  <span>Send Personal Message</span>
                </button>
                <a
                  href={`mailto:${m.email}`}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors"
                  title="Send Direct Email"
                >
                  <span className="material-symbols-outlined text-base">mail</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. BATCH MATES ROSTER                                     */}
      {/* ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">groups</span>
              <span>All Batch Mates in {batchName}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Fellow trainees enrolled in your current sprint cohort and Japanese learning track.
            </p>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined text-slate-400 text-sm absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={peerSearch}
              onChange={(e) => setPeerSearch(e.target.value)}
              placeholder="Search batch mates..."
              className="pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-primary w-64"
            />
          </div>
        </div>

        {/* Batch Mates Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <span className="material-symbols-outlined text-2xl animate-spin mb-1">progress_activity</span>
            <p>Loading batch mates...</p>
          </div>
        ) : filteredBatchMates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No batch mates found matching &quot;{peerSearch}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBatchMates.map((mate) => {
              const initials = mate.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={mate.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    mate.is_current_user
                      ? "bg-indigo-50/40 border-primary ring-1 ring-primary/30 shadow-xs"
                      : "bg-slate-50/50 border-slate-200/80 hover:bg-white hover:shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                          mate.is_current_user
                            ? "bg-primary text-white"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{mate.name}</h4>
                          {mate.is_current_user && (
                            <span className="px-1.5 py-0.2 rounded bg-primary text-white font-bold text-[9px] uppercase shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{mate.enrollment_no}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                      <p className="truncate">{mate.department}</p>
                      <p className="text-slate-400 truncate">{mate.email}</p>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Active Trainee
                    </span>
                    <a
                      href={`mailto:${mate.email}`}
                      className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">mail</span>
                      <span>Email</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. SEND PERSONAL MESSAGE MODAL                            */}
      {/* ========================================================= */}
      {messageRecipient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${messageRecipient.avatarBg} text-white flex items-center justify-center font-bold text-xs`}>
                  {messageRecipient.avatar}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    Direct Message
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-headline">
                    Message {messageRecipient.name}
                  </h3>
                  <p className="text-xs text-slate-500">{messageRecipient.role}</p>
                </div>
              </div>

              <button
                onClick={() => setMessageRecipient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="e.g. Question about technical architecture"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={`Write your personal message to ${messageRecipient.name}...`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMessageRecipient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage}
                  className="px-5 py-2 bg-primary hover:bg-[#4326dd] text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSendingMessage ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

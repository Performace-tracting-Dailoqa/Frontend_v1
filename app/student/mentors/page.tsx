"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Mentor {
  id: string;
  name: string;
  role: string;
  domain: string;
  avatar: string;
  avatarBg: string;
  officeHours: string;
  status: "Available" | "In Meeting" | "Reviewing PRs";
  email: string;
  rating: string;
  recentReview: string;
}

const MENTORS: Mentor[] = [
  {
    id: "m1",
    name: "Dr. Tanaka",
    role: "Principal System Architect",
    domain: "Distributed Systems & Next.js Architecture",
    avatar: "DT",
    avatarBg: "bg-primary",
    officeHours: "Tue & Thu • 02:00 PM - 04:00 PM JST",
    status: "Available",
    email: "tanaka@dailoqa.com",
    rating: "4.9 / 5.0",
    recentReview: "Approved your Next.js token migration PR. Ready to review FastAPI endpoints.",
  },
  {
    id: "m2",
    name: "Yuki Sato",
    role: "Linguistic Director & Cultural Coach",
    domain: "Business Keigo & JLPT Preparation",
    avatar: "YS",
    avatarBg: "bg-purple-600",
    officeHours: "Mon & Wed • 10:00 AM - 12:00 PM JST",
    status: "Available",
    email: "yuki.sato@dailoqa.com",
    rating: "5.0 / 5.0",
    recentReview: "Great job on your technical vocabulary drill. Next up: client email etiquette.",
  },
];

const TEAMMATES = [
  {
    name: "Alex Rivera",
    role: "Backend Engineering Trainee",
    focus: "FastAPI & PostgreSQL ORM",
    avatar: "AR",
    status: "Active Now",
  },
  {
    name: "Sarah Miller",
    role: "Cloud Infrastructure Associate",
    focus: "Docker & GitHub Actions CI",
    avatar: "SM",
    status: "Active Now",
  },
  {
    name: "Kenji Sato",
    role: "Fullstack Engineering Intern",
    focus: "Vitest & Playwright E2E",
    avatar: "KS",
    status: "In Standup",
  },
  {
    name: "Emily Chen",
    role: "UI/UX & Product Design Trainee",
    focus: "Figma Tokens & Accessibility",
    avatar: "EC",
    status: "Active Now",
  },
];

export default function StudentMentorsPage() {
  const [meetingRequested, setMeetingRequested] = useState<string | null>(null);

  const handleRequestMeeting = (name: string) => {
    setMeetingRequested(name);
    setTimeout(() => {
      setMeetingRequested(null);
      alert(`1:1 Sync request dispatched to ${name}. Meeting invitation sent to your calendar.`);
    }, 400);
  };

  return (
    <div className="space-y-space-lg">
      
      {/* ========================================================= */}
      {/* BANNER                                                    */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md bg-surface-container-low p-6 sm:p-space-xl rounded-3xl border border-surface-container-highest/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed text-label-sm font-bold rounded-lg uppercase tracking-wider">
              Mentorship Network
            </span>
            <span className="text-body-sm text-on-surface-variant font-medium">Sprint 6 Collaboration</span>
          </div>
          <h1 className="font-headline font-bold text-headline-lg text-on-surface">
            My Mentors &amp; Project Team 👥
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl leading-relaxed mt-1">
            Connect with your designated academic supervisors, request 1:1 architecture reviews, and sync with your cohort peers.
          </p>
        </div>

        <a
          href="https://teams.microsoft.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-label-md font-semibold transition-all shadow-sm self-start md:self-auto shrink-0"
        >
          <span className="material-symbols-outlined text-lg">video_call</span>
          <span>Open Cohort Teams Channel</span>
        </a>
      </div>

      {/* ========================================================= */}
      {/* ASSIGNED MENTORS GRID                                     */}
      {/* ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-headline font-bold text-headline-sm text-on-surface">
              Assigned Mentors &amp; Advisors
            </h2>
            <p className="text-body-sm text-on-surface-variant">Direct senior guidance for technical architecture and linguistic mastery</p>
          </div>
          <span className="text-xs font-mono font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full">
            2 Assigned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md sm:gap-space-lg">
          {MENTORS.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${m.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-sm`}>
                      {m.avatar}
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-bold text-slate-900">{m.name}</h3>
                      <p className="text-body-sm text-primary font-medium">{m.role}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {m.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">domain</span>
                    <span>Domain: <strong className="text-slate-900">{m.domain}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                    <span>Office Hours: <strong className="text-slate-900">{m.officeHours}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-500">star</span>
                    <span>Student Rating: <strong className="text-slate-900">{m.rating}</strong></span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 italic mb-4">
                  &ldquo;{m.recentReview}&rdquo;
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200/70">
                <button
                  onClick={() => handleRequestMeeting(m.name)}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#4326dd] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">calendar_add_on</span>
                  <span>Book 1:1 Review</span>
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
      {/* COHORT TEAMMATES                                         */}
      {/* ========================================================= */}
      <div className="bg-surface-container-low p-6 sm:p-space-lg rounded-2xl border border-surface-container-highest/60 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-headline font-bold text-headline-sm text-on-surface">
              Cohort Peers &amp; Teammates
            </h2>
            <p className="text-body-sm text-on-surface-variant">Trainees in your active sprint working group</p>
          </div>
          <span className="text-xs font-mono font-bold text-on-surface-variant">
            Sprint Group 4
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAMMATES.map((member) => (
            <div
              key={member.name}
              className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest/80 flex flex-col justify-between shadow-2xs hover:translate-y-[-2px] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest text-primary font-bold flex items-center justify-center text-sm shadow-2xs">
                  {member.avatar}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-body-md font-bold text-on-surface truncate">{member.name}</h4>
                  <span className="text-xs text-on-surface-variant truncate block">{member.role}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-medium">
                <span className="truncate">{member.focus}</span>
                <span className="text-emerald-700 font-bold shrink-0">● {member.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

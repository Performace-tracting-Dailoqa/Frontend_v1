"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Magnet from "@/components/animations/Magnet";

interface StudentHeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
  title?: string;
}

export default function StudentHeader({
  onToggleSidebar,
  isCollapsed = false,
  isDark = false,
  onToggleTheme,
  title = "PMS Student Portal",
}: StudentHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = [
    { id: 1, title: "Mentor Feedback Received", time: "10 mins ago", unread: true, icon: "rate_review" },
    { id: 2, title: "Self-Evaluation Due in 4 days", time: "2 hours ago", unread: true, icon: "assignment" },
    { id: 3, title: "Japanese N4 Kanji Quiz Cleared (95%)", time: "Yesterday", unread: false, icon: "verified" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 ${
        isCollapsed ? "lg:left-20" : "lg:left-72"
      } right-0 h-20 backdrop-blur-xl z-40 flex items-center justify-between px-space-md sm:px-space-xl border-b transition-all duration-300 ${
        isDark
          ? "bg-[#0b0b14]/85 border-white/10 shadow-lg shadow-black/20"
          : "bg-white border-slate-200/80 shadow-xs"
      }`}
    >
      {/* Left Area: Mobile Menu Toggle & Brand / Title */}
      <div className="flex items-center gap-space-md">
        <Magnet padding={20} magnetStrength={3}>
          <button
            onClick={onToggleSidebar}
            className="material-symbols-outlined text-slate-500 hover:text-slate-900 cursor-pointer p-2 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center"
            aria-label="Toggle Sidebar"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "menu_open" : "menu"}
          </button>
        </Magnet>

        <div className="flex items-center gap-space-sm">
          <span className="hidden sm:inline-block font-headline font-bold text-headline-sm text-slate-900">
            {title}
          </span>
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider hidden md:inline-block">
            Trainee View
          </div>
        </div>
      </div>

      {/* Right Area: Search, Term Tag, Calendar, Theme Switcher & Notifications */}
      <div className="flex items-center gap-space-sm sm:gap-space-md">
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center bg-slate-50/90 border border-slate-200/90 px-3.5 py-1.5 rounded-xl gap-2 focus-within:border-primary focus-within:bg-white transition-all w-52 lg:w-72 shadow-2xs">
          <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-full"
            placeholder="Search goals, tasks, kanji..."
            type="text"
          />
        </div>

        {/* Current Quarter Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-xs text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          <span className="material-symbols-outlined text-sm text-indigo-600">calendar_month</span>
          <span>Q3 2026</span>
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-lg">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border p-4 z-50 transition-all ${
                isDark
                  ? "bg-[#11111f] border-white/15 text-slate-100"
                  : "bg-surface-container-lowest border-surface-container-highest text-on-surface"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest/60 mb-3">
                <span className="text-label-md font-bold text-on-surface">Notifications</span>
                <span className="text-body-sm text-primary font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-3 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">
                      {n.icon}
                    </span>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-body-sm font-semibold text-on-surface truncate">{n.title}</p>
                      <span className="text-[11px] text-on-surface-variant">{n.time}</span>
                    </div>
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />}
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-surface-container-highest/60">
                <Link
                  href="/student/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center text-xs font-semibold text-primary hover:underline py-1"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Mini Profile Avatar */}
        <Link href="/student/dashboard" className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-xs">
            KS
          </div>
        </Link>
      </div>
    </header>
  );
}

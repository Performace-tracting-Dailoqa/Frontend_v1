"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const pathname = usePathname();
  const isTeacherView = pathname === "/dashboard";
  const isStudentView = pathname === "/student-dashboard";

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/40 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 lg:gap-6 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search learners, metrics, cohorts, rubrics..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/50 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface transition-all text-xs lg:text-sm"
          />
        </div>
      </div>

      {/* Right: View Switcher & Quick Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Direct Authentication quick link */}
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/40 transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-primary">lock</span>
          <span>Auth Flows</span>
        </Link>

        {/* User Profile Pill & Sign Out */}
        <Link
          href="/login"
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-container transition-colors"
          title="Click to sign out / return to login"
        >
          <div className="w-8 h-8 rounded-full bg-[#4B2EF5] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            RS
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-body-sm font-semibold text-on-surface leading-tight">
              Dr. Rajesh
            </p>
            <p className="text-[10px] text-outline leading-tight">Sign Out</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

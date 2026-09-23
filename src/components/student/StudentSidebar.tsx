"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession } from "@/utils/auth";
import FlowingMenu, { FlowingMenuItem } from "@/components/animations/FlowingMenu";

interface StudentSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isDark?: boolean;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  { name: "My Mentors", href: "/student/mentors", icon: "group" },
  { name: "Learning Progress", href: "/student/learning-progress", icon: "trending_up" },
  { name: "Evaluations", href: "/student/evaluations", icon: "assignment" },
  { name: "Feedback", href: "/student/feedback", icon: "rate_review" },
  { name: "Reports", href: "/student/reports", icon: "bar_chart" },
  { name: "Notifications", href: "/student/notifications", icon: "notifications" },
];

export default function StudentSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  isDark = false,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    clearAuthSession();
    router.push("/login?logout=true");
  };

  const flowingItems: FlowingMenuItem[] = [
    ...NAV_ITEMS.map((item) => ({
      text: item.name,
      link: item.href,
      icon: item.icon,
      isActive:
        pathname === item.href ||
        (item.href !== "/student/dashboard" && pathname.startsWith(item.href.split("#")[0])),
    })),
    {
      text: "Teams Sync",
      link: "https://teams.microsoft.com",
      icon: "video_call",
      isActive: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col pt-5 pb-space-lg transition-all duration-300 border-r shadow-xs ${
          isCollapsed ? "w-72 lg:w-20" : "w-72"
        } ${
          isDark
            ? "bg-[#0b0b14] border-white/10 text-slate-100"
            : "bg-white border-slate-200/80 text-on-surface"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className={`px-4 mb-4 flex items-center ${isCollapsed ? "lg:justify-center lg:flex-col lg:gap-3" : "justify-between"}`}>
          <Link
            href="/student/dashboard"
            className={`flex items-center gap-2.5 overflow-hidden group ${isCollapsed ? "lg:justify-center" : ""}`}
            title="Dailoqa Student Portal"
          >
            <span className="material-symbols-outlined text-primary text-3xl shrink-0 transition-transform group-hover:scale-110">
              bolt
            </span>
            {/* Show logo when not collapsed or on mobile */}
            <div className={`${isCollapsed ? "lg:hidden" : "block"}`}>
              <Image
                alt="Dailoqa"
                src={isDark ? "/dailoqa-logo-white.png" : "/dailoqa_logo.png"}
                width={110}
                height={30}
                className="h-7 w-auto object-contain m-0 p-0"
                priority
              />
            </div>
          </Link>



          {/* Mobile Close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* PMS Sub-tag label */}
        <div className={`pt-4 pb-2 ${isCollapsed ? "lg:hidden px-6" : "px-6"}`}>
          <span className="text-[11px] font-bold text-primary tracking-wider uppercase">
            PMS Student Portal
          </span>
        </div>

        {/* Navigation Links with React Bits FlowingMenu */}
        <div className="flex-1 overflow-y-auto">
          <FlowingMenu
            items={flowingItems}
            isCollapsed={isCollapsed}
            onItemClick={onClose}
            isDark={isDark}
            speed={12}
            marqueeBgColor="#4B2EF5"
            marqueeTextColor="#ffffff"
          />
        </div>

        {/* Student Profile Footer */}
        <div className={`mt-auto pt-3 border-t border-slate-200/80 dark:border-white/10 ${isCollapsed ? "lg:px-2 px-4" : "px-4"}`}>
          {isCollapsed ? (
            <div className="hidden lg:flex flex-col items-center gap-2.5 py-1">
              <div
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs"
                title="Kanishka Sharma • Active Trainee"
              >
                KS
              </div>
              <button
                onClick={handleSignOut}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          ) : null}

          {/* Full Profile view (when expanded or on mobile) */}
          <div className={`${isCollapsed ? "lg:hidden" : "flex"} items-center justify-between gap-2`}>
            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                KS
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Kanishka Sharma
                </h4>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Trainee
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

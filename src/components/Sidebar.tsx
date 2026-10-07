"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAuthSession, apiLogout, UserSession } from "@/utils/auth";
import { SUPER_ADMIN_TABS } from "@/components/super-admin/types";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
}

function getRoleNavSections(roleName?: string | null): { title?: string; items: NavItem[] }[] {
  const norm = (roleName || "").trim().toLowerCase();

  // 1. Student / Employee
  if (norm.includes("student") || norm.includes("employee")) {
    return [
      {
        title: "Student Operations",
        items: [
          { label: "My Performance", href: "/student/dashboard", icon: "trending_up" },
          { label: "Learning Progress", href: "/student/learning-progress", icon: "school" },
          { label: "Feedback", href: "/student/feedback", icon: "forum" },
          { label: "Reports", href: "/student/reports", icon: "summarize" },
          { label: "Mentors", href: "/student/mentors", icon: "groups" },
        ],
      },
    ];
  }

  // 2. Teacher / Mentor
  if (norm.includes("teacher") || norm.includes("mentor")) {
    return [
      {
        title: "Teacher Operations",
        items: [
          { label: "Dashboard", href: "/dashboard/teacher", icon: "dashboard" },
          { label: "My Learners", href: "/dashboard/teacher?tab=learners", icon: "groups" },
          { label: "Learning Progress", href: "/dashboard/teacher?tab=progress", icon: "analytics" },
          { label: "Japanese Tracks", href: "/dashboard/teacher?tab=japanese", icon: "translate" },
          { label: "Feedback", href: "/dashboard/teacher?tab=feedback", icon: "forum" },
          { label: "Evaluations", href: "/dashboard/teacher?tab=evaluations", icon: "assignment" },
          { label: "Reports", href: "/dashboard/teacher?tab=reports", icon: "summarize" },
          { label: "History", href: "/dashboard/teacher?tab=history", icon: "history" },
        ],
      },
    ];
  }

  // 3. Manager
  if (norm.includes("manager")) {
    return [
      {
        title: "Manager Operations",
        items: [
          { label: "Dashboard", href: "/dashboard/manager", icon: "dashboard" },
          { label: "My Team", href: "/dashboard/manager?tab=team", icon: "group" },
          { label: "Workflows", href: "/dashboard/manager?tab=workflows", icon: "schema" },
          { label: "Progress", href: "/dashboard/manager?tab=progress", icon: "monitoring" },
          { label: "Evaluations", href: "/dashboard/manager?tab=evaluations", icon: "assignment_turned_in" },
          { label: "Feedback", href: "/dashboard/manager?tab=feedback", icon: "reviews" },
          { label: "Reports", href: "/dashboard/manager?tab=reports", icon: "insights" },
          { label: "History", href: "/dashboard/manager?tab=history", icon: "history" },
        ],
      },
    ];
  }

  // 4. HR
  if (norm.includes("hr")) {
    return [
      {
        title: "HR Operations",
        items: [
          { label: "Employees", href: "/dashboard/hr", icon: "badge" },
          { label: "Performance Cycles", href: "/dashboard/hr?tab=cycles", icon: "calendar_month" },
          { label: "Evaluation Monitoring", href: "/dashboard/hr?tab=evaluations", icon: "rule" },
          { label: "Analytics", href: "/dashboard/hr?tab=analytics", icon: "equalizer" },
          { label: "Reports", href: "/dashboard/hr?tab=reports", icon: "description" },
          { label: "Notifications", href: "/dashboard/hr?tab=notifications", icon: "notifications" },
        ],
      },
    ];
  }

  // 5. Super Admin
  if (norm.includes("admin")) {
    return [
      {
        title: "System Administration",
        // Derived from the dashboard's own tab list, so the sidebar can never
        // point at a page that no longer exists. Overview deliberately keeps a
        // query-less href — that is what makes it the default route, and it is
        // what the active-state check in the component keys on.
        items: SUPER_ADMIN_TABS.map((tab) => ({
          label: tab.label,
          href:
            tab.key === "overview"
              ? "/dashboard/super-admin"
              : `/dashboard/super-admin?tab=${tab.key}`,
          icon: tab.icon,
        })),
      },
    ];
  }

  // Default fallback
  return [
    {
      title: "Navigation",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      ],
    },
  ];
}

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setSession(getAuthSession());
    });
  }, []);

  const handleSignOut = async () => {
    await apiLogout();
    router.push("/login?logout=true");
  };

  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U";
  const roleName = session?.user?.role?.name || "Member";
  const departmentOrEmail = session?.user?.profile?.department || session?.user?.email || "Dailoqa PMS";
  const subtitle = departmentOrEmail;

  const navSections = getRoleNavSections(session?.user?.role?.name);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        // Fixed at every breakpoint, not just mobile. The previous `lg:static`
        // put the aside back into normal flow, so as a stretched flex item it
        // grew to the full page height and scrolled away with the content.
        // `lg:static` was also the reason this diverged from StudentSidebar,
        // which pins itself and lets the layout reserve the width instead.
        // The width the layout reserves is in DashboardLayout; the two must
        // agree (w-72 expanded, lg:w-20 collapsed).
        className={`fixed top-0 bottom-0 left-0 z-50 ${
          isCollapsed ? "w-72 lg:w-20" : "w-72"
        } bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header / Branding */}
        <div className={`p-4 pb-3 flex items-center ${isCollapsed ? "lg:justify-center lg:flex-col lg:gap-2" : "justify-between"} border-b border-slate-200/80`}>
          <Link href="/" onClick={(e) => { e.preventDefault(); router.push("/"); }} className="flex items-center gap-2.5 cursor-pointer z-10">
            <Image
              alt="Dailoqa"
              src="/dailoqa_logo.png"
              width={100}
              height={26}
              className="h-6 w-auto object-contain m-0 p-0"
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-headline font-bold text-on-surface text-base tracking-tight leading-none">
                  Dailoqa
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  PMS Platform
                </span>
              </div>
            )}
          </Link>



          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg"
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Current Active Role Badge */}
        {!isCollapsed && (
          <div className="px-4 pt-3">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#4B2EF5] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-on-surface truncate">
                    {displayName}
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                    {roleName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  {departmentOrEmail}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? "px-2" : "px-3.5"} py-3 space-y-4`}>
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && !isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const [itemPath, itemQuery] = item.href.split("?");
                const isExactPath = pathname === itemPath;
                let isActive = false;
                if (itemQuery) {
                  const itemTab = new URLSearchParams(itemQuery).get("tab");
                  const currentTab = searchParams.get("tab");
                  isActive = isExactPath && itemTab === currentTab;
                } else {
                  const currentTab = searchParams.get("tab");
                  isActive =
                    isExactPath &&
                    (!currentTab ||
                      currentTab === "overview" ||
                      currentTab === "dashboard" ||
                      currentTab === "employees");
                }
                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center ${
                        isCollapsed ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2" : "justify-between px-3 py-2"
                      } rounded-xl text-sm transition-all ${
                        isActive
                          ? "bg-[#4B2EF5] text-white font-medium shadow-xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? "lg:justify-center" : "gap-2.5"}`}>
                        <span
                          className={`material-symbols-outlined text-xl ${
                            isActive ? "text-white" : "text-slate-500 group-hover:text-primary"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[#e2dfff] text-[#3525cd]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {/* Tooltip on collapsed */}
                    {isCollapsed && (
                      <div className="hidden lg:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap pointer-events-none items-center gap-1.5">
                        <span>{item.label}</span>
                        <span className="w-1.5 h-1.5 bg-slate-900 rotate-45 absolute -left-0.5 top-1/2 -translate-y-1/2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User Bar & Sign Out */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center ${isCollapsed ? "lg:justify-center" : "justify-center gap-2"} px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold cursor-pointer`}
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}


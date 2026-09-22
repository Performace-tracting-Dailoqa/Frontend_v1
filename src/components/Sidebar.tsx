"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getAuthSession, apiLogout, UserSession } from "@/utils/auth";

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
          { label: "My Performance", href: "/dashboard/student", icon: "trending_up" },
          { label: "My Tasks", href: "/dashboard/student#tasks", icon: "task_alt" },
          { label: "Internship Journey", href: "/dashboard/student#internship", icon: "school" },
          { label: "Japanese Learning", href: "/dashboard/student#japanese", icon: "translate" },
          { label: "Self Evaluation", href: "/dashboard/student#evaluation", icon: "rate_review" },
          { label: "Feedback", href: "/dashboard/student#feedback", icon: "forum" },
          { label: "History", href: "/dashboard/student#history", icon: "history" },
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
          { label: "My Learners", href: "/dashboard/teacher#learners", icon: "groups" },
          { label: "Learning Progress", href: "/dashboard/teacher#progress", icon: "analytics" },
          { label: "Japanese Tracks", href: "/dashboard/teacher#japanese", icon: "translate" },
          { label: "Feedback", href: "/dashboard/teacher#feedback", icon: "forum" },
          { label: "Evaluations", href: "/dashboard/teacher#evaluations", icon: "assignment" },
          { label: "Reports", href: "/dashboard/teacher#reports", icon: "summarize" },
          { label: "History", href: "/dashboard/teacher#history", icon: "history" },
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
          { label: "My Team", href: "/dashboard/manager#team", icon: "group" },
          { label: "Workflows", href: "/dashboard/manager#workflows", icon: "schema" },
          { label: "Progress", href: "/dashboard/manager#progress", icon: "monitoring" },
          { label: "Evaluations", href: "/dashboard/manager#evaluations", icon: "assignment_turned_in" },
          { label: "Feedback", href: "/dashboard/manager#feedback", icon: "reviews" },
          { label: "Reports", href: "/dashboard/manager#reports", icon: "insights" },
          { label: "History", href: "/dashboard/manager#history", icon: "history" },
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
          { label: "Performance Cycles", href: "/dashboard/hr#cycles", icon: "calendar_month" },
          { label: "Evaluation Monitoring", href: "/dashboard/hr#evaluations", icon: "rule" },
          { label: "Analytics", href: "/dashboard/hr#analytics", icon: "equalizer" },
          { label: "Reports", href: "/dashboard/hr#reports", icon: "description" },
          { label: "Notifications", href: "/dashboard/hr#notifications", icon: "notifications" },
        ],
      },
    ];
  }

  // 5. Super Admin
  if (norm.includes("admin")) {
    return [
      {
        title: "Administration",
        items: [
          { label: "System Overview", href: "/dashboard/super-admin", icon: "admin_panel_settings" },
          { label: "User Directory", href: "/dashboard/super-admin#users", icon: "manage_accounts" },
          { label: "Role Mappings", href: "/dashboard/super-admin#roles", icon: "security" },
          { label: "Audit Logs", href: "/dashboard/super-admin#logs", icon: "receipt_long" },
          { label: "System Settings", href: "/dashboard/super-admin#settings", icon: "settings" },
        ],
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
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface-container border-r border-outline-variant/50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto`}
      >
        {/* Top Header / Branding */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-outline-variant/30">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="bg-white px-2.5 py-1 rounded-lg flex items-center justify-center shadow-xs border border-outline-variant/40">
              <Image
                alt="Dailoqa"
                src="/dailoqa_logo.png"
                width={80}
                height={22}
                className="h-5 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-on-surface text-base tracking-tight leading-none">
                Dailoqa
              </span>
              <span className="text-[11px] font-medium text-outline uppercase tracking-wider mt-0.5">
                PMS Platform
              </span>
            </div>
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
        <div className="px-5 pt-3">
          <div className="bg-surface-container-high/70 p-3 rounded-xl border border-outline-variant/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4B2EF5] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-body-sm font-semibold text-on-surface truncate">
                  {displayName}
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-medium">
                  {roleName}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant text-[11px] truncate">
                {departmentOrEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[11px] font-semibold text-outline uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-body-md transition-all ${
                      isActive
                        ? "bg-[#4B2EF5] text-white font-medium shadow-xs"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-xl transition-transform group-hover:scale-105 ${
                          isActive ? "text-white" : "text-outline group-hover:text-primary"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#e2dfff] text-[#3525cd]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User Bar & Sign Out */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-body-md text-error hover:bg-error-container/40 transition-colors font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}


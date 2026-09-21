"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
}

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    title: "Main Operations",
    items: [
      { label: "Teacher Portal", href: "/dashboard", icon: "dashboard" },
    ],
  },
  {
    title: "Authentication Flows",
    items: [
      { label: "Sign In (Login)", href: "/login", icon: "login" },
      { label: "Forgot Password", href: "/forgot-password", icon: "lock_reset" },
      { label: "Reset Password", href: "/reset-password", icon: "password" },
    ],
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

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
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-body-sm font-semibold text-on-surface truncate">
                  Dr. Rajesh Sharma
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-medium">
                  Faculty
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant text-[11px] truncate">
                Operations & Mentorship
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
                const isActive = pathname === item.href;
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
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-body-md text-error hover:bg-error-container/40 transition-colors font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

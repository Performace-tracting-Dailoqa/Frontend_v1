"use client";


import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthSession, apiLogout, UserSession } from "@/utils/auth";

export default function Header({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
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
          <span>Switch User</span>
        </Link>

        {/* User Profile Pill & Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-container transition-colors cursor-pointer text-left"
          title="Click to sign out / return to login"
        >
          <div className="w-8 h-8 rounded-full bg-[#4B2EF5] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-body-sm font-semibold text-on-surface leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-outline leading-tight">
              {roleName} • Sign Out
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}


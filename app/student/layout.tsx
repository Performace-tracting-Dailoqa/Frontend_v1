"use client";

import React, { useState, useEffect } from "react";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Restore saved collapse preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dailoqa_student_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage access errors if restricted
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("dailoqa_student_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      handleToggleCollapse();
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark ? "bg-[#07070d] text-slate-100" : "bg-white text-on-surface"
      }`}
    >
      {/* Persistent Left Sidebar */}
      <StudentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isDark={isDark}
      />

      {/* Top Header */}
      <StudentHeader
        onToggleSidebar={handleToggleSidebar}
        isCollapsed={isCollapsed}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Content Area */}
      <main
        className={`pt-20 transition-all duration-300 min-h-screen flex flex-col ${
          isCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

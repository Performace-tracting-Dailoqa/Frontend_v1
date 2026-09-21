"use client";

import React from "react";

export default function AuroraBackground({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Aurora Ambient Waves */}
      <div
        className="pointer-events-none absolute -inset-[10px] opacity-50 blur-[80px] will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(75, 46, 245, 0.45), transparent 50%), radial-gradient(ellipse at 80% 40%, rgba(168, 85, 247, 0.35), transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(56, 189, 248, 0.3), transparent 50%)",
          animation: "aurora 14s ease-in-out infinite alternate",
        }}
      />
      {children}
    </div>
  );
}

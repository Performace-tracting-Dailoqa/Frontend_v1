"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Shared presentational primitives for the Superuser dashboard.
 *
 * These exist so the seven pages render the same loading / empty / error /
 * unavailable states and the same card chrome. The visual language matches the
 * rest of the dashboard: white cards, `rounded-2xl`, `border-slate-200/80`,
 * `shadow-xs`, `material-symbols-outlined` icons and the `#4B2EF5` accent.
 */

// ---------------------------------------------------------------------------
// Page scaffolding
// ---------------------------------------------------------------------------

export function SectionCard({
  title,
  subtitle,
  icon,
  action,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-2.5 min-w-0">
          {icon && (
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function PageIntro({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

const PANEL_BASE =
  "bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center gap-3 px-6 py-14";

export function LoadingState({ label = "Loading…", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={compact ? "py-8 text-center" : PANEL_BASE}>
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={PANEL_BASE}>
      <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </span>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className={`${PANEL_BASE} border-rose-200 bg-rose-50/40`}>
      <span className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
        <span className="material-symbols-outlined text-2xl">error</span>
      </span>
      <div>
        <h3 className="text-sm font-bold text-rose-900">{title}</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-[#4B2EF5] hover:bg-[#3d24c8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}

/**
 * A capability the backend cannot serve yet (e.g. Microsoft calendar before a
 * mailbox is configured).
 *
 * Renders the required setup step verbatim so a superuser can act on it without
 * reading server logs.
 */
export function UnavailableState({
  icon = "cloud_off",
  title,
  message,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  message: string;
  hint?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className={`${PANEL_BASE} border-amber-200 bg-amber-50/40`}>
      <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </span>
      <div>
        <h3 className="text-sm font-bold text-amber-900">{title}</h3>
        <p className="text-xs text-amber-800 mt-1 max-w-md">{message}</p>
        {hint && (
          <p className="text-[11px] text-amber-700/90 mt-2 max-w-md font-mono bg-amber-100/60 rounded-lg px-3 py-2">
            {hint}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: string;
  /** Tailwind text colour for the icon chip and the value. */
  tone?: "primary" | "emerald" | "amber" | "rose" | "indigo" | "teal" | "violet" | "slate";
  hintTone?: "neutral" | "positive" | "warning" | "critical";
  onClick?: () => void;
}

const TONE_CHIP: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  indigo: "bg-indigo-50 text-indigo-600",
  teal: "bg-teal-50 text-teal-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

const TONE_VALUE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "text-slate-900",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
  indigo: "text-indigo-600",
  teal: "text-teal-600",
  violet: "text-violet-600",
  slate: "text-slate-900",
};

const HINT_TONE: Record<NonNullable<StatCardProps["hintTone"]>, string> = {
  neutral: "text-slate-500",
  positive: "text-emerald-600",
  warning: "text-amber-600",
  critical: "text-rose-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  hintTone = "neutral",
  onClick,
}: StatCardProps) {
  const interactive = typeof onClick === "function";

  return (
    <motion.div
      whileHover={interactive ? { y: -3, scale: 1.01 } : { y: -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 ${
        interactive ? "cursor-pointer transition-all" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
        <h3 className={`text-2xl font-bold mt-1 ${TONE_VALUE[tone]}`}>{value}</h3>
        {hint && <p className={`text-[10px] font-semibold mt-0.5 ${HINT_TONE[hintTone]}`}>{hint}</p>}
      </div>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TONE_CHIP[tone]}`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </span>
    </motion.div>
  );
}

/** Thin determinate progress bar. Colour shifts to amber/rose as it degrades. */
export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  className = "",
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-primary" : pct > 0 ? "bg-amber-500" : "bg-slate-300";

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-[11px] mb-1">
          {label && <span className="text-slate-500 font-medium">{label}</span>}
          {showValue && <span className="text-slate-700 font-bold font-mono ml-auto">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "emerald" | "amber" | "rose" | "indigo" | "teal" | "violet" | "primary";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    indigo: "bg-indigo-50 text-indigo-700",
    teal: "bg-teal-50 text-teal-700",
    violet: "bg-violet-50 text-violet-700",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200/80">
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/** Avatar bubble with deterministic initials. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = (name || "?")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const sizes = {
    sm: "w-8 h-8 text-[10px] rounded-lg",
    md: "w-9 h-9 text-xs rounded-full",
    lg: "w-14 h-14 text-lg rounded-2xl",
  } as const;

  return (
    <div
      className={`bg-[#4B2EF5] text-white font-bold flex items-center justify-center shrink-0 shadow-xs ${sizes[size]}`}
    >
      {initials || "?"}
    </div>
  );
}

/** Search input with the dashboard's standard field styling. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  icon = "search",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
        {icon}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  icon,
  tone = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  icon?: string;
  tone?: "primary" | "slate";
  className?: string;
}) {
  const tones = {
    primary: "bg-[#4B2EF5] hover:bg-[#3d24c8] text-white",
    slate: "bg-slate-100 hover:bg-slate-200 text-slate-700",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${tones[tone]} ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

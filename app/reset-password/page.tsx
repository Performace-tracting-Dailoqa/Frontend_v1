"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/animations/SpotlightCard";
import FloatingParticles from "@/components/animations/FloatingParticles";
import AuroraBackground from "@/components/animations/AuroraBackground";
import BorderBeam from "@/components/animations/BorderBeam";
import ShinyText from "@/components/animations/ShinyText";
import DecryptedText from "@/components/animations/DecryptedText";
import RotatingText from "@/components/animations/RotatingText";
import TrueFocus from "@/components/animations/TrueFocus";
import CountUp from "@/components/animations/CountUp";
import DotPattern from "@/components/animations/DotPattern";
import SystemStatusPill from "@/components/animations/SystemStatusPill";
import { apiChangePassword, clearAuthSession, AuthError } from "@/utils/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email") || "employee@dailoqa.com";
  const queryExpired = searchParams.get("expired") === "true";
  const queryRequired = searchParams.get("required") === "true";

  const email = queryEmail || "user@dailoqa.com";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [state, setState] = useState<"form" | "expired" | "success">(queryExpired ? "expired" : "form");

  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8 && /[0-9]/.test(newPassword)) score += 1;
    if (/[A-Z]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      setShowError(true);
      return;
    }
    setPasswordMismatch(false);
    setIsLoading(true);
    setShowError(false);

    try {
      // 1. Call backend POST /api/v1/auth/change-password
      await apiChangePassword(newPassword, confirmPassword);

      // 2. Clear the old session — Supabase rotates the session after a password
      //    change so the old token is no longer valid. The user must sign in fresh.
      clearAuthSession();

      setState("success");
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update password. Please check your password meets requirements.");
      }
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-surface relative overflow-hidden">
      {/* Left Branding Panel with React Bits Aurora & Floating Particles */}
      <div className="lg:w-[45%] bg-[#0B0B12] text-white flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden">
        <AuroraBackground className="absolute inset-0 z-0" />
        <FloatingParticles count={30} className="z-10" />

        <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#4B2EF5]/40 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#a855f7]/30 rounded-full blur-3xl pointer-events-none animate-float-slow" />

        {/* Dailoqa Logo Badge */}
        <div className="relative z-20 flex items-center gap-3.5">
          <div className="bg-white px-4 py-2 rounded-xl flex items-center justify-center shadow-lg border border-white/30 transition-transform duration-300 hover:scale-105">
            <Image
              alt="Dailoqa Logo"
              src="/dailoqa_logo.png"
              width={120}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
          </div>
          <div className="border border-white/20 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md shadow-xs flex items-center">
            <DecryptedText
              text="SECURITY PROTOCOL"
              speed={35}
              animateOn="mount"
              className="text-xs font-mono font-bold tracking-wider text-white"
              encryptedClassName="text-[#c084fc] font-mono"
            />
          </div>
        </div>

        <div className="relative z-20 my-auto py-10">
          <div className="mb-4">
            <h1 className="text-3xl lg:text-4xl font-headline font-bold tracking-tight text-white leading-snug">
              <span>Performance, learning and </span>
              <RotatingText
                texts={["security", "standards", "compliance", "integrity"]}
                interval={2500}
                badgeStyle
              />
              <span> in one place.</span>
            </h1>
          </div>
          <p className="text-slate-300 text-body-lg max-w-md leading-relaxed">
            Empowering organizations with structured evaluations, real-time analytics, and seamless mentorship tracks.
          </p>

          {/* Interactive Neon TrueFocus Box */}
          <div className="mt-8 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-2">Password Standards</p>
            <TrueFocus
              sentence="8+-Characters Mixed-Casing Special-Symbols"
              manualMode={false}
              animationDuration={0.45}
              pauseBetweenAnimations={1.5}
              borderColor="#818cf8"
              glowColor="rgba(129, 140, 248, 0.4)"
              className="text-sm font-semibold text-white"
            />
          </div>
        </div>

        <div className="relative z-20 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15">
          <div className="flex items-center gap-2.5 group cursor-default p-2 rounded-lg transition-colors hover:bg-white/5">
            <span className="material-symbols-outlined text-[#c3c0ff] text-base group-hover:scale-125 transition-transform">
              verified
            </span>
            <span className="text-label-sm text-slate-200 font-medium">
              <CountUp to={99.4} decimals={1} suffix="%" duration={2} className="font-bold text-[#c3c0ff]" /> Visibility Score
            </span>
          </div>
          <div className="flex items-center gap-2.5 group cursor-default p-2 rounded-lg transition-colors hover:bg-white/5">
            <span className="material-symbols-outlined text-[#c3c0ff] text-base group-hover:scale-125 transition-transform">
              lock
            </span>
            <span className="text-label-sm text-slate-200 font-medium">
              <CountUp to={100} decimals={0} suffix="%" duration={1.8} className="font-bold text-[#c3c0ff]" /> Secure SSO
            </span>
          </div>
          <div className="flex items-center gap-2.5 group cursor-default p-2 rounded-lg transition-colors hover:bg-white/5">
            <span className="material-symbols-outlined text-[#c3c0ff] text-base group-hover:scale-125 transition-transform">
              bolt
            </span>
            <span className="text-label-sm text-slate-200 font-medium">
              <CountUp to={24} decimals={0} suffix="/7" duration={1.5} className="font-bold text-[#c3c0ff]" /> Live Metrics
            </span>
          </div>
        </div>
      </div>

      {/* Right Content Panel with DotPattern Background */}
      <div className="lg:w-[55%] flex flex-col justify-center items-center p-8 lg:p-16 bg-surface min-h-screen lg:min-h-0 relative">
        
        {/* Subtle Tech Dot Pattern Background */}
        <DotPattern width={24} height={24} cx={1} cy={1} cr={1} className="opacity-35 pointer-events-none" />

        {/* Popular Floating Enterprise System Status Pill */}
        <div className="absolute top-6 right-6 lg:right-10 z-30">
          <SystemStatusPill />
        </div>

        {/* Prominent Dailoqa Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 flex flex-col items-center z-10"
        >
          <Image
            alt="Dailoqa"
            src="/dailoqa_logo.png"
            width={190}
            height={50}
            className="h-11 w-auto object-contain m-0 p-0 transition-transform duration-300 hover:scale-105"
            priority
          />
        </motion.div>

        {/* State Switcher Bar Above the Card - Works Instantly Like Before */}
        <div className="mb-4 flex flex-wrap justify-center gap-1.5 bg-surface-container-highest p-1.5 rounded-xl border border-outline-variant text-xs shadow-xs z-20">
          <button
            type="button"
            onClick={() => setState("form")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              state === "form"
                ? "bg-white text-primary font-bold shadow-xs border border-outline-variant/30"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
            }`}
          >
            1. Form State
          </button>
          <button
            type="button"
            onClick={() => setState("expired")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              state === "expired"
                ? "bg-white text-primary font-bold shadow-xs border border-outline-variant/30"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
            }`}
          >
            2. Expired Token State
          </button>
          <button
            type="button"
            onClick={() => setState("success")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              state === "success"
                ? "bg-white text-primary font-bold shadow-xs border border-outline-variant/30"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
            }`}
          >
            3. Success State
          </button>
        </div>

        {/* Main Card Container */}
        <div className="w-full max-w-[420px] mx-auto z-10 relative">
          <SpotlightCard
            spotlightColor="rgba(75, 46, 245, 0.15)"
            className="w-full rounded-2xl shadow-xl p-8 lg:p-10 border border-surface-container-high/80 relative backdrop-blur-sm bg-white/95"
          >
            <BorderBeam size={220} duration={8} colorFrom="#4B2EF5" colorTo="#a855f7" />

            {/* EXPIRED TOKEN STATE */}
            {state === "expired" && (
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <span className="material-symbols-outlined text-3xl text-error">lock_clock</span>
                </div>
                <h2 className="text-headline-md font-headline font-bold text-on-surface mb-2 tracking-tight">
                  This link has expired
                </h2>
                <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
                  Password reset links are only valid for 24 hours. Please request a new link to continue.
                </p>
                <Link
                  href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                  className="w-full py-3 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  Request a new link
                </Link>
                <div className="mt-4">
                  <Link href="/login" className="text-body-sm text-outline hover:text-on-surface transition-colors">
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {state === "success" && (
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs animate-bounce">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h2 className="text-headline-md font-headline font-bold text-on-surface mb-2 tracking-tight">
                  Password updated!
                </h2>
                <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
                  Your password for <span className="font-semibold text-on-surface">{email}</span> has been successfully updated.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Redirect to login — user must sign in with new password to get a fresh token
                    router.push(`/login?reset=success&email=${encodeURIComponent(email)}`);
                  }}
                  className="w-full py-3 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 active:scale-[0.99] text-white font-medium rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Sign in with new password</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            )}

            {/* FORM STATE */}
            {state === "form" && (
              <div>
                {/* First-login requirement banner */}
                {queryRequired && (
                  <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-body-sm flex items-center gap-2.5 shadow-2xs">
                    <span className="material-symbols-outlined text-amber-600 text-lg">lock</span>
                    <span>First-login security requirement: Please choose a new password.</span>
                  </div>
                )}

                {/* Error Banner */}
                {showError && (
                  <div className="mb-4 p-4 rounded-xl bg-error-container text-on-error-container text-body-sm flex items-center gap-3 animate-shake">
                    <span className="material-symbols-outlined text-error text-xl">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="mb-8 text-center sm:text-left">
                  <h2 className="text-headline-md font-headline font-bold text-on-surface mb-1.5 tracking-tight flex items-center gap-2">
                    <span>Set a new</span>
                    <DecryptedText
                      text="Password"
                      speed={30}
                      animateOn="hover"
                      className="font-bold text-primary"
                      encryptedClassName="text-[#4B2EF5] opacity-60"
                    />
                  </h2>
                  <p className="text-body-md text-on-surface-variant">
                    Updating password for <span className="font-semibold text-on-surface">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface block font-medium">
                      New Password
                    </label>
                    <div className="relative flex items-center group">
                      <span className="absolute left-3.5 material-symbols-outlined text-outline group-focus-within:text-primary text-lg pointer-events-none transition-colors">
                        lock
                      </span>
                      <input
                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-surface-container border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="••••••••"
                        required
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-outline hover:text-on-surface p-1 rounded cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>

                    {/* Dynamic Strength Bars */}
                    <div className="flex gap-1.5 pt-2">
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          strength >= 1 ? "bg-[#ba1a1a]" : "bg-surface-container-highest"
                        } ${strength >= 2 ? "!bg-[#a44100]" : ""} ${strength >= 3 ? "!bg-[#3525cd]" : ""}`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          strength >= 2 ? "bg-[#a44100]" : "bg-surface-container-highest"
                        } ${strength >= 3 ? "!bg-[#3525cd]" : ""}`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          strength >= 3 ? "bg-[#3525cd]" : "bg-surface-container-highest"
                        }`}
                      />
                    </div>
                    <div className="text-[11px] text-outline flex justify-between">
                      <span>Weak</span>
                      <span>Medium</span>
                      <span>Strong</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface block font-medium">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center group">
                      <span className="absolute left-3.5 material-symbols-outlined text-outline group-focus-within:text-primary text-lg pointer-events-none transition-colors">
                        lock_reset
                      </span>
                      <input
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="••••••••"
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordMismatch) setPasswordMismatch(false);
                        }}
                      />
                    </div>
                    {passwordMismatch && (
                      <p className="text-body-sm text-error flex items-center gap-1 mt-1 font-medium animate-shake">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Passwords do not match.
                      </p>
                    )}
                  </div>

                  {/* Native 100% Reliable Reset Password Button */}
                  <button
                    disabled={isLoading}
                    className="w-full py-3 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 active:scale-[0.99] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 relative overflow-hidden group"
                    type="submit"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined text-lg animate-spin">
                          progress_activity
                        </span>
                        <span>Resetting password...</span>
                      </>
                    ) : (
                      <ShinyText text="Reset Password" speed={3} className="text-white font-medium" />
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                    className="text-body-sm text-[#4B2EF5] hover:underline font-semibold inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}
          </SpotlightCard>
        </div>

        <div className="mt-8 text-center z-10">
          <p className="text-body-sm text-outline">
            Having trouble? Contact your HR administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center text-primary">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

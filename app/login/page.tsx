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
import { apiLogin, apiGetMe, fetchMe, saveProfileSession, saveAuthSession, getRoleDashboardPath, getLoginErrorMessage, startMicrosoftLogin, AuthError } from "@/utils/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetParam = searchParams.get("reset");
  const emailParam = searchParams.get("email");
  const logoutParam = searchParams.get("logout");
  const ssoErrorParam = searchParams.get("error");

  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    ssoErrorParam ? getLoginErrorMessage(ssoErrorParam) : ""
  );
  const [showError, setShowError] = useState(Boolean(ssoErrorParam));
  const [successBanner, setSuccessBanner] = useState<string | null>(
    resetParam === "success" ? "Password reset successfully! Please sign in with your new password." : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(false);

    try {
      // 1. Authenticate with backend POST /api/v1/auth/login
      const loginData = await apiLogin(email, password);

      // 2. Handle first-login password change flow
      if (loginData.must_change_password) {
        let meData;
        try {
          meData = await apiGetMe(loginData.access_token);
        } catch {
          meData = {
            id: loginData.user.id,
            email: loginData.user.email,
            name: loginData.user.name,
            is_active: loginData.user.is_active,
            must_change_password: true,
            role: { id: "temp-role", name: loginData.user.role_name || "User" },
          };
        }
        saveAuthSession({
          token: loginData.access_token,
          tokenType: loginData.token_type || "bearer",
          expiresIn: loginData.expires_in,
          mustChangePassword: true,
          user: meData,
          loginAt: new Date().toISOString(),
        });
        router.push(`/reset-password?required=true&email=${encodeURIComponent(loginData.user.email)}`);
        return;
      }

      // 3. Normal flow: the backend set the HttpOnly pms_session cookie on login.
      //    Retrieve the authoritative profile via cookie-authenticated /auth/me
      //    and store ONLY profile metadata — no token in localStorage.
      const meData = await fetchMe();

      const mustChange = Boolean(loginData.must_change_password || meData.must_change_password);

      saveAuthSession({
        token: loginData.access_token,
        tokenType: loginData.token_type || "bearer",
        expiresIn: loginData.expires_in,
        mustChangePassword: mustChange,
        user: meData,
        role: meData.role,
        profile: meData.profile || null,
        scope: meData.scope || null,
        loginAt: new Date().toISOString(),
      });

      // If temporary password was used or password reset is required, route directly to reset-password
      if (mustChange) {
        router.push(`/reset-password?required=true&email=${encodeURIComponent(meData.email || email)}`);
        return;
      }

      // 4. Role-based routing based strictly on /auth/me
      const targetDashboard = getRoleDashboardPath(meData.role?.name);
      router.push(targetDashboard);
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred during sign in. Please try again.");
      }
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSORedirect = () => {
    setShowError(false);
    startMicrosoftLogin();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-surface relative overflow-hidden">
      
      {/* Left Branding Panel with React Bits Aurora & Floating Particles */}
      <div className="lg:w-[45%] bg-[#0B0B12] text-white flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden">
        {/* Luminous Flowing Aurora Waves */}
        <AuroraBackground className="absolute inset-0 z-0" />

        {/* Floating Glowing Particle Stars */}
        <FloatingParticles count={30} className="z-10" />

        {/* Ambient Pulsing Glow Orbs */}
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#4B2EF5]/40 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#a855f7]/30 rounded-full blur-3xl pointer-events-none animate-float-slow" />

        {/* Top Branding Section: Dailoqa Logo in Clean White Badge */}
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
              text="PMS ENTERPRISE"
              speed={35}
              animateOn="mount"
              className="text-xs font-mono font-bold tracking-wider text-white"
              encryptedClassName="text-[#c084fc] font-mono"
            />
          </div>
        </div>

        {/* Main Pitch with RotatingText & TrueFocus Animations */}
        <div className="relative z-20 my-auto py-10">
          <div className="mb-4">
            <h1 className="text-3xl lg:text-4xl font-headline font-bold tracking-tight text-white leading-snug">
              <span>Performance, learning and </span>
              <RotatingText
                texts={["mentorship", "growth", "excellence", "evaluations"]}
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
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-2">Core Pillars</p>
            <TrueFocus
              sentence="Objective-Reviews Instant-Feedback Continuous-Growth"
              manualMode={false}
              animationDuration={0.45}
              pauseBetweenAnimations={1.5}
              borderColor="#818cf8"
              glowColor="rgba(129, 140, 248, 0.4)"
              className="text-sm font-semibold text-white"
            />
          </div>
        </div>

        {/* Stats Badges with Animated CountUp */}
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

      {/* Right Login Panel */}
      <div className="lg:w-[55%] flex flex-col justify-center items-center p-8 lg:p-16 bg-surface min-h-screen lg:min-h-0 relative">
        
        {/* Subtle Tech Dot Pattern Background */}
        <DotPattern width={24} height={24} cx={1} cy={1} cr={1} className="opacity-35 pointer-events-none" />

        {/* Floating Enterprise System Status Pill */}
        <div className="absolute top-6 right-6 lg:right-10 z-30">
          <SystemStatusPill />
        </div>

        {/* Prominent Dailoqa Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex flex-col items-center z-10"
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

        {/* Main Login Card */}
        <div className="w-full max-w-[420px] mx-auto z-10 relative">
          <SpotlightCard
            spotlightColor="rgba(75, 46, 245, 0.15)"
            className="w-full rounded-2xl shadow-xl p-8 lg:p-10 border border-surface-container-high/80 relative bg-white/95 backdrop-blur-sm"
          >
            {/* Border Light Beam */}
            <BorderBeam size={220} duration={8} colorFrom="#4B2EF5" colorTo="#38bdf8" />

            {/* Success Banner when arriving from Password Reset */}
            {successBanner && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-body-sm flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
                  <span>{successBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessBanner(null)}
                  className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* Logout Notice Banner */}
            {logoutParam === "true" && !successBanner && (
              <div className="mb-6 p-3.5 rounded-xl bg-surface-container border border-outline-variant text-body-sm flex items-center gap-2.5 text-on-surface">
                <span className="material-symbols-outlined text-primary text-xl">info</span>
                <span>You have been signed out securely.</span>
              </div>
            )}

            {/* Error Banner */}
            {showError && (
              <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-body-sm flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-headline-md font-headline font-bold text-on-surface mb-1.5 tracking-tight flex items-center gap-2">
                <span>Sign in to</span>
                <DecryptedText
                  text="PMS Portal"
                  speed={30}
                  animateOn="hover"
                  className="font-bold text-primary"
                  encryptedClassName="text-[#4B2EF5] opacity-60"
                />
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Use your organisation account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface block font-medium">
                  Work Email
                </label>
                <div className="relative flex items-center group">
                  <span className="absolute left-3.5 material-symbols-outlined text-outline group-focus-within:text-primary text-lg pointer-events-none transition-colors">
                    mail
                  </span>
                  <input
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="employee@dailoqa.com"
                    required
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-label-md text-on-surface block font-medium">
                    Password
                  </label>
                  <Link
                    href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                    className="text-label-sm text-[#4B2EF5] hover:underline font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center group">
                  <span className="absolute left-3.5 material-symbols-outlined text-outline group-focus-within:text-primary text-lg pointer-events-none transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-surface-container border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-outline hover:text-on-surface p-1 rounded transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 accent-[#4B2EF5] cursor-pointer"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-body-sm text-on-surface-variant">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowError(!showError)}
                  className="text-label-sm text-outline hover:text-primary transition-colors text-xs cursor-pointer"
                >
                  Toggle Error Test
                </button>
              </div>

              {/* Native, 100% Reliable Sign In Button */}
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <ShinyText text="Sign In with Credentials" speed={3} className="text-white font-medium tracking-wide" />
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-container-high" />
              </div>
              <div className="relative flex justify-center text-label-sm">
                <span className="px-3 bg-white text-outline">or</span>
              </div>
            </div>

            {/* Microsoft SSO Button */}
            <button
              onClick={handleSSORedirect}
              type="button"
              className="w-full py-3 bg-surface-container hover:bg-surface-container-high hover:border-outline text-on-surface font-medium rounded-xl transition-all flex items-center justify-center gap-2.5 border border-outline-variant/60 cursor-pointer shadow-2xs group active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg text-[#00a4ef] group-hover:scale-110 transition-transform">
                business
              </span>
              <span className="group-hover:text-primary transition-colors">Continue with Microsoft 365</span>
            </button>

            {/* Strictly NO "Create account" / "Sign up" button or link per user instruction */}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center text-primary">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

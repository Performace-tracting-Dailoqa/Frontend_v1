"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import DotPattern from "@/components/animations/DotPattern";
import DailoqaInteractiveBackground from "@/components/animations/DailoqaInteractiveBackground";
import KumoHeroOrbit from "@/components/kumo/KumoHeroOrbit";
import DriftWall from "@/components/animations/DriftWall";

export default function LandingPage() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [showStickyPill, setShowStickyPill] = useState<boolean>(false);

  // Monitor scroll for the stiky floating portal access pill (Recommendation 4)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowStickyPill(true);
      } else {
        setShowStickyPill(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden font-sans transition-colors duration-500 select-none ${
        isDark
          ? "bg-[#080811] text-slate-100 selection:bg-[#4B2EF5] selection:text-white"
          : "bg-[#F8FAFC] text-slate-900 selection:bg-[#4B2EF5] selection:text-white"
      }`}
    >
      {/* Interactive Mouse Particle Canvas & Spring-Followed Ambient Light */}
      <DailoqaInteractiveBackground />

      {/* Subtle Precision Grid */}
      <DotPattern
        width={36}
        height={36}
        cx={1.5}
        cy={1.5}
        cr={1}
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-500 ${
          isDark ? "opacity-20 fill-[#4B2EF5]/20" : "opacity-30 fill-[#4B2EF5]/15"
        }`}
      />

      {/* Soft Ambient Hero Glow Beam */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-[#4B2EF5]/15 via-[#7c3aed]/10 to-transparent blur-[150px] pointer-events-none z-0 transition-opacity duration-500 ${
          isDark ? "opacity-80" : "opacity-40"
        }`}
      />

      {/* ========================================================= */}
      {/* CLEAN MINIMAL NAVIGATION HEADER WITH MIRAI LOGO & TOGGLE  */}
      {/* ========================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b transition-all duration-300 ${
          isDark
            ? "bg-[#080811]/90 border-white/10 shadow-lg shadow-black/30"
            : "bg-white/90 border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-24 sm:h-28 flex items-center justify-between">
          
          {/* Logo Group: MiRai By Dailoqa */}
          <Link href="/" className="flex items-center gap-4 group">
            {/* Prominent Big MiRai by Dailoqa Logo Badge */}
            <div className="bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl flex items-center justify-center shadow-md border border-slate-200/90 transition-transform duration-300 group-hover:scale-105">
              <Image
                alt="MiRai By Dailoqa Logo"
                src="/mirai_logo.png"
                width={320}
                height={195}
                className="h-12 sm:h-16 md:h-18 w-auto object-contain"
                priority
              />
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#4B2EF5] px-3 py-1 rounded-lg bg-[#4B2EF5]/10 border border-[#4B2EF5]/20">
                PMS 2.0
              </span>
            </div>
          </Link>

          {/* Right Action Group: Theme Switcher (5) & Launch Portal (4) */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Light / Dark Mode Toggle Button (Recommendation 5) */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle Theme"
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDark
                  ? "bg-white/10 border-white/15 text-amber-300 hover:bg-white/15"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* Sign In Navigation Action */}
            <Link
              href="/login"
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              <span>Sign In</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* HERO SECTION: INSPIRING QUOTES & PORTAL ACCESS            */}
      {/* ========================================================= */}
      <section className="pt-40 sm:pt-48 pb-16 px-6 max-w-7xl mx-auto text-center relative z-10">
        
        {/* Center Dailoqa Brand Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div
            className={`px-8 sm:px-12 py-4 sm:py-5 rounded-3xl shadow-xl border flex items-center justify-center transition-transform hover:scale-105 duration-300 ${
              isDark
                ? "bg-white/5 border-white/10 shadow-black/30"
                : "bg-white border-slate-200/90 shadow-indigo-500/5"
            }`}
          >
            <Image
              alt="Dailoqa Logo"
              src={isDark ? "/dailoqa-logo-white.png" : "/dailoqa_logo.png"}
              width={400}
              height={120}
              className="h-12 sm:h-16 md:h-20 w-auto object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Soft Eyebrow Badge with MiRai identity */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-xs mb-8 text-xs font-medium transition-colors ${
            isDark
              ? "bg-white/5 border-white/15 text-slate-300"
              : "bg-white border-slate-200/90 text-slate-700"
          }`}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#818cf8] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4B2EF5]" />
          </span>
          <span className="text-[#4B2EF5] font-bold">MIRAI BY DAILOQA</span>
          <span className="text-slate-400">•</span>
          <span>Nurturing Faculty Growth & Learning</span>
        </motion.div>

        {/* Master Kinetic Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className={`text-4xl sm:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight leading-[1.12] mb-6 max-w-4xl mx-auto transition-colors ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Performance, learning and excellence in one place.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className={`text-base sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-normal transition-colors ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          An inspiring space for educators, mentors, and academic leaders to celebrate pedagogical dedication.
        </motion.p>

        {/* SIGNATURE KUMO HERO ORBIT: Interactive Inspiring Quotes Stage */}
        <KumoHeroOrbit isDark={isDark} />
      </section>

      {/* ========================================================= */}
      {/* DRIFT WALL OF INSPIRING QUOTES (REACT BITS DRIFT WALL)    */}
      {/* ========================================================= */}
      <section
        className={`py-20 relative z-10 border-t overflow-hidden transition-colors ${
          isDark ? "border-white/10" : "border-slate-200/80"
        }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-12 px-6">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B2EF5] block mb-2">
            PERSPECTIVE & WISDOM • DRIFT WALL
          </span>
          <h2
            className={`text-2xl sm:text-4xl font-headline font-bold tracking-tight mb-3 transition-colors ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Endless Wall of Educational Thought
          </h2>
          <p className={`text-sm sm:text-base transition-colors ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Hover over any tile to lift and pause the quote. Move your mouse to explore the 3D perspective wall.
          </p>
        </div>

        {/* 3D Perspective Drift Wall of Quotes */}
        <div className="w-full h-[620px] relative overflow-hidden">
          <DriftWall
            isDark={isDark}
            columns={4}
            tileWidth={280}
            tileHeight={170}
            gap={22}
            speed={32}
            tilt={12}
            turn={-10}
            lift={50}
            pauseOnHover={true}
          />
        </div>
      </section>

      {/* ========================================================= */}
      {/* DIRECT PORTAL ENTRY CALLOUT                               */}
      {/* ========================================================= */}
      <section className="py-20 px-6 max-w-5xl mx-auto relative z-10">
        <div
          className={`rounded-3xl p-10 sm:p-14 text-center border shadow-xl transition-all ${
            isDark
              ? "bg-gradient-to-br from-[#121028] via-[#090915] to-[#0d0d1e] border-white/15 shadow-black/40"
              : "bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-200/80 shadow-indigo-100/50"
          }`}
        >
          <h2
            className={`text-2xl sm:text-4xl font-headline font-extrabold tracking-tight mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Ready to access your faculty dashboard?
          </h2>
          <p
            className={`text-base max-w-lg mx-auto mb-8 leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Sign in to track observations, complete evaluations, and collaborate with your academic mentors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#4B2EF5] hover:bg-[#4326dd] text-white font-semibold text-base shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5"
            >
              <span>Access Dashboard</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
            <Link
              href="/forgot-password"
              className={`w-full sm:w-auto px-6 py-4 rounded-xl border font-medium text-base transition-colors ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/15 text-white"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
              }`}
            >
              <span>Forgot Password?</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MINIMAL CLEAN FOOTER                                      */}
      {/* ========================================================= */}
      <footer
        className={`py-12 border-t transition-colors ${
          isDark ? "bg-[#05050a] border-white/10" : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white px-5 py-2.5 rounded-xl shadow-xs border border-slate-200">
              <Image
                alt="MiRai By Dailoqa Logo"
                src="/mirai_logo.png"
                width={220}
                height={120}
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              © {new Date().getFullYear()} MiRai by Dailoqa. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/login"
              className={`transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Sign In
            </Link>
            <Link
              href="/forgot-password"
              className={`transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Password Recovery
            </Link>
            <Link
              href="/reset-password"
              className={`transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Reset
            </Link>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* STICKY FLOATING PORTAL ACCESS PILL (Recommendation 4)    */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showStickyPill && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Link
              href="/login"
              className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#4B2EF5] hover:bg-[#4326dd] text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-500/35 hover:shadow-indigo-500/50 transition-all border border-indigo-400/40 cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Launch PMS Portal</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

interface QuoteCardData {
  id: string;
  quote: string;
  author: string;
  role: string;
  theme: string;
  icon: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

const QUOTE_CARDS: QuoteCardData[] = [
  {
    id: "yeats",
    quote: "Education is not the filling of a pail, but the lighting of a fire.",
    author: "William Butler Yeats",
    role: "Poet & Nobel Laureate",
    theme: "IGNITING PASSION",
    icon: "local_fire_department",
    accentColor: "#4B2EF5",
    accentBg: "rgba(75, 46, 245, 0.12)",
    accentBorder: "rgba(75, 46, 245, 0.3)",
  },
  {
    id: "franklin",
    quote: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin",
    role: "Polymath & Statesman",
    theme: "ACTIVE LEARNING",
    icon: "psychology",
    accentColor: "#0284C7",
    accentBg: "rgba(2, 132, 199, 0.12)",
    accentBorder: "rgba(2, 132, 199, 0.3)",
  },
  {
    id: "einstein",
    quote: "The delicate art of the teacher is to awaken joy in creative expression and knowledge.",
    author: "Albert Einstein",
    role: "Theoretical Physicist",
    theme: "CREATIVE JOY",
    icon: "auto_awesome",
    accentColor: "#9333EA",
    accentBg: "rgba(147, 51, 234, 0.12)",
    accentBorder: "rgba(147, 51, 234, 0.3)",
  },
  {
    id: "malala",
    quote: "One child, one teacher, one book, one pen can change the world.",
    author: "Malala Yousafzai",
    role: "Education Advocate & Nobel Laureate",
    theme: "GLOBAL IMPACT",
    icon: "public",
    accentColor: "#059669",
    accentBg: "rgba(5, 150, 105, 0.12)",
    accentBorder: "rgba(5, 150, 105, 0.3)",
  },
  {
    id: "profession",
    quote: "Teaching is the one profession that creates all other professions.",
    author: "Unknown",
    role: "Timeless Wisdom",
    theme: "THE FOUNDATION",
    icon: "school",
    accentColor: "#6366F1",
    accentBg: "rgba(99, 102, 241, 0.12)",
    accentBorder: "rgba(99, 102, 241, 0.3)",
  },
];

export default function KumoHeroOrbit({ isDark = false }: { isDark?: boolean }) {
  const [activeId, setActiveId] = useState<string>("yeats");
  const stageRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 90, damping: 22, mass: 0.6 };
  const smoothMouseX = useSpring(mouseX, { ...springConfig });
  const smoothMouseY = useSpring(mouseY, { ...springConfig });

  // 3D Tilt for Central Podium
  const tiltRotateX = useTransform(smoothMouseY, [-0.5, 0.5], ["3deg", "-3deg"]);
  const tiltRotateY = useTransform(smoothMouseX, [-0.5, 0.5], ["-3deg", "3deg"]);

  // Flank Parallax
  const leftParallaxX = useTransform(smoothMouseX, [-0.5, 0.5], [-6, 6]);
  const leftParallaxY = useTransform(smoothMouseY, [-0.5, 0.5], [-8, 8]);
  const rightParallaxX = useTransform(smoothMouseX, [-0.5, 0.5], [6, -6]);
  const rightParallaxY = useTransform(smoothMouseY, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const activeData = QUOTE_CARDS.find((c) => c.id === activeId) || QUOTE_CARDS[0];

  const leftCards = [QUOTE_CARDS[0], QUOTE_CARDS[1]];
  const rightCards = [QUOTE_CARDS[2], QUOTE_CARDS[3]];
  const centerTopCard = QUOTE_CARDS[4];

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 select-none"
      style={{ perspective: 1400 }}
    >
      {/* Top Floating Quote Badge */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => setActiveId(centerTopCard.id)}
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-xl transition-all cursor-pointer border ${
            activeId === centerTopCard.id
              ? isDark
                ? "bg-[#111022] text-white border-[#4B2EF5] shadow-md shadow-indigo-500/25 scale-105 font-medium"
                : "bg-white text-indigo-900 border-[#4B2EF5] shadow-md shadow-indigo-500/15 scale-105 font-medium"
              : isDark
              ? "bg-[#0d0d1b]/80 text-slate-300 border-white/10 hover:border-indigo-400 hover:bg-[#121224]"
              : "bg-white/80 text-slate-700 border-slate-200/90 hover:border-indigo-400 hover:bg-white shadow-xs"
          }`}
        >
          <span className="material-symbols-outlined text-sm text-[#4B2EF5]">school</span>
          <span className={`text-xs sm:text-sm font-serif italic ${isDark ? "text-slate-200" : "text-slate-800"}`}>
            &ldquo;Teaching is the one profession that creates all other professions.&rdquo;
          </span>
        </button>
      </div>

      {/* Main 3-Column Layout: Left Quotes, Center Portal Card, Right Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* ========================================================= */}
        {/* LEFT FLANK: Quote Cards 1 & 2                             */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-4">
          {leftCards.map((card, idx) => {
            const isActive = card.id === activeId;
            return (
              <motion.div
                key={card.id}
                style={{
                  x: leftParallaxX,
                  y: leftParallaxY,
                }}
                animate={{
                  y: [0, idx % 2 === 0 ? -3 : 3, 0],
                }}
                transition={{
                  y: {
                    repeat: Infinity,
                    duration: 5 + idx * 0.8,
                    ease: "easeInOut",
                  },
                }}
                onClick={() => setActiveId(card.id)}
                className="w-full cursor-pointer"
              >
                <div
                  className={`p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 text-left ${
                    isActive
                      ? isDark
                        ? "bg-[#111022] border-2 shadow-xl shadow-indigo-500/20 scale-[1.02]"
                        : "bg-white border-2 shadow-xl shadow-indigo-500/10 scale-[1.02]"
                      : isDark
                      ? "bg-[#0d0d1b]/80 border border-white/10 hover:border-white/25 hover:bg-[#121226]"
                      : "bg-white/85 border border-slate-200/80 hover:border-slate-300 hover:bg-white shadow-xs hover:shadow-md"
                  }`}
                  style={{
                    borderColor: isActive ? card.accentColor : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span
                      className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: card.accentBg,
                        color: card.accentColor,
                        border: `1px solid ${card.accentBorder}`,
                      }}
                    >
                      {card.theme}
                    </span>
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: card.accentBg,
                        color: card.accentColor,
                      }}
                    >
                      <span className="material-symbols-outlined text-base">{card.icon}</span>
                    </span>
                  </div>

                  <p className={`text-sm font-serif italic leading-relaxed mb-3 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    &ldquo;{card.quote}&rdquo;
                  </p>

                  <div className={`pt-2 border-t flex items-center justify-between ${isDark ? "border-white/10" : "border-slate-100"}`}>
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{card.author}</h4>
                      <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{card.role}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: card.accentColor }} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* CENTER COLUMN: The Primary Focus & Launch Portal           */}
        {/* ========================================================= */}
        <div className="lg:col-span-6">
          <motion.div
            style={{
              rotateX: tiltRotateX,
              rotateY: tiltRotateY,
              transformStyle: "preserve-3d",
            }}
            className={`relative rounded-3xl p-1 shadow-2xl transition-all border ${
              isDark
                ? "bg-gradient-to-b from-[#4B2EF5]/30 via-white/5 to-transparent border-white/15"
                : "bg-gradient-to-b from-indigo-100/80 via-white to-purple-100/60 border-slate-200/80"
            }`}
          >
            <div className={`rounded-3xl overflow-hidden shadow-xl p-8 sm:p-12 text-center flex flex-col justify-between min-h-[380px] border ${
              isDark
                ? "bg-[#090915] border-white/10"
                : "bg-white border-slate-200/90"
            }`}>
              
              {/* Active Theme Eyebrow */}
              <div className="flex justify-center mb-4">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold"
                  style={{
                    backgroundColor: activeData.accentBg,
                    color: activeData.accentColor,
                    border: `1px solid ${activeData.accentBorder}`,
                  }}
                >
                  <span className="material-symbols-outlined text-sm">{activeData.icon}</span>
                  <span>{activeData.theme}</span>
                </span>
              </div>

              {/* Featured Inspiring Quote */}
              <div className="my-auto py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeData.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-xl mx-auto"
                  >
                    <span className="text-4xl text-[#4B2EF5]/40 font-serif leading-none block mb-2">“</span>
                    <blockquote className={`text-xl sm:text-2xl lg:text-3xl font-serif italic leading-snug tracking-tight mb-4 ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}>
                      {activeData.quote}
                    </blockquote>
                    <cite className="not-italic block">
                      <span className={`text-sm sm:text-base font-bold block font-sans ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}>
                        {activeData.author}
                      </span>
                      <span className={`text-xs font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {activeData.role}
                      </span>
                    </cite>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Solitary Focused Portal Action */}
              <div className={`pt-6 border-t flex items-center justify-center ${
                isDark ? "border-white/10" : "border-slate-100"
              }`}>
                <Link
                  href="/login"
                  className="px-8 py-3.5 rounded-xl bg-[#4B2EF5] hover:bg-[#4326dd] text-white font-semibold text-sm sm:text-base transition-all shadow-lg shadow-indigo-500/25 active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer group"
                >
                  <span>Launch PMS Portal</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>

            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT FLANK: Quote Cards 3 & 4                            */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-4">
          {rightCards.map((card, idx) => {
            const isActive = card.id === activeId;
            return (
              <motion.div
                key={card.id}
                style={{
                  x: rightParallaxX,
                  y: rightParallaxY,
                }}
                animate={{
                  y: [0, idx % 2 === 0 ? 3 : -3, 0],
                }}
                transition={{
                  y: {
                    repeat: Infinity,
                    duration: 5.2 + idx * 0.8,
                    ease: "easeInOut",
                  },
                }}
                onClick={() => setActiveId(card.id)}
                className="w-full cursor-pointer"
              >
                <div
                  className={`p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 text-left ${
                    isActive
                      ? isDark
                        ? "bg-[#111022] border-2 shadow-xl shadow-purple-500/20 scale-[1.02]"
                        : "bg-white border-2 shadow-xl shadow-purple-500/10 scale-[1.02]"
                      : isDark
                      ? "bg-[#0d0d1b]/80 border border-white/10 hover:border-white/25 hover:bg-[#121226]"
                      : "bg-white/85 border border-slate-200/80 hover:border-slate-300 hover:bg-white shadow-xs hover:shadow-md"
                  }`}
                  style={{
                    borderColor: isActive ? card.accentColor : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span
                      className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: card.accentBg,
                        color: card.accentColor,
                        border: `1px solid ${card.accentBorder}`,
                      }}
                    >
                      {card.theme}
                    </span>
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: card.accentBg,
                        color: card.accentColor,
                      }}
                    >
                      <span className="material-symbols-outlined text-base">{card.icon}</span>
                    </span>
                  </div>

                  <p className={`text-sm font-serif italic leading-relaxed mb-3 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    &ldquo;{card.quote}&rdquo;
                  </p>

                  <div className={`pt-2 border-t flex items-center justify-between ${isDark ? "border-white/10" : "border-slate-100"}`}>
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{card.author}</h4>
                      <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{card.role}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: card.accentColor }} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

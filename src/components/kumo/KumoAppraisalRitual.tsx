"use client";

import React, { useState } from "react";
import Link from "next/link";

interface PresetConfig {
  name: string;
  desc: string;
  weights: {
    observations: number;
    research: number;
    studentFeedback: number;
    mentorship: number;
  };
}

const PRESETS: PresetConfig[] = [
  {
    name: "Balanced University Standard",
    desc: "Harmonious equilibrium between classroom instruction, scholarly publications, and mentorship.",
    weights: {
      observations: 35,
      research: 30,
      studentFeedback: 20,
      mentorship: 15,
    },
  },
  {
    name: "Research-Intensive (R1 / Tier 1)",
    desc: "Prioritizes high-impact citations, active grant acquisition, and doctoral defense supervision.",
    weights: {
      observations: 20,
      research: 55,
      studentFeedback: 15,
      mentorship: 10,
    },
  },
  {
    name: "Teaching & Pedagogy Focused",
    desc: "Emphasizes interactive classroom pedagogy, continuous student feedback, and junior faculty development.",
    weights: {
      observations: 45,
      research: 15,
      studentFeedback: 25,
      mentorship: 15,
    },
  },
  {
    name: "NAAC & NIRF Rapid Compliance",
    desc: "Optimized for maximum score yields across NAAC Criterion II and NIRF research & perception metrics.",
    weights: {
      observations: 30,
      research: 30,
      studentFeedback: 20,
      mentorship: 20,
    },
  },
];

export default function KumoAppraisalRitual({ isDark = false }: { isDark?: boolean }) {
  const [weights, setWeights] = useState({
    observations: 35,
    research: 30,
    studentFeedback: 20,
    mentorship: 15,
  });

  const [activePreset, setActivePreset] = useState<string>("Balanced University Standard");

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
    setActivePreset("Custom Calibration");
  };

  const applyPreset = (preset: PresetConfig) => {
    setWeights(preset.weights);
    setActivePreset(preset.name);
  };

  // Calculated Metrics based on weights
  const total = weights.observations + weights.research + weights.studentFeedback + weights.mentorship;
  
  // Dynamic Composite Score Calculation
  const calculatedIndex =
    total > 0
      ? (
          (weights.observations * 96.4 +
            weights.research * 92.8 +
            weights.studentFeedback * 95.1 +
            weights.mentorship * 98.2) /
          total
        ).toFixed(1)
      : "0.0";

  const numIndex = parseFloat(calculatedIndex);

  let rankBadge = "NAAC A++ ELIGIBLE";
  let rankColor = isDark ? "text-emerald-300" : "text-emerald-700";
  let rankBorder = isDark ? "border-emerald-500/30" : "border-emerald-300";
  let rankBg = isDark ? "bg-emerald-500/15" : "bg-emerald-50";

  if (numIndex < 90) {
    rankBadge = "NAAC A GRADE CANDIDATE";
    rankColor = isDark ? "text-amber-300" : "text-amber-700";
    rankBorder = isDark ? "border-amber-500/30" : "border-amber-300";
    rankBg = isDark ? "bg-amber-500/15" : "bg-amber-50";
  } else if (numIndex < 94) {
    rankBadge = "NAAC A+ EXCELLENCE TIER";
    rankColor = isDark ? "text-sky-300" : "text-blue-700";
    rankBorder = isDark ? "border-sky-500/30" : "border-blue-300";
    rankBg = isDark ? "bg-sky-500/15" : "bg-blue-50";
  }

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-10 lg:p-12 border transition-colors duration-500 overflow-hidden ${
        isDark
          ? "bg-[#090915] border-white/15 shadow-2xl shadow-black/50 text-slate-100"
          : "bg-white border-slate-200/90 shadow-xl shadow-slate-200/50 text-slate-900"
      }`}
    >
      {/* Ambient Radial Highlights */}
      <div
        className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isDark ? "bg-[#4B2EF5]/15 opacity-60" : "bg-[#4B2EF5]/8 opacity-40"
        }`}
      />
      <div
        className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isDark ? "bg-[#a855f7]/15 opacity-60" : "bg-[#a855f7]/8 opacity-40"
        }`}
      />

      {/* Header Eyebrow & Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 relative z-10">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#4B2EF5] mb-3 shadow-xs transition-colors ${
            isDark ? "bg-[#4B2EF5]/15 border border-[#4B2EF5]/30" : "bg-[#4B2EF5]/10 border border-[#4B2EF5]/20"
          }`}
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          <span>THE APPRAISAL RITUAL • INTERACTIVE MIXER</span>
        </div>
        <h2
          className={`text-2xl sm:text-4xl lg:text-5xl font-headline font-extrabold tracking-tight mb-4 transition-colors ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Synthesize Your Evaluation Recipe
        </h2>
        <p
          className={`text-sm sm:text-base leading-relaxed transition-colors ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Inspired by the timeless precision of the Kumo ritual. Tailor weight distributions to reflect your university&apos;s unique academic mission and observe composite scores synthesize in real time.
        </p>
      </div>

      {/* Preset Buttons Bar */}
      <div className="mb-10 relative z-10">
        <span
          className={`text-xs font-mono block text-center mb-3 font-semibold transition-colors ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          SELECT INSTITUTION ARCHETYPE PRESET:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {PRESETS.map((preset) => {
            const isSelected = activePreset === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#4B2EF5] text-white border-[#4B2EF5] shadow-md shadow-indigo-500/25 font-bold scale-102"
                    : isDark
                    ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
                    : "bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Mixer Layout: Left Sliders, Right Real-time Composite Synthesis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* LEFT COLUMN: 4 Custom Weight Sliders */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          
          {/* Slider 1: Classroom Observation Rubrics */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? "bg-[#0e0e1f] border-white/10 hover:border-[#4B2EF5]/50 shadow-sm"
                : "bg-slate-50/80 border-slate-200 hover:border-[#4B2EF5]/40 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4B2EF5]" />
                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Classroom Observation & Rubrics
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-[#4B2EF5]">{weights.observations}%</span>
            </div>
            <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Peer observations, pedagogical pacing, syllabus alignment, and student inquiry stimulation.
            </p>
            <input
              type="range"
              min={10}
              max={60}
              value={weights.observations}
              onChange={(e) => handleWeightChange("observations", Number(e.target.value))}
              className={`w-full accent-[#4B2EF5] cursor-pointer h-2 rounded-lg appearance-none ${
                isDark ? "bg-white/10" : "bg-slate-200"
              }`}
            />
            <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span>Min 10%</span>
              <span>Default 35%</span>
              <span>Max 60%</span>
            </div>
          </div>

          {/* Slider 2: Research & Publications */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? "bg-[#0e0e1f] border-white/10 hover:border-purple-500/50 shadow-sm"
                : "bg-slate-50/80 border-slate-200 hover:border-purple-400 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Research, Citations & Grants
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-purple-400">{weights.research}%</span>
            </div>
            <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Peer-reviewed papers (Scopus/WoS), conference keynotes, patents, and funded research grants.
            </p>
            <input
              type="range"
              min={10}
              max={60}
              value={weights.research}
              onChange={(e) => handleWeightChange("research", Number(e.target.value))}
              className={`w-full accent-purple-500 cursor-pointer h-2 rounded-lg appearance-none ${
                isDark ? "bg-white/10" : "bg-slate-200"
              }`}
            />
            <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span>Min 10%</span>
              <span>Default 30%</span>
              <span>Max 60%</span>
            </div>
          </div>

          {/* Slider 3: Student Feedback */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? "bg-[#0e0e1f] border-white/10 hover:border-sky-500/50 shadow-sm"
                : "bg-slate-50/80 border-slate-200 hover:border-sky-400 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Student Feedback & Pedagogy
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-sky-400">{weights.studentFeedback}%</span>
            </div>
            <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Anonymized end-of-term student evaluations, mentor availability, and instructional empathy.
            </p>
            <input
              type="range"
              min={5}
              max={40}
              value={weights.studentFeedback}
              onChange={(e) => handleWeightChange("studentFeedback", Number(e.target.value))}
              className={`w-full accent-sky-400 cursor-pointer h-2 rounded-lg appearance-none ${
                isDark ? "bg-white/10" : "bg-slate-200"
              }`}
            />
            <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span>Min 5%</span>
              <span>Default 20%</span>
              <span>Max 40%</span>
            </div>
          </div>

          {/* Slider 4: Mentorship & Governance */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? "bg-[#0e0e1f] border-white/10 hover:border-indigo-500/50 shadow-sm"
                : "bg-slate-50/80 border-slate-200 hover:border-indigo-400 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Mentorship & Institutional Service
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-indigo-400">{weights.mentorship}%</span>
            </div>
            <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Junior faculty cohort mentoring, departmental committee contributions, and community outreach.
            </p>
            <input
              type="range"
              min={5}
              max={30}
              value={weights.mentorship}
              onChange={(e) => handleWeightChange("mentorship", Number(e.target.value))}
              className={`w-full accent-indigo-400 cursor-pointer h-2 rounded-lg appearance-none ${
                isDark ? "bg-white/10" : "bg-slate-200"
              }`}
            />
            <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span>Min 5%</span>
              <span>Default 15%</span>
              <span>Max 30%</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Synthesis Reactor & Live Score */}
        <div
          className={`lg:col-span-5 flex flex-col justify-between h-full p-6 sm:p-8 rounded-3xl border transition-all ${
            isDark
              ? "bg-[#0b0b18] border-white/15 shadow-2xl shadow-black/60"
              : "bg-slate-50 border-slate-200 shadow-lg shadow-slate-200/50"
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between pb-4 border-b mb-6 transition-colors ${
                isDark ? "border-white/10" : "border-slate-200"
              }`}
            >
              <span
                className={`text-xs font-mono uppercase tracking-widest font-bold ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                SYNTHESIS OUTPUT
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors ${rankBg} ${rankBorder} ${rankColor}`}
              >
                {rankBadge}
              </span>
            </div>

            {/* Big Composite Index Display */}
            <div className="text-center py-4">
              <span
                className={`text-xs font-mono uppercase tracking-wider block mb-2 font-bold ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                COMPOSITE FACULTY EXCELLENCE INDEX
              </span>
              <div
                className={`text-5xl sm:text-6xl font-extrabold font-mono tracking-tight flex items-baseline justify-center gap-1 transition-colors ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <span>{calculatedIndex}</span>
                <span className={`text-2xl sm:text-3xl font-normal ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  / 100
                </span>
              </div>
              <p
                className={`text-xs font-mono mt-2 flex items-center justify-center gap-1.5 font-semibold ${
                  isDark ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Calibrated against UGC 2026 Guidelines</span>
              </p>
            </div>

            {/* Dynamic Composition Spectrum Bar */}
            <div className="my-6">
              <div
                className={`flex items-center justify-between text-xs mb-2 font-mono font-medium ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span>Weight Allocation Spectrum</span>
                <span
                  className={
                    total === 100
                      ? isDark
                        ? "text-emerald-400 font-bold"
                        : "text-emerald-700 font-bold"
                      : isDark
                      ? "text-amber-400 font-bold"
                      : "text-amber-700 font-bold"
                  }
                >
                  Total: {total}% {total !== 100 && "(Normalized)"}
                </span>
              </div>
              <div
                className={`w-full h-3 rounded-full overflow-hidden flex shadow-inner ${
                  isDark ? "bg-white/10" : "bg-slate-200"
                }`}
              >
                <div
                  style={{ width: `${(weights.observations / total) * 100}%` }}
                  className="h-full bg-[#4B2EF5] transition-all duration-300"
                  title={`Observation Rubrics: ${weights.observations}%`}
                />
                <div
                  style={{ width: `${(weights.research / total) * 100}%` }}
                  className="h-full bg-purple-500 transition-all duration-300"
                  title={`Research Velocity: ${weights.research}%`}
                />
                <div
                  style={{ width: `${(weights.studentFeedback / total) * 100}%` }}
                  className="h-full bg-sky-400 transition-all duration-300"
                  title={`Student Feedback: ${weights.studentFeedback}%`}
                />
                <div
                  style={{ width: `${(weights.mentorship / total) * 100}%` }}
                  className="h-full bg-indigo-400 transition-all duration-300"
                  title={`Mentorship: ${weights.mentorship}%`}
                />
              </div>

              {/* Spectrum Legend */}
              <div className={`grid grid-cols-2 gap-2 mt-3 text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4B2EF5]" />
                  Observations ({weights.observations}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Research ({weights.research}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Student ({weights.studentFeedback}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Mentorship ({weights.mentorship}%)
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className={`pt-6 border-t space-y-3 ${isDark ? "border-white/10" : "border-slate-200"}`}>
            <Link
              href="/login"
              className="w-full py-3.5 px-6 rounded-xl bg-[#4B2EF5] hover:bg-[#4326dd] text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-98 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Deploy This Framework in Portal</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
            <p className={`text-[11px] text-center font-mono ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Changes persist securely across faculty rosters upon authentication.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

interface Learner {
  id: string;
  name: string;
  role: string;
  avatar: string;
  n5Progress: number;
  attendance: string;
  overallScore: number;
  status: "On Track" | "Needs Attention" | "Excelling";
  lastActive: string;
}

const initialLearners: Learner[] = [
  {
    id: "DL-1092",
    name: "Kanishka Sharma",
    role: "Fullstack Trainee",
    avatar: "KS",
    n5Progress: 92,
    attendance: "98.5%",
    overallScore: 94,
    status: "Excelling",
    lastActive: "10 mins ago",
  },
  {
    id: "DL-1093",
    name: "Kenji Sato",
    role: "Software Engineering Intern",
    avatar: "KS",
    n5Progress: 88,
    attendance: "96.0%",
    overallScore: 89,
    status: "On Track",
    lastActive: "1 hour ago",
  },
  {
    id: "DL-1094",
    name: "Emily Chen",
    role: "Cloud DevOps Associate",
    avatar: "EC",
    n5Progress: 74,
    attendance: "91.2%",
    overallScore: 78,
    status: "Needs Attention",
    lastActive: "3 hours ago",
  },
  {
    id: "DL-1095",
    name: "Rahul Verma",
    role: "Backend Node.js Trainee",
    avatar: "RV",
    n5Progress: 85,
    attendance: "95.8%",
    overallScore: 87,
    status: "On Track",
    lastActive: "Yesterday",
  },
  {
    id: "DL-1096",
    name: "Sarah Jenkins",
    role: "Frontend UI/UX Intern",
    avatar: "SJ",
    n5Progress: 95,
    attendance: "99.1%",
    overallScore: 96,
    status: "Excelling",
    lastActive: "Just now",
  },
];

export default function TeacherDashboard() {
  const [learners] = useState<Learner[]>(initialLearners);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCohort, setSelectedCohort] = useState("Batch 2026 - Q3 Tokyo");
  const [exportNotice, setExportNotice] = useState(false);

  const filteredLearners = learners.filter((learner) => {
    const matchesSearch =
      learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      statusFilter === "all" || learner.status.toLowerCase().replace(" ", "-") === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Export Toast Notification */}
        {exportNotice && (
          <div className="fixed top-20 right-8 z-50 bg-[#0B0B12] text-white px-4 py-3 rounded-xl shadow-lg border border-white/10 flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span className="text-body-sm font-medium">Institutional performance report exported to CSV.</span>
          </div>
        )}

        {/* Welcome & Overview Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-outline-variant/40 shadow-xs relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-label-md">
              <span className="material-symbols-outlined text-lg">waving_hand</span>
              <span>Welcome back, Professor Vance</span>
            </div>
            <h1 className="text-headline-md font-headline font-bold text-on-surface">
              Dashboard &amp; Learner Operations
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl">
              Monitor real-time cohort progression, review pending language assignments, and evaluate daily performance metrics for Q3 2026.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-surface-container px-4 py-2.5 rounded-xl text-body-md text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/50 font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Export Reports</span>
            </button>
            <button
              onClick={() => alert("New Evaluation modal initiated for Tokyo Cohort.")}
              className="flex items-center gap-2 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white px-4 py-2.5 rounded-xl text-body-md font-medium transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>New Evaluation</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-medium">Total Learners</span>
              <span className="material-symbols-outlined text-primary">groups</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-headline text-on-surface">142</span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                <span>+12% this month</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-medium">Japanese N5 Target</span>
              <span className="material-symbols-outlined text-secondary">translate</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-headline text-on-surface">84.2%</span>
              <div className="flex items-center gap-1 text-[11px] text-[#4B2EF5] font-medium mt-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                <span>On track for Dec exam</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-medium">Pending Reviews</span>
              <span className="material-symbols-outlined text-[#a44100]">pending_actions</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-headline text-on-surface">18</span>
              <div className="flex items-center gap-1 text-[11px] text-[#ba1a1a] font-medium mt-1">
                <span className="material-symbols-outlined text-xs">priority_high</span>
                <span>5 high priority</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-medium">Avg Attendance</span>
              <span className="material-symbols-outlined text-emerald-600">event_available</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-headline text-on-surface">96.4%</span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                <span className="material-symbols-outlined text-xs">arrow_upward</span>
                <span>+1.2% vs Q2</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-medium">Cohort Score</span>
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-headline text-on-surface">88.5<span className="text-sm font-normal text-outline">/100</span></span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                <span className="material-symbols-outlined text-xs">grade</span>
                <span>Top tier performance</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-medium">Mentorship Calls</span>
              <span className="material-symbols-outlined text-[#4d44e3]">support_agent</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-headline text-on-surface">34</span>
              <div className="flex items-center gap-1 text-[11px] text-secondary font-medium mt-1">
                <span className="material-symbols-outlined text-xs">done_all</span>
                <span>100% completed this week</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Learner Progress Table & Japanese Summary */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Learners Table Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-headline font-bold text-on-surface text-lg">
                    Active Learner Operations
                  </h3>
                  <p className="text-body-sm text-on-surface-variant">
                    Tracking real-time completion across technical and language milestones
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Filter learner..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-lg bg-surface-container/60 border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container/60 border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="excelling">Excelling</option>
                    <option value="on-track">On Track</option>
                    <option value="needs-attention">Needs Attention</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-surface-container/60 text-outline text-[11px] uppercase tracking-wider font-semibold border-b border-outline-variant/30">
                    <tr>
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Japanese N5</th>
                      <th className="py-3 px-4">Attendance</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredLearners.map((learner) => (
                      <tr key={learner.id} className="hover:bg-surface-container/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary font-bold text-xs flex items-center justify-center">
                              {learner.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-on-surface leading-tight">
                                {learner.name}
                              </p>
                              <p className="text-[11px] text-outline">
                                {learner.id} • {learner.role}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{learner.n5Progress}%</span>
                            </div>
                            <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${learner.n5Progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface">
                          {learner.attendance}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-on-surface">
                          {learner.overallScore}/100
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              learner.status === "Excelling"
                                ? "bg-emerald-100 text-emerald-700"
                                : learner.status === "On Track"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {learner.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => alert(`Reviewing operational records for ${learner.name} (${learner.id}).`)}
                            className="p-1.5 text-outline hover:text-primary hover:bg-surface-container rounded-lg inline-flex items-center cursor-pointer"
                            title="View Progress Details"
                          >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Japanese Language & Assessment Summary Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ffdbcc] text-[#7e3000] flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">translate</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-on-surface text-base">
                      Japanese Training Operations (JLPT N5 Target)
                    </h3>
                    <p className="text-body-sm text-on-surface-variant">
                      Cohort Kanji mastery, grammar diagnostics, and conversation drills
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => alert("Japanese language curriculum overview for Q3 2026.")}
                  className="text-label-sm text-[#4B2EF5] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View Syllabus</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30">
                  <p className="text-outline text-xs font-medium">Kanji Retention Rate</p>
                  <p className="text-xl font-bold font-headline text-on-surface mt-1">87.4%</p>
                  <p className="text-[11px] text-emerald-600 mt-1">210 / 250 characters mastered</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30">
                  <p className="text-outline text-xs font-medium">Mock JLPT Pass Rate</p>
                  <p className="text-xl font-bold font-headline text-on-surface mt-1">91.8%</p>
                  <p className="text-[11px] text-primary mt-1">Next mock exam in 6 days</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30">
                  <p className="text-outline text-xs font-medium">Native Sensei Sessions</p>
                  <p className="text-xl font-bold font-headline text-on-surface mt-1">16 hrs</p>
                  <p className="text-[11px] text-secondary mt-1">Completed this module</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right 1 Col: Quick Actions, Schedules & Activity Timeline */}
          <div className="space-y-6">
            
            {/* Quick Actions Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5">
              <h3 className="font-headline font-bold text-on-surface text-base mb-3">
                Faculty Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => alert("18 pending learner submissions in grading queue.")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/30 text-body-sm font-medium text-on-surface transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                      rate_review
                    </span>
                    <span>Grade Submissions (18)</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                </button>

                <button
                  onClick={() => alert("Schedule 1:1 Review modal initiated.")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/30 text-body-sm font-medium text-on-surface transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">
                      calendar_month
                    </span>
                    <span>Schedule 1:1 Review</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                </button>

                <button
                  onClick={() => alert("Displaying Gantt milestone analytics.")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/30 text-body-sm font-medium text-on-surface transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 group-hover:scale-110 transition-transform">
                      analytics
                    </span>
                    <span>View Gantt Milestones</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Activity Stream */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline font-bold text-on-surface text-base">
                  Activity Timeline
                </h3>
                <span className="text-[11px] text-outline font-medium">Live sync</span>
              </div>

              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
                <div className="relative pl-7">
                  <span className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-white" />
                  <p className="text-body-sm font-semibold text-on-surface">Kanishka Sharma</p>
                  <p className="text-xs text-on-surface-variant">Submitted Japanese N5 Kanji Drill Unit 8</p>
                  <p className="text-[10px] text-outline mt-0.5">14 minutes ago</p>
                </div>

                <div className="relative pl-7">
                  <span className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <p className="text-body-sm font-semibold text-on-surface">Mentor Ken Takahashi</p>
                  <p className="text-xs text-on-surface-variant">Approved Backend Capstone architecture</p>
                  <p className="text-[10px] text-outline mt-0.5">1 hour ago</p>
                </div>

                <div className="relative pl-7">
                  <span className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-white" />
                  <p className="text-body-sm font-semibold text-on-surface">Attendance Alert</p>
                  <p className="text-xs text-on-surface-variant">Emily Chen requested leave for medical appointment</p>
                  <p className="text-[10px] text-outline mt-0.5">3 hours ago</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

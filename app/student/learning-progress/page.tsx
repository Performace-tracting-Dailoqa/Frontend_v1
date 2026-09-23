"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/animations/CountUp";

interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: "High" | "Urgent" | "Normal";
  progress: number;
  dueDate: string;
  status: "in-progress" | "review" | "completed";
  assignee: string;
  notes: string;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "TSK-301",
    title: "Implement Next.js App Router Architecture & Tailwind Tokens",
    category: "Frontend Architecture",
    priority: "High",
    progress: 92,
    dueDate: "Tomorrow",
    status: "in-progress",
    assignee: "Kanishka Sharma",
    notes: "Integrated design tokens from DESIGN.md and ensured 60fps responsive navigation.",
  },
  {
    id: "TSK-302",
    title: "FastAPI REST Endpoint Integration with PyJWT Authentication",
    category: "Backend Services",
    priority: "Urgent",
    progress: 85,
    dueDate: "In 2 days",
    status: "in-progress",
    assignee: "Kanishka Sharma",
    notes: "Connecting login form to /auth/login and handling token persistence.",
  },
  {
    id: "TSK-303",
    title: "Cloud Native Microservices Architecture & Container Registry",
    category: "Cloud Infrastructure",
    priority: "Normal",
    progress: 78,
    dueDate: "Friday",
    status: "in-progress",
    assignee: "Kanishka Sharma",
    notes: "Configured multi-stage Dockerfile and local compose environment.",
  },
  {
    id: "TSK-304",
    title: "Automated Vitest & Playwright E2E Flow Coverage",
    category: "Quality Engineering",
    priority: "Normal",
    progress: 100,
    dueDate: "Sep 18, 2026",
    status: "completed",
    assignee: "Kanishka Sharma",
    notes: "Passed 14 unit tests for rubric score calculations.",
  },
  {
    id: "TSK-305",
    title: "CI/CD GitHub Actions Workflow for Turbopack Production Build",
    category: "DevOps",
    priority: "High",
    progress: 90,
    dueDate: "In review",
    status: "review",
    assignee: "Dr. Tanaka (Reviewer)",
    notes: "PR #42 submitted, awaiting final sign-off.",
  },
  {
    id: "TSK-306",
    title: "Docker Containerization & Multi-stage Buildfile",
    category: "Cloud Architecture",
    priority: "Normal",
    progress: 100,
    dueDate: "Sep 12, 2026",
    status: "completed",
    assignee: "Kanishka Sharma",
    notes: "Reduced Docker image size to under 120MB using Alpine base.",
  },
];

const COURSES = [
  {
    id: "c1",
    title: "Advanced Software Engineering & Clean Architecture",
    provider: "Coursera • Duke University",
    progress: 92,
    badge: "92% Completed",
    certificateReady: false,
    color: "text-primary",
  },
  {
    id: "c2",
    title: "React Native & Cross-Platform Enterprise UI",
    provider: "Coursera • Meta",
    progress: 75,
    badge: "Module 4 of 5",
    certificateReady: false,
    color: "text-sky-600",
  },
  {
    id: "c3",
    title: "Data Structures & Algorithmic Problem Solving",
    provider: "Coursera • Stanford Online",
    progress: 100,
    badge: "Verified Certificate 🏅",
    certificateReady: true,
    color: "text-emerald-700",
  },
  {
    id: "c4",
    title: "Cloud Microservices & Distributed Event Systems",
    provider: "Coursera • AWS Training",
    progress: 60,
    badge: "3 Modules Left",
    certificateReady: false,
    color: "text-purple-600",
  },
];

export default function StudentLearningProgressPage() {
  const [selectedJourney, setSelectedJourney] = useState<"internship" | "cloud">("internship");
  const [taskFilter, setTaskFilter] = useState<"all" | "in-progress" | "review" | "completed">("all");
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTaskToUpdate, setActiveTaskToUpdate] = useState<TaskItem | null>(null);
  const [updatePercent, setUpdatePercent] = useState(85);
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = taskFilter === "all" || t.status === taskFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenUpdateModal = (task: TaskItem) => {
    setActiveTaskToUpdate(task);
    setUpdatePercent(task.progress);
    setUpdateNotes(task.notes);
    setIsModalOpen(true);
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskToUpdate) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskToUpdate.id
          ? {
              ...t,
              progress: updatePercent,
              notes: updateNotes,
              status: updatePercent === 100 ? "completed" : t.status,
            }
          : t
      )
    );

    setUpdateSuccess(true);
    setTimeout(() => {
      setUpdateSuccess(false);
      setIsModalOpen(false);
    }, 1200);
  };

  const priorityColors = {
    Urgent: "bg-red-50 text-red-700 border-red-200",
    High: "bg-amber-50 text-amber-700 border-amber-200",
    Normal: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="space-y-space-lg">
      
      {/* ========================================================= */}
      {/* HEADER WITH TITLE & PROGRESS BADGE                        */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-6 sm:p-space-xl rounded-3xl border border-surface-container-highest/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed text-label-sm font-bold rounded-lg uppercase tracking-wider">
              Curriculum Roadmap
            </span>
            <span className="text-body-sm text-on-surface-variant font-medium">Sprint 6 of 8</span>
          </div>
          <h1 className="font-headline font-bold text-headline-lg text-on-surface">
            My Learning Progress
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Track your engineering workflows and technical milestone achievements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block font-medium">Combined Velocity</span>
            <span className="text-headline-sm font-bold text-primary font-mono">
              <CountUp to={86.4} decimals={1} duration={1.6} suffix="% Completed" />
            </span>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-mono font-bold text-headline-sm shadow-sm"
          >
            <CountUp to={86} duration={1.5} suffix="%" />
          </motion.div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2 PRIMARY JOURNEY SELECTOR CARDS                          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md sm:gap-space-lg">
        
        {/* Journey 1: Internship / Normal Journey */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => setSelectedJourney("internship")}
          className={`p-6 sm:p-space-lg rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-xs ${
            selectedJourney === "internship"
              ? "bg-white border-primary ring-2 ring-primary/20 shadow-md"
              : "bg-white/70 border-slate-200/80 hover:border-primary/40 hover:bg-white"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">
                Primary Track
              </span>
              <span className="material-symbols-outlined text-primary text-2xl">computer</span>
            </div>
            <h3 className="text-headline-sm text-slate-900 font-bold mb-1">
              Internship / Technical Journey
            </h3>
            <p className="text-body-sm text-slate-600 mb-4">
              Fullstack TypeScript, Next.js architecture, cloud microservices, and peer code reviews.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-body-sm font-medium">
                <span className="text-slate-800">Curriculum Completion</span>
                <span className="text-primary font-mono font-bold">
                  <CountUp to={88} duration={1.5} suffix="%" />
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "88%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="bg-primary h-full rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/80 font-medium">
            <span>6 Active Workflows</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Sprint on Schedule
            </span>
          </div>
        </motion.div>

        {/* Journey 2: Cloud Native & Architecture Journey */}
        <div
          onClick={() => setSelectedJourney("cloud")}
          className={`p-6 sm:p-space-lg rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-xs ${
            selectedJourney === "cloud"
              ? "bg-surface-container-low border-purple-500 ring-2 ring-purple-500/20 shadow-md"
              : "bg-surface-container-low/60 border-surface-container-highest hover:border-purple-400 hover:bg-surface-container-low"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                Architecture Track
              </span>
              <span className="material-symbols-outlined text-purple-600 text-2xl">cloud_sync</span>
            </div>
            <h3 className="text-headline-sm text-on-surface font-bold mb-1">
              Cloud Native &amp; Systems Track
            </h3>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Containerization, Kubernetes pods, microservices observability, and automated CI/CD deployments.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-body-sm font-medium">
                <span className="text-on-surface">Curriculum Completion</span>
                <span className="text-purple-700 font-mono font-bold">78%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: "78%" }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-3 border-t border-surface-container-highest/60 font-medium">
            <span>4 Completed Modules</span>
            <span className="text-purple-700 font-bold">
              Sprint 6 Active ✓
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* ASSIGNED TASKS & WORKFLOWS TABLE / CARDS                 */}
      {/* ========================================================= */}
      <div className="bg-surface-container-low p-6 sm:p-space-lg rounded-2xl border border-surface-container-highest/60 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-space-lg">
          <div>
            <h3 className="text-headline-sm text-on-surface font-bold">
              Assigned Tasks &amp; Workflows
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Manage progress updates, attach PR links, and submit completed criteria to mentors
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex items-center bg-surface-container px-3 py-1.5 rounded-xl gap-2 text-body-sm">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">search</span>
              <input
                type="text"
                placeholder="Filter tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-on-surface focus:outline-none w-32 sm:w-44"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-surface-container-highest/40">
              {(["all", "in-progress", "review", "completed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-label-sm font-semibold capitalize transition-all ${
                    taskFilter === filter
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-body-md">
              No tasks match your filter criteria.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-surface-container-highest/80 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-on-surface-variant">
                      {task.id}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                      {task.category}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${priorityColors[task.priority]}`}>
                      {task.priority} Priority
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Due: <strong className="text-on-surface">{task.dueDate}</strong>
                    </span>
                  </div>

                  <h4 className="text-body-lg font-bold text-on-surface mb-1">
                    {task.title}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2">
                    {task.notes}
                  </p>
                </div>

                {/* Progress & Action */}
                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                  <div className="w-32">
                    <div className="flex justify-between text-xs font-mono font-bold text-on-surface mb-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          task.progress === 100 ? "bg-emerald-600" : "bg-primary"
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenUpdateModal(task)}
                    className="px-4 py-2 bg-primary-fixed hover:bg-primary text-on-primary-fixed hover:text-on-primary rounded-xl text-label-sm font-semibold transition-all border border-primary/20"
                  >
                    Update Progress
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* COURSERA LEARNING & MILESTONE TIMELINE                   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md sm:gap-space-lg">
        
        {/* Left: Coursera Learning (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-low p-6 sm:p-space-lg rounded-2xl border border-surface-container-highest/60 shadow-xs">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <h3 className="text-headline-sm text-on-surface font-bold">Coursera Certifications</h3>
              <p className="text-body-sm text-on-surface-variant">Curated academic and cloud engineering certificates</p>
            </div>
            <span className="text-xs font-mono font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full">
              4 Enrolled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COURSES.map((course) => (
              <div
                key={course.id}
                className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest/80 flex flex-col justify-between hover:translate-y-[-2px] transition-all shadow-2xs group"
              >
                <div>
                  <span className="text-[11px] font-mono text-on-surface-variant block mb-1">
                    {course.provider}
                  </span>
                  <h4 className="text-body-md font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-container">
                  <div className="flex justify-between text-xs font-mono font-bold mb-1.5">
                    <span className={course.color}>{course.badge}</span>
                    <span className="text-on-surface">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        course.progress === 100 ? "bg-emerald-600" : "bg-primary"
                      }`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Milestone Timeline (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-low p-6 sm:p-space-lg rounded-2xl border border-surface-container-highest/60 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-headline-sm text-on-surface font-bold mb-1">Milestone Timeline</h3>
            <p className="text-body-sm text-on-surface-variant mb-6">Key evaluation gates for academic year 2026</p>

            <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
              
              {/* Milestone 1 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <h4 className="text-body-md font-bold text-on-surface">Q1 Foundation &amp; Architecture</h4>
                <p className="text-body-sm text-on-surface-variant">Cleared with Grade A+ • 100% attendance</p>
                <span className="text-[11px] font-mono text-emerald-700 font-bold block mt-0.5">Completed Jan 2026</span>
              </div>

              {/* Milestone 2 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <h4 className="text-body-md font-bold text-on-surface">Q2 Mid-Year Review &amp; Kanji N5</h4>
                <p className="text-body-sm text-on-surface-variant">Self-evaluation &amp; mentor appraisal approved</p>
                <span className="text-[11px] font-mono text-emerald-700 font-bold block mt-0.5">Completed Jun 2026</span>
              </div>

              {/* Milestone 3 - CURRENT */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary ring-4 ring-primary-fixed" />
                <h4 className="text-body-md font-bold text-primary">Q3 Performance Sprint &amp; N4 Prep</h4>
                <p className="text-body-sm text-on-surface-variant">In progress • 86% goals achieved to date</p>
                <span className="text-[11px] font-mono text-primary font-bold block mt-0.5">Active Cycle • Ends Sep 30</span>
              </div>

              {/* Milestone 4 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-surface-container-highest" />
                <h4 className="text-body-md font-semibold text-on-surface-variant">Q4 Final Dossier &amp; Placement Gate</h4>
                <p className="text-body-sm text-on-surface-variant">Comprehensive portfolio review &amp; sponsor showcase</p>
                <span className="text-[11px] font-mono text-on-surface-variant block mt-0.5">Scheduled Dec 2026</span>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-surface-container-highest/60 mt-6 text-center">
            <span className="text-xs text-on-surface-variant font-mono">
              Timeline synced with Academic Dean Review Calendar
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE UPDATE PROGRESS MODAL                         */}
      {/* ========================================================= */}
      {isModalOpen && activeTaskToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-surface-container-highest shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-highest/60 mb-6">
              <div>
                <span className="text-xs font-mono font-bold text-primary uppercase">Update Workflow</span>
                <h3 className="text-headline-sm font-bold text-on-surface">{activeTaskToUpdate.title}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {updateSuccess ? (
              <div className="py-8 text-center text-emerald-700 space-y-2">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
                <h4 className="text-headline-sm font-bold">Progress Updated Successfully!</h4>
                <p className="text-body-sm text-on-surface-variant">Mentors have been notified of your latest sprint submission.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveUpdate} className="space-y-4">
                <div>
                  <div className="flex justify-between text-body-sm font-semibold mb-2">
                    <label>Completion Percentage</label>
                    <span className="font-mono text-primary">{updatePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={updatePercent}
                    onChange={(e) => setUpdatePercent(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-on-surface-variant font-mono mt-1">
                    <span>0% Started</span>
                    <span>50% In Progress</span>
                    <span>100% Done</span>
                  </div>
                </div>

                <div>
                  <label className="text-body-sm font-semibold block mb-1.5">Progress Notes / Artifacts</label>
                  <textarea
                    rows={3}
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Describe what you completed, PR links, test coverage, or any current blockers..."
                    className="w-full p-3 rounded-xl bg-surface-container text-on-surface border border-surface-container-highest focus:outline-none focus:border-primary text-body-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-highest/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-label-md font-semibold text-on-surface-variant hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-label-md font-semibold shadow-sm"
                  >
                    Save &amp; Notify Mentors
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

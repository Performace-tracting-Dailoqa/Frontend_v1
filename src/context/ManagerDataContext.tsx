"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  ManagerTeam,
  TeamMember,
  Workflow,
  WorkflowTask,
  ManagerProgressSummary,
  fetchManagerTeams,
  fetchManagerTeam,
  fetchWorkflows,
  fetchManagerTasks,
  fetchManagerProgressSummary,
} from "@/services/workflowService";
import { getAuthToken } from "@/utils/auth";

interface ManagerDataContextType {
  teams: ManagerTeam[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  allTasks: WorkflowTask[];
  progressSummary: ManagerProgressSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetchedAt: number | null;
  error: string | null;
  refreshData: (options?: { force?: boolean }) => Promise<void>;
  updateWorkflowInState: (workflow: Workflow) => void;
  removeWorkflowFromState: (workflowId: string) => void;
  addTaskToState: (task: WorkflowTask) => void;
  removeTaskFromState: (taskId: string) => void;
  updateTaskInState: (task: WorkflowTask) => void;
}

const ManagerDataContext = createContext<ManagerDataContextType | undefined>(undefined);

// 1 Hour TTL in Milliseconds (3,600,000 ms)
const CACHE_TTL_MS = 60 * 60 * 1000;

function getManagerCacheKey(): string {
  if (typeof window === "undefined") return "dailoqa_mgr_cache_v3";
  try {
    const sessionRaw = localStorage.getItem("dailoqa_pms_profile_session") || localStorage.getItem("dailoqa_pms_auth_session");
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      const uid = parsed?.user?.id || parsed?.user?.email;
      if (uid) return `dailoqa_mgr_cache_v3_${uid}`;
    }
  } catch {}
  return "dailoqa_mgr_cache_v3_default";
}

interface CachedPayload {
  teams: ManagerTeam[];
  teamMembers: TeamMember[];
  workflows: Workflow[];
  allTasks: WorkflowTask[];
  progressSummary: ManagerProgressSummary | null;
  lastFetchedAt: number;
}

export function ManagerDataProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<ManagerTeam[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [allTasks, setAllTasks] = useState<WorkflowTask[]>([]);
  const [progressSummary, setProgressSummary] = useState<ManagerProgressSummary | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load from Storage Cache (sessionStorage)
  const loadFromStorage = useCallback((): CachedPayload | null => {
    if (typeof window === "undefined") return null;
    try {
      const key = getManagerCacheKey();
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed: CachedPayload = JSON.parse(raw);
      if (parsed && typeof parsed.lastFetchedAt === "number") {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to read manager data cache:", e);
    }
    return null;
  }, []);

  // Save to Storage Cache
  const saveToStorage = useCallback((data: CachedPayload) => {
    if (typeof window === "undefined") return;
    try {
      const key = getManagerCacheKey();
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to write manager data cache:", e);
    }
  }, []);

  // Master Fetch Function (Fetch once an hour or force on manual refresh)
  const fetchData = useCallback(
    async (options?: { force?: boolean }) => {
      const isForce = options?.force === true;

      // If forced, clear existing cache
      if (isForce && typeof window !== "undefined") {
        try {
          const key = getManagerCacheKey();
          sessionStorage.removeItem(key);
        } catch {}
      }

      // 1. Check if we can use cached data (less than 1 hour old and non-empty)
      if (!isForce) {
        const cached = loadFromStorage();
        if (
          cached &&
          Date.now() - cached.lastFetchedAt < CACHE_TTL_MS &&
          cached.teams &&
          cached.teams.length > 0
        ) {
          setTeams(cached.teams || []);
          setTeamMembers(cached.teamMembers || []);
          setWorkflows(cached.workflows || []);
          setAllTasks(cached.allTasks || []);
          setProgressSummary(cached.progressSummary || null);
          setLastFetchedAt(cached.lastFetchedAt);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fetch fresh data from backend
      try {
        if (isForce) {
          setIsRefreshing(true);
        } else if (!lastFetchedAt) {
          setIsLoading(true);
        }
        setError(null);

        const [teamsRes, membersRes, workflowsRes, tasksRes, progressRes] = await Promise.allSettled([
          fetchManagerTeams(),
          fetchManagerTeam(),
          fetchWorkflows(1, 100),
          fetchManagerTasks(1, 100),
          fetchManagerProgressSummary(),
        ]);

        const newTeams = teamsRes.status === "fulfilled" && teamsRes.value ? teamsRes.value : [];
        const newMembers = membersRes.status === "fulfilled" && membersRes.value ? membersRes.value : [];
        const newWorkflows =
          workflowsRes.status === "fulfilled" && workflowsRes.value?.items ? workflowsRes.value.items : [];
        const newTasks = tasksRes.status === "fulfilled" && tasksRes.value?.items ? tasksRes.value.items : [];
        const newProgress = progressRes.status === "fulfilled" && progressRes.value ? progressRes.value : null;

        const timestamp = Date.now();

        // Update Context State
        setTeams(newTeams);
        setTeamMembers(newMembers);
        setWorkflows(newWorkflows);
        setAllTasks(newTasks);
        setProgressSummary(newProgress);
        setLastFetchedAt(timestamp);

        // Update Storage Cache
        saveToStorage({
          teams: newTeams,
          teamMembers: newMembers,
          workflows: newWorkflows,
          allTasks: newTasks,
          progressSummary: newProgress,
          lastFetchedAt: timestamp,
        });
      } catch (err: unknown) {
        console.warn("Failed to fetch manager data batch:", err);
        setError(err instanceof Error ? err.message : "Failed to load latest dashboard data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [lastFetchedAt, loadFromStorage, saveToStorage]
  );

  // Initial load: fetch or read from cache
  useEffect(() => {
    fetchData({ force: false });
  }, [fetchData]);

  // Hourly Background Interval (Fetch once every 1 hour when idle)
  useEffect(() => {
    const hourlyTimer = setInterval(() => {
      fetchData({ force: false });
    }, CACHE_TTL_MS);

    return () => clearInterval(hourlyTimer);
  }, [fetchData]);

  // Optimistic State Mutators
  const updateWorkflowInState = useCallback((workflow: Workflow) => {
    setWorkflows((prev) => {
      const exists = prev.some((w) => w.id === workflow.id);
      if (exists) {
        return prev.map((w) => (w.id === workflow.id ? workflow : w));
      }
      return [workflow, ...prev];
    });
  }, []);

  const removeWorkflowFromState = useCallback((workflowId: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
    setAllTasks((prev) => prev.filter((t) => t.workflow_id !== workflowId));
  }, []);

  const addTaskToState = useCallback((task: WorkflowTask) => {
    setAllTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
  }, []);

  const removeTaskFromState = useCallback((taskId: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const updateTaskInState = useCallback((task: WorkflowTask) => {
    setAllTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }, []);

  const value = useMemo(
    () => ({
      teams,
      teamMembers,
      workflows,
      allTasks,
      progressSummary,
      isLoading,
      isRefreshing,
      lastFetchedAt,
      error,
      refreshData: (opts?: { force?: boolean }) => fetchData({ force: opts?.force ?? true }),
      updateWorkflowInState,
      removeWorkflowFromState,
      addTaskToState,
      removeTaskFromState,
      updateTaskInState,
    }),
    [
      teams,
      teamMembers,
      workflows,
      allTasks,
      progressSummary,
      isLoading,
      isRefreshing,
      lastFetchedAt,
      error,
      fetchData,
      updateWorkflowInState,
      removeWorkflowFromState,
      addTaskToState,
      removeTaskFromState,
      updateTaskInState,
    ]
  );

  return <ManagerDataContext.Provider value={value}>{children}</ManagerDataContext.Provider>;
}

export function useManagerData() {
  const context = useContext(ManagerDataContext);
  if (!context) {
    throw new Error("useManagerData must be used within a ManagerDataProvider");
  }
  return context;
}

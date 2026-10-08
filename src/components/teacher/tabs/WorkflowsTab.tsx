"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  fetchTeacherBatches,
  fetchTeacherWorkflows,
  createTeacherWorkflow,
  deleteTeacherWorkflow,
  fetchTeacherWorkflowTasks,
  createTeacherWorkflowTask,
  bulkCreateTeacherWorkflowTasks,
  deleteTeacherWorkflowTask,
  TeacherBatch,
  TeacherWorkflow,
  TeacherWorkflowTask,
  BatchStudentItem,
  fetchBatchJapaneseDetails,
  fetchTeacherEvaluationHistory,
  TeacherEvaluationHistoryItem,
} from "@/services/teacherService";

interface WorkflowsTabProps {
  initialBatchId?: string;
  onNavigateToEvaluations?: (studentId?: string) => void;
}

export interface JapaneseWorkflowMetric {
  id: string;
  category: "Kanji" | "Vocabulary" | "Grammar" | "Listening" | "Speaking" | "Reading" | "Custom";
  jpName: string;
  name: string;
  description: string;
  full_score: number;
  weightage: number;
  selected: boolean;
  color: string;
  icon: string;
}

export const FIXED_JAPANESE_METRICS: JapaneseWorkflowMetric[] = [
  {
    id: "kanji",
    category: "Kanji",
    jpName: "漢字 (Kanji & Radicals)",
    name: "Kanji Recognition & Stroke Order",
    description: "Radical decomposition, stroke order correctness, on'yomi & kun'yomi readings.",
    full_score: 20,
    weightage: 1.0,
    selected: true,
    color: "from-rose-500 to-pink-600",
    icon: "edit_note",
  },
  {
    id: "vocabulary",
    category: "Vocabulary",
    jpName: "語彙 (Vocabulary)",
    name: "Vocabulary & Daily Expressions",
    description: "Retention of lesson vocabulary, antonyms, compound words & phrase usage.",
    full_score: 20,
    weightage: 1.0,
    selected: true,
    color: "from-amber-500 to-orange-600",
    icon: "translate",
  },
  {
    id: "grammar",
    category: "Grammar",
    jpName: "文法 (Grammar & Particles)",
    name: "Sentence Patterns & Particle Accuracy",
    description: "Minna no Nihongo bunkei patterns, particle accuracy (は, が, を, に, で), verb conjugations.",
    full_score: 25,
    weightage: 1.0,
    selected: true,
    color: "from-emerald-500 to-teal-600",
    icon: "psychology",
  },
  {
    id: "listening",
    category: "Listening",
    jpName: "聴解 (Listening Comprehension)",
    name: "Audio Comprehension & Dialogue Speed",
    description: "Audio comprehension, answering conversation questions, transcribing audio drills.",
    full_score: 20,
    weightage: 1.0,
    selected: false,
    color: "from-sky-500 to-blue-600",
    icon: "hearing",
  },
  {
    id: "speaking",
    category: "Speaking",
    jpName: "会話・敬語 (Speaking & Keigo)",
    name: "Oral Fluency & Honorific Speech",
    description: "Classroom kaiwa, pronunciation accuracy, te-form conversational drills, polite keigo.",
    full_score: 15,
    weightage: 1.0,
    selected: false,
    color: "from-violet-500 to-purple-600",
    icon: "record_voice_over",
  },
  {
    id: "reading",
    category: "Reading",
    jpName: "読解 (Reading Comprehension)",
    name: "Text Comprehension & Dokkai Passage",
    description: "Reading passages, extracting key information, answering comprehension questions accurately.",
    full_score: 20,
    weightage: 1.0,
    selected: false,
    color: "from-indigo-500 to-cyan-600",
    icon: "menu_book",
  },
];

const WORKFLOW_PRESETS = [
  {
    name: "Kanji Test & Mondai Homework",
    description: "Daily kanji character writing/reading drill followed by chapter grammatical mondai exercises.",
    defaultMetrics: ["kanji", "vocabulary", "grammar"],
  },
  {
    name: "Minna no Nihongo Lesson Assessment",
    description: "Core textbook exercises covering sentence patterns (bunkei), example sentences (reibun), and renshuu.",
    defaultMetrics: ["grammar", "vocabulary", "reading"],
  },
  {
    name: "JLPT N5 Weekly Milestone Tasks",
    description: "Comprehensive weekly benchmark tests covering vocabulary, grammar particles, and listening drills.",
    defaultMetrics: ["kanji", "vocabulary", "grammar", "listening", "speaking"],
  },
  {
    name: "Kaiwa & Listening Comprehension Drill",
    description: "Oral dialogue exercises and audio question answering drills for conversational mastery.",
    defaultMetrics: ["listening", "speaking", "vocabulary"],
  },
];

const TASK_PRESETS = [
  {
    title: "Kanji Test - N5 Characters (Writing & Reading)",
    description: "Write kanji with correct stroke order and provide on'yomi/kun'yomi readings with sample vocabulary.",
    linkedMetric: "kanji",
  },
  {
    title: "Mondai Homework - Chapter Grammar Exercises",
    description: "Complete all textbook workbook questions (Mondai 1-6) and submit handwritten or typed answers.",
    linkedMetric: "grammar",
  },
  {
    title: "Vocabulary & Flashcard Review",
    description: "Review 30 key vocabulary terms for the upcoming lesson and practice antonyms/synonyms.",
    linkedMetric: "vocabulary",
  },
  {
    title: "Dokkai (Reading Comprehension) Assignment",
    description: "Read the short passage and answer 5 comprehension questions using appropriate grammatical structures.",
    linkedMetric: "reading",
  },
  {
    title: "Choukai (Listening) Audio Quiz",
    description: "Listen to the dialogue tracks and transcribe key phrases with their English/Hindi translations.",
    linkedMetric: "listening",
  },
];

// Helper to get or infer metrics for a workflow
function getStoredWorkflowMetrics(workflowId: string, workflowName?: string): JapaneseWorkflowMetric[] {
  if (typeof window === "undefined") return FIXED_JAPANESE_METRICS;
  const key = `teacher_workflow_metrics_${workflowId}`;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }

  // Fallback: Infer based on name or preset match
  const nameLower = (workflowName || "").toLowerCase();
  let defaultActive = ["kanji", "vocabulary", "grammar"];
  if (nameLower.includes("kaiwa") || nameLower.includes("speaking") || nameLower.includes("listening")) {
    defaultActive = ["listening", "speaking", "vocabulary"];
  } else if (nameLower.includes("milestone") || nameLower.includes("weekly")) {
    defaultActive = ["kanji", "vocabulary", "grammar", "listening", "speaking"];
  } else if (nameLower.includes("lesson") || nameLower.includes("dokkai") || nameLower.includes("reading")) {
    defaultActive = ["grammar", "vocabulary", "reading"];
  }

  return FIXED_JAPANESE_METRICS.map((m) => ({
    ...m,
    selected: defaultActive.includes(m.id),
  }));
}

export default function WorkflowsTab({
  initialBatchId,
  onNavigateToEvaluations,
}: WorkflowsTabProps) {
  // Batches
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || "all");
  const [batchStudents, setBatchStudents] = useState<BatchStudentItem[]>([]);

  // Workflows
  const [workflows, setWorkflows] = useState<TeacherWorkflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected / Active Workflow
  const [activeWorkflow, setActiveWorkflow] = useState<TeacherWorkflow | null>(null);
  const [activeWorkflowMetrics, setActiveWorkflowMetrics] = useState<JapaneseWorkflowMetric[]>([]);
  const [activeViewMode, setActiveViewMode] = useState<"students" | "tasks">("students");

  const [tasks, setTasks] = useState<TeacherWorkflowTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Modals
  const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
  const [wfName, setWfName] = useState("");
  const [wfDescription, setWfDescription] = useState("");
  const [wfBatchId, setWfBatchId] = useState("");
  const [wfStartDate, setWfStartDate] = useState("");
  const [wfEndDate, setWfEndDate] = useState("");
  const [wfRubricMetrics, setWfRubricMetrics] = useState<JapaneseWorkflowMetric[]>(FIXED_JAPANESE_METRICS);
  const [customMetricName, setCustomMetricName] = useState("");
  const [customMetricScore, setCustomMetricScore] = useState<number>(20);
  const [showAddCustomMetric, setShowAddCustomMetric] = useState(false);
  const [isSubmittingWf, setIsSubmittingWf] = useState(false);

  // Rubric Edit Modal for Existing Workflow
  const [isEditRubricModalOpen, setIsEditRubricModalOpen] = useState(false);

  // Create Task Modal State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<string>("medium");
  const [taskAssignMode, setTaskAssignMode] = useState<"all" | "single">("all");
  const [taskStudentId, setTaskStudentId] = useState<string>("");
  const [taskLinkedMetric, setTaskLinkedMetric] = useState<string>("all");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);

  // Evaluation History for Batch Students
  const [batchEvaluations, setBatchEvaluations] = useState<TeacherEvaluationHistoryItem[]>([]);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);

  // Load Batches
  useEffect(() => {
    fetchTeacherBatches()
      .then((b) => {
        setBatches(b);
        if (b.length > 0 && !wfBatchId) {
          setWfBatchId(b[0].id);
        }
      })
      .catch((err) => console.error("Failed to load teacher batches:", err));
  }, []);

  // Load Workflows
  const loadWorkflows = async () => {
    setIsLoadingWorkflows(true);
    setWorkflowError(null);
    try {
      const data = await fetchTeacherWorkflows(selectedBatchId === "all" ? undefined : selectedBatchId);
      const items = data.items || [];
      setWorkflows(items);
      // If currently active workflow exists in new list, update it; otherwise auto-select first workflow
      if (activeWorkflow) {
        const found = items.find((w) => w.id === activeWorkflow.id);
        if (found) {
          setActiveWorkflow(found);
          const metrics = getStoredWorkflowMetrics(found.id, found.name);
          setActiveWorkflowMetrics(metrics);
        } else if (items.length > 0) {
          setActiveWorkflow(items[0]);
          const metrics = getStoredWorkflowMetrics(items[0].id, items[0].name);
          setActiveWorkflowMetrics(metrics);
        }
      } else if (items.length > 0) {
        setActiveWorkflow(items[0]);
        const metrics = getStoredWorkflowMetrics(items[0].id, items[0].name);
        setActiveWorkflowMetrics(metrics);
      }
    } catch (err: any) {
      setWorkflowError(err.message || "Failed to load workflows");
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, [selectedBatchId]);

  // Function to load batch evaluation history
  const loadBatchEvaluations = async (batchId?: string | null) => {
    if (!batchId) {
      setBatchEvaluations([]);
      return;
    }
    setIsLoadingEvaluations(true);
    try {
      const data = await fetchTeacherEvaluationHistory(batchId);
      setBatchEvaluations(data || []);
    } catch (err) {
      console.error("Failed to load batch evaluation history:", err);
    } finally {
      setIsLoadingEvaluations(false);
    }
  };

  // Load Tasks and batch students when activeWorkflow changes
  useEffect(() => {
    if (!activeWorkflow) {
      setTasks([]);
      setActiveWorkflowMetrics([]);
      setBatchEvaluations([]);
      return;
    }

    // Load workflow specific metrics
    const metrics = getStoredWorkflowMetrics(activeWorkflow.id, activeWorkflow.name);
    setActiveWorkflowMetrics(metrics);

    setIsLoadingTasks(true);
    fetchTeacherWorkflowTasks(activeWorkflow.id)
      .then((res) => setTasks(res.items || []))
      .catch((err) => console.error("Failed to load workflow tasks:", err))
      .finally(() => setIsLoadingTasks(false));

    // Load batch students for task assignment & student metrics view
    const isUuid = Boolean(
      activeWorkflow.batch_id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeWorkflow.batch_id)
    );
    if (isUuid && activeWorkflow.batch_id) {
      fetchBatchJapaneseDetails(activeWorkflow.batch_id)
        .then((res) => {
          const students = res.students || [];
          setBatchStudents(students);
          if (students.length > 0 && !taskStudentId) {
            setTaskStudentId(students[0].id);
          }
        })
        .catch((err) => console.error("Failed to load batch students:", err));

      loadBatchEvaluations(activeWorkflow.batch_id);
    }
  }, [activeWorkflow]);

  // Selected metrics for the active workflow
  const selectedActiveMetrics = useMemo(() => {
    return activeWorkflowMetrics.filter((m) => m.selected);
  }, [activeWorkflowMetrics]);

  // Total max score of active workflow's selected metrics
  const activeWorkflowTotalScore = useMemo(() => {
    return selectedActiveMetrics.reduce((sum, m) => sum + (m.full_score || 0), 0);
  }, [selectedActiveMetrics]);

  // Map latest evaluation for each student
  const studentLatestEvalMap = useMemo(() => {
    const map: Record<string, TeacherEvaluationHistoryItem> = {};
    batchEvaluations.forEach((evalItem) => {
      if (!map[evalItem.student_id]) {
        map[evalItem.student_id] = evalItem;
      }
    });
    return map;
  }, [batchEvaluations]);

  // Helper to extract student's score for a specific workflow metric
  const getStudentMetricScore = (studentId: string, metric: JapaneseWorkflowMetric) => {
    const evalItem = studentLatestEvalMap[studentId];
    if (!evalItem) return null;

    // 1. Try finding in evalItem.metrics
    if (evalItem.metrics && evalItem.metrics.length > 0) {
      const metricMatch = evalItem.metrics.find((em) => {
        const emCat = (em.category || "").trim().toLowerCase();
        const emName = (em.name || "").trim().toLowerCase();
        const targetCat = (metric.category || "").trim().toLowerCase();
        const targetName = (metric.name || "").trim().toLowerCase();
        const targetId = (metric.id || "").trim().toLowerCase();

        return (
          emCat === targetCat ||
          emCat === targetId ||
          emName === targetName ||
          (emCat && targetCat && (emCat.includes(targetCat) || targetCat.includes(emCat)))
        );
      });

      if (metricMatch && metricMatch.score !== undefined && metricMatch.score !== null) {
        return {
          score: metricMatch.score,
          full_score: metricMatch.full_score || metric.full_score,
          date: evalItem.evaluation_date,
          percentage: Math.round((metricMatch.score / (metricMatch.full_score || metric.full_score || 100)) * 100),
        };
      }
    }

    // 2. Try finding in category_scores
    if (evalItem.category_scores) {
      const catKey = Object.keys(evalItem.category_scores).find((k) =>
        k.trim().toLowerCase() === metric.category.trim().toLowerCase() ||
        k.trim().toLowerCase() === metric.id.trim().toLowerCase()
      );
      if (catKey !== undefined && evalItem.category_scores[catKey] !== undefined) {
        const pct = evalItem.category_scores[catKey];
        const scaledScore = Math.round(((pct / 100) * metric.full_score) * 10) / 10;
        return {
          score: scaledScore,
          full_score: metric.full_score,
          date: evalItem.evaluation_date,
          percentage: Math.round(pct),
        };
      }
    }

    return null;
  };

  // Modal metric toggle & changes
  const toggleMetricSelection = (metricId: string) => {
    setWfRubricMetrics((prev) =>
      prev.map((m) => (m.id === metricId ? { ...m, selected: !m.selected } : m))
    );
  };

  const updateMetricScore = (metricId: string, score: number) => {
    setWfRubricMetrics((prev) =>
      prev.map((m) => (m.id === metricId ? { ...m, full_score: Math.max(1, score) } : m))
    );
  };

  const handleAddCustomMetric = () => {
    if (!customMetricName.trim()) return;
    const newMetric: JapaneseWorkflowMetric = {
      id: `custom_${Date.now()}`,
      category: "Custom",
      jpName: `特別項目 (${customMetricName.trim()})`,
      name: customMetricName.trim(),
      description: "Teacher custom Japanese learning metric.",
      full_score: customMetricScore || 20,
      weightage: 1.0,
      selected: true,
      color: "from-purple-500 to-indigo-600",
      icon: "stars",
    };
    setWfRubricMetrics((prev) => [...prev, newMetric]);
    setCustomMetricName("");
    setCustomMetricScore(20);
    setShowAddCustomMetric(false);
  };

  // Apply preset to modal
  const handleApplyPreset = (preset: typeof WORKFLOW_PRESETS[0]) => {
    setWfName(preset.name);
    setWfDescription(preset.description);
    setWfRubricMetrics((prev) =>
      prev.map((m) => ({
        ...m,
        selected: preset.defaultMetrics.includes(m.id),
      }))
    );
  };

  // Handle Create Workflow
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;

    const selectedMetrics = wfRubricMetrics.filter((m) => m.selected);
    if (selectedMetrics.length === 0) {
      alert("Please select at least one Japanese metric for this workflow.");
      return;
    }

    setIsSubmittingWf(true);
    try {
      const targetBatch = wfBatchId || (batches.length > 0 ? batches[0].id : undefined);
      const created = await createTeacherWorkflow({
        name: wfName.trim(),
        description: wfDescription.trim() || undefined,
        batch_id: targetBatch,
        start_date: wfStartDate || undefined,
        end_date: wfEndDate || undefined,
      });

      // Persist the selected metrics for this newly created workflow
      if (typeof window !== "undefined" && created?.id) {
        localStorage.setItem(`teacher_workflow_metrics_${created.id}`, JSON.stringify(wfRubricMetrics));
      }

      setIsCreateWorkflowModalOpen(false);
      setWfName("");
      setWfDescription("");
      setWfStartDate("");
      setWfEndDate("");
      setWfRubricMetrics(FIXED_JAPANESE_METRICS);

      await loadWorkflows();
      setActiveWorkflow(created);
      setActiveWorkflowMetrics(wfRubricMetrics);
    } catch (err: any) {
      alert(err.message || "Failed to create workflow");
    } finally {
      setIsSubmittingWf(false);
    }
  };

  // Handle Save Edited Rubric for Active Workflow
  const handleSaveEditedRubric = () => {
    if (!activeWorkflow) return;
    const selected = activeWorkflowMetrics.filter((m) => m.selected);
    if (selected.length === 0) {
      alert("Please select at least one Japanese metric for this workflow.");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `teacher_workflow_metrics_${activeWorkflow.id}`,
        JSON.stringify(activeWorkflowMetrics)
      );
    }
    setIsEditRubricModalOpen(false);
  };

  // Handle Delete Workflow
  const handleDeleteWorkflow = async (wfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow and all its tasks?")) return;

    try {
      await deleteTeacherWorkflow(wfId);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`teacher_workflow_metrics_${wfId}`);
      }
      if (activeWorkflow?.id === wfId) {
        setActiveWorkflow(null);
      }
      await loadWorkflows();
    } catch (err: any) {
      alert(err.message || "Failed to delete workflow");
    }
  };

  // Handle Create Task / Bulk Homework
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkflow || !taskTitle.trim()) return;

    setIsSubmittingTask(true);
    setTaskModalError(null);

    try {
      const metricBadge =
        taskLinkedMetric !== "all"
          ? activeWorkflowMetrics.find((m) => m.id === taskLinkedMetric)?.name
          : undefined;

      const fullDescription = [
        taskDescription.trim(),
        metricBadge ? `[Focus Metric: ${metricBadge}]` : "",
      ]
        .filter(Boolean)
        .join(" - ");

      if (taskAssignMode === "all") {
        const studentIds = batchStudents.map((s) => s.id);
        if (studentIds.length === 0) {
          throw new Error("No students found in this batch to assign tasks to.");
        }

        await bulkCreateTeacherWorkflowTasks(activeWorkflow.id, {
          title: taskTitle.trim(),
          description: fullDescription || undefined,
          due_date: taskDueDate || undefined,
          priority: taskPriority,
          student_ids: studentIds,
        });
      } else {
        if (!taskStudentId) {
          throw new Error("Please select a student to assign the task to.");
        }

        await createTeacherWorkflowTask(activeWorkflow.id, {
          title: taskTitle.trim(),
          description: fullDescription || undefined,
          student_id: taskStudentId,
          due_date: taskDueDate || undefined,
          priority: taskPriority,
        });
      }

      setIsCreateTaskModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskPriority("medium");
      setTaskLinkedMetric("all");

      // Reload tasks
      const res = await fetchTeacherWorkflowTasks(activeWorkflow.id);
      setTasks(res.items || []);
    } catch (err: any) {
      setTaskModalError(err.message || "Failed to assign task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!activeWorkflow || !confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTeacherWorkflowTask(activeWorkflow.id, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(err.message || "Failed to delete task");
    }
  };

  // Trigger evaluation with only the workflow's selected metrics
  const handleTriggerEvaluationForStudent = (studentId: string) => {
    if (typeof window !== "undefined" && activeWorkflow) {
      const payload = {
        workflowId: activeWorkflow.id,
        workflowName: activeWorkflow.name,
        batchName: activeWorkflow.batch_name,
        selectedMetrics: selectedActiveMetrics,
      };
      localStorage.setItem("teacher_active_eval_metrics", JSON.stringify(payload));
    }

    if (onNavigateToEvaluations) {
      onNavigateToEvaluations(studentId);
    }
  };

  // Filtered workflows by search query
  const filteredWorkflows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return workflows;
    return workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.batch_name && w.batch_name.toLowerCase().includes(q))
    );
  }, [workflows, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4B2EF5] font-semibold text-xs">
            <span className="material-symbols-outlined text-base">assignment</span>
            <span>JAPANESE WORKFLOWS &amp; RUBRIC MANAGEMENT</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">
            Japanese Workflows &amp; Learning Rubrics
          </h2>
          <p className="text-xs text-on-surface-variant max-w-2xl">
            Create structured curriculum workflows with fixed Japanese learning metrics (Kanji, Vocabulary, Grammar, Listening, Speaking, Reading), assign homework &amp; tests, and grade students on selected criteria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Batch Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-xl text-xs font-medium text-slate-700 shadow-2xs">
            <span className="material-symbols-outlined text-sm text-[#4B2EF5]">school</span>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setActiveWorkflow(null);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              aria-label="Filter workflows by batch"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.department || "Japanese"})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              if (selectedBatchId !== "all") {
                setWfBatchId(selectedBatchId);
              } else if (batches.length > 0) {
                setWfBatchId(batches[0].id);
              }
              setWfRubricMetrics(FIXED_JAPANESE_METRICS);
              setIsCreateWorkflowModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Japanese Workflow</span>
          </button>
        </div>
      </div>

      {/* Main Content: Split Grid if Workflow Selected or List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workflows List (Col 4 or 12) */}
        <div className={`${activeWorkflow ? "lg:col-span-4" : "lg:col-span-12"} space-y-4`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">account_tree</span>
              <span>Workflows ({filteredWorkflows.length})</span>
            </h3>

            <div className="w-48 sm:w-56">
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {isLoadingWorkflows ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/40 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-primary animate-spin">sync</span>
              <p className="text-xs text-on-surface-variant font-medium">Loading workflows...</p>
            </div>
          ) : workflowError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
              {workflowError}
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="p-10 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60 space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4B2EF5] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">post_add</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">No Workflows Created Yet</p>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                  Create your first Japanese curriculum workflow with fixed Japanese metrics to assign Kanji tests and Mondai homework sets to your learners.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWfRubricMetrics(FIXED_JAPANESE_METRICS);
                  setIsCreateWorkflowModalOpen(true);
                }}
                className="px-4 py-2 bg-[#4B2EF5] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Create Workflow</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWorkflows.map((wf) => {
                const isSelected = activeWorkflow?.id === wf.id;
                const wfMetrics = getStoredWorkflowMetrics(wf.id, wf.name).filter((m) => m.selected);

                return (
                  <div
                    key={wf.id}
                    onClick={() => setActiveWorkflow(wf)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? "bg-white border-[#4B2EF5] shadow-md ring-2 ring-[#4B2EF5]/10"
                        : "bg-surface-container-lowest border-outline-variant/40 hover:border-[#4B2EF5]/40 hover:bg-surface-container/30 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-on-surface group-hover:text-[#4B2EF5] transition-colors truncate">
                            {wf.name}
                          </h4>
                          {wf.batch_name && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4B2EF5]/10 text-[#4B2EF5]">
                              {wf.batch_name}
                            </span>
                          )}
                        </div>

                        {wf.description && (
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                            {wf.description}
                          </p>
                        )}

                        {/* Workflow Metric Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {wfMetrics.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              <span className="material-symbols-outlined text-[12px]">{m.icon}</span>
                              <span>{m.category}</span>
                              <span className="text-[9px] text-indigo-500 font-normal">({m.full_score}p)</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteWorkflow(wf.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete workflow"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#4B2EF5]">calendar_today</span>
                        <span>{new Date(wf.created_at).toLocaleDateString()}</span>
                      </span>

                      <span className="font-semibold text-[#4B2EF5] flex items-center gap-0.5 group-hover:underline">
                        <span>View Workflow &amp; Learners</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Workflow Details & Students (Col 8) */}
        {activeWorkflow && (
          <div className="lg:col-span-8 space-y-4 animate-in slide-in-from-right-4 duration-200">
            {/* Active Workflow Header Card */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-[#4B2EF5] uppercase tracking-wider">
                      Selected Workflow
                    </span>
                    {activeWorkflow.batch_name && (
                      <span className="text-xs font-semibold text-slate-500">
                        Batch: <strong>{activeWorkflow.batch_name}</strong>
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">{activeWorkflow.name}</h3>
                  {activeWorkflow.description && (
                    <p className="text-xs text-on-surface-variant max-w-xl">{activeWorkflow.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="px-3.5 py-2 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_task</span>
                    <span>Assign Task / Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveWorkflow(null)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-surface-container transition-colors cursor-pointer"
                    title="Close detail view"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Japanese Rubric Breakdown: ONLY Selected Metrics */}
              <div className="pt-3 border-t border-outline-variant/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4B2EF5] text-base">fact_check</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Workflow Japanese Rubric &amp; Active Metrics
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#4B2EF5]">
                      Total: {activeWorkflowTotalScore} pts ({selectedActiveMetrics.length} metrics)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditRubricModalOpen(true)}
                    className="text-[11px] font-bold text-[#4B2EF5] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">tune</span>
                    <span>Customize Rubric</span>
                  </button>
                </div>

                {/* Selected Metrics Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2.5">
                  {selectedActiveMetrics.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">{m.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{m.category}</p>
                          <p className="text-[10px] text-slate-500 truncate">{m.jpName.split("(")[0]}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#4B2EF5]">{m.full_score}</span>
                        <span className="text-[10px] text-slate-400"> pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Switcher: Students vs Deliverables */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveViewMode("students")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeViewMode === "students"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "bg-surface-container text-slate-600 hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">groups</span>
                  <span>Batch Learners ({batchStudents.length}) &amp; Selected Metrics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveViewMode("tasks")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeViewMode === "tasks"
                      ? "bg-[#4B2EF5] text-white shadow-xs"
                      : "bg-surface-container text-slate-600 hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">checklist</span>
                  <span>Assigned Deliverables ({tasks.length})</span>
                </button>
              </div>
            </div>

            {/* TAB VIEW 1: STUDENTS & ONLY SELECTED WORKFLOW METRICS */}
            {activeViewMode === "students" && (
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#4B2EF5] text-base">how_to_reg</span>
                      <span>Workflow Learner Roster &amp; Rubric Scoring</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Showing recorded performance for the {selectedActiveMetrics.length} selected Japanese metrics configured for this workflow.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => activeWorkflow?.batch_id && loadBatchEvaluations(activeWorkflow.batch_id)}
                      disabled={isLoadingEvaluations}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-[#4B2EF5] bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant/40 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Refresh student evaluation scores"
                    >
                      <span className={`material-symbols-outlined text-sm ${isLoadingEvaluations ? "animate-spin" : ""}`}>
                        sync
                      </span>
                      <span>{isLoadingEvaluations ? "Syncing..." : "Sync Scores"}</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {batchStudents.length} Students
                    </span>
                  </div>
                </div>

                {batchStudents.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container rounded-xl border border-dashed border-outline-variant/60 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-slate-400">group_off</span>
                    <p className="text-xs font-bold text-slate-700">No students enrolled in this batch</p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-2xl overflow-hidden">
                    {batchStudents.map((st) => {
                      const latestEval = studentLatestEvalMap[st.id];
                      return (
                        <div
                          key={st.id}
                          className="p-4 hover:bg-surface-container/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                        >
                          {/* Student Info */}
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center font-bold text-xs">
                                {st.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-xs text-on-surface">{st.name}</h5>
                                  {latestEval ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                      <span>Grade: {latestEval.percentage}%</span>
                                      <span className="opacity-75 font-normal">({latestEval.evaluation_date})</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                      Pending Evaluation
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">{st.enrollment_no}</p>
                              </div>
                            </div>

                            {/* Selected Metrics Display with Student's Real Marks */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {selectedActiveMetrics.map((m) => {
                                const scoreData = getStudentMetricScore(st.id, m);
                                const isScored = scoreData !== null;
                                return (
                                  <div
                                    key={m.id}
                                    className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-[11px] transition-colors ${
                                      isScored
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-2xs"
                                        : "bg-surface-container border-outline-variant/40"
                                    }`}
                                  >
                                    <span
                                      className={`material-symbols-outlined text-[13px] ${
                                        isScored ? "text-emerald-600 dark:text-emerald-400" : "text-[#4B2EF5]"
                                      }`}
                                    >
                                      {m.icon}
                                    </span>
                                    <span className="font-semibold text-slate-700">{m.category}:</span>
                                    {isScored ? (
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {scoreData.score} / {m.full_score}p
                                      </span>
                                    ) : (
                                      <span className="font-bold text-slate-400">-- / {m.full_score}p</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action: Grade / Evaluate Rubric */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleTriggerEvaluationForStudent(st.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                latestEval
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white"
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {latestEval ? "edit_note" : "grade"}
                              </span>
                              <span>{latestEval ? "Re-evaluate / Update Rubric" : "Evaluate Selected Rubric"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB VIEW 2: TASKS / DELIVERABLES */}
            {activeViewMode === "tasks" && (
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#4B2EF5] text-base">checklist</span>
                    <span>Assigned Deliverables &amp; Tests ({tasks.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {tasks.filter((t) => t.status === "completed" || t.status === "evaluated").length} of {tasks.length} completed
                  </span>
                </div>

                {isLoadingTasks ? (
                  <div className="p-8 text-center flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-primary animate-spin">sync</span>
                    <p className="text-xs text-on-surface-variant font-medium">Loading assigned tasks...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container rounded-xl border border-dashed border-outline-variant/60 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-slate-400">task</span>
                    <p className="text-xs font-bold text-slate-700">No tasks assigned in this workflow yet</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Click <strong>&ldquo;Assign Task / Test&rdquo;</strong> to give Kanji tests, Mondai homework, or grammar drills to your batch learners.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-2xl overflow-hidden">
                    {tasks.map((task) => {
                      const isDone = task.status === "completed" || task.status === "evaluated";
                      const isOverdue =
                        task.due_date && new Date(task.due_date).getTime() < Date.now() && !isDone;

                      return (
                        <div
                          key={task.id}
                          className="p-4 hover:bg-surface-container/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-xs text-on-surface">{task.title}</h5>
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                  isDone
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isOverdue
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {isDone ? "Completed" : isOverdue ? "Overdue" : "Pending"}
                              </span>
                              {task.priority && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  {task.priority.toUpperCase()}
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-on-surface-variant line-clamp-1">{task.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <span className="material-symbols-outlined text-sm text-[#4B2EF5]">person</span>
                                <span>{task.student_name || "Assigned Student"}</span>
                                {task.enrollment_no && <span className="font-mono text-[10px]">({task.enrollment_no})</span>}
                              </span>

                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">event</span>
                                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {task.student_id && (
                              <button
                                type="button"
                                onClick={() => handleTriggerEvaluationForStudent(task.student_id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#4B2EF5]/10 hover:bg-[#4B2EF5] hover:text-white text-[#4B2EF5] text-xs font-semibold transition-all cursor-pointer"
                              >
                                Grade / Evaluate
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete task"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE WORKFLOW MODAL WITH FIXED JAPANESE METRIC SELECTOR (COMPACT, VIEWPORT-FIXED & SCROLLABLE) */}
      {isCreateWorkflowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl md:rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header (Fixed) */}
            <div className="px-5 py-3.5 border-b border-outline-variant/30 flex items-center justify-between shrink-0 bg-surface-container-lowest">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">account_tree</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Create Japanese Workflow</h3>
                  <p className="text-[10px] text-slate-400">Configure parameters &amp; Japanese rubric metrics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateWorkflowModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="create-workflow-form" onSubmit={handleCreateWorkflow} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
              {/* Quick Templates */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Templates</span>
                <div className="flex flex-wrap gap-1">
                  {WORKFLOW_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2 py-0.5 rounded-lg bg-surface-container hover:bg-[#4B2EF5]/10 hover:text-[#4B2EF5] text-[10px] font-medium transition-colors cursor-pointer text-slate-700"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Batch */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Batch *</label>
                <select
                  value={wfBatchId}
                  onChange={(e) => setWfBatchId(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-semibold cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.department || "Japanese"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Workflow Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Workflow Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Oct 8 - Kanji Test 1 & Mondai Homework"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Details of the kanji characters, workbook chapters, or drill requirements..."
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 text-xs"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={wfStartDate}
                    onChange={(e) => setWfStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={wfEndDate}
                    onChange={(e) => setWfEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-mono"
                  />
                </div>
              </div>

              {/* FIXED JAPANESE METRIC SELECTOR SECTION */}
              <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#4B2EF5] text-sm">checklist</span>
                      <span>Fixed Japanese Learning Metrics *</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Toggle criteria and adjust max scores for this workflow.
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-[#4B2EF5]">
                    {wfRubricMetrics.filter((m) => m.selected).reduce((acc, m) => acc + (m.full_score || 0), 0)} pts total
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {wfRubricMetrics.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                        m.selected
                          ? "bg-white border-[#4B2EF5]/60 shadow-2xs"
                          : "bg-surface-container/40 border-outline-variant/30 opacity-60"
                      }`}
                    >
                      <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={m.selected}
                          onChange={() => toggleMetricSelection(m.id)}
                          className="w-3.5 h-3.5 rounded text-[#4B2EF5] accent-[#4B2EF5] focus:ring-0 cursor-pointer shrink-0"
                        />
                        <div className="w-5 h-5 rounded-md bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[11px]">{m.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">
                            {m.name} <span className="text-[9px] text-slate-400 font-normal">({m.jpName.split("(")[0]})</span>
                          </p>
                        </div>
                      </label>

                      {m.selected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <label className="text-[9px] font-semibold text-slate-500">Max:</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={m.full_score}
                            onChange={(e) => updateMetricScore(m.id, parseInt(e.target.value) || 20)}
                            className="w-12 px-1.5 py-0.5 bg-surface-container rounded-md text-[11px] font-bold text-center border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-[#4B2EF5]"
                          />
                          <span className="text-[9px] text-slate-400">pts</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Custom Japanese Metric Form */}
                {showAddCustomMetric ? (
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-200 space-y-2 animate-in fade-in duration-150">
                    <p className="text-[10px] font-bold text-slate-700">Add Custom Japanese Metric</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        placeholder="Metric Name"
                        value={customMetricName}
                        onChange={(e) => setCustomMetricName(e.target.value)}
                        className="col-span-2 px-2 py-1 bg-surface-container rounded-md text-[11px] border border-outline-variant/40"
                      />
                      <input
                        type="number"
                        placeholder="20"
                        value={customMetricScore}
                        onChange={(e) => setCustomMetricScore(parseInt(e.target.value) || 20)}
                        className="px-2 py-1 bg-surface-container rounded-md text-[11px] border border-outline-variant/40 text-center font-bold"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomMetric(false)}
                        className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomMetric}
                        className="px-2.5 py-0.5 bg-[#4B2EF5] text-white text-[10px] font-bold rounded-md cursor-pointer"
                      >
                        Add Metric
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCustomMetric(true)}
                    className="text-[10px] font-bold text-[#4B2EF5] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>+ Add Custom Japanese Metric</span>
                  </button>
                )}
              </div>
            </form>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="px-5 py-3 border-t border-outline-variant/30 bg-surface-container-lowest flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateWorkflowModalOpen(false)}
                className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-workflow-form"
                disabled={isSubmittingWf}
                className="px-4 py-1.5 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingWf ? "Creating..." : "Create Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RUBRIC MODAL FOR ACTIVE WORKFLOW */}
      {isEditRubricModalOpen && activeWorkflow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl md:rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-3.5 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4B2EF5]">tune</span>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Customize Japanese Rubric</h3>
                  <p className="text-[10px] text-slate-400">Workflow: {activeWorkflow.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditRubricModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-2 max-h-72">
              {activeWorkflowMetrics.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                    m.selected
                      ? "bg-white border-[#4B2EF5]/60 shadow-2xs"
                      : "bg-surface-container/40 border-outline-variant/30 opacity-60"
                  }`}
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={m.selected}
                      onChange={() => {
                        setActiveWorkflowMetrics((prev) =>
                          prev.map((item) =>
                            item.id === m.id ? { ...item, selected: !item.selected } : item
                          )
                        );
                      }}
                      className="w-3.5 h-3.5 rounded text-[#4B2EF5] accent-[#4B2EF5] focus:ring-0 cursor-pointer shrink-0"
                    />
                    <div className="w-5 h-5 rounded-md bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[11px]">{m.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">
                        {m.name} <span className="text-[9px] text-slate-400 font-normal">({m.jpName.split("(")[0]})</span>
                      </p>
                    </div>
                  </label>

                  {m.selected && (
                    <div className="flex items-center gap-1 shrink-0">
                      <label className="text-[9px] font-semibold text-slate-500">Max:</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={m.full_score}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 20;
                          setActiveWorkflowMetrics((prev) =>
                            prev.map((item) =>
                              item.id === m.id ? { ...item, full_score: val } : item
                            )
                          );
                        }}
                        className="w-12 px-1.5 py-0.5 bg-surface-container rounded-md text-[11px] font-bold text-center border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-[#4B2EF5]"
                      />
                      <span className="text-[9px] text-slate-400">pts</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-outline-variant/30 bg-surface-container-lowest flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditRubricModalOpen(false)}
                className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedRubric}
                className="px-4 py-1.5 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Save Rubric Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / ASSIGN TASK MODAL (COMPACT, VIEWPORT-FIXED & SCROLLABLE) */}
      {isCreateTaskModalOpen && activeWorkflow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl md:rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-3.5 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4B2EF5]">assignment_add</span>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Assign Task / Homework</h3>
                  <p className="text-[10px] text-slate-400">Workflow: {activeWorkflow.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form id="create-task-form" onSubmit={handleCreateTask} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
              {taskModalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                  {taskModalError}
                </div>
              )}

              {/* Quick Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Presets</span>
                <div className="flex flex-wrap gap-1">
                  {TASK_PRESETS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => {
                        setTaskTitle(p.title);
                        setTaskDescription(p.description);
                        if (selectedActiveMetrics.some((m) => m.id === p.linkedMetric)) {
                          setTaskLinkedMetric(p.linkedMetric);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-surface-container hover:bg-[#4B2EF5]/10 hover:text-[#4B2EF5] text-[10px] font-medium transition-colors cursor-pointer text-slate-700"
                    >
                      + {p.title.split("-")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Assignment Target *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskAssignMode("all")}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      taskAssignMode === "all"
                        ? "bg-[#4B2EF5] text-white border-[#4B2EF5] shadow-xs"
                        : "bg-surface-container text-slate-700 border-outline-variant/40"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">groups</span>
                    <span>All Learners ({batchStudents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskAssignMode("single")}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      taskAssignMode === "single"
                        ? "bg-[#4B2EF5] text-white border-[#4B2EF5] shadow-xs"
                        : "bg-surface-container text-slate-700 border-outline-variant/40"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>Specific Student</span>
                  </button>
                </div>
              </div>

              {taskAssignMode === "single" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Learner *</label>
                  <select
                    value={taskStudentId}
                    onChange={(e) => setTaskStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium cursor-pointer"
                  >
                    {batchStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.enrollment_no})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Link to Workflow Selected Metric */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Focus Metric (from Workflow Rubric)
                </label>
                <select
                  value={taskLinkedMetric}
                  onChange={(e) => setTaskLinkedMetric(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium cursor-pointer"
                >
                  <option value="all">Comprehensive / All Selected Workflow Metrics</option>
                  {selectedActiveMetrics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.category} ({m.jpName.split("(")[0]}) - {m.full_score} pts
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Kanji Test #1 or Mondai Homework Lesson 4"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Task Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-semibold cursor-pointer"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="px-5 py-3 border-t border-outline-variant/30 bg-surface-container-lowest flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-task-form"
                disabled={isSubmittingTask}
                className="px-4 py-1.5 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingTask
                  ? "Assigning..."
                  : taskAssignMode === "all"
                  ? `Assign to All (${batchStudents.length})`
                  : "Assign Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

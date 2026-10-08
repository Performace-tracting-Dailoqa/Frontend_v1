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
} from "@/services/teacherService";

interface WorkflowsTabProps {
  initialBatchId?: string;
  onNavigateToEvaluations?: (studentId?: string) => void;
}

const WORKFLOW_PRESETS = [
  {
    name: "Kanji Test & Mondai Homework",
    description: "Daily kanji character writing/reading drill followed by chapter grammatical mondai exercises.",
  },
  {
    name: "Minna no Nihongo Lesson Assessment",
    description: "Core textbook exercises covering sentence patterns (bunkei), example sentences (reibun), and renshuu.",
  },
  {
    name: "JLPT N5 Weekly Milestone Tasks",
    description: "Comprehensive weekly benchmark tests covering vocabulary, grammar particles, and listening drills.",
  },
  {
    name: "Kaiwa & Listening Comprehension Drill",
    description: "Oral dialogue exercises and audio question answering drills for conversational mastery.",
  },
];

const TASK_PRESETS = [
  {
    title: "Kanji Test - N5 Characters (Writing & Reading)",
    description: "Write kanji with correct stroke order and provide on'yomi/kun'yomi readings with sample vocabulary.",
  },
  {
    title: "Mondai Homework - Chapter Grammar Exercises",
    description: "Complete all textbook workbook questions (Mondai 1-6) and submit handwritten or typed answers.",
  },
  {
    title: "Vocabulary & Flashcard Review",
    description: "Review 30 key vocabulary terms for the upcoming lesson and practice antonyms/synonyms.",
  },
  {
    title: "Dokkai (Reading Comprehension) Assignment",
    description: "Read the short passage and answer 5 comprehension questions using appropriate grammatical structures.",
  },
  {
    title: "Choukai (Listening) Audio Quiz",
    description: "Listen to the dialogue tracks and transcribe key phrases with their English/Hindi translations.",
  },
];

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
  const [tasks, setTasks] = useState<TeacherWorkflowTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Modals
  const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
  const [wfName, setWfName] = useState("");
  const [wfDescription, setWfDescription] = useState("");
  const [wfBatchId, setWfBatchId] = useState("");
  const [wfStartDate, setWfStartDate] = useState("");
  const [wfEndDate, setWfEndDate] = useState("");
  const [isSubmittingWf, setIsSubmittingWf] = useState(false);

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<string>("medium");
  const [taskAssignMode, setTaskAssignMode] = useState<"all" | "single">("all");
  const [taskStudentId, setTaskStudentId] = useState<string>("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);

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
      setWorkflows(data.items || []);
      // If currently active workflow exists in new list, update it
      if (activeWorkflow) {
        const found = (data.items || []).find((w) => w.id === activeWorkflow.id);
        if (found) setActiveWorkflow(found);
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

  // Load Tasks when activeWorkflow changes
  useEffect(() => {
    if (!activeWorkflow) {
      setTasks([]);
      return;
    }

    setIsLoadingTasks(true);
    fetchTeacherWorkflowTasks(activeWorkflow.id)
      .then((res) => setTasks(res.items || []))
      .catch((err) => console.error("Failed to load workflow tasks:", err))
      .finally(() => setIsLoadingTasks(false));

    // Load batch students for task assignment
    if (activeWorkflow.batch_id) {
      fetchBatchJapaneseDetails(activeWorkflow.batch_id)
        .then((res) => {
          const students = res.students || [];
          setBatchStudents(students);
          if (students.length > 0 && !taskStudentId) {
            setTaskStudentId(students[0].id);
          }
        })
        .catch((err) => console.error("Failed to load batch students:", err));
    }
  }, [activeWorkflow]);

  // Handle Create Workflow
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;

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

      setIsCreateWorkflowModalOpen(false);
      setWfName("");
      setWfDescription("");
      setWfStartDate("");
      setWfEndDate("");
      await loadWorkflows();
      setActiveWorkflow(created);
    } catch (err: any) {
      alert(err.message || "Failed to create workflow");
    } finally {
      setIsSubmittingWf(false);
    }
  };

  // Handle Delete Workflow
  const handleDeleteWorkflow = async (wfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow and all its tasks?")) return;

    try {
      await deleteTeacherWorkflow(wfId);
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
      if (taskAssignMode === "all") {
        const studentIds = batchStudents.map((s) => s.id);
        if (studentIds.length === 0) {
          throw new Error("No students found in this batch to assign tasks to.");
        }

        await bulkCreateTeacherWorkflowTasks(activeWorkflow.id, {
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
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
          description: taskDescription.trim() || undefined,
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
            <span>JAPANESE WORKFLOWS &amp; HOMEWORK MANAGEMENT</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">
            Homework, Kanji Tests &amp; Lesson Workflows
          </h2>
          <p className="text-xs text-on-surface-variant max-w-2xl">
            Create structured curriculum workflows for your batches, assign Kanji tests and Mondai homework sets, and track student completion.
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
              setIsCreateWorkflowModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Workflow</span>
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
                  Create your first Japanese curriculum workflow to assign Kanji tests and Mondai homework sets to your students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateWorkflowModalOpen(true)}
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

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#4B2EF5]">calendar_today</span>
                        <span>{new Date(wf.created_at).toLocaleDateString()}</span>
                      </span>

                      <span className="font-semibold text-[#4B2EF5] flex items-center gap-0.5 group-hover:underline">
                        <span>View Tasks</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Workflow Tasks View (Col 8) */}
        {activeWorkflow && (
          <div className="lg:col-span-8 space-y-4 animate-in slide-in-from-right-4 duration-200">
            {/* Active Workflow Header Card */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-3">
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
                    <span>Assign Task / Homework</span>
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
            </div>

            {/* Tasks List */}
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
                    Click <strong>&ldquo;Assign Task / Homework&rdquo;</strong> to give Kanji tests, Mondai homework, or grammar drills to your batch learners.
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
                          {onNavigateToEvaluations && (
                            <button
                              type="button"
                              onClick={() => onNavigateToEvaluations(task.student_id)}
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
          </div>
        )}
      </div>

      {/* CREATE WORKFLOW MODAL */}
      {isCreateWorkflowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4B2EF5]">account_tree</span>
                <h3 className="font-bold text-base text-on-surface">Create Japanese Workflow</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateWorkflowModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Templates</span>
              <div className="flex flex-wrap gap-1.5">
                {WORKFLOW_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setWfName(preset.name);
                      setWfDescription(preset.description);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-[#4B2EF5]/10 hover:text-[#4B2EF5] text-[11px] font-medium transition-colors cursor-pointer text-slate-700"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Batch</label>
                <select
                  value={wfBatchId}
                  onChange={(e) => setWfBatchId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-semibold cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.department || "Japanese"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Workflow Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Oct 8 - Kanji Test 1 & Mondai Homework"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Details of the kanji characters, workbook chapters, or drill requirements..."
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={wfStartDate}
                    onChange={(e) => setWfStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={wfEndDate}
                    onChange={(e) => setWfEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsCreateWorkflowModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWf}
                  className="px-5 py-2 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingWf ? "Creating..." : "Create Workflow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / ASSIGN TASK MODAL */}
      {isCreateTaskModalOpen && activeWorkflow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4B2EF5]">assignment_add</span>
                <div>
                  <h3 className="font-bold text-base text-on-surface">Assign Task / Homework</h3>
                  <p className="text-[11px] text-slate-400">Workflow: {activeWorkflow.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {taskModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {taskModalError}
              </div>
            )}

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {TASK_PRESETS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => {
                      setTaskTitle(p.title);
                      setTaskDescription(p.description);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-[#4B2EF5]/10 hover:text-[#4B2EF5] text-[11px] font-medium transition-colors cursor-pointer text-slate-700"
                  >
                    + {p.title.split("-")[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assignment Target *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskAssignMode("all")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      taskAssignMode === "all"
                        ? "bg-[#4B2EF5] text-white border-[#4B2EF5] shadow-xs"
                        : "bg-surface-container text-slate-700 border-outline-variant/40"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">groups</span>
                    <span>All Batch Learners ({batchStudents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskAssignMode("single")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      taskAssignMode === "single"
                        ? "bg-[#4B2EF5] text-white border-[#4B2EF5] shadow-xs"
                        : "bg-surface-container text-slate-700 border-outline-variant/40"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">person</span>
                    <span>Specific Student</span>
                  </button>
                </div>
              </div>

              {taskAssignMode === "single" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Learner *</label>
                  <select
                    value={taskStudentId}
                    onChange={(e) => setTaskStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium cursor-pointer"
                  >
                    {batchStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.enrollment_no})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Kanji Test #1 or Mondai Homework Lesson 4"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-xl text-xs border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4B2EF5]/20 font-semibold cursor-pointer"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2 bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTask
                    ? "Assigning..."
                    : taskAssignMode === "all"
                    ? `Assign to All (${batchStudents.length})`
                    : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

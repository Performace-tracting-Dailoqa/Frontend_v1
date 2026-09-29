"use client";

import React, { useState, useEffect } from "react";
import { fetchTeacherBatches, fetchTeacherUnassignedStudents, createTeacherBatch, fetchTeacherStudents, Batch } from "@/services/workflowService";
import { TeamMember } from "@/services/workflowService";
import TeacherLearnerEvaluationModal from "@/components/teacher/TeacherLearnerEvaluationModal";
import { UserData } from "@/services/userService";

export default function TeacherLearnersTab() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<TeamMember[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<TeamMember[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  
  const [evaluatingStudent, setEvaluatingStudent] = useState<UserData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedBatches, fetchedUnassigned, fetchedAssigned] = await Promise.all([
        fetchTeacherBatches(),
        fetchTeacherUnassignedStudents(),
        fetchTeacherStudents()
      ]);
      setBatches(fetchedBatches);
      setUnassignedStudents(fetchedUnassigned);
      setAssignedStudents(fetchedAssigned);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load learners data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      setError("Batch name is required");
      return;
    }
    setIsCreatingBatch(true);
    setError(null);
    try {
      await createTeacherBatch({
        name: newBatchName,
        student_ids: Array.from(selectedStudentIds)
      });
      setNewBatchName("");
      setSelectedStudentIds(new Set());
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create batch");
    } finally {
      setIsCreatingBatch(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-on-surface-variant animate-pulse">Loading learners and batches...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-sm">
          {error}
        </div>
      )}

      {/* Batch Creation Form */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6">
        <h3 className="text-title-md font-headline font-semibold text-on-surface mb-4">Create New Batch</h3>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="block text-body-sm font-medium text-on-surface-variant mb-1">Batch Name</label>
            <input
              type="text"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              placeholder="e.g. Batch A, Morning Cohort"
              className="w-full bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface"
            />
          </div>
          <button
            onClick={handleCreateBatch}
            disabled={isCreatingBatch || !newBatchName.trim()}
            className="w-full md:w-auto bg-[#4B2EF5] hover:bg-[#4B2EF5]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            {isCreatingBatch ? "Creating..." : "Create Batch"}
          </button>
        </div>

        {/* Unassigned Students Selection */}
        {unassignedStudents.length > 0 && (
          <div className="mt-6">
            <h4 className="text-body-md font-medium text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person_add</span>
              Assign Students to New Batch
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {unassignedStudents.map(student => (
                <label key={student.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedStudentIds.has(student.id) ? 'bg-primary/10 border-primary' : 'bg-surface-container border-outline-variant/50 hover:border-outline-variant'}`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant bg-surface-container"
                    checked={selectedStudentIds.has(student.id)}
                    onChange={() => toggleStudentSelection(student.id)}
                  />
                  <div className="flex flex-col">
                    <span className="text-body-sm font-medium text-on-surface">{student.name || "Unknown"}</span>
                    <span className="text-xs text-on-surface-variant truncate w-40">{student.email}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="text-xs text-on-surface-variant mt-2">
              {selectedStudentIds.size} student(s) selected
            </div>
          </div>
        )}
      </div>

      {/* Existing Batches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6">
          <h3 className="text-title-md font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            My Batches
          </h3>
          {batches.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No batches created yet.</p>
          ) : (
            <div className="space-y-3">
              {batches.map(batch => (
                <div key={batch.id} className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-on-surface">{batch.name}</div>
                    <div className="text-xs text-on-surface-variant">{new Date(batch.created_at || "").toLocaleDateString()}</div>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    {batch.status || "active"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Students */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6">
          <h3 className="text-title-md font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">groups</span>
            My Learners
          </h3>
          {assignedStudents.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No learners assigned yet.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {assignedStudents.map(student => (
                <div key={student.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {(student.name || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface text-sm truncate">{student.name || "Unknown"}</div>
                    <div className="text-xs text-on-surface-variant truncate">{student.email}</div>
                  </div>
                  <button 
                    onClick={() => setEvaluatingStudent(student as any)}
                    className="ml-auto text-xs font-medium bg-secondary/10 hover:bg-secondary/20 text-secondary px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Evaluate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {evaluatingStudent && (
        <TeacherLearnerEvaluationModal 
          student={evaluatingStudent} 
          onClose={() => setEvaluatingStudent(null)} 
        />
      )}
    </div>
  );
}

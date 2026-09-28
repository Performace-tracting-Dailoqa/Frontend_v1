"use client";

import React, { useState } from "react";
import { Workflow } from "@/services/workflowService";

interface WorkflowsTabProps {
  workflows: Workflow[];
  isLoading: boolean;
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (wf: Workflow) => void;
  onCreateWorkflow: (data: { name: string; description?: string }) => Promise<void>;
  onDeleteWorkflow: (id: string) => Promise<void>;
  onNavigateToProgress: () => void;
}

export default function WorkflowsTab({
  workflows,
  isLoading,
  selectedWorkflow,
  onSelectWorkflow,
  onCreateWorkflow,
  onDeleteWorkflow,
  onNavigateToProgress,
}: WorkflowsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateWorkflow({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-headline font-bold text-on-surface">Workflows &amp; Projects</h3>
          <p className="text-body-sm text-on-surface-variant">
            Create structured operational or milestone tracks to organize learner assignments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-white text-body-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Create Workflow</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">account_tree</span>
          </div>
          <h4 className="text-body-md font-bold text-on-surface">No Workflows Established</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-4">
            Initialize your team&apos;s first workflow track to begin task assignments.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
          >
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => {
            const isSelected = selectedWorkflow?.id === wf.id;
            return (
              <div
                key={wf.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary"
                    : "bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                      {wf.status || "Active"}
                    </span>
                    <button
                      onClick={() => onDeleteWorkflow(wf.id)}
                      className="text-outline hover:text-red-600 transition-colors p-1 cursor-pointer"
                      title="Delete workflow"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                  <h4 className="text-title-md font-bold text-on-surface font-headline mb-1">{wf.name}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                    {wf.description || "No description provided for this workflow track."}
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-xs text-outline font-medium">
                    {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : "Active Track"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectWorkflow(wf);
                        onNavigateToProgress();
                      }}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      Open Tasks →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Workflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full border border-outline-variant/50 p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md font-bold text-on-surface font-headline">Create New Workflow</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-surface text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 3 — Cloud Infrastructure Setup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core objectives and scope of this workflow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container text-body-sm rounded-lg border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Track"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

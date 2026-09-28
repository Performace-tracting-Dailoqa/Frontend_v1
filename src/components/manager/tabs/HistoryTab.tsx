"use client";

import React from "react";

export default function HistoryTab() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-[#4B2EF5]/10 text-[#4B2EF5] flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-3xl">history</span>
      </div>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">
        History Module
      </h3>
      <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
        This manager tool is under active development. Data fetching logic is being integrated.
      </p>
    </div>
  );
}

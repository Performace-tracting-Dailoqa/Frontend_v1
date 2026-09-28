"use client";

import React from "react";

export default function ReportsTab() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-3xl">description</span>
      </div>
      <h3 className="text-title-lg font-headline font-bold text-on-surface">
        Reports
      </h3>
      <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
        This module is currently receiving data from the backend and will be fully operational in the next release.
      </p>
    </div>
  );
}

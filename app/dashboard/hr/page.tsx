"use client";

import React, { useState } from "react";
import PeopleTab from "@/components/super-admin/tabs/PeopleTab";

export default function HREmployeesPage() {
  const [personnelCount, setPersonnelCount] = useState<number | null>(null);
  
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-6">
      <div className="mb-4">
        <h2 className="text-title-lg font-bold text-on-surface">Personnel Directory &amp; Roles</h2>
        <p className="text-body-sm text-on-surface-variant">
          Manage HR, Managers, Teachers, and Learners across the organization.
        </p>
      </div>
      <PeopleTab onDirectoryLoaded={(loaded) => setPersonnelCount(loaded.length)} />
    </div>
  );
}
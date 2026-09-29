"use client";

import { useQuery } from "@tanstack/react-query";
import DashboardTab from "@/components/teacher/tabs/DashboardTab";
import { getAuthSession } from "@/utils/auth";

export default function TeacherDashboardPage() {
  const session = typeof window !== "undefined" ? getAuthSession() : null;
  const teacherScope = session?.scope;
  const assignedBatches = teacherScope?.assigned_batch_ids || [];
  const assignedLearnerCount = teacherScope?.assigned_student_ids?.length || 0;

  return (
    <DashboardTab 
      assignedBatches={assignedBatches} 
      assignedLearnerCount={assignedLearnerCount} 
    />
  );
}

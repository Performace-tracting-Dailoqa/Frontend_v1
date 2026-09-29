import { useQuery } from "@tanstack/react-query";
import { fetchWorkflows, fetchManagerTeam } from "@/services/workflowService";
import { getAuthSession } from "@/utils/auth";

export function useManagerDashboardData() {
  const session = typeof window !== "undefined" ? getAuthSession() : null;
  const isManager = session?.role?.name?.toLowerCase().includes("manager");

  const workflowsQuery = useQuery({
    queryKey: ["manager", "workflows"],
    queryFn: () => fetchWorkflows(1, 100),
    enabled: !!isManager,
  });

  const teamQuery = useQuery({
    queryKey: ["manager", "team"],
    queryFn: () => fetchManagerTeam(),
    enabled: !!isManager,
  });

  return {
    workflowsQuery,
    teamQuery,
    session,
  };
}

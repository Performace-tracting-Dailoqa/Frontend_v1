/**
 * Superuser dashboard types.
 *
 * The dashboard is a fixed set of seven pages. `SuperAdminTab` is the single
 * source of truth for that set — the nav, the URL `?tab=` parameter and the
 * page shell all key off it.
 */
export type SuperAdminTab =
  | "overview"
  | "teams"
  | "users"
  | "progress"
  | "calendar"
  | "add-person"
  | "profile";

/** Display metadata for one nav tab, in render order. */
export interface SuperAdminTabMeta {
  key: SuperAdminTab;
  label: string;
  icon: string;
  description: string;
}

export const SUPER_ADMIN_TABS: SuperAdminTabMeta[] = [
  {
    key: "overview",
    label: "Overview",
    icon: "dashboard",
    description: "System-wide identity, workload and evaluation counters",
  },
  {
    key: "teams",
    label: "Teams",
    icon: "groups",
    description: "Every batch with its leads, headcount and task progress",
  },
  {
    key: "users",
    label: "People",
    icon: "group",
    description: "Search and manage HR, managers, teachers and interns",
  },
  {
    key: "progress",
    label: "Progress",
    icon: "monitoring",
    description: "Completion and evaluation scores, team by team",
  },
  {
    key: "calendar",
    label: "Microsoft Calendar",
    icon: "calendar_month",
    description: "The superuser's Microsoft 365 schedule",
  },
  {
    key: "add-person",
    label: "Add Person",
    icon: "person_add",
    description: "Provision an HR, manager, teacher or intern account",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "account_circle",
    description: "Your identity, role and data scope",
  },
];

const VALID_TABS = new Set<string>(SUPER_ADMIN_TABS.map((tab) => tab.key));

/** Narrow an arbitrary `?tab=` value to a known tab, defaulting to Overview. */
export function isSuperAdminTab(value: string | null | undefined): value is SuperAdminTab {
  return !!value && VALID_TABS.has(value);
}

/** Shared loading / error / empty state used by every data-driven page. */
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

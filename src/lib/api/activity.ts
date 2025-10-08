// Frontend API functions for activity log
// These functions are now handled in hooks/useActivity.ts with TanStack Query

import { ActivityLogFilter } from "@/types/activity";

/**
 * Export activity logs
 * This is a re-export from the hook for convenience
 */
export async function exportActivityLog(
  format: "csv" | "json",
  filters?: ActivityLogFilter
) {
  const params = new URLSearchParams({ format });

  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.actionType) params.append("actionType", filters.actionType);

  window.open(`/api/activity/export?${params.toString()}`, "_blank");
}


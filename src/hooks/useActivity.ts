"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ActivityLogFilter,
  ActivityLogResponse,
} from "@/types/activity";

/**
 * Fetch activity logs with pagination and filters
 */
async function fetchActivities(
  filters: ActivityLogFilter
): Promise<ActivityLogResponse> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.actionType) params.append("actionType", filters.actionType);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(`/api/activity?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch activities");
  }

  const data = await response.json();
  return {
    activities: data.activities,
    pagination: data.pagination,
  };
}

/**
 * Export activities as CSV or JSON
 */
export async function exportActivities(
  format: "csv" | "json",
  filters?: ActivityLogFilter
) {
  const params = new URLSearchParams({ format });

  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.actionType) params.append("actionType", filters.actionType);

  // Open in new window to trigger download
  window.open(`/api/activity/export?${params.toString()}`, "_blank");
}

/**
 * Hook to fetch activity logs with pagination and filters
 */
export function useActivity(filters: ActivityLogFilter = {}) {
  return useQuery<ActivityLogResponse, Error>({
    queryKey: ["activities", filters],
    queryFn: () => fetchActivities(filters),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}


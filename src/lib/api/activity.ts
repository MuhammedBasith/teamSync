// Frontend API functions for activity log
// These functions will be used with Tanstack Query

import { apiClient } from "@/lib/clients/apiClient";

export async function getActivityLog(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const queryParams = new URLSearchParams(params as Record<string, string>);
  return apiClient(`/activity?${queryParams.toString()}`, { method: "GET" });
}

export async function exportActivityLog(format: "csv" | "json") {
  // This will trigger a download
  window.open(`/api/activity/export?format=${format}`, "_blank");
}


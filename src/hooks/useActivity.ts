"use client";

// Placeholder hook for activity log
export function useActivity() {
  // TODO: Implement activity log fetching with Tanstack Query
  return {
    activities: [],
    loading: true,
    error: null,
    exportActivities: async (format: "csv" | "json") => {
      console.log("Export activities:", format);
    },
  };
}


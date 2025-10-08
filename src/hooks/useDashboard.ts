"use client";

import { useQuery } from "@tanstack/react-query";

export type DashboardStats = {
  user: {
    id: string;
    displayName: string;
    role: "owner" | "admin" | "member";
  };
  organization: {
    id: string;
    name: string;
    tier: string;
  };
  stats: {
    totalMembers?: number;
    owners?: number;
    admins?: number;
    members?: number;
    teams: number;
  };
  quotas?: {
    maxMembers: number;
    maxTeams: number;
    membersUsed: number;
    teamsUsed: number;
    membersPercentage: number;
    teamsPercentage: number;
  };
  recentActivities?: Array<{
    id: string;
    actionType: string;
    actorName: string;
    actorAvatarUrl: string | null;
    targetName?: string;
    details?: Record<string, unknown>;
    createdAt: string;
  }> | null;
  userTeam?: {
    id: string;
    name: string;
    manager: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };
  } | null;
};

/**
 * Fetch dashboard statistics
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/dashboard/stats");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch dashboard stats");
  }

  const data = await response.json();
  return data;
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboard() {
  return useQuery<DashboardStats, Error>({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}


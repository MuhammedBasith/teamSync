"use client";

import { useQuery } from "@tanstack/react-query";

export type QuotaInfo = {
  tier: string;
  usage: {
    members: number;
    teams: number;
  };
  limits: {
    max_members: number;
    max_teams: number;
  };
};

/**
 * Fetch quota information
 */
async function fetchQuotas(): Promise<QuotaInfo> {
  const response = await fetch("/api/quota");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch quotas");
  }
  const data = await response.json();
  return {
    tier: data.tier,
    usage: data.usage,
    limits: data.limits,
  };
}

/**
 * Hook to fetch organization quota information
 */
export function useQuotas() {
  return useQuery<QuotaInfo, Error>({
    queryKey: ["quotas"],
    queryFn: fetchQuotas,
  });
}


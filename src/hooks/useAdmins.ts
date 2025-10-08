"use client";

import { useQuery } from "@tanstack/react-query";

export type Admin = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

/**
 * Fetch all admins in the organization (Owner only)
 */
async function fetchAdmins(): Promise<Admin[]> {
  const response = await fetch("/api/team/admins");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch admins");
  }
  const data = await response.json();
  return data.admins;
}

/**
 * Hook to fetch available admins for team assignment
 */
export function useAdmins() {
  return useQuery<Admin[], Error>({
    queryKey: ["admins"],
    queryFn: fetchAdmins,
  });
}


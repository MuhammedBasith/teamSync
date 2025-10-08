"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Team, TeamCreateInput, TeamUpdateInput } from "@/types/team";

/**
 * Fetch all teams in the organization
 */
async function fetchTeams(): Promise<Team[]> {
  const response = await fetch("/api/team");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch teams");
  }
  const data = await response.json();
  return data.teams;
}

/**
 * Fetch a single team with members
 */
async function fetchTeam(teamId: string): Promise<Team> {
  const response = await fetch(`/api/team/${teamId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch team");
  }
  const data = await response.json();
  return data.team;
}

/**
 * Create a new team
 */
async function createTeam(input: TeamCreateInput): Promise<Team> {
  const response = await fetch("/api/team", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create team");
  }

  const data = await response.json();
  return data.team;
}

/**
 * Update a team
 */
async function updateTeam(
  teamId: string,
  input: TeamUpdateInput
): Promise<Team> {
  const response = await fetch(`/api/team/${teamId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update team");
  }

  const data = await response.json();
  return data.team;
}

/**
 * Delete a team
 */
async function deleteTeam(teamId: string): Promise<void> {
  const response = await fetch(`/api/team/${teamId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete team");
  }
}

/**
 * Hook to fetch all teams
 */
export function useTeams() {
  return useQuery<Team[], Error>({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
}

/**
 * Hook to fetch a single team
 */
export function useTeam(teamId: string | null) {
  return useQuery<Team, Error>({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeam(teamId!),
    enabled: !!teamId,
  });
}

/**
 * Hook to create a team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, TeamCreateInput>({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

/**
 * Hook to update a team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, { teamId: string; data: TeamUpdateInput }>({
    mutationFn: ({ teamId, data }) => updateTeam(teamId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.teamId] });
    },
  });
}

/**
 * Hook to delete a team
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}


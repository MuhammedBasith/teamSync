import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type MemberStatus = "active" | "pending";

export type Team = {
  id: string;
  name: string;
};

export type Member = {
  id: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  team: Team | null;
  status: MemberStatus;
  createdAt: string;
  inviteId?: string; // Only for pending members
};

export type MembersResponse = {
  success: boolean;
  members: Member[];
  counts: {
    active: number;
    pending: number;
    total: number;
  };
  permissions: {
    canMoveTeams: boolean;
    canRemove: boolean;
    canResendInvite: boolean;
  };
};

type MembersFilters = {
  team?: string;
  status?: MemberStatus;
  search?: string;
};

/**
 * Fetch members with optional filters
 */
async function fetchMembers(filters: MembersFilters = {}): Promise<MembersResponse> {
  const params = new URLSearchParams();
  
  if (filters.team) params.append("team", filters.team);
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);

  const url = `/api/members${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch members");
  }

  return response.json();
}

/**
 * Move member to a different team
 */
async function moveMemberToTeam(memberId: string, teamId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/members/${memberId}/team`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ teamId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to move member");
  }

  return response.json();
}

/**
 * Remove a member from the organization
 */
async function removeMember(memberId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/members/${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove member");
  }

  return response.json();
}

/**
 * Resend invite to a pending member
 */
async function resendInvite(inviteId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/invite/${inviteId}/resend`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to resend invite");
  }

  return response.json();
}

/**
 * Update member role (member <-> admin)
 */
async function updateMemberRole(
  memberId: string,
  role: string,
  teamId?: string | null
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/members/${memberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, team_id: teamId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update member role");
  }

  return response.json();
}

/**
 * Hook to fetch members
 */
export function useMembers(filters: MembersFilters = {}) {
  return useQuery<MembersResponse, Error>({
    queryKey: ["members", filters],
    queryFn: () => fetchMembers(filters),
    staleTime: 30000, // Consider fresh for 30 seconds
  });
}

/**
 * Hook to move member between teams
 */
export function useMoveMember() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { memberId: string; teamId: string }>({
    mutationFn: ({ memberId, teamId }) => moveMemberToTeam(memberId, teamId),
    onSuccess: () => {
      // Invalidate members query to refetch
      queryClient.invalidateQueries({ queryKey: ["members"] });
      // Also invalidate teams to update member counts
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Hook to remove member
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (memberId) => removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Hook to resend invite
 */
export function useResendInvite() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (inviteId) => resendInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

/**
 * Hook to update member role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { memberId: string; role: string; teamId?: string | null }
  >({
    mutationFn: ({ memberId, role, teamId }) =>
      updateMemberRole(memberId, role, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

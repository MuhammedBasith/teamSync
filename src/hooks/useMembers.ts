"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/clients/apiClient";
import { Role } from "@/types/user";

interface UpdateMemberRoleInput {
  userId: string;
  role: Role;
  team_id?: string | null; // Required when demoting admin → member
}

/**
 * Update a member's role (promote/demote)
 * - Member → Admin: Remove from team automatically
 * - Admin → Member: Requires team_id
 */
async function updateMemberRole({ userId, role, team_id }: UpdateMemberRoleInput) {
  return apiClient(`/members/${userId}`, {
    method: "PATCH",
    body: { role, team_id },
  });
}

/**
 * Hook to update member role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMemberRole,
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}

// Placeholder hook for members data (keep for backwards compatibility)
export function useMembers() {
  // TODO: Implement members data fetching with Tanstack Query
  return {
    members: [],
    loading: true,
    error: null,
    inviteMember: async (email: string, role: string) => {
      console.log("Invite member:", email, role);
    },
    updateMember: async (id: string, data: unknown) => {
      console.log("Update member:", id, data);
    },
    removeMember: async (id: string) => {
      console.log("Remove member:", id);
    },
  };
}


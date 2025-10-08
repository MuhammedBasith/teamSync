import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColorPalette } from "@/types/organization";

type TierInfo = {
  id: string;
  name: string;
  maxMembers: number;
  maxTeams: number;
  pricePerMonth: number;
};

type UsageInfo = {
  current: number;
  max: number;
  percentage: number;
};

export type OrganizationSettings = {
  organization: {
    id: string;
    name: string;
    colorPalette: ColorPalette;
    createdAt: string;
    ownerId: string;
    tier: TierInfo;
  };
  usage: {
    members: UsageInfo;
    teams: UsageInfo;
  };
  permissions: {
    canEdit: boolean;
    isOwner: boolean;
  };
};

type UpdateSettingsInput = {
  name?: string;
  colorPalette?: ColorPalette;
};

/**
 * Fetch organization settings
 */
async function fetchOrganizationSettings(): Promise<OrganizationSettings> {
  const response = await fetch("/api/organization/settings");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch organization settings");
  }

  return response.json();
}

/**
 * Update organization settings
 */
async function updateOrganizationSettings(
  input: UpdateSettingsInput
): Promise<{ success: boolean; organization: { id: string; name: string; colorPalette: ColorPalette } }> {
  const response = await fetch("/api/organization/settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update organization settings");
  }

  return response.json();
}

/**
 * Hook to fetch organization settings
 */
export function useOrganizationSettings() {
  return useQuery<OrganizationSettings, Error>({
    queryKey: ["organization-settings"],
    queryFn: fetchOrganizationSettings,
    staleTime: 60000, // Consider fresh for 1 minute
  });
}

/**
 * Hook to update organization settings
 */
export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; organization: { id: string; name: string; colorPalette: ColorPalette } },
    Error,
    UpdateSettingsInput
  >({
    mutationFn: updateOrganizationSettings,
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      // Also invalidate dashboard stats (might show org name)
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}


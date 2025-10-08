import { createSupabaseAdmin } from "./supabase";

export type QuotaCheckResult = {
  allowed: boolean;
  error?: string;
  currentUsage?: {
    members: number;
    teams: number;
  };
  limits?: {
    max_members: number;
    max_teams: number;
  };
};

/**
 * Check if organization can add more members
 */
export async function checkMemberQuota(
  organizationId: string
): Promise<QuotaCheckResult> {
  const supabase = createSupabaseAdmin();

  // Get organization with tier limits
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select(
      `
      id,
      tier_id,
      tiers (
        max_members,
        max_teams
      )
    `
    )
    .eq("id", organizationId)
    .single();

  if (orgError || !org) {
    return {
      allowed: false,
      error: "Organization not found",
    };
  }

  const tierData = org.tiers as unknown as {
    max_members: number;
    max_teams: number;
  };

  // Count current members in organization
  const { count: memberCount, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (countError) {
    return {
      allowed: false,
      error: "Failed to check member count",
    };
  }

  const currentMembers = memberCount || 0;

  if (currentMembers >= tierData.max_members) {
    return {
      allowed: false,
      error: `Member limit reached (${currentMembers}/${tierData.max_members}). Upgrade your plan or remove members to continue.`,
      currentUsage: {
        members: currentMembers,
        teams: 0, // We'll add this in team quota check
      },
      limits: {
        max_members: tierData.max_members,
        max_teams: tierData.max_teams,
      },
    };
  }

  return {
    allowed: true,
    currentUsage: {
      members: currentMembers,
      teams: 0,
    },
    limits: {
      max_members: tierData.max_members,
      max_teams: tierData.max_teams,
    },
  };
}

/**
 * Check if organization can add more teams
 */
export async function checkTeamQuota(
  organizationId: string
): Promise<QuotaCheckResult> {
  const supabase = createSupabaseAdmin();

  // Get organization with tier limits
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select(
      `
      id,
      tier_id,
      tiers (
        max_members,
        max_teams
      )
    `
    )
    .eq("id", organizationId)
    .single();

  if (orgError || !org) {
    return {
      allowed: false,
      error: "Organization not found",
    };
  }

  const tierData = org.tiers as unknown as {
    max_members: number;
    max_teams: number;
  };

  // Count current teams in organization
  const { count: teamCount, error: countError } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (countError) {
    return {
      allowed: false,
      error: "Failed to check team count",
    };
  }

  const currentTeams = teamCount || 0;

  if (currentTeams >= tierData.max_teams) {
    return {
      allowed: false,
      error: `Team limit reached (${currentTeams}/${tierData.max_teams}). Upgrade your plan or remove teams to continue.`,
      currentUsage: {
        members: 0, // We'll add this if needed
        teams: currentTeams,
      },
      limits: {
        max_members: tierData.max_members,
        max_teams: tierData.max_teams,
      },
    };
  }

  return {
    allowed: true,
    currentUsage: {
      members: 0,
      teams: currentTeams,
    },
    limits: {
      max_members: tierData.max_members,
      max_teams: tierData.max_teams,
    },
  };
}

/**
 * Get quota usage and limits for an organization
 */
export async function getQuotaInfo(organizationId: string) {
  const supabase = createSupabaseAdmin();

  // Get organization with tier limits
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select(
      `
      id,
      tier_id,
      tiers (
        name,
        max_members,
        max_teams
      )
    `
    )
    .eq("id", organizationId)
    .single();

  if (orgError || !org) {
    throw new Error("Organization not found");
  }

  const tierData = org.tiers as unknown as {
    name: string;
    max_members: number;
    max_teams: number;
  };

  // Count current members
  const { count: memberCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // Count current teams
  const { count: teamCount } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  return {
    tier: tierData.name,
    usage: {
      members: memberCount || 0,
      teams: teamCount || 0,
    },
    limits: {
      max_members: tierData.max_members,
      max_teams: tierData.max_teams,
    },
  };
}


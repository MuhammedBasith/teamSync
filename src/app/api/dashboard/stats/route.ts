import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics based on user role
 * Returns different data for Owner, Admin, and Member
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with role
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, organization_id, role, display_name, team_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get organization info with tier
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select(
        `
        id,
        name,
        tier_id,
        tiers (
          name,
          max_members,
          max_teams
        )
      `
      )
      .eq("id", currentUser.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const tierData = org.tiers as unknown as {
      name: string;
      max_members: number;
      max_teams: number;
    };

    // Count total members (all roles)
    const { count: totalMembersCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id);

    // Count members by role
    const { count: ownerCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id)
      .eq("role", "owner");

    const { count: adminCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id)
      .eq("role", "admin");

    const { count: memberCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id)
      .eq("role", "member");

    // Count total teams
    const { count: teamsCount } = await supabaseAdmin
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id);

    // Get recent activities (only for owner/admin)
    let recentActivities = null;
    if (currentUser.role === "owner" || currentUser.role === "admin") {
      const { data: activities } = await supabaseAdmin
        .from("activity_log")
        .select("*")
        .eq("organization_id", currentUser.organization_id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Resolve UUIDs for activities
      if (activities && activities.length > 0) {
        recentActivities = await Promise.all(
          activities.map(async (activity) => {
            const { data: actor } = await supabaseAdmin
              .from("users")
              .select("display_name, avatar_url")
              .eq("id", activity.actor_id)
              .single();

            let targetName = undefined;
            if (activity.target_type === "team") {
              const { data: targetTeam } = await supabaseAdmin
                .from("teams")
                .select("name")
                .eq("id", activity.target_id)
                .single();
              targetName =
                targetTeam?.name || activity.details?.team_name;
            } else if (activity.target_type === "user") {
              const { data: targetUser } = await supabaseAdmin
                .from("users")
                .select("display_name")
                .eq("id", activity.target_id)
                .single();
              targetName = targetUser?.display_name;
            }

            return {
              id: activity.id,
              actionType: activity.action_type,
              actorName: actor?.display_name || "Unknown",
              actorAvatarUrl: actor?.avatar_url,
              targetName,
              details: activity.details,
              createdAt: activity.created_at,
            };
          })
        );
      }
    }

    // Get user's team info (for members)
    let userTeam = null;
    if (currentUser.team_id) {
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select(
          `
          id,
          name,
          manager:manager_id (
            id,
            display_name,
            avatar_url
          )
        `
        )
        .eq("id", currentUser.team_id)
        .single();
      userTeam = team;
    }

    // Build response based on role
    const baseStats = {
      user: {
        id: currentUser.id,
        displayName: currentUser.display_name,
        role: currentUser.role,
      },
      organization: {
        id: org.id,
        name: org.name,
        tier: tierData.name,
      },
    };

    if (currentUser.role === "owner") {
      return NextResponse.json(
        {
          success: true,
          ...baseStats,
          stats: {
            totalMembers: totalMembersCount || 0,
            owners: ownerCount || 0,
            admins: adminCount || 0,
            members: memberCount || 0,
            teams: teamsCount || 0,
          },
          quotas: {
            maxMembers: tierData.max_members,
            maxTeams: tierData.max_teams,
            membersUsed: totalMembersCount || 0,
            teamsUsed: teamsCount || 0,
            membersPercentage: Math.round(
              ((totalMembersCount || 0) / tierData.max_members) * 100
            ),
            teamsPercentage: Math.round(
              ((teamsCount || 0) / tierData.max_teams) * 100
            ),
          },
          recentActivities,
        },
        { status: 200 }
      );
    } else if (currentUser.role === "admin") {
      return NextResponse.json(
        {
          success: true,
          ...baseStats,
          stats: {
            totalMembers: totalMembersCount || 0,
            admins: adminCount || 0,
            members: memberCount || 0,
            teams: teamsCount || 0,
          },
          quotas: {
            maxMembers: tierData.max_members,
            maxTeams: tierData.max_teams,
            membersUsed: totalMembersCount || 0,
            teamsUsed: teamsCount || 0,
            membersPercentage: Math.round(
              ((totalMembersCount || 0) / tierData.max_members) * 100
            ),
            teamsPercentage: Math.round(
              ((teamsCount || 0) / tierData.max_teams) * 100
            ),
          },
          recentActivities,
        },
        { status: 200 }
      );
    } else {
      // Member role
      return NextResponse.json(
        {
          success: true,
          ...baseStats,
          stats: {
            teams: teamsCount || 0,
          },
          userTeam,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


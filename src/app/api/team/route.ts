import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/server/supabase";
import { logActivity } from "@/lib/server/authHelpers";
import { checkTeamQuota } from "@/lib/server/quotaHelpers";
import { z } from "zod";

// Validation schema for team creation
const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(50, "Team name must be less than 50 characters"),
  managerId: z.string().uuid().optional(),
});

/**
 * POST /api/team
 * Create a new team (Owner and Admin only)
 */
export async function POST(request: NextRequest) {
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
      .select(
        `
        id,
        role,
        organization_id,
        display_name,
        organizations!users_organization_id_fkey (
          id,
          name
        )
      `
      )
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only owner and admin can create teams
    if (!["owner", "admin"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to create teams" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    let validatedData;

    try {
      validatedData = createTeamSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check team quota before creating
    const quotaCheck = await checkTeamQuota(currentUser.organization_id);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: quotaCheck.error,
          quotaInfo: {
            currentUsage: quotaCheck.currentUsage,
            limits: quotaCheck.limits,
          },
        },
        { status: 403 }
      );
    }

    // Determine manager_id based on role
    let managerId: string;

    if (currentUser.role === "owner") {
      // If owner is creating the team, they must specify a manager (admin)
      if (!validatedData.managerId) {
        return NextResponse.json(
          { error: "Owner must specify an admin as the team manager" },
          { status: 400 }
        );
      }

      // Verify that the specified manager is an admin in the same organization
      const { data: managerUser, error: managerError } = await supabaseAdmin
        .from("users")
        .select("id, role, organization_id")
        .eq("id", validatedData.managerId)
        .eq("organization_id", currentUser.organization_id)
        .single();

      if (managerError || !managerUser) {
        return NextResponse.json(
          { error: "Specified manager not found in your organization" },
          { status: 404 }
        );
      }

      if (managerUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can be assigned as team managers" },
          { status: 400 }
        );
      }

      managerId = validatedData.managerId;
    } else {
      // If admin is creating the team, they become the manager
      managerId = currentUser.id;
    }

    // Create the team
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .insert({
        name: validatedData.name,
        organization_id: currentUser.organization_id,
        created_by: currentUser.id,
        manager_id: managerId,
      })
      .select("*")
      .single();

    if (teamError || !team) {
      console.error("Failed to create team:", teamError);
      return NextResponse.json(
        { error: "Failed to create team" },
        { status: 500 }
      );
    }

    // Fetch manager details
    const { data: manager } = await supabaseAdmin
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", team.manager_id)
      .single();

    // Fetch creator details
    const { data: creator } = await supabaseAdmin
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", team.created_by)
      .single();

    // Log activity
    await logActivity(
      currentUser.id,
      currentUser.organization_id,
      "team_created",
      "team",
      team.id,
      {
        team_name: validatedData.name,
        manager_id: managerId,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Team created successfully",
        team: {
          ...team,
          manager,
          creator,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/team
 * List all teams in the current user's organization
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
      .select("id, role, organization_id, team_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get teams based on user role
    let teamsQuery = supabaseAdmin
      .from("teams")
      .select("*")
      .eq("organization_id", currentUser.organization_id);

    // Admins can only see teams they manage
    if (currentUser.role === "admin") {
      teamsQuery = teamsQuery.eq("manager_id", currentUser.id);
    }
    
    // Members can only see their own team
    if (currentUser.role === "member" && currentUser.team_id) {
      teamsQuery = teamsQuery.eq("id", currentUser.team_id);
    }

    const { data: teams, error: teamsError } = await teamsQuery.order(
      "created_at",
      { ascending: false }
    );

    if (teamsError) {
      console.error("Failed to fetch teams:", teamsError);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    // Fetch related data for each team
    const teamsWithDetails = await Promise.all(
      (teams || []).map(async (team) => {
        // Get member count
        const { count } = await supabaseAdmin
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("team_id", team.id);

        // Get pending invites count
        const { count: pendingCount } = await supabaseAdmin
          .from("invites")
          .select("id", { count: "exact", head: true })
          .eq("team_id", team.id)
          .eq("accepted", false);

        // Get manager details
        const { data: manager } = await supabaseAdmin
          .from("users")
          .select("id, display_name, avatar_url")
          .eq("id", team.manager_id)
          .single();

        // Get creator details
        const { data: creator } = await supabaseAdmin
          .from("users")
          .select("id, display_name, avatar_url")
          .eq("id", team.created_by)
          .single();

        return {
          ...team,
          memberCount: count || 0,
          pendingCount: pendingCount || 0,
          manager,
          creator,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        teams: teamsWithDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch teams error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


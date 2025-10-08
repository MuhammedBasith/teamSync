import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/server/supabase";
import { logActivity } from "@/lib/server/authHelpers";
import { z } from "zod";

// Validation schema for team update
const updateTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(50, "Team name must be less than 50 characters").optional(),
  managerId: z.string().uuid().optional(),
});

/**
 * GET /api/team/[id]
 * Get a specific team with its members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Await params (Next.js 15 requirement)
    const { id: teamId } = await params;

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
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

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

    // Get team members
    const { data: members, error: membersError } = await supabaseAdmin
      .from("users")
      .select("id, display_name, avatar_url, role, created_at")
      .eq("team_id", teamId)
      .eq("organization_id", currentUser.organization_id)
      .order("created_at", { ascending: true });

    if (membersError) {
      console.error("Failed to fetch team members:", membersError);
    }

    return NextResponse.json(
      {
        success: true,
        team: {
          ...team,
          manager,
          creator,
          members: members || [],
          memberCount: members?.length || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch team error:", error);
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
 * PATCH /api/team/[id]
 * Update a team (Owner and Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Await params (Next.js 15 requirement)
    const { id: teamId } = await params;

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
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only owner and admin can update teams
    if (!["owner", "admin"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to update teams" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    let validatedData;

    try {
      validatedData = updateTeamSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check if team exists and belongs to user's organization
    const { data: existingTeam, error: teamCheckError } = await supabaseAdmin
      .from("teams")
      .select("id, organization_id, name, manager_id")
      .eq("id", teamId)
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (teamCheckError || !existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // If managerId is being changed, validate it
    if (validatedData.managerId && validatedData.managerId !== existingTeam.manager_id) {
      // Only owner can change manager
      if (currentUser.role !== "owner") {
        return NextResponse.json(
          { error: "Only organization owner can change team manager" },
          { status: 403 }
        );
      }

      // Verify that the new manager is an admin
      const { data: newManager, error: managerError } = await supabaseAdmin
        .from("users")
        .select("id, role, organization_id")
        .eq("id", validatedData.managerId)
        .eq("organization_id", currentUser.organization_id)
        .single();

      if (managerError || !newManager) {
        return NextResponse.json(
          { error: "Specified manager not found in your organization" },
          { status: 404 }
        );
      }

      if (newManager.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can be assigned as team managers" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: { name?: string; manager_id?: string } = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.managerId) updateData.manager_id = validatedData.managerId;

    // Update team
    const { data: updatedTeam, error: updateError } = await supabaseAdmin
      .from("teams")
      .update(updateData)
      .eq("id", teamId)
      .select("*")
      .single();

    if (updateError || !updatedTeam) {
      console.error("Failed to update team:", updateError);
      return NextResponse.json(
        { error: "Failed to update team" },
        { status: 500 }
      );
    }

    // Fetch manager details
    const { data: manager } = await supabaseAdmin
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", updatedTeam.manager_id)
      .single();

    // Fetch creator details
    const { data: creator } = await supabaseAdmin
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", updatedTeam.created_by)
      .single();

    // Log activity - only if name changed
    if (validatedData.name && validatedData.name !== existingTeam.name) {
      await logActivity(
        currentUser.id,
        currentUser.organization_id,
        "team_updated",
        "team",
        teamId,
        {
          old_name: existingTeam.name,
          new_name: validatedData.name,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Team updated successfully",
        team: {
          ...updatedTeam,
          manager,
          creator,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Team update error:", error);
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
 * DELETE /api/team/[id]
 * Delete a team (Owner and Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Await params (Next.js 15 requirement)
    const { id: teamId } = await params;

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
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only owner and admin can delete teams
    if (!["owner", "admin"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to delete teams" },
        { status: 403 }
      );
    }

    // Check if team exists and belongs to user's organization
    const { data: existingTeam, error: teamCheckError } = await supabaseAdmin
      .from("teams")
      .select("id, name, organization_id")
      .eq("id", teamId)
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (teamCheckError || !existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Check if there are members in this team
    const { count: memberCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    if (memberCount && memberCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete team with members. Please remove all members first.",
          memberCount,
        },
        { status: 400 }
      );
    }

    // Delete team
    const { error: deleteError } = await supabaseAdmin
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (deleteError) {
      console.error("Failed to delete team:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete team" },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity(
      currentUser.id,
      currentUser.organization_id,
      "team_deleted",
      "team",
      teamId,
      {
        team_name: existingTeam.name,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Team deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Team deletion error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


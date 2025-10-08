import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";
import { logActivity } from "@/lib/server/authHelpers";

/**
 * PATCH /api/members/[id]/team
 * Move a member from one team to another
 * 
 * Only organization owners can perform this action
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get user profile
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, organization_id, role, display_name")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser || !currentUser.organization_id) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only owners can move members between teams
    if (currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can move members between teams" },
        { status: 403 }
      );
    }

    // Get member ID from params
    const { id: memberId } = await params;

    // Parse request body
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Verify the member exists and belongs to this organization
    const { data: member, error: memberError } = await supabaseAdmin
      .from("users")
      .select("id, display_name, team_id, role, teams!fk_team (id, name)")
      .eq("id", memberId)
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (memberError || !member) {
      console.error("Member lookup error:", memberError);
      return NextResponse.json(
        { error: "Member not found in your organization" },
        { status: 404 }
      );
    }

    // Only members can be moved (not owners or admins)
    if (member.role !== "member") {
      return NextResponse.json(
        { error: "Can only move members between teams. Owners and admins cannot be moved." },
        { status: 400 }
      );
    }

    // Verify the target team exists and belongs to this organization
    const { data: targetTeam, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("id, name")
      .eq("id", teamId)
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (teamError || !targetTeam) {
      return NextResponse.json(
        { error: "Target team not found in your organization" },
        { status: 404 }
      );
    }

    // Check if member is already in this team
    if (member.team_id === teamId) {
      return NextResponse.json(
        { error: "Member is already in this team" },
        { status: 400 }
      );
    }

    // Store old team name for activity log
    const oldTeamName = member.teams?.name || "No Team";

    // Update member's team
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ team_id: teamId })
      .eq("id", memberId);

    if (updateError) {
      console.error("Failed to update member team:", updateError);
      return NextResponse.json(
        { error: "Failed to move member to new team" },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity(
      currentUser.id,
      currentUser.organization_id,
      "member_moved",
      "user",
      memberId,
      {
        member_id: memberId,
        member_name: member.display_name,
        from_team: oldTeamName,
        to_team: targetTeam.name,
        from_team_id: member.team_id,
        to_team_id: teamId,
        moved_by: currentUser.display_name,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `${member.display_name} moved to ${targetTeam.name}`,
        member: {
          id: member.id,
          displayName: member.display_name,
          oldTeam: oldTeamName,
          newTeam: targetTeam.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to move member between teams:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


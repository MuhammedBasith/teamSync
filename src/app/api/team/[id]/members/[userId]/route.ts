import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/server/supabase";
import { logActivity } from "@/lib/server/authHelpers";
import { sendMemberRemovedEmail } from "@/lib/server/email/sender";

/**
 * DELETE /api/team/[id]/members/[userId]
 * Remove a member from a team (Owner and Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Await params (Next.js 15 requirement)
    const { id: teamId, userId } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user profile with role
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, role, organization_id, display_name")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only owner and admin can remove members
    if (!["owner", "admin"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to remove team members" },
        { status: 403 }
      );
    }

    // Verify team exists and belongs to user's organization
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("id, name, organization_id")
      .eq("id", teamId)
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get the member to be removed
    const { data: memberToRemove, error: memberError } = await supabaseAdmin
      .from("users")
      .select("id, display_name, role, team_id, organization_id")
      .eq("id", userId)
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (memberError || !memberToRemove) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Check if member is actually in this team
    if (memberToRemove.team_id !== teamId) {
      return NextResponse.json(
        { error: "User is not a member of this team" },
        { status: 400 }
      );
    }

    // Cannot remove owner or admin from team
    if (["owner", "admin"].includes(memberToRemove.role)) {
      return NextResponse.json(
        { error: "Cannot remove owners or admins from teams. Only members can be removed." },
        { status: 400 }
      );
    }

    // Get member's email from auth.users before deletion
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authData?.users.find((u: { id?: string; email?: string }) => u.id === userId);
    const memberEmail = authUser?.email;

    // Get organization name for email
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", currentUser.organization_id)
      .single();

    // IMPORTANT: Clean up related records BEFORE deleting user
    // This prevents foreign key constraint violations
    
    // 1. Delete activity logs created by this user
    await supabaseAdmin
      .from("activity_log")
      .delete()
      .eq("actor_id", userId);

    // 2. Delete any pending invites sent by this user
    await supabaseAdmin
      .from("invites")
      .delete()
      .eq("invited_by", userId);

    // 3. Now delete user from users table
    const { error: deleteUserError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      console.error("Failed to delete user from users table:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    // Delete user from Supabase Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteAuthError) {
      console.error("Failed to delete user from auth:", deleteAuthError);
      // Continue anyway as the main user record is deleted
    }

    // Send notification email to the removed member
    if (memberEmail) {
      await sendMemberRemovedEmail(
        memberEmail,
        memberToRemove.display_name,
        org?.name || "the organization",
        team.name,
        currentUser.display_name
      );
    }

    // Log activity
    await logActivity(
      currentUser.id,
      currentUser.organization_id,
      "user_deleted",
      "user",
      userId,
      {
        team_id: teamId,
        team_name: team.name,
        member_name: memberToRemove.display_name,
        reason: "removed_from_team",
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Member account deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


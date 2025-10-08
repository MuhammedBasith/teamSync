import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/server/supabase";
import { logActivity } from "@/lib/server/authHelpers";
import { sendRoleChangedEmail } from "@/lib/server/email/sender";
import { z } from "zod";

// Validation schema for role change
const roleChangeSchema = z.object({
  role: z.enum(["admin", "member"]),
  team_id: z.string().uuid().nullable().optional(), // Required when demoting admin → member
});

/**
 * PATCH /api/members/[id]
 * Update member role (Owner only)
 * - Member → Admin: Remove from team (team_id = null)
 * - Admin → Member: Must assign to team (team_id required)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Await params (Next.js 15 requirement)
    const { id: targetUserId } = await params;

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

    // ONLY OWNER can change roles
    if (currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can change user roles" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = roleChangeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { role: newRole, team_id } = validation.data;

    // Get target user (the user whose role is being changed)
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from("users")
      .select("id, role, team_id, organization_id, display_name")
      .eq("id", targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify target user is in same organization
    if (targetUser.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: "User does not belong to your organization" },
        { status: 403 }
      );
    }

    // Prevent changing your own role
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Cannot change owner role
    if (targetUser.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change the organization owner's role" },
        { status: 400 }
      );
    }

    // Role validation is handled by Zod schema (only "admin" or "member" allowed)
    // At this point, targetUser.role is either "admin" or "member" (owner was checked above)
    const oldRole = targetUser.role as "admin" | "member";

    // If role hasn't changed, return early
    if (oldRole === newRole) {
      return NextResponse.json(
        { error: `User is already ${newRole}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: { role: string; team_id?: string | null } = { role: newRole };

    // Handle Member → Admin promotion
    if (oldRole === "member" && newRole === "admin") {
      // Remove from team (admins don't belong to teams)
      updateData.team_id = null;
    }

    // Handle Admin → Member demotion
    if (oldRole === "admin" && newRole === "member") {
      // Check if admin is managing any teams
      const { data: managedTeams, error: managedTeamsError } = await supabaseAdmin
        .from("teams")
        .select("id, name")
        .eq("manager_id", targetUserId)
        .eq("organization_id", currentUser.organization_id);

      if (managedTeamsError) {
        console.error("Failed to check managed teams:", managedTeamsError);
        return NextResponse.json(
          { error: "Failed to verify admin's managed teams" },
          { status: 500 }
        );
      }

      // Prevent demotion if admin is managing teams
      if (managedTeams && managedTeams.length > 0) {
        const teamNames = managedTeams.map(t => t.name).join(", ");
        return NextResponse.json(
          { 
            error: `Cannot demote admin to member. They are currently managing ${managedTeams.length} team(s): ${teamNames}. Please reassign these teams to another admin first.`,
          },
          { status: 400 }
        );
      }

      // Must assign to a team
      if (!team_id) {
        return NextResponse.json(
          { error: "team_id is required when demoting admin to member" },
          { status: 400 }
        );
      }

      // Verify team exists and belongs to organization
      const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id, name, organization_id")
        .eq("id", team_id)
        .eq("organization_id", currentUser.organization_id)
        .single();

      if (teamError || !team) {
        return NextResponse.json(
          { error: "Invalid team. Team not found or does not belong to your organization." },
          { status: 400 }
        );
      }

      updateData.team_id = team_id;
    }

    // Update user role in database
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", targetUserId)
      .select("id, role, team_id, display_name, avatar_url")
      .single();

    if (updateError) {
      // Log only error message, not the entire error object
      console.error("Failed to update user role:", updateError.message || updateError);
  return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Get target user's email from auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    const targetUserEmail = authUser?.user?.email;

    // Get organization name
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", currentUser.organization_id)
      .single();

    // Log activity
    await logActivity(
      currentUser.id,
      currentUser.organization_id,
      "role_changed",
      "user",
      targetUserId,
      {
        user_id: targetUserId,
        user_name: targetUser.display_name,
        from: oldRole,
        to: newRole,
        changed_by: currentUser.display_name,
        ...(newRole === "member" && team_id && { assigned_team_id: team_id }),
      }
    );

    // Send email notification
    if (targetUserEmail && org?.name) {
      await sendRoleChangedEmail(
        targetUserEmail,
        targetUser.display_name,
        org.name,
        oldRole,
        newRole,
        currentUser.display_name
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `User role successfully changed from ${oldRole} to ${newRole}`,
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    // Only log error message, not the entire object (prevents circular ref issues)
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Role change error:", errorMessage);
    
    return NextResponse.json(
      {
        error: "Failed to update user role",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Placeholder for other methods
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   return NextResponse.json(
//     { message: "GET member details - Coming soon" },
//     { status: 501 }
//   );
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   return NextResponse.json(
//     { message: "DELETE member - Use team-specific endpoint" },
//     { status: 501 }
//   );
// }


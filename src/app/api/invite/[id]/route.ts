import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";
import { createSupabaseAdmin } from "@/lib/server/supabase";

/**
 * DELETE /api/invite/[id]
 * Revoke/delete an invite (Owner only for admin invites, Owner/Admin for member invites)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Await params (Next.js 15 requirement)
    const { id: inviteId } = await params;

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

    // Get the invite to check its role
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select("id, role, organization_id, accepted")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if invite belongs to user's organization
    if (invite.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this invite" },
        { status: 403 }
      );
    }

    // Can't delete accepted invites through this endpoint
    // Use /api/admin/[id] endpoint to remove admin users
    if (invite.accepted) {
      return NextResponse.json(
        { error: "Cannot revoke an accepted invitation. Use the remove admin endpoint instead." },
        { status: 400 }
      );
    }

    // Role-based access control
    // Only owner can delete admin invites
    if (invite.role === "admin" && currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can delete admin invites" },
        { status: 403 }
      );
    }

    // Owner or admin can delete member invites
    if (
      invite.role === "member" &&
      !["owner", "admin"].includes(currentUser.role)
    ) {
      return NextResponse.json(
        { error: "You don't have permission to delete this invite" },
        { status: 403 }
      );
    }

    // Delete the invite
    const { error: deleteError } = await supabaseAdmin
      .from("invites")
      .delete()
      .eq("id", inviteId);

    if (deleteError) {
      console.error("Failed to delete invite:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete invite" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Invite deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete invite error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";
import { createSupabaseAdmin } from "@/lib/server/supabase";
import { sendAdminRemovedEmail } from "@/lib/server/email/sender";
import { logActivity } from "@/lib/server/authHelpers";

/**
 * DELETE /api/admin/[id]
 * Remove an admin user from the organization (Owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseServer = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Await params (Next.js 15 requirement)
    const { id: adminUserId } = await params;

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

    // Only owner can delete admins
    if (currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can remove admins" },
        { status: 403 }
      );
    }

    // Get the admin user to verify they exist and belong to same org
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("id, role, organization_id, display_name")
      .eq("id", adminUserId)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Verify admin belongs to same organization
    if (adminUser.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: "You don't have permission to remove this admin" },
        { status: 403 }
      );
    }

    // Verify the user is actually an admin
    if (adminUser.role !== "admin") {
      return NextResponse.json(
        { error: "This user is not an admin" },
        { status: 400 }
      );
    }

    // Prevent owner from deleting themselves
    if (adminUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    // Get the user's email from Supabase Auth before deletion
    const { data: authUser } =
      await supabaseAdmin.auth.admin.getUserById(adminUserId);

    const userEmail = authUser?.user?.email;

    // IMPORTANT: Delete related records BEFORE deleting the auth user
    // This prevents foreign key constraint violations
    
    // 1. Delete activity logs created by this user
    await supabaseAdmin
      .from("activity_log")
      .delete()
      .eq("actor_id", adminUserId);

    // 2. Delete invite records if we have the email
    if (userEmail) {
      await supabaseAdmin
        .from("invites")
        .delete()
        .eq("email", userEmail)
        .eq("organization_id", currentUser.organization_id);
    }

    // 3. Delete any teams created by this user (update created_by to null instead)
    await supabaseAdmin
      .from("teams")
      .update({ created_by: null })
      .eq("created_by", adminUserId);

    // 4. Delete user record from users table FIRST
    const { error: deleteUserError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", adminUserId);

    if (deleteUserError) {
      console.error("Failed to delete user record:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to remove admin user record" },
        { status: 500 }
      );
    }

    // 5. Finally, delete the user from Supabase Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
      adminUserId
    );

    if (deleteAuthError) {
      console.error("Failed to delete auth user:", deleteAuthError);
      // User record is already deleted, so we'll return success anyway
      // The auth user will remain but won't have a profile
    }

    // Send notification email to the removed admin
    if (userEmail && adminUser) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("name")
        .eq("id", currentUser.organization_id)
        .single();

      await sendAdminRemovedEmail(
        userEmail,
        adminUser.display_name,
        org?.name || "the organization",
        currentUser.display_name
      );
    }

    // Log activity
    if (adminUser) {
      await logActivity(
        currentUser.id,
        currentUser.organization_id,
        "user_deleted",
        "user",
        adminUserId,
        {
          admin_name: adminUser.display_name,
          reason: "admin_removed",
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin account deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


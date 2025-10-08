import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/server/supabase";

/**
 * GET /api/admin
 * Fetch all admins in the organization (from users table, not invites)
 * This reflects real-time role changes (promotion/demotion)
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

    // Get current user profile
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

    // Only owners can view admin list
    if (currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can view admin list" },
        { status: 403 }
      );
    }

    // Fetch all admins from users table
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from("users")
      .select("id, display_name, avatar_url, created_at")
      .eq("organization_id", currentUser.organization_id)
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (adminsError) {
      console.error("Failed to fetch admins:", adminsError);
      return NextResponse.json(
        { error: "Failed to fetch admins" },
        { status: 500 }
      );
    }

    // Get email for each admin from auth.users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const adminsWithEmail = admins.map((admin) => {
      const authUser = authUsers?.users.find((u) => u.id === admin.id);
      return {
        ...admin,
        email: authUser?.email || "Unknown",
      };
    });

    return NextResponse.json(
      {
        success: true,
        admins: adminsWithEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Fetch admins error:", errorMessage);
    
    return NextResponse.json(
      {
        error: "Failed to fetch admins",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}


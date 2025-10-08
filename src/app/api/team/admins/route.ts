import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/server/supabase";

/**
 * GET /api/team/admins
 * Get all admins in the organization (Owner only)
 * Used for selecting team manager when creating/updating teams
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
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only owner can access this endpoint
    if (currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owner can view admin list" },
        { status: 403 }
      );
    }

    // Get all admins in the organization
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from("users")
      .select("id, display_name, avatar_url, created_at")
      .eq("organization_id", currentUser.organization_id)
      .eq("role", "admin")
      .order("display_name", { ascending: true });

    if (adminsError) {
      console.error("Failed to fetch admins:", adminsError);
      return NextResponse.json(
        { error: "Failed to fetch admins" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        admins: admins || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch admins error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


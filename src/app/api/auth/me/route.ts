import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user profile from users table
    // Specify the relationship to avoid ambiguity (user belongs to one org)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        organization_id,
        team_id,
        role,
        display_name,
        avatar_url,
        created_at,
        organizations!users_organization_id_fkey (
          id,
          name,
          color_palette,
          tier_id,
          tiers (
            name,
            max_members,
            max_teams
          )
        ),
        teams!fk_team (
          id,
          name
        )
      `
      )
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("User data fetch error:", userError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userData.id,
          email: user.email,
          displayName: userData.display_name,
          avatarUrl: userData.avatar_url,
          role: userData.role,
          organizationId: userData.organization_id,
          teamId: userData.team_id,
          createdAt: userData.created_at,
          organization: userData.organizations,
          team: userData.teams,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


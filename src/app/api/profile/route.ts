import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";
import { createSupabaseAdmin } from "@/lib/server/supabase";
import { z } from "zod";

const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be less than 100 characters")
    .trim(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Get current user
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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(
        `
        id,
        display_name,
        avatar_url,
        role,
        created_at,
        organization_id,
        team_id,
        organizations!users_organization_id_fkey (
          id,
          name
        ),
        teams!fk_team (
          id,
          name
        )
      `
      )
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          id: profile.id,
          email: user.email,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          createdAt: profile.created_at,
          organization: profile.organizations,
          team: profile.teams,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();

    // Get current user
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update display name in users table
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        display_name: validatedData.display_name,
      })
      .eq("id", user.id)
      .select(
        `
        id,
        display_name,
        avatar_url,
        role,
        created_at,
        organization_id,
        team_id,
        organizations!users_organization_id_fkey (
          id,
          name
        ),
        teams!fk_team (
          id,
          name
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        profile: {
          id: updatedProfile.id,
          email: user.email,
          displayName: updatedProfile.display_name,
          avatarUrl: updatedProfile.avatar_url,
          role: updatedProfile.role,
          createdAt: updatedProfile.created_at,
          organization: updatedProfile.organizations,
          team: updatedProfile.teams,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}


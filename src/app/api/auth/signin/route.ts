import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";
import { signinSchema } from "@/lib/validations/auth";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    let validatedData;
    try {
      validatedData = signinSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const supabase = await createSupabaseServer();

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      console.error("Sign in error:", error);
      return NextResponse.json(
        { error: error.message || "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Fetch user profile from users table
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
        organizations (
          id,
          name,
          color_palette
        )
      `
      )
      .eq("id", data.user.id)
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
        message: "Signed in successfully",
        user: {
          id: userData.id,
          email: data.user.email,
          displayName: userData.display_name,
          avatarUrl: userData.avatar_url,
          role: userData.role,
          organizationId: userData.organization_id,
          teamId: userData.team_id,
          organization: userData.organizations,
        },
        session: {
          accessToken: data.session?.access_token,
          refreshToken: data.session?.refresh_token,
          expiresAt: data.session?.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


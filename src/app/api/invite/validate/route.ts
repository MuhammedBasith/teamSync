import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get("code");

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // Fetch invite details
    const { data: invite, error } = await supabase
      .from("invites")
      .select(
        `
        id,
        email,
        role,
        accepted,
        created_at,
        organizations (
          id,
          name,
          color_palette
        )
      `
      )
      .eq("id", inviteCode)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if invite is already accepted
    if (invite.accepted) {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 410 } // Gone
      );
    }

    return NextResponse.json(
      {
        success: true,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          organization: invite.organizations,
          createdAt: invite.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Invite validation error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


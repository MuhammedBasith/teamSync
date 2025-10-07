import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to sign out" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Signed out successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


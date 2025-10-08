import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/server/supabase";
import { getQuotaInfo } from "@/lib/server/quotaHelpers";

/**
 * GET /api/quota
 * Get current quota usage and limits for the organization
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
      .select("id, organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get quota information
    const quotaInfo = await getQuotaInfo(currentUser.organization_id);

    return NextResponse.json(
      {
        success: true,
        ...quotaInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch quota error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


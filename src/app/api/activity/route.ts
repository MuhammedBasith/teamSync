import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";

/**
 * GET /api/activity
 * Fetch activity logs with pagination, filters, and UUID resolution
 * Only accessible by owners and admins
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
      .select("id, organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Only owners and admins can view activity logs." },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const actionType = searchParams.get("actionType");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 per page
    const offset = (validPage - 1) * validLimit;

    // Build query for activity logs
    let query = supabaseAdmin
      .from("activity_log")
      .select("*", { count: "exact" })
      .eq("organization_id", currentUser.organization_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    if (actionType) {
      query = query.eq("action_type", actionType);
    }

    // Apply pagination
    query = query.range(offset, offset + validLimit - 1);

    const { data: activities, error: activitiesError, count } = await query;

    if (activitiesError) {
      console.error("Activity fetch error:", activitiesError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    // Resolve UUIDs to names
    const enrichedActivities = await Promise.all(
      (activities || []).map(async (activity) => {
        // Get actor info
        const { data: actor } = await supabaseAdmin
          .from("users")
          .select("display_name, avatar_url")
          .eq("id", activity.actor_id)
          .single();

        // Get target info based on target_type
        let targetName = undefined;
        if (activity.target_type === "user") {
          const { data: targetUser } = await supabaseAdmin
            .from("users")
            .select("display_name")
            .eq("id", activity.target_id)
            .single();
          // Fallback to details.user_name if user was deleted or not found
          targetName = targetUser?.display_name || activity.details?.user_name;
        } else if (activity.target_type === "team") {
          const { data: targetTeam } = await supabaseAdmin
            .from("teams")
            .select("name")
            .eq("id", activity.target_id)
            .single();
          // Fallback to details.team_name if team was deleted or not found
          targetName = targetTeam?.name || activity.details?.team_name;
        } else if (activity.target_type === "organization") {
          const { data: targetOrg } = await supabaseAdmin
            .from("organizations")
            .select("name")
            .eq("id", activity.target_id)
            .single();
          targetName = targetOrg?.name;
        }

        return {
          id: activity.id,
          actorId: activity.actor_id,
          actorName: actor?.display_name || "Unknown User",
          actorAvatarUrl: actor?.avatar_url || null,
          organizationId: activity.organization_id,
          actionType: activity.action_type,
          targetType: activity.target_type,
          targetId: activity.target_id,
          targetName,
          details: activity.details,
          createdAt: activity.created_at,
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / validLimit);

    return NextResponse.json(
      {
        success: true,
        activities: enrichedActivities,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count || 0,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Activity API error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";

/**
 * GET /api/activity/export
 * Export activity logs as CSV or JSON
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
        {
          error:
            "Access denied. Only owners and admins can export activity logs.",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const actionType = searchParams.get("actionType");

    // Validate format
    if (format !== "csv" && format !== "json") {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 }
      );
    }

    // Build query for activity logs (max 10k records as per PRD)
    let query = supabaseAdmin
      .from("activity_log")
      .select("*")
      .eq("organization_id", currentUser.organization_id)
      .order("created_at", { ascending: false })
      .limit(10000); // Max 10k records

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

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      console.error("Activity fetch error:", activitiesError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json(
        { error: "No activities found to export" },
        { status: 404 }
      );
    }

    // Resolve UUIDs to names
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        // Get actor info
        const { data: actor } = await supabaseAdmin
          .from("users")
          .select("display_name, avatar_url")
          .eq("id", activity.actor_id)
          .single();

        // Get target info based on target_type
        let targetName = "Unknown";
        if (activity.target_type === "user") {
          const { data: targetUser } = await supabaseAdmin
            .from("users")
            .select("display_name")
            .eq("id", activity.target_id)
            .single();
          // Fallback to details.user_name if user was deleted or not found
          targetName = targetUser?.display_name || activity.details?.user_name || "Unknown User";
        } else if (activity.target_type === "team") {
          const { data: targetTeam } = await supabaseAdmin
            .from("teams")
            .select("name")
            .eq("id", activity.target_id)
            .single();
          // Fallback to details.team_name if team was deleted or not found
          targetName = targetTeam?.name || activity.details?.team_name || "Unknown Team";
        } else if (activity.target_type === "organization") {
          const { data: targetOrg } = await supabaseAdmin
            .from("organizations")
            .select("name")
            .eq("id", activity.target_id)
            .single();
          targetName = targetOrg?.name || "Unknown Organization";
        }

        return {
          id: activity.id,
          actor_name: actor?.display_name || "Unknown User",
          action_type: activity.action_type,
          target_type: activity.target_type,
          target_name: targetName,
          details: activity.details,
          created_at: activity.created_at,
        };
      })
    );

    if (format === "json") {
      // Return JSON
      return NextResponse.json(
        {
          success: true,
          exported_at: new Date().toISOString(),
          total_records: enrichedActivities.length,
          activities: enrichedActivities,
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="activity-log-${Date.now()}.json"`,
          },
        }
      );
    } else {
      // Return CSV
      const csvRows = [
        [
          "ID",
          "Actor",
          "Action Type",
          "Target Type",
          "Target Name",
          "Details",
          "Created At",
        ], // Header
        ...enrichedActivities.map((activity) => [
          activity.id,
          activity.actor_name,
          activity.action_type,
          activity.target_type,
          activity.target_name,
          JSON.stringify(activity.details || {}),
          activity.created_at,
        ]),
      ];

      const csvContent = csvRows.map((row) => row.join(",")).join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="activity-log-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Activity export error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


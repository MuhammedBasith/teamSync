import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";
import { sendMemberInviteEmail } from "@/lib/server/email/sender";
import { logActivity } from "@/lib/server/authHelpers";

export type BulkInviteSendRequest = {
  invites: Array<{ email: string; role: string }>;
  teamId?: string | null;
};

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get random delay between min and max ms
 */
function getRandomDelay(min: number = 100, max: number = 500): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * POST /api/invite/bulk/send
 * Send bulk invites with progressive updates and rate limiting
 * 
 * Note: This is a simplified version. For production with many invites,
 * consider using a job queue (Bull, BullMQ) or serverless functions with longer timeouts.
 */
export async function POST(request: NextRequest) {
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

    // Get user profile with role and organization name
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        organization_id,
        role,
        display_name,
        organizations!users_organization_id_fkey (
          name
        )
      `
      )
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
        { error: "Only owners and admins can bulk invite members" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: BulkInviteSendRequest = await request.json();
    const { invites, teamId } = body;

    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      return NextResponse.json(
        { error: "No invites provided" },
        { status: 400 }
      );
    }

    // Limit to 50 invites per request (serverless timeout consideration)
    if (invites.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 invites per batch. Please split into multiple uploads." },
        { status: 400 }
      );
    }

    // Get organization name
    const organizationName = Array.isArray(currentUser.organizations) 
      ? currentUser.organizations[0]?.name 
      : (currentUser.organizations as { name: string } | null)?.name || "the organization";

    // Get team name if teamId is provided
    let teamName: string | undefined;
    if (teamId) {
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();
      teamName = team?.name;
    }

    const results: Array<{
      email: string;
      success: boolean;
      error?: string;
    }> = [];

    // Process each invite with random delays
    for (let i = 0; i < invites.length; i++) {
      const invite = invites[i];
      const email = invite.email.toLowerCase();

      try {
        // Create invite in database
        const { data: inviteData, error: inviteError } = await supabaseAdmin
          .from("invites")
          .insert({
            email,
            organization_id: currentUser.organization_id,
            team_id: teamId || null,
            role: "member",
            invited_by: currentUser.id,
            accepted: false,
          })
          .select()
          .single();

        if (inviteError) {
          results.push({
            email,
            success: false,
            error: inviteError.message,
          });
          continue;
        }

        // Send email
        try {
          await sendMemberInviteEmail(
            email,
            currentUser.display_name || "Team Admin",
            organizationName,
            inviteData.id,
            teamName
          );

          // Log activity
          await logActivity(
            currentUser.id,
            currentUser.organization_id,
            "user_invited",
            "user",
            inviteData.id,
            {
              email,
              role: "member",
              bulk_invite: true,
            }
          );

          results.push({
            email,
            success: true,
          });
        } catch (emailError) {
          // Email failed but invite created
          results.push({
            email,
            success: false,
            error: `Invite created but email failed: ${emailError instanceof Error ? emailError.message : "Unknown error"}`,
          });
        }

        // Add random delay between sends (avoid SMTP rate limiting)
        if (i < invites.length - 1) {
          const delayMs = getRandomDelay(100, 500);
          await delay(delayMs);
        }
      } catch (error) {
        results.push({
          email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        success: true,
        summary: {
          total: invites.length,
          successful: successCount,
          failed: failureCount,
        },
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk invite send error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



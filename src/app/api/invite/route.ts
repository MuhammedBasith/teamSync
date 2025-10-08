import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";
import { createSupabaseAdmin } from "@/lib/server/supabase";
import { sendAdminInviteEmail, sendMemberInviteEmail } from "@/lib/server/email/sender";
import { logActivity } from "@/lib/server/authHelpers";
import { checkMemberQuota } from "@/lib/server/quotaHelpers";
import { z } from "zod";

// Validation schema for invite creation
const createInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"], {
    message: "Role must be either 'admin' or 'member'",
  }),
  teamId: z.string().uuid().optional(),
});

/**
 * POST /api/invite
 * Create a new invite (Owner only for admins, Owner/Admin for members)
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

    // Get user profile with role
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        role,
        organization_id,
        display_name,
        organizations!users_organization_id_fkey (
          id,
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

    // Parse and validate request body
    const body = await request.json();
    let validatedData;

    try {
      validatedData = createInviteSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }

    // Role-based access control
    // Only owner can invite admins
    if (validatedData.role === "admin" && currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can invite admins" },
        { status: 403 }
      );
    }

    // Owner or admin can invite members
    if (
      validatedData.role === "member" &&
      !["owner", "admin"].includes(currentUser.role)
    ) {
      return NextResponse.json(
        { error: "You don't have permission to invite members" },
        { status: 403 }
      );
    }

    // Check if user with this email already exists in auth
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users.some(
      (u: { email?: string }) => u.email?.toLowerCase() === validatedData.email.toLowerCase()
    );

    if (emailExists) {
      return NextResponse.json(
        {
          error:
            "A user with this email already has an account. They should log in instead.",
        },
        { status: 409 }
      );
    }

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabaseAdmin
      .from("invites")
      .select("id, accepted")
      .eq("email", validatedData.email.toLowerCase())
      .eq("organization_id", currentUser.organization_id)
      .single();

    if (existingInvite && !existingInvite.accepted) {
      return NextResponse.json(
        { error: "An invite for this email is already pending" },
        { status: 409 }
      );
    }

    // Check member quota before creating invite
    const quotaCheck = await checkMemberQuota(currentUser.organization_id);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: quotaCheck.error,
          quotaInfo: {
            currentUsage: quotaCheck.currentUsage,
            limits: quotaCheck.limits,
          },
        },
        { status: 403 }
      );
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .insert({
        email: validatedData.email.toLowerCase(),
        organization_id: currentUser.organization_id,
        team_id: validatedData.teamId || null,
        role: validatedData.role,
        invited_by: currentUser.id,
        accepted: false,
      })
      .select()
      .single();

    if (inviteError || !invite) {
      console.error("Failed to create invite:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    // Send invitation email
    const organizationName = Array.isArray(currentUser.organizations)
      ? currentUser.organizations[0]?.name
      : (currentUser.organizations as { name: string } | null)?.name || "the organization";
    const inviterName = currentUser.display_name || "A team member";

    let emailResult;
    if (validatedData.role === "admin") {
      emailResult = await sendAdminInviteEmail(
        validatedData.email,
        inviterName,
        organizationName,
        invite.id
      );
    } else {
      // Get team name if team_id provided
      let teamName;
      if (validatedData.teamId) {
        const { data: team } = await supabaseAdmin
          .from("teams")
          .select("name")
          .eq("id", validatedData.teamId)
          .single();
        teamName = team?.name;
      }

      emailResult = await sendMemberInviteEmail(
        validatedData.email,
        inviterName,
        organizationName,
        invite.id,
        teamName
      );
    }

    if (!emailResult.success) {
      console.error("Failed to send invite email:", emailResult.error);
      // Don't fail the request, but log the error
      // The invite is still created, admin can resend later
    }

    // Log activity
    await logActivity(
      currentUser.id,
      currentUser.organization_id,
      "user_invited",
      "user",
      invite.id,
      {
        email: validatedData.email,
        role: validatedData.role,
        invite_method: "email",
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Invitation sent successfully",
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          createdAt: invite.created_at,
        },
        emailSent: emailResult.success,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite creation error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invite
 * List all invites for the current user's organization
 * Owner and Admin can see all invites
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

    // Only owner and admin can view invites
    if (!["owner", "admin"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to view invites" },
        { status: 403 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // 'pending' or 'accepted'
    const role = searchParams.get("role"); // 'admin' or 'member'

    // Build query - note: we'll fetch user_id separately for accepted invites
    let query = supabaseAdmin
      .from("invites")
      .select(
        `
        id,
        email,
        role,
        accepted,
        created_at,
        accepted_at,
        team_id,
        teams (
          id,
          name
        ),
        invited_by_user:users!invites_invited_by_fkey (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("organization_id", currentUser.organization_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status === "pending") {
      query = query.eq("accepted", false);
    } else if (status === "accepted") {
      query = query.eq("accepted", true);
    }

    if (role) {
      query = query.eq("role", role);
    }

    const { data: invites, error: invitesError } = await query;

    if (invitesError) {
      console.error("Failed to fetch invites:", invitesError);
      return NextResponse.json(
        { error: "Failed to fetch invites" },
        { status: 500 }
      );
    }

    // For accepted invites, add user_id by looking up user by email in auth.users
    // Since users table doesn't have email field, we need to find the user by email from auth
    const invitesWithUserIds = await Promise.all(
      (invites || []).map(async (invite) => {
        if (invite.accepted) {
          // Get all auth users and find by email
          const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = authData?.users.find(
            (u: { email?: string; id?: string }) => u.email?.toLowerCase() === invite.email.toLowerCase()
          );
          
          if (authUser) {
            // Verify this user belongs to the same organization
            const { data: userData } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("id", authUser.id)
              .eq("organization_id", currentUser.organization_id)
              .single();
            
            return {
              ...invite,
              user_id: userData?.id || null,
            };
          }
        }
        return invite;
      })
    );

    return NextResponse.json(
      {
        success: true,
        invites: invitesWithUserIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch invites error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


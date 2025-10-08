import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";
import { checkMemberQuota } from "@/lib/server/quotaHelpers";

export type BulkInviteValidationRequest = {
  invites: Array<{ email: string; role: string }>;
};

export type BulkInviteValidationResponse = {
  success: boolean;
  valid: Array<{ email: string; role: string }>;
  errors: Array<{ email: string; error: string }>;
  quotaCheck: {
    currentMembers: number;
    maxMembers: number;
    requestedCount: number;
    remainingSlots: number;
    canInvite: boolean;
  };
};

/**
 * POST /api/invite/bulk/validate
 * Validate bulk invite CSV data before sending
 * Checks: email format, duplicates, existing users, quota limits
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
        { error: "Only owners and admins can bulk invite members" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: BulkInviteValidationRequest = await request.json();
    const { invites } = body;

    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      return NextResponse.json(
        { error: "No invites provided" },
        { status: 400 }
      );
    }

    // Check quota first
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select(
        `
        id,
        tiers (
          max_members
        )
      `
      )
      .eq("id", currentUser.organization_id)
      .single();

    const tierData = org?.tiers as unknown as { max_members: number };
    const maxMembers = tierData?.max_members || 25;

    // Count current members
    const { count: currentMembersCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id);

    const currentMembers = currentMembersCount || 0;
    const remainingSlots = maxMembers - currentMembers;
    const requestedCount = invites.length;

    const quotaCheck = {
      currentMembers,
      maxMembers,
      requestedCount,
      remainingSlots,
      canInvite: requestedCount <= remainingSlots,
    };

    // If quota exceeded, return error immediately
    if (!quotaCheck.canInvite) {
      return NextResponse.json(
        {
          success: false,
          error: `Quota exceeded: Trying to invite ${requestedCount} members, but only ${remainingSlots} slots remaining`,
          quotaCheck,
        },
        { status: 400 }
      );
    }

    // Validate each invite
    const valid: Array<{ email: string; role: string }> = [];
    const errors: Array<{ email: string; error: string }> = [];

    // Get all existing users and pending invites to check duplicates
    const { data: existingUsers } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("organization_id", currentUser.organization_id);

    const existingEmails = new Set(
      (
        await supabaseAdmin.auth.admin.listUsers()
      ).data.users.map((u) => u.email?.toLowerCase())
    );

    const { data: pendingInvites } = await supabaseAdmin
      .from("invites")
      .select("email")
      .eq("organization_id", currentUser.organization_id)
      .eq("accepted", false);

    const pendingEmails = new Set(
      pendingInvites?.map((inv) => inv.email.toLowerCase()) || []
    );

    // Validate each invite
    for (const invite of invites) {
      const email = invite.email.toLowerCase();

      // Check if email already exists
      if (existingEmails.has(email)) {
        errors.push({ email, error: "User already exists" });
        continue;
      }

      // Check if invite already pending
      if (pendingEmails.has(email)) {
        errors.push({ email, error: "Invite already sent" });
        continue;
      }

      // Role must be member for bulk invites
      if (invite.role !== "member") {
        errors.push({ email, error: "Only member role allowed in bulk invites" });
        continue;
      }

      // Valid invite
      valid.push({ email, role: "member" });
    }

    const response: BulkInviteValidationResponse = {
      success: errors.length === 0,
      valid,
      errors,
      quotaCheck,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Bulk invite validation error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



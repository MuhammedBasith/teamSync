import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/server/supabase";
import {
  ownerSignupSchema,
  invitedSignupSchema,
} from "@/lib/validations/auth";
import {
  generateAvatarUrl,
  getFreeTierId,
  emailExists,
  validateInvite,
  logActivity,
} from "@/lib/server/authHelpers";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createSupabaseAdmin();

    // Determine signup type based on presence of inviteCode
    const isInvitedSignup = !!body.inviteCode;

    // Validate input based on signup type
    let validatedData;
    try {
      if (isInvitedSignup) {
        validatedData = invitedSignupSchema.parse(body);
      } else {
        validatedData = ownerSignupSchema.parse(body);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check if email already exists
    const exists = await emailExists(validatedData.email);
    if (exists) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate display name and avatar URL
    const displayName = `${validatedData.firstName} ${validatedData.lastName}`;
    const avatarUrl = generateAvatarUrl(
      validatedData.firstName,
      validatedData.lastName
    );

    if (isInvitedSignup) {
      // ==========================================
      // INVITED USER SIGNUP (Admin/Member)
      // ==========================================
      const data = validatedData as z.infer<typeof invitedSignupSchema>;

      // Validate invite code
      const invite = await validateInvite(data.inviteCode);

      // Check if invite email matches signup email
      if (invite.email.toLowerCase() !== data.email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email does not match the invitation" },
          { status: 403 }
        );
      }

      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Skip email verification
          user_metadata: {
            display_name: displayName,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        });

      if (authError || !authData.user) {
        console.error("Auth creation error:", authError);
        return NextResponse.json(
          { error: authError?.message || "Failed to create account" },
          { status: 500 }
        );
      }

      // Create user record in users table
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        organization_id: invite.organization_id,
        team_id: invite.team_id,
        role: invite.role,
        display_name: displayName,
        avatar_url: avatarUrl,
      });

      if (userError) {
        // Rollback: delete auth user if user record creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error("User record creation error:", userError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      // Mark invite as accepted
      await supabase
        .from("invites")
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", data.inviteCode);

      // Note: Activity was already logged when the invite was sent (in /api/invite)
      // No need to log again here to avoid duplicate entries

      return NextResponse.json(
        {
          success: true,
          message: "Account created successfully",
          user: {
            id: authData.user.id,
            email: authData.user.email,
            displayName,
            role: invite.role,
            organizationId: invite.organization_id,
          },
        },
        { status: 201 }
      );
    } else {
      // ==========================================
      // OWNER SIGNUP (Creates new organization)
      // ==========================================
      const data = validatedData as z.infer<typeof ownerSignupSchema>;

      // Get free tier ID
      const freeTierId = await getFreeTierId();

      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Skip email verification
          user_metadata: {
            display_name: displayName,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        });

      if (authError || !authData.user) {
        console.error("Auth creation error:", authError);
        return NextResponse.json(
          { error: authError?.message || "Failed to create account" },
          { status: 500 }
        );
      }

      // Create user record in users table FIRST (without organization_id initially)
      // This allows us to reference this user when creating the organization
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        organization_id: null, // Will be updated after org creation
        team_id: null,
        role: "owner",
        display_name: displayName,
        avatar_url: avatarUrl,
      });

      if (userError) {
        // Rollback: delete auth user if user record creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error("User record creation error:", userError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      // Now create organization (can reference user.id as owner_id)
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: data.organizationName,
          tier_id: freeTierId,
          owner_id: authData.user.id,
          color_palette: data.colorPalette || null,
        })
        .select()
        .single();

      if (orgError || !orgData) {
        // Rollback: delete auth user and user record if org creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from("users").delete().eq("id", authData.user.id);
        console.error("Organization creation error:", orgError);
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 }
        );
      }

      // Update user record with organization_id
      const { error: updateError } = await supabase
        .from("users")
        .update({ organization_id: orgData.id })
        .eq("id", authData.user.id);

      if (updateError) {
        // Rollback: delete everything if update fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from("organizations").delete().eq("id", orgData.id);
        await supabase.from("users").delete().eq("id", authData.user.id);
        console.error("User update error:", updateError);
        return NextResponse.json(
          { error: "Failed to link user to organization" },
          { status: 500 }
        );
      }

      // Log activity (organization created)
      await logActivity(
        authData.user.id,
        orgData.id,
        "organization_created",
        "organization",
        orgData.id,
        {
          organization_name: data.organizationName,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: "Account and organization created successfully",
          user: {
            id: authData.user.id,
            email: authData.user.email,
            displayName,
            role: "owner",
            organizationId: orgData.id,
          },
          organization: {
            id: orgData.id,
            name: orgData.name,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


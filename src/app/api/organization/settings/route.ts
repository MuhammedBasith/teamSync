import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";

/**
 * GET /api/organization/settings
 * Fetch organization settings including name, color palette, tier, and quota usage
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

    // Get user profile
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser || !currentUser.organization_id) {
      return NextResponse.json(
        { error: "User profile or organization not found" },
        { status: 404 }
      );
    }

    // Fetch organization with tier info
    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select(
        `
        id,
        name,
        color_palette,
        created_at,
        owner_id,
        tier_id,
        tiers (
          id,
          name,
          max_members,
          max_teams,
          price_per_month
        )
      `
      )
      .eq("id", currentUser.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get current usage counts
    const { count: memberCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id);

    const { count: teamCount } = await supabaseAdmin
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", currentUser.organization_id);

    // Format response
    const response = {
      organization: {
        id: organization.id,
        name: organization.name,
        colorPalette: organization.color_palette || {
          primary: "#3B82F6",
          accent: "#8B5CF6",
          background: "#F3F4F6",
        },
        createdAt: organization.created_at,
        ownerId: organization.owner_id,
        tier: (() => {
          const tierData = Array.isArray(organization.tiers) ? organization.tiers[0] : organization.tiers;
          return {
            id: tierData.id,
            name: tierData.name,
            maxMembers: tierData.max_members,
            maxTeams: tierData.max_teams,
            pricePerMonth: tierData.price_per_month,
          };
        })(),
      },
      usage: (() => {
        const tierData = Array.isArray(organization.tiers) ? organization.tiers[0] : organization.tiers;
        return {
          members: {
            current: memberCount || 0,
            max: tierData.max_members,
            percentage: Math.round(
              ((memberCount || 0) / tierData.max_members) * 100
            ),
          },
          teams: {
            current: teamCount || 0,
            max: tierData.max_teams,
            percentage: Math.round(
              ((teamCount || 0) / tierData.max_teams) * 100
            ),
          },
        };
      })(),
      permissions: {
        canEdit: currentUser.role === "owner",
        isOwner: currentUser.role === "owner",
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch organization settings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch organization settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organization/settings
 * Update organization settings (name and/or color palette)
 * Only accessible to organization owner
 */
export async function PATCH(request: NextRequest) {
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

    // Get user profile
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser || !currentUser.organization_id) {
      return NextResponse.json(
        { error: "User profile or organization not found" },
        { status: 404 }
      );
    }

    // Check if user is owner
    if (currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can update settings" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, colorPalette } = body;

    // Validate at least one field is provided
    if (!name && !colorPalette) {
      return NextResponse.json(
        { error: "At least one field (name or colorPalette) must be provided" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (name) {
      // Validate name
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Organization name must be a non-empty string" },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: "Organization name must be 100 characters or less" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (colorPalette) {
      // Validate color palette structure
      if (
        typeof colorPalette !== "object" ||
        !colorPalette.primary ||
        !colorPalette.accent ||
        !colorPalette.background
      ) {
        return NextResponse.json(
          {
            error:
              "Color palette must contain primary, accent, and background colors",
          },
          { status: 400 }
        );
      }

      // Validate color format (hex colors)
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      if (
        !hexColorRegex.test(colorPalette.primary) ||
        !hexColorRegex.test(colorPalette.accent) ||
        !hexColorRegex.test(colorPalette.background)
      ) {
        return NextResponse.json(
          { error: "All colors must be valid hex format (e.g., #3B82F6)" },
          { status: 400 }
        );
      }

      updateData.color_palette = colorPalette;
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from("organizations")
      .update(updateData)
      .eq("id", currentUser.organization_id)
      .select()
      .single();

    if (updateError || !updatedOrg) {
      console.error("Failed to update organization:", updateError);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 }
      );
    }

    // Log activity
    const { logActivity } = await import("@/lib/server/authHelpers");
    await logActivity(
      currentUser.id,
      currentUser.organization_id,
      "organization_updated",
      "organization",
      updatedOrg.id,
      {
        updated_fields: Object.keys(updateData),
        name: updateData.name || undefined,
        color_palette_updated: !!updateData.color_palette,
      }
    );

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: updatedOrg.id,
          name: updatedOrg.name,
          colorPalette: updatedOrg.color_palette,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update organization settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update organization settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


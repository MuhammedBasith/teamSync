import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/server/supabase";

/**
 * GET /api/members
 * Fetch all members and pending invites
 * 
 * Role-based access:
 * - Owner: Sees ALL members across ALL teams + all pending invites
 * - Admin: Sees only THEIR team's members + pending invites for their team
 * - Member: No access (403)
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

    // Get user profile with role and team_id
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, organization_id, role, team_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser || !currentUser.organization_id) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only owner and admin can access
    if (currentUser.role === "member") {
      return NextResponse.json(
        { error: "Members cannot access this page" },
        { status: 403 }
      );
    }

    // For admins, get the teams they manage
    let managedTeamIds: string[] = [];
    if (currentUser.role === "admin") {
      const { data: managedTeams } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("manager_id", currentUser.id)
        .eq("organization_id", currentUser.organization_id);
      
      managedTeamIds = (managedTeams || []).map(t => t.id);
      
      // If admin doesn't manage any teams, return empty result
      if (managedTeamIds.length === 0) {
        return NextResponse.json(
          {
            success: true,
            members: [],
            counts: { active: 0, pending: 0, total: 0 },
            permissions: {
              canMoveTeams: false,
              canRemove: true,
              canResendInvite: true,
            },
          },
          { status: 200 }
        );
      }
    }

    // Get query params for filters
    const searchParams = request.nextUrl.searchParams;
    const teamFilter = searchParams.get("team");
    const statusFilter = searchParams.get("status"); // 'active' or 'pending'
    const searchQuery = searchParams.get("search");

    // Fetch active members (users with accepted invites)
    let membersQuery = supabaseAdmin
      .from("users")
      .select(
        `
        id,
        display_name,
        avatar_url,
        role,
        team_id,
        created_at,
        teams!fk_team (
          id,
          name
        )
      `
      )
      .eq("organization_id", currentUser.organization_id)
      .eq("role", "member"); // Only fetch members (not owners/admins)

    // Admin: Filter to only their managed teams' members
    if (currentUser.role === "admin") {
      membersQuery = membersQuery.in("team_id", managedTeamIds);
    }

    // Apply team filter (if owner is filtering)
    if (teamFilter && currentUser.role === "owner") {
      membersQuery = membersQuery.eq("team_id", teamFilter);
    }

    const { data: members, error: membersError } = await membersQuery;

    if (membersError) {
      console.error("Failed to fetch members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Fetch pending invites
    let invitesQuery = supabaseAdmin
      .from("invites")
      .select(
        `
        id,
        email,
        role,
        team_id,
        created_at,
        invited_by,
        teams!invites_team_id_fkey (
          id,
          name
        )
      `
      )
      .eq("organization_id", currentUser.organization_id)
      .eq("accepted", false)
      .eq("role", "member"); // Only member invites (admin invites shown in Admins page)

    // Admin: Filter to only their managed teams' pending invites
    if (currentUser.role === "admin") {
      invitesQuery = invitesQuery.in("team_id", managedTeamIds);
    }

    // Apply team filter for owner
    if (teamFilter && currentUser.role === "owner") {
      invitesQuery = invitesQuery.eq("team_id", teamFilter);
    }

    const { data: pendingInvites, error: invitesError } = await invitesQuery;

    if (invitesError) {
      console.error("Failed to fetch pending invites:", invitesError);
      return NextResponse.json(
        { error: "Failed to fetch pending invites" },
        { status: 500 }
      );
    }

    // Get auth users to get emails for active members
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

    // Format active members
    const activeMembers = (members || []).map((member) => {
      const authUser = authUsers?.users.find((u: { id?: string }) => u.id === member.id);
      const teamData = Array.isArray(member.teams) ? member.teams[0] : member.teams;
      return {
        id: member.id,
        displayName: member.display_name,
        email: authUser?.email || "Unknown",
        avatarUrl: member.avatar_url,
        role: member.role,
        team: teamData
          ? {
              id: teamData.id,
              name: teamData.name,
            }
          : null,
        status: "active" as const,
        createdAt: member.created_at,
      };
    });

    // Format pending invites
    const pendingMembers = (pendingInvites || []).map((invite) => {
      const teamData = Array.isArray(invite.teams) ? invite.teams[0] : invite.teams;
      return {
        id: invite.id,
        displayName: null,
        email: invite.email,
        avatarUrl: null,
        role: invite.role,
        team: teamData
          ? {
              id: teamData.id,
              name: teamData.name,
            }
          : null,
        status: "pending" as const,
        createdAt: invite.created_at,
        inviteId: invite.id,
      };
    });

    // Combine and filter
    let allMembers = [...activeMembers, ...pendingMembers];

    // Apply status filter
    if (statusFilter === "active") {
      allMembers = allMembers.filter((m) => m.status === "active");
    } else if (statusFilter === "pending") {
      allMembers = allMembers.filter((m) => m.status === "pending");
    }

    // Apply search filter (name or email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allMembers = allMembers.filter(
        (m) =>
          m.displayName?.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
      );
    }

    // Sort by created date (newest first)
    allMembers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        members: allMembers,
        counts: {
          active: activeMembers.length,
          pending: pendingMembers.length,
          total: allMembers.length,
        },
        permissions: {
          canMoveTeams: currentUser.role === "owner",
          canRemove: true,
          canResendInvite: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

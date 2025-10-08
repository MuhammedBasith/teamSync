import { createSupabaseAdmin } from "./supabase";

// Generate avatar URL from name
export function generateAvatarUrl(firstName: string, lastName: string): string {
  const username = `${firstName}+${lastName}`;
  return `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
    username
  )}`;
}

// Get default free tier ID
export async function getFreeTierId(): Promise<string> {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("tiers")
    .select("id")
    .eq("name", "free")
    .single();

  if (error || !data) {
    throw new Error("Free tier not found. Please seed the database.");
  }

  return data.id;
}

// Check if email already exists in users table
export async function emailExists(email: string): Promise<boolean> {
  const supabase = createSupabaseAdmin();

  // Check in Supabase Auth
  const { data: authData } = await supabase.auth.admin.listUsers();
  const existsInAuth = authData?.users?.some(
    (user) => user.email === email
  );

  if (existsInAuth) return true;

  // Also check in users table as backup
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  return !!userData;
}

// Validate and get invite details
export async function validateInvite(inviteCode: string) {
  const supabase = createSupabaseAdmin();

  const { data: invite, error } = await supabase
    .from("invites")
    .select(
      `
      id,
      email,
      organization_id,
      team_id,
      role,
      invited_by,
      accepted,
      organizations (
        id,
        name,
        color_palette
      )
    `
    )
    .eq("id", inviteCode)
    .eq("accepted", false)
    .single();

  if (error || !invite) {
    throw new Error("Invalid or expired invite code");
  }

  return invite;
}

// Log activity
export async function logActivity(
supabaseAdmin: unknown, actorId: string, organizationId: string, actionType: string, targetType: string, targetId: string, details?: Record<string, unknown>) {
  const supabase = createSupabaseAdmin();

  await supabase.from("activity_log").insert({
    actor_id: actorId,
    organization_id: organizationId,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    details: details || null,
  });
}


// Server-side database helpers
// This file should only be used in API routes

// Note: We use createSupabaseAdmin() from supabase.ts for all database operations
// This ensures we always use the service role key for backend operations

export { createSupabaseAdmin as supabaseAdmin } from "./supabase";


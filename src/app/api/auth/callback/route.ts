import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/reset-password";

  console.log("Callback handler called with:", { code, token_hash, type, next });

  const supabase = await createSupabaseServer();

  // Handle PKCE flow (when code is present)
  if (code) {
    console.log("Exchanging code for session...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Code exchange error:", error);
      return NextResponse.redirect(
        new URL(`${next}?error=${encodeURIComponent(error.message)}`, origin)
      );
    }
    
    console.log("Session established:", data.session ? "Yes" : "No");
  }
  
  // Handle legacy token_hash flow (for email verification/password reset)
  if (token_hash && type) {
    console.log("Verifying OTP with token_hash...");
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error("Token verification error:", error);
      return NextResponse.redirect(
        new URL(`${next}?error=${encodeURIComponent(error.message)}`, origin)
      );
    }
    
    console.log("OTP verified, session:", data.session ? "Yes" : "No");
  }

  // If neither code nor token_hash, check if user already has a session
  if (!code && !token_hash) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error("No code, token_hash, or existing session");
      return NextResponse.redirect(
        new URL(`${next}?error=missing_credentials`, origin)
      );
    }
    
    console.log("Using existing session");
  }

  console.log("Redirecting to:", next);
  // Redirect to the next URL with the session established
  return NextResponse.redirect(new URL(next, origin));
}


import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);

    const supabase = await createSupabaseServer();

    // Send password reset email
    // Supabase will send an email with a magic link to reset password
    // The callback route will exchange the code for a session and redirect to reset-password
    const { error } = await supabase.auth.resetPasswordForEmail(
      validatedData.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`,
      }
    );

    if (error) {
      console.error("Password reset error:", error);
      
      // Don't reveal if email exists or not for security
      // Always return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password reset link has been sent to your email.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    
    // Always return success for security
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      },
      { status: 200 }
    );
  }
}


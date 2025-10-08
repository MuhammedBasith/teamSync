import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/server/supabase";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = resetPasswordSchema.parse(body);

    const supabase = await createSupabaseServer();

    // Verify user session (should have valid token from email link)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Invalid or expired reset token. Please request a new password reset link.",
        },
        { status: 401 }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        {
          error: updateError.message || "Failed to update password",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        error: "Failed to reset password",
      },
      { status: 500 }
    );
  }
}


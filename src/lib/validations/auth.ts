import { z } from "zod";

// Color palette schema
export const colorPaletteSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  accent: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  background: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
});

// Owner signup schema (creates new organization)
export const ownerSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z.string().min(1, "Organization name is required").max(100),
  colorPalette: colorPaletteSchema.optional(),
});

// Invited user signup schema (joins existing organization)
export const invitedSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().uuid("Invalid invite code"),
});

// Signin schema
export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type OwnerSignupInput = z.infer<typeof ownerSignupSchema>;
export type InvitedSignupInput = z.infer<typeof invitedSignupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;


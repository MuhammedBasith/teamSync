// Server-side invite helpers
// This file should only be used in API routes

import { randomBytes } from "crypto";

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateInviteLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/invite/accept?token=${token}`;
}

export async function bulkInviteFromCSV(csvContent: string) {
  // TODO: Implement CSV parsing and bulk invite logic
  const lines = csvContent.split("\n").slice(1); // Skip header
  const invites = lines
    .map((line) => {
      const [email, role] = line.split(",").map((s) => s.trim());
      return { email, role: role || "member" };
    })
    .filter((invite) => invite.email);

  return invites;
}


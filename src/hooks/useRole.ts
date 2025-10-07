"use client";

import { Role } from "@/types";

// Placeholder hook for role checking
export function useRole() {
  // TODO: Implement role checking logic with actual auth
  // For now, returning 'owner' as default to show all menu items
  // Change this to 'admin' or 'member' to test different views
  const role: Role = "owner"; // Temporary mock - will be replaced with actual auth

  return {
    role,
    isOwner: role === "owner",
    isAdmin: role === "admin",
    isMember: role === "member",
    loading: false,
  };
}


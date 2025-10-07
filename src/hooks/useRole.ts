"use client";

import { Role } from "@/types";
import { useAuth } from "@/context/AuthContext";

// Hook for role checking using real auth data
export function useRole() {
  const { user, loading } = useAuth();
  
  const role: Role | null = user?.role || null;

  return {
    role,
    isOwner: role === "owner",
    isAdmin: role === "admin",
    isMember: role === "member",
    loading,
  };
}


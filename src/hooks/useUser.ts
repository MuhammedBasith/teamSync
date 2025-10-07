"use client";

import { useAuth } from "@/context/AuthContext";

// Hook for user data using real auth
export function useUser() {
  const { user, loading, error } = useAuth();

  return {
    user,
    loading,
    error,
  };
}


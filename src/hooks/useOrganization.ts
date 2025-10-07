"use client";

import { useAuth } from "@/context/AuthContext";

// Hook for organization data using real auth
export function useOrganization() {
  const { user, loading, error } = useAuth();

  return {
    organization: user?.organization || null,
    loading,
    error,
    updateOrganization: async (data: unknown) => {
      console.log("Update organization:", data);
      // TODO: Implement organization update API call
    },
  };
}


"use client";

// Placeholder hook for authentication
export function useAuth() {
  // TODO: Implement authentication logic with Supabase
  return {
    user: null,
    loading: true,
    signIn: async (email: string, password: string) => {
      console.log("Sign in:", email, password);
    },
    signUp: async (email: string, password: string) => {
      console.log("Sign up:", email, password);
    },
    signOut: async () => {
      console.log("Sign out");
    },
  };
}


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Organization {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: string;
  createdAt: string;
  organization: Organization | null;
  team: Team | null;
}

interface ProfileResponse {
  success: boolean;
  profile: UserProfile;
}

interface UpdateProfileData {
  display_name: string;
}

async function fetchProfile(): Promise<UserProfile> {
  const response = await fetch("/api/profile");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch profile");
  }

  const data: ProfileResponse = await response.json();
  return data.profile;
}

async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }

  const result: ProfileResponse = await response.json();
  return result.profile;
}

export function useProfile() {
  return useQuery<UserProfile, Error>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileData>({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Update profile cache
      queryClient.setQueryData(["profile"], data);
      
      // Invalidate related queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}


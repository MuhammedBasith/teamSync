export type Role = "owner" | "admin" | "member";

export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: Role;
  organizationId: string;
  teamId?: string | null;
  createdAt: string;
};

export type UserCreateInput = {
  email: string;
  password: string;
  displayName: string;
};

export type UserUpdateInput = {
  displayName?: string;
  avatarUrl?: string;
  role?: Role;
  teamId?: string | null;
};


// Role utility functions
export type Role = "owner" | "admin" | "member";

export function isOwner(role: Role | null): boolean {
  return role === "owner";
}

export function isAdmin(role: Role | null): boolean {
  return role === "admin";
}

export function isMember(role: Role | null): boolean {
  return role === "member";
}

export function canManageMembers(role: Role | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageTeams(role: Role | null): boolean {
  return role === "owner" || role === "admin";
}

export function canViewActivityLog(role: Role | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageOrganization(role: Role | null): boolean {
  return role === "owner";
}


// Application constants

export const APP_NAME = "TeamSync";

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export const TIER_LIMITS = {
  FREE: {
    maxMembers: 25,
    maxTeams: 5,
  },
  PRO: {
    maxMembers: 100,
    maxTeams: 20,
  },
  ENTERPRISE: {
    maxMembers: -1, // unlimited
    maxTeams: -1, // unlimited
  },
} as const;

export const ACTIVITY_TYPES = {
  USER_INVITED: "user_invited",
  TEAM_CREATED: "team_created",
  ROLE_CHANGED: "role_changed",
} as const;


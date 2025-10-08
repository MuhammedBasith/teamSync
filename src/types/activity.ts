export type ActivityType =
  | "user_invited"
  | "team_created"
  | "team_updated"
  | "team_deleted"
  | "role_changed"
  | "user_deleted"
  | "organization_created"
  | "organization_updated"
  | "member_moved";

export type ActivityTargetType = "user" | "team" | "organization";

export type Activity = {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  organizationId: string;
  actionType: ActivityType;
  targetType: ActivityTargetType;
  targetId: string;
  targetName?: string; // Resolved name (user/team name)
  details?: Record<string, unknown>;
  createdAt: string;
};

export type ActivityLogFilter = {
  startDate?: string;
  endDate?: string;
  actionType?: ActivityType;
  page?: number;
  limit?: number;
};

export type ActivityLogResponse = {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};


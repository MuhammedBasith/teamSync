export type ActivityType = "user_invited" | "team_created" | "role_changed";

export type ActivityTargetType = "user" | "team" | "organization";

export type Activity = {
  id: string;
  actorId: string;
  actorName: string;
  organizationId: string;
  actionType: ActivityType;
  targetType: ActivityTargetType;
  targetId: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

export type ActivityLogFilter = {
  startDate?: string;
  endDate?: string;
  actionType?: ActivityType;
};


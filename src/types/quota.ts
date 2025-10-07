export type TierQuota = {
  maxMembers: number;
  maxTeams: number;
};

export type QuotaUsage = {
  currentMembers: number;
  currentTeams: number;
  maxMembers: number;
  maxTeams: number;
  memberUsagePercent: number;
  teamUsagePercent: number;
};

export type Quota = {
  organizationId: string;
  tier: string;
  limits: TierQuota;
  usage: QuotaUsage;
};


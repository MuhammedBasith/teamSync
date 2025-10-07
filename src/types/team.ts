export type Team = {
  id: string;
  name: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
};

export type TeamCreateInput = {
  name: string;
  organizationId: string;
};

export type TeamUpdateInput = {
  name?: string;
};

export type TeamMember = {
  id: string;
  userId: string;
  teamId: string;
  addedAt: string;
};


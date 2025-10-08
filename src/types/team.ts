export type Team = {
  id: string;
  name: string;
  organization_id: string;
  created_by: string;
  manager_id: string;
  created_at: string;
  memberCount?: number;
  pendingCount?: number;
  // Related data from joins
  manager?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  creator?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
};

export type TeamCreateInput = {
  name: string;
  managerId?: string; // Optional: if not provided, use creator as manager
};

export type TeamUpdateInput = {
  name?: string;
  managerId?: string;
};

export type TeamMember = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  team_id: string;
  created_at: string;
};


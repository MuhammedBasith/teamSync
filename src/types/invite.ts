import { Role } from "./user";

export type Invite = {
  id: string;
  email: string;
  organizationId: string;
  teamId?: string | null;
  role: Role;
  invitedBy: string;
  accepted: boolean;
  createdAt: string;
  acceptedAt?: string | null;
};

export type InviteCreateInput = {
  email: string;
  role: Role;
  teamId?: string;
};

export type BulkInviteInput = {
  invites: InviteCreateInput[];
};

export type BulkInviteResult = {
  success: number;
  failed: number;
  errors: { email: string; reason: string }[];
};


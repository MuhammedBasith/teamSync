import { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  FileClock,
  Settings,
  UserCog,
} from "lucide-react";

export type SidebarLink = {
  name: string;
  path: string;
  icon: React.ComponentType;
};

export const SIDEBAR_LINKS: Record<Role, SidebarLink[]> = {
  owner: [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Admins", path: "/organization/admins", icon: UserCog },
    { name: "Teams", path: "/teams", icon: UsersRound },
    { name: "Members", path: "/members", icon: Users },
    { name: "Activity Log", path: "/organization/activity", icon: FileClock },
    {
      name: "Organization Settings",
      path: "/organization/settings",
      icon: Settings,
    },
  ],
  admin: [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Teams", path: "/teams", icon: UsersRound },
    { name: "Members", path: "/members", icon: Users },
    { name: "Activity Log", path: "/organization/activity", icon: FileClock },
  ],
  member: [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "My Teams", path: "/teams", icon: UsersRound },
    { name: "Profile", path: "/profile", icon: Users },
  ],
};

export function getSidebarLinks(role: Role | null): SidebarLink[] {
  if (!role) return [];
  return SIDEBAR_LINKS[role] || SIDEBAR_LINKS.member;
}


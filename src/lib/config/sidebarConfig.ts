import { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  FileClock,
  Settings,
  UserCog,
  UserCircle,
} from "lucide-react";

export type SidebarLink = {
  name: string;
  path: string;
  icon: React.ComponentType;
};

export const SIDEBAR_LINKS: Record<Role, SidebarLink[]> = {
  owner: [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Admins", path: "/organization/admins", icon: UserCog },
    { name: "Teams", path: "/organization/teams", icon: UsersRound },
    { name: "Members", path: "/organization/members", icon: Users },
    { name: "Activity Log", path: "/organization/activity", icon: FileClock },
    {
      name: "Organization Settings",
      path: "/organization/settings",
      icon: Settings,
    },
    { name: "Profile", path: "/profile", icon: UserCircle },
  ],
  admin: [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Teams", path: "/organization/teams", icon: UsersRound },
    { name: "Members", path: "/organization/members", icon: Users },
    { name: "Activity Log", path: "/organization/activity", icon: FileClock },
    { name: "Profile", path: "/profile", icon: UserCircle },
  ],
  member: [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Teams", path: "/organization/teams", icon: UsersRound },
    { name: "Profile", path: "/profile", icon: UserCircle },
  ],
};

export function getSidebarLinks(role: Role | null): SidebarLink[] {
  if (!role) return [];
  return SIDEBAR_LINKS[role] || SIDEBAR_LINKS.member;
}


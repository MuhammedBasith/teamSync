import { Role } from "@/types";
import {
  GridIcon,
  UserCircleIcon,
  GroupIcon,
  TaskIcon,
  DocsIcon,
} from "@/icons";

export type SidebarLink = {
  name: string;
  path: string;
  icon: React.ComponentType;
};

export const SIDEBAR_LINKS: Record<Role, SidebarLink[]> = {
  owner: [
    { name: "Dashboard", path: "/", icon: GridIcon },
    { name: "Teams", path: "/teams", icon: GroupIcon },
    { name: "Members", path: "/members", icon: UserCircleIcon },
    { name: "Activity Log", path: "/organization/activity", icon: TaskIcon },
    {
      name: "Organization Settings",
      path: "/organization/settings",
      icon: DocsIcon,
    },
  ],
  admin: [
    { name: "Dashboard", path: "/", icon: GridIcon },
    { name: "Teams", path: "/teams", icon: GroupIcon },
    { name: "Members", path: "/members", icon: UserCircleIcon },
    { name: "Activity Log", path: "/organization/activity", icon: TaskIcon },
  ],
  member: [
    { name: "Dashboard", path: "/", icon: GridIcon },
    { name: "My Teams", path: "/teams", icon: GroupIcon },
    { name: "Profile", path: "/profile", icon: UserCircleIcon },
  ],
};

export function getSidebarLinks(role: Role | null): SidebarLink[] {
  if (!role) return [];
  return SIDEBAR_LINKS[role] || SIDEBAR_LINKS.member;
}


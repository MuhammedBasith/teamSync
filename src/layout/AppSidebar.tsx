"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useRole } from "@/hooks/useRole";
import { getSidebarLinks } from "@/lib/config/sidebarConfig";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { role } = useRole();

  // Get sidebar links based on user role
  const sidebarLinks = getSidebarLinks(role);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div
        className={`py-8 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                src="/logo/logo.png"
                alt="TeamSync Logo"
                width={160}
                height={10}
                className="h-10 w-auto"
                priority
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                TeamSync
              </span>
            </>
          ) : (
            <Image
              src="/logo/logo.png"
              alt="TeamSync"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
          )}
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="flex-1">
          <ul className="flex flex-col gap-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);

              return (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                    } ${
                      !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "justify-start"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 ${
                        active
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <Icon />
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="font-medium text-sm">{link.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile Section at Bottom */}
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mt-auto mb-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center">
                <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm">
                  U
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  User Profile
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Loading..."}
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;

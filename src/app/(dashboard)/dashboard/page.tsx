"use client";

import { useDashboard } from "@/hooks/useDashboard";
import StatsCard from "@/components/common/StatsCard";
import QuotaProgressBar from "@/components/common/QuotaProgressBar";
import RecentActivity from "@/components/common/RecentActivity";
import Spinner from "@/components/loaders/Spinner";
import {
  Users,
  UsersRound,
  Shield,
  Crown,
  UserCog,
  Plus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load dashboard: {error.message}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { user, organization, stats, quotas, recentActivities, userTeam } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}, {user.displayName}!
            </h1>
            <p className="text-brand-100 dark:text-brand-200">
              Welcome to {organization.name} ·{" "}
              <span className="capitalize">{organization.tier} Plan</span>
            </p>
          </div>
          <div className="hidden md:block">
            <Image
              src="/logo/logo-transparent.png"
              alt="TeamSync"
              width={64}
              height={64}
              className="w-16 h-16 opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Role-Based Content */}
      {user.role === "owner" && (
        <>
          {/* Stats Grid - Owner View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Members"
              value={stats.totalMembers || 0}
              icon={Users}
              subtitle={`${stats.owners || 0} owners, ${stats.admins || 0} admins, ${stats.members || 0} members`}
            />
            <StatsCard
              title="Total Teams"
              value={stats.teams}
              icon={UsersRound}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-50 dark:bg-blue-500/10"
            />
            <StatsCard
              title="Admins"
              value={stats.admins || 0}
              icon={UserCog}
              iconColor="text-purple-600 dark:text-purple-400"
              iconBgColor="bg-purple-50 dark:bg-purple-500/10"
            />
            <StatsCard
              title="Members"
              value={stats.members || 0}
              icon={Users}
              iconColor="text-green-600 dark:text-green-400"
              iconBgColor="bg-green-50 dark:bg-green-500/10"
            />
          </div>

          {/* Quotas Section - Owner Only */}
          {quotas && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Resource Usage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuotaProgressBar
                  label="Members"
                  used={quotas.membersUsed}
                  total={quotas.maxMembers}
                  percentage={quotas.membersPercentage}
                  icon={<Users className="w-4 h-4" />}
                />
                <QuotaProgressBar
                  label="Teams"
                  used={quotas.teamsUsed}
                  total={quotas.maxTeams}
                  percentage={quotas.teamsPercentage}
                  icon={<UsersRound className="w-4 h-4" />}
                />
              </div>
            </div>
          )}

          {/* Quick Actions - Owner */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/organization/admins"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 transition-colors">
                  <UserCog className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Invite Admin
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add new admin
                  </p>
                </div>
              </Link>
              <Link
                href="/organization/teams"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Create Team
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add new team
                  </p>
                </div>
              </Link>
              <Link
                href="/organization/settings"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-500/10 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-500/20 transition-colors">
                  <Crown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Settings
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage org
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity - Owner */}
          {recentActivities && <RecentActivity activities={recentActivities} />}
        </>
      )}

      {user.role === "admin" && (
        <>
          {/* Stats Grid - Admin View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Total Members"
              value={stats.totalMembers || 0}
              icon={Users}
              subtitle={`${stats.admins || 0} admins, ${stats.members || 0} members`}
            />
            <StatsCard
              title="Total Teams"
              value={stats.teams}
              icon={UsersRound}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-50 dark:bg-blue-500/10"
            />
            <StatsCard
              title="Your Role"
              value="Admin"
              icon={Shield}
              iconColor="text-purple-600 dark:text-purple-400"
              iconBgColor="bg-purple-50 dark:bg-purple-500/10"
              subtitle="Team management access"
            />
          </div>

          {/* Quotas Section - Admin */}
          {quotas && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Resource Usage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuotaProgressBar
                  label="Members"
                  used={quotas.membersUsed}
                  total={quotas.maxMembers}
                  percentage={quotas.membersPercentage}
                  icon={<Users className="w-4 h-4" />}
                />
                <QuotaProgressBar
                  label="Teams"
                  used={quotas.teamsUsed}
                  total={quotas.maxTeams}
                  percentage={quotas.teamsPercentage}
                  icon={<UsersRound className="w-4 h-4" />}
                />
              </div>
            </div>
          )}

          {/* Quick Actions - Admin */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/organization/teams"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Create Team
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add new team
                  </p>
                </div>
              </Link>
              <Link
                href="/organization/activity"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 transition-colors">
                  <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    View Activity
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Audit logs
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity - Admin */}
          {recentActivities && <RecentActivity activities={recentActivities} />}
        </>
      )}

      {user.role === "member" && (
        <>
          {/* Stats Grid - Member View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatsCard
              title="Total Teams"
              value={stats.teams}
              icon={UsersRound}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-50 dark:bg-blue-500/10"
              subtitle="In organization"
            />
            <StatsCard
              title="Your Role"
              value="Member"
              icon={Users}
              iconColor="text-green-600 dark:text-green-400"
              iconBgColor="bg-green-50 dark:bg-green-500/10"
              subtitle="Team collaboration"
            />
          </div>

          {/* User Team Info - Member */}
          {userTeam && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Team
              </h3>
              <div className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-500/5 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {userTeam.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manager: {userTeam.manager.display_name}
                  </p>
                </div>
                <Link
                  href={`/organization/teams/${userTeam.id}`}
                  className="px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  View Team →
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions - Member */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/organization/teams"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                  <UsersRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    My Teams
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    View all teams
                  </p>
                </div>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 transition-colors">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Profile
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your settings
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
        <Image
          src="/logo/logo-transparent.png"
          alt="TeamSync"
          width={60}
          height={60}
          className="w-16 h-16 mx-auto mb-4"
        />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          More Features Coming Soon!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          We&apos;re constantly improving TeamSync. Stay tuned for analytics,
          advanced reporting, integrations, and much more.
        </p>
      </div>
    </div>
  );
}

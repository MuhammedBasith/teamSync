"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useActivity, exportActivities } from "@/hooks/useActivity";
import { ActivityLogFilter, ActivityType } from "@/types/activity";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Users,
  Shield,
  Trash2,
  Edit,
  Building,
  AlertCircle,
  FileJson,
} from "lucide-react";
import Spinner from "@/components/loaders/Spinner";

export default function ActivityLogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State for filters
  const [filters, setFilters] = useState<ActivityLogFilter>({
    page: 1,
    limit: 20,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionType, setActionType] = useState<ActivityType | "">("");
  const [showFilters, setShowFilters] = useState(false);

  // Check if user is owner or admin
  useEffect(() => {
    if (!authLoading && user && user.role !== "owner" && user.role !== "admin") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch activities
  const { data, isLoading, error, refetch } = useActivity(filters);

  // Apply filters
  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      actionType: actionType || undefined,
      page: 1, // Reset to first page
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setActionType("");
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (data?.pagination.page && data.pagination.page > 1) {
      setFilters({ ...filters, page: data.pagination.page - 1 });
    }
  };

  const handleNextPage = () => {
    if (
      data?.pagination.page &&
      data.pagination.totalPages &&
      data.pagination.page < data.pagination.totalPages
    ) {
      setFilters({ ...filters, page: data.pagination.page + 1 });
    }
  };

  // Export handlers
  const handleExport = (format: "csv" | "json") => {
    exportActivities(format, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      actionType: filters.actionType,
    });
  };

  // Get icon for activity type
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "user_invited":
        return <UserPlus className="w-5 h-5" />;
      case "team_created":
        return <Users className="w-5 h-5" />;
      case "team_updated":
        return <Edit className="w-5 h-5" />;
      case "team_deleted":
        return <Trash2 className="w-5 h-5" />;
      case "role_changed":
        return <Shield className="w-5 h-5" />;
      case "user_deleted":
        return <Trash2 className="w-5 h-5" />;
      case "organization_created":
        return <Building className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  // Get color for activity type
  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case "user_invited":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10";
      case "team_created":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10";
      case "team_updated":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10";
      case "team_deleted":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10";
      case "role_changed":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10";
      case "user_deleted":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10";
      case "organization_created":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10";
      case "organization_updated":
        return "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10";
      case "member_moved":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10";
    }
  };

  // Format activity message
  const getActivityMessage = (activity: any) => {
    const actorName = activity.actorName || "Someone";
    // Smart fallback: try targetName, then details fields, then "Unknown"
    const getTargetName = () => {
      if (activity.targetName) return activity.targetName;
      // Fallback to details based on action type
      if (activity.actionType === "team_created" || activity.actionType === "team_updated" || activity.actionType === "team_deleted") {
        return activity.details?.team_name || "Unknown Team";
      }
      if (activity.actionType === "user_invited") {
        return activity.details?.email || "Unknown User";
      }
      return "Unknown";
    };
    const targetName = getTargetName();

    switch (activity.actionType) {
      case "user_invited":
        return (
          <>
            <span className="font-semibold">{actorName}</span> invited{" "}
            <span className="font-semibold">
              {activity.details?.email || targetName}
            </span>{" "}
            to join as{" "}
            <span className="font-semibold">{activity.details?.role || "member"}</span>
          </>
        );
      case "team_created":
        return (
          <>
            <span className="font-semibold">{actorName}</span> created team{" "}
            <span className="font-semibold">{targetName}</span>
          </>
        );
      case "team_updated":
        return (
          <>
            <span className="font-semibold">{actorName}</span> updated team{" "}
            <span className="font-semibold">{targetName}</span>
          </>
        );
      case "team_deleted":
        return (
          <>
            <span className="font-semibold">{actorName}</span> deleted team{" "}
            <span className="font-semibold">{targetName}</span>
          </>
        );
      case "role_changed":
        return (
          <>
            <span className="font-semibold">{actorName}</span> changed{" "}
            <span className="font-semibold">{targetName}</span>'s role from{" "}
            <span className="font-semibold">{activity.details?.from}</span> to{" "}
            <span className="font-semibold">{activity.details?.to}</span>
          </>
        );
      case "user_deleted":
        return (
          <>
            <span className="font-semibold">{actorName}</span> removed{" "}
            <span className="font-semibold">{targetName}</span> from the organization
          </>
        );
      case "organization_created":
        return (
          <>
            <span className="font-semibold">{actorName}</span> created the organization{" "}
            <span className="font-semibold">{targetName}</span>
          </>
        );
      case "organization_updated":
        const updatedFields = activity.details?.updated_fields || [];
        const fieldsText = updatedFields.includes("name") && updatedFields.includes("color_palette")
          ? "name and color palette"
          : updatedFields.includes("name")
          ? "name"
          : updatedFields.includes("color_palette")
          ? "color palette"
          : "settings";
        return (
          <>
            <span className="font-semibold">{actorName}</span> updated organization {fieldsText}
          </>
        );
      case "member_moved":
        return (
          <>
            <span className="font-semibold">{actorName}</span> moved{" "}
            <span className="font-semibold">{activity.details?.member_name || targetName}</span>{" "}
            from <span className="font-semibold">{activity.details?.from_team}</span> to{" "}
            <span className="font-semibold">{activity.details?.to_team}</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold">{actorName}</span> performed action on{" "}
            <span className="font-semibold">{targetName}</span>
          </>
        );
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // Access denied
  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Activity Log
      </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track all actions and changes in your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              showFilters
                ? "bg-brand-500 text-white"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <div className="relative group">
            <button className="px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            {/* Export dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport("csv")}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 rounded-t-lg"
              >
                <FileText className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => handleExport("json")}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 rounded-b-lg"
              >
                <FileJson className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Filter Activities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActivityType | "")}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="user_invited">User Invited</option>
                <option value="team_created">Team Created</option>
                <option value="team_updated">Team Updated</option>
                <option value="team_deleted">Team Deleted</option>
                <option value="role_changed">Role Changed</option>
                <option value="user_deleted">User Deleted</option>
                <option value="organization_created">Organization Created</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load activities: {error.message}
          </p>
        </div>
      ) : !data || data.activities.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No activity recorded yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Activity logs will appear here as actions are performed in your organization
          </p>
        </div>
      ) : (
        <>
          {/* Activity Timeline */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800">
            {data.activities.map((activity, index) => (
              <div
                key={activity.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.actionType)}`}
                  >
                    {getActivityIcon(activity.actionType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {getActivityMessage(activity)}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            activity.actorAvatarUrl ||
                            `https://avatar.iran.liara.run/username?username=${encodeURIComponent(activity.actorName)}`
                          }
                          alt={activity.actorName}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.actorName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        •
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {activity.actionType.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {data.pagination.limit * (data.pagination.page - 1) + 1} to{" "}
                {Math.min(
                  data.pagination.limit * data.pagination.page,
                  data.pagination.total
                )}{" "}
                of {data.pagination.total} activities
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={data.pagination.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={data.pagination.page === data.pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import {
  UserPlus,
  Users,
  Shield,
  Trash2,
  Edit,
  Building,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface Activity {
  id: string;
  actionType: string;
  actorName: string;
  actorAvatarUrl: string | null;
  targetName?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

interface RecentActivityProps {
  activities: Activity[] | null;
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "user_invited":
        return <UserPlus className="w-4 h-4" />;
      case "team_created":
        return <Users className="w-4 h-4" />;
      case "team_updated":
        return <Edit className="w-4 h-4" />;
      case "team_deleted":
        return <Trash2 className="w-4 h-4" />;
      case "role_changed":
        return <Shield className="w-4 h-4" />;
      case "user_deleted":
        return <Trash2 className="w-4 h-4" />;
      case "organization_created":
        return <Building className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

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
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10";
    }
  };

  const getActivityMessage = (activity: Activity) => {
    const actorName = activity.actorName || "Someone";
    const targetName = activity.targetName || activity.details?.team_name || activity.details?.email || "Unknown";

    switch (activity.actionType) {
      case "user_invited":
        return `${actorName} invited ${activity.details?.email || targetName}`;
      case "team_created":
        return `${actorName} created team ${targetName}`;
      case "team_updated":
        return `${actorName} updated team ${targetName}`;
      case "team_deleted":
        return `${actorName} deleted team ${targetName}`;
      case "role_changed":
        return `${actorName} changed ${targetName}'s role`;
      case "user_deleted":
        return `${actorName} removed ${targetName}`;
      case "organization_created":
        return `${actorName} created the organization`;
      default:
        return `${actorName} performed an action`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent activities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <Link
          href="/organization/activity"
          className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.actionType)}`}
            >
              {getActivityIcon(activity.actionType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {getActivityMessage(activity)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatDate(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


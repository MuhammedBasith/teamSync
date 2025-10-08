"use client";

import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { User, Mail, Shield, Users, Calendar, Building2, Edit2, Check, X } from "lucide-react";
import Spinner from "@/components/loaders/Spinner";

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!displayName.trim() || displayName === profile?.displayName) {
      setIsEditing(false);
      return;
    }

    setUpdateError(null);
    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() });
      setIsEditing(false);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.displayName || "");
    setIsEditing(false);
    setUpdateError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
      case "admin":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
      case "member":
        return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-500/10">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
            Failed to Load Profile
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error?.message || "Unable to fetch profile data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Profile
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and manage your profile information
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        {/* Avatar & Basic Info Section */}
        <div className="p-8 bg-gradient-to-r from-brand-500/10 to-brand-600/10 dark:from-brand-500/5 dark:to-brand-600/5">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-gray-800"
              />
            ) : (
              <div className="flex items-center justify-center w-24 h-24 text-3xl font-bold rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 ring-4 ring-white dark:ring-gray-800">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name & Role */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="px-3 py-1.5 text-xl font-bold text-gray-800 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                      className="p-1.5 text-green-600 transition hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={updateProfile.isPending}
                      className="p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {profile.displayName}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-gray-600 transition hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg dark:text-gray-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 sm:justify-start">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(profile.role)}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>

              {/* Update Error */}
              {updateError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{updateError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-8">
          <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
            Profile Details
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Organization */}
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Organization
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                  {profile.organization?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Team */}
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                  {profile.team?.name || "Not assigned to a team"}
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Member Since
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Profile Information
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              You can only edit your display name. To change your email or password, please contact
              your organization owner or use the password reset feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

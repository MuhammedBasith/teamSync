"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, ChevronDown } from "lucide-react";
import Label from "@/components/form/Label";
import { useUpdateMemberRole } from "@/hooks/useMembers";
import { useTeams } from "@/hooks/useTeams";
import { Role } from "@/types/user";

interface User {
  id: string;
  display_name: string;
  role: Role;
  team_id?: string | null;
  avatar_url?: string | null;
}

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

export default function ChangeRoleModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<"admin" | "member">(
    user.role === "admin" ? "admin" : "member"
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: teamsData, isLoading: teamsLoading } = useTeams();
  const teams = teamsData || [];
  const { mutate: updateRole, isPending } = useUpdateMemberRole();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSelectedRole(user.role === "admin" ? "admin" : "member");
      setSelectedTeamId("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Check if role actually changed
    if (selectedRole === user.role) {
      setError("Please select a different role");
      return;
    }

    // If demoting admin → member, team selection is required
    if (selectedRole === "member" && user.role === "admin") {
      if (!selectedTeamId) {
        setError("Please select a team to assign this member to");
        return;
      }
    }

    // Prepare mutation data
    const mutationData: {
      userId: string;
      role: Role;
      team_id?: string | null;
    } = {
      userId: user.id,
      role: selectedRole,
    };

    // Add team_id only when demoting to member
    if (selectedRole === "member" && selectedTeamId) {
      mutationData.team_id = selectedTeamId;
    }

    updateRole(mutationData, {
      onSuccess: (data: { success: boolean; message: string }) => {
        if (data.success) {
          setSuccessMessage(
            data.message || "Role updated successfully"
          );
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      },
      onError: (error: { message?: string }) => {
        setError(error.message || "Failed to update role");
      },
    });
  };

  const isPromoting = user.role === "member" && selectedRole === "admin";
  const isDemoting = user.role === "admin" && selectedRole === "member";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 min-h-screen w-screen bg-black/30 backdrop-blur-sm z-[100000] transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Change User Role
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.display_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current role: <span className="font-medium capitalize">{user.role}</span>
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <Label htmlFor="role">New Role</Label>
            <div className="relative">
              <select
                id="role"
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as "admin" | "member")
                }
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                disabled={isPending}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Team Selection (only for Admin → Member) */}
          {isDemoting && selectedRole === "member" && (
            <div>
              <Label htmlFor="team">Assign to Team *</Label>
              <div className="relative">
                <select
                  id="team"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending || teamsLoading}
                >
                  <option value="">
                    {teamsLoading ? "Loading teams..." : teams.length === 0 ? "No teams available" : "Select a team..."}
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {teamsLoading ? "Loading available teams..." : `Members must belong to a team (${teams.length} available)`}
              </p>
            </div>
          )}

          {/* Info Box */}
          {isPromoting && (
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Promoting to Admin:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Will be removed from their current team</li>
                    <li>Can create and manage teams</li>
                    <li>Can only see teams they manage</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isDemoting && (
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Demoting to Member:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Will lose team management privileges</li>
                    <li>Must be assigned to a specific team</li>
                    <li>Can only see their assigned team</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-400">
                {successMessage}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || selectedRole === user.role}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Updating..." : "Update Role"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}


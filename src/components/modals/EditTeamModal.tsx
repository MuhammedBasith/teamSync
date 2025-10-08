"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useUpdateTeam } from "@/hooks/useTeams";
import { useAdmins } from "@/hooks/useAdmins";
import { useRole } from "@/hooks/useRole";
import { Team } from "@/types/team";

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: Team;
}

export default function EditTeamModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: EditTeamModalProps) {
  const [teamName, setTeamName] = useState(team.name);
  const [selectedAdminId, setSelectedAdminId] = useState(team.manager_id);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { role } = useRole();
  const isOwner = role === "owner";

  // Only fetch admins if user is owner
  const { data: admins, isLoading: adminsLoading } = useAdmins();
  const { mutate: updateTeam, isPending } = useUpdateTeam();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens with team data
      setTeamName(team.name);
      setSelectedAdminId(team.manager_id);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, team]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }

    if (teamName.trim().length < 2) {
      setError("Team name must be at least 2 characters");
      return;
    }

    // Build update data - only include changed fields
    const updateData: { name?: string; managerId?: string } = {};
    
    if (teamName.trim() !== team.name) {
      updateData.name = teamName.trim();
    }
    
    if (isOwner && selectedAdminId !== team.manager_id) {
      updateData.managerId = selectedAdminId;
    }

    // If nothing changed, just close
    if (Object.keys(updateData).length === 0) {
      onClose();
      return;
    }

    updateTeam(
      {
        teamId: team.id,
        data: updateData,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Team updated successfully!");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        },
        onError: (err) => {
          setError(err.message || "Failed to update team");
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 min-h-screen w-screen bg-black/30 backdrop-blur-sm z-[100000] transition-all duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Edit Team
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Update team details
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isPending}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Team Name Input */}
            <div>
              <Label>
                Team Name <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Engineering, Design, Marketing"
                required
                disabled={isPending}
                maxLength={50}
              />
            </div>

            {/* Admin Selection (Owner Only) */}
            {isOwner && (
              <div>
                <Label>
                  Team Manager (Admin) <span className="text-error-500">*</span>
                </Label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  disabled={isPending || adminsLoading}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-brand-400 dark:focus:border-brand-400 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {admins?.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.display_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {adminsLoading
                    ? "Loading admins..."
                    : "Select an admin to manage this team"}
                </p>
              </div>
            )}

            {/* Current Manager Info (Admin View) */}
            {!isOwner && team.manager && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Current Manager:</strong> {team.manager.display_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Only the organization owner can change the team manager
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !!successMessage}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


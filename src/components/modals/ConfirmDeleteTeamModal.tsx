"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useDeleteTeam } from "@/hooks/useTeams";
import { Team } from "@/types/team";

interface ConfirmDeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: Team;
}

export default function ConfirmDeleteTeamModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: ConfirmDeleteTeamModalProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutate: deleteTeam, isPending } = useDeleteTeam();

  if (!isOpen) return null;

  const handleConfirm = () => {
    setError(null);

    deleteTeam(team.id, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (err) => {
        setError(err.message || "Failed to delete team");
      },
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setError(null);
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Delete Team
                </h2>
              </div>
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
          <div className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Confirmation Message */}
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete{" "}
                <strong className="text-gray-900 dark:text-white">
                  {team.name}
                </strong>
                ?
              </p>

              {team.memberCount && team.memberCount > 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    <strong>Warning:</strong> This team has{" "}
                    {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}.
                    You must remove all members before deleting the team.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400">
                    <strong>Warning:</strong> This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

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
                type="button"
                onClick={handleConfirm}
                disabled={
                  isPending || 
                  (team.memberCount !== undefined && team.memberCount > 0)
                }
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? "Deleting..." : "Delete Team"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


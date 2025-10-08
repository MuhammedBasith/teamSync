"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useRemoveMember } from "@/hooks/useTeams";
import { TeamMember } from "@/types/team";

interface ConfirmRemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: TeamMember;
  teamId: string;
  teamName: string;
}

export default function ConfirmRemoveMemberModal({
  isOpen,
  onClose,
  onSuccess,
  member,
  teamId,
  teamName,
}: ConfirmRemoveMemberModalProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutate: removeMember, isPending } = useRemoveMember();

  if (!isOpen) return null;

  const handleConfirm = () => {
    setError(null);

    removeMember(
      { teamId, userId: member.id },
      {
        onSuccess: () => {
          onSuccess();
        },
        onError: (err) => {
          setError(err.message || "Failed to remove member");
        },
      }
    );
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
                  Remove Member
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

            {/* Member Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <img
                src={
                  member.avatar_url ||
                  `https://avatar.iran.liara.run/username?username=${encodeURIComponent(member.display_name)}`
                }
                alt={member.display_name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {member.display_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {member.role}
                </p>
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to remove{" "}
                <strong className="text-gray-900 dark:text-white">
                  {member.display_name}
                </strong>{" "}
                from{" "}
                <strong className="text-gray-900 dark:text-white">
                  {teamName}
                </strong>
                ?
              </p>

              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-400">
                  <strong>Warning:</strong> This will completely delete their account. They will receive an email notification and will need a new invitation to rejoin.
                </p>
              </div>
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
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? "Removing..." : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


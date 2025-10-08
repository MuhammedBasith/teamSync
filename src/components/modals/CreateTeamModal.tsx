"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useCreateTeam } from "@/hooks/useTeams";
import { useAdmins } from "@/hooks/useAdmins";
import { useRole } from "@/hooks/useRole";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { role } = useRole();
  const isOwner = role === "owner";

  // Only fetch admins if user is owner
  const { data: admins, isLoading: adminsLoading } = useAdmins();
  const { mutate: createTeam, isPending } = useCreateTeam();

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTeamName("");
      setSelectedAdminId("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

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

    // If owner, they must select an admin
    if (isOwner && !selectedAdminId) {
      setError("Please select an admin to manage this team");
      return;
    }

    createTeam(
      {
        name: teamName.trim(),
        managerId: isOwner ? selectedAdminId : undefined,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Team created successfully!");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        },
        onError: (err) => {
          setError(err.message || "Failed to create team");
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
                Create New Team
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {isOwner
                  ? "Create a team and assign an admin to manage it"
                  : "Create a team - you'll be assigned as the manager"}
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
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Choose a descriptive name for your team
              </p>
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
                  <option value="">Select an admin</option>
                  {admins?.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.display_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {adminsLoading
                    ? "Loading admins..."
                    : admins && admins.length === 0
                      ? "No admins available. Invite admins first."
                      : "Select an admin to manage this team"}
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                {isOwner ? (
                  <>
                    <strong>Note:</strong> The selected admin will be able to
                    invite members to this team and manage team activities.
                  </>
                ) : (
                  <>
                    <strong>Note:</strong> You'll be assigned as the manager of
                    this team and can invite members to join.
                  </>
                )}
              </p>
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
                type="submit"
                disabled={
                  isPending || 
                  !!successMessage || 
                  (isOwner && (!admins || admins.length === 0))
                }
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? "Creating..." : "Create Team"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, UserPlus, Pencil, Trash2, Crown, Shield } from "lucide-react";
import { useTeam } from "@/hooks/useTeams";
import { useRole } from "@/hooks/useRole";
import { useState } from "react";
import TeamMembersList from "@/components/tables/TeamMembersList";
import InviteMemberModal from "@/components/modals/InviteMemberModal";
import EditTeamModal from "@/components/modals/EditTeamModal";
import ConfirmDeleteTeamModal from "@/components/modals/ConfirmDeleteTeamModal";
import Spinner from "@/components/loaders/Spinner";

type TeamDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { role } = useRole();
  const { data: team, isLoading, error, refetch } = useTeam(resolvedParams.id);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const canManageTeam = role === "owner" || role === "admin";

  const handleInviteSuccess = () => {
    setIsInviteModalOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    refetch();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    router.push("/organization/teams");
  };

  const handleMemberRemoved = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message || "Team not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/organization/teams")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </button>

        {/* Team Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-brand-100 dark:bg-brand-500/10 rounded-xl">
                <Users className="w-8 h-8 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {team.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {team.memberCount || 0} member{team.memberCount !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span>
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canManageTeam && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Edit team"
                >
                  <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete team"
                >
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* Team Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manager Info */}
              {team.manager && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    Team Manager
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        team.manager.avatar_url ||
                        `https://avatar.iran.liara.run/username?username=${encodeURIComponent(team.manager.display_name)}`
                      }
                      alt={team.manager.display_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {team.manager.display_name}
                        <Shield className="w-4 h-4 text-blue-500" />
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Admin
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Creator Info */}
              {team.creator && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    Created By
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        team.creator.avatar_url ||
                        `https://avatar.iran.liara.run/username?username=${encodeURIComponent(team.creator.display_name)}`
                      }
                      alt={team.creator.display_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {team.creator.display_name}
                        {team.creator.id === team.manager?.id && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(team.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invite Button */}
          {canManageTeam && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="w-full md:w-auto px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite Members
              </button>
            </div>
          )}
        </div>

        {/* Members List */}
        <TeamMembersList
          members={team.members || []}
          teamId={team.id}
          teamName={team.name}
          managerId={team.manager_id}
          onMemberRemoved={handleMemberRemoved}
        />
      </div>

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
        teamId={team.id}
        teamName={team.name}
      />

      <EditTeamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        team={team}
      />

      <ConfirmDeleteTeamModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        team={team}
      />
    </div>
  );
}

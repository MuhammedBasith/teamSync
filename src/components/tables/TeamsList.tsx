"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { useRole } from "@/hooks/useRole";
import { Team } from "@/types/team";
import CreateTeamModal from "@/components/modals/CreateTeamModal";
import EditTeamModal from "@/components/modals/EditTeamModal";
import ConfirmDeleteTeamModal from "@/components/modals/ConfirmDeleteTeamModal";
import InviteMemberModal from "@/components/modals/InviteMemberModal";
import Spinner from "@/components/loaders/Spinner";

export default function TeamsList() {
  const router = useRouter();
  const { data: teams, isLoading, error, refetch } = useTeams();
  const { role } = useRole();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const canCreateTeam = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const handleViewTeam = (teamId: string) => {
    router.push(`/organization/teams/${teamId}`);
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  const handleDelete = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handleInviteMember = (team: Team) => {
    setSelectedTeam(team);
    setIsInviteModalOpen(true);
  };

  const handleModalSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsInviteModalOpen(false);
    setSelectedTeam(null);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsInviteModalOpen(false);
    setSelectedTeam(null);
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
      <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load teams: {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Teams
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your organization's teams and members
            </p>
          </div>
          {canCreateTeam && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Create Team
            </button>
          )}
        </div>

        {/* Teams Grid */}
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleViewTeam(team.id)}
              >
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {team.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {team.memberCount || 0} member{team.memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {canCreateTeam && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(team);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Edit team"
                      >
                        <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(team);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Delete team"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Manager Info */}
                {team.manager && (
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Team Manager
                    </p>
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          team.manager.avatar_url ||
                          `https://avatar.iran.liara.run/username?username=${encodeURIComponent(team.manager.display_name)}`
                        }
                        alt={team.manager.display_name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.manager.display_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {canCreateTeam && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInviteMember(team);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Members
                    </button>
                  )}
                </div>

                {/* Created Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(team.created_at).toLocaleDateString()}
                    {team.creator && ` by ${team.creator.display_name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No teams yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {canCreateTeam
                ? "Create your first team to get started"
                : "No teams have been created yet"}
            </p>
            {canCreateTeam && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Create Team
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {selectedTeam && (
        <>
          <EditTeamModal
            isOpen={isEditModalOpen}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            team={selectedTeam}
          />
          <ConfirmDeleteTeamModal
            isOpen={isDeleteModalOpen}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            team={selectedTeam}
          />
          <InviteMemberModal
            isOpen={isInviteModalOpen}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            teamId={selectedTeam.id}
            teamName={selectedTeam.name}
          />
        </>
      )}
    </>
  );
}


"use client";

import { useState } from "react";
import { UserMinus, Mail, Crown, Shield, User } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { TeamMember } from "@/types/team";
import ConfirmRemoveMemberModal from "@/components/modals/ConfirmRemoveMemberModal";

interface TeamMembersListProps {
  members: TeamMember[];
  teamId: string;
  teamName: string;
  managerId: string;
  onMemberRemoved: () => void;
}

export default function TeamMembersList({
  members,
  teamId,
  teamName,
  managerId,
  onMemberRemoved,
}: TeamMembersListProps) {
  const { role } = useRole();
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const canRemoveMembers = role === "owner" || role === "admin";

  const handleRemoveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsRemoveModalOpen(true);
  };

  const handleRemoveSuccess = () => {
    setIsRemoveModalOpen(false);
    setSelectedMember(null);
    onMemberRemoved();
  };

  const handleModalClose = () => {
    setIsRemoveModalOpen(false);
    setSelectedMember(null);
  };

  const getRoleIcon = (memberRole: string) => {
    switch (memberRole) {
      case "owner":
        return <Crown className="w-4 h-4 text-amber-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (memberRole: string) => {
    switch (memberRole) {
      case "owner":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
      case "admin":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <Mail className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No members yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Invite members to join this team
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team Members ({members.length})
          </h3>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const isManager = member.id === managerId;
            const canRemove =
              canRemoveMembers &&
              member.role === "member" &&
              !isManager;

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                {/* Member Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={
                        member.avatar_url ||
                        `https://avatar.iran.liara.run/username?username=${encodeURIComponent(member.display_name)}`
                      }
                      alt={member.display_name}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {member.display_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                        >
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </span>
                        {isManager && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                            Manager
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                      title="Remove member"
                    >
                      <UserMinus className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  )}
                </div>

                {/* Member Info */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Remove Member Modal */}
      {selectedMember && (
        <ConfirmRemoveMemberModal
          isOpen={isRemoveModalOpen}
          onClose={handleModalClose}
          onSuccess={handleRemoveSuccess}
          member={selectedMember}
          teamId={teamId}
          teamName={teamName}
        />
      )}
    </>
  );
}

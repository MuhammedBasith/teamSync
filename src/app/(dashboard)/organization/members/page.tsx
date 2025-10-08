"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, useMoveMember, useRemoveMember, useResendInvite, Member } from "@/hooks/useMembers";
import { useTeams } from "@/hooks/useTeams";
import {
  Search,
  Users,
  Mail,
  ArrowRightLeft,
  Trash2,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import Spinner from "@/components/loaders/Spinner";

export default function MembersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: teamsData } = useTeams();

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch members with filters
  const { data: membersData, isLoading, error, refetch } = useMembers({
    team: teamFilter || undefined,
    status: statusFilter as "active" | "pending" | undefined,
    search: searchQuery || undefined,
  });

  // Mutations
  const moveMember = useMoveMember();
  const removeMember = useRemoveMember();
  const resendInvite = useResendInvite();

  // Modal states
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Redirect non-owners/non-admins
  useEffect(() => {
    if (!authLoading && user && user.role === "member") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleMoveMember = async () => {
    if (!selectedMember || !selectedTeamId) return;

    try {
      await moveMember.mutateAsync({
        memberId: selectedMember.id,
        teamId: selectedTeamId,
      });
      setShowMoveModal(false);
      setSelectedMember(null);
      setSelectedTeamId("");
    } catch (error) {
      console.error("Failed to move member:", error);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      if (selectedMember.status === "pending" && selectedMember.inviteId) {
        // For pending members, delete the invite
        await fetch(`/api/invite/${selectedMember.inviteId}`, {
          method: "DELETE",
        });
      } else {
        // For active members, remove from organization
        await removeMember.mutateAsync(selectedMember.id);
      }
      setShowRemoveModal(false);
      setSelectedMember(null);
      refetch();
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await resendInvite.mutateAsync(inviteId);
    } catch (error) {
      console.error("Failed to resend invite:", error);
    }
  };

  if (isLoading || authLoading) {
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
          Failed to load members: {error.message}
        </p>
      </div>
    );
  }

  const members = membersData?.members || [];
  const counts = membersData?.counts || { active: 0, pending: 0, total: 0 };
  const permissions = membersData?.permissions || {
    canMoveTeams: false,
    canRemove: false,
    canResendInvite: false,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Members
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage all members in your {user?.role === "admin" ? "team" : "organization"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {counts.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {counts.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-500/10 rounded-lg">
              <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {counts.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Team Filter */}
          {user?.role === "owner" && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            >
              <option value="">All Teams</option>
              {teamsData?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No members found
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Try adjusting your filters or invite new members
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            member.avatarUrl ||
                            `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
                              member.displayName || member.email
                            )}`
                          }
                          alt={member.displayName || member.email}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.displayName || (
                              <span className="text-gray-500 italic">Pending</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.team ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-500/10 text-brand-800 dark:text-brand-400">
                          {member.team.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No team
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Move Team (Owner only, Active members only) */}
                        {permissions.canMoveTeams && member.status === "active" && (
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowMoveModal(true);
                            }}
                            className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                            title="Move to another team"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        )}

                        {/* Resend Invite (Pending only) */}
                        {member.status === "pending" && member.inviteId && (
                          <button
                            onClick={() => handleResendInvite(member.inviteId!)}
                            disabled={resendInvite.isPending}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Resend invite"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}

                        {/* Remove */}
                        {permissions.canRemove && (
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRemoveModal(true);
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title={member.status === "pending" ? "Cancel invite" : "Remove member"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Member Modal */}
      {showMoveModal && selectedMember && (
        <>
          <div
            className="fixed inset-0 min-h-screen w-screen bg-black/30 backdrop-blur-sm z-[100000]"
            onClick={() => setShowMoveModal(false)}
          />
          <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 pointer-events-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Move Member to Team
                </h3>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Move <span className="font-semibold">{selectedMember.displayName}</span> to a different team
                </p>

                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a team</option>
                  {teamsData
                    ?.filter((team) => team.id !== selectedMember.team?.id)
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveMember}
                  disabled={!selectedTeamId || moveMember.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {moveMember.isPending ? "Moving..." : "Move Member"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Remove Member Modal */}
      {showRemoveModal && selectedMember && (
        <>
          <div
            className="fixed inset-0 min-h-screen w-screen bg-black/30 backdrop-blur-sm z-[100000]"
            onClick={() => setShowRemoveModal(false)}
          />
          <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 pointer-events-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {selectedMember.status === "pending" ? "Cancel Invite" : "Remove Member"}
                </h3>
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedMember.status === "pending" ? (
                    <>
                      Are you sure you want to cancel the invite for{" "}
                      <span className="font-semibold">{selectedMember.email}</span>?
                    </>
                  ) : (
                    <>
                      Are you sure you want to remove{" "}
                      <span className="font-semibold">{selectedMember.displayName}</span> from
                      the organization? This action cannot be undone.
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={removeMember.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removeMember.isPending ? "Removing..." : selectedMember.status === "pending" ? "Cancel Invite" : "Remove Member"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

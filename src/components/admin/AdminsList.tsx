"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface Invite {
  id: string;
  email: string;
  role: string;
  accepted: boolean;
  created_at: string;
  accepted_at: string | null;
  invited_by_user: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  user_id?: string; // For accepted invites
}

type DeleteAction = {
  type: "revoke" | "remove";
  id: string;
  email: string;
  inviteId?: string;
};

export default function AdminsList() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction | null>(null);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("role", "admin");
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/invite?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invites");
      }

      setInvites(data.invites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [filter]);

  const handleDeleteClick = (invite: Invite) => {
    if (invite.accepted) {
      // For accepted invites, we remove the admin user
      if (!invite.user_id) {
        setError("Cannot remove admin: user ID not found");
        return;
      }
      setDeleteAction({
        type: "remove",
        id: invite.user_id,
        email: invite.email,
        inviteId: invite.id,
      });
    } else {
      // For pending invites, we revoke the invitation
      setDeleteAction({
        type: "revoke",
        id: invite.id,
        email: invite.email,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteAction) return;

    try {
      setDeletingId(deleteAction.id);

      let response;
      if (deleteAction.type === "remove") {
        // Delete admin user
        response = await fetch(`/api/admin/${deleteAction.id}`, {
          method: "DELETE",
        });
      } else {
        // Revoke invite
        response = await fetch(`/api/invite/${deleteAction.id}`, {
          method: "DELETE",
        });
      }

      if (!response.ok) {
        let errorMessage = `Failed to ${deleteAction.type} admin`;
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use default error message
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      // Remove from list
      if (deleteAction.type === "remove" && deleteAction.inviteId) {
        setInvites((prev) => prev.filter((inv) => inv.id !== deleteAction.inviteId));
      } else {
        setInvites((prev) => prev.filter((inv) => inv.id !== deleteAction.id));
      }

      // Close modal
      setDeleteAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${deleteAction.type} admin`);
      setDeleteAction(null);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-4 border-b border-gray-200 dark:border-gray-800">
        {["all", "pending", "accepted"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as typeof filter)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === tab
                ? "bg-brand-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "pending" && invites.filter((i) => !i.accepted).length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-white/20">
                {invites.filter((i) => !i.accepted).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Invites List */}
      {invites.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            No {filter !== "all" && filter} invitations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filter === "pending"
              ? "There are no pending admin invitations."
              : filter === "accepted"
              ? "No admins have accepted invitations yet."
              : "Start by inviting your first admin."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Invited By
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {invites.map((invite) => (
                <tr
                  key={invite.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                          {invite.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        {invite.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {invite.accepted ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400">
                        Accepted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {invite.invited_by_user?.display_name || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invite.accepted ? invite.accepted_at! : invite.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteClick(invite)}
                      disabled={Boolean(
                        deletingId &&
                          (deletingId === invite.id ||
                            (invite.user_id && deletingId === invite.user_id))
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={invite.accepted ? "Remove admin" : "Revoke invitation"}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId &&
                      (deletingId === invite.id ||
                        (invite.user_id && deletingId === invite.user_id))
                        ? invite.accepted
                          ? "Removing..."
                          : "Revoking..."
                        : invite.accepted
                        ? "Remove"
                        : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteAction}
        onClose={() => setDeleteAction(null)}
        onConfirm={handleConfirmDelete}
        loading={!!deletingId}
        title={
          deleteAction?.type === "remove"
            ? "Remove Admin"
            : "Revoke Invitation"
        }
        message={
          deleteAction?.type === "remove"
            ? `Are you sure you want to remove ${deleteAction.email} as an admin? This will permanently delete their account and they will lose access immediately.`
            : `Are you sure you want to revoke the invitation for ${deleteAction?.email}? They will no longer be able to use this invite link.`
        }
        confirmText={deleteAction?.type === "remove" ? "Remove Admin" : "Revoke Invite"}
        type="danger"
      />
    </div>
  );
}


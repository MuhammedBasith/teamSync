"use client";

import { useState, useEffect } from "react";
import { Trash2, UserCog } from "lucide-react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ChangeRoleModal from "@/components/modals/ChangeRoleModal";

interface Admin {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  status: "active" | "pending";
  inviteId?: string; // Only for pending invites
}

type DeleteAction = {
  type: "revoke" | "remove";
  id: string;
  email: string;
  displayName?: string;
};

export default function AdminsList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<{
    id: string;
    display_name: string;
    role: "admin" | "member";
    email: string;
  } | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active admins from users table
      const adminsResponse = await fetch("/api/admin");
      const adminsData = await adminsResponse.json();

      if (!adminsResponse.ok) {
        throw new Error(adminsData.error || "Failed to fetch admins");
      }

      // Fetch pending invites
      const invitesResponse = await fetch("/api/invite?role=admin&status=pending");
      const invitesData = await invitesResponse.json();

      if (!invitesResponse.ok) {
        throw new Error(invitesData.error || "Failed to fetch invites");
      }

      // Combine active admins and pending invites
      const activeAdmins: Admin[] = (adminsData.admins || []).map((admin: { id: string; email: string; display_name: string; avatar_url: string | null; created_at: string }) => ({
        id: admin.id,
        email: admin.email,
        display_name: admin.display_name,
        avatar_url: admin.avatar_url,
        created_at: admin.created_at,
        status: "active" as const,
      }));

      const pendingInvites: Admin[] = (invitesData.invites || []).map((invite: { id: string; email: string; created_at: string }) => ({
        id: invite.id,
        email: invite.email,
        display_name: invite.email.split("@")[0],
        avatar_url: null,
        created_at: invite.created_at,
        status: "pending" as const,
        inviteId: invite.id,
      }));

      const combined = [...activeAdmins, ...pendingInvites];
      setAdmins(combined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [filter]);

  const handleDeleteClick = (admin: Admin) => {
    if (admin.status === "active") {
      // Remove active admin
      setDeleteAction({
        type: "remove",
        id: admin.id,
        email: admin.email,
        displayName: admin.display_name,
      });
    } else {
      // Revoke pending invite
      setDeleteAction({
        type: "revoke",
        id: admin.inviteId!,
        email: admin.email,
      });
    }
  };

  const handleChangeRoleClick = (admin: Admin) => {
    if (admin.status !== "active") {
      setError("Cannot change role: User hasn't accepted invite yet");
      return;
    }
    setSelectedUserForRole({
      id: admin.id,
      display_name: admin.display_name,
      role: "admin",
      email: admin.email,
    });
  };

  const handleRoleChangeSuccess = () => {
    setSelectedUserForRole(null);
    fetchAdmins(); // Refresh the list
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

      // Refresh the admin list
      fetchAdmins();

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
        {["all", "pending", "active"].map((tab) => (
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
            {tab === "pending" && admins.filter((a) => a.status === "pending").length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-white/20">
                {admins.filter((a) => a.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Admins List */}
      {(filter === "all" ? admins : admins.filter(a => a.status === filter)).length === 0 ? (
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
              : filter === "active"
              ? "No active admins yet."
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
              {(filter === "all" ? admins : admins.filter(a => a.status === filter)).map((admin) => (
                <tr
                  key={admin.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {admin.avatar_url ? (
                        <img
                          src={admin.avatar_url}
                          alt={admin.display_name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                            {admin.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-white">
                          {admin.display_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {admin.status === "active" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {admin.status === "pending" ? "Pending" : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(admin.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Change Role Button (only for active admins) */}
                      {admin.status === "active" && (
                        <button
                          onClick={() => handleChangeRoleClick(admin)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Change role"
                        >
                          <UserCog className="w-4 h-4" />
                          Change Role
                        </button>
                      )}
                      
                      {/* Delete/Revoke Button */}
                      <button
                        onClick={() => handleDeleteClick(admin)}
                        disabled={deletingId === admin.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={admin.status === "active" ? "Remove admin" : "Revoke invitation"}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === admin.id
                          ? admin.status === "active"
                            ? "Removing..."
                            : "Revoking..."
                          : admin.status === "active"
                          ? "Remove"
                          : "Revoke"}
                      </button>
                    </div>
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
            ? `Are you sure you want to remove ${deleteAction.displayName || deleteAction.email} as an admin? This will permanently delete their account and they will lose access immediately.`
            : `Are you sure you want to revoke the invitation for ${deleteAction?.email}? They will no longer be able to use this invite link.`
        }
        confirmText={deleteAction?.type === "remove" ? "Remove Admin" : "Revoke Invite"}
        type="danger"
      />

      {/* Change Role Modal */}
      {selectedUserForRole && (
        <ChangeRoleModal
          isOpen={!!selectedUserForRole}
          onClose={() => setSelectedUserForRole(null)}
          onSuccess={handleRoleChangeSuccess}
          user={selectedUserForRole}
        />
      )}
    </div>
  );
}


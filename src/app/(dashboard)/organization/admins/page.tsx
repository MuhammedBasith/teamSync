"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import InviteAdminModal from "@/components/admin/InviteAdminModal";
import AdminsList from "@/components/admin/AdminsList";

export default function AdminsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Only owners can access this page
  useEffect(() => {
    if (!loading && user && user.role !== "owner") {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleInviteSuccess = () => {
    setIsModalOpen(false);
    setRefreshKey((prev) => prev + 1); // Trigger refresh of invites list
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Show access denied only after loading is complete
  if (!user || user.role !== "owner") {
    return null; // Return null instead of showing message (user will be redirected)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Admin Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Invite and manage admins for your organization
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Invite Admin
        </button>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
            i
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              About Admins
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Admins can manage teams, invite members, view activity logs, but cannot modify organization settings or invite other admins.
            </p>
          </div>
        </div>
      </div>

      {/* Admins List */}
      <AdminsList key={refreshKey} />

      {/* Invite Modal */}
      <InviteAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}


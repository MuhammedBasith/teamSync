"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  teamName: string;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  teamName,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          role: "member",
          teamId: teamId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccessMessage(
        data.emailSent
          ? "Invitation sent successfully!"
          : "Invitation created (email sending failed, but invite is still valid)"
      );
      setEmail("");

      // Close modal after 2 seconds
      setTimeout(() => {
        onSuccess();
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
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
                Invite Member
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Invite a member to join <strong>{teamName}</strong>
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
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

            {/* Email Input */}
            <div>
              <Label>
                Email Address <span className="text-error-500">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                required
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                They&apos;ll receive an email with instructions to join
              </p>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                <strong>Member Permissions:</strong> View assigned teams and
                collaborate with team members.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!successMessage}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, CheckCircle } from "lucide-react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col flex-1 w-full">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>

        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-100 dark:bg-green-500/10">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white">
              Check Your Email
            </h1>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-medium text-gray-800 dark:text-white">{email}</span>
            </p>

            <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Didn&apos;t receive the email?</strong> Check your spam folder or try
                again.
              </p>
            </div>

            <Link
              href="/signin"
              className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-brand-100 dark:bg-brand-500/20">
              <Mail className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Forgot Password?
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No worries, we&apos;ll send you reset instructions.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoFocus
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


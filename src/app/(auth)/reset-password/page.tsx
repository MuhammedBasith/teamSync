import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";
import { Suspense } from "react";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Reset Password | TeamSync",
  description: "Reset your TeamSync password",
};

function ResetPasswordFormFallback() {
  return (
    <div className="flex flex-col flex-1 w-full items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="animate-pulse space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-brand-100 dark:bg-brand-500/20">
            <Lock className="w-6 h-6 text-brand-600 dark:text-brand-400 animate-pulse" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-3 mt-8">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFormFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}


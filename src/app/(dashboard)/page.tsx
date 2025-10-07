import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard | TeamSync",
  description: "TeamSync organization dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to TeamSync - Your organization dashboard
        </p>
      </div>

      {/* Placeholder for future dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Members
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Coming soon
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Teams
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Coming soon
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Coming soon
          </p>
        </div>
      </div>
    </div>
  );
}


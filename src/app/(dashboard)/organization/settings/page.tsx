import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organization Settings | TeamSync",
  description: "Manage your organization settings",
};

export default function OrganizationSettingsPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Organization Settings
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Coming soon - Manage organization name, color palette, and quotas
      </p>
    </div>
  );
}


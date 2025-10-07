import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members | TeamSync",
  description: "Manage organization members",
};

export default function MembersPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Members
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Coming soon - View and manage organization members, invite new members
      </p>
    </div>
  );
}


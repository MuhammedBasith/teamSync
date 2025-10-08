import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Details | TeamSync",
  description: "View team details and members",
};

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Team Details
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Coming soon - View team {id} details and manage members
      </p>
    </div>
  );
}

import { Metadata } from "next";
import TeamsList from "@/components/tables/TeamsList";

export const metadata: Metadata = {
  title: "Teams - TeamSync",
  description: "Manage your organization's teams",
};

export default function TeamsPage() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <TeamsList />
    </div>
  );
}


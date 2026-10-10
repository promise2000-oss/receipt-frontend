import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { TeamView } from "@/components/team/TeamView";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("Team"),
    description: "Manage who has access to your organization and what they can do.",
    // Staff directory data — never indexed.
  };
}

export default function TeamPage() {
  return <TeamView />;
}
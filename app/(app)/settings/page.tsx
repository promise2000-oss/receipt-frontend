import type { Metadata } from "next";
import { pageTitle } from "@/lib/server/brand";
import { SettingsView } from "@/components/settings/SettingsView";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await pageTitle("Settings"),
    description: "Logo, business details, and brand colours for your receipts.",
  };
}

export default function SettingsPage() {
  return <SettingsView />;
}

import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Business Settings",
  description: "Logo, business details, and brand colours for your receipts.",
};

export default function SettingsPage() {
  return <SettingsView />;
}

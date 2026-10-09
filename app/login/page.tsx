import type { Metadata } from "next";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Sign in · VisionaryGene",
  description: "Sign in to your organization's receipt workspace.",
};

export default function LoginPage() {
  return <AuthView mode="signin" />;
}

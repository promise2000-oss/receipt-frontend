import type { Metadata } from "next";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Create organization · VisionaryGene",
  description: "Set up a receipt workspace for your organization.",
};

export default function SignupPage() {
  return <AuthView mode="signup" />;
}

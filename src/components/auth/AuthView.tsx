"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { useSession } from "./SessionProvider";

type Mode = "signin" | "signup";

interface ModeCopy {
  title: string;
  subtitle: string;
  cta: string;
  switchLabel: string;
  switchHref: string;
  switchText: string;
}

const COPY: Record<Mode, ModeCopy> = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to your organization to pick up where you left off.",
    cta: "Sign in",
    switchLabel: "New here?",
    switchHref: "/signup",
    switchText: "Create an organization",
  },
  signup: {
    title: "Create your organization",
    subtitle:
      "Set up a workspace for your business — your logo, customers, and receipts live here.",
    cta: "Create organization",
    switchLabel: "Already registered?",
    switchHref: "/login",
    switchText: "Sign in instead",
  },
};

/**
 * Shared auth screen for /login and /signup — a centred card on the dark
 * gradient, with the platform wordmark above the form and a full-width
 * primary action.
 */
export function AuthView({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const { signIn, signUp } = useSession();

  const [orgName, setOrgName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signUp({ org_name: orgName, owner_name: ownerName, email, password });
      } else {
        await signIn({ email, password });
      }
      router.push("/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong — please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="app-bg flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        {/* ---- Wordmark above the card ---- */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.28em] text-vg-accent-text">
            Receipt Platform
          </p>
        </div>

        {/* ---- Form card ---- */}
        <div className="rounded-card border border-vg-border bg-vg-surface-2 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-vg-white sm:text-[28px]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-vg-text-muted">
            {copy.subtitle}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            {mode === "signup" && (
              <>
                <Field label="Organization name" required>
                  <TextInput
                    value={orgName}
                    onChange={(event) => setOrgName(event.target.value)}
                    placeholder="e.g. ABC Pharmacy"
                    autoComplete="organization"
                    autoFocus
                  />
                </Field>
                <Field label="Your name" required>
                  <TextInput
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    placeholder="e.g. Promise Shedrack"
                    autoComplete="name"
                  />
                </Field>
              </>
            )}

            <Field label="Work email" required>
              <TextInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@yourbusiness.com"
                autoComplete="email"
                autoFocus={mode === "signin"}
              />
            </Field>

            <Field
              label="Password"
              required
              hint={mode === "signup" ? "At least 8 characters." : undefined}
            >
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-control border border-vg-error bg-vg-error/12 px-4 py-3 text-sm text-vg-error"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} aria-hidden />
                  Creating…
                </>
              ) : (
                <>
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-sm text-vg-text-muted">
            {copy.switchLabel}{" "}
            <Link
              href={copy.switchHref}
              className="font-medium text-vg-accent-text underline-offset-4 hover:underline"
            >
              {copy.switchText}
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-vg-text-muted">
          {new Date().getFullYear()} Powered by VisionaryGene
        </p>
      </div>
    </div>
  );
}

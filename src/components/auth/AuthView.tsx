"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
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
 * Shared auth screen for /login and /signup — black brand panel on the left,
 * cream form card on the right (stacks on mobile).
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
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp({ org_name: orgName, owner_name: ownerName, email, password });
      } else {
        await signIn({ email, password });
      }
      router.push("/");
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
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---- Brand panel ---- */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-brand-black px-6 py-10 sm:px-12">
        <Logo variant="on-dark" />

        <div className="py-14">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.28em] text-brand-gold">
            Receipt Platform
          </p>
          <h2 className="mt-4 max-w-md font-display text-3xl leading-tight text-cream sm:text-4xl">
            Beautiful branded receipts, issued in under a minute.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/60">
            One workspace per organization — your logo, brand colours, and
            customers flow straight into every receipt, PDF, and WhatsApp
            share.
          </p>
        </div>

        <p className="text-xs text-cream/40">
          {new Date().getFullYear()} Powered by VisionaryGene
        </p>
      </div>

      {/* ---- Form panel ---- */}
      <div className="flex items-center justify-center bg-cream px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
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
                className="rounded-control border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-sm text-gold-deep"
              >
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                  {mode === "signup" ? "Creating…" : "Signing in…"}
                </>
              ) : (
                <>
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {copy.switchLabel}{" "}
            <Link
              href={copy.switchHref}
              className="font-medium text-gold-deep underline-offset-4 hover:underline"
            >
              {copy.switchText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

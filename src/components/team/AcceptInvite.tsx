"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";

/**
 * Redeem an invitation and create the account.
 *
 * The token arrives in the URL and is never sent anywhere except the API.
 * Success sends the new member to sign-in rather than logging them in
 * automatically: they have just chosen a password on a shared or public
 * machine, and an unexpected auto-login is a worse surprise than one extra
 * click.
 */
export function AcceptInvite({ token }: { token: string | null }) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <Shell>
        <Alert
          title="That invitation link is incomplete"
          body="The link is missing its invitation token. Ask whoever invited you to send it again."
        />
      </Shell>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (fullName.trim().length < 2 || password.length < 8) return;

    setBusy(true);
    setError(null);
    try {
      await api.acceptInvitation({
        token: token!,
        email,
        full_name: fullName,
        password,
      });
      setDone(true);
      // Give the message a moment to register before moving on.
      setTimeout(() => router.push("/login"), 1400);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Couldn't accept this invitation.",
      );
      setBusy(false);
    }
  }

  const valid = fullName.trim().length >= 2 && email.trim().length >= 3 && password.length >= 8;

  return (
    <Shell>
      {done ? (
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-vg-white">
            You&apos;re in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-vg-text-muted">
            Your account has been created. Taking you to sign in…
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-vg-white">
            Accept your invitation
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-vg-text-muted">
            Create your account to join the workspace. Use the same email the
            invitation was sent to.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Your name" required>
              <TextInput
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. Ada Nwosu"
                autoComplete="name"
              />
            </Field>

            <Field
              label="Email address"
              required
              hint="Must match the address the invitation was sent to."
            >
              <TextInput
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@business.com"
                autoComplete="email"
              />
            </Field>

            <Field
              label="Password"
              required
              hint="At least 8 characters."
              error={password.length > 0 && password.length < 8 ? "Too short." : undefined}
            >
              <TextInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </Field>

            {error && (
              <p role="alert" className="flex items-start gap-1.5 text-xs text-vg-error">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{error}</span>
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={!valid || busy}>
              {busy ? "Creating your account…" : "Accept invitation"}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-vg-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-vg-accent-text hover:underline">
          Sign in instead
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-card border border-vg-border bg-vg-surface-2 p-7">
        {children}
      </div>
    </div>
  );
}

function Alert({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-vg-warning" strokeWidth={1.8} aria-hidden />
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-vg-white">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-vg-text-muted">{body}</p>
    </div>
  );
}
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { SessionInfo, SignInInput, SignUpInput } from "@/lib/types";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  session: SessionInfo | null;
  status: SessionStatus;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Re-read `GET /auth/me`.
   *
   * Called after organization settings are saved: the session carries the
   * organization's name, logo and palette, so refreshing it is what makes a
   * rename show up in the header, sidebar and document title without a page
   * reload and without every surface fetching branding itself.
   */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the signed-in organization for the whole app.
 *
 * The session is an httpOnly cookie the API sets, so there is nothing to read
 * locally — we resolve it by asking `GET /auth/me` once on mount. Starting at
 * "loading" keeps server and client markup identical on first paint.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    api
      .getSession()
      .then((current) => {
        if (cancelled) return;
        setSession(current);
        setStatus(current ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        // The API could not be reached at all (offline, restarting). Neither
        // answer is "signed out", but pinning someone on the splash forever
        // is worse than showing the sign-in screen they can retry from.
        if (cancelled) return;
        setSession(null);
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    const next = await api.signIn(input);
    setSession(next);
    setStatus("authenticated");
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const next = await api.signUp(input);
    setSession(next);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const current = await api.getSession();
      setSession(current);
      setStatus(current ? "authenticated" : "unauthenticated");
    } catch {
      // A blip while re-reading the session must not sign the user out of a
      // session that is still perfectly valid — keep what we already have and
      // let the next natural load pick up the change.
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, status, signIn, signUp, signOut, refresh }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return value;
}

/**
 * The session, or `null` when there is no provider above.
 *
 * For components that legitimately render in both places — the `Logo` shows a
 * signed-in organization's mark inside the app and the platform mark on the
 * public marketing pages, which sit outside the provider entirely. Throwing
 * there would make the marketing site a render error rather than a signed-out
 * page.
 *
 * Inside the app, prefer {@link useSession}: it fails loudly if the provider
 * is ever removed by mistake, which is what caught this in the first place.
 */
export function useOptionalSession(): SessionContextValue | null {
  return useContext(SessionContext) ?? null;
}

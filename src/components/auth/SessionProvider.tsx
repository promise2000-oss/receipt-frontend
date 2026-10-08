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
import { AuthError } from "@/lib/auth";
import type { SessionInfo, SignInInput, SignUpInput } from "@/lib/types";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  session: SessionInfo | null;
  status: SessionStatus;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the signed-in organization for the whole app.
 *
 * The session lives in localStorage (there is no backend yet), so we read it
 * once on mount — starting at "loading" keeps server and client markup
 * identical on first paint.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    // Deferred one tick so the first (hydrated) render matches the server
    // markup, which always renders the "loading" state.
    Promise.resolve().then(() => {
      if (cancelled) return;
      const current = api.getSession();
      setSession(current);
      setStatus(current ? "authenticated" : "unauthenticated");
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

  const signOut = useCallback(() => {
    api.signOut();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, status, signIn, signUp, signOut }}
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

export { AuthError };

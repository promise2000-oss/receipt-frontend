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
    api.getSession().then((current) => {
      if (cancelled) return;
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

  const signOut = useCallback(async () => {
    await api.signOut();
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

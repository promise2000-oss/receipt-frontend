import type { Account, SessionInfo, SignInInput, SignUpInput } from "./types";

/**
 * Organization auth for the prototype.
 *
 * There is no backend, so accounts live in `localStorage` alongside the
 * workspace data. Passwords are salted + hashed before they are stored, but
 * everything still runs in the browser — treat this as a UI prototype, not a
 * security boundary. Swapping in a real API means replacing `signUp`/`signIn`
 * with POST /auth/register and POST /auth/login.
 */

const ACCOUNTS_KEY = "eleosstyles.accounts.v1";
const SESSION_KEY = "eleosstyles.session.v1";

const hasWindow = () => typeof window !== "undefined";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------ Passwords ------------------------------ */

/** Salted, iterated digest via Web Crypto. Never store the raw password. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();

  // `crypto.subtle` is only exposed in secure contexts — fall back to a plain
  // digest loop when the prototype is opened over plain http on a LAN address.
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return fallbackDigest(`${salt}:${password}`);
  }

  let key = encoder.encode(`${salt}:${password}`);
  for (let round = 0; round < 100_000; round += 1) {
    const digest = await crypto.subtle.digest("SHA-256", key);
    key = new Uint8Array(digest);
  }

  return Array.from(key)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fallbackDigest(input: string): string {
  let hash = 0;
  for (let round = 0; round < 1000; round += 1) {
    hash = 0;
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 31 + input.charCodeAt(index)) | 0;
    }
  }
  return (hash >>> 0).toString(16).padStart(8, "0").repeat(4);
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/* ------------------------------- Storage ------------------------------- */

function readAccounts(): Account[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

/** True once at least one organization has registered on this browser. */
export function hasAnyAccount(): boolean {
  return readAccounts().length > 0;
}

function writeAccounts(accounts: Account[]): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage unavailable — sign-in won't survive a reload */
  }
}

function toSession(account: Account): SessionInfo {
  return {
    account_id: account.id,
    org_name: account.org_name,
    owner_name: account.owner_name,
    email: account.email,
  };
}

/* -------------------------------- Errors -------------------------------- */

export class AuthError extends Error {}

/* --------------------------------- API ---------------------------------- */

/** Returns the fresh account (with its salted password hash) or throws. */
export async function signUp({
  org_name,
  owner_name,
  email,
  password,
}: SignUpInput): Promise<SessionInfo> {
  const org = org_name.trim();
  const owner = owner_name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (org.length < 2) throw new AuthError("Enter your organization's name.");
  if (owner.length < 2) throw new AuthError("Enter your name.");
  if (!EMAIL_RE.test(normalizedEmail)) {
    throw new AuthError("Enter a valid email address.");
  }
  if (password.length < 8) {
    throw new AuthError("Choose a password of at least 8 characters.");
  }

  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new AuthError(
      "An organization already uses that email — sign in instead.",
    );
  }

  const salt = randomSalt();
  const account: Account = {
    id: `o_${crypto.randomUUID().slice(0, 8)}`,
    org_name: org,
    owner_name: owner,
    email: normalizedEmail,
    password: `${salt}:${await hashPassword(password, salt)}`,
    created_at: new Date().toISOString(),
  };

  writeAccounts([...accounts, account]);
  persistSession(toSession(account));
  return toSession(account);
}

export async function signIn({
  email,
  password,
}: SignInInput): Promise<SessionInfo> {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find((item) => item.email === normalizedEmail);

  if (!account) {
    throw new AuthError("No organization found with that email.");
  }

  const [salt, digest] = account.password.split(":");
  if (!salt || !digest || (await hashPassword(password, salt)) !== digest) {
    throw new AuthError("That password doesn't match our records.");
  }

  const session = toSession(account);
  persistSession(session);
  return session;
}

export function signOut(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Null when signed out. Read synchronously — used by the app shell gate. */
export function getSession(): SessionInfo | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionInfo;
    return session?.account_id ? session : null;
  } catch {
    return null;
  }
}

function persistSession(session: SessionInfo): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

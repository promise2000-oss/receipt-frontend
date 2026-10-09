import { cache } from "react";
import { cookies } from "next/headers";

/**
 * Server-side resolution of the signed-in organization, for browser titles.
 *
 * The session is an httpOnly cookie, so the only way a Server Component can
 * learn which organization is signed in is to ask the API — this reads the
 * cookie and calls `GET /auth/me` with it, exactly as the browser does.
 *
 * Three things keep that cheap:
 *
 *  - {@link cache} memoizes it per request, so `generateMetadata` on a page
 *    and anything else that wants the name share one call;
 *  - a short process-level cache keyed by the session token means navigating
 *    between pages does not hammer a free-tier instance with a call per view;
 *  - a 5s timeout, so a cold API degrades to the platform title instead of
 *    stalling the page.
 *
 * Never returns a value derived from anything the client sent: the name comes
 * back from the API for whoever the session actually belongs to.
 */

const SESSION_COOKIE = "el_session";
const TTL_MS = 60_000;
const TIMEOUT_MS = 5_000;
const MAX_ENTRIES = 512;

const store = new Map<string, { name: string | null; until: number }>();

/**
 * Drop the cached organization names.
 *
 * Exported for the server action Settings calls after a save: a rename has to
 * show up in the next `generateMetadata`, and the whole point of the cache is
 * that it would otherwise keep serving the old name for a full TTL. Clearing
 * it explicitly is what lets the cache stay long enough to be worth having.
 */
export function invalidateOrgNameCache() {
  store.clear();
}

function prune(now: number) {
  for (const [key, entry] of store) {
    if (entry.until <= now) store.delete(key);
  }
  // Defensive: a burst of sessions should not grow the heap without bound.
  if (store.size > MAX_ENTRIES) store.clear();
}

async function lookupOrgName(token: string): Promise<string | null> {
  const now = Date.now();
  prune(now);

  const hit = store.get(token);
  if (hit && hit.until > now) return hit.name;

  const origin = (process.env.API_URL ?? "").replace(/\/+$/, "");
  if (!origin) return null;

  let name: string | null = null;
  try {
    const response = await fetch(`${origin}/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) {
      const payload = (await response.json()) as { business?: { name?: string } };
      const value = payload.business?.name?.trim();
      name = value ? value : null;
    }
  } catch {
    // Unreachable or slow API: fall back to the platform title.
    return null;
  }

  store.set(token, { name, until: Date.now() + TTL_MS });
  return name;
}

/**
 * The signed-in organization's name, or null when nobody is signed in (or the
 * API could not be reached in time).
 */
export const getOrgName = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return lookupOrgName(token);
});

/**
 * `"ABC Pharmacy — Receipts"` when signed in, `"Receipts · VisionaryGene"`
 * when not — the organization leads, the platform stays a quiet suffix.
 */
export async function pageTitle(section: string): Promise<string> {
  const org = await getOrgName();
  return org ? `${org} — ${section}` : `${section} · VisionaryGene`;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/**
 * Sends a signed-in visitor from the marketing homepage to their workspace.
 *
 * Isolated in its own client component so the page itself stays a Server
 * Component. That matters more than it looks: the whole point of the marketing
 * group is that a crawler receives finished HTML, and a `"use client"`
 * directive on the page file would make the entire tree a client bundle.
 * Here the server renders everything and this renders `null`.
 *
 * It also degrades safely. A signed-out visitor, or one whose session check
 * fails because the API is unreachable, is left on the marketing page —
 * nobody gets stranded because a network call failed.
 */
export function RedirectSignedInUsers({ to = "/dashboard" }: { to?: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await api.getSession();
        if (!cancelled && session) router.replace(to);
      } catch {
        // Signed out, or the API is unreachable — stay where we are.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, to]);

  return null;
}
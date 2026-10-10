import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { SessionProvider } from "@/components/auth/SessionProvider";

/**
 * The signed-in application shell.
 *
 * Everything under this group is behind the auth guard in `AppShell`, which
 * redirects an unauthenticated visitor to `/login`. It is a *client* boundary
 * because the session lives in an httpOnly cookie the browser has to read —
 * the server cannot know who is signed in without forwarding the cookie.
 *
 * Keeping it in a route group rather than the root layout is what lets the
 * marketing pages render as ordinary server-rendered HTML with no client
 * gate in front of them.
 */
/**
 * `noindex, nofollow` for the whole signed-in application.
 *
 * Declared **once here** rather than on each of the ten app pages, because a
 * per-page directive is one someone will eventually forget — and the page
 * that forgets it is a customer's receipt history sitting in a search index.
 * A child page's own `robots` overrides this, so a genuinely public route can
 * still opt back in.
 *
 * Note this is guidance, not access control: the real protection for these
 * routes is the session check in `AppShell` and the tenant scoping in the API.
 * `robots.txt` keeps crawlers away; it does not make anything private.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
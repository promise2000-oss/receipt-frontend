"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/components/auth/SessionProvider";

/** Routes that render without the signed-in chrome (and without a guard). */
const PUBLIC_PATHS = ["/login", "/signup"];

/**
 * App chrome: near-black top bar + near-black sidebar (lg+) / bottom nav
 * (mobile) over the `#050505` app background.
 *
 * Also the auth gate — every route except /login and /signup requires a
 * signed-in organization, so we hold the splash until the session is known
 * and bounce visitors to /login otherwise.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const signedIn = status === "authenticated";

  useEffect(() => {
    if (isPublic) {
      // Already signed in? Send people straight to their dashboard.
      if (signedIn) router.replace("/");
      return;
    }
    if (status === "unauthenticated") router.replace("/login");
  }, [isPublic, signedIn, status, router]);

  /* ---- Auth screens render bare, full-bleed ---- */
  if (isPublic) return <>{children}</>;

  /* ---- Gate: no flash of app chrome before we know the session ---- */
  if (status === "loading") {
    return (
      <div className="app-bg flex min-h-dvh flex-col items-center justify-center gap-5">
        <Logo />
        <span
          className="h-1.5 w-24 overflow-hidden rounded-full bg-vg-surface-3"
          aria-hidden
        >
          <span className="accent-shimmer block h-full w-full" />
        </span>
        <span className="sr-only" role="status">
          Loading your workspace…
        </span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="app-bg flex min-h-dvh items-center justify-center">
        <span className="sr-only" role="status">
          Redirecting to sign in…
        </span>
      </div>
    );
  }

  return (
    <div className="app-bg flex min-h-dvh flex-col">
      <TopBar />
      <div className="flex flex-1 items-stretch">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

/**
 * App chrome: black top bar + black sidebar (lg+) / bottom nav (mobile).
 * The page body always sits on warm cream.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
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

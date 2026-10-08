import type { NextConfig } from "next";

/**
 * The receipt API issues its session as a `SameSite=Lax` cookie, which
 * browsers withhold from cross-site `fetch` — so calling it directly from
 * the app origin would authenticate once and then immediately 401.
 *
 * Instead the browser talks to `/api/*` on this origin and Next.js proxies
 * those requests to `API_URL` (set in `.env`). That keeps the session cookie
 * same-origin and lets the API's relative asset paths (`/api/files/...`,
 * including the signed logo URL) resolve against the app.
 */
const apiOrigin = (process.env.API_URL ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiOrigin) return [];
    return [{ source: "/api/:path*", destination: `${apiOrigin}/:path*` }];
  },
};

export default nextConfig;

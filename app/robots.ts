import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * robots.txt
 *
 * Two distinct jobs, and conflating them is the classic mistake:
 *
 *  1. **Guidance** — tell crawlers where the public content is.
 *  2. **Disallow** — keep crawlers out of the signed-in application, so no
 *     customer's URL or document reference ends up in an index.
 *
 * What this is *not*: a security control. `robots.txt` is public and advisory;
 * a disallowed URL is still fetchable by anyone who knows it. The real
 * protection for private data is the session check and the tenant scoping in
 * the API. Disallowing here is about not *advertising* those routes.
 *
 * `Disallow: /api/` additionally keeps crawlers away from the API surface,
 * which has no HTML worth indexing and rate-limits credential endpoints.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // The entire signed-in application.
          "/api/",
          "/dashboard",
          "/receipts",
          "/invoices",
          "/customers",
          "/settings",
          "/team",
          "/accept-invite",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
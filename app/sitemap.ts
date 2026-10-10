import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * The sitemap.
 *
 * Lists **only** public marketing routes. Nothing under the signed-in app is
 * included — not the dashboard, not receipts, not invoices, not customers, not
 * settings, not team, not the invitation page. A sitemap is a public file, so
 * putting a private URL in it hands a crawler a way to discover that the
 * route exists, which is the first half of an enumeration attack.
 *
 * `changeFrequency` and `priority` describe how often the content actually
 * changes: the home page moves with the product, the legal pages essentially
 * never.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/features"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/features/receipts"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/features/invoicing"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
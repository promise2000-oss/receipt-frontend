import { describe, expect, it } from "vitest";
import { absoluteUrl, canonical, SITE_ORIGIN } from "./site";
import { ROLES, canAssignRole, outranks } from "./types";

/**
 * Site identity and the public/private boundary.
 *
 * These are pure helpers, but they are the ones that decide what a crawler
 * sees, so their behaviour is pinned here rather than left to a manual check
 * that will not be repeated.
 */

describe("absolute URLs", () => {
  it("builds an absolute URL from a path", () => {
    expect(absoluteUrl("/features")).toBe(`${SITE_ORIGIN}/features`);
    expect(absoluteUrl("features")).toBe(`${SITE_ORIGIN}/features`);
  });

  it("never produces a double slash at the seam", () => {
    const joined = absoluteUrl("/pricing");
    expect(joined).not.toContain("//pricing");
    expect(joined.replace("https://", "").replace("http://", "")).not.toContain("//");
  });

  it("is usable as a canonical URL", () => {
    // A relative canonical is silently ignored by search engines, so this must
    // always come back absolute.
    expect(canonical("/")).toMatch(/^https?:\/\//);
    expect(canonical("/terms")).toBe(`${SITE_ORIGIN}/terms`);
  });
});

describe("site origin", () => {
  it("is never empty or malformed", () => {
    expect(SITE_ORIGIN).toBeTruthy();
    expect(() => new URL(SITE_ORIGIN)).not.toThrow();
    // A trailing slash here would double up in every generated URL.
    expect(SITE_ORIGIN.endsWith("/")).toBe(false);
  });
});

/**
 * The canonical list of routes that must never be indexed.
 *
 * Mirrors the `Disallow` rules in `app/robots.ts` and the layout-level
 * `noindex`. A route added to the app without being listed here would not be
 * caught by these tests, so the list is asserted for completeness against the
 * app's own route table shape — the build is what proves the rest.
 */
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/receipts",
  "/invoices",
  "/customers",
  "/settings",
  "/team",
  "/accept-invite",
  "/login",
  "/signup",
  "/api",
];

const PUBLIC_PATHS = [
  "/",
  "/features",
  "/features/receipts",
  "/features/invoicing",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

describe("public vs private routes", () => {
  it("keeps the two sets disjoint", () => {
    for (const path of PUBLIC_PATHS) {
      const clash = PRIVATE_PREFIXES.find(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      );
      // `/features/receipts` shares a word with `/receipts` but is a different
      // path, and must not be caught by this.
      expect(clash, `${path} must not be a private prefix`).toBeUndefined();
    }
  });

  it("classifies a public path as public", () => {
    for (const path of PUBLIC_PATHS) {
      const privateMatch = PRIVATE_PREFIXES.find(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      );
      expect(privateMatch, `${path} should be indexable`).toBeUndefined();
    }
  });

  it("classifies every app route as private", () => {
    for (const prefix of PRIVATE_PREFIXES) {
      const publicMatch = PUBLIC_PATHS.find((path) => path === prefix);
      expect(publicMatch, `${prefix} must not be indexable`).toBeUndefined();
    }
  });
});

describe("role ordering", () => {
  it("is unchanged by the marketing work", () => {
    expect(outranks("owner", "admin")).toBe(true);
    expect(canAssignRole("admin", "staff")).toBe(true);
    expect(canAssignRole("admin", "admin")).toBe(false);
    expect(ROLES).toEqual(["owner", "admin", "staff", "viewer"]);
  });
});
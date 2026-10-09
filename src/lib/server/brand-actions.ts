"use server";

import { invalidateOrgNameCache } from "./brand";

/**
 * Forget the cached organization names so the next render reads them fresh.
 *
 * Settings runs this (followed by `router.refresh()`) immediately after a
 * rename, so the browser title catches up with the header in the same
 * interaction instead of up to a minute later. The cache itself is a pure
 * read-through of `GET /auth/me`, so clearing it can only ever make the next
 * read more current — there is nothing here to forge or escalate.
 */
export async function invalidateOrgName(): Promise<void> {
  invalidateOrgNameCache();
}

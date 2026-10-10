import { describe, expect, it } from "vitest";
import {
  can,
  canAssignRole,
  outranks,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  type Role,
} from "./types";

/**
 * The client's mirror of the server's role hierarchy.
 *
 * These functions exist purely so the UI can *hide* a control the API would
 * refuse — they are a courtesy, not a boundary. If they drifted from
 * `@eleos/shared` the worst outcome would be a visible button that 403s, which
 * is why the same ordering and the same rule are asserted here.
 */

describe("role hierarchy", () => {
  it("orders owner > admin > staff > viewer", () => {
    expect(outranks("owner", "admin")).toBe(true);
    expect(outranks("admin", "staff")).toBe(true);
    expect(outranks("staff", "viewer")).toBe(true);
    expect(outranks("viewer", "staff")).toBe(false);
    expect(outranks("owner", "viewer")).toBe(true);
  });

  it("never lets an actor outrank themselves", () => {
    for (const role of ROLES) {
      expect(outranks(role, role), `${role} outranks itself`).toBe(false);
    }
  });

  it("refuses to assign a role at or above the actor's own", () => {
    expect(canAssignRole("owner", "owner")).toBe(false);
    expect(canAssignRole("admin", "admin")).toBe(false);
    expect(canAssignRole("admin", "owner")).toBe(false);
    expect(canAssignRole("staff", "staff")).toBe(false);
    expect(canAssignRole("staff", "viewer")).toBe(true);
    expect(canAssignRole("admin", "staff")).toBe(true);
  });

  it("means a viewer can manage nobody", () => {
    expect(ROLES.filter((role) => canAssignRole("viewer", role))).toEqual([]);
  });

  it("has a label and a description for every role", () => {
    for (const role of ROLES) {
      expect(ROLE_LABELS[role], `${role} has no label`).toBeTruthy();
      expect(ROLE_DESCRIPTIONS[role], `${role} has no description`).toBeTruthy();
    }
  });

  it("describes viewer as read-only and owner as full control", () => {
    // These two strings are shown to a user choosing a role, so their meaning
    // is part of the product, not incidental copy.
    expect(ROLE_DESCRIPTIONS.viewer.toLowerCase()).toContain("read-only");
    expect(ROLE_DESCRIPTIONS.owner.toLowerCase()).toContain("full control");
  });

  it("names only the four roles the API defines", () => {
    expect(ROLES).toEqual(["owner", "admin", "staff", "viewer"]);
    expect(new Set(ROLES).size).toBe(ROLES.length);
  });

  it("treats an unknown role as having no rank rather than throwing", () => {
    expect(outranks("wizard" as Role, "viewer")).toBe(false);
    expect(canAssignRole("wizard" as Role, "viewer")).toBe(false);
  });
});
/**
 * The client's permission mirror.
 *
 * These grants must stay identical to `@eleos/shared#GRANTS` in the backend.
 * A permission present here but absent there renders a control that always
 * 403s; one present there but absent here hides something that would have
 * worked. Both are user-visible, so the matrix is asserted explicitly.
 */
describe("client permission mirror", () => {
  it("gives viewer nothing at all", () => {
    for (const permission of [
      "org.update", "team.invite", "customer.create", "receipt.create",
      "invoice.create", "invoice.issue", "invoice.cancel",
      "invoice.recordPayment",
    ] as const) {
      expect(can("viewer", permission), `viewer holds ${permission}`).toBe(false);
    }
  });

  it("lets staff do the daily work but administer nothing", () => {
    expect(can("staff", "receipt.create")).toBe(true);
    expect(can("staff", "invoice.create")).toBe(true);
    expect(can("staff", "invoice.recordPayment")).toBe(true);
    expect(can("staff", "customer.create")).toBe(true);

    expect(can("staff", "org.update")).toBe(false);
    expect(can("staff", "team.invite")).toBe(false);
    expect(can("staff", "invoice.cancel")).toBe(false);
    expect(can("staff", "customer.delete")).toBe(false);
  });

  it("lets admin run the business without owner-only powers", () => {
    expect(can("admin", "team.invite")).toBe(true);
    expect(can("admin", "invoice.cancel")).toBe(true);
    expect(can("admin", "org.update")).toBe(true);
    expect(can("admin", "org.delete")).toBe(false);
  });

  it("gives owner everything the mirror knows about", () => {
    expect(can("owner", "org.update")).toBe(true);
    expect(can("owner", "org.delete")).toBe(true);
    expect(can("owner", "team.revoke")).toBe(true);
    expect(can("owner", "invoice.cancel")).toBe(true);
  });

  it("denies everything for an absent role", () => {
    expect(can(null, "receipt.create")).toBe(false);
    expect(can(undefined, "invoice.issue")).toBe(false);
  });
});

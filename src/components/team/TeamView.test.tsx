/**
 * @vitest-environment jsdom
 *
 * The reported repro, end to end: open "Invite a team member" on the Team
 * page and type an email address.
 *
 * The bug was never in this component — it is in `ConfirmDialog`, whose focus
 * effect depended on the inline `onClose` arrow this view passes. This test
 * exists because a unit test of `ConfirmDialog` alone would keep passing even
 * if a future change to *this* file started handing it a new handler identity
 * per keystroke, which is precisely how the bug presented.
 *
 * `api` and the session are stubbed: the assertion is about focus and DOM
 * identity, not about the network.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getTeam = vi.fn();
const inviteMember = vi.fn();

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual, // ApiError is needed by describeError
    api: { getTeam, inviteMember, revokeInvitation: vi.fn(), changeMemberRole: vi.fn(), removeMember: vi.fn() },
  };
});

vi.mock("@/components/auth/SessionProvider", () => ({
  useSession: () => ({
    session: { business: { id: "b1", name: "Acme" }, role: "owner", org_name: "Acme" },
    status: "authenticated",
    signOut: vi.fn(),
    refresh: vi.fn(),
  }),
  useOptionalSession: () => null,
}));

const { ToastProvider } = await import("@/components/ui/Toast");
const { TeamView } = await import("./TeamView");

function renderTeam() {
  return render(
    <ToastProvider>
      <TeamView />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getTeam.mockResolvedValue({
    members: [
      {
        id: "m1",
        business_id: "b1",
        full_name: "Ada Owner",
        email: "ada@acme.test",
        phone: null,
        role: "owner",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
    invitations: [],
    assignable_roles: ["admin", "staff", "viewer"],
  });
});

describe("TeamView — invite a team member", () => {
  it("keeps focus in the email field for a whole typed address", async () => {
    const user = userEvent.setup();
    renderTeam();

    await user.click(await screen.findByRole("button", { name: /^invite$/i }));

    const email = await screen.findByLabelText(/email/i);
    await user.click(email);
    await user.type(email, "promise@example.com");

    // Value *and* focus. A value-only assertion would have passed while the
    // bug was live — the text was always preserved; focus was what broke.
    expect(email).toHaveValue("promise@example.com");
    expect(document.activeElement).toBe(email);
  });

  it("does not remount the field as the dialog re-renders", async () => {
    // Guards the other half of the original diagnosis. Marking the node lets
    // us distinguish "focus was stolen" from "the element was replaced" —
    // these need different fixes and only one of them was real.
    const user = userEvent.setup();
    renderTeam();

    await user.click(await screen.findByRole("button", { name: /^invite$/i }));
    const email = await screen.findByLabelText(/email/i);
    await user.click(email);

    const before = email;
    await user.type(email, "promise@example.com");

    expect(screen.getByLabelText(/email/i)).toBe(before);
  });

  it("still submits the address it collected", async () => {
    const user = userEvent.setup();
    inviteMember.mockResolvedValue({
      id: "i1",
      email: "promise@example.com",
      role: "staff",
      accept_url: "/accept-invite/abc",
      expires_at: "2026-01-04T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    renderTeam();

    await user.click(await screen.findByRole("button", { name: /^invite$/i }));
    const email = await screen.findByLabelText(/email/i);
    await user.click(email);
    await user.type(email, "promise@example.com");
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() =>
      expect(inviteMember).toHaveBeenCalledWith({
        email: "promise@example.com",
        role: "staff",
      }),
    );
  });
});
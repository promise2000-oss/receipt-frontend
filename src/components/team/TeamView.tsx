"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Mail, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  can,
  canAssignRole,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  type Invitation,
  type Member,
  type Role,
} from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { describeError, useToast } from "@/components/ui/Toast";
import { SelectInput } from "@/components/ui/Field";

/**
 * Team management.
 *
 * Every control here is filtered by role *before* it is rendered, because the
 * server will refuse anything a role cannot do — showing a control that always
 * 403s would be worse than not showing it. The filtering is a courtesy, never
 * a security boundary: `requirePermission` and the rank check in the API are.
 *
 * The `assignable_roles` list comes from the server rather than being computed
 * here, so the UI and the API cannot disagree about who may grant what.
 */
export function TeamView() {
  const session = useSession().session;
  const myRole = session?.role ?? "viewer";

  const [members, setMembers] = useState<Member[] | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [assignable, setAssignable] = useState<Role[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("staff");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  /** The one-time invite link, shown once after a successful send. */
  const [issued, setIssued] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  const toast = useToast();

  const [roleTarget, setRoleTarget] = useState<Member | null>(null);
  const [nextRole, setNextRole] = useState<Role>("staff");
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    try {
      const team = await api.getTeam();
      setMembers(team.members);
      setInvitations(team.invitations);
      setAssignable(team.assignable_roles);
      setLoadError(null);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Couldn't load your team.",
      );
    }
  }

  useEffect(() => {
    // Assigned in a microtask rather than synchronously: calling setState in
    // the effect body triggers a cascading render, and `load` always starts
    // with a network call anyway.
    void Promise.resolve().then(() => load());
  }, []);

  /**
   * Governs the Invite button, and is read from the same matrix the API
   * enforces. `assignable_roles` is the server's own answer and is the
   * primary signal; `can()` is the local mirror, so the control is hidden even
   * before the first team load resolves.
   */
  const canManage =
    can(myRole, "team.invite") &&
    (assignable.length > 0 || members === null);

  async function sendInvite() {
    if (email.trim().length < 3) return;
    setInviteBusy(true);
    setInviteError(null);
    try {
      const invitation = await api.inviteMember({ email, role: inviteRole });
      setIssued(invitation);
      setInviteOpen(false);
      setEmail("");
      await load();
      // Without this the dialog simply closes, and a user who clicks "Send
      // invite" sees nothing happen — so they send a second one.
      toast.success(`Invitation sent to ${invitation.email}.`);
    } catch (caught) {
      // A duplicate email, a full owner quota and an invalid address are three
      // different problems; the server's reason says which.
      setInviteError(describeError(caught, "Couldn't send that invitation."));
    } finally {
      setInviteBusy(false);
    }
  }

  async function revoke(invitation: Invitation) {
    setBusy(true);
    setActionError(null);
    try {
      await api.revokeInvitation(invitation.id);
      await load();
      toast.success(`Invitation to ${invitation.email} revoked.`);
    } catch (caught) {
      setActionError(describeError(caught, "Couldn't revoke that invitation."));
    } finally {
      setBusy(false);
    }
  }

  async function applyRole() {
    if (!roleTarget) return;
    const who = roleTarget.full_name || roleTarget.email || "That member";
    setBusy(true);
    setActionError(null);
    try {
      await api.changeMemberRole(roleTarget.id, nextRole);
      setRoleTarget(null);
      await load();
      // A role change is permission-altering and silently self-validating, so
      // it is confirmed out loud. This also covers the last-owner refusal,
      // which is the message a user is most likely to need to read.
      toast.success(`${who} is now ${nextRole}.`);
    } catch (caught) {
      setActionError(describeError(caught, "Couldn't change that role."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!removeTarget) return;
    const who = removeTarget.full_name || removeTarget.email || "That member";
    setBusy(true);
    setActionError(null);
    try {
      await api.removeMember(removeTarget.id);
      setRemoveTarget(null);
      await load();
      toast.success(`${who} removed from your organization.`);
    } catch (caught) {
      setActionError(describeError(caught, "Couldn't remove that member."));
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <EmptyState
        title="Couldn't load your team"
        description={loadError}
        action={<Users className="h-5 w-5" />}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Team"
        description="Who can see your organization, and what each of them is allowed to do."
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setIssued(null);
                setInviteOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} />
              Invite
            </Button>
          ) : undefined
        }
      />

      {/* ---- Role reference ---- */}
      <Card className="mb-6">
        <CardHeader
          title="What each role can do"
          description="Enforced by the API on every request — these are not just labels."
        />
        <CardBody className="space-y-2.5">
          {ROLES.map((role) => (
            <div key={role} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="w-16 shrink-0 text-sm font-medium text-vg-white">
                {ROLE_LABELS[role]}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-relaxed text-vg-text-muted">
                {ROLE_DESCRIPTIONS[role]}
              </span>
              {myRole === role && (
                <span className="text-[11px] uppercase tracking-[0.16em] text-vg-accent-text">
                  You
                </span>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {actionError && (
        <p role="alert" className="mb-5 flex items-start gap-2 rounded-control border border-vg-error bg-vg-error/12 px-4 py-3 text-sm text-vg-error">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden />
          <span>{actionError}</span>
        </p>
      )}

      {/* ---- The one-time invite link ---- */}
      {issued?.accept_url && (
        <Card className="mb-6">
          <CardHeader
            title="Invitation link — copy it now"
            description="This link is shown once. The server keeps only a hash of the token, so it cannot be shown again."
          />
          <CardBody className="space-y-3">
            <div className="break-all rounded-control border border-vg-border bg-vg-surface-1 px-4 py-3 font-mono text-xs text-vg-white">
              {`${window.location.origin}${issued.accept_url}`}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}${issued.accept_url}`,
                    );
                  } catch {
                    /* clipboard unavailable — the link is visible to copy */
                  }
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2200);
                }}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-vg-success" strokeWidth={2.2} aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                )}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button variant="ghost" onClick={() => setIssued(null)}>
                Done
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---- Pending invitations ---- */}
      {invitations.length > 0 && (
        <Card className="mb-6">
          <CardHeader
            title="Pending invitations"
            description={`${invitations.length} waiting to be accepted.`}
          />
          <CardBody className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-vg-border bg-vg-surface-1 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-vg-white">
                    <Mail className="h-4 w-4 shrink-0 text-vg-text-muted" aria-hidden />
                    <span className="truncate">{invitation.email}</span>
                  </div>
                  <div className="mt-1 text-xs text-vg-text-muted">
                    {ROLE_LABELS[invitation.role]} · expires{" "}
                    {formatDateTime(invitation.expires_at)}
                  </div>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => revoke(invitation)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* ---- Members ---- */}
      <Card>
        <CardHeader
          title="Members"
          description={
            members
              ? `${members.length} ${members.length === 1 ? "person has" : "people have"} access to this organization.`
              : "Loading…"
          }
        />
        <CardBody>
          {members === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-control bg-vg-surface-1" />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => {
                const isSelf = member.id === session?.account_id;
                // Mirrors the server's rank rule so the control is hidden
                // rather than rendered to fail.
                const canEdit =
                  can(myRole, "team.updateRole") &&
                  can(myRole, "team.revoke") &&
                  !isSelf &&
                  canAssignRole(myRole, member.role);

                return (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-vg-border bg-vg-surface-1 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium text-vg-white">
                        {member.full_name}
                        {isSelf && (
                          <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-vg-accent-text">
                            You
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-sm text-vg-text-muted">
                        {member.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-vg-border bg-vg-surface-3 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-vg-text-muted">
                        {ROLE_LABELS[member.role]}
                      </span>
                      {canEdit && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRoleTarget(member);
                              setNextRole(member.role);
                            }}
                          >
                            Change role
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRemoveTarget(member)}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---- Invite ---- */}
      <ConfirmDialog
        open={inviteOpen}
        title="Invite a team member"
        description="They'll join this organization with the role you choose. You can change it later."
        confirmLabel="Send invitation"
        busy={inviteBusy}
        onConfirm={sendInvite}
        onClose={() => {
          if (!inviteBusy) {
            setInviteOpen(false);
            setInviteError(null);
          }
        }}
      >
        <div className="space-y-4">
          <Field label="Email address" required>
            <TextInput
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="colleague@business.com"
              autoComplete="off"
            />
          </Field>

          <div>
            <p className="mb-2.5 text-[13px] font-medium text-vg-white">Role</p>
            <SegmentedControl
              options={ROLES.filter((role) => assignable.includes(role)).map(
                (role) => ({ value: role, label: ROLE_LABELS[role] }),
              )}
              value={inviteRole}
              onChange={setInviteRole}
              ariaLabel="Role for the invited member"
            />
            <p className="mt-2.5 text-xs leading-relaxed text-vg-text-muted">
              {ROLE_DESCRIPTIONS[inviteRole]}
            </p>
          </div>

          {inviteError && (
            <p role="alert" className="flex items-start gap-1.5 text-xs text-vg-error">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{inviteError}</span>
            </p>
          )}
        </div>
      </ConfirmDialog>

      {/* ---- Change role ---- */}
      <ConfirmDialog
        open={roleTarget !== null}
        title={`Change ${roleTarget?.full_name ?? "this member"}'s role`}
        description="This takes effect the next time they load the app."
        confirmLabel="Change role"
        busy={busy}
        onConfirm={applyRole}
        onClose={() => {
          if (!busy) setRoleTarget(null);
        }}
      >
        <div className="space-y-4">
          <SegmentedControl
            options={ROLES.filter((role) => assignable.includes(role)).map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            }))}
            value={nextRole}
            onChange={setNextRole}
            ariaLabel="New role"
          />
          <p className="text-xs leading-relaxed text-vg-text-muted">
            {ROLE_DESCRIPTIONS[nextRole]}
          </p>
        </div>
      </ConfirmDialog>

      {/* ---- Remove ---- */}
      <ConfirmDialog
        open={removeTarget !== null}
        danger
        title={`Remove ${removeTarget?.full_name ?? "this member"}?`}
        description="They lose access immediately. Receipts and invoices they issued keep their name — a member who has issued documents is usually demoted to Viewer instead of removed."
        confirmLabel="Remove member"
        busy={busy}
        onConfirm={remove}
        onClose={() => {
          if (!busy) setRemoveTarget(null);
        }}
      />
    </>
  );
}

/** Kept exported so the settings page can reuse the same control. */
export { SelectInput };
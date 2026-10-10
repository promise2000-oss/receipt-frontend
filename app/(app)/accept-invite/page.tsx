import type { Metadata } from "next";
import { AcceptInvite } from "@/components/team/AcceptInvite";

/**
 * Redeeming an invitation.
 *
 * Public by necessity — the invitee has no account yet, so there is no
 * session to require. The token in the URL *is* the authorisation, it is
 * single-use, and it expires, which is what makes that safe.
 *
 * No token is rendered into the metadata: it must not leak into a referrer,
 * a social preview or a browser history entry a crawler could read.
 */
export const metadata: Metadata = {
  title: "Accept your invitation · VisionaryGene",
  description: "Join a VisionaryGene workspace.",
};

export default async function AcceptInvitePage(
  props: PageProps<"/accept-invite">,
) {
  const params = await props.searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  return <AcceptInvite token={token} />;
}
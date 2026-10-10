import type { Metadata } from "next";
import { canonical } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What VisionaryGene stores, why it is stored, who can see it inside your organization, and how long it is kept.",
  alternates: { canonical: canonical("/privacy") },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy policy"
      description="What we store, who inside your organization can see it, and what we do not do with it."
      intro="VisionaryGene stores business records, so this page is specific about what those records are and who can reach them."
    >
      <LegalSection heading="What we store">
        <p>
          Your account: the name, email address and password hash for everyone
          who can sign in. We store the hash, not the password — your password
          cannot be recovered from what we hold, only replaced.
        </p>
        <p>
          Your business profile: the name, logo, contact details, brand colours,
          currency and document preferences you enter in settings.
        </p>
        <p>
          Your records: the customers, receipts and invoices you create,
          including the line items, totals, payment details and notes you record
          against them.
        </p>
      </LegalSection>

      <LegalSection heading="Who can see your records">
        <p>
          Only people in your organization, and only to the extent their role
          allows. Owners and admins can see everything. Staff can issue receipts
          and record payments but cannot change organization settings. Viewers
          can read and write nothing at all.
        </p>
        <p>
          That separation is enforced on the server for every request, not just
          hidden in the interface. One organization cannot read another&apos;s
          records, customers, documents or files.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not do">
        <p>
          We do not sell your data. We do not use your customers&apos; details
          for advertising. We do not expose receipts or invoices publicly — a
          document shared with a customer is reachable only through an expiring,
          signed link that can be revoked.
        </p>
      </LegalSection>

      <LegalSection heading="Generated documents">
        <p>
          When you export a PDF or an image, it is rendered on the server and
          returned directly to you. Documents carry a faint VisionaryGene
          watermark by default. Your organization can change that text or turn it
          off in settings.
        </p>
      </LegalSection>

      <LegalSection heading="Files you upload">
        <p>
          Logos are stored against your organization and served only to signed
          in members of it, through links that expire. Uploads are checked for
          type, size and dimensions before being stored.
        </p>
      </LegalSection>

      <LegalSection heading="Retention and deletion">
        <p>
          Your records are kept for as long as your workspace exists. Issued
          receipts and invoices are not deleted — they are voided or cancelled
          and retained, so your financial history continues to reconcile.
        </p>
        <p>
          If you delete a customer, the receipts that referenced them are kept;
          only the link is removed. Removing a member of staff who has issued
          documents is refused, because doing so would orphan the financial
          record.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this policy can be sent to us through the contact
          page. If something here is unclear, we would rather you asked.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
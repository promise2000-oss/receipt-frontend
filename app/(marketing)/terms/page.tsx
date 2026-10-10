import type { Metadata } from "next";
import { canonical } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms under which VisionaryGene is provided: what the service does, what you are responsible for, and the limits of what it guarantees.",
  alternates: { canonical: canonical("/terms") },
};

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms of service"
      description="What VisionaryGene provides, what you are responsible for, and the limits of what it guarantees."
      intro="These terms describe what the service does, what we expect of the people using it, and what we can and cannot promise."
    >
      <LegalSection heading="The service">
        <p>
          VisionaryGene provides receipt and invoicing software. It creates
          documents, records payments against invoices, and exports those
          documents as PDF files or images.
        </p>
        <p>
          The service is provided free of charge at present. If paid plans are
          introduced, they will be announced before anything is charged.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You are responsible for the people you give access to your workspace.
          Inviting somebody gives them access to your business records, so
          choose roles deliberately and remove access when it is no longer
          needed.
        </p>
        <p>
          You are responsible for keeping your sign-in details secure. Anyone
          with access to your account can issue documents in your organization&apos;s
          name.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          The business details, customers, receipts, invoices and logos you add
          remain yours. You grant us only the permission needed to operate the
          service for you: to store your records, render your documents and
          return them to you.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>
          Do not use the service to issue fraudulent documents, to impersonate
          another business, or to store content you do not have the right to
          store. Do not attempt to access another organization&apos;s records or
          to circumvent the permissions set on your workspace.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          We aim to keep the service available but do not guarantee
          uninterrupted access. Document rendering and PDF generation depend on
          server capacity, and a busy period can make an export slower than
          usual.
        </p>
        <p>
          We may change or discontinue parts of the service. We will give
          reasonable notice before a change that removes functionality you are
          relying on.
        </p>
      </LegalSection>

      <LegalSection heading="No warranty">
        <p>
          The service is provided as is. We test the arithmetic and the document
          rules it promises, but we cannot warrant that it is error-free or
          uninterrupted. Please check generated documents before issuing them,
          particularly totals and tax treatment, which depend on the
          configuration you enter.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the extent permitted by law, our liability arising from your use
          of the service is limited to the amount you paid for it — which, while
          the service is free, is zero. Nothing here limits liability that
          cannot lawfully be limited.
        </p>
      </LegalSection>

      <LegalSection heading="Your data on our infrastructure">
        <p>
          Your records are held in a database and your documents are rendered on
          demand. Where the deployment configuration uses temporary disk
          storage, uploaded logos and generated files are deleted when the
          server restarts and are regenerated on demand; your stored records are
          not affected.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms can be sent to us through the contact
          page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
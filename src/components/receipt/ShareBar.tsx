"use client";

import { useState } from "react";
import { Check, Copy, Download, Mail, Share2, FileImage } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { WhatsAppIcon } from "@/components/ui/icons";
import { emailUrl, whatsappUrl, type ShareableDocument } from "@/lib/share";
import {
  canShareFiles,
  downloadDocument,
  shareDocument,
  type DocumentKind,
} from "@/lib/export";
import type { Business } from "@/lib/types";

/**
 * Export + share row shown under a document preview.
 *
 * The important change from the previous version: **Download PDF** used to
 * call `window.print()`, which handed the browser's own print dialog the app's
 * preview page. The exported file was therefore whatever the local printer
 * driver produced from CSS print rules — not the branded, watermarked document
 * the product generates. It now downloads the real PDF the API renders.
 *
 * Three actions, each honest about what it did:
 *   - **Download PDF / PNG** — the server-rendered file.
 *   - **Share** — the native share sheet with the file attached where the
 *     device supports it, and the same file downloaded where it does not.
 *   - **WhatsApp / Email / Copy link** — the pre-existing text-message routes,
 *     which carry a verification link rather than an attachment.
 */
export function ShareBar({
  document,
  business,
  shareUrl,
  kind = "receipt",
}: {
  /** The subset a message reads — see `ShareableDocument`. */
  document: ShareableDocument;
  business: Business;
  shareUrl?: string | null;
  kind?: DocumentKind;
}) {
  const [copied, setCopied] = useState(false);
  /** Shown when the clipboard refuses, so the link is still obtainable. */
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "pdf" | "png" | "share">(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const shareSupported = canShareFiles();

  const toast = useToast();

  async function run(
    action: "pdf" | "png" | "share",
    work: () => Promise<{ outcome: "shared" | "downloaded"; fileName: string; error?: string }>,
  ) {
    if (busy) return;
    setBusy(action);
    setFeedback(null);
    try {
      const result = await work();

      if (result.error) {
        // A cancelled share sheet is not a failure to report as success, and
        // a generation failure must never read as one either.
        setFeedback({
          tone: result.error === "Share cancelled." ? "ok" : "error",
          text:
            result.error === "Share cancelled."
              ? "Share cancelled."
              : result.error,
        });
        return;
      }

      setFeedback({
        tone: "ok",
        text:
          result.outcome === "shared"
            ? "Shared."
            : `Downloaded ${result.fileName}. Attach it from your downloads to share it.`,
      });
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // This used to fall through to the same "Copied" confirmation, which is
      // a false success: the clipboard API rejects on a denied permission and
      // on an insecure origin, and the user would then paste whatever was in
      // the clipboard before and send it to a customer. The link is offered
      // instead so the action is still completable.
      setCopied(false);
      toast.failure(
        new Error("Couldn't copy the link. Your browser blocked clipboard access."),
        "Couldn't copy the link.",
      );
      setCopyFallback(shareUrl);
      return;
    }
    setCopied(true);
    setCopyFallback(null);
    setTimeout(() => setCopied(false), 2200);
  }

  const label = kind === "invoice" ? "Invoice" : "Receipt";

  return (
    <div className="no-print space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() =>
            window.open(
              whatsappUrl(document, business, shareUrl),
              "_blank",
              "noopener",
            )
          }
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            (window.location.href = emailUrl(document, business, shareUrl))
          }
        >
          <Mail className="h-4 w-4" strokeWidth={1.9} />
          Email
        </Button>

        <Button
          variant="primary"
          disabled={busy !== null}
          onClick={() =>
            run("pdf", () => downloadDocument(kind, document.id, "pdf"))
          }
        >
          <Download className="h-4 w-4" strokeWidth={2} />
          {busy === "pdf" ? "Preparing…" : "Download PDF"}
        </Button>

        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() =>
            run("png", () => downloadDocument(kind, document.id, "png"))
          }
        >
          <FileImage className="h-4 w-4" strokeWidth={1.9} />
          {busy === "png" ? "Preparing…" : "Download PNG"}
        </Button>

        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() =>
            run("share", () => shareDocument(kind, document.id, "pdf"))
          }
          title={
            shareSupported
              ? "Share this document as a PDF"
              : "Your device can't share files directly — the PDF will download instead"
          }
        >
          <Share2 className="h-4 w-4" strokeWidth={1.9} />
          {busy === "share" ? "Preparing…" : "Share"}
        </Button>

        <Button variant="ghost" onClick={copyLink} disabled={!shareUrl}>
          {copied ? (
            <Check className="h-4 w-4 text-vg-success" strokeWidth={2.2} aria-hidden />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.9} aria-hidden />
          )}
          {copied ? "Link copied" : "Copy link"}
        </Button>
      </div>

      {/*
        `role="status"` so the result is announced rather than only appearing
        visually — and an error only ever appears when something genuinely
        failed.
      */}
      <p
        role="status"
        aria-live="polite"
        className={
          feedback === null
            ? "sr-only"
            : feedback.tone === "ok"
              ? "text-[13px] text-vg-text-muted"
              : "rounded-control border border-vg-error bg-vg-error/12 px-3 py-2 text-[13px] text-vg-error"
        }
      >
        {feedback?.text ?? ""}
      </p>

      {/*
        The clipboard can be refused (denied permission, insecure origin), and
        that is not recoverable by retrying. The link is shown in full so the
        user can still select and copy it by hand rather than being told to
        try again at a button that will keep failing.
      */}
      {copyFallback && (
        <div className="rounded-control border border-vg-border bg-vg-surface-2 p-3">
          <label htmlFor="share-link-fallback" className="block text-[13px] font-medium text-vg-white">
            Share this link
          </label>
          <input
            id="share-link-fallback"
            readOnly
            value={copyFallback}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 w-full rounded-control border border-vg-border bg-vg-surface-1 px-3 py-2 font-mono text-xs text-vg-text-muted"
          />
        </div>
      )}

      {!shareSupported && (
        <p className="text-xs text-vg-text-muted">
          This device can&apos;t share files directly. Choosing Share downloads the{" "}
          {label.toLowerCase()} instead — attach it from your downloads folder, your
          email app, or WhatsApp.
        </p>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Ban, CopyPlus } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Receipt } from "@/lib/types";
import { useSession } from "@/components/auth/SessionProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextArea } from "@/components/ui/Field";
import { ReceiptPreviewSkeleton } from "@/components/ui/Skeleton";
import { ReceiptDocument } from "./ReceiptDocument";
import { ShareBar } from "./ShareBar";
import { receiptAsShareable } from "@/lib/share";
import { describeError, useToast } from "@/components/ui/Toast";

/**
 * Receipt preview — mirrors the PDF, with share actions directly below.
 */
export function ReceiptPreview({ id }: { id: string }) {
  const router = useRouter();
  /**
   * The issuer's identity — the same object the header, sidebar and titles
   * use, so there is one organization record in play rather than one fetch
   * per screen. It is only ever this session's organization: the receipt id
   * is loaded separately and the API refuses to hand back another tenant's.
   */
  const business = useSession().session?.business;
  /** undefined = loading · null = not found */
  const [receipt, setReceipt] = useState<Receipt | null | undefined>(undefined);
  /** undefined = loading · null = no public links for this receipt */
  const [share, setShare] = useState<
    { url: string; verify_url: string } | null | undefined
  >(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [voidOpen, setVoidOpen] = useState(false);
  const [voidNote, setVoidNote] = useState("");
  const [voidBusy, setVoidBusy] = useState(false);
  const [noteTouched, setNoteTouched] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await api.getReceipt(id);
        if (cancelled) return;
        // Links are minted per receipt; if this fails we only lose the QR.
        const links = found
          ? await api.getShareLinks(found.id).catch(() => null)
          : null;
        if (cancelled) return;
        setReceipt(found);
        setShare(links);
      } catch (caught) {
        if (cancelled) return;
        setLoadError(
          caught instanceof Error
            ? caught.message
            : "Something went wrong while loading this receipt.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadError) {
    return (
      <EmptyState
        title="Couldn't load this receipt"
        description={loadError}
        action={
          <ButtonLink href="/receipts" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to receipts
          </ButtonLink>
        }
      />
    );
  }

  if (receipt === undefined || !business || share === undefined)
    return <ReceiptPreviewSkeleton />;

  if (receipt === null) {
    return (
      <EmptyState
        title="Receipt not found"
        description={`We couldn't find a receipt with the reference “${id}”. It may have been issued on another account.`}
        action={
          <ButtonLink href="/receipts" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to receipts
          </ButtonLink>
        }
      />
    );
  }

  const isVoid = receipt.status === "void";
  const noteTooShort = voidNote.trim().length < 3;

  async function confirmVoid() {
    setNoteTouched(true);
    if (noteTooShort || voidBusy) return;
    setVoidBusy(true);
    setVoidError(null);
    try {
      const updated = await api.voidReceipt(receipt!.id, voidNote.trim());
      if (updated) {
        setReceipt(updated);
        setVoidOpen(false);
        setVoidNote("");
        setNoteTouched(false);
        // Voiding is a financial correction and the dialog just closes, so
        // confirm it out loud — and say the original is kept, because the fear
        // behind voiding is usually "will this delete my record".
        toast.success(`Receipt ${updated.receipt_number} voided. It stays in your records.`);
      } else {
        setVoidError("That receipt is already voided, or it no longer exists.");
      }
    } catch (caught) {
      setVoidError(describeError(caught, "Couldn't void this receipt."));
    } finally {
      setVoidBusy(false);
    }
  }

  return (
    <>
      {/* ---- Actions row ---- */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/receipts"
          className="inline-flex items-center gap-2 text-sm text-vg-text-muted transition-colors hover:text-vg-accent-text"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          All receipts
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/receipts/new?duplicate=${receipt!.receipt_number}`)
            }
          >
            <CopyPlus className="h-4 w-4" strokeWidth={1.9} aria-hidden />
            Duplicate
          </Button>
          {!isVoid && (
            <Button variant="danger" size="sm" onClick={() => setVoidOpen(true)}>
              <Ban className="h-4 w-4" strokeWidth={1.9} aria-hidden />
              Void receipt
            </Button>
          )}
        </div>
      </div>

      {/* ---- Title ---- */}
      <div className="no-print mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-vg-white">
          Receipt {receipt.receipt_number}
        </h1>
        <p className="mt-1.5 text-sm text-vg-text-muted">
          Issued {formatDateTime(receipt.issue_date)} · {receipt.customer_name}
        </p>
      </div>

      {/* ---- Void notice ---- */}
      {isVoid && (
        <div className="no-print mb-5 flex items-start gap-3 rounded-card border border-vg-red-900 bg-vg-red-900/12 px-5 py-4">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-vg-white" strokeWidth={2} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-vg-white">
              This receipt has been voided
            </p>
            {receipt.void_note && (
              <p className="mt-1 text-sm leading-relaxed text-vg-text-muted">
                “{receipt.void_note}”
              </p>
            )}
            {receipt.voided_at && (
              <p className="mt-1.5 text-xs text-vg-text-muted">
                Voided {formatDateTime(receipt.voided_at)} · issue a replacement with
                Duplicate.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---- The document + share row ---- */}
      <div className="mx-auto w-full max-w-3xl">
        <ReceiptDocument
          receipt={receipt}
          business={business}
          verifyUrl={share?.verify_url ?? null}
        />
        <div className="mt-5">
          <ShareBar
            document={receiptAsShareable(receipt)}
            business={business}
            shareUrl={share?.url ?? null}
          />
        </div>
      </div>

      {/* ---- Void confirmation ---- */}
      <ConfirmDialog
        open={voidOpen}
        danger
        title="Void this receipt?"
        description="Voiding can't be undone. The receipt stays in your history — struck through — and the audit note explains why. To correct a sale, void then reissue."
        confirmLabel="Void receipt"
        busy={voidBusy}
        onConfirm={confirmVoid}
        onClose={() => {
          if (!voidBusy) {
            setVoidOpen(false);
            setNoteTouched(false);
            setVoidError(null);
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-vg-white">
            Reason (required)
          </span>
          <TextArea
            value={voidNote}
            onChange={(event) => setVoidNote(event.target.value)}
            placeholder="e.g. Wrong amount — reissued as ES-000215"
            className="min-h-20"
          />
        </label>
        {voidError && (
          <p
            role="alert"
            className="mt-2 flex items-start gap-1.5 rounded-control border border-vg-error bg-vg-error/12 px-3 py-2 text-xs text-vg-error"
          >
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{voidError}</span>
          </p>
        )}
        {noteTouched && noteTooShort && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-vg-error">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Add a short audit note (at least a few words).</span>
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

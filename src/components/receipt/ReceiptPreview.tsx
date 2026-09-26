"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CopyPlus } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Business, Receipt } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextArea } from "@/components/ui/Field";
import { ReceiptPreviewSkeleton } from "@/components/ui/Skeleton";
import { ReceiptDocument } from "./ReceiptDocument";
import { ShareBar } from "./ShareBar";

/**
 * Receipt preview — mirrors the PDF, with share actions directly below.
 */
export function ReceiptPreview({ id }: { id: string }) {
  const router = useRouter();
  /** undefined = loading · null = not found */
  const [receipt, setReceipt] = useState<Receipt | null | undefined>(undefined);
  const [business, setBusiness] = useState<Business | null>(null);

  const [voidOpen, setVoidOpen] = useState(false);
  const [voidNote, setVoidNote] = useState("");
  const [voidBusy, setVoidBusy] = useState(false);
  const [noteTouched, setNoteTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getReceipt(id), api.getBusiness()]).then(
      ([found, profile]) => {
        if (cancelled) return;
        setReceipt(found);
        setBusiness(profile);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (receipt === undefined || !business) return <ReceiptPreviewSkeleton />;

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
    const updated = await api.voidReceipt(receipt!.id, voidNote.trim());
    setVoidBusy(false);
    if (updated) {
      setReceipt(updated);
      setVoidOpen(false);
      setVoidNote("");
      setNoteTouched(false);
    }
  }

  return (
    <>
      {/* ---- Actions row ---- */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/receipts"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
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
            <CopyPlus className="h-4 w-4" strokeWidth={1.9} />
            Duplicate
          </Button>
          {!isVoid && (
            <Button variant="danger" size="sm" onClick={() => setVoidOpen(true)}>
              <Ban className="h-4 w-4" strokeWidth={1.9} />
              Void receipt
            </Button>
          )}
        </div>
      </div>

      {/* ---- Title ---- */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Receipt {receipt.receipt_number}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Issued {formatDateTime(receipt.issue_date)} · {receipt.customer_name}
        </p>
      </div>

      {/* ---- Void notice ---- */}
      {isVoid && (
        <div className="no-print mb-5 rounded-card border border-muted/35 bg-muted/10 px-5 py-4">
          <p className="text-sm font-medium text-ink">This receipt has been voided</p>
          {receipt.void_note && (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              “{receipt.void_note}”
            </p>
          )}
          {receipt.voided_at && (
            <p className="mt-1.5 text-xs text-muted">
              Voided {formatDateTime(receipt.voided_at)} · issue a replacement with
              Duplicate.
            </p>
          )}
        </div>
      )}

      {/* ---- The document + share row ---- */}
      <div className="mx-auto w-full max-w-3xl">
        <ReceiptDocument receipt={receipt} business={business} />
        <div className="mt-5">
          <ShareBar receipt={receipt} business={business} />
        </div>
      </div>

      {/* ---- Void confirmation ---- */}
      <ConfirmDialog
        open={voidOpen}
        title="Void this receipt?"
        description="Voiding can't be undone. The receipt stays in your history — struck through — and the audit note explains why. To correct a sale, void then reissue."
        confirmLabel="Void receipt"
        busy={voidBusy}
        onConfirm={confirmVoid}
        onClose={() => {
          if (!voidBusy) {
            setVoidOpen(false);
            setNoteTouched(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">
            Reason (required)
          </span>
          <TextArea
            value={voidNote}
            onChange={(event) => setVoidNote(event.target.value)}
            placeholder="e.g. Wrong amount — reissued as ES-000215"
            className="min-h-20"
          />
        </label>
        {noteTouched && noteTooShort && (
          <p className="mt-1.5 text-xs text-gold-deep">
            Add a short audit note (at least a few words).
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

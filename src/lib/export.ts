/**
 * Document export and sharing.
 *
 * The old "Download PDF" button called `window.print()`, which re-renders the
 * *app's* preview page through the browser's printer driver — so the exported
 * file was whatever the user's local printer dialog happened to produce, and
 * the watermark, the true page size and the multi-page behaviour all came from
 * CSS print rules rather than from the document the product actually produces.
 *
 * Everything here goes through the API instead:
 *
 *  - the server renders the same HTML into a real PDF (and a PNG);
 *  - the browser receives those bytes as a `File`;
 *  - `navigator.share` hands them to WhatsApp, Mail, Drive or anything else
 *    the device has, where file sharing is supported;
 *  - everywhere else, the identical file is downloaded and the user is told
 *    plainly what happened rather than being shown a success that did not.
 */

export type DocumentKind = "receipt" | "invoice";
export type ExportFormat = "pdf" | "png";

export interface ExportResult {
  /** What actually happened, so the UI can describe it honestly. */
  outcome: "shared" | "downloaded";
  fileName: string;
  /** Populated when the file could not be produced at all. */
  error?: string;
}

/**
 * Pull a document out of the API as bytes.
 *
 * Fetches the blob rather than navigating to the URL on purpose: a
 * `window.open` / `<a download>` on a cross-typed response is at the mercy of
 * the browser's content-disposition handling, and it gives us nothing to hand
 * to the share sheet. Going through `fetch` means the same code path produces
 * the bytes whether we are going to share them or download them.
 */
export async function fetchDocument(
  kind: DocumentKind,
  id: string,
  format: ExportFormat,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch(`/api/${kind === "receipt" ? "receipts" : "invoices"}/${encodeURIComponent(
    id,
  )}/${format}`, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    throw new Error(
      `The ${format.toUpperCase()} could not be generated (${response.status}). Please try again.`,
    );
  }

  const blob = await response.blob();
  // Prefer the server's filename — it is built from the document number, so it
  // is already safe and descriptive. Fall back to the same pattern locally if
  // the header is missing.
  const fromHeader = fileNameFromDisposition(response.headers.get("Content-Disposition"));
  return {
    blob,
    fileName: fromHeader ?? defaultFileName(kind, id, format),
  };
}

/** `attachment; filename="x.pdf"` → `x.pdf` */
export function fileNameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      /* fall through to the plain form */
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || null;
}

/**
 * `visionarygene-invoice-INV-000123.pdf`
 *
 * Namespaced by document, never by organization: the number is already unique
 * per tenant, and putting a business name in a filename would leak another
 * organization's identity into a file that gets emailed and forwarded.
 */
export function defaultFileName(
  kind: DocumentKind,
  reference: string,
  format: ExportFormat,
): string {
  const safe = reference.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  return `visionarygene-${kind}-${safe}.${format}`;
}

/**
 * Whether this device can share a *file* (not just a link).
 *
 * Two separate capabilities, both required: the Web Share API existing, and
 * `canShare` accepting a file. Chrome on desktop exposes `navigator.share` but
 * frequently cannot take files, so checking for the function alone would
 * promise sharing and then fail — exactly the "success message for a failed
 * share" the product must not produce.
 */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([""], "probe", { type: "text/plain" })] });
  } catch {
    return false;
  }
}

/** Trigger a plain download for a file we already hold in memory. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in some browsers; a short
  // delay is the standard workaround and costs nothing.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** The MIME type the browser should report for the share sheet. */
function mimeFor(format: ExportFormat): string {
  return format === "pdf" ? "application/pdf" : "image/png";
}

/**
 * Share a document, falling back to a download.
 *
 * The fallback is not an error path — on any device without file sharing the
 * user still gets the file, and `outcome` tells the caller which happened so
 * the message can say so honestly.
 */
export async function shareDocument(
  kind: DocumentKind,
  id: string,
  format: ExportFormat,
): Promise<ExportResult> {
  let blob: Blob;
  let fileName: string;

  try {
    ({ blob, fileName } = await fetchDocument(kind, id, format));
  } catch (caught) {
    return {
      outcome: "downloaded",
      fileName: defaultFileName(kind, id, format),
      error: caught instanceof Error ? caught.message : "The document could not be generated.",
    };
  }

  if (canShareFiles()) {
    const file = new File([blob], fileName, { type: mimeFor(format) });
    try {
      await navigator.share({
        files: [file],
        title: `${kind === "receipt" ? "Receipt" : "Invoice"} ${id}`,
      });
      return { outcome: "shared", fileName };
    } catch (caught) {
      // A user dismissing the share sheet is a cancellation, not a failure —
      // and must not be reported as one.
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return { outcome: "downloaded", fileName, error: "Share cancelled." };
      }
      // Anything else (permission denied, format unsupported) falls through
      // to the download so the user still ends up with their document.
    }
  }

  downloadBlob(blob, fileName);
  return { outcome: "downloaded", fileName };
}

/** Download without attempting to share — the plain "Download PDF" button. */
export async function downloadDocument(
  kind: DocumentKind,
  id: string,
  format: ExportFormat,
): Promise<ExportResult> {
  try {
    const { blob, fileName } = await fetchDocument(kind, id, format);
    downloadBlob(blob, fileName);
    return { outcome: "downloaded", fileName };
  } catch (caught) {
    return {
      outcome: "downloaded",
      fileName: defaultFileName(kind, id, format),
      error: caught instanceof Error ? caught.message : "The document could not be generated.",
    };
  }
}
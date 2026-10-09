import { QRCodeSVG } from "qrcode.react";
import { formatDate, formatDateTime, formatMoney, formatQuantity } from "@/lib/format";
import { initials, onColor, safeAccent } from "@/lib/brand";
import type { Business, Receipt } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Mix a brand colour with transparency (document uses dynamic brand hexes). */
const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** See the note where they are used: a QR code's contrast is format-fixed. */
const QR_BG = "#ffffff";
const QR_FG = "#000000";

interface ReceiptDocumentProps {
  receipt: Receipt;
  business: Business;
  /**
   * Non-expiring verification URL — this is what the QR code encodes, so a
   * scan keeps working long after an expiring share link would have died.
   * Omit the QR block entirely when it is unavailable.
   */
  verifyUrl?: string | null;
  className?: string;
}

/**
 * The on-screen receipt — mirrors the final PDF template exactly:
 * brand header band, paper body, itemized table, accent total, QR verify.
 * Colours come from the business record so Settings pickers flow through.
 *
 * The document deliberately stays a *light paper object* even though the app
 * around it is dark. Two reasons: an organization's logo and header band are
 * designed for white, and a dark preview would stop predicting what the
 * printout actually looks like. What changes on dark is the surface the paper
 * sits on — a raised panel that frames it.
 *
 * Physical output is not this component's problem: `@media print` in
 * `globals.css` flattens the bands and tints to black on white with brand red
 * kept for the rules and the total, while the QR stays pure black on white so
 * it scans.
 */
export function ReceiptDocument({
  receipt,
  business,
  verifyUrl,
  className,
}: ReceiptDocumentProps) {
  /**
   * Brand colours as the receipt actually renders them.
   *
   * `primary` is left exactly as the organization set it — the band keeps
   * their colour. What adapts is the text *on* it (`onPrimary`) and the
   * accent (`safeAccent`), because Settings lets people type arbitrary hex
   * and an accent that happens to sit at 3.9:1 on the band would quietly
   * produce unreadable column headers. Deriving a pair from a logo goes
   * through the same functions, so the guarantee holds either way.
   */
  const primary = business.brand_primary;
  const accent = safeAccent(business.brand_accent, primary);
  const onPrimary = onColor(primary);
  const currency = business.currency;
  const isVoid = receipt.status === "void";

  return (
    <div
      className={cn(
        "receipt-frame rounded-card border border-vg-border bg-vg-surface-2 p-4 sm:p-8",
        className,
      )}
    >
      <article
        className="receipt-document relative mx-auto max-w-[720px] overflow-hidden rounded-card border bg-vg-paper-bg"
        style={{ borderColor: tint(accent, 35) }}
      >
      {/* ---------- Brand header band ---------- */}
      <header
        className="doc-band flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6"
        style={{ backgroundColor: primary }}
      >
        <div className="flex items-center gap-3.5">
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logo_url}
              alt={`${business.name} logo`}
              className="h-11 w-11 rounded-[10px] border bg-white/95 object-contain p-1"
              style={{
                // Neutral plate so a transparent logo still reads, with a
                // rim that follows the band text — otherwise a pale primary
                // would swallow the plate entirely.
                borderColor: `color-mix(in srgb, ${onPrimary} 28%, transparent)`,
              }}
            />
          ) : (
            <span
              className="grid h-11 w-11 place-items-center rounded-[10px] border text-2xl leading-none"
              style={{ borderColor: tint(accent, 70), color: accent }}
              aria-hidden
            >
              {initials(business.name)}
            </span>
          )}
          <div>
            <div
              className="text-[15px] uppercase leading-none tracking-[0.2em] sm:text-base"
              style={{ color: onPrimary }}
            >
              {business.name}
            </div>
            <div
              className="mt-2 text-[9.5px] font-medium uppercase tracking-[0.32em]"
              style={{ color: accent }}
            >
              Receipt
            </div>
          </div>
        </div>

        <div className="text-right">
          <div
            className="text-[9.5px] font-medium uppercase tracking-[0.28em]"
            style={{ color: accent }}
          >
            Receipt No.
          </div>
          <div
            className="mt-1.5 text-lg tracking-[0.08em]"
            style={{ color: onPrimary }}
          >
            {receipt.receipt_number}
          </div>
        </div>
      </header>

      {/* ---------- Meta strip ---------- */}
      <div
        className="doc-meta flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b px-5 py-4 sm:px-8"
        style={{ borderColor: tint(accent, 22), backgroundColor: tint(accent, 6) }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-vg-paper-muted">Issued</div>
          <div className="mt-1 text-sm text-vg-paper-ink">{formatDateTime(receipt.issue_date)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-vg-paper-muted">
            Payment Method
          </div>
          <div className="mt-1 text-sm capitalize text-vg-paper-ink">{receipt.payment_method}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-vg-paper-muted">Status</div>
          <div className="mt-1 text-sm capitalize text-vg-paper-ink">
            {isVoid ? "Voided" : receipt.payment_status}
          </div>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="px-5 py-6 sm:px-8 sm:py-7">
        {/* Billed to / From */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-vg-paper-muted">
              Billed To
            </div>
            <div className="mt-2 text-[15px] font-medium text-vg-paper-ink">
              {receipt.customer_name}
            </div>
            {receipt.customer_phone && (
              <div className="mt-1 text-sm text-vg-paper-muted">{receipt.customer_phone}</div>
            )}
            {receipt.customer_email && (
              <div className="text-sm text-vg-paper-muted">{receipt.customer_email}</div>
            )}
          </div>
          <div className="sm:text-right">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-vg-paper-muted">
              From
            </div>
            <div className="mt-2 text-[15px] font-medium text-vg-paper-ink">{business.name}</div>
            <div className="mt-1 text-sm text-vg-paper-muted">{business.address}</div>
            <div className="text-sm text-vg-paper-muted">
              {business.phone} · {business.email}
            </div>
          </div>
        </div>

        {/* Itemized table */}
        <div
          className="mt-6 overflow-hidden rounded-[10px] border"
          style={{ borderColor: tint(accent, 25) }}
        >
          <table className="w-full border-collapse text-sm">
            <thead className="doc-table-head" style={{ backgroundColor: primary }}>
              <tr>
                <th
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: accent }}
                >
                  Description
                </th>
                <th
                  className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: accent }}
                >
                  Qty
                </th>
                <th
                  className="hidden px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.16em] sm:table-cell"
                  style={{ color: accent }}
                >
                  Unit Price
                </th>
                <th
                  className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: accent }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                  style={{ borderColor: tint(accent, 15) }}
                >
                  <td className="px-4 py-3.5 text-vg-paper-ink">
                    {item.description}
                    <span className="mt-0.5 block text-xs text-vg-paper-muted sm:hidden">
                      {formatMoney(item.unit_price, currency)} each
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-vg-paper-muted">
                    {formatQuantity(item.quantity)}
                  </td>
                  <td className="hidden px-3 py-3.5 text-right tabular-nums text-vg-paper-muted sm:table-cell">
                    {formatMoney(item.unit_price, currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium tabular-nums text-vg-paper-ink">
                    {formatMoney(item.line_total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-sm space-y-2.5 text-sm">
            <div className="flex justify-between text-vg-paper-muted">
              <dt>Subtotal</dt>
              <dd className="tabular-nums text-vg-paper-ink">
                {formatMoney(receipt.subtotal, currency)}
              </dd>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-vg-paper-muted">
                <dt>Discount</dt>
                <dd className="tabular-nums" style={{ color: tint(primary, 70) }}>
                  − {formatMoney(receipt.discount, currency)}
                </dd>
              </div>
            )}
            {/*
              Receipts are immutable, so one issued while tax applied still has
              to reconcile on paper — otherwise the printed total does not add
              up from the lines above it. New receipts carry tax = 0 and this
              row never appears; there is no control in the form to set it.
            */}
            {receipt.tax > 0 && (
              <div className="flex justify-between text-vg-paper-muted">
                <dt>
                  Tax{receipt.tax_rate > 0 ? ` (${receipt.tax_rate}%)` : ""}
                </dt>
                <dd className="tabular-nums text-vg-paper-ink">
                  {formatMoney(receipt.tax, currency)}
                </dd>
              </div>
            )}
            <div className="h-px w-full" style={{ backgroundColor: tint(accent, 40) }} />
            <div
              className="doc-total flex items-center justify-between rounded-[10px] px-4 py-3"
              style={{ backgroundColor: accent }}
            >
              <dt
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: primary }}
              >
                Total
              </dt>
              <dd
                className="text-2xl font-bold tabular-nums sm:text-3xl"
                style={{ color: primary }}
              >
                {formatMoney(receipt.total, currency)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Verification + notes */}
        <div className="mt-7 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
          {verifyUrl ? (
            <figure
              className="doc-qr m-0 inline-flex w-fit items-center gap-3 rounded-[10px] border bg-vg-paper-bg p-3"
              style={{ borderColor: tint(accent, 30) }}
            >
              {/*
                Pure black on pure white, four modules of quiet zone, no logo
                overlaid — every one of those is what keeps a code scannable
                from a laser-printed sheet. Brand colour is not worth a code
                that will not read.

                These two literals are the deliberate exception to "no hex
                outside globals.css". A QR is a machine-readable code, not a
                design surface: the format fixes its contrast, so tinting it
                with a brand token would be a regression, not theming.
              */}
              <QRCodeSVG
                value={verifyUrl}
                size={96}
                marginSize={3}
                bgColor={QR_BG}
                fgColor={QR_FG}
                level="M"
              />
              <figcaption className="max-w-[200px]">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-vg-paper-muted">
                  Scan to verify
                </div>
                <div className="mt-1 break-all text-[11px] leading-snug text-vg-paper-ink">
                  {verifyUrl}
                </div>
              </figcaption>
            </figure>
          ) : null}

          {receipt.notes && (
            <div
              className="rounded-[10px] border px-4 py-3.5"
              style={{ borderColor: tint(accent, 20), backgroundColor: tint(accent, 5) }}
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-vg-paper-muted">
                Notes
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-vg-paper-ink">{receipt.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="doc-footer mt-7 border-t pt-5 text-center"
          style={{ borderColor: tint(accent, 25) }}
        >
          <p className="text-[15px] text-vg-paper-ink">
            Thank you for your business
          </p>
          <p className="mt-1.5 text-xs text-vg-paper-muted">
            {business.name}
            {business.address ? ` · ${business.address}` : ""}
            {business.phone ? ` · ${business.phone}` : ""}
            {business.email ? ` · ${business.email}` : ""}
            {business.website ? ` · ${business.website}` : ""}
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-vg-paper-muted">
            {formatDate(receipt.issue_date)} · Powered by VisionaryGene
          </p>
        </div>
      </div>

      {/* ---------- Void watermark ---------- */}
      {isVoid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center"
        >
          <span
            className="-rotate-[18deg] text-[clamp(3rem,14vw,7rem)] uppercase tracking-[0.24em]"
            style={{ color: tint(primary, 12) }}
          >
            Void
          </span>
        </div>
      )}
      </article>
    </div>
  );
}

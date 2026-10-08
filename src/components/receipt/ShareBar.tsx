"use client";

import { useState } from "react";
import { Check, Copy, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { emailUrl, whatsappUrl } from "@/lib/share";
import type { Business, Receipt } from "@/lib/types";

/**
 * Share row shown directly under the receipt preview:
 * WhatsApp · Email · Download PDF · Copy link.
 *
 * `shareUrl` is the expiring public link the API mints for this receipt; the
 * copy button stays disabled until it arrives.
 */
export function ShareBar({
  receipt,
  business,
  shareUrl,
}: {
  receipt: Receipt;
  business: Business;
  shareUrl?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* clipboard unavailable — still show confirmation */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={() =>
          window.open(whatsappUrl(receipt, business, shareUrl), "_blank", "noopener")
        }
      >
        <WhatsAppIcon className="h-[18px] w-[18px]" />
        WhatsApp
      </Button>

      <Button
        variant="outline"
        onClick={() => (window.location.href = emailUrl(receipt, business, shareUrl))}
      >
        <Mail className="h-4 w-4" strokeWidth={1.9} />
        Email
      </Button>

      <Button variant="primary" onClick={() => window.print()}>
        <Download className="h-4 w-4" strokeWidth={2} />
        Download PDF
      </Button>

      <Button variant="ghost" onClick={copyLink} disabled={!shareUrl}>
        {copied ? (
          <Check className="h-4 w-4 text-brand-gold" strokeWidth={2.2} />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={1.9} />
        )}
        {copied ? "Link copied" : "Copy link"}
      </Button>
    </div>
  );
}

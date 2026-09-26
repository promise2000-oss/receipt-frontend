"use client";

import { useState } from "react";
import { Check, Copy, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { emailUrl, receiptShareUrl, whatsappUrl } from "@/lib/share";
import type { Business, Receipt } from "@/lib/types";

/**
 * Share row shown directly under the receipt preview:
 * WhatsApp · Email · Download PDF · Copy link.
 */
export function ShareBar({ receipt, business }: { receipt: Receipt; business: Business }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = receiptShareUrl(receipt);
    try {
      await navigator.clipboard.writeText(url);
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
        onClick={() => window.open(whatsappUrl(receipt, business), "_blank", "noopener")}
      >
        <WhatsAppIcon className="h-[18px] w-[18px]" />
        WhatsApp
      </Button>

      <Button variant="outline" onClick={() => (window.location.href = emailUrl(receipt, business))}>
        <Mail className="h-4 w-4" strokeWidth={1.9} />
        Email
      </Button>

      <Button variant="primary" onClick={() => window.print()}>
        <Download className="h-4 w-4" strokeWidth={2} />
        Download PDF
      </Button>

      <Button variant="ghost" onClick={copyLink}>
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

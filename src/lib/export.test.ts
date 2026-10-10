import { describe, expect, it } from "vitest";
import {
  canShareFiles,
  defaultFileName,
  documentExportUrl,
  fileNameFromDisposition,
} from "./export";
import { invoiceAsShareable, receiptAsShareable } from "./share";

/**
 * Export and share plumbing.
 *
 * The properties worth pinning are the ones a browser decides for us:
 * filename parsing (the server sets `Content-Disposition`, and a bad parse
 * means a user saves a file called "download"), the shape of a generated
 * filename, and the share-projection that lets one component serve both
 * receipts and invoices.
 *
 * `canShareFiles` is tested through a stubbed `navigator` because the real
 * behaviour is entirely about *which* browsers implement which half of the
 * Web Share API — and the failure mode (promise sharing, then fail) is worse
 * than not offering it at all.
 */

describe("fileNameFromDisposition", () => {
  it("reads a quoted filename", () => {
    expect(
      fileNameFromDisposition('attachment; filename="visionarygene-invoice-INV-000123.pdf"'),
    ).toBe("visionarygene-invoice-INV-000123.pdf");
  });

  it("reads an unquoted filename", () => {
    expect(fileNameFromDisposition("attachment; filename=receipt.pdf")).toBe("receipt.pdf");
  });

  it("prefers the RFC 5987 UTF-8 form when present", () => {
    expect(
      fileNameFromDisposition(
        "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''caf%C3%A9.pdf",
      ),
    ).toBe("café.pdf");
  });

  it("returns null when the header is absent", () => {
    expect(fileNameFromDisposition(null)).toBeNull();
    expect(fileNameFromDisposition("attachment")).toBeNull();
  });

  it("never throws on a malformed header", () => {
    expect(() => fileNameFromDisposition(";;;===")).not.toThrow();
  });
});

describe("defaultFileName", () => {
  it("follows the documented pattern", () => {
    expect(defaultFileName("invoice", "INV-000123", "pdf")).toBe(
      "visionarygene-invoice-INV-000123.pdf",
    );
    expect(defaultFileName("receipt", "ES-000123", "png")).toBe(
      "visionarygene-receipt-ES-000123.png",
    );
  });

  it("strips characters that would break a header or a filesystem", () => {
    expect(defaultFileName("invoice", 'a"b/c\\d', "pdf")).toBe(
      "visionarygene-invoice-a_b_c_d.pdf",
    );
  });

  it("caps the reference so the filename cannot grow unbounded", () => {
    const name = defaultFileName("receipt", "x".repeat(200), "pdf");
    expect(name.length).toBeLessThan(100);
  });

  it("namespaces by document, never by organization", () => {
    // The number is already unique per tenant, so no business name is needed
    // — and including one would leak another tenant's identity into a file
    // the user forwards.
    expect(defaultFileName("invoice", "INV-000001", "pdf")).not.toContain("Acme");
  });
});

describe("documentExportUrl", () => {
  /**
   * Regression guard for a shipped bug.
   *
   * The URL used to interpolate the format directly, so PNG requested
   * `/api/receipts/:id/png` while the API serves `/image` — a 404 for PNG
   * that never showed up for PDF, whose segment happens to match. Every
   * combination is asserted here so the two vocabularies cannot drift again.
   */
  it("maps every kind/format pair to the route the API actually defines", () => {
    expect(documentExportUrl("receipt", "abc", "pdf")).toBe("/api/receipts/abc/pdf");
    expect(documentExportUrl("receipt", "abc", "png")).toBe("/api/receipts/abc/image");
    expect(documentExportUrl("invoice", "abc", "pdf")).toBe("/api/invoices/abc/pdf");
    expect(documentExportUrl("invoice", "abc", "png")).toBe("/api/invoices/abc/image");
  });

  it("never asks for a bare `/:id/png`, which is not a route", () => {
    // The exact shape that 404'd in production.
    expect(documentExportUrl("receipt", "abc", "png")).not.toContain("/png");
  });

  it("encodes the id so a hostile value cannot escape the path", () => {
    expect(documentExportUrl("receipt", "../../admin", "pdf")).toBe(
      "/api/receipts/..%2F..%2Fadmin/pdf",
    );
    expect(documentExportUrl("invoice", "a b", "png")).toBe("/api/invoices/a%20b/image");
  });

  it("covers all four combinations, so a new kind cannot be half-wired", () => {
    const kinds = ["receipt", "invoice"] as const;
    const formats = ["pdf", "png"] as const;
    for (const kind of kinds) {
      for (const format of formats) {
        expect(documentExportUrl(kind, "id", format)).toMatch(
          /^\/api\/(receipts|invoices)\/id\/(pdf|image)$/,
        );
      }
    }
  });
});

describe("canShareFiles", () => {
  const original = globalThis.navigator;

  function stub(value: Partial<Navigator>): void {
    Object.defineProperty(globalThis, "navigator", {
      value,
      configurable: true,
      writable: true,
    });
  }

  it("is false when the Web Share API is absent", () => {
    stub({} as Navigator);
    expect(canShareFiles()).toBe(false);
  });

  it("is false when share exists but cannot take files", () => {
    // Chrome on desktop: `navigator.share` is present, `canShare` rejects
    // files. Offering Share here would promise something it cannot deliver.
    stub({
      share: () => Promise.resolve(),
      canShare: () => false,
    } as unknown as Navigator);
    expect(canShareFiles()).toBe(false);
  });

  it("is false when `canShare` is missing entirely", () => {
    stub({ share: () => Promise.resolve() } as unknown as Navigator);
    expect(canShareFiles()).toBe(false);
  });

  it("is true when the device can share files", () => {
    stub({
      share: () => Promise.resolve(),
      canShare: () => true,
    } as unknown as Navigator);
    expect(canShareFiles()).toBe(true);
  });

  it("is false rather than throwing when canShare throws", () => {
    stub({
      share: () => Promise.resolve(),
      canShare: () => {
        throw new Error("not supported");
      },
    } as unknown as Navigator);
    expect(canShareFiles()).toBe(false);
  });

  afterEachRestore();

  function afterEachRestore() {
    Object.defineProperty(globalThis, "navigator", {
      value: original,
      configurable: true,
      writable: true,
    });
  }
});

describe("share projections", () => {
  const invoice = {
    id: "inv-uuid",
    invoice_number: "INV-000042",
    issue_date: "2026-10-01T00:00:00.000Z",
    total: 570_000,
    amount_paid: 200_000,
    balance_due: 370_000,
    customer_phone: "+2348001234567",
    customer_email: "buyer@example.com",
  };

  it("marks a settled invoice as paid", () => {
    const projected = invoiceAsShareable({ ...invoice, balance_due: 0 });
    expect(projected.payment_status).toBe("paid");
    expect(projected.receipt_number).toBe("INV-000042");
    expect(projected.id).toBe("inv-uuid");
  });

  it("marks an invoice with a balance as partially paid", () => {
    expect(invoiceAsShareable(invoice).payment_status).toBe("partial");
  });

  it("carries the contact details a message needs", () => {
    expect(invoiceAsShareable(invoice).customer_phone).toBe("+2348001234567");
    expect(invoiceAsShareable(invoice).customer_email).toBe("buyer@example.com");
  });

  it("carries a receipt's own payment status through unchanged", () => {
    const projected = receiptAsShareable({
      id: "r-uuid",
      receipt_number: "ES-000007",
      issue_date: "2026-10-01T00:00:00.000Z",
      total: 1000,
      payment_status: "partial",
      customer_phone: null,
      customer_email: null,
    } as never);

    expect(projected.payment_status).toBe("partial");
    expect(projected.id).toBe("r-uuid");
  });

  it("produces the same shape from either entry point", () => {
    expect(Object.keys(invoiceAsShareable(invoice)).sort()).toEqual(
      Object.keys(invoiceAsShareable(invoice)).sort(),
    );
  });
});
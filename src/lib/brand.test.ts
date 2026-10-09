import { describe, expect, it } from "vitest";
import {
  CONTRAST_TEXT,
  CONTRAST_UI,
  contrastRatio,
  derivePalette,
  ensureContrast,
  extractLogoColor,
  initials,
  meetsContrast,
  onColor,
  parseHex,
  relativeLuminance,
  safeAccent,
  toHex,
} from "./brand";

/* ------------------------------------------------------------------ */
/* Monograms                                                           */
/* ------------------------------------------------------------------ */

describe("initials", () => {
  it("returns a placeholder instead of crashing on empty input", () => {
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
  });

  it("takes two letters from a single word", () => {
    expect(initials("Northwind")).toBe("NO");
    expect(initials("Kiosk")).toBe("KI");
  });

  it("takes the first and last word for multi-word names", () => {
    expect(initials("ABC Pharmacy")).toBe("AP");
    expect(initials("Promise Studios")).toBe("PS");
    expect(initials("The Big Store")).toBe("TS");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(initials("  ABC   Pharmacy  ")).toBe("AP");
    expect(initials("one")).toBe("ON");
  });

  it("never emits lowercase or a fixed letter", () => {
    expect(initials("zen zephyr")).toBe("ZZ");
    expect(initials("zen zephyr")).not.toBe("E");
  });
});

/* ------------------------------------------------------------------ */
/* Colour maths                                                        */
/* ------------------------------------------------------------------ */

describe("parseHex / toHex", () => {
  it("parses the canonical form and the shorthand", () => {
    expect(parseHex("#B8912F")).toEqual({ r: 0xb8, g: 0x91, b: 0x2f });
    expect(parseHex("b8912f")).toEqual({ r: 0xb8, g: 0x91, b: 0x2f });
    expect(parseHex("#abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
  });

  it("rejects anything that is not a colour", () => {
    expect(parseHex("")).toBeNull();
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("rgb(1,2,3)")).toBeNull();
    expect(parseHex(null)).toBeNull();
  });

  it("round-trips", () => {
    const value = "#1a2b3c";
    expect(toHex(parseHex(value)!)).toBe(value);
  });
});

describe("relativeLuminance / contrastRatio", () => {
  it("matches the WCAG reference points", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 3);
  });

  it("is symmetric and is 1 for identical colours", () => {
    expect(contrastRatio("#123456", "#fedcba")).toBeCloseTo(
      contrastRatio("#fedcba", "#123456"),
      9,
    );
    expect(contrastRatio("#b8912f", "#b8912f")).toBeCloseTo(1, 9);
  });

  it("reports the WCAG thresholds correctly", () => {
    // Black on white clears both floors; a mid-gold on white does not.
    expect(meetsContrast("#000000", "#ffffff")).toBe(true);
    expect(meetsContrast("#000000", "#ffffff", CONTRAST_UI)).toBe(true);
    expect(meetsContrast("#b8912f", "#ffffff")).toBe(false);
    expect(meetsContrast("#b8912f", "#ffffff", CONTRAST_UI)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Accessibility repair                                                */
/* ------------------------------------------------------------------ */

describe("ensureContrast", () => {
  it("leaves a colour alone when it already clears the bar", () => {
    expect(ensureContrast("#000000", "#ffffff", 4.5)).toBe("#000000");
    expect(ensureContrast("#ffffff", "#111111", 4.5)).toBe("#ffffff");
  });

  it("repairs a colour that fails, keeping its hue where possible", () => {
    const fixed = ensureContrast("#f2f2f2", "#ffffff", 4.5);
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    // Light input should be pushed darker, not lighter.
    expect(relativeLuminance(fixed)).toBeLessThan(relativeLuminance("#f2f2f2"));
  });

  it("works in both directions — dark on dark is lightened", () => {
    const fixed = ensureContrast("#222222", "#000000", 4.5);
    expect(contrastRatio(fixed, "#000000")).toBeGreaterThanOrEqual(4.5);
  });

  it("always clears the requested ratio across a wide sample", () => {
    const backgrounds = ["#ffffff", "#000000", "#b8912f", "#5a6472", "#fbf7ee"];
    const colors = [
      "#000000",
      "#ffffff",
      "#b8912f",
      "#888888",
      "#f0f0f0",
      "#1a1a1a",
      "#7a3fbe",
      "#00ff00",
      "#800000",
      "#d9d9d9",
    ];
    for (const bg of backgrounds) {
      for (const color of colors) {
        const fixed = ensureContrast(color, bg, CONTRAST_TEXT);
        expect(contrastRatio(fixed, bg)).toBeGreaterThanOrEqual(CONTRAST_TEXT);
      }
    }
  });

  it("degrades safely on input that is not a colour", () => {
    expect(ensureContrast("not-a-colour", "#ffffff", 4.5)).toBe("#ffffff");
    expect(ensureContrast("#112233", "nope", 4.5)).toBe("nope");
  });
});

/* ------------------------------------------------------------------ */
/* Text laid over brand colour                                         */
/* ------------------------------------------------------------------ */

/** Everything the receipt might paint a background with. */
const BACKGROUNDS = [
  "#000000",
  "#ffffff",
  "#111111",
  "#b8912f",
  "#5a6472",
  "#fbf7ee",
  "#3d1d63", // Org B's hand-picked primary
  "#1f9d6b", // and its hand-picked accent
  "#808080", // the worst case for black vs. white
  "#d9d9d9",
  "#2980b9",
  "#e74c3c",
];

describe("onColor", () => {
  it("picks white on dark and black on light", () => {
    expect(onColor("#000000")).toBe("#ffffff");
    expect(onColor("#111111")).toBe("#ffffff");
    expect(onColor("#3d1d63")).toBe("#ffffff");
    expect(onColor("#ffffff")).toBe("#000000");
    expect(onColor("#f5f5f5")).toBe("#000000");
  });

  it("always clears the 4.5 text floor, whatever the background", () => {
    for (const bg of BACKGROUNDS) {
      const fg = onColor(bg);
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(CONTRAST_TEXT);
    }
  });

  it("chooses the better extreme on a mid-tone", () => {
    // At L≈0.179 black and white tie around 4.58:1 — either is acceptable,
    // but it must never be the *worse* one.
    const bg = "#808080";
    const fg = onColor(bg);
    const better = contrastRatio("#ffffff", bg) >= contrastRatio("#000000", bg)
      ? "#ffffff"
      : "#000000";
    expect(fg).toBe(better);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("falls back to white on input it cannot read", () => {
    expect(onColor("")).toBe("#ffffff");
    expect(onColor("transparent")).toBe("#ffffff");
    expect(onColor(null)).toBe("#ffffff");
  });
});

describe("safeAccent", () => {
  it("leaves an already-legible accent alone", () => {
    // The house gold on the default primary — the shipping default.
    expect(safeAccent("#d98324", "#111111")).toBe("#d98324");
  });

  it("repairs the exact pair Settings lets people type", () => {
    // 3.92:1 as saved — the failure this exists to prevent.
    expect(contrastRatio("#1f9d6b", "#3d1d63")).toBeLessThan(CONTRAST_TEXT);
    const fixed = safeAccent("#1f9d6b", "#3d1d63");
    expect(contrastRatio(fixed, "#3d1d63")).toBeGreaterThanOrEqual(
      CONTRAST_TEXT,
    );
    expect(fixed).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("works both ways round — dark accent on a light primary", () => {
    const fixed = safeAccent("#333333", "#dddddd");
    expect(contrastRatio(fixed, "#dddddd")).toBeGreaterThanOrEqual(
      CONTRAST_TEXT,
    );
  });

  it("keeps the total row legible, which is the accent reversed", () => {
    // The total draws primary *on* accent, so both directions have to hold.
    for (const [primary, accent] of [
      ["#3d1d63", "#1f9d6b"],
      ["#10334a", "#5fa0cb"],
      ["#111111", "#b8912f"],
      ["#ffffff", "#808080"],
    ]) {
      const accentSafe = safeAccent(accent, primary);
      expect(contrastRatio(accentSafe, primary)).toBeGreaterThanOrEqual(
        CONTRAST_TEXT,
      );
      expect(contrastRatio(primary, accentSafe)).toBeGreaterThanOrEqual(
        CONTRAST_TEXT,
      );
    }
  });
});

/* ------------------------------------------------------------------ */
/* Derived palette                                                     */
/* ------------------------------------------------------------------ */

/** Colours a real logo might plausibly be — or that a user might upload. */
const LOGO_COLOURS = [
  "#000000", // monochrome black
  "#ffffff", // white on transparency
  "#888888", // mid grey
  "#b8912f", // house gold
  "#e74c3c", // bright red
  "#f1c40f", // bright yellow
  "#2980b9", // blue
  "#27ae60", // green
  "#7a3fbe", // purple
  "#f5f5f5", // near-white
  "#0b0b0b", // near-black
  "#00ff00", // fluorescent
];

describe("derivePalette", () => {
  it("keeps white text legible on the header band (13:1)", () => {
    for (const color of LOGO_COLOURS) {
      const { primary } = derivePalette(color);
      expect(contrastRatio("#ffffff", primary)).toBeGreaterThanOrEqual(13);
    }
  });

  it("keeps the accent legible on the band and vice versa (4.5:1)", () => {
    for (const color of LOGO_COLOURS) {
      const { primary, accent } = derivePalette(color);
      expect(contrastRatio(accent, primary)).toBeGreaterThanOrEqual(
        CONTRAST_TEXT,
      );
      expect(contrastRatio(primary, accent)).toBeGreaterThanOrEqual(
        CONTRAST_TEXT,
      );
    }
  });

  it("emits valid hex in the canonical shape", () => {
    for (const color of LOGO_COLOURS) {
      const { primary, accent } = derivePalette(color);
      expect(primary).toMatch(/^#[0-9a-f]{6}$/i);
      expect(accent).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("falls back to the default pair for unusable input", () => {
    const { primary, accent } = derivePalette("transparent-ish");
    expect(contrastRatio("#ffffff", primary)).toBeGreaterThanOrEqual(13);
    expect(contrastRatio(accent, primary)).toBeGreaterThanOrEqual(CONTRAST_TEXT);
  });

  it("does not recolour a neutral logo into something unreadable", () => {
    // A pure white logo must not produce a white band.
    expect(relativeLuminance(derivePalette("#ffffff").primary)).toBeLessThan(0.4);
  });
});

/* ------------------------------------------------------------------ */
/* Server safety                                                       */
/* ------------------------------------------------------------------ */

describe("extractLogoColor", () => {
  it("returns null with no DOM instead of throwing", async () => {
    expect(typeof document).toBe("undefined");
    await expect(extractLogoColor("data:image/png;base64,AAAA")).resolves.toBeNull();
    await expect(extractLogoColor("")).resolves.toBeNull();
  });
});

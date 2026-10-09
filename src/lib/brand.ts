/**
 * Organization identity helpers.
 *
 * Two jobs:
 *
 *  1. **Monograms.** Every surface that falls back to initials reads the
 *     organization's name, never a fixed letter — no organization is baked
 *     into this file.
 *
 *  2. **Logo-derived palette, with accessibility as a hard constraint.** An
 *     uploaded logo can be any colour at all (or no colour), so anything
 *     derived from it is passed through {@link ensureContrast} before it is
 *     ever used as a background or as text. WCAG is a floor, not a target.
 *
 * Safe to import from server components: nothing touches `window` at module
 * scope, and the sampling functions bail out when there is no DOM.
 */

/** WCAG 2.1 minimums. Text is 4.5, non-text UI (rails, rules, focus) is 3. */
export const CONTRAST_TEXT = 4.5;
export const CONTRAST_UI = 3;

/* ------------------------------------------------------------------ */
/* Monograms                                                           */
/* ------------------------------------------------------------------ */

/**
 * Up to two letters for an organization name.
 *
 * `ABC Pharmacy` → `AP` so a multi-word name does not collapse to "AB",
 * while a single word keeps its first two letters.
 */
export function initials(name: string | null | undefined): string {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  const letters = [words[0][0], words[words.length - 1][0]];
  return letters.join("").toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Colour maths                                                        */
/* ------------------------------------------------------------------ */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Accepts `#rgb` or `#rrggbb` (with or without the leading `#`); null otherwise. */
export function parseHex(hex: string | null | undefined): Rgb | null {
  if (!hex) return null;
  const value = hex.trim().replace(/^#/, "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** WCAG relative luminance of an sRGB channel pair. */
function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string | Rgb): number {
  const rgb = typeof color === "string" ? parseHex(color) : color;
  if (!rgb) return 0;
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

/**
 * WCAG contrast ratio, 1–21. Order-independent — contrast(a, b) === contrast(b, a).
 */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function meetsContrast(
  foreground: string,
  background: string,
  minRatio = CONTRAST_TEXT,
): boolean {
  return contrastRatio(foreground, background) >= minRatio;
}

/* ------------------------------------------------------------------ */
/* Accessibility repair                                                */
/* ------------------------------------------------------------------ */

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/** Push a colour's lightness toward `target` while keeping its hue. */
function nudge(color: Rgb, t: number, toward: "white" | "black"): Rgb {
  return mix(color, toward === "white" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }, t);
}

/**
 * Return a colour that clears `minRatio` against `background`, or the closest
 * of pure black / white if no tint of it can.
 *
 * The tint is walked in 40 steps *away from the background* first, then in
 * the opposite direction if that cannot reach the bar — a very light colour
 * on a mid-grey surface, for example, fails as white but clears as black.
 * That means a logo in any hue, including a fully desaturated or very light
 * one, lands on something readable instead of being used as-is and failing
 * WCAG.
 */
export function ensureContrast(
  color: string,
  background: string,
  minRatio = CONTRAST_TEXT,
): string {
  const rgb = parseHex(color);
  const bg = parseHex(background);
  if (!rgb || !bg) return background;

  if (contrastRatio(rgb, bg) >= minRatio) return toHex(rgb);

  const rgbLum = relativeLuminance(rgb);
  const bgLum = relativeLuminance(bg);
  // Moving away from the background's luminance is what raises the ratio.
  const directions: Array<"white" | "black"> =
    rgbLum >= bgLum ? ["white", "black"] : ["black", "white"];

  for (const direction of directions) {
    for (let step = 1; step <= 40; step += 1) {
      // Test the *rounded* value: `toHex` quantises to 8 bits, and a ratio
      // that only just clears the bar on paper can slip under it once it is
      // written out as six hex digits. Checking what actually gets returned
      // is the only way the promise holds for the caller.
      const candidate = toHex(nudge(rgb, step / 40, direction));
      if (contrastRatio(candidate, bg) >= minRatio) return candidate;
    }
  }

  // Nothing clears the bar: keep whichever extreme scores higher.
  const white = "#ffffff";
  const black = "#000000";
  return contrastRatio(white, bg) >= contrastRatio(black, bg) ? white : black;
}

/* ------------------------------------------------------------------ */
/* Logo sampling                                                       */
/* ------------------------------------------------------------------ */

const SAMPLE = 64;

/**
 * Dominant colour of a logo image, or null when none can be found.
 *
 * Samples the image into a 64×64 canvas and buckets the *opaque* pixels, so
 * a transparent PNG contributes only the pixels that actually draw. Among
 * buckets covering at least 0.4% of the image it prefers the most saturated
 * — a logo's brand mark, not its white background — and falls back to the
 * plain most-frequent bucket for monochrome marks.
 *
 * Returns null (rather than a guess) for an unloadable image, an SVG with no
 * intrinsic size, or an image that is entirely transparent.
 */
export async function extractLogoColor(src: string): Promise<string | null> {
  if (typeof document === "undefined" || !src) return null;

  let image: HTMLImageElement;
  try {
    image = await loadImage(src);
  } catch {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  // Contain, not cover: cropping the logo could drop the mark entirely.
  const scale = Math.min(SAMPLE / image.naturalWidth, SAMPLE / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(
    image,
    (SAMPLE - width) / 2,
    (SAMPLE - height) / 2,
    width,
    height,
  );

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  } catch {
    // A cross-origin logo taints the canvas — no colour beats a thrown error.
    return null;
  }

  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  let opaque = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    opaque += 1;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // 4 bits per channel → 4096 buckets, enough to find a dominant colour
    // without letting antialiasing fragment it.
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  if (opaque < SAMPLE * SAMPLE * 0.01) return null;

  const floor = opaque * 0.004;
  const candidates = [...buckets.values()].filter((b) => b.count >= floor);
  if (candidates.length === 0) return null;

  const saturation = (b: (typeof candidates)[number]) => {
    const max = Math.max(b.r, b.g, b.b) / b.count;
    const min = Math.min(b.r, b.g, b.b) / b.count;
    return max === 0 ? 0 : (max - min) / max;
  };

  const chromatic = candidates.filter((b) => saturation(b) > 0.15);
  const pool = chromatic.length > 0 ? chromatic : candidates;
  const best = pool.reduce((a, b) => (b.count > a.count ? b : a));

  return toHex({
    r: best.r / best.count,
    g: best.g / best.count,
    b: best.b / best.count,
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error("logo has no intrinsic size"));
        return;
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error("logo failed to load"));
    image.src = src;
  });
}

/**
 * Text colour to place on top of `background`.
 *
 * Logo-derived palettes go through {@link ensureContrast}, but an organization
 * can also *type* brand colours straight into Settings — and a light or mid
 * primary with white text on it is unreadable. Rather than mutate the color
 * the organization chose, pick the better of pure black and pure white for
 * whatever it turns out to be.
 *
 * The worst case for this is a mid-grey background, where black and white
 * score ~4.58:1 — so the result always clears the 4.5 text floor.
 */
export function onColor(background: string | null | undefined): string {
  const bg = parseHex(background);
  if (!bg) return "#ffffff";
  return contrastRatio("#ffffff", bg) >= contrastRatio("#000000", bg)
    ? "#ffffff"
    : "#000000";
}

/**
 * The accent, repaired against the primary it will sit on.
 *
 * `derivePalette` already guarantees this pairing for logos, but the accent
 * can equally come from a colour picker or straight from the API, so the
 * guarantee has to be re-asserted at the point of use — not once, at upload.
 */
export function safeAccent(accent: string, primary: string): string {
  return ensureContrast(accent, primary, CONTRAST_TEXT);
}

/* ------------------------------------------------------------------ */
/* Derived palette                                                     */
/* ------------------------------------------------------------------ */

export interface BrandPalette {
  /** Header band / table head background — must carry white text. */
  primary: string;
  /** Text on the band, and the total row background — must carry `primary`. */
  accent: string;
}

/**
 * Turn one sampled logo colour into the two colours the receipt uses.
 *
 * Both are solved rather than copied, because the receipt already fixes how
 * they are combined:
 *
 *   - white text sits on `primary` (the header band and table head);
 *   - `accent` sits on `primary`, and `primary` sits on `accent` in the total
 *     row.
 *
 * `primary` is therefore pulled toward black against a demanding 13:1 bar —
 * which is what leaves the `accent` room to stay a genuine mid-tone of the
 * logo's hue instead of being bleached out to satisfy 4.5 against an almost
 * white band. A black or white logo yields a neutral pair rather than an
 * invisible one; a loud logo keeps its hue but is not allowed to make the
 * total unreadable.
 */
export function derivePalette(logoColor: string): BrandPalette {
  const base = parseHex(logoColor) ?? { r: 17, g: 17, b: 17 };

  const primary = ensureContrast(toHex(base), "#ffffff", 13);
  const accent = ensureContrast(toHex(base), primary, CONTRAST_TEXT);

  return { primary, accent };
}

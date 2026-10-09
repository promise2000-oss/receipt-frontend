import { describe, expect, it } from "vitest";
import {
  MAX_LOGO_EDGE,
  MIN_LOGO_EDGE,
  logoSizeError,
  readImageSize,
} from "./image";

describe("logoSizeError", () => {
  it("accepts a normal logo", () => {
    expect(logoSizeError({ width: 512, height: 512 })).toBeNull();
    expect(logoSizeError({ width: 1024, height: 256 })).toBeNull();
    expect(logoSizeError({ width: 64, height: 64 })).toBeNull();
  });

  it("accepts exactly at both boundaries", () => {
    expect(logoSizeError({ width: MIN_LOGO_EDGE, height: MIN_LOGO_EDGE })).toBeNull();
    expect(logoSizeError({ width: MAX_LOGO_EDGE, height: MAX_LOGO_EDGE })).toBeNull();
    // A wide banner is fine: only the shortest edge has to reproduce.
    expect(logoSizeError({ width: MAX_LOGO_EDGE, height: MIN_LOGO_EDGE })).toBeNull();
  });

  it("refuses anything under the minimum on either axis", () => {
    expect(logoSizeError({ width: 8, height: 8 })).toMatch(/at least 16×16/);
    expect(logoSizeError({ width: 512, height: 4 })).toMatch(/at least 16×16/);
    expect(logoSizeError({ width: 4, height: 512 })).toMatch(/at least 16×16/);
    expect(logoSizeError({ width: MIN_LOGO_EDGE - 1, height: 999 })).toMatch(
      /at least 16×16/,
    );
  });

  it("refuses anything over the maximum on either axis", () => {
    expect(logoSizeError({ width: 8193, height: 8193 })).toMatch(/no larger than 8192/);
    expect(logoSizeError({ width: 40_000, height: 40 })).toMatch(
      /no larger than 8192/,
    );
    expect(logoSizeError({ width: 40, height: 40_000 })).toMatch(
      /no larger than 8192/,
    );
  });

  it("defers when the size could not be read", () => {
    // An SVG sized by percentage reports 0×0; the API reads its viewBox, so
    // refusing here would reject a perfectly valid logo.
    expect(logoSizeError(null)).toBeNull();
  });
});

describe("readImageSize", () => {
  it("is a browser-only reader and does not throw when imported server-side", async () => {
    // In this (node) environment there is no FileReader/Image at all. The
    // contract is "return null, let the API decide" — never an exception that
    // would take the settings page down during SSR.
    const fakeFile = { name: "logo.png" } as unknown as File;
    await expect(readImageSize(fakeFile)).resolves.toBeNull();
  });
});

import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the pure identity/branding helpers, the image size guards,
 * how a failed API request reads, and one rendered component.
 *
 * They deliberately run in a plain Node environment (no jsdom): everything
 * under test is colour maths, string handling, or a `fetch` we stub — and
 * `extractLogoColor` being asked to work with no DOM at all is itself one of
 * the assertions, since it has to return null rather than throw when imported
 * by a server component. `LoadError` is rendered with `react-dom/server` for
 * the same reason: there is no browser here to click the retry button with.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@/components": path.resolve(__dirname, "src/components"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "@": path.resolve(__dirname),
    },
  },
  test: {
    // `.tsx` is included for component tests. They opt into a DOM per file
    // with a `@vitest-environment jsdom` docblock rather than moving the whole
    // suite into jsdom: everything else here is colour maths, string handling
    // or a stubbed `fetch`, and a DOM would only slow it down.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    // Component tests use `@testing-library/jest-dom` matchers (`toHaveValue`,
    // `toHaveAttribute`), which are not built into Vitest's expect.
    setupFiles: ["./src/test/setup-dom.ts"],
  },
});

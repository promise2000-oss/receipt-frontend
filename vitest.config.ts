import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the pure identity/branding helpers.
 *
 * They deliberately run in a plain Node environment (no jsdom): everything
 * under test is colour maths and string handling, and `extractLogoColor`
 * being asked to work with no DOM at all is itself one of the assertions —
 * it has to return null rather than throw when imported by a server
 * component.
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
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});

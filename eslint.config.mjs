import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Rules that exist to stop a class of bug that is invisible in review and
  // near-impossible to reproduce from the symptom alone: a text field that
  // loses focus after a keystroke because its subtree was remounted.
  {
    rules: {
      // A component defined inside another component's body is a *new type* on
      // every render, so React unmounts and remounts the whole subtree — the
      // DOM node is replaced, focus is lost, and any typed value survives only
      // because it lived in state. Hoist it to module scope.
      "react/no-unstable-nested-components": "error",
      // A missing or unstable `key` is the other half of the same failure:
      // lists whose keys derive from an index or a changing value remount
      // rows as they are reordered or filtered.
      "react/jsx-key": "error",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

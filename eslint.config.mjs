import { ESLINT_IGNORE_PATTERNS } from "@silverassist/next-testing-toolkit";
import react from "@silverassist/npm-package-standards/eslint/react";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...react,
  {
    files: ["**/__tests__/**", "jest.setup.js", "jest.config.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // Test mocks routinely need to loosen types to stand in for a real
      // API surface, and jest.mock() factories are hoisted above imports —
      // they can't close over a top-level import, so they require() instead.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [...ESLINT_IGNORE_PATTERNS, "coverage/**"],
  },
);

import { defineConfig } from "tsdown";

// Migrated from tsup, which is no longer maintained ("This project is not
// actively maintained anymore. Please consider using tsdown instead.") and
// whose DTS build crashes on TypeScript 7. tsdown declares
// `typescript: ^5 || ^6 || ^7`, so it doesn't block a future TypeScript 7
// upgrade the way tsup did.
//
// TypeScript itself is pinned to ^6.0.3 (not ^7) for now: typescript-eslint
// refuses to run at all under TS 7 (a hard runtime check, not a soft peer
// warning -- see typescript-eslint/typescript-eslint#10940), and adopting
// real ESLint linting mattered more than the TS7 upgrade. Revisit once that
// issue closes.
export default defineConfig([
  // Client bundle — carries the "use client" directive.
  {
    entry: {
      "client/index": "src/client/index.tsx",
    },
    // Replaces the former add-use-client.js post-build script. That script
    // hardcoded two output paths and ran after the fact; tsdown emits the
    // directive as part of the build, scoped to this config object only --
    // the second one (root barrel + ./server) must stay unmarked.
    banner: '"use client";',
    format: ["cjs", "esm"],
    fixedExtension: false,
    dts: { sourcemap: false },
    sourcemap: true,
    clean: true,
    deps: { neverBundle: ["react", "react-dom", "next"] },
    treeshake: true,
    minify: false,
  },
  // Server and shared bundles — no "use client".
  {
    entry: {
      index: "src/index.ts",
      "server/index": "src/server/index.ts",
      "constants/index": "src/constants/index.ts",
      "types/index": "src/types/index.ts",
    },
    format: ["cjs", "esm"],
    fixedExtension: false,
    dts: { sourcemap: false },
    sourcemap: true,
    // Not `clean`: the client bundle above already emptied dist/.
    clean: false,
    // `./client` stays EXTERNAL here on purpose. Inlining it flattens the
    // barrel across the RSC boundary and drops the "use client" directive,
    // which is what made the root export unusable from a Server Component.
    // Kept external, dist/index.* re-exports dist/client/*, the directive
    // survives, and the barrel convention is preserved.
    deps: { neverBundle: ["react", "react-dom", "next", "@silverassist/recaptcha/client"] },
    treeshake: true,
    minify: false,
  },
]);

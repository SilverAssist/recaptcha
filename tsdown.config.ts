import { defineConfig } from "tsdown";

// Migrated from tsup, which is no longer maintained ("This project is not
// actively maintained anymore. Please consider using tsdown instead.") and
// whose DTS build crashes on TypeScript 7. tsdown declares
// `typescript: ^5 || ^6 || ^7`, so it unblocks the TypeScript 7 upgrade.
export default defineConfig([
  // Client bundle — carries the "use client" directive.
  {
    entry: {
      "client/index": "src/client/index.tsx",
    },
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

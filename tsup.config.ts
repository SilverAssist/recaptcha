import { defineConfig } from "tsup";

export default defineConfig([
  // Client bundle - with "use client" directive
  {
    entry: {
      "client/index": "src/client/index.tsx",
    },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom", "next"],
    treeshake: true,
    minify: false,
    banner: {
      js: '"use client";',
    },
  },
  // Server and other bundles - no "use client" directive
  {
    entry: {
      index: "src/index.ts",
      "server/index": "src/server/index.ts",
      "constants/index": "src/constants/index.ts",
      "types/index": "src/types/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean since client bundle already ran
    external: ["react", "react-dom", "next"],
    treeshake: true,
    minify: false,
  },
]);

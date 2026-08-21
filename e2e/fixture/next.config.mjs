import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  // The fixture lives inside the package repo, so Next finds two lockfiles and
  // guesses the wrong workspace root. Pin it to the fixture.
  outputFileTracingRoot: here,
  // Type errors are the package's own CI concern; this build exists to prove
  // the *packed tarball* resolves and renders, not to re-type-check the repo.
  typescript: { ignoreBuildErrors: true },
};

#!/bin/sh
#
# Installs the *packed* package into the fixture app, then builds it.
#
# Packing matters: the fixture must consume the exact tarball npm publishes,
# not `src/` and not a workspace link. Two real defects in this org were
# invisible any other way -- a missing "use client" directive (only fails when
# a Server Component imports the built file) and an `exports` map pointing at
# files the build never produced (only fails when Node resolves the tarball).
#
set -e

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIXTURE="$ROOT/e2e/fixture"

echo "→ Building the package"
cd "$ROOT"
npm run build

echo "→ Packing"
rm -f "$ROOT"/silverassist-recaptcha-*.tgz
TARBALL=$(npm pack --silent)

echo "→ Installing $TARBALL into the fixture"
cd "$FIXTURE"
rm -rf node_modules .next package-lock.json
# Next 16: the version the consuming apps actually run. Note this leaves the
# declared peer range `next: >=14.0.0` unverified for 14 and 15 -- and Next 15
# is known not to accept TypeScript 7 ("The TypeScript 7 native compiler does
# not provide the JavaScript compiler API that Next.js requires ... upgrade to
# v16.2.11 or later"). Either narrow the peer range or add a matrix leg.
# TypeScript is installed *locally in the fixture* on purpose. Without it,
# Node resolution walks up and finds the package's own typescript@7, which
# Next 15 rejects outright: "The TypeScript 7 native compiler does not provide
# the JavaScript compiler API that Next.js requires ... upgrade to Next.js
# v16.2.11 or later". Pinning it here keeps the fixture testing the package,
# not the parent repo's toolchain.
npm install --no-audit --no-fund \
  "next@^16" "react@^19" "react-dom@^19" "typescript@^5" "@types/react@^19" \
  "$ROOT/$TARBALL"

echo "→ next build"
npm run build

echo "✅ Fixture built against the packed tarball"

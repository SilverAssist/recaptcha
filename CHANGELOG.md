# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-08-24

### Fixed

- **Two open Dependabot security alerts on dev-only transitive deps** — js-yaml 3.14.2 (via `@istanbuljs/load-nyc-config`): quadratic-complexity DoS, patched at 3.15.0 (overridden within the 3.x line to keep istanbul's `safeLoad` API intact); `@babel/core`: arbitrary file read via `sourceMappingURL`, resolved via `npm audit fix`. Neither is shipped in the published package.

## [0.3.0] - 2026-08-21

### Fixed

- **`npm ci` was broken, blocking every release** ([#55](https://github.com/SilverAssist/recaptcha/issues/55)). A Dependabot major bump took TypeScript from 6.0.3 to 7.0.2, but `ts-jest` peer-requires `>=4.3 <7` and had no TypeScript 7 release. `npm ci` failed with `ERESOLVE` on every Node version, so neither CI nor a release could install. Resolved permanently by replacing the build tool (below), not by pinning TypeScript back.
- **`node10` module resolution failed for every subpath** (`./client`, `./server`, `./types`, `./constants`) — `node10` has no support for `"exports"`, so it fell back to the top-level `types` field and appended the subpath literally, landing on a path that does not exist. Added `typesVersions` mapping each to its `.d.ts` directly.
- **The `next` peer range claimed two untested majors.** `>=14.0.0` covered Next 14 and 15, neither exercised by this package's own tests or by any internal consumer — every app in the org runs `^16.2.9`. Narrowed to `>=16.0.0`. This also matches reality on the tooling side: TypeScript 7 (below) rejects Next below 16.2.11 outright.

### Changed

- **Replaced `tsup` with `tsdown`, which is what actually unblocked TypeScript 7** ([#59](https://github.com/SilverAssist/recaptcha/pull/59)). Removing `ts-jest` for `@swc/jest` (below) freed the test suite from the TypeScript-6 constraint, but the _build_ still failed under TypeScript 7 — `tsup`'s DTS step crashes with `Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')`, a bug with no fix in sight ([tsup#1405](https://github.com/egoist/tsup/issues/1405); no PR merged there since November 2025). `tsdown` is the tool tsup's own README now recommends. `fixedExtension: false` preserves the exact file names the `exports` map already declared.
- **Replaced `ts-jest` with `@swc/jest`** ([#57](https://github.com/SilverAssist/recaptcha/pull/57)). `ts-jest` transpiled _and_ type-checked, but its TypeScript peer range (`>=4.3 <7`) is what let a routine Dependabot bump break installation outright. `@swc/jest` transpiles only and has no TypeScript peer constraint; type-checking still runs in CI via `npm run lint` (`tsc --noEmit`).
- **Node 22 minimum** — `tsdown` requires `node: ^22.18.0 || >=24.11.0`. `engines` now declares `>=22.0.0`, matching what CI actually runs.
- **npm publishing moved to trusted publishing (OIDC)** ([#55](https://github.com/SilverAssist/recaptcha/issues/55)). `publish.yml` no longer reads an `NPM_TOKEN` secret: it requests `id-token: write` and npm exchanges that OIDC token for publish rights against the trusted publisher registered for this package. The publish job moved to Node 24, which ships npm 11.x natively as trusted publishing requires. Repo and package are both public, so provenance is now attested automatically.
- Standardized the Dependabot auto-merge workflow and added husky pre-commit/pre-push hooks, matching the convention used across the org's other npm packages.
- **Adopted `@silverassist/next-testing-toolkit`** for integration testing — this package was the pilot the harness was extracted from. Installs the packed tarball into a throwaway Next.js app and asserts the RSC boundary against the _built_ output, which is what makes packaging defects like the two above visible before publish rather than after. `scripts/e2e-install-fixture.sh` deleted; `e2e/playwright.config.ts` reduced to 3 lines.

### Docs

- Added `docs/NEXTJS_PACKAGE_TESTING.md`, recording the reasoning behind the integration-testing harness while it was still fresh — the four production defects that motivated it, the RSC-boundary rule (_a barrel may re-export across the boundary, a bundle may not inline across it_), and why Playwright over Cypress for packages specifically.

## [0.2.1] - 2026-02-06

### Fixed

- Fix race condition in lazy mode where `grecaptcha` was unavailable immediately after script load (#15)
- Fix `act()` warnings in client tests by properly wrapping async callbacks
- Fix TypeScript lint error for `tagName` property on `Node` type in tests

### Changed

- Add JSDoc module headers with `@module`, `@author`, `@license`, and `@version` tags to all source files
- Document callback stability requirements (`useCallback`) in `onTokenGenerated` and `onError` props
- Improve test coverage from 82% to 86% branch coverage with edge case tests
- Suppress expected reCAPTCHA console logs during test execution
- Update release prompt to include version sync for JSDoc headers

### Dependencies

- Bump `@types/node` from 25.0.10 to 25.2.0
- Bump `@types/react` from 19.2.9 to 19.2.10
- Bump `next` from 16.1.5 to 16.1.6

## [0.2.0] - 2026-02-02

### Added

- **Lazy loading support** for better page performance
  - New `lazy` prop to defer reCAPTCHA script loading until form is visible
  - New `lazyRootMargin` prop to configure IntersectionObserver threshold (default: "200px")
  - Reduces initial JS by ~320KB and improves TBT/TTI metrics
- **Singleton script loading** prevents duplicate script loads across multiple forms
- Comprehensive test coverage for lazy loading scenarios
- Documentation for lazy loading with performance metrics

### Fixed

- Add IntersectionObserver feature detection with fallback to eager loading for older browsers/SSR environments
- Add error handling tests for non-lazy Script component to ensure proper callback notification
- Queued callbacks now properly receive error notifications on script load failure

## [0.1.0] - 2026-01-27

### Added

- Initial release of `@silverassist/recaptcha`
- `RecaptchaWrapper` client component for automatic token generation
  - Automatic script loading via Next.js `Script` component
  - Token auto-refresh before expiration (90 seconds default)
  - Hidden input field for form submission
  - Configurable callbacks (`onTokenGenerated`, `onError`)
  - Graceful fallback when not configured
- `validateRecaptcha` server function for token validation
  - Google API verification
  - Score threshold checking
  - Action verification
  - Debug logging option
  - Skip validation when not configured (dev mode)
- `isRecaptchaEnabled` helper function
- `getRecaptchaToken` FormData extraction helper
- Full TypeScript support with exported types
  - `RecaptchaWrapperProps`
  - `RecaptchaValidationResult`
  - `RecaptchaVerifyResponse`
  - `RecaptchaConfig`
  - `RecaptchaValidationOptions`
- Subpath exports for tree-shaking
  - `@silverassist/recaptcha/client`
  - `@silverassist/recaptcha/server`
  - `@silverassist/recaptcha/types`
  - `@silverassist/recaptcha/constants`
- Comprehensive test suite with >80% coverage
- ESM and CommonJS bundle outputs

### Security

- Server-side token validation to prevent client-side bypass
- Action verification to prevent token reuse across different forms
- Configurable score thresholds for different risk levels

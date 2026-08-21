# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **`npm ci` was broken, blocking every release** ([#55](https://github.com/SilverAssist/recaptcha/issues/55)). A Dependabot major bump took TypeScript from 6.0.3 to 7.0.2 (#49), but `ts-jest` peer-requires `>=4.3 <7` and no published version supports TypeScript 7 yet — the latest, 29.4.12, still caps at `<7`. `npm ci` failed with `ERESOLVE` on Node 20 and 24 alike, so neither CI nor a release could install. TypeScript is back on `^6.0.3` and Dependabot now ignores its major updates until ts-jest catches up.
- **Three latent type errors the TypeScript 7 bump had masked.** Restoring TypeScript 6 surfaced them: `tsconfig.json` still set `baseUrl`, which TS 6 reports as deprecated (`TS5101`) — removed, since `paths` has not needed it since TS 5. TS 6 also does not auto-include `@types/node` the way TS 7 does, leaving `process` and the `NodeJS` namespace unresolved in both entrypoints, so `types: ["node"]` is now explicit. Finally, `tsup` injects its own `baseUrl` into the DTS build regardless of `tsconfig.json`, which `ignoreDeprecations: "6.0"` silences.

### Changed

- **npm publishing moved to trusted publishing (OIDC)** ([#55](https://github.com/SilverAssist/recaptcha/issues/55)). `publish.yml` no longer reads an `NPM_TOKEN` secret: it requests `id-token: write` and npm exchanges that OIDC token for publish rights against the trusted publisher registered for this package. Long-lived tokens are on a deprecation clock — from January 2027 2FA-bypass granular tokens lose direct publishing entirely. The publish job moves to Node 24, which ships npm 11.x natively as trusted publishing requires. Repo and package are both public, so provenance is now attested automatically.

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

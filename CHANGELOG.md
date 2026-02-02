# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

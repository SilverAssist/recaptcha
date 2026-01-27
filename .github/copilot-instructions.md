# Copilot Instructions for @silverassist/recaptcha

## Project Overview

This is an npm package providing Google reCAPTCHA v3 integration for Next.js applications with Server Actions support. It follows a **dual-export pattern** with separate client/server bundles.

## Architecture

```
src/
├── client/index.tsx    # React component with "use client" directive
├── server/index.ts     # Server-side validation (Node.js only)
├── types/index.ts      # Shared TypeScript interfaces
└── constants/index.ts  # Configuration defaults (DEFAULT_SCORE_THRESHOLD=0.5)
```

## Important: GitHub CLI Usage

**CRITICAL:** All `gh` commands MUST be piped through `cat` to prevent terminal control character issues:

```bash
# ✅ Correct
gh run view 12345 | cat
gh pr list | cat
gh release create v1.0.0 | cat

# ❌ Wrong
gh run view 12345
gh pr list
gh release create v1.0.0
```

Without `| cat`, the command output may hang or show progress spinners that interfere with command execution.

**Key Design Decisions:**
- Client and server code are strictly separated for Next.js App Router compatibility
- The `RecaptchaWrapper` component uses a hidden `<input>` to pass tokens via `FormData`
- Graceful degradation: validation passes automatically when `RECAPTCHA_SECRET_KEY` is unset (dev mode)
- Tokens auto-refresh every 90 seconds (Google tokens expire at 2 minutes)

## Build System

Uses **tsup** with two separate bundle configurations in [tsup.config.ts](tsup.config.ts):
1. Client bundle - includes `"use client"` directive, externals React/Next
2. Server/types bundle - runs second with `clean: false` to preserve client output

```bash
npm run build      # Builds CJS + ESM + .d.ts files to dist/
npm run dev        # Watch mode for development
```

## Publishing

Publishing is **automated via GitHub Releases**. The workflow [.github/workflows/publish.yml](.github/workflows/publish.yml) triggers on release creation.

### Release Process

1. **Update version** in [package.json](package.json):
   ```json
   { "version": "0.2.0" }
   ```

2. **Commit and push** the version change:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 0.2.0"
   git push origin main
   ```

3. **Create a GitHub Release** (triggers npm publish):
   ```bash
   gh release create v0.2.0 --title "v0.2.0" --notes "Release notes here" | cat
   ```

The workflow runs: `npm ci` → `npm run lint` → `npm run build` → `npm test` → `npm publish`

### Manual Publishing (if needed)

```bash
npm login                    # Use silverassist org credentials
npm run prepublishOnly       # clean → lint → build → test
npm publish --access public
```

The `publishConfig.access: "public"` in package.json ensures scoped packages (@silverassist/*) publish publicly.

## Package Exports

The package exposes multiple entry points via `exports` in [package.json](package.json):
- `@silverassist/recaptcha` → main exports (both client + server)
- `@silverassist/recaptcha/client` → `RecaptchaWrapper` only
- `@silverassist/recaptcha/server` → `validateRecaptcha`, `getRecaptchaToken`, `isRecaptchaEnabled`
- `@silverassist/recaptcha/types` → TypeScript interfaces

## Testing Conventions

```bash
npm test           # Run Jest tests
npm run test:watch # Watch mode
npm run test:cov   # Coverage report (threshold: 75% branches)
```

**Test patterns used:**
- Mock `window.grecaptcha` for client tests ([client.test.tsx](__tests__/client.test.tsx))
- Mock `global.fetch` for server tests ([server.test.ts](__tests__/server.test.ts))
- Manipulate `process.env` to test configured/unconfigured states
- Use `@testing-library/react` for component testing

## Environment Variables

| Variable | Side | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Client | Public site key for grecaptcha.execute() |
| `RECAPTCHA_SECRET_KEY` | Server | Secret key for Google API verification |

## Code Patterns

**Server validation flow** ([server/index.ts](src/server/index.ts)):
```ts
// Always check: missing secret → skip validation (returns success)
// Always check: missing token → return error
// Always check: score < threshold → return error
// Optional check: action mismatch → return error
```

**Client token generation** ([client/index.tsx](src/client/index.tsx)):
```ts
// Uses useRef to store token in hidden input
// Uses useCallback for executeRecaptcha (avoids re-renders)
// Cleanup interval on unmount via useEffect return
```

## Type Definitions

Key interfaces in [types/index.ts](src/types/index.ts):
- `RecaptchaValidationResult` - returned by `validateRecaptcha()`
- `RecaptchaWrapperProps` - component props
- `RecaptchaVerifyResponse` - raw Google API response shape

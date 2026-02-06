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


<!-- Added by copilot-prompts-kit -->
## 🔄 Copilot Agent Workflow for Complex Tasks

When implementing new features, refactoring code, or fixing complex issues, **always follow this systematic workflow**:

### Phase 1: Initial Analysis
1. **Analyze the request** - Understand the full scope, dependencies, and potential impacts
2. **Search existing code** - Use semantic search and grep to understand current implementation
3. **Identify components** - List all files, functions, and components that need changes
4. **Review documentation** - Check existing docs for patterns and conventions

### Phase 2: Planning Documentation
1. **Create planning document** - `docs/[feature-name]-plan.md` with:
   - Problem statement and objectives
   - Current architecture analysis
   - Proposed changes with before/after code examples
   - Risk assessment and mitigation strategies
   - Phase breakdown if complex
2. **Add action plan** - Detailed step-by-step implementation guide
3. **Create TODO list** - Use `manage_todo_list` tool to track all phases
4. **Commit planning** - `git commit -m "PROJECT-XXX: Add [feature] implementation plan"`

### Phase 3: Implementation by Phases
For each phase:
1. **Mark TODO as in-progress** - Update status before starting work
2. **Implement changes** - Make code changes following the plan
3. **Write/update tests** - Add unit tests, ensure regression tests pass
4. **Run tests** - `npm test` to verify no regressions
5. **Mark TODO as completed** - Update status after successful implementation
6. **Commit phase** - `git commit -m "PROJECT-XXX: Implement [feature] - Phase N"`

### Phase 4: Final Documentation
1. **Create final documentation** - `docs/[feature-name].md`
2. **Update related docs** - Update `project-overview.md`, `readme.md`, etc.
3. **Delete planning docs** - Remove temporary planning documents
4. **Final commit** - `git commit -m "PROJECT-XXX: Add [feature] documentation"`

### Key Principles
- ✅ **One commit per phase** - Create clear checkpoint commits
- ✅ **Test everything** - Run full test suite after each phase
- ✅ **No breaking changes** - Ensure backward compatibility
- ✅ **Document as you go** - Update docs with each phase
- ✅ **Type safety** - Maintain full TypeScript coverage

## Key Technologies & Frameworks

- **Next.js 15.x** with App Router for modern React development
- **React 19** for latest React features and optimizations
- **TypeScript** for comprehensive type safety
- **Tailwind CSS v4** with custom CSS variables and shadcn/ui design system
- **Jest & React Testing Library** for comprehensive testing

## Domain-Driven Design (DDD) Principles

This project follows **Domain-Driven Design** principles. See the `domain-driven-design` skill for detailed guidelines.

**Core Principles**:
1. **Group by Domain, Not by Type** - Organize files by business domain rather than technical type
2. **Clear Boundaries** - Each domain has well-defined responsibilities
3. **Colocation** - Related code (components, utils, tests) lives together

**Quick Rules**:
- ✅ Create domain folders that match business concepts
- ✅ Keep domain-specific utilities inside domain folders
- ✅ Place tests in `__tests__/` subfolders within each domain
- ❌ Don't create generic folders like "helpers", "services", "utils" at root level

## Barrel Export Pattern

Use **barrel exports** (`index.ts`) for folders with multiple internal files:

```typescript
// src/lib/api/index.ts
export * from "./client";
export * from "./endpoints";
export * from "./types";

// Usage - Clean imports from domain
import { apiClient, fetchUser } from "@/lib/api";
```

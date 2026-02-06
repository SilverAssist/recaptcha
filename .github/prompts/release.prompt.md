---
description: "Prepare and validate a new release for @silverassist/recaptcha"
agent: agent
---

# Release Preparation for @silverassist/recaptcha

Prepare a new release following the checklist below. **DO NOT publish to npm directly** — use the GitHub Release workflow.

## Release Version

Target version: `{version}`

---

## Pre-Release Checklist

### 1. Run All Quality Checks

Execute all validation commands in sequence:

```bash
npm run lint           # tsc --noEmit
npm test               # Jest tests
npm run build          # tsup → dist/ (ESM + CJS + .d.ts) + add-use-client.js
```

- [ ] TypeScript compilation succeeds (lint)
- [ ] All unit tests pass
- [ ] Build completes successfully
- [ ] `"use client"` directive added to client bundles

### 2. Version Consistency Check

Verify the version is consistent across all files:

- [ ] `package.json` → `version` field
- [ ] `CHANGELOG.md` → Has entry for `[{version}]` with current date
- [ ] Source file JSDoc headers → `@version` tag in all module headers

**Source files with `@version` tag that must be updated:**

```
src/index.ts
src/client/index.tsx
src/server/index.ts
src/types/index.ts
src/constants/index.ts
```

**Action:** 
1. Read `package.json` and `CHANGELOG.md` to compare versions
2. Search for `@version` in all source files and verify they match `{version}`
3. If any version is mismatched, update all occurrences to `{version}`

```bash
# Quick check for version consistency in headers
grep -r "@version" src/
```

### 3. CHANGELOG Validation

- [ ] `CHANGELOG.md` has an entry for version `{version}`
- [ ] Entry includes the current date in format `YYYY-MM-DD`
- [ ] `[Unreleased]` section is moved to new version section
- [ ] All changes are documented under appropriate sections (Added/Changed/Fixed/Removed)

### 4. Package.json Validation

Verify `package.json` has correct configuration:

- [ ] `name` is `@silverassist/recaptcha`
- [ ] `version` matches target version
- [ ] `files` array includes: `dist`, `README.md`, `LICENSE`, `CHANGELOG.md`
- [ ] `main` points to `./dist/index.js`
- [ ] `module` points to `./dist/index.mjs`
- [ ] `types` points to `./dist/index.d.ts`
- [ ] `exports` field has entries for `.`, `./client`, `./server`, `./types`, `./constants`
- [ ] `peerDependencies` includes `next`, `react`, `react-dom`
- [ ] `publishConfig.access` is `public`

### 5. Verify Client Bundle Has "use client" Directive

```bash
head -1 dist/client/index.js
head -1 dist/client/index.mjs
```

- [ ] Both files start with `"use client";`

### 6. Check Package Contents

```bash
npm pack --dry-run
```

- [ ] All expected files are included:
  - `dist/` folder with built files (index, client, server, types, constants)
  - `README.md`, `LICENSE`, `CHANGELOG.md`
- [ ] No unnecessary files (node_modules, .git, __tests__, src/, etc.)

### 7. Run Package Verification Script

```bash
./verify-package.sh
```

- [ ] All checks pass
- [ ] Status shows "PAQUETE LISTO PARA PRODUCCIÓN"

### 8. Test prepublishOnly Script

```bash
npm run prepublishOnly
```

- [ ] Clean, lint, build, and test all pass
- [ ] `dist/` folder is generated correctly

### 9. Dry Run Publish

```bash
npm publish --dry-run
```

- [ ] No errors
- [ ] Package size is reasonable (< 100KB)

### 10. Git Status Check

```bash
git status
```

- [ ] No uncommitted changes
- [ ] Working directory is clean

### 11. Verify Branch

```bash
git branch --show-current
```

- [ ] On `main` branch
- [ ] Branch is up to date with remote

---

## Release Process

**⚠️ DO NOT run `npm publish` locally!**

1. Commit all changes:
   ```bash
   git add -A
   git commit -m "chore: prepare release v{version}"
   git push origin main
   ```

2. Create a GitHub Release (use `| cat` to avoid terminal issues):
   ```bash
   gh release create v{version} --title "v{version}" --notes "$(cat << 'EOF'
   ## What's Changed
   
   - [Copy changes from CHANGELOG.md]
   
   **Full Changelog**: https://github.com/SilverAssist/recaptcha/compare/v{previous_version}...v{version}
   EOF
   )" | cat
   ```

   Or via GitHub UI:
   - Go to: https://github.com/SilverAssist/recaptcha/releases/new
   - Tag: `v{version}` (create new tag)
   - Title: `v{version}`
   - Description: Copy from CHANGELOG.md
   - Click "Publish release"

3. The `publish.yml` workflow will automatically:
   - Run lint and tests
   - Build the package
   - Publish to npm
   - Create a summary

4. Verify publication:
   - Check workflow: https://github.com/SilverAssist/recaptcha/actions
   - Check npm: https://www.npmjs.com/package/@silverassist/recaptcha

5. Sync tags locally:
   ```bash
   git fetch --tags | cat
   ```

---

## Post-Release Verification

After the release is published:

```bash
# Install from npm to verify
npm install @silverassist/recaptcha@{version}

# Test the imports work
node -e "import('@silverassist/recaptcha').then(m => console.log('Main:', Object.keys(m)))"
node -e "import('@silverassist/recaptcha/server').then(m => console.log('Server:', Object.keys(m)))"
```

### Test in a Next.js Project

```tsx
// app/test-recaptcha/page.tsx
import { validateRecaptcha, isRecaptchaEnabled } from "@silverassist/recaptcha/server";
import { RecaptchaWrapper } from "@silverassist/recaptcha/client";

export default function TestPage() {
  return (
    <form>
      <RecaptchaWrapper action="test" />
      <button type="submit">Test</button>
    </form>
  );
}
```

---

## Rollback (if needed)

If something goes wrong after publishing:

1. **npm:** `npm deprecate @silverassist/recaptcha@{version} "reason"`
2. **GitHub:** Delete the release and tag
3. Fix the issue and release a patch version

---

## Version Bump Reference

After release, update version for next development cycle in:

1. **`package.json`** → `version` field
2. **Source JSDoc headers** → `@version` tag in:
   - `src/index.ts`
   - `src/client/index.tsx`
   - `src/server/index.ts`
   - `src/types/index.ts`
   - `src/constants/index.ts`

**Semantic Versioning:**

- **Patch** (bug fixes): `0.1.0` → `0.1.1`
- **Minor** (new features, backward compatible): `0.1.0` → `0.2.0`
- **Major** (breaking changes): `0.1.0` → `1.0.0`

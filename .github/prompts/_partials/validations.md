# Validations Partial

Reusable validation steps for code quality checks.

## Usage

Include these steps in prompts that require code validation before proceeding.

---

## Code Quality Validation Steps

### Step: Run Validations

**Run all code quality checks:**

1. **Lint check**:
   - Run `npm run lint` to check for linting errors
   - Fix any auto-fixable issues with `npm run lint -- --fix`
   - Report any remaining issues that need manual attention

2. **Type check**:
   - Run `npm run type-check` to verify TypeScript compilation
   - Identify and fix any type errors
   - Ensure no `any` types were introduced

3. **Test suite**:
   - Run `npm test` to execute all unit tests
   - Review test coverage if available
   - Identify any failing tests and suggest fixes
   - Ensure no regressions were introduced

4. **Report results**:
   - ✅ List all passed checks
   - ⚠️ List warnings that should be addressed
   - ❌ List blockers that must be fixed before proceeding

---

## Quick Validation (Minimal)

For quick checks without full test suite:

```bash
npm run lint && npm run type-check
```

---

## Full Validation (Comprehensive)

For complete validation before PR:

```bash
npm run lint && npm run type-check && npm test
```

---

## Validation Checklist

- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] No `console.log` or debug statements
- [ ] No sensitive data exposed (API keys, secrets)
- [ ] No `any` types introduced
- [ ] JSDoc comments on new functions

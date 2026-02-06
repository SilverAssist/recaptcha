---
agent: agent
description: Prepare code for a pull request by running all validations
---

# Prepare for Pull Request

Prepare the current branch for a pull request by running all validations.

## Prerequisites
- Reference: `.github/prompts/_partials/validations.md`
- Reference: `.github/prompts/_partials/git-operations.md`

## Steps

### 1. Check Branch Status

```bash
git branch --show-current
git status
git log --oneline -5
```

Verify:
- Not on protected branch (main, dev, stg, master)
- All changes are committed
- Branch follows naming: `feature/TICKET-*` or `bugfix/TICKET-*`

### 2. Code Quality Checks

#### Lint Check
```bash
npm run lint
```
- Fix auto-fixable: `npm run lint -- --fix`
- Report issues needing manual fix

#### Type Check
```bash
npm run type-check
```
- Fix any TypeScript errors
- Ensure no `any` types introduced

### 3. Run Test Suite

```bash
npm test
```
- Review test results
- Check coverage report
- Fix any failing tests

### 4. Code Review Checks

Verify:
- [ ] No `console.log` or debug statements
- [ ] No sensitive data exposed (API keys, secrets)
- [ ] No `any` types introduced
- [ ] JSDoc comments on new/modified functions
- [ ] Props interfaces documented

### 5. Review Changes

```bash
git diff --stat
git diff main --name-only
```

Check:
- Files changed align with ticket scope
- No unintended changes
- README/docs updated if needed

### 6. Commit Hygiene

Verify commit messages:
- Follow format: `TICKET-ID: Description`
- Use present tense, imperative mood
- No merge commits (rebase if needed)

Consider squashing if too many small commits:
```bash
git rebase -i HEAD~N
```

### 7. Documentation Check

- [ ] JSDoc comments on new functions
- [ ] README updated if needed
- [ ] Inline comments for complex logic
- [ ] Component props documented

## Output: Readiness Report

### ✅ Passed Checks
- List all passed checks

### ⚠️ Warnings
- Issues to address but not blockers

### ❌ Blockers
- Must fix before proceeding

### 📁 Changed Files
- List all modified files

### 📝 Summary
Brief summary for PR description

### 👥 Suggested Reviewers
Based on changed files:
- @reviewer1 (reason)
- @reviewer2 (reason)

## Next Steps
- Fix any blockers
- Address warnings
- Use `create-pr` to create the pull request

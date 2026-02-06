---
agent: agent
description: Create a pull request for the current branch
---

# Create Pull Request

Create a pull request for the current branch linked to Jira ticket **{ticket-id}**.

## Prerequisites
- Run `prepare-pr` first to ensure code is ready
- Reference: `.github/prompts/_partials/pr-template.md`
- Reference: `.github/prompts/_partials/git-operations.md`
- Reference: `.github/prompts/_partials/jira-integration.md`

## Steps

### 1. Verify Current State

```bash
git branch --show-current
git status
```

Verify:
- Branch follows convention: `feature/{ticket-id}-*` or `bugfix/{ticket-id}-*`
- All changes are committed
- Not on protected branch

### 2. Review Changes

```bash
git diff main --name-only
```

- Summarize the changes made
- Identify breaking changes or migrations

### 3. Read Jira Ticket

Fetch ticket **{ticket-id}** details:
- Get summary for PR title
- Extract acceptance criteria
- Get any context from comments

### 4. Run Final Validations

```bash
npm run lint && npm run type-check && npm test
```

Fix any issues before proceeding.

### 5. Push Branch

```bash
git push -u origin $(git branch --show-current)
```

### 6. Create Pull Request

#### PR Title
```
{ticket-id}: {Ticket Summary}
```

#### PR Description

Use this template:

```markdown
## Summary
Brief description of what this PR accomplishes.

## Jira Ticket
[{ticket-id}](https://your-org.atlassian.net/browse/{ticket-id})

## Changes Made
- Change 1: Description
- Change 2: Description
- Change 3: Description

## Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📝 Documentation
- [ ] 🔧 Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- Describe test cases here

## Screenshots
(If UI changes, add before/after screenshots)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

#### PR Settings
- **Source**: Current branch
- **Target**: `dev`
- **Reviewers**: Based on changed files

### 7. Link PR to Jira

Add comment to Jira ticket:
```markdown
## Pull Request Created
- PR: [PR Title](PR_URL)
- Target: `dev` branch
- Reviewers: @assigned-reviewers

## Changes
- Summary of changes made
```

## Output

Report:
1. ✅ PR URL
2. ✅ Jira ticket linked
3. ✅ Reviewers assigned

## Next Steps
- Wait for review
- Address feedback
- Use `finalize-pr` after approval

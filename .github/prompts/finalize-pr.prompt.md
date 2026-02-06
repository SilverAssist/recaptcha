---
agent: agent
description: Finalize a pull request after approval and prepare for merge
---

# Finalize Pull Request

Finalize PR for Jira ticket **{ticket-id}** after approval and prepare for merge.

## Prerequisites
- PR has been approved
- Reference: `.github/prompts/_partials/git-operations.md`
- Reference: `.github/prompts/_partials/validations.md`
- Reference: `.github/prompts/_partials/jira-integration.md`

## Steps

### 1. Verify PR Status

Check:
- All required approvals in place
- CI/CD pipeline passed
- No unresolved review comments

### 2. Address Review Comments

If there are unresolved comments:
- List each comment
- Address feedback
- Push additional commits if needed
- Request re-review if changes are significant

### 3. Sync with Base Branch

```bash
git fetch origin
git rebase origin/dev
```

If conflicts:
1. Resolve each conflict
2. Stage resolved files: `git add <file>`
3. Continue rebase: `git rebase --continue`

Push updated branch:
```bash
git push --force-with-lease
```

### 4. Final Validations

Run complete validation suite:
```bash
npm run lint && npm run type-check && npm test
```

Verify:
- No regressions after rebase
- All tests still pass
- No new warnings

### 5. Update Jira Ticket

Add comment:
```markdown
## Ready for Merge
- All approvals received
- CI/CD passed
- Branch synced with `dev`
- Tests passing

## Merge Notes
- Merge strategy: Squash recommended
- Post-merge: Deploy to staging for QA
```

Transition ticket to appropriate status:
- "In Review" → "Ready for QA" or
- "In Review" → "Done" (if no QA needed)

### 6. Clean Up

- [ ] Delete temporary planning docs from `docs/` (if applicable)
- [ ] Ensure final documentation is complete
- [ ] Verify commit history is clean

### 7. Prepare Merge

**Recommended merge strategy**: Squash merge

**Final commit message format**:
```
{ticket-id}: {Summary of changes}

- Key change 1
- Key change 2
- Key change 3
```

### 8. Post-Merge Tasks

After merge is complete:

```bash
# Delete local branch
git checkout dev
git pull origin dev
git branch -d <branch-name>

# Delete remote branch (if not auto-deleted)
git push origin --delete <branch-name>

# Clean up stale references
git remote prune origin
```

Update Jira:
- Transition to "Done" or "Ready for QA"
- Add deployment comment if applicable

## Output

### Completion Report

✅ **Pre-Merge Checklist**
- [ ] All approvals received
- [ ] CI/CD passed
- [ ] Branch synced with dev
- [ ] Final validations passed
- [ ] Documentation complete

✅ **Merge Ready**
- Commit message prepared
- Merge strategy confirmed

✅ **Post-Merge Tasks**
- [ ] Local branch deleted
- [ ] Remote branch deleted
- [ ] Jira ticket updated
- [ ] Team notified (if needed)

## Notes
- If merge conflicts arise during squash, resolve and complete
- Notify team if deployment is needed
- Update related documentation if this was a major feature

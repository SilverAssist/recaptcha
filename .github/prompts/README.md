# GitHub Copilot Prompts

Reusable prompt templates for GitHub Copilot agent workflows in VS Code.

## Overview

This package provides a collection of modular, reusable prompts for common development workflows. Each prompt is designed to work with GitHub Copilot's agent mode and integrates with Jira via the Atlassian MCP.

## Structure

```
prompts/
├── README.md                    # This documentation
├── _partials/                   # Shared prompt fragments
│   ├── README.md               # Partials documentation
│   ├── validations.md          # Code quality validation steps
│   ├── git-operations.md       # Git workflow operations
│   ├── jira-integration.md     # Jira/Atlassian MCP operations
│   ├── documentation.md        # Documentation standards
│   └── pr-template.md          # Pull request templates
│
├── # Workflow Prompts (Main Flow)
├── analyze-ticket.prompt.md    # 1. Analyze a Jira ticket
├── create-plan.prompt.md       # 2. Create implementation plan
├── work-ticket.prompt.md       # 3. Start working on a ticket
├── prepare-pr.prompt.md        # 4. Prepare code for PR
├── create-pr.prompt.md         # 5. Create a pull request
├── finalize-pr.prompt.md       # 6. Finalize and merge PR
│
├── # Utility Prompts
├── review-code.prompt.md       # Quick code review
├── fix-issues.prompt.md        # Fix lint/type/test errors
└── add-tests.prompt.md         # Add tests for components
```

## Workflow Stages

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Analyze     │────▶│  2. Plan        │────▶│  3. Work        │
│  analyze-ticket │     │  create-plan    │     │  work-ticket    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  6. Finalize    │◀────│  5. Create PR   │◀────│  4. Prepare     │
│  finalize-pr    │     │  create-pr      │     │  prepare-pr     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Usage

### In VS Code

1. Open the Command Palette (`Cmd+Shift+P`)
2. Search for "GitHub Copilot: Run Prompt"
3. Select the desired prompt
4. Fill in the required variables (e.g., `{ticket-id}`)

### Variables

Each prompt may require input variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{ticket-id}` | Jira ticket identifier | `WEB-726` |
| `{feature-description}` | Brief feature description | `Add font size controls` |
| `{feature-name}` | Kebab-case feature name | `font-accessibility` |

## Customization

### Adding Custom Prompts

1. Create a new `.prompt.md` file
2. Use the frontmatter format:

   ```markdown
   ---
   agent: agent
   description: Brief description of the prompt
   ---
   
   Your prompt content here...
   ```

### Frontmatter Options

| Field | Description |
|-------|-------------|
| `description` | A short description of the prompt |
| `name` | The name shown after typing `/` in chat (defaults to filename) |
| `agent` | The agent to use: `ask`, `edit`, `agent`, or custom agent name |
| `model` | Language model to use (defaults to selected model) |
| `tools` | List of tools available for this prompt |

### Using Partials

Reference shared fragments in your prompts:

```markdown
## Prerequisites
- Reference: `.github/prompts/_partials/validations.md`
```

## Integration

### Required Tools/MCPs

- **Atlassian MCP**: For Jira ticket operations
- **Git**: For version control operations
- **npm/Node.js**: For running validations

---
name: component-architecture
description: Guide for creating and organizing React components. Use this when creating new components, restructuring folders, or ensuring consistent component patterns.
---

# Component Architecture Skill

When creating or modifying React components in this project, follow these strict conventions.

## Folder Structure Rules

### CRITICAL: Naming Conventions

```
✅ CORRECT (kebab-case folders):
src/components/user-profile/index.tsx
src/components/checkout-wizard/index.tsx
src/components/contact-form/index.tsx

❌ INCORRECT (never use):
src/components/UserProfile.tsx          # No standalone files
src/components/userProfile/index.tsx    # No camelCase folders
src/components/UserProfile/index.tsx    # No PascalCase folders
```

### Component Folder Pattern

Every component MUST be in its own folder with `index.tsx`:

```
src/components/payment-form/
├── index.tsx           # ONLY the component + props interface
├── types.ts            # Shared types (if multiple)
├── helpers.ts          # Helper functions
├── constants.ts        # Component constants
└── __tests__/
    └── payment-form.test.tsx
```

## Component File Template

```typescript
// src/components/component-name/index.tsx
import { ReactNode } from "react";

interface ComponentNameProps {
  /** Description of this prop */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Brief description of what this component does
 */
export function ComponentName({
  children,
  className,
}: ComponentNameProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
```

> **Note**: If using Tailwind CSS with shadcn/ui, see `css-styling.instructions.md` for `cn()` utility usage.

## Props Interface Rules

### MUST Define Inside Component File

```typescript
// ✅ CORRECT: Props interface in same file, before component
interface ContactFormProps {
  onSubmit: (data: FormData) => void;
  initialValues?: Record<string, string>;
}

export function ContactForm({ onSubmit, initialValues }: ContactFormProps) {
  // Implementation
}
```

### Props Interface Naming

```typescript
// Interface name = ComponentName + "Props"
interface PaymentFormProps { }
interface CheckoutWizardProps { }
interface UserProfileProps { }
```

## Export Pattern

### Named Export with function keyword

```typescript
// ✅ CORRECT
export function ComponentName() { }

// ❌ INCORRECT
export default function ComponentName() { }  // No default exports
export const ComponentName = () => { }       // No arrow functions for components
```

## Separation of Concerns

### When to Create Separate Files

| File | When to Create |
|------|----------------|
| `types.ts` | Multiple types shared within component folder |
| `helpers.ts` | Pure utility functions for the component |
| `constants.ts` | Component-specific constants, configs |
| `hooks/` | Component-specific custom hooks |

### Example: Complex Component Structure

```
src/components/checkout-wizard/
├── index.tsx                    # Main wizard component
├── types.ts                     # WizardState, WizardAction, etc.
├── constants.ts                 # Step IDs, default values
├── hooks/
│   ├── use-wizard-state.ts     # State management hook
│   └── use-submission.ts       # Form submission hook
├── steps/
│   ├── shipping-step.tsx       # Shipping info step
│   └── payment-step.tsx        # Payment info step
└── __tests__/
    └── checkout-wizard.test.tsx
```

## Import Rules

### ALWAYS Use Absolute Imports

```typescript
// ✅ CORRECT: Absolute imports with @/
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

// ❌ INCORRECT: Relative imports
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
```

## Domain Organization

Components are organized by business domain:

```
src/components/
├── auth/               # Authentication components
├── dashboard/          # Dashboard components
├── forms/              # Form components (contact, wizard)
├── checkout/           # Checkout/payment flow components
├── layout/             # Header, footer, navigation
├── shared/             # Cross-domain reusable components
└── ui/                 # Primitive UI components (shadcn/ui)
```

## Hook Placement Rules

### CRITICAL: All hooks BEFORE conditional returns

```typescript
// ✅ CORRECT
export function Component({ data }: Props) {
  const [state, setState] = useState(initialState);
  const handleClick = useCallback(() => {}, []);

  // Early returns AFTER all hooks
  if (!data) return null;
  
  return <div>...</div>;
}

// ❌ INCORRECT: Hooks after conditional
export function Component({ data }: Props) {
  if (!data) return null;  // ❌ Early return before hooks
  
  const [state, setState] = useState(initialState);  // ❌ Error!
  return <div>...</div>;
}
```

---
name: domain-driven-design
description: Guide for organizing code using Domain-Driven Design principles. Use this when creating new features, restructuring folders, or ensuring consistent project organization.
---

# Domain-Driven Design (DDD) Skill

This skill provides guidelines for organizing code following Domain-Driven Design principles.

## Core Principles

1. **Group by Domain, Not by Type** - Organize files by business domain rather than technical type
2. **Clear Boundaries** - Each domain has well-defined responsibilities
3. **Self-Documenting Structure** - Folder names clearly communicate what the code does
4. **Colocation** - Related code (components, utils, tests) lives together

## Domain Organization Rules

### ✅ DO

- Create domain folders that match business concepts
- Keep domain-specific utilities inside domain folders
- Place tests in `__tests__/` subfolders within each domain
- Use clear, descriptive folder names

### ❌ DON'T

- Create generic folders like "helpers", "services", "utils" at root level
- Mix different domain concerns in the same folder
- Create deeply nested folder structures (max 3 levels)
- Use abbreviations in folder names

## Project Structure

### Components Domain

```
src/components/
├── auth/                    # Authentication components
│   ├── login-form/
│   ├── register-form/
│   └── password-reset/
├── dashboard/               # Dashboard components
│   ├── stats-card/
│   ├── activity-feed/
│   └── charts/
├── checkout/                # Checkout flow components
│   ├── cart-summary/
│   ├── payment-form/
│   └── order-confirmation/
├── forms/                   # Reusable form components
│   ├── contact-form/
│   └── newsletter-form/
├── layout/                  # Layout components
│   ├── header/
│   ├── footer/
│   └── sidebar/
├── shared/                  # Cross-domain reusable components
│   ├── loading-spinner/
│   ├── error-boundary/
│   └── empty-state/
└── ui/                      # Primitive UI components
    ├── button/
    ├── input/
    └── modal/
```

### Library Domain

```
src/lib/
├── api/                     # API client utilities
│   ├── client.ts
│   ├── endpoints.ts
│   └── types.ts
├── auth/                    # Authentication utilities
│   ├── session.ts
│   ├── tokens.ts
│   └── permissions.ts
├── email/                   # Email automation
│   ├── templates.ts
│   ├── sender.ts
│   └── types.ts
├── payment/                 # Payment processing
│   ├── stripe.ts
│   ├── checkout.ts
│   └── types.ts
└── utils/                   # Generic utilities (keep minimal)
    ├── formatting.ts
    └── validation.ts
```

### Actions Domain (Next.js Server Actions)

```
src/actions/
├── auth/                    # Auth-related actions
│   ├── login.ts
│   ├── logout.ts
│   └── register.ts
├── checkout/                # Checkout actions
│   ├── create-order.ts
│   └── process-payment.ts
├── forms/                   # Form submission actions
│   ├── contact.ts
│   └── newsletter.ts
└── user/                    # User management actions
    ├── update-profile.ts
    └── change-password.ts
```

## Barrel Export Pattern

Use **barrel exports** (`index.ts`) for folders with multiple internal files:

### When to Create Barrel Exports

- ✅ Domain folders with 3+ files
- ✅ Component folders with multiple related components
- ✅ When you want to hide internal file structure
- ❌ Single-file folders (unnecessary)

### Example

```typescript
// src/lib/api/index.ts
export * from "./client";
export * from "./endpoints";
export * from "./types";

// Usage - Clean imports from domain
import { 
  apiClient,
  fetchUser,
  type ApiResponse,
} from "@/lib/api";
```

### Barrel Export Rules

```typescript
// ✅ CORRECT: Re-export from index
// src/lib/payment/index.ts
export { createCheckout } from "./checkout";
export { processPayment } from "./stripe";
export type { PaymentIntent, CheckoutSession } from "./types";

// ✅ Usage
import { createCheckout, processPayment } from "@/lib/payment";

// ❌ INCORRECT: Direct file imports when barrel exists
import { createCheckout } from "@/lib/payment/checkout";
```

## Domain Boundaries

### Identifying Domains

Ask these questions to identify domains:

1. **What business concept does this code represent?**
2. **Who is the primary user of this functionality?**
3. **What would change together?**

### Example Domain Identification

| Feature | Domain | Reason |
|---------|--------|--------|
| Login form | `auth` | Authentication concern |
| Product card | `products` or `catalog` | Product display concern |
| Shopping cart | `checkout` | Purchase flow concern |
| User settings | `user` or `settings` | User management concern |

## Avoiding Common Mistakes

### ❌ Generic Folder Anti-Patterns

```
# ❌ BAD: Generic folders
src/
├── components/
├── helpers/        # What kind of helpers?
├── services/       # Too vague
├── utils/          # Catch-all folder
└── types/          # Types should live with their domain
```

### ✅ Domain-Oriented Structure

```
# ✅ GOOD: Domain-oriented
src/
├── components/
│   ├── auth/
│   ├── checkout/
│   └── shared/
├── lib/
│   ├── auth/
│   ├── payment/
│   └── api/
└── actions/
    ├── auth/
    └── checkout/
```

## Migration Strategy

When refactoring to DDD:

1. **Identify current pain points** - What's hard to find?
2. **Map business domains** - List all business concepts
3. **Plan folder structure** - Design new organization
4. **Migrate incrementally** - Move one domain at a time
5. **Update imports** - Use find-and-replace for import paths
6. **Add barrel exports** - Create index.ts files as you go

## Checklist

Before creating new code, verify:

- [ ] Code belongs to an identifiable business domain
- [ ] Domain folder already exists or should be created
- [ ] Related tests will live in `__tests__/` within the domain
- [ ] Imports use domain paths (not deep internal paths)
- [ ] No generic "utils" or "helpers" at root level

---
applyTo: "**/actions/**/*.ts"
---
# Server Actions Standards

## File Structure

Organize actions by domain (consistent with DDD principles):

```
actions/
├── auth/
│   ├── login.ts
│   └── register.ts
├── user/
│   └── update-profile.ts
└── contact/
    └── submit-form.ts
```

For smaller projects, flat structure is acceptable:

```
actions/
├── auth-actions.ts
├── user-actions.ts
└── contact-actions.ts
```

## Action Pattern

```typescript
"use server";

import { revalidatePath } from "next/cache";

/**
 * State returned from server actions
 */
interface ActionState {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: Record<string, string>;
}

/**
 * Creates a new user
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Action result state
 */
export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    // Validation
    if (!name || !email) {
      return {
        success: false,
        message: "Missing required fields",
        errors: {
          name: !name ? "Name is required" : "",
          email: !email ? "Email is required" : "",
        },
      };
    }

    // Process data
    const result = await saveUser({ name, email });

    // Revalidate cache
    revalidatePath("/users");

    return {
      success: true,
      message: "User created successfully",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## Key Rules

### 1. Always use "use server" directive
```typescript
"use server";
```

### 2. Return state, don't redirect
```typescript
// ❌ INCORRECT: Don't call redirect in actions
redirect("/success");

// ✅ CORRECT: Return state and handle redirect in client
return { success: true, redirectTo: "/success" };
```

### 3. Validate all inputs
```typescript
const email = formData.get("email") as string;
if (!email || !isValidEmail(email)) {
  return { success: false, message: "Invalid email" };
}
```

### 4. Handle errors gracefully
```typescript
try {
  // action logic
} catch (error) {
  return {
    success: false,
    message: error instanceof Error ? error.message : "Unknown error",
  };
}
```

### 5. Revalidate after mutations
```typescript
revalidatePath("/affected-path");
```

## Using with useActionState

```tsx
"use client";

import { useActionState } from "react";
import { createUser } from "@/actions/user-action";

const initialState = { success: false, message: "" };

export function UserForm() {
  const [state, formAction, isPending] = useActionState(
    createUser,
    initialState
  );

  return (
    <form action={formAction}>
      <input name="name" />
      <input name="email" type="email" />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

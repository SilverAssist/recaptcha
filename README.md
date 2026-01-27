# @silverassist/recaptcha

Google reCAPTCHA v3 integration for Next.js applications with Server Actions support.

[![npm version](https://img.shields.io/npm/v/@silverassist/recaptcha.svg)](https://www.npmjs.com/package/@silverassist/recaptcha)
[![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue.svg)](LICENSE)

## Features

- ✅ **Client Component**: `RecaptchaWrapper` for automatic token generation
- ✅ **Server Validation**: `validateRecaptcha` function for Server Actions
- ✅ **TypeScript Support**: Full type definitions included
- ✅ **Next.js Optimized**: Works with App Router and Server Actions
- ✅ **Auto Token Refresh**: Tokens refresh automatically before expiration
- ✅ **Graceful Degradation**: Works in development without credentials
- ✅ **Configurable Thresholds**: Custom score thresholds per form

## Installation

```bash
npm install @silverassist/recaptcha
# or
yarn add @silverassist/recaptcha
# or
pnpm add @silverassist/recaptcha
```

## Setup

### 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site with reCAPTCHA v3
3. Get your **Site Key** (public) and **Secret Key** (private)

### 2. Add Environment Variables

```bash
# .env.local
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

## Usage

### Client Component

Add `RecaptchaWrapper` inside your form:

```tsx
"use client";

import { RecaptchaWrapper } from "@silverassist/recaptcha";

export function ContactForm() {
  return (
    <form action={submitForm}>
      <RecaptchaWrapper action="contact_form" />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Server Action

Validate the token in your Server Action:

```ts
"use server";

import { validateRecaptcha, getRecaptchaToken } from "@silverassist/recaptcha/server";

export async function submitForm(formData: FormData) {
  // Get and validate reCAPTCHA token
  const token = getRecaptchaToken(formData);
  const recaptcha = await validateRecaptcha(token, "contact_form");

  if (!recaptcha.success) {
    return { success: false, message: recaptcha.error };
  }

  // Process form data...
  const email = formData.get("email");
  const message = formData.get("message");

  // Your form processing logic here

  return { success: true };
}
```

## API Reference

### RecaptchaWrapper

Client component that loads reCAPTCHA and generates tokens.

```tsx
<RecaptchaWrapper
  action="contact_form"      // Required: action name for analytics
  inputName="recaptchaToken" // Optional: hidden input name (default: "recaptchaToken")
  inputId="recaptcha-token"  // Optional: hidden input id
  siteKey="..."              // Optional: override env variable
  refreshInterval={90000}    // Optional: token refresh interval in ms (default: 90000)
  onTokenGenerated={(token) => {}} // Optional: callback when token is generated
  onError={(error) => {}}    // Optional: callback on error
/>
```

### validateRecaptcha

Server-side token validation function.

```ts
const result = await validateRecaptcha(
  token,          // Token from form
  "contact_form", // Expected action (optional)
  {
    scoreThreshold: 0.5, // Minimum score (default: 0.5)
    secretKey: "...",    // Override env variable
    debug: true,         // Enable debug logging
  }
);

// Result type:
// {
//   success: boolean,
//   score: number,
//   error?: string,
//   skipped?: boolean,
//   rawResponse?: RecaptchaVerifyResponse
// }
```

### isRecaptchaEnabled

Check if reCAPTCHA is configured.

```ts
import { isRecaptchaEnabled } from "@silverassist/recaptcha/server";

if (isRecaptchaEnabled()) {
  // Validate token
} else {
  // Skip validation (development)
}
```

### getRecaptchaToken

Extract token from FormData.

```ts
import { getRecaptchaToken } from "@silverassist/recaptcha/server";

const token = getRecaptchaToken(formData);
const token = getRecaptchaToken(formData, "customFieldName");
```

## Score Thresholds

reCAPTCHA v3 returns a score from 0.0 to 1.0:

| Score | Meaning |
|-------|---------|
| 1.0 | Very likely human |
| 0.7+ | Likely human |
| 0.5 | Default threshold |
| 0.3- | Suspicious |
| 0.0 | Very likely bot |

Adjust threshold based on form sensitivity:

```ts
// Standard forms
await validateRecaptcha(token, "contact", { scoreThreshold: 0.5 });

// Sensitive forms (payments, account creation)
await validateRecaptcha(token, "payment", { scoreThreshold: 0.7 });

// Low-risk forms (newsletter signup)
await validateRecaptcha(token, "newsletter", { scoreThreshold: 0.3 });
```

## Subpath Imports

You can import from specific subpaths for better tree-shaking:

```ts
// Main exports (client + server + types)
import { RecaptchaWrapper, validateRecaptcha } from "@silverassist/recaptcha";

// Client only
import { RecaptchaWrapper } from "@silverassist/recaptcha/client";

// Server only
import { validateRecaptcha, getRecaptchaToken, isRecaptchaEnabled } from "@silverassist/recaptcha/server";

// Types only
import type { RecaptchaValidationResult, RecaptchaWrapperProps } from "@silverassist/recaptcha/types";

// Constants only
import { DEFAULT_SCORE_THRESHOLD, RECAPTCHA_CONFIG } from "@silverassist/recaptcha/constants";
```

## Development

In development, when `RECAPTCHA_SECRET_KEY` is not set, validation is skipped and forms work normally. This allows testing without reCAPTCHA credentials.

```ts
const result = await validateRecaptcha(token, "test");
// Returns: { success: true, score: 1, skipped: true }
```

## TypeScript

Full TypeScript support with exported types:

```ts
import type {
  RecaptchaWrapperProps,
  RecaptchaValidationResult,
  RecaptchaVerifyResponse,
  RecaptchaConfig,
  RecaptchaValidationOptions,
} from "@silverassist/recaptcha";
```

## License

[Polyform Noncommercial License 1.0.0](LICENSE)

## Links

- [GitHub Repository](https://github.com/SilverAssist/recaptcha)
- [npm Package](https://www.npmjs.com/package/@silverassist/recaptcha)
- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)

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
- ✅ **Lazy Loading**: Optional lazy loading for better performance
- ✅ **Singleton Script Loading**: Prevents duplicate script loads across multiple forms

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

## ⚠️ Important: Custom FormData

`RecaptchaWrapper` injects a **hidden input field** containing the reCAPTCHA token. If your form handler creates a custom `FormData` object, you must ensure the hidden token is included.

### ❌ This will fail (token is missing):

```tsx
"use client";

import { RecaptchaWrapper } from "@silverassist/recaptcha";
import { submitForm } from "./actions"; // Your server action

export function ContactForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // ❌ Creating empty FormData - hidden reCAPTCHA input is NOT included!
    const formData = new FormData();
    formData.set("email", "user@example.com");
    formData.set("message", "Hello");
    
    await submitForm(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <RecaptchaWrapper action="contact_form" />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

### ✅ Recommended: Pass form element to capture all inputs

```tsx
"use client";

import { RecaptchaWrapper } from "@silverassist/recaptcha";
import { submitForm } from "./actions"; // Your server action

export function ContactForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // ✅ Pass form element - captures ALL inputs including hidden reCAPTCHA token
    const formData = new FormData(e.currentTarget);
    
    await submitForm(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <RecaptchaWrapper action="contact_form" />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

### ✅ Alternative: Start with form element, then modify

```tsx
"use client";

import { RecaptchaWrapper } from "@silverassist/recaptcha";
import { submitForm } from "./actions"; // Your server action

export function ContactForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // ✅ Start with form element (includes hidden token)
    const formData = new FormData(e.currentTarget);
    
    // Then add/override specific fields
    formData.set("customField", "customValue");
    formData.set("timestamp", Date.now().toString());
    
    await submitForm(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <RecaptchaWrapper action="contact_form" />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Performance Optimization: Lazy Loading

The `lazy` prop enables lazy loading of the reCAPTCHA script, which defers loading until the form becomes visible in the viewport. This significantly improves initial page load performance.

### Performance Benefits

| Metric | Without Lazy Loading | With Lazy Loading | Improvement |
|--------|---------------------|-------------------|-------------|
| **Initial JS** | 320KB+ | 0 KB (until visible) | -320KB |
| **TBT (Total Blocking Time)** | ~470ms | ~0ms (deferred) | -470ms |
| **TTI (Time to Interactive)** | +2-3s | Minimal impact | -2-3s |

### Basic Lazy Loading

Enable lazy loading by adding the `lazy` prop:

```tsx
"use client";

import { RecaptchaWrapper } from "@silverassist/recaptcha";

export function ContactForm() {
  return (
    <form action={submitForm}>
      {/* Script loads only when form is near viewport */}
      <RecaptchaWrapper action="contact_form" lazy />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Custom Root Margin

Control when the script loads with the `lazyRootMargin` prop (default: `"200px"`):

```tsx
// Load script earlier (400px before entering viewport)
<RecaptchaWrapper action="contact_form" lazy lazyRootMargin="400px" />

// Load script later (load only when fully visible)
<RecaptchaWrapper action="contact_form" lazy lazyRootMargin="0px" />

// Load with negative margin (load only after scrolling past)
<RecaptchaWrapper action="contact_form" lazy lazyRootMargin="-100px" />
```

### Best Practices

#### 1. Use lazy loading for below-the-fold forms

```tsx
// Hero form (above the fold) - load immediately
<RecaptchaWrapper action="hero_signup" />

// Footer form (below the fold) - lazy load
<RecaptchaWrapper action="footer_contact" lazy />
```

#### 2. Multiple forms on the same page

The package automatically uses singleton script loading, so the script is only loaded once even with multiple forms:

```tsx
export function MultiFormPage() {
  return (
    <>
      {/* First form triggers script load */}
      <RecaptchaWrapper action="newsletter" lazy />
      
      {/* Second form reuses the same script */}
      <RecaptchaWrapper action="contact" lazy />
      
      {/* Third form also reuses the script */}
      <RecaptchaWrapper action="feedback" lazy />
    </>
  );
}
```

#### 3. Adjust root margin based on form position

```tsx
// Form near top - smaller margin for faster load
<RecaptchaWrapper action="signup" lazy lazyRootMargin="100px" />

// Form far down page - larger margin to load in advance
<RecaptchaWrapper action="newsletter" lazy lazyRootMargin="500px" />
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
  lazy={false}               // Optional: enable lazy loading (default: false)
  lazyRootMargin="200px"     // Optional: IntersectionObserver rootMargin (default: "200px")
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `action` | `string` | **Required** | Action name for reCAPTCHA analytics (e.g., "contact_form", "signup") |
| `inputName` | `string` | `"recaptchaToken"` | Name attribute for the hidden input field |
| `inputId` | `string` | `"recaptcha-token"` | ID attribute for the hidden input field |
| `siteKey` | `string` | `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Override the site key from environment variable |
| `refreshInterval` | `number` | `90000` | Token refresh interval in milliseconds (90 seconds) |
| `onTokenGenerated` | `(token: string) => void` | `undefined` | Callback invoked when a new token is generated |
| `onError` | `(error: Error) => void` | `undefined` | Callback invoked when an error occurs |
| `lazy` | `boolean` | `false` | Enable lazy loading to defer script until form is visible |
| `lazyRootMargin` | `string` | `"200px"` | IntersectionObserver rootMargin (used when `lazy` is true) |

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

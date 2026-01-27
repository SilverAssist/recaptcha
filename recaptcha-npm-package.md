# @silverassist/recaptcha - NPM Package Documentation

> **Version**: 0.1.0 | **Status**: Ready for Development | **Created**: January 2026

## 📋 Overview

`@silverassist/recaptcha` is a reusable npm package that provides complete Google reCAPTCHA v3 integration for Next.js applications. It includes both client-side token generation components and server-side validation utilities.

### Features

- ✅ **Client Component**: `RecaptchaWrapper` for automatic token generation
- ✅ **Server Validation**: `validateRecaptcha` function for Server Actions
- ✅ **TypeScript Support**: Full type definitions included
- ✅ **Next.js Optimized**: Works with App Router and Server Actions
- ✅ **Auto Token Refresh**: Tokens refresh automatically before expiration
- ✅ **Graceful Degradation**: Works in development without credentials
- ✅ **Configurable Thresholds**: Custom score thresholds per form

---

## 📁 Package Structure

```
@silverassist/recaptcha/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── README.md
├── LICENSE
├── CHANGELOG.md
├── .npmignore
├── .gitignore
├── jest.config.cjs
├── jest.setup.js
├── src/
│   ├── index.ts                    # Main entry point (exports all)
│   ├── client/
│   │   └── index.tsx               # RecaptchaWrapper component
│   ├── server/
│   │   └── index.ts                # validateRecaptcha function
│   ├── types/
│   │   └── index.ts                # All type definitions
│   └── constants/
│       └── index.ts                # Configuration constants
├── dist/                           # Compiled output (generated)
│   ├── index.js
│   ├── index.d.ts
│   ├── client/
│   ├── server/
│   ├── types/
│   └── constants/
└── __tests__/
    ├── client.test.tsx
    ├── server.test.ts
    └── integration.test.ts
```

---

## 📦 Package Configuration Files

### package.json

```json
{
  "name": "@silverassist/recaptcha",
  "version": "0.1.0",
  "description": "Google reCAPTCHA v3 integration for Next.js applications with Server Actions support",
  "author": "Miguel Colmenares <me@miguelcolmenares.com>",
  "license": "Polyform Noncommercial License 1.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/SilverAssist/recaptcha.git"
  },
  "bugs": {
    "url": "https://github.com/SilverAssist/recaptcha/issues"
  },
  "homepage": "https://github.com/SilverAssist/recaptcha#readme",
  "keywords": [
    "recaptcha",
    "google-recaptcha",
    "recaptcha-v3",
    "nextjs",
    "next",
    "react",
    "server-actions",
    "form-validation",
    "spam-protection",
    "bot-detection"
  ],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    },
    "./client": {
      "import": {
        "types": "./dist/client/index.d.mts",
        "default": "./dist/client/index.mjs"
      },
      "require": {
        "types": "./dist/client/index.d.ts",
        "default": "./dist/client/index.js"
      }
    },
    "./server": {
      "import": {
        "types": "./dist/server/index.d.mts",
        "default": "./dist/server/index.mjs"
      },
      "require": {
        "types": "./dist/server/index.d.ts",
        "default": "./dist/server/index.js"
      }
    },
    "./types": {
      "import": {
        "types": "./dist/types/index.d.mts",
        "default": "./dist/types/index.mjs"
      },
      "require": {
        "types": "./dist/types/index.d.ts",
        "default": "./dist/types/index.js"
      }
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "clean": "rm -rf dist",
    "dev": "tsup --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "prepublishOnly": "npm run clean && npm run build && npm run test",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit",
    "release": "npm run prepublishOnly && npm publish --access public"
  },
  "peerDependencies": {
    "next": ">=14.0.0",
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^15.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "next": "^15.0.0",
    "prettier": "^3.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ts-jest": "^29.1.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/index": "src/client/index.tsx",
    "server/index": "src/server/index.ts",
    "types/index": "src/types/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
  treeshake: true,
  minify: false,
  banner: {
    js: '"use client";',
  },
  esbuildOptions(options) {
    options.banner = {
      js: '// @silverassist/recaptcha - Google reCAPTCHA v3 for Next.js',
    };
  },
});
```

### jest.config.cjs

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### jest.setup.js

```javascript
import '@testing-library/jest-dom';

// Mock Next.js Script component
jest.mock('next/script', () => {
  return function MockScript({ onLoad, ...props }) {
    // Simulate script load
    if (onLoad) {
      setTimeout(onLoad, 0);
    }
    return null;
  };
});
```

### .npmignore

```
# Source files
src/
__tests__/
*.test.ts
*.test.tsx

# Config files
tsconfig.json
tsup.config.ts
jest.config.cjs
jest.setup.js
.eslintrc.js
.prettierrc

# Development files
.env*
.gitignore
.github/
.vscode/

# Build artifacts
*.log
coverage/
.turbo/
```

---

## 📝 Source Code Files

### src/index.ts (Main Entry Point)

```typescript
/**
 * @silverassist/recaptcha
 *
 * Google reCAPTCHA v3 integration for Next.js applications.
 * Provides both client-side token generation and server-side validation.
 *
 * @example Client-side usage
 * ```tsx
 * import { RecaptchaWrapper } from '@silverassist/recaptcha';
 *
 * <form action={formAction}>
 *   <RecaptchaWrapper action="contact_form" />
 *   <input name="email" type="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example Server-side usage
 * ```ts
 * import { validateRecaptcha } from '@silverassist/recaptcha/server';
 *
 * const result = await validateRecaptcha(token, 'contact_form');
 * if (!result.success) {
 *   return { success: false, message: result.error };
 * }
 * ```
 *
 * @packageDocumentation
 */

// Client exports
export { RecaptchaWrapper } from './client';

// Server exports
export { validateRecaptcha, isRecaptchaEnabled } from './server';

// Type exports
export type {
  RecaptchaWrapperProps,
  RecaptchaValidationResult,
  RecaptchaVerifyResponse,
  RecaptchaConfig,
} from './types';

// Constants exports
export { RECAPTCHA_CONFIG, DEFAULT_SCORE_THRESHOLD } from './constants';
```

### src/client/index.tsx (Client Component)

```tsx
/**
 * reCAPTCHA v3 Client Component
 *
 * Loads the Google reCAPTCHA script and generates tokens automatically.
 * Place inside a form to add invisible spam protection.
 *
 * @see https://developers.google.com/recaptcha/docs/v3
 */

"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import type { RecaptchaWrapperProps } from "../types";
import { RECAPTCHA_CONFIG } from "../constants";

/**
 * RecaptchaWrapper - Client component for reCAPTCHA v3 integration
 *
 * Features:
 * - Loads reCAPTCHA script automatically
 * - Generates token when script loads
 * - Refreshes token periodically (tokens expire after 2 minutes)
 * - Stores token in hidden input field for form submission
 * - Graceful fallback when not configured
 *
 * @example Basic usage
 * ```tsx
 * <form action={formAction}>
 *   <RecaptchaWrapper action="contact_form" />
 *   <input name="email" type="email" required />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example Custom input name
 * ```tsx
 * <RecaptchaWrapper
 *   action="signup"
 *   inputName="captchaToken"
 *   inputId="signup-captcha"
 * />
 * ```
 */
export function RecaptchaWrapper({
  action,
  inputName = "recaptchaToken",
  inputId = "recaptcha-token",
  siteKey: propSiteKey,
  refreshInterval = RECAPTCHA_CONFIG.tokenRefreshInterval,
  onTokenGenerated,
  onError,
}: RecaptchaWrapperProps) {
  // Use prop siteKey or fall back to environment variable
  const siteKey = propSiteKey ?? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Execute reCAPTCHA and store token
  const executeRecaptcha = useCallback(async () => {
    if (!siteKey) {
      console.warn("[reCAPTCHA] Site key not configured");
      return;
    }

    if (typeof window === "undefined" || !window.grecaptcha) {
      return;
    }

    try {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action });

          if (tokenInputRef.current) {
            tokenInputRef.current.value = token;
          }

          // Call optional callback
          onTokenGenerated?.(token);
        } catch (error) {
          console.error("[reCAPTCHA] Token generation failed:", error);
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      });
    } catch (error) {
      console.error("[reCAPTCHA] Execution failed:", error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [siteKey, action, onTokenGenerated, onError]);

  // Set up token refresh interval (tokens expire after 2 minutes)
  useEffect(() => {
    // Generate token immediately when component mounts
    executeRecaptcha();

    // Refresh token periodically to ensure it's always valid
    refreshIntervalRef.current = setInterval(executeRecaptcha, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [executeRecaptcha, refreshInterval]);

  // Don't render anything if site key is not configured
  if (!siteKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. reCAPTCHA is disabled."
      );
    }
    return null;
  }

  return (
    <>
      {/* Load reCAPTCHA script */}
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
        strategy="afterInteractive"
        onLoad={executeRecaptcha}
        onError={(e) => {
          console.error("[reCAPTCHA] Script load failed:", e);
          onError?.(new Error("reCAPTCHA script failed to load"));
        }}
      />

      {/* Hidden input to store the token */}
      <input
        type="hidden"
        name={inputName}
        id={inputId}
        ref={tokenInputRef}
        aria-hidden="true"
        data-testid="recaptcha-token-input"
      />
    </>
  );
}

export default RecaptchaWrapper;
```

### src/server/index.ts (Server Validation)

```typescript
/**
 * reCAPTCHA v3 Server-Side Validation
 *
 * Functions for validating reCAPTCHA tokens in Next.js Server Actions.
 *
 * @see https://developers.google.com/recaptcha/docs/verify
 */

import type { RecaptchaValidationResult, RecaptchaVerifyResponse } from "../types";
import { RECAPTCHA_CONFIG, DEFAULT_SCORE_THRESHOLD } from "../constants";

/**
 * Validate a reCAPTCHA token with Google's API
 *
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The expected action name (optional, for extra security)
 * @param options - Additional validation options
 * @returns Validation result with success status and score
 *
 * @example Basic validation
 * ```ts
 * const result = await validateRecaptcha(token, "contact_form");
 * if (!result.success) {
 *   return { success: false, message: result.error };
 * }
 * ```
 *
 * @example Custom threshold for sensitive forms
 * ```ts
 * const result = await validateRecaptcha(token, "payment_form", {
 *   scoreThreshold: 0.7, // Higher threshold for payments
 *   secretKey: process.env.RECAPTCHA_SECRET_KEY,
 * });
 * ```
 */
export async function validateRecaptcha(
  token: string | null | undefined,
  expectedAction?: string,
  options: {
    scoreThreshold?: number;
    secretKey?: string;
    verifyUrl?: string;
    debug?: boolean;
  } = {}
): Promise<RecaptchaValidationResult> {
  const {
    scoreThreshold = DEFAULT_SCORE_THRESHOLD,
    secretKey = process.env.RECAPTCHA_SECRET_KEY,
    verifyUrl = RECAPTCHA_CONFIG.verifyUrl,
    debug = process.env.NODE_ENV === "development",
  } = options;

  // Check if reCAPTCHA is configured
  if (!secretKey) {
    if (debug) {
      console.warn("[reCAPTCHA] Secret key not configured. Skipping validation.");
    }
    // Return success to allow form submission when reCAPTCHA is not configured
    // This is useful for development environments
    return {
      success: true,
      score: 1.0,
      error: "reCAPTCHA not configured - validation skipped",
    };
  }

  // Check if token is provided
  if (!token) {
    return {
      success: false,
      score: 0,
      error: "reCAPTCHA token is missing",
    };
  }

  try {
    // Verify token with Google
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        score: 0,
        error: `reCAPTCHA API error: ${response.status}`,
      };
    }

    const data: RecaptchaVerifyResponse = await response.json();

    // Log for debugging
    if (debug) {
      console.log("[reCAPTCHA] Verification response:", {
        success: data.success,
        score: data.score,
        action: data.action,
        hostname: data.hostname,
        errors: data["error-codes"],
      });
    }

    // Check if verification was successful
    if (!data.success) {
      return {
        success: false,
        score: 0,
        error: `reCAPTCHA verification failed: ${data["error-codes"]?.join(", ") || "Unknown error"}`,
        errorCodes: data["error-codes"],
        rawResponse: data,
      };
    }

    // Check score threshold
    const score = data.score ?? 0;
    if (score < scoreThreshold) {
      return {
        success: false,
        score,
        error: `reCAPTCHA score too low (${score} < ${scoreThreshold})`,
        rawResponse: data,
      };
    }

    // Verify action matches (optional but recommended)
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        score,
        error: `reCAPTCHA action mismatch (expected: ${expectedAction}, got: ${data.action})`,
        rawResponse: data,
      };
    }

    // All checks passed
    return {
      success: true,
      score,
      rawResponse: data,
    };
  } catch (error) {
    console.error("[reCAPTCHA] Validation error:", error);
    return {
      success: false,
      score: 0,
      error:
        error instanceof Error
          ? error.message
          : "reCAPTCHA validation failed unexpectedly",
    };
  }
}

/**
 * Check if reCAPTCHA is enabled (secret key is configured)
 *
 * @param secretKey - Optional explicit secret key to check
 * @returns true if reCAPTCHA is configured
 *
 * @example
 * ```ts
 * if (isRecaptchaEnabled()) {
 *   // Require reCAPTCHA validation
 * } else {
 *   // Skip validation in development
 * }
 * ```
 */
export function isRecaptchaEnabled(secretKey?: string): boolean {
  return !!(secretKey ?? process.env.RECAPTCHA_SECRET_KEY);
}

/**
 * Extract reCAPTCHA token from FormData
 *
 * @param formData - Form data containing the token
 * @param fieldName - Name of the token field (default: "recaptchaToken")
 * @returns The token string or null
 *
 * @example
 * ```ts
 * export async function submitForm(prevState: State, formData: FormData) {
 *   const token = getRecaptchaToken(formData);
 *   const result = await validateRecaptcha(token, "contact_form");
 *   // ...
 * }
 * ```
 */
export function getRecaptchaToken(
  formData: FormData,
  fieldName: string = "recaptchaToken"
): string | null {
  const token = formData.get(fieldName);
  return typeof token === "string" ? token : null;
}
```

### src/types/index.ts (Type Definitions)

```typescript
/**
 * reCAPTCHA v3 Integration Types
 *
 * Type definitions for Google reCAPTCHA v3 integration
 * with Next.js Server Actions validation.
 */

/**
 * reCAPTCHA v3 verification API response from Google
 * @see https://developers.google.com/recaptcha/docs/v3#site_verify_response
 */
export interface RecaptchaVerifyResponse {
  /** Whether the verification was successful */
  success: boolean;
  /** Score for this request (0.0 - 1.0) */
  score?: number;
  /** The action name for this request (important to verify) */
  action?: string;
  /** Timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ) */
  challenge_ts?: string;
  /** The hostname of the site where the reCAPTCHA was solved */
  hostname?: string;
  /** Optional error codes */
  "error-codes"?: string[];
}

/**
 * Result of reCAPTCHA validation in server action
 */
export interface RecaptchaValidationResult {
  /** Whether the validation passed */
  success: boolean;
  /** Score from Google (0.0 - 1.0) - higher is more likely human */
  score: number;
  /** Error message if validation failed */
  error?: string;
  /** Original error codes from Google */
  errorCodes?: string[];
  /** Raw response from Google (for debugging) */
  rawResponse?: RecaptchaVerifyResponse;
}

/**
 * Props for RecaptchaWrapper client component
 */
export interface RecaptchaWrapperProps {
  /** Action name for reCAPTCHA analytics (e.g., "contact_form", "signup") */
  action: string;
  /** Name of the hidden input field (default: "recaptchaToken") */
  inputName?: string;
  /** Custom ID for the hidden input */
  inputId?: string;
  /** Site key override (default: reads from NEXT_PUBLIC_RECAPTCHA_SITE_KEY) */
  siteKey?: string;
  /** Token refresh interval in ms (default: 90000 - 90 seconds) */
  refreshInterval?: number;
  /** Callback when token is generated */
  onTokenGenerated?: (token: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Configuration options for reCAPTCHA validation
 */
export interface RecaptchaConfig {
  /** Google reCAPTCHA verification endpoint */
  verifyUrl: string;
  /** Default score threshold (0.5 recommended by Google) */
  defaultScoreThreshold: number;
  /** Token refresh interval in milliseconds */
  tokenRefreshInterval: number;
}

/**
 * Options for validateRecaptcha function
 */
export interface RecaptchaValidationOptions {
  /** Minimum score to pass (default: 0.5) */
  scoreThreshold?: number;
  /** Secret key override (default: reads from RECAPTCHA_SECRET_KEY) */
  secretKey?: string;
  /** Verification URL override */
  verifyUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Global window interface extension for reCAPTCHA
 */
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}
```

### src/constants/index.ts (Configuration Constants)

```typescript
/**
 * reCAPTCHA Configuration Constants
 *
 * Default configuration values for reCAPTCHA v3 integration.
 * These can be overridden when calling the validation functions.
 */

import type { RecaptchaConfig } from "../types";

/**
 * Default score threshold for validation
 * Google recommends 0.5 as a starting point
 */
export const DEFAULT_SCORE_THRESHOLD = 0.5;

/**
 * Token refresh interval in milliseconds
 * reCAPTCHA tokens expire after 2 minutes (120 seconds)
 * We refresh at 90 seconds to ensure tokens are always valid
 */
export const DEFAULT_TOKEN_REFRESH_INTERVAL = 90000;

/**
 * reCAPTCHA v3 configuration constants
 */
export const RECAPTCHA_CONFIG: RecaptchaConfig = {
  /** Google reCAPTCHA verification endpoint */
  verifyUrl: "https://www.google.com/recaptcha/api/siteverify",
  /** Default score threshold (0.5 is Google's recommendation) */
  defaultScoreThreshold: DEFAULT_SCORE_THRESHOLD,
  /** Token refresh interval in milliseconds (90 seconds) */
  tokenRefreshInterval: DEFAULT_TOKEN_REFRESH_INTERVAL,
} as const;
```

---

## 🧪 Test Files

### \_\_tests\_\_/server.test.ts

```typescript
/**
 * Server-side validation tests
 */

import { validateRecaptcha, isRecaptchaEnabled, getRecaptchaToken } from "../src/server";

// Store original env
const originalEnv = process.env;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("validateRecaptcha", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should validate a successful token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          score: 0.9,
          action: "contact_form",
          hostname: "example.com",
        }),
    });

    const result = await validateRecaptcha("valid-token", "contact_form");

    expect(result.success).toBe(true);
    expect(result.score).toBe(0.9);
  });

  it("should reject low score", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          score: 0.1,
          action: "contact_form",
        }),
    });

    const result = await validateRecaptcha("bot-token", "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("score too low");
  });

  it("should reject action mismatch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          score: 0.9,
          action: "different_action",
        }),
    });

    const result = await validateRecaptcha("token", "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("action mismatch");
  });

  it("should skip validation when not configured", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;

    const result = await validateRecaptcha("any-token", "any_action");

    expect(result.success).toBe(true);
    expect(result.score).toBe(1.0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should fail when token is missing", async () => {
    const result = await validateRecaptcha(null, "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toBe("reCAPTCHA token is missing");
  });
});

describe("isRecaptchaEnabled", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return true when secret key is set", () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-key";
    expect(isRecaptchaEnabled()).toBe(true);
  });

  it("should return false when secret key is not set", () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(isRecaptchaEnabled()).toBe(false);
  });

  it("should accept explicit secret key", () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(isRecaptchaEnabled("explicit-key")).toBe(true);
  });
});

describe("getRecaptchaToken", () => {
  it("should extract token from FormData", () => {
    const formData = new FormData();
    formData.append("recaptchaToken", "test-token");

    expect(getRecaptchaToken(formData)).toBe("test-token");
  });

  it("should return null when token is missing", () => {
    const formData = new FormData();

    expect(getRecaptchaToken(formData)).toBeNull();
  });

  it("should use custom field name", () => {
    const formData = new FormData();
    formData.append("customToken", "test-token");

    expect(getRecaptchaToken(formData, "customToken")).toBe("test-token");
  });
});
```

### \_\_tests\_\_/client.test.tsx

```typescript
/**
 * Client component tests
 */

import { render, screen, waitFor } from "@testing-library/react";
import { RecaptchaWrapper } from "../src/client";

// Store original env
const originalEnv = process.env;

describe("RecaptchaWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    // Mock grecaptcha
    (window as any).grecaptcha = {
      ready: jest.fn((cb) => cb()),
      execute: jest.fn().mockResolvedValue("test-token"),
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should render hidden input", async () => {
    render(<RecaptchaWrapper action="contact_form" />);

    await waitFor(() => {
      const input = screen.getByTestId("recaptcha-token-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "hidden");
      expect(input).toHaveAttribute("name", "recaptchaToken");
    });
  });

  it("should use custom input name", async () => {
    render(<RecaptchaWrapper action="signup" inputName="captcha" />);

    await waitFor(() => {
      const input = screen.getByTestId("recaptcha-token-input");
      expect(input).toHaveAttribute("name", "captcha");
    });
  });

  it("should call onTokenGenerated callback", async () => {
    const onTokenGenerated = jest.fn();
    render(
      <RecaptchaWrapper
        action="contact_form"
        onTokenGenerated={onTokenGenerated}
      />
    );

    await waitFor(() => {
      expect(onTokenGenerated).toHaveBeenCalledWith("test-token");
    });
  });

  it("should render nothing when site key is not set", () => {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    const { container } = render(<RecaptchaWrapper action="test" />);

    expect(container.innerHTML).toBe("");
  });
});
```

---

## 📖 README.md

```markdown
# @silverassist/recaptcha

Google reCAPTCHA v3 integration for Next.js applications with Server Actions support.

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
    return { success: false, error: "Security check failed" };
  }
  
  // Process form...
  const email = formData.get("email");
  const message = formData.get("message");
  
  // ...
  
  return { success: true };
}
```

## API Reference

### RecaptchaWrapper

Client component that loads reCAPTCHA and generates tokens.

```tsx
<RecaptchaWrapper
  action="contact_form"      // Required: action name for analytics
  inputName="recaptchaToken" // Optional: hidden input name
  inputId="recaptcha-token"  // Optional: hidden input ID
  siteKey="..."              // Optional: override env variable
  refreshInterval={90000}    // Optional: token refresh interval (ms)
  onTokenGenerated={(token) => {}} // Optional: callback on token generation
  onError={(error) => {}}    // Optional: callback on error
/>
```

### validateRecaptcha

Server-side token validation function.

```ts
const result = await validateRecaptcha(
  token,          // Token from form
  "contact_form", // Expected action
  {
    scoreThreshold: 0.5, // Minimum score (0-1)
    secretKey: "...",    // Override env variable
    debug: true,         // Enable debug logging
  }
);

// Result:
// {
//   success: boolean,
//   score: number,
//   error?: string,
//   rawResponse?: RecaptchaVerifyResponse
// }
```

### isRecaptchaEnabled

Check if reCAPTCHA is configured.

```ts
if (isRecaptchaEnabled()) {
  // Validate token
} else {
  // Skip validation (development)
}
```

### getRecaptchaToken

Extract token from FormData.

```ts
const token = getRecaptchaToken(formData);
const token = getRecaptchaToken(formData, "customFieldName");
```

## Score Thresholds

reCAPTCHA v3 returns a score from 0.0 to 1.0:

- **1.0** - Very likely human
- **0.5** - Default threshold (recommended starting point)
- **0.0** - Very likely bot

Adjust threshold based on form sensitivity:

```ts
// Standard forms
await validateRecaptcha(token, "contact", { scoreThreshold: 0.5 });

// Sensitive forms (payments, account creation)
await validateRecaptcha(token, "payment", { scoreThreshold: 0.7 });

// Low-risk forms (newsletter signup)
await validateRecaptcha(token, "newsletter", { scoreThreshold: 0.3 });
```

## Development

In development, when `RECAPTCHA_SECRET_KEY` is not set, validation is skipped and forms work normally. This allows testing without reCAPTCHA credentials.

## License

Polyform Noncommercial License 1.0.0

---

## 🚀 Installation & Publishing Flow

### Initial Setup

```bash
# 1. Create new repository
mkdir -p packages/recaptcha
cd packages/recaptcha

# 2. Initialize package
npm init -y

# 3. Copy source files from this document

# 4. Install dependencies
npm install

# 5. Build
npm run build

# 6. Test
npm test
```

### Publishing to npm

```bash
# 1. Login to npm (first time only)
npm login --scope=@silverassist

# 2. Build and test
npm run prepublishOnly

# 3. Publish
npm publish --access public

# Or use the release script
npm run release
```

### Version Updates

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

---

## 📥 Usage in Projects

### Installation

```bash
npm install @silverassist/recaptcha
```

### Next.js Configuration

Add to `next.config.mjs` for tree-shaking optimization:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "@silverassist/recaptcha",
      // ... other packages
    ],
  },
};

export default nextConfig;
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

### Example Integration

```tsx
// app/contact/page.tsx
import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <main>
      <h1>Contact Us</h1>
      <ContactForm />
    </main>
  );
}

// components/contact-form/index.tsx
"use client";

import { useActionState } from "react";
import { RecaptchaWrapper } from "@silverassist/recaptcha";
import { submitContactForm } from "@/actions/contact";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    { success: false, message: "" }
  );

  return (
    <form action={formAction}>
      <RecaptchaWrapper action="contact_form" />
      
      <input name="email" type="email" required />
      <textarea name="message" required />
      
      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send Message"}
      </button>
      
      {state.message && <p>{state.message}</p>}
    </form>
  );
}

// actions/contact.ts
"use server";

import { validateRecaptcha, getRecaptchaToken } from "@silverassist/recaptcha/server";

interface ContactState {
  success: boolean;
  message: string;
}

export async function submitContactForm(
  prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Validate reCAPTCHA
  const token = getRecaptchaToken(formData);
  const recaptcha = await validateRecaptcha(token, "contact_form");
  
  if (!recaptcha.success) {
    console.log("reCAPTCHA failed:", recaptcha.error);
    return {
      success: false,
      message: "Security verification failed. Please try again.",
    };
  }

  // Process form
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  // Your logic here...

  return {
    success: true,
    message: "Message sent successfully!",
  };
}
```

---

## ✅ Checklist

### Package Development

- [ ] Create repository `silverassist/recaptcha`
- [ ] Set up package structure
- [ ] Implement source files
- [ ] Write unit tests
- [ ] Configure TypeScript & tsup
- [ ] Add README & documentation
- [ ] Configure npm publishing

### Testing

- [ ] All unit tests pass
- [ ] Coverage > 80%
- [ ] TypeScript compiles without errors
- [ ] Build generates correct output

### Publishing

- [ ] npm login configured for @silverassist scope
- [ ] Version set correctly
- [ ] CHANGELOG updated
- [ ] npm publish successful

### Integration Testing

- [ ] Install in aa-nextjs project
- [ ] Remove local recaptcha files
- [ ] Test contact form
- [ ] Test wizard form
- [ ] Verify production build

---

**Document Version**: 1.0  
**Created**: January 2026  
**Author**: SilverAssist Development Team

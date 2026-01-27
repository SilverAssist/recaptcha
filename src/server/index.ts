/**
 * reCAPTCHA v3 Server-Side Validation
 *
 * Functions for validating reCAPTCHA tokens in Next.js Server Actions.
 *
 * @see https://developers.google.com/recaptcha/docs/verify
 * @packageDocumentation
 */

import type {
  RecaptchaValidationResult,
  RecaptchaVerifyResponse,
  RecaptchaValidationOptions,
} from "../types";
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
 *
 * @example Skip validation in development
 * ```ts
 * const result = await validateRecaptcha(token, "test_form", {
 *   debug: true, // Enable debug logging
 * });
 * // Returns { success: true, score: 1, skipped: true } if not configured
 * ```
 */
export async function validateRecaptcha(
  token: string | null | undefined,
  expectedAction?: string,
  options: RecaptchaValidationOptions = {}
): Promise<RecaptchaValidationResult> {
  const {
    scoreThreshold = DEFAULT_SCORE_THRESHOLD,
    secretKey = process.env.RECAPTCHA_SECRET_KEY,
    debug = process.env.NODE_ENV === "development",
  } = options;

  // Check if reCAPTCHA is configured
  if (!secretKey) {
    if (debug) {
      console.warn(
        "[reCAPTCHA] Secret key not configured. Skipping validation."
      );
    }
    return {
      success: true,
      score: 1,
      skipped: true,
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
    const response = await fetch(RECAPTCHA_CONFIG.verifyUrl, {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RecaptchaVerifyResponse = await response.json();

    if (debug) {
      console.log("[reCAPTCHA] Verification response:", {
        success: data.success,
        score: data.score,
        action: data.action,
        hostname: data.hostname,
      });
    }

    // Check if verification failed
    if (!data.success) {
      return {
        success: false,
        score: 0,
        error: `reCAPTCHA verification failed: ${data["error-codes"]?.join(", ") || "Unknown error"}`,
        rawResponse: data,
      };
    }

    // Check score threshold
    if (data.score < scoreThreshold) {
      return {
        success: false,
        score: data.score,
        error: `reCAPTCHA score too low: ${data.score} (threshold: ${scoreThreshold})`,
        rawResponse: data,
      };
    }

    // Check action if provided
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        score: data.score,
        error: `reCAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}"`,
        rawResponse: data,
      };
    }

    // Validation passed
    return {
      success: true,
      score: data.score,
      rawResponse: data,
    };
  } catch (error) {
    console.error("[reCAPTCHA] Validation error:", error);
    return {
      success: false,
      score: 0,
      error:
        error instanceof Error
          ? `reCAPTCHA validation error: ${error.message}`
          : "reCAPTCHA validation error",
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

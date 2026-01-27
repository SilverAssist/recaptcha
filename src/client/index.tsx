/**
 * reCAPTCHA v3 Client Component
 *
 * Loads the Google reCAPTCHA script and generates tokens automatically.
 * Place inside a form to add invisible spam protection.
 *
 * @see https://developers.google.com/recaptcha/docs/v3
 * @packageDocumentation
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
 *
 * @example With callbacks
 * ```tsx
 * <RecaptchaWrapper
 *   action="payment"
 *   onTokenGenerated={(token) => console.log("Token:", token)}
 *   onError={(error) => console.error("Error:", error)}
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
      return;
    }

    try {
      if (typeof window !== "undefined" && window.grecaptcha) {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(siteKey, { action });

            // Store token in hidden input
            if (tokenInputRef.current) {
              tokenInputRef.current.value = token;
            }

            // Call callback if provided
            if (onTokenGenerated) {
              onTokenGenerated(token);
            }
          } catch (error) {
            console.error("[reCAPTCHA] Error executing reCAPTCHA:", error);
            if (onError && error instanceof Error) {
              onError(error);
            }
          }
        });
      }
    } catch (error) {
      console.error("[reCAPTCHA] Error:", error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [siteKey, action, onTokenGenerated, onError]);

  // Set up token refresh interval (tokens expire after 2 minutes)
  useEffect(() => {
    // Generate token immediately when component mounts
    executeRecaptcha();

    // Set up refresh interval
    refreshIntervalRef.current = setInterval(() => {
      executeRecaptcha();
    }, refreshInterval);

    // Cleanup interval on unmount
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
        "[reCAPTCHA] Site key not configured. Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable."
      );
    }
    return null;
  }

  return (
    <>
      {/* Hidden input to store the token */}
      <input
        ref={tokenInputRef}
        type="hidden"
        name={inputName}
        id={inputId}
        data-testid="recaptcha-token-input"
      />

      {/* Load reCAPTCHA script */}
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
        strategy="afterInteractive"
        onLoad={() => {
          executeRecaptcha();
        }}
        onError={() => {
          console.error("[reCAPTCHA] Failed to load reCAPTCHA script");
          if (onError) {
            onError(new Error("Failed to load reCAPTCHA script"));
          }
        }}
      />
    </>
  );
}

export default RecaptchaWrapper;

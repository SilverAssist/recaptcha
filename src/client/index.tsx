/**
 * @module @silverassist/recaptcha/client
 * @description reCAPTCHA v3 Client Component - Loads the Google reCAPTCHA script
 * and generates tokens automatically. Place inside a form to add invisible spam protection.
 *
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license Polyform-Noncommercial-1.0.0
 * @version 0.2.1
 * @see {@link https://developers.google.com/recaptcha/docs/v3|Google reCAPTCHA v3 Documentation}
 * @see {@link https://github.com/SilverAssist/recaptcha|GitHub Repository}
 */

"use client";

import { ScriptLoader } from "@silverassist/next-script-loader";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecaptchaWrapperProps } from "../types";
import { RECAPTCHA_CONFIG } from "../constants";

/**
 * Module-level singleton: every `RecaptchaWrapper` instance on the page
 * shares one loader, so the script loads once no matter how many forms
 * render it, and unloads only once the last one unmounts. Exported so
 * tests (and advanced consumers) can call `recaptchaLoader.reset()`
 * directly, the same "exposed for tests" contract `ScriptLoader.reset()`
 * itself documents.
 */
export const recaptchaLoader = new ScriptLoader();

/**
 * RecaptchaWrapper - Client component for reCAPTCHA v3 integration
 *
 * Features:
 * - Loads reCAPTCHA script automatically (via `@silverassist/next-script-loader`,
 *   shared across every instance on the page)
 * - Generates token when script loads
 * - Refreshes token periodically (tokens expire after 2 minutes)
 * - Stores token in hidden input field for form submission
 * - Graceful fallback when not configured
 * - Lazy loading support to defer script loading until visible
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
 * // IMPORTANT: Memoize callbacks to prevent unnecessary re-renders
 * const handleToken = useCallback((token: string) => {
 *   console.log("Token:", token);
 * }, []);
 *
 * const handleError = useCallback((error: Error) => {
 *   console.error("Error:", error);
 * }, []);
 *
 * <RecaptchaWrapper
 *   action="payment"
 *   onTokenGenerated={handleToken}
 *   onError={handleError}
 * />
 * ```
 *
 * @example Lazy loading for better performance
 * ```tsx
 * <RecaptchaWrapper action="contact_form" lazy />
 * ```
 *
 * @example Lazy loading with custom root margin
 * ```tsx
 * <RecaptchaWrapper action="contact_form" lazy lazyRootMargin="400px" />
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
  lazy = false,
  lazyRootMargin = "200px",
}: RecaptchaWrapperProps) {
  // Use prop siteKey or fall back to environment variable
  const siteKey = propSiteKey ?? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const [isVisible, setIsVisible] = useState(!lazy); // If not lazy, start visible
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Execute reCAPTCHA and store token
  const executeRecaptcha = useCallback(async () => {
    if (!siteKey) {
      return;
    }

    try {
      // Wait for grecaptcha to be available (with timeout)
      // This handles the race condition where the script loads but
      // window.grecaptcha is not immediately available
      const waitForGrecaptcha = async (maxAttempts = 20, delayMs = 100): Promise<boolean> => {
        for (let i = 0; i < maxAttempts; i++) {
          // Check if component is still mounted
          if (!isMountedRef.current) {
            return false;
          }

          if (typeof window !== "undefined" && window.grecaptcha) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        return false;
      };

      const grecaptchaAvailable = await waitForGrecaptcha();

      // Exit early if component unmounted during polling
      if (!isMountedRef.current || !grecaptchaAvailable) {
        return;
      }

      window.grecaptcha.ready(async () => {
        // Check if still mounted before executing
        if (!isMountedRef.current) {
          return;
        }

        try {
          const token = await window.grecaptcha.execute(siteKey, { action });

          // Check if still mounted before storing token
          if (!isMountedRef.current) {
            return;
          }

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
    } catch (error) {
      console.error("[reCAPTCHA] Error:", error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [siteKey, action, onTokenGenerated, onError]);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;

    // Fallback to eager loading if IntersectionObserver is not supported
    // (older browsers, some SSR/test environments)
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: lazyRootMargin },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy, lazyRootMargin]);

  // Load the script once visible (immediately for non-lazy, on intersection
  // for lazy) via the shared ScriptLoader singleton -- one instance backs
  // every RecaptchaWrapper on the page, so concurrent mounts share one
  // `<script>` tag and one in-flight load.
  useEffect(() => {
    if (!siteKey) return;
    if (!isVisible) return;

    let cancelled = false;

    recaptchaLoader.configure({
      urls: { [siteKey]: `https://www.google.com/recaptcha/api.js?render=${siteKey}` },
    });

    recaptchaLoader
      .load(siteKey)
      .then(() => {
        if (cancelled || !isMountedRef.current) return;
        setScriptLoaded(true);
        executeRecaptcha();
      })
      .catch(() => {
        if (cancelled || !isMountedRef.current) return;
        console.error("[reCAPTCHA] Failed to load reCAPTCHA script");
        onError?.(new Error("Failed to load reCAPTCHA script"));
      });

    return () => {
      cancelled = true;
      recaptchaLoader.unload();
    };
  }, [siteKey, isVisible, executeRecaptcha, onError]);

  // Set up token refresh interval (tokens expire after 2 minutes)
  useEffect(() => {
    // Only set up refresh if script is loaded
    if (!scriptLoaded) return;

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
  }, [scriptLoaded, executeRecaptcha, refreshInterval]);

  // Track mounted state to prevent side effects after unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Don't render anything if site key is not configured
  if (!siteKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[reCAPTCHA] Site key not configured. Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable.",
      );
    }
    return null;
  }

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {/*
        Note: display: contents makes this wrapper transparent to the DOM layout.
        The wrapper is needed for IntersectionObserver but shouldn't affect form layout.
        Browser support: https://caniuse.com/css-display-contents
      */}
      {/* Hidden input to store the token */}
      <input
        ref={tokenInputRef}
        type="hidden"
        name={inputName}
        id={inputId}
        data-testid="recaptcha-token-input"
      />
    </div>
  );
}

export default RecaptchaWrapper;

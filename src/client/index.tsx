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
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecaptchaWrapperProps } from "../types";
import { RECAPTCHA_CONFIG } from "../constants";

/**
 * Load reCAPTCHA script manually (singleton pattern)
 * Ensures script is only loaded once globally
 */
function loadRecaptchaScript(
  siteKey: string,
  onLoad: () => void,
  onError: (error: Error) => void
): void {
  // Already loaded
  if (typeof window !== "undefined" && window.__recaptchaLoaded) {
    onLoad();
    return;
  }

  // Currently loading - add callback
  if (typeof window !== "undefined" && window.__recaptchaLoading) {
    window.__recaptchaCallbacks = window.__recaptchaCallbacks || [];
    window.__recaptchaCallbacks.push(onLoad);
    return;
  }

  // Start loading
  if (typeof window !== "undefined") {
    window.__recaptchaLoading = true;
    window.__recaptchaCallbacks = [];

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;

    script.onload = () => {
      window.__recaptchaLoaded = true;
      window.__recaptchaLoading = false;
      onLoad();
      window.__recaptchaCallbacks?.forEach((cb) => cb());
      window.__recaptchaCallbacks = [];
    };

    script.onerror = () => {
      window.__recaptchaLoading = false;
      const error = new Error("Failed to load reCAPTCHA script");
      onError(error);
    };

    document.head.appendChild(script);
  }
}

/**
 * RecaptchaWrapper - Client component for reCAPTCHA v3 integration
 *
 * Features:
 * - Loads reCAPTCHA script automatically
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
 * <RecaptchaWrapper
 *   action="payment"
 *   onTokenGenerated={(token) => console.log("Token:", token)}
 *   onError={(error) => console.error("Error:", error)}
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
  const [isVisible, setIsVisible] = useState(!lazy); // If not lazy, start visible
  const [scriptLoaded, setScriptLoaded] = useState(false);

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

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: lazyRootMargin }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy, lazyRootMargin]);

  // Load script when visible (or immediately if not lazy)
  useEffect(() => {
    if (!siteKey) return;
    if (lazy && !isVisible) return;

    const handleLoad = () => {
      setScriptLoaded(true);
      executeRecaptcha();
    };

    const handleError = (error: Error) => {
      console.error("[reCAPTCHA] Failed to load reCAPTCHA script");
      if (onError) {
        onError(error);
      }
    };

    loadRecaptchaScript(siteKey, handleLoad, handleError);
  }, [siteKey, lazy, isVisible, executeRecaptcha, onError]);

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

      {/* Load reCAPTCHA script using Next.js Script component for non-lazy mode */}
      {!lazy && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
          onLoad={() => {
            setScriptLoaded(true);
            executeRecaptcha();
          }}
          onError={() => {
            console.error("[reCAPTCHA] Failed to load reCAPTCHA script");
            if (onError) {
              onError(new Error("Failed to load reCAPTCHA script"));
            }
          }}
        />
      )}
    </div>
  );
}

export default RecaptchaWrapper;

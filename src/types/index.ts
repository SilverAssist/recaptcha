/**
 * reCAPTCHA v3 Integration Types
 *
 * Type definitions for Google reCAPTCHA v3 integration with Next.js.
 *
 * @packageDocumentation
 */

/**
 * reCAPTCHA v3 verification API response from Google
 *
 * @see https://developers.google.com/recaptcha/docs/verify
 */
export interface RecaptchaVerifyResponse {
  /** Whether the verification was successful */
  success: boolean;
  /** Score between 0.0 and 1.0 (1.0 = very likely human) */
  score: number;
  /** Action name from the client */
  action: string;
  /** Timestamp of the challenge (ISO format) */
  challenge_ts: string;
  /** Hostname of the site where reCAPTCHA was solved */
  hostname: string;
  /** Error codes if verification failed */
  "error-codes"?: string[];
}

/**
 * Result of reCAPTCHA validation in server action
 */
export interface RecaptchaValidationResult {
  /** Whether the validation passed */
  success: boolean;
  /** The score from Google (0.0 - 1.0) */
  score: number;
  /** Error message if validation failed */
  error?: string;
  /** Whether validation was skipped (not configured) */
  skipped?: boolean;
  /** Raw response from Google API */
  rawResponse?: RecaptchaVerifyResponse;
}

/**
 * Props for RecaptchaWrapper client component
 */
export interface RecaptchaWrapperProps {
  /** Action name for reCAPTCHA analytics (e.g., "contact_form", "signup") */
  action: string;
  /** Name attribute for the hidden input (default: "recaptchaToken") */
  inputName?: string;
  /** ID attribute for the hidden input */
  inputId?: string;
  /** Override site key (default: uses NEXT_PUBLIC_RECAPTCHA_SITE_KEY) */
  siteKey?: string;
  /** Token refresh interval in ms (default: 90000 = 90 seconds) */
  refreshInterval?: number;
  /** Callback when token is generated */
  onTokenGenerated?: (token: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Enable lazy loading (default: false for backward compatibility) */
  lazy?: boolean;
  /** IntersectionObserver rootMargin for lazy loading (default: "200px") */
  lazyRootMargin?: string;
}

/**
 * Configuration options for reCAPTCHA validation
 */
export interface RecaptchaConfig {
  /** Google reCAPTCHA verification endpoint */
  verifyUrl: string;
  /** Default score threshold for validation */
  defaultScoreThreshold: number;
  /** Default token refresh interval in milliseconds */
  tokenRefreshInterval: number;
}

/**
 * Options for validateRecaptcha function
 */
export interface RecaptchaValidationOptions {
  /** Minimum score to pass (default: 0.5) */
  scoreThreshold?: number;
  /** Explicit secret key (default: uses RECAPTCHA_SECRET_KEY env) */
  secretKey?: string;
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
    /** Flag to track if reCAPTCHA script has loaded */
    __recaptchaLoaded?: boolean;
    /** Flag to track if reCAPTCHA script is currently loading */
    __recaptchaLoading?: boolean;
    /** Callbacks to execute when script finishes loading */
    __recaptchaCallbacks?: Array<{
      onLoad: () => void;
      onError: (error: Error) => void;
    }>;
  }
}

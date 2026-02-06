/**
 * @module @silverassist/recaptcha/constants
 * @description reCAPTCHA Configuration Constants - Default configuration values
 * for reCAPTCHA v3 integration.
 *
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license Polyform-Noncommercial-1.0.0
 * @version 0.2.0
 * @see {@link https://github.com/SilverAssist/recaptcha|GitHub Repository}
 */

import type { RecaptchaConfig } from "../types";

/**
 * Default score threshold for validation
 * Scores below this value are considered suspicious
 * Range: 0.0 (bot) to 1.0 (human)
 */
export const DEFAULT_SCORE_THRESHOLD = 0.5;

/**
 * Token refresh interval in milliseconds
 * reCAPTCHA tokens expire after 2 minutes, so we refresh at 90 seconds
 * to ensure tokens are always valid when forms are submitted
 */
export const DEFAULT_TOKEN_REFRESH_INTERVAL = 90000;

/**
 * reCAPTCHA v3 configuration constants
 */
export const RECAPTCHA_CONFIG: RecaptchaConfig = {
  /** Google reCAPTCHA verification endpoint */
  verifyUrl: "https://www.google.com/recaptcha/api/siteverify",
  /** Default score threshold for validation */
  defaultScoreThreshold: DEFAULT_SCORE_THRESHOLD,
  /** Default token refresh interval */
  tokenRefreshInterval: DEFAULT_TOKEN_REFRESH_INTERVAL,
} as const;

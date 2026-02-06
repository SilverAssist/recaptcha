/**
 * @module @silverassist/recaptcha
 * @description Google reCAPTCHA v3 integration for Next.js applications.
 * Provides both client-side token generation and server-side validation.
 *
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license Polyform-Noncommercial-1.0.0
 * @version 0.2.0
 * @see {@link https://github.com/SilverAssist/recaptcha|GitHub Repository}
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
 * import { validateRecaptcha, getRecaptchaToken } from '@silverassist/recaptcha/server';
 *
 * export async function submitForm(formData: FormData) {
 *   const token = getRecaptchaToken(formData);
 *   const result = await validateRecaptcha(token, 'contact_form');
 *   if (!result.success) {
 *     return { success: false, message: result.error };
 *   }
 *   // Process form...
 * }
 * ```
 */

// Client exports
export { RecaptchaWrapper } from "./client";

// Server exports
export {
  validateRecaptcha,
  isRecaptchaEnabled,
  getRecaptchaToken,
} from "./server";

// Type exports
export type {
  RecaptchaWrapperProps,
  RecaptchaValidationResult,
  RecaptchaVerifyResponse,
  RecaptchaConfig,
  RecaptchaValidationOptions,
} from "./types";

// Constants exports
export {
  RECAPTCHA_CONFIG,
  DEFAULT_SCORE_THRESHOLD,
  DEFAULT_TOKEN_REFRESH_INTERVAL,
} from "./constants";

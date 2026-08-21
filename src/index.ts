/**
 * @module @silverassist/recaptcha
 * @description Google reCAPTCHA v3 integration for Next.js applications.
 * Provides both client-side token generation and server-side validation.
 *
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license Polyform-Noncommercial-1.0.0
 * @version 0.2.1
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
// Self-referencing import, not "./client".
//
// This keeps the barrel intact while preserving the React Server Components
// boundary. Bundling ./client into this file would inline the component and
// drop its "use client" directive, making the root export unusable from a
// Server Component -- the defect the Next.js integration fixture caught.
//
// The specifier is the package's own subpath so Node resolves it through the
// exports map in both CJS and ESM; a relative "./client" resolves only in CJS.
export { RecaptchaWrapper } from "@silverassist/recaptcha/client";

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

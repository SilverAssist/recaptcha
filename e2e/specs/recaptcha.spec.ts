/**
 * Integration specs for @silverassist/recaptcha consumed by a real Next app.
 *
 * The fixture installs the *packed tarball*, so these run against exactly what
 * npm publishes -- not `src/`, not a workspace link. Three defects found in
 * this org were invisible any other way.
 *
 * Google's script is stubbed rather than loaded. A test that reaches
 * google.com is flaky in CI and tests Google, not this package. What matters
 * is this package's own wiring: does it request the right URL, and does the
 * token reach the hidden input a Server Action reads?
 */
import { expect, test } from "@playwright/test";

const SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const STUB_TOKEN = "stubbed-recaptcha-token";

/** Serves a fake grecaptcha in place of Google's script. */
async function stubGoogleScript(page: import("@playwright/test").Page) {
  await page.route(/recaptcha\/api\.js/, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
        window.grecaptcha = {
          ready: (cb) => cb(),
          execute: () => Promise.resolve(${JSON.stringify(STUB_TOKEN)}),
        };
      `,
    }),
  );
}

test("renders inside a Server Component page without a client-boundary error", async ({
  page,
}) => {
  await stubGoogleScript(page);
  await page.goto("/");
  // Were the "use client" directive missing from the built file, the page
  // would have failed to prerender and never reached the browser at all.
  await expect(page.locator("h1")).toHaveText("recaptcha fixture");
  await expect(page.getByTestId("protected-form")).toBeVisible();
});

test("requests Google's script with the configured site key", async ({
  page,
}) => {
  await stubGoogleScript(page);
  const request = page.waitForRequest(/recaptcha\/api\.js/);
  await page.goto("/");
  expect((await request).url()).toContain(SITE_KEY);
});

test("writes the token into the hidden input a Server Action reads", async ({
  page,
}) => {
  // This is the regression osa-nextjs hit (WEB-901, then a hotfix disabling
  // reCAPTCHA outright "due to token issues"): the component mounted, the
  // script loaded, and the token still never reached the form field, so
  // server-side validation rejected every submission.
  await stubGoogleScript(page);
  await page.goto("/");
  const input = page.locator('input[name="recaptchaToken"]');
  await expect(input).toHaveAttribute("type", "hidden");
  await expect(input).toHaveValue(STUB_TOKEN, { timeout: 10_000 });
});

test("keeps the token inside the form, so a submit carries it", async ({
  page,
}) => {
  await stubGoogleScript(page);
  await page.goto("/");
  const insideForm = await page
    .locator('form[data-testid="protected-form"] input[name="recaptchaToken"]')
    .count();
  expect(insideForm, "token input is inside the form").toBe(1);
});

// NOTE: no "use client" here, deliberately.
//
// This page is a Server Component that imports the package. That is the point
// of the fixture: a package shipping a hook-using component without its own
// "use client" directive fails `next build` right here. consent-banner shipped
// exactly that defect for its whole published life, and this package's *root*
// entry still has it (see the note on `/client` below). No unit test can catch
// it -- only a real Next build across the RSC boundary.
//
// Imported from the `/client` subpath, NOT the package root. The root entry
// re-exports RecaptchaWrapper without a "use client" directive, so importing
// it here fails with `TypeError: (0 , h.useRef) is not a function`. That is
// how this fixture found the defect on its first run. The root cannot simply
// be marked "use client" either: it also re-exports ./server, which handles
// RECAPTCHA_SECRET_KEY.
import { RecaptchaWrapper } from "@silverassist/recaptcha/client";

// Google's public test key: always verifies, never rate-limits. The Cypress
// specs stub the script anyway, so no test depends on reaching Google.
const TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

export default function Page() {
  return (
    <main>
      <h1>recaptcha fixture</h1>
      <form data-testid="protected-form" action="/api/noop" method="post">
        <input name="email" type="email" data-testid="email" />
        <RecaptchaWrapper siteKey={TEST_SITE_KEY} action="contact_form" />
        <button type="submit" data-testid="submit">
          Send
        </button>
      </form>
    </main>
  );
}

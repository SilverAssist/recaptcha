/**
 * Guards the React Server Components boundary in the *built* output.
 *
 * These assert properties of dist/, not of src/, because the defect they
 * protect against is created by the bundler: inlining ./client into the root
 * barrel flattens away its "use client" directive, and the root export then
 * throws `TypeError: (0 , h.useRef) is not a function` in any Server
 * Component. Source-level tests cannot see that.
 *
 * Skipped when dist/ is absent so `npm test` still works before a build; CI
 * and prepublishOnly both build first.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = (p: string) => resolve(__dirname, "../../dist", p);
const built = existsSync(dist("index.mjs"));
const describeBuilt = built ? describe : describe.skip;

describeBuilt("built output: RSC boundary", () => {
  const root = () => readFileSync(dist("index.mjs"), "utf8");
  const client = () => readFileSync(dist("client/index.mjs"), "utf8");

  it('marks the client entry with "use client"', () => {
    expect(client().startsWith('"use client"')).toBe(true);
  });

  it("re-exports the client entry instead of inlining it", () => {
    // Inlining is the failure mode: the hooks end up in an unmarked module.
    expect(root()).not.toMatch(/useRef|grecaptcha/);
    expect(root()).toContain("@silverassist/recaptcha/client");
  });

  it('leaves the root barrel unmarked, since it also re-exports ./server', () => {
    // Marking the root "use client" would ship RECAPTCHA_SECRET_KEY handling
    // to the browser. The boundary belongs on ./client, not here.
    expect(root().startsWith('"use client"')).toBe(false);
  });
});

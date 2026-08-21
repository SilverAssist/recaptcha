# Testing Next.js packages: what we learned building the pilot

Design notes behind [`@silverassist/next-testing-toolkit`][pkg], the shared harness
this repo now consumes. Written from the pilot here (SilverAssist/recaptcha#62), which
was built after four real defects shipped to npm undetected, then replicated to
`consent-banner` and `icons` before being extracted.

The reasoning is kept because it explains _why_ the harness is shaped the way it is —
the constraints below are the reason `build-fixture` installs a packed tarball and the
fixture page is a Server Component. For how to **use** it, see the package README.

[pkg]: https://www.npmjs.com/package/@silverassist/next-testing-toolkit

---

## The defects that motivated this

None was visible to a unit test. Three of the four had already reached
production.

| Package                     | Defect                                                                                                        | Only visible when                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `consent-banner`            | Shipped with **no `"use client"` at all**, for its entire published life                                      | a Server Component imports the _built_ file |
| `performance-toolkit`       | `exports` pointed all 8 subpaths at `.mjs` files the build never produced — the library API was unimportable  | Node resolves the _published tarball_       |
| `recaptcha`                 | Root barrel export threw in Server Components                                                                 | a Server Component imports it               |
| `recaptcha` in `osa-nextjs` | Token never reached the Server Action (WEB-901 → `hotfix: Disable reCAPTCHA integration due to token issues`) | a real form submission                      |

Two patterns fall out of that table, and they drive the whole design:

1. **Three of four are packaging defects.** They live in `dist/` and in
   `package.json`, not in `src/`. A test importing from `src/` is blind to all
   of them.
2. **Three of four are caught by `next build` alone** — no browser needed. Only
   the token regression requires one.

---

## The architecture

```text
npm pack                  → the exact tarball npm publishes
npm install ./pkg.tgz     → into a fixture Next app
next build                → catches packaging + RSC-boundary defects
playwright test           → behaviour: script loading, token propagation
```

### Non-negotiables

**Install the packed tarball.** Not `src/`, not a workspace link, not
`file:../`. `npm pack` output is the only thing that exercises `files`,
`exports`, and the built artifact together. This single decision is what makes
the packaging class of defect visible.

**The fixture page must be a Server Component.** No `"use client"` at the top.
That is what turns a missing directive in the package into a build failure
instead of a silent runtime break in someone else's app.

**Test the production build**, not `next dev`. Next's own guidance:

> We recommend running your tests against your production code to more closely
> resemble how your application will behave.

**Stub third-party scripts.** The reCAPTCHA specs replace Google's
`api.js` with a fake `window.grecaptcha`. A test that reaches google.com is
flaky in CI and tests Google, not the package. What matters is the package's own
wiring: does it request the right URL, and does the token reach the hidden input
a Server Action reads?

---

## Playwright, not Cypress

The org standardises on Cypress for the Next **apps** — fully implemented in
`osa-nextjs`, in progress in `family-nextjs`. The pilot still uses Playwright,
deliberately:

- **Packages are not apps.** They share no specs, helpers or fixtures with the
  app repos, so the consistency argument does not reach them.
- **Playwright's `webServer` starts and stops the fixture itself**, removing the
  `start-server-and-test` dependency the Cypress path needs.
- **Cypress would not run.** Its binary failed with
  `bad option: --no-sandbox / --smoke-test` after npm 12 blocked its postinstall
  ([GitHub changelog, 2026-07-08](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/)).
  Playwright worked first try.

Next documents both for E2E. Its only Cypress caveat — _"Cypress currently
doesn't support Component Testing for `async` Server Components"_ — applies to
Component Testing, not the E2E path used here, so it was not the deciding
factor.

---

## The RSC boundary: the lesson that cost the most

The pilot's first run failed with:

```text
TypeError: (0 , h.useRef) is not a function
```

**The first diagnosis was wrong.** It looked like the root barrel was
architecturally unsound and should stop exporting the client component. That
would have broken the public API — and invalidated five documented examples in
the README — to work around a build defect.

The barrel was fine. `dist/index.js` was **inlining** `./client` (14 hook
references, ~11 kB) instead of re-exporting it, and inlining across the RSC
boundary drops the `"use client"` directive, which exists only as a property of
a _module_.

### The rule

> A barrel may re-export across the RSC boundary. A **bundle** may not inline
> across it.

Keep the client entry external so the built barrel re-exports rather than
inlines. Then:

- **DDD** — domain modules stay split
- **SRP** — the barrel only re-exports; it does not contain the component
- **Barrel exports** — the root stays the clean entry point, and now works from
  a Server Component

A root that mixes client and server exports **cannot carry the directive
itself**: `recaptcha`'s root also re-exports `./server`, which handles
`RECAPTCHA_SECRET_KEY`. Marking it `"use client"` would ship secret-handling
code to the browser.

### Use the package self-reference, not a relative path

`require("./client")` resolves a directory index in CJS. ESM has no such
resolution and fails. `@silverassist/<pkg>/client` goes through the package's
own `exports` map and behaves identically in both formats. Map it in
`tsconfig.json` `paths` to source, since `dist/` does not exist at type-check
time.

### Guard it in the built output

`src/__tests__/build-output.test.ts` asserts three properties of `dist/`:

1. the client entry starts with `"use client"`
2. the root re-exports rather than inlines (no hook references)
3. the root is **not** marked (it re-exports `./server`)

No source-level test can observe any of them.

---

## Build-tool notes

**`tsup` is dead** — _"This project is not actively maintained anymore. Please
consider using tsdown instead."_ No PR merged since Nov 2025. Its DTS build
crashes on TypeScript 7 ([#1405](https://github.com/egoist/tsup/issues/1405)).

**Migrating to tsdown**: capture the `dist/` file list **before** migrating and
diff after. tsdown defaults to `.cjs` / `.d.cts` where tsup emitted other names,
and the published `exports` map points at the old ones — the default silently
breaks consumers. `fixedExtension: false` preserves them, and its behaviour
depends on whether the package declares `"type"`, so document that at the point
of use.

**Emit `"use client"` with tsdown's `banner`**, scoped to the client config
object — not a post-build script rewriting hardcoded paths. Note tsup's trap:
with `treeshake: true` it post-processes through rollup and **silently drops the
esbuild banner**, which is how `consent-banner` shipped without a directive for
its entire life.

**tsdown requires Node `^22.18.0 || >=24.11.0`.** That is a build constraint,
not a runtime one — but if CI drops Node 20, `engines` must stop claiming it.

---

## Packaging checks worth running

Cheap, and they found real defects:

| Tool                    | Catches                                         |
| ----------------------- | ----------------------------------------------- |
| `npm publish --dry-run` | what actually ships, before it ships            |
| `publint`               | malformed `exports`, wrong fields, broken paths |
| `@arethetypeswrong/cli` | types unresolvable per module-resolution mode   |

`attw` caught `jsdoc-to-tsdoc` shipping 57 kB of declarations that
`moduleResolution: "node"` consumers could not see — one missing top-level
`types` field, found minutes before its first publish. **An npm version cannot
be taken back.**

---

## What went into the shared package

All of this now ships in the package:

- fixture generator (a minimal Next app with a Server Component page)
- the pack → install → `next build` script
- Playwright config with `webServer` and the production-build convention
- a helper for stubbing third-party scripts
- the three RSC-boundary assertions — they apply to any package with client components
- `publint` / `attw` wrappers

**Package-specific, still local in each repo:**

- the fixture's `page.tsx`
- behaviour specs

**Reusable workflows** (the `SilverAssist/wp-coding-standards/...@v1` pattern,
which has no Node equivalent yet): the `Next.js integration` job, the quality
job with its Node matrix, and `auto-merge-dependabot.yml` are identical across
repos.

⚠️ **Keep `publish.yml` local.** npm's docs warn that with `workflow_call`,
trusted-publishing validation checks the **calling** workflow's name rather than
the one containing the publish, and `id-token: write` must be granted to both
parent and child. Not worth the footgun for a ~40-line file.

---

## Open items

- ~~**Next version coverage.**~~ Resolved: the `next` peer range is now `>=16.0.0`,
  matching what the fixture tests and what every internal consumer runs. It claimed
  two untested majors before — Next 15 rejects TypeScript 7 outright
  (_"upgrade to a Next.js v16.2.11 or later"_), so `>=14.0.0` was never honest about
  what this package actually supported.
- **`recaptcha` still has no ESLint or Prettier.** Its `lint` script is
  `tsc --noEmit` — a typecheck wearing a lint's name. `consent-banner` and `icons`
  run both, and the harness's `ESLINT_IGNORE_PATTERNS` is wired into their configs;
  there is nothing here to wire it into.

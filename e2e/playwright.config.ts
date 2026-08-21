import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Playwright starts and stops the fixture itself -- no start-server-and-test.
  // `next start`, not `next dev`: Next's guidance is to test the production
  // build, "to more closely resemble how your application will behave".
  webServer: {
    command: "npm --prefix fixture run start",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "backend", ".env") });

/** Must match `e2e/global-setup.mjs` and tests. First registration with this email becomes admin + email-verified. */
export const E2E_BOOTSTRAP_EMAIL = "e2e-bootstrap@test.nove";

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 45_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: path.join(__dirname, "e2e", "global-setup.mjs"),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          BOOTSTRAP_ADMIN_EMAIL: E2E_BOOTSTRAP_EMAIL,
          NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.E2E_RECAPTCHA_SITE_KEY ?? "",
        },
      },
});

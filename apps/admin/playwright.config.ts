// Admin end-to-end tests. Starts its own API (port 4100, 20-second access tokens so
// refresh is exercised) and the built admin (port 3101) against the Neon dev branch.
// Needs builds first: `pnpm test:e2e` from the repo root runs them via turbo.
import { defineConfig, devices } from "@playwright/test";

const API_PORT = 4100;
const ADMIN_PORT = 3101;
// Short enough to expire during a test, long enough that a page render (half of it) never straddles expiry.
export const ACCESS_TTL_SECONDS = 20;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: false,
  workers: 1, // specs share the test admins and the dev database
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: `http://localhost:${ADMIN_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node ../api/dist/main.js",
      url: `http://localhost:${API_PORT}/api/v1/health`,
      // Both spec files sign in more than 5 times a minute, so the test API allows more logins.
      env: { PORT: String(API_PORT), NODE_ENV: "test", JWT_ACCESS_TTL_SECONDS: String(ACCESS_TTL_SECONDS), LOGIN_RATE_LIMIT_PER_MINUTE: "30" },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx next start -p ${ADMIN_PORT}`,
      url: `http://localhost:${ADMIN_PORT}/login`,
      env: { API_URL: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});

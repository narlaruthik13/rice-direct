// Website end-to-end tests. Starts, in order:
//   - its own API (port 4210) against the Neon dev branch,
//   - the built admin (port 3201), pointed at that API and at the API-mode website,
//   - the website built with DATA_SOURCE=mock (port 3203) and an API_URL where nothing listens,
//   - the website built with DATA_SOURCE=api (port 3202).
// Each website build goes to its own dist dir, so a running `pnpm dev` is never touched.
// Needs the API and admin builds first: `pnpm test:e2e` from the repo root runs them via turbo.
import { defineConfig, devices } from "@playwright/test";

export const API_PORT = 4210; // not 4200: Angular's default dev port
export const ADMIN_PORT = 3201;
const WEB_API_PORT = 3202;
const WEB_MOCK_PORT = 3203;
export const API_URL = `http://localhost:${API_PORT}`;
export const ADMIN_URL = `http://localhost:${ADMIN_PORT}`;
/** Nothing listens here: the mock site must not need the API. */
const NO_API_URL = "http://localhost:4999";
/** Only for this run's servers. */
const REVALIDATE_SECRET = "e2e-revalidate-secret";

const web = (port: number, dataSource: "api" | "mock", apiUrl: string) => ({
  // Fresh dist dir each run: its Data Cache would otherwise keep the last run's prices.
  // --no-lint: the root `pnpm lint` covers it.
  command: `node -e "require('fs').rmSync('.next-e2e-${dataSource}', { recursive: true, force: true })" && npx next build --no-lint && npx next start -p ${port}`,
  url: `http://localhost:${port}/`,
  env: { DATA_SOURCE: dataSource, API_URL: apiUrl, REVALIDATE_SECRET, NEXT_DIST_DIR: `.next-e2e-${dataSource}` },
  reuseExistingServer: false,
  timeout: 300_000,
});

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: false,
  workers: 1, // the price test changes shared data in the dev database
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "api", testIgnore: /mock\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${WEB_API_PORT}` } },
    { name: "mock", testMatch: /mock\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${WEB_MOCK_PORT}` } },
  ],
  webServer: [
    {
      command: "node ../api/dist/main.js",
      url: `${API_URL}/api/v1/health`,
      env: { PORT: String(API_PORT), NODE_ENV: "test", LOGIN_RATE_LIMIT_PER_MINUTE: "30" },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx next start -p ${ADMIN_PORT}`,
      cwd: "../admin",
      url: `${ADMIN_URL}/login`,
      env: { API_URL, WEB_URL: `http://localhost:${WEB_API_PORT}`, REVALIDATE_SECRET },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    web(WEB_MOCK_PORT, "mock", NO_API_URL),
    web(WEB_API_PORT, "api", API_URL),
  ],
});

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const e2ePort = new URL(baseURL).port || "3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_USE_EXISTING_SERVER === "true" ? undefined : {
    command: `npm run dev -- -p ${e2ePort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

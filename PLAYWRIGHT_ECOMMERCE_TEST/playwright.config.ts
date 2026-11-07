import { defineConfig, devices } from "@playwright/test";
import { getActiveEnvironment } from "./src/config/environment";
import { DEFAULT_TIMEOUT_MS, NAVIGATION_TIMEOUT_MS } from "./src/config/constants";

const environment = getActiveEnvironment();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: DEFAULT_TIMEOUT_MS },
  outputDir: "test-results/artifacts",
  reporter: [
    ["line"],
    ["html", { outputFolder: "test-results/html-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["allure-playwright", { resultsDir: "test-results/allure-results", detail: true }],
    ["./src/reporting/dashboard-reporter.ts", { historyFile: "test-results/trend-history.json" }],
  ],
  use: {
    baseURL: environment.baseUrl,
    actionTimeout: DEFAULT_TIMEOUT_MS,
    navigationTimeout: NAVIGATION_TIMEOUT_MS,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: "chrome",
      testIgnore: "**/*.api.spec.ts",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" },
    },
    {
      name: "edge",
      testIgnore: "**/*.api.spec.ts",
      use: { ...devices["Desktop Edge"], browserName: "chromium", channel: "msedge" },
    },
    {
      name: "firefox",
      testIgnore: "**/*.api.spec.ts",
      use: { ...devices["Desktop Firefox"], browserName: "firefox" },
    },
    {
      name: "api",
      testMatch: "**/*.api.spec.ts",
      dependencies: ["chrome", "edge", "firefox"],
      workers: 1,
      use: { baseURL: environment.baseUrl },
    },
  ],
});

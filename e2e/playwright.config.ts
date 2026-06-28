import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright configuration for the AI Helpdesk E2E test suite.
 *
 * Key design decisions:
 * - Backend runs on port 3001 (dev uses 3000 — no collision)
 * - Frontend runs on port 5174 (dev uses 5173 — no collision)
 * - Both servers are started by Playwright's webServer config against .env.test
 * - global-setup migrates + seeds the isolated helpdesk_test DB before any test
 */

const BACKEND_URL = "http://localhost:3001";
const FRONTEND_URL = "http://localhost:5174";

process.env.BACKEND_URL = BACKEND_URL;
process.env.WEBHOOK_SECRET = "test-webhook-secret";

// Resolve paths relative to this config file's location
const backendDir = path.resolve(__dirname, "../backend");
const frontendDir = path.resolve(__dirname, "../frontend");

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: false, // sequential for now — tests may share DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // one worker = isolated, predictable test DB state

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  // Global setup/teardown — handles DB migration & seeding
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      // Backend — loaded with .env.test so it connects to helpdesk_test on port 5433
      command: `bun --env-file=.env.test src/index.ts`,
      cwd: backendDir,
      url: `${BACKEND_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        PORT: "3001",
        NODE_ENV: "test",
        DATABASE_URL:
          "postgresql://postgres:password@localhost:5434/helpdesk_test?schema=public",
        BETTER_AUTH_SECRET: "test-only-secret-never-used-in-production-32chars",
        BETTER_AUTH_URL: BACKEND_URL,
        FRONTEND_URL: FRONTEND_URL,
        WEBHOOK_SECRET: "test-webhook-secret",
      },
    },
    {
      // Frontend — VITE_BACKEND_URL overridden to point to test backend on 3001
      command: `npm run dev -- --port 5174`,
      cwd: frontendDir,
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_BACKEND_URL: BACKEND_URL,
      },
    },
  ],
});

import { type Page } from '@playwright/test';

// ─── Credentials ─────────────────────────────────────────────────────────────

export const VALID_EMAIL = 'admin@test.local';
export const VALID_PASSWORD = 'Test1234!';

// ─── Shared E2E Auth Helpers ──────────────────────────────────────────────────

/**
 * Performs a full login via the UI and waits for the redirect to `/`.
 */
export async function login(
  page: Page,
  email = VALID_EMAIL,
  password = VALID_PASSWORD,
) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

/**
 * Opens the Navbar avatar dropdown (only present when authenticated).
 */
export async function openUserMenu(page: Page) {
  // Wait for the avatar button to be visible (session may still be loading)
  const avatarBtn = page.locator('nav').getByRole('button').filter({ has: page.locator('[class*="rounded-full"]') }).first();
  await avatarBtn.waitFor({ state: 'visible' });
  await avatarBtn.click();
}

/**
 * Clears browser cookies so each test starts in a fully logged-out state.
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
}

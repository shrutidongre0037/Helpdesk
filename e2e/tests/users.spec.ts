import { test, expect, type Page } from '@playwright/test';

// ─── Credentials ─────────────────────────────────────────────────────────────

const VALID_EMAIL = 'admin@test.local';
const VALID_PASSWORD = 'Test1234!';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page, email = VALID_EMAIL, password = VALID_PASSWORD) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

async function clearSession(page: Page) {
  await page.context().clearCookies();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('RBAC — Users Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('admin can access the /users page and see the heading', async ({ page }) => {
    await login(page);

    await page.goto('/users');
    await expect(page).toHaveURL('/users');

    await expect(
      page.getByRole('heading', { name: 'Users Management' })
    ).toBeVisible();
  });

  test('unauthenticated user is redirected when trying to access /users', async ({ page }) => {
    await page.goto('/users');
    
    // The routing rules typically redirect unauthenticated users to /login 
    // (or to / which then redirects to /login)
    await expect(page).toHaveURL('/login');
  });
});

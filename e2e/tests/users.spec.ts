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

test.describe.serial('User Management CRUD', () => {
  const testUser = {
    name: 'Test QA User',
    email: 'qa@test.local',
    password: 'Password123!',
    role: 'Agent'
  };

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/users');
    await expect(page).toHaveURL('/users');
    await expect(page.getByRole('heading', { name: 'Users Management' })).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    await page.getByRole('button', { name: /new user/i }).click();
    await expect(page.getByRole('dialog', { name: 'Create User' })).toBeVisible();

    await page.getByPlaceholder('John Doe').fill(testUser.name);
    await page.getByPlaceholder('john@example.com').fill(testUser.email);
    
    // Select Role
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: testUser.role }).click();

    await page.getByPlaceholder('••••••••').fill(testUser.password);

    await page.getByRole('button', { name: 'Create User' }).click();

    // Dialog should close
    await expect(page.getByRole('dialog', { name: 'Create User' })).toBeHidden();

    // Verify user in table
    await expect(page.locator('tbody tr').filter({ hasText: testUser.email })).toBeVisible();
  });

  test('should update an existing user', async ({ page }) => {
    const userRow = page.locator('tbody tr').filter({ hasText: testUser.email });
    
    await userRow.getByRole('button', { name: 'Edit user' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit User' })).toBeVisible();

    const updatedName = testUser.name + ' Updated';
    await page.getByPlaceholder('John Doe').fill(updatedName);
    
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Dialog should close
    await expect(page.getByRole('dialog', { name: 'Edit User' })).toBeHidden();

    // Verify updated user in table
    await expect(page.locator('tbody tr').filter({ hasText: updatedName })).toBeVisible();
  });

  test('should delete an existing user', async ({ page }) => {
    const userRow = page.locator('tbody tr').filter({ hasText: testUser.email });

    await userRow.getByRole('button', { name: 'Delete user' }).click();
    
    // Alert dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'Delete User' }).click();

    // Verify user is removed
    await expect(page.locator('tbody tr').filter({ hasText: testUser.email })).toBeHidden();
  });
});

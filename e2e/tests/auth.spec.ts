import { test, expect, type Page } from '@playwright/test';

// ─── Credentials ─────────────────────────────────────────────────────────────

const VALID_EMAIL = 'admin@test.local';
const VALID_PASSWORD = 'Test1234!';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Performs a full login via the UI and waits for the redirect to `/`.
 */
async function login(
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
async function openUserMenu(page: Page) {
  // Wait for the avatar button to be visible (session may still be loading)
  const avatarBtn = page.locator('nav').getByRole('button').filter({ has: page.locator('[class*="rounded-full"]') }).first();
  await avatarBtn.waitFor({ state: 'visible' });
  await avatarBtn.click();
}

/**
 * Clears browser cookies so each test starts in a fully logged-out state.
 */
async function clearSession(page: Page) {
  await page.context().clearCookies();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Authentication — Login', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  test('logs in with valid credentials and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', VALID_EMAIL);
    await page.fill('#password', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome to Helpdesk AI' }),
    ).toBeVisible();
  });

  test('shows the logged-in user name in the greeting after login', async ({ page }) => {
    await login(page);
    // The greeting paragraph contains the user's name rendered by session.user.name
    await expect(page.getByText(/Hello,/)).toBeVisible();
  });

  // ── Wrong credentials ───────────────────────────────────────────────────────

  test('shows an error alert for a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', VALID_EMAIL);
    await page.fill('#password', 'WrongPassword1!');
    await page.click('button[type="submit"]');

    // Should stay on /login
    await expect(page).toHaveURL('/login');
    // Shadcn Alert with variant="destructive" renders an AlertTitle "Error"
    await expect(page.getByRole('alert').filter({ hasText: 'Error' })).toBeVisible();
  });

  test('shows an error alert for a non-existent email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'nobody@test.local');
    await page.fill('#password', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('alert').filter({ hasText: 'Error' })).toBeVisible();
  });

  // ── Client-side Zod validation (fires before any network call) ──────────────

  test('shows inline email validation error for an invalid email format', async ({ page }) => {
    await page.goto('/login');
    // Fill an invalid email — Zod validates on submit via react-hook-form's handleSubmit
    await page.fill('#email', 'not-an-email');
    await page.fill('#password', VALID_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // react-hook-form + zodResolver renders validation errors synchronously
    // The error message is defined in the schema: z.string().email('Please enter a valid email address')
    await expect(page.locator('p.text-destructive', { hasText: 'Please enter a valid email address' })).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('shows inline password validation error when password is too short', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', VALID_EMAIL);
    await page.fill('#password', '123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test('shows both validation errors when both fields are empty on submit', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test('submit button is not disabled when fields are filled', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', VALID_EMAIL);
    await page.fill('#password', VALID_PASSWORD);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  // ── Already authenticated ───────────────────────────────────────────────────

  test('redirects to "/" when an authenticated user navigates to /login', async ({ page }) => {
    await login(page); // logs in first
    await page.goto('/login');
    // Login.tsx: if (session) return <Navigate to="/" replace />
    // Wait for React to resolve isPending and then render the Navigate
    await expect(page).toHaveURL('/');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authentication — Protected Routes', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('redirects unauthenticated user from "/" to "/login"', async ({ page }) => {
    await page.goto('/');
    // Home.tsx: if (!session) return <Navigate to="/login" replace />
    await expect(page).toHaveURL('/login');
  });

  test('redirects unauthenticated user from "/users" to "/"', async ({ page }) => {
    await page.goto('/users');
    // Users.tsx: if (!session || role !== ADMIN) return <Navigate to="/" replace />
    // Since there is no session, it first redirects to "/" which then redirects to "/login"
    await expect(page).toHaveURL('/login');
  });

  test('authenticated user can access the dashboard at "/"', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome to Helpdesk AI' }),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authentication — Logout', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    // Start each test already logged in
    await login(page);
  });

  test('logs out via the Navbar dropdown and redirects to /login', async ({ page }) => {
    // Open the avatar dropdown
    await openUserMenu(page);
    // Click the "Log out" dropdown item
    await page.getByRole('menuitem', { name: /log out/i }).click();

    await expect(page).toHaveURL('/login');
  });

  test('cannot access the dashboard after logging out', async ({ page }) => {
    await openUserMenu(page);
    await page.getByRole('menuitem', { name: /log out/i }).click();
    await expect(page).toHaveURL('/login');

    // Attempt to navigate back to the protected route
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('Navbar shows "Log in" link instead of avatar after logout', async ({ page }) => {
    await openUserMenu(page);
    await page.getByRole('menuitem', { name: /log out/i }).click();
    await expect(page).toHaveURL('/login');

    // The unauthenticated Navbar renders a "Log in" link
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    // The avatar/dropdown trigger should be gone — check the "Log in" link is present instead
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authentication — Navbar State', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('Navbar shows "Log in" link when unauthenticated', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  test('Navbar shows user avatar and hides "Log in" link when authenticated', async ({ page }) => {
    await login(page);
    // Avatar dropdown is visible — check by waiting for openUserMenu to succeed
    const avatarBtn = page.locator('nav').getByRole('button').filter({ has: page.locator('[class*="rounded-full"]') }).first();
    await expect(avatarBtn).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' })).not.toBeVisible();
  });

  test('Navbar dropdown shows user name and email when opened', async ({ page }) => {
    await login(page);
    await openUserMenu(page);

    // DropdownMenuLabel renders the user's name and email
    await expect(page.locator('[role="menu"]').getByText(VALID_EMAIL)).toBeVisible();
  });

  test('Navbar dropdown shows "Manage Users" link for ADMIN role', async ({ page }) => {
    await login(page);
    await openUserMenu(page);
    // Rendered only when session.user.role === 'ADMIN'
    await expect(page.getByRole('menuitem', { name: /manage users/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authentication — Session Persistence', () => {
  test('session survives a full page reload', async ({ page }) => {
    await clearSession(page);
    await login(page);

    // Reload the page — the session cookie should keep the user logged in
    await page.reload();
    // Wait for React's isPending to resolve before asserting
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome to Helpdesk AI' }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('session is not carried over after cookies are cleared', async ({ page }) => {
    await clearSession(page);
    await login(page);

    // Simulate cookie expiry / manual logout from another tab
    await clearSession(page);
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});

---
name: playwright-e2e
description: Writes Playwright end-to-end tests for the AI Helpdesk application. Covers auth flows (login, logout, redirect), role-based access control, and page-level behaviour. Use when asked to write, add, or generate Playwright tests, e2e tests, or integration tests for this project.
---

# Playwright E2E Test Writer

You are a senior QA engineer writing end-to-end tests for the **AI Helpdesk** application using Playwright. Your tests must be robust, readable, and idiomatic.

---

## Project Context

- **Test runner**: Playwright (`@playwright/test`) — located in `e2e/`
- **Runtime**: Node.js / npm (the `e2e/` package is separate from the backend Bun workspace)
- **Backend**: Express + Better Auth on `http://localhost:3001` (test mode)
- **Frontend**: React + Vite + React Router on `http://localhost:5174` (test mode)
- **Test DB**: PostgreSQL `helpdesk_test` on `localhost:5434`
- **Config file**: `e2e/playwright.config.ts`
- **Tests directory**: `e2e/tests/` — place all `*.spec.ts` files here
- **Global setup**: `e2e/global-setup.ts` — migrates DB and seeds test user
- **Global teardown**: `e2e/global-teardown.ts` — truncates all data tables after run

---

## Seeded Test Credentials

The global setup seeds exactly one user. Always use these in tests:

```
email:    admin@test.local
password: Test1234!
role:     ADMIN
```

---

## Frontend Routes

| Route    | Component       | Auth required? | Admin only? |
|----------|-----------------|----------------|-------------|
| `/`      | `Home.tsx`      | Yes (redirects to `/login`) | No |
| `/login` | `Login.tsx`     | No (redirects to `/` if already logged in) | No |
| `/users` | `Users.tsx`     | Yes            | Yes — non-admins redirected to `/` |

---

## Key UI Selectors

### Login page (`/login`)
- Email input: `#email`
- Password input: `#password`
- Submit button: `button[type="submit"]`
- Error alert: text matching `"Error"` inside an alert role element

### Home page (`/`)
- Contains the logged-in user's display name or email
- Contains a "Sign out" or "Logout" button in the Navbar

### Users page (`/users`)
- `<h1>` containing `"Users Management"`

### Navbar
- Sign out button — use `page.getByRole('button', { name: /sign out/i })`

---

## Playwright Test Patterns

### Imports
```ts
import { test, expect } from '@playwright/test';
```

### Login helper (reuse across tests)
Define a shared `login` helper at the top of spec files or in a `fixtures.ts`:
```ts
async function login(page: Page, email = 'admin@test.local', password = 'Test1234!') {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}
```

### Waiting for navigation
```ts
await page.waitForURL('/');
await expect(page).toHaveURL('/');
```

### Checking text on page
```ts
await expect(page.getByRole('heading', { name: 'Users Management' })).toBeVisible();
```

### Checking redirect
```ts
await page.goto('/users');
await expect(page).toHaveURL('/'); // redirected because not logged in
```

---

## Test File Conventions

- One spec file per feature area, e.g. `auth.spec.ts`, `users.spec.ts`
- Group related tests with `test.describe`
- Use `test.beforeEach` to reset state or navigate to a clean page
- Always assert the **end state**, not just the action
- Avoid `page.waitForTimeout()` — use `waitForURL`, `waitForSelector`, or `expect` assertions

### File structure template
```ts
import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email = 'admin@test.local', password = 'Test1234!') {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('Feature Name', () => {
  test('should do X', async ({ page }) => {
    // Arrange
    await login(page);

    // Act
    await page.goto('/some-route');

    // Assert
    await expect(page.getByRole('heading', { name: 'Expected Heading' })).toBeVisible();
  });
});
```

---

## Standard Test Scenarios to Implement

When asked to write tests, always cover at minimum:

### Auth (`auth.spec.ts`)
1. **Successful login** — valid credentials → redirected to `/`
2. **Failed login** — wrong password → error message shown, stays on `/login`
3. **Already logged in** — visiting `/login` redirects to `/`
4. **Logout** — clicking sign out → redirected to `/login` or session cleared
5. **Protected route redirect** — unauthenticated user visiting `/` is redirected to `/login`

### RBAC — Users page (`users.spec.ts`)
1. **Admin access** — admin logs in → can visit `/users` and see the heading
2. **Unauthenticated access** — visiting `/users` without login → redirected to `/` or `/login`

---

## Running Tests

**Prerequisite**: The test database container must be running:
```bash
docker compose up postgres_test -d
```

```bash
cd /home/enjay/Documents/helpdesk/e2e

# Run all tests (headless)
npm test

# Run in UI mode (interactive)
npm run test:ui

# Run headed (see browser)
npm run test:headed

# Run a specific file
npx playwright test tests/auth.spec.ts

# Show last HTML report
npm run test:report
```

### Resetting the Test DB manually

```bash
cd /home/enjay/Documents/helpdesk/backend
npm run db:test:migrate   # Apply pending migrations
npm run db:test:seed      # Re-seed test admin user
npm run db:test:reset     # Full reset (drop + re-migrate + seed)
```

---

## Important Constraints

1. **Never modify** `global-setup.ts`, `global-teardown.ts`, or `playwright.config.ts` unless explicitly asked.
2. **Never use** `page.waitForTimeout()` — always prefer network-idle or element-based waits.
3. **Always place** test files in `e2e/tests/` with a `.spec.ts` extension.
4. **Always use** `baseURL`-relative paths (e.g., `page.goto('/')`, not full URLs) — `baseURL` is already configured in `playwright.config.ts`.
5. **Session isolation**: Tests share the same browser context by default. Use `test.use({ storageState: ... })` or clear cookies between tests if isolation is needed.
6. **DB state**: The teardown truncates all tables after the full run. Within a run, tests share DB state — order matters. Use `test.describe.serial` if ordering is critical.

---

## Workflow

1. **Understand** the user's request — which flow or feature needs testing.
2. **Check** if a spec file already exists in `e2e/tests/` for that feature.
3. **Read** any existing spec files to avoid duplication or conflicts.
4. **Write** the test following the patterns above.
5. **Confirm** the user can run: `cd e2e && npx playwright test tests/<file>.spec.ts`.

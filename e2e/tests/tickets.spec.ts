import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email = 'admin@test.local', password = 'Test1234!') {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('Tickets Page', () => {
  const WEBHOOK_URL = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/email`;
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-webhook-secret';

  test('should display created tickets in the list', async ({ page, request }) => {
    // 1. Arrange: Create a ticket via the backend webhook API
    const uniqueSubject = `Test Ticket ${Date.now()}`;
    const payload = {
      from: 'test-user@example.com',
      fromName: 'Test User',
      subject: uniqueSubject,
      body: 'This is a test body from the tickets E2E spec.'
    };

    const webhookResponse = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'x-webhook-secret': WEBHOOK_SECRET
      }
    });
    expect(webhookResponse.status()).toBe(201);

    // 2. Act: Login and navigate to the tickets page
    await login(page);
    await page.goto('/tickets');

    // 3. Assert: Verify the page loads and the ticket is visible
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
    
    // The ticket subject should be visible in the table
    await expect(page.getByText(uniqueSubject).first()).toBeVisible();
    await expect(page.getByText('test-user@example.com').first()).toBeVisible();
    await expect(page.getByText('Test User').first()).toBeVisible();
    
    // Status should be New by default
    const statusBadge = page.getByText('New', { exact: true }).first();
    await expect(statusBadge).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/tickets');
    await expect(page).toHaveURL(/.*\/login/);
  });
});

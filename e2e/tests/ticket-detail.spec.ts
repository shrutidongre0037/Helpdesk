import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email = 'admin@test.local', password = 'Test1234!') {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('Ticket Detail Page', () => {
  const WEBHOOK_URL = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/email`;
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-webhook-secret';

  test('should display ticket details, allow updates and replies', async ({ page, request }) => {
    // 1. Arrange: Create a ticket via the backend webhook API
    const uniqueSubject = `Detail Test Ticket ${Date.now()}`;
    const payload = {
      from: 'detail-user@example.com',
      fromName: 'Detail User',
      subject: uniqueSubject,
      body: 'This is a test body for the detail spec.'
    };

    const webhookResponse = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'x-webhook-secret': WEBHOOK_SECRET
      }
    });
    expect(webhookResponse.status()).toBe(201);
    
    // Login and navigate to the tickets page
    await login(page);
    await page.goto('/tickets');
    
    // Find the newly created ticket in the table and click it
    await page.getByText(uniqueSubject).first().click();
    
    // Wait for the URL to change to the ticket detail page
    await page.waitForURL(/\/tickets\/\d+/);

    // 2. Assert: Verify ticket details are visible
    await expect(page.getByRole('heading', { name: uniqueSubject })).toBeVisible();
    await expect(page.getByText('detail-user@example.com')).toBeVisible();
    await expect(page.getByText('This is a test body for the detail spec.')).toBeVisible();

    // 3. Update status
    // Click the combobox that currently says "New"
    const statusSelect = page.getByRole('combobox').first();
    await statusSelect.click();
    // Select "Open"
    await page.getByRole('option', { name: 'Open' }).click();
    
    // Check if the badge in the header has updated to "Open"
    const statusBadge = page.getByText('Open', { exact: true }).first();
    await expect(statusBadge).toBeVisible();

    // 4. Submit a reply
    const replyInput = page.getByPlaceholder('Type your reply here...');
    await replyInput.fill('This is an agent reply.');
    
    await page.getByRole('button', { name: 'Send Reply' }).click();

    // 5. Assert reply is visible in the thread
    await expect(page.getByText('This is an agent reply.')).toBeVisible();
    await expect(page.getByText('Test Admin').first()).toBeVisible(); // Admin user name from seed
  });
});

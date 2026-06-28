import { test, expect } from '@playwright/test';

test.describe('Email Webhooks API', () => {
  const WEBHOOK_URL = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/email`;
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-webhook-secret';

  test('should create a ticket with valid payload', async ({ request }) => {
    const payload = {
      from: 'test-webhook@example.com',
      fromName: 'Jane Doe',
      subject: 'Playwright Test Webhook',
      body: 'This is a test body from Playwright e2e test'
    };

    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'x-webhook-secret': WEBHOOK_SECRET
      }
    });

    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data.message).toBe('Ticket created');
    expect(data.ticketId).toBeDefined();
    expect(typeof data.ticketId).toBe('number');
  });

  test('should fail if missing required fields', async ({ request }) => {
    const payload = {
      from: 'test-webhook@example.com',
      // missing subject and body
    };

    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'x-webhook-secret': WEBHOOK_SECRET
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBe('Invalid payload');
  });
  
  test('should fail if email is invalid', async ({ request }) => {
    const payload = {
      from: 'not-an-email',
      subject: 'Test Subject',
      body: 'Test Body'
    };

    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'x-webhook-secret': WEBHOOK_SECRET
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid payload');
  });

  test('should fail if webhook secret is missing or invalid', async ({ request }) => {
    const payload = {
      from: 'test-webhook@example.com',
      fromName: 'Jane Doe',
      subject: 'Playwright Test Webhook',
      body: 'This is a test body from Playwright e2e test'
    };

    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'x-webhook-secret': 'wrong-secret'
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized: Invalid webhook secret');
  });
});

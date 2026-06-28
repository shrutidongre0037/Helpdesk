import { test, expect } from '@playwright/test';

test('login and check tickets', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  
  await page.fill('input[type="email"]', 'admin@test.local');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  await page.waitForURL('http://localhost:5175/');
  
  await page.goto('http://localhost:5175/tickets');
  await page.waitForTimeout(2000); // Wait for data to load
  
  const bodyText = await page.innerText('body');
  console.log(bodyText);
});

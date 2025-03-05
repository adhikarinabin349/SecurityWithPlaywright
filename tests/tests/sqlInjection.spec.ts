import { test, expect } from '@playwright/test';

test('Test for SQL Injection', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', "' OR '1'='1");
  await page.fill('#password', 'password');
  await page.click('button[type=submit]');

  expect(page.url()).not.toContain('/dashboard'); // Ensure bypass didn't happen
});
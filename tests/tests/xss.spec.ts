import { test, expect } from '@playwright/test';

test('Detect XSS Vulnerability', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', '<script>alert("XSS")</script>');
  await page.fill('#password', 'password');
  await page.click('button[type=submit]');

  expect(await page.locator('body').innerHTML()).not.toContain('<script>alert("XSS")</script>');
});
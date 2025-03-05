import { test, expect } from '@playwright/test';

test('Check Security Headers', async ({ page }) => {
  const response = await page.goto('/');
  if (!response) {
    throw new Error('Failed to load page');
  }
  const headers = response.headers();

  expect(headers['content-security-policy']).toBeDefined();
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['strict-transport-security']).toContain('max-age');
});
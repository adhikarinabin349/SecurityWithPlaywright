import { test, expect } from '@playwright/test';

test('Check Clickjacking Protection', async ({ page }) => {
  const response = await page.goto('/');
  if (!response) {
    throw new Error('Failed to load page');
  }
  const headers = response.headers();

  expect(headers['x-frame-options']).toBe('DENY');
});
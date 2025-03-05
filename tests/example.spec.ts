import { test, expect, request } from '@playwright/test';
import axios from 'axios';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test.describe('Security Tests', () => {
  
  test('Verify Security Headers', async ({ page }) => {
    const response = await page.goto('https://your-large-scale-app.com');
    if (!response) {
      throw new Error('Failed to load page');
    }
    const headers = response.headers();
    
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toContain('max-age');
  });
  
  test('Test for XSS Vulnerability', async ({ page }) => {
    await page.goto('https://your-large-scale-app.com/login');
    await page.fill('#username', '<script>alert("XSS")</script>');
    await page.fill('#password', 'password');
    await page.click('button[type=submit]');
    
    expect(await page.locator('body').innerHTML()).not.toContain('<script>alert("XSS")</script>');
  });
  
  test('Test for SQL Injection', async ({ page }) => {
    await page.goto('https://your-large-scale-app.com/login');
    await page.fill('#username', "' OR '1'='1");
    await page.fill('#password', 'password');
    await page.click('button[type=submit]');
    
    expect(page.url()).not.toContain('/dashboard'); // Ensure bypass didn't happen
  });

  test('Ensure JWT Tokens are Secure', async ({ page }) => {
    await page.goto('https://your-large-scale-app.com/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password');
    await page.click('button[type=submit]');

    const cookies = await page.context().cookies();
    const jwtToken = cookies.find(cookie => cookie.name === 'auth_token');

    expect(jwtToken?.httpOnly).toBeTruthy();
    expect(jwtToken?.secure).toBeTruthy();
  });

  test('Verify Clickjacking Protection', async ({ page }) => {
    const response = await page.goto('https://your-large-scale-app.com');
    if (!response) {
      throw new Error('Failed to load page');
    }
    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
  });
});

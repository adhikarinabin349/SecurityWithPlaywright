import { test, expect } from '@playwright/test';
import axios from 'axios';

test('Ensure JWT Tokens are secure', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'password');
  await page.click('button[type=submit]');

  const cookies = await page.context().cookies();
  const jwtToken = cookies.find(cookie => cookie.name === 'auth_token');

  // Ensure token is HTTP-Only and Secure
  expect(jwtToken?.httpOnly).toBeTruthy();
  expect(jwtToken?.secure).toBeTruthy();

  // Validate token does not expose sensitive info
  const decodedToken = JSON.parse(Buffer.from(jwtToken!.value.split('.')[1], 'base64').toString());
  expect(decodedToken).not.toHaveProperty('password');
});
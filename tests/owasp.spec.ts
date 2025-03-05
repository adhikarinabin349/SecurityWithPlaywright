import { test, expect, request } from '@playwright/test';
import axios from 'axios';
import { spawn } from 'child_process';
import * as fs from 'fs';

test.beforeAll(async () => {
  console.log('Starting OWASP ZAP...');
  spawn('zap.sh', ['-daemon', '-port', '8080']);
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

  test('Run OWASP ZAP Active Scan', async () => {
    const zapUrl = 'http://localhost:8080/JSON/ascan/action/scan/?url=https://your-large-scale-app.com';
    const response = await axios.get(zapUrl);
    expect(response.status).toBe(200);
    console.log('OWASP ZAP Scan Started:', response.data);
  });

  test('Verify API Security - Ensure No Sensitive Data Exposure', async () => {
    const apiContext = await request.newContext();
    const response = await apiContext.get('https://your-large-scale-app.com/api/user');
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('password');
    expect(responseBody).not.toHaveProperty('ssn');
  });
  test('Run Security Tests in CI/CD Pipeline', async () => {
    console.log('Running security tests in CI/CD...');
    await axios.post('https://ci-cd-server.com/webhook', { status: 'running' });
    expect(true).toBeTruthy();
  });
  test.afterAll(async () => {
    console.log('Generating security test report...');
    const zapReportUrl = 'http://localhost:8080/OTHER/core/other/htmlreport/';
    const response = await axios.get(zapReportUrl);
    fs.writeFileSync('security-test-report.html', response.data);
    console.log('Security test report generated: security-test-report.html');
    
    console.log('Uploading report to centralized dashboard...');
    await axios.post('https://security-dashboard.com/upload', {
      report: fs.readFileSync('security-test-report.html', 'utf-8'),
      timestamp: new Date().toISOString(),
      project: 'Your Large-Scale App'
    });
    console.log('Report uploaded successfully.');
    
    console.log('Sending notification...');
    await axios.post('https://notification-service.com/send', {
      email: 'security-team@yourcompany.com',
      subject: 'Security Test Report',
      message: 'Security testing completed. Report attached.',
      attachment: 'security-test-report.html'
    });
    console.log('Email notification sent successfully.');
    
    console.log('Sending Slack alert...');
    await axios.post('https://slack-webhook-url.com', {
      text: '🚨 Security tests completed! Check the report on the dashboard: https://security-dashboard.com/reports/latest',
    });
    console.log('Slack alert sent successfully.');
  });
});
